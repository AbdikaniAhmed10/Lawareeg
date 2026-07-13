<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'listing_id' => $this->listing_id,
            'rating' => (int) $this->rating,
            'communication' => $this->communication,
            'delivery' => $this->delivery,
            'accuracy' => $this->accuracy,
            'comment' => $this->comment,
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
