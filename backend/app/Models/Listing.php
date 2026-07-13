<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    use HasFactory;

    public const OWNERSHIP_AWAITING = 'awaiting_placement';

    public const OWNERSHIP_PENDING_CHECK = 'pending_check';

    public const OWNERSHIP_VERIFIED = 'verified';

    public const OWNERSHIP_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'slug',
        'description',
        'price',
        'status',
        'is_featured',
        'is_verified_ownership',
        'ownership_verification_code',
        'ownership_verification_status',
        'ownership_code_placed_at',
        'ownership_verified_at',
        'ownership_failure_reason',
        'statistics',
        'asset_url',
        'avatar_url',
        'views_count',
        'favorites_count',
        'rejection_reason',
        'sold_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_featured' => 'boolean',
            'is_verified_ownership' => 'boolean',
            'ownership_verified_at' => 'datetime',
            'ownership_code_placed_at' => 'datetime',
            'statistics' => 'array',
            'views_count' => 'integer',
            'favorites_count' => 'integer',
            'sold_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function screenshots(): HasMany
    {
        return $this->hasMany(ListingScreenshot::class)->orderBy('sort_order');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function favoritedBy(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
