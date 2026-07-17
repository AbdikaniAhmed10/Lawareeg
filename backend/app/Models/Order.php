<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUS_PENDING_PAYMENT = 'pending_payment';

    public const STATUS_PAYMENT_UNDER_REVIEW = 'payment_under_review';

    public const STATUS_PAYMENT_CONFIRMED = 'payment_confirmed';

    public const STATUS_SELLER_TRANSFERRING = 'seller_transferring';

    public const STATUS_BUYER_CONFIRMATION = 'buyer_confirmation';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_DISPUTED = 'disputed';

    protected $fillable = [
        'order_number',
        'listing_id',
        'buyer_id',
        'seller_id',
        'price',
        'commission_rate',
        'commission_amount',
        'seller_amount',
        'status',
        'payment_method_instructions',
        'payment_proof_path',
        'payment_proof_note',
        'payment_confirmed_at',
        'payment_confirmed_by',
        'asset_transferred_at',
        'handover_notes',
        'handover_details',
        'handover_attachment_path',
        'handover_purged_at',
        'buyer_confirmed_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'dispute_reason',
        'dispute_opened_at',
        'dispute_resolved_at',
        'dispute_resolution',
        'refunded_at',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'seller_amount' => 'decimal:2',
            'payment_confirmed_at' => 'datetime',
            'asset_transferred_at' => 'datetime',
            // Encrypt at rest — decrypt only when Eloquent reads (buyer/seller/admin UI).
            'handover_notes' => 'encrypted',
            'handover_details' => 'encrypted:array',
            'handover_purged_at' => 'datetime',
            'buyer_confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'dispute_opened_at' => 'datetime',
            'dispute_resolved_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function paymentConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_confirmed_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(OrderEvent::class)->orderBy('created_at');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }

    public function canViewHandover(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return (int) $user->id === (int) $this->buyer_id
            || (int) $user->id === (int) $this->seller_id;
    }

    public function hasHandoverSecrets(): bool
    {
        return filled($this->handover_notes)
            || filled($this->handover_details)
            || filled($this->handover_attachment_path);
    }
}
