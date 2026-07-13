<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'price' => (float) $this->price,
            'amount' => (float) $this->price, // alias used by frontend UI
            'commission_rate' => (float) $this->commission_rate,
            'commission_amount' => (float) $this->commission_amount,
            'seller_amount' => (float) $this->seller_amount,
            'payment_method_instructions' => $this->payment_method_instructions,
            'payment_proof_url' => $this->payment_proof_path
                ? Media::signedRoute('secure.payment-proof', ['order' => $this->id])
                : null,
            'payment_proof_note' => $this->payment_proof_note,
            'payment_confirmed_at' => $this->payment_confirmed_at?->toIso8601String(),
            'asset_transferred_at' => $this->asset_transferred_at?->toIso8601String(),
            'buyer_confirmed_at' => $this->buyer_confirmed_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->cancel_reason,
            'dispute_reason' => $this->dispute_reason,
            'dispute_opened_at' => $this->dispute_opened_at?->toIso8601String(),
            'dispute_resolved_at' => $this->dispute_resolved_at?->toIso8601String(),
            'dispute_resolution' => $this->dispute_resolution,
            'refunded_at' => $this->refunded_at?->toIso8601String(),
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'buyer' => new UserResource($this->whenLoaded('buyer')),
            'seller' => new UserResource($this->whenLoaded('seller')),
            'buyer_id' => $this->buyer_id,
            'seller_id' => $this->seller_id,
            'has_review' => (bool) $this->whenLoaded('review', fn () => (bool) $this->review, false),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
