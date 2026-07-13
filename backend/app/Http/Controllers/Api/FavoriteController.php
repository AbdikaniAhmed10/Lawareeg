<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Models\Listing;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $listingIds = $request->user()->favorites()->pluck('listing_id');

        $listings = Listing::query()
            ->with(['category', 'user'])
            ->whereIn('id', $listingIds)
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 12));

        return ListingResource::collection($listings);
    }

    public function store(Request $request, int $listingId)
    {
        $listing = Listing::findOrFail($listingId);

        $favorite = $request->user()->favorites()->firstOrCreate(['listing_id' => $listing->id]);

        if ($favorite->wasRecentlyCreated) {
            $listing->increment('favorites_count');
        }

        return response()->json(['message' => 'Listing added to favorites.'], 201);
    }

    public function destroy(Request $request, int $listingId)
    {
        $deleted = $request->user()->favorites()->where('listing_id', $listingId)->delete();

        if ($deleted) {
            Listing::where('id', $listingId)->decrement('favorites_count');
        }

        return response()->json(['message' => 'Listing removed from favorites.']);
    }
}
