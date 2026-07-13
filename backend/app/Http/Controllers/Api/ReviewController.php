<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function myReviews(Request $request)
    {
        $reviews = Review::query()
            ->with(['listing', 'reviewer'])
            ->where('reviewer_id', $request->user()->id)
            ->orWhere('seller_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 10));

        return ReviewResource::collection($reviews);
    }

    public function store(StoreReviewRequest $request, int $orderId)
    {
        $order = Order::with('listing')->findOrFail($orderId);

        if ($order->buyer_id !== $request->user()->id) {
            throw ValidationException::withMessages([
                'order' => ['You are not authorized to review this order.'],
            ]);
        }

        if ($order->status !== Order::STATUS_COMPLETED) {
            throw ValidationException::withMessages([
                'order' => ['You can only review a completed order.'],
            ]);
        }

        if ($order->review()->exists()) {
            throw ValidationException::withMessages([
                'order' => ['This order has already been reviewed.'],
            ]);
        }

        $data = $request->validated();

        $review = Review::create([
            'order_id' => $order->id,
            'listing_id' => $order->listing_id,
            'reviewer_id' => $order->buyer_id,
            'seller_id' => $order->seller_id,
            'rating' => $data['rating'],
            'communication' => $data['communication'] ?? null,
            'delivery' => $data['delivery'] ?? null,
            'accuracy' => $data['accuracy'] ?? null,
            'comment' => $data['comment'] ?? null,
        ]);

        $seller = $order->seller()->first();
        $newCount = $seller->rating_count + 1;
        $newAvg = (($seller->rating_avg * $seller->rating_count) + $review->rating) / $newCount;

        $seller->update([
            'rating_avg' => round($newAvg, 2),
            'rating_count' => $newCount,
        ]);

        return response()->json([
            'data' => new ReviewResource($review->load(['listing', 'reviewer'])),
        ], 201);
    }
}
