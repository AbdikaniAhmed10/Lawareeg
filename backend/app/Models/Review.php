<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'order_id',
        'listing_id',
        'reviewer_id',
        'seller_id',
        'rating',
        'communication',
        'delivery',
        'accuracy',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'communication' => 'integer',
            'delivery' => 'integer',
            'accuracy' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
