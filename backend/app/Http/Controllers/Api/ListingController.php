<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Http\Resources\ReviewResource;
use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        $query = Listing::query()
            ->with(['category', 'user', 'screenshots'])
            ->where('status', 'approved');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->string('category'))
                    ->orWhere('id', $request->input('category'));
            });
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        if ($request->boolean('verified')) {
            $query->where('is_verified_ownership', true);
        }

        if ($request->filled('q')) {
            $search = $request->string('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        match ($request->input('sort')) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'oldest' => $query->orderBy('created_at', 'asc'),
            'popular' => $query->orderByDesc('views_count'),
            default => $query->orderByDesc('created_at'),
        };

        $listings = $query->paginate((int) $request->input('per_page', 12));

        return ListingResource::collection($listings);
    }

    public function featured()
    {
        $listings = Listing::query()
            ->with(['category', 'user', 'screenshots'])
            ->where('status', 'approved')
            ->where('is_featured', true)
            ->orderByDesc('created_at')
            ->limit(12)
            ->get();

        return ListingResource::collection($listings);
    }

    public function latest()
    {
        $listings = Listing::query()
            ->with(['category', 'user', 'screenshots'])
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->limit(12)
            ->get();

        return ListingResource::collection($listings);
    }

    public function show(Request $request, string $slug)
    {
        // Public route — still resolve Bearer token so owners get is_owner / own drafts.
        $user = $request->user('sanctum');

        $listing = Listing::query()
            ->with(['category', 'user', 'screenshots'])
            ->where('slug', $slug)
            ->where(function ($q) use ($user) {
                $q->where('status', 'approved');

                if ($user) {
                    $q->orWhere('user_id', $user->id);
                }
            })
            ->firstOrFail();

        $listing->increment('views_count');

        if ($user) {
            $listing->is_favorited = $listing->favoritedBy()->where('user_id', $user->id)->exists();
        }

        return response()->json([
            'data' => new ListingResource($listing),
        ]);
    }

    public function reviews(string $idOrSlug)
    {
        $listing = ctype_digit($idOrSlug)
            ? Listing::findOrFail($idOrSlug)
            : Listing::where('slug', $idOrSlug)->firstOrFail();

        $reviews = $listing->reviews()
            ->with('reviewer')
            ->orderByDesc('created_at')
            ->paginate(10);

        return ReviewResource::collection($reviews);
    }
}
