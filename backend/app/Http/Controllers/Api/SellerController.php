<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class SellerController extends Controller
{
    public function top()
    {
        $sellers = User::query()
            ->where('role', '!=', 'admin')
            ->where('is_suspended', false)
            ->withCount(['listings' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->orderByDesc('is_verified_seller')
            ->orderByDesc('rating_avg')
            ->orderByDesc('rating_count')
            ->limit(10)
            ->get();

        return UserResource::collection($sellers);
    }

    /**
     * Public user profile — anyone can view another user's marketplace profile.
     */
    public function show(Request $request, User $user)
    {
        if ($user->role === 'admin' && (! $request->user('sanctum') || $request->user('sanctum')->role !== 'admin')) {
            abort(404);
        }

        if ($user->is_suspended && (! $request->user('sanctum') || $request->user('sanctum')->role !== 'admin')) {
            abort(404);
        }

        $user->loadCount(['listings' => function ($q) {
            $q->where('status', 'approved');
        }]);

        $listings = $user->listings()
            ->with(['category', 'user', 'screenshots'])
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->limit(24)
            ->get();

        return response()->json([
            'data' => new UserResource($user),
            'listings' => ListingResource::collection($listings),
        ]);
    }
}
