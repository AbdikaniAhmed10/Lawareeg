<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Models\Favorite;
use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        $query = Listing::query()->with(['category', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('ownership_status')) {
            $query->where('ownership_verification_status', $request->input('ownership_status'));
        }

        $listings = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return ListingResource::collection($listings);
    }

    public function approve(Request $request, Listing $listing)
    {
        $listing->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'is_verified_ownership' => $request->boolean('verify_ownership', $listing->is_verified_ownership),
            'ownership_verified_at' => $request->boolean('verify_ownership') ? now() : $listing->ownership_verified_at,
            'ownership_verification_status' => $request->boolean('verify_ownership')
                ? Listing::OWNERSHIP_VERIFIED
                : $listing->ownership_verification_status,
        ]);

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'user'])),
        ]);
    }

    public function reject(Request $request, Listing $listing)
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:2000']]);

        $listing->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('reason'),
        ]);

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'user'])),
        ]);
    }

    public function verifyOwnership(Request $request, Listing $listing)
    {
        $listing->update([
            'is_verified_ownership' => true,
            'ownership_verification_status' => Listing::OWNERSHIP_VERIFIED,
            'ownership_verified_at' => now(),
            'ownership_failure_reason' => null,
        ]);

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'user'])),
            'message' => 'Ownership verified. Seller can now remove the verification code.',
        ]);
    }

    public function rejectOwnership(Request $request, Listing $listing)
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $listing->update([
            'is_verified_ownership' => false,
            'ownership_verification_status' => Listing::OWNERSHIP_FAILED,
            'ownership_verified_at' => null,
            'ownership_failure_reason' => $data['reason'] ?? 'Verification code was not found on the asset.',
        ]);

        return response()->json([
            'data' => new ListingResource($listing->fresh(['category', 'user'])),
            'message' => 'Ownership verification failed.',
        ]);
    }

    public function destroy(Listing $listing)
    {
        $listing->screenshots()->delete();
        Favorite::query()->where('listing_id', $listing->id)->delete();
        $listing->delete();

        return response()->json(['message' => 'Listing deleted.']);
    }
}
