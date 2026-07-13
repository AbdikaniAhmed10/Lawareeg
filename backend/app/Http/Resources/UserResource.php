<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user('sanctum') ?? $request->user();
        $isSelfOrAdmin = $viewer && ($viewer->id === $this->id || $viewer->role === 'admin');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->when($isSelfOrAdmin, $this->email),
            'email_verified_at' => $this->when($isSelfOrAdmin, $this->email_verified_at?->toIso8601String()),
            'email_verified' => (bool) $this->email_verified_at,
            'role' => $this->role,
            'phone' => $this->when($isSelfOrAdmin, $this->phone),
            'bio' => $this->bio,
            'avatar' => Media::url($this->avatar),
            'country' => $this->country,
            'is_verified_seller' => (bool) $this->is_verified_seller,
            'verified' => (bool) $this->is_verified_seller,
            'seller_verification_status' => $this->seller_verification_status,
            'rating_avg' => (float) $this->rating_avg,
            'rating' => (float) $this->rating_avg,
            'rating_count' => (int) $this->rating_count,
            'listings_count' => (int) ($this->listings_count ?? 0),
            'is_suspended' => (bool) $this->is_suspended,
            'status' => $this->is_suspended ? 'suspended' : 'active',
            'referral_code' => $this->when($isSelfOrAdmin, $this->referral_code),
            'member_since' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
