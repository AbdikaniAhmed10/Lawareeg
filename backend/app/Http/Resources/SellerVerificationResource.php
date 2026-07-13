<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerVerificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_type' => $this->id_type,
            'document_url' => Media::url($this->document_path),
            'status' => $this->status,
            'notes' => $this->notes,
            'user' => new UserResource($this->whenLoaded('user')),
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
