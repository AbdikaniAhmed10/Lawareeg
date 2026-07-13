<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Listing\StoreListingRequest;
use App\Http\Requests\Listing\UpdateListingRequest;
use App\Http\Resources\ListingResource;
use App\Models\Listing;
use App\Models\ListingScreenshot;
use App\Support\OwnershipInstructions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MyListingController extends Controller
{
    public function index(Request $request)
    {
        $listings = $request->user()->listings()
            ->with(['category', 'screenshots'])
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 12));

        return ListingResource::collection($listings);
    }

    public function show(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);

        return response()->json([
            'data' => new ListingResource($listing->load(['category', 'screenshots', 'user'])),
        ]);
    }

    public function store(StoreListingRequest $request)
    {
        if ($request->user()->role === 'admin') {
            throw ValidationException::withMessages([
                'title' => ['Admin accounts cannot create marketplace listings. Use a seller account.'],
            ]);
        }

        $data = $request->validated();
        $status = $data['status'] ?? 'pending';

        $listing = $request->user()->listings()->create([
            'category_id' => $data['category_id'],
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['title']),
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'asset_url' => $data['asset_url'] ?? null,
            'avatar_url' => $data['avatar_url'] ?? null,
            'statistics' => $data['statistics'] ?? [],
            'status' => $status,
            'ownership_verification_code' => OwnershipInstructions::generateCode(),
            'ownership_verification_status' => Listing::OWNERSHIP_AWAITING,
        ]);

        // Persist remote profile/avatar image into local storage when possible.
        if (! empty($data['avatar_url'])) {
            $stored = app(\App\Services\AssetPreviewService::class)
                ->storeRemoteAvatar($data['avatar_url'], $listing->id);

            if ($stored) {
                $listing->update(['avatar_url' => \Illuminate\Support\Facades\Storage::url($stored)]);
                \App\Models\ListingScreenshot::create([
                    'listing_id' => $listing->id,
                    'path' => $stored,
                    'sort_order' => 0,
                ]);
            }
        }

        if ($request->hasFile('screenshots')) {
            foreach ($request->file('screenshots') as $index => $file) {
                $path = $file->store('listings/'.$listing->id, 'public');
                ListingScreenshot::create([
                    'listing_id' => $listing->id,
                    'path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        return response()->json([
            'data' => new ListingResource($listing->load(['category', 'screenshots'])),
        ], 201);
    }

    public function update(UpdateListingRequest $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);

        $data = $request->validated();

        if (isset($data['title']) && $data['title'] !== $listing->title) {
            $data['slug'] = $this->uniqueSlug($data['title'], $listing->id);
        }

        if (in_array($listing->status, ['approved', 'sold']) && ! isset($data['status'])) {
            $data['status'] = 'pending';
        }

        $previousAvatar = $listing->avatar_url;
        $listing->update($data);

        if (! empty($data['avatar_url']) && $data['avatar_url'] !== $previousAvatar) {
            $stored = app(\App\Services\AssetPreviewService::class)
                ->storeRemoteAvatar($data['avatar_url'], $listing->id);

            if ($stored) {
                $listing->update(['avatar_url' => Storage::url($stored)]);
            }
        }

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'screenshots'])),
        ]);
    }

    public function markOwnershipCodePlaced(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);

        if ($listing->is_verified_ownership) {
            throw ValidationException::withMessages([
                'listing' => ['Ownership is already verified for this listing.'],
            ]);
        }

        $listing->update([
            'ownership_verification_status' => Listing::OWNERSHIP_PENDING_CHECK,
            'ownership_code_placed_at' => now(),
            'ownership_failure_reason' => null,
        ]);

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'screenshots'])),
            'message' => 'Thanks. Admin will check for the verification code.',
        ]);
    }

    public function destroy(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);

        $listing->delete();

        return response()->json(['message' => 'Listing deleted successfully.']);
    }

    public function uploadScreenshots(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);

        $request->validate([
            'screenshots' => ['required', 'array'],
            'screenshots.*' => ['image', 'max:8192'],
        ]);

        $nextOrder = (int) $listing->screenshots()->max('sort_order') + 1;

        foreach ($request->file('screenshots') as $index => $file) {
            $path = $file->store('listings/'.$listing->id, 'public');
            ListingScreenshot::create([
                'listing_id' => $listing->id,
                'path' => $path,
                'sort_order' => $nextOrder + $index,
            ]);
        }

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'screenshots'])),
        ], 201);
    }

    private function authorizeOwner(Request $request, Listing $listing): void
    {
        if ($listing->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages([
                'listing' => ['You are not authorized to modify this listing.'],
            ]);
        }
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 1;

        while (Listing::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
