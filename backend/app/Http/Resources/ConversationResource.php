<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user('sanctum') ?? $request->user();
        $other = null;
        $isSupport = $this->type === \App\Models\Conversation::TYPE_SUPPORT;
        $isOrder = $this->type === \App\Models\Conversation::TYPE_ORDER;

        if ($user) {
            if ($isSupport && $user->role === 'admin') {
                $other = $this->relationLoaded('buyer') ? $this->buyer : null;
            } elseif ($user->id === $this->buyer_id && $this->relationLoaded('seller')) {
                $other = $this->seller;
            } elseif ($user->id === $this->seller_id && $this->relationLoaded('buyer')) {
                $other = $this->buyer;
            }
        }

        $latest = null;
        if ($this->relationLoaded('latestMessage')) {
            $latest = $this->latestMessage instanceof \Illuminate\Support\Collection
                ? $this->latestMessage->first()
                : $this->latestMessage;
        }

        $orderListingTitle = null;
        if ($isOrder && $this->relationLoaded('order') && $this->order?->relationLoaded('listing')) {
            $orderListingTitle = $this->order->listing?->title;
        }

        return [
            'id' => $this->id,
            'type' => $this->type ?? 'listing',
            'is_support' => $isSupport,
            'is_order' => $isOrder,
            'order_id' => $this->order_id,
            'listing' => new ListingResource($this->whenLoaded('listing')),
            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order?->id,
                    'order_number' => $this->order?->order_number,
                    'status' => $this->order?->status,
                    'listing_title' => $this->order?->listing?->title,
                ];
            }),
            'buyer' => new UserResource($this->whenLoaded('buyer')),
            'seller' => new UserResource($this->whenLoaded('seller')),
            'buyer_id' => $this->buyer_id,
            'seller_id' => $this->seller_id,
            'participant' => $other ? new UserResource($other) : null,
            'other_user' => $other ? new UserResource($other) : null,
            'last_message' => $latest?->body,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'unread_count' => (int) ($this->unread_count ?? 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'subtitle' => $isOrder
                ? ($this->order?->order_number ? 'Order '.$this->order->order_number : ($orderListingTitle ?: 'Order chat'))
                : null,
        ];
    }
}
