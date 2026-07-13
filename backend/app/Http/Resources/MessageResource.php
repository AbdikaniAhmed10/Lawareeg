<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'body' => $this->body,
            'attachment_url' => $this->attachment_path ? \App\Support\Media::url($this->attachment_path) : null,
            'attachment_type' => $this->attachment_type,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'sender_id' => $this->sender_id,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
