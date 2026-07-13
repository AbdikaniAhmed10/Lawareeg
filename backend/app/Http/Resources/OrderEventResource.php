<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event,
            'message' => $this->message,
            'meta' => $this->meta ?: [],
            'actor' => new UserResource($this->whenLoaded('actor')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
