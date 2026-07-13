<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user('sanctum') ?? $request->user();

        $stats = $this->statistics ?: [];
        $cover = Media::url($this->avatar_url);
        if (! $cover && $this->relationLoaded('screenshots') && $this->screenshots->isNotEmpty()) {
            $first = $this->screenshots->first();
            $cover = Media::url($first->path);
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'status' => $this->status,
            'is_featured' => (bool) $this->is_featured,
            'is_verified_ownership' => (bool) $this->is_verified_ownership,
            'verified' => (bool) $this->is_verified_ownership,
            'views' => (int) $this->views_count,
            'monthly_revenue' => (float) ($stats['monthly_revenue'] ?? $stats['revenue'] ?? 0),
            'cover_image' => $cover,
            'avatar_url' => Media::url($this->avatar_url),
            'rating' => $this->whenLoaded('user', fn () => (float) ($this->user->rating_avg ?? 0)),
            'reviews_count' => $this->whenLoaded('user', fn () => (int) ($this->user->rating_count ?? 0)),
            'category_name' => $this->whenLoaded('category', fn () => $this->category?->name),
            'ownership_verification_code' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                $this->ownership_verification_code
            ),
            'ownership_verification_status' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                $this->ownership_verification_status
            ),
            'ownership_instructions' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                fn () => \App\Support\OwnershipInstructions::forCategory($this->relationLoaded('category') ? $this->category : $this->category()->first())
            ),
            'ownership_code_placed_at' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                $this->ownership_code_placed_at?->toIso8601String()
            ),
            'ownership_failure_reason' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                $this->ownership_failure_reason
            ),
            'ownership_verified_at' => $this->ownership_verified_at?->toIso8601String(),
            'statistics' => $stats,
            'asset_url' => $this->when(
                $user && ($user->id === $this->user_id || $user->role === 'admin'),
                $this->asset_url
            ),
            'public_asset_url' => $this->asset_url,
            'user_id' => $this->user_id,
            'is_owner' => (bool) ($user && $user->id === $this->user_id),
            'views_count' => (int) $this->views_count,
            'favorites_count' => (int) $this->favorites_count,
            'is_favorited' => (bool) ($this->is_favorited ?? false),
            'rejection_reason' => $this->rejection_reason,
            'sold_at' => $this->sold_at?->toIso8601String(),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'seller' => new UserResource($this->whenLoaded('user')),
            'screenshots' => ListingScreenshotResource::collection($this->whenLoaded('screenshots')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
