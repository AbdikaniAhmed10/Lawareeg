<?php

namespace App\Services;

use App\Models\Listing;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function __construct(
        private WalletService $walletService,
        private NotificationService $notificationService,
    ) {}

    public function createOrder(User $buyer, Listing $listing): Order
    {
        if ($listing->status !== 'approved') {
            throw new RuntimeException('This listing is not available for purchase.');
        }

        if ($listing->user_id === $buyer->id) {
            throw new RuntimeException('You cannot purchase your own listing.');
        }

        $commissionRate = Setting::commissionPercent();
        $commissionAmount = round(((float) $listing->price) * $commissionRate / 100, 2);
        $sellerAmount = round(((float) $listing->price) - $commissionAmount, 2);

        return DB::transaction(function () use ($buyer, $listing, $commissionRate, $commissionAmount, $sellerAmount) {
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'listing_id' => $listing->id,
                'buyer_id' => $buyer->id,
                'seller_id' => $listing->user_id,
                'price' => $listing->price,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'seller_amount' => $sellerAmount,
                'status' => Order::STATUS_PENDING_PAYMENT,
                'payment_method_instructions' => Setting::paymentInstructionsFor(),
            ]);

            $listing->update(['status' => 'sold', 'sold_at' => now()]);

            $this->addEvent($order, $buyer, 'order_created', 'Order created. Awaiting payment.');

            $this->notificationService->send(
                $listing->user->fresh(),
                'order_created',
                'New order received',
                "You have a new order ({$order->order_number}) for \"{$listing->title}\". Waiting for buyer payment.",
                ['order_id' => $order->id]
            );

            return $order;
        });
    }

    public function submitPaymentProof(Order $order, User $actor, string $path, ?string $note = null): Order
    {
        $this->assertStatus($order, [Order::STATUS_PENDING_PAYMENT, Order::STATUS_PAYMENT_UNDER_REVIEW]);

        $order->update([
            'payment_proof_path' => $path,
            'payment_proof_note' => $note,
            'status' => Order::STATUS_PAYMENT_UNDER_REVIEW,
        ]);

        $this->addEvent($order, $actor, 'payment_proof_submitted', 'Buyer uploaded payment receipt.');

        User::query()->where('role', 'admin')->where('is_suspended', false)->get()
            ->each(function (User $admin) use ($order) {
                $this->notificationService->send(
                    $admin,
                    'payment_under_review',
                    'Payment proof uploaded',
                    "Order {$order->order_number} has a payment receipt waiting for review.",
                    ['order_id' => $order->id]
                );
            });

        return $order;
    }

    public function confirmPayment(Order $order, User $admin): Order
    {
        $this->assertStatus($order, [Order::STATUS_PAYMENT_UNDER_REVIEW, Order::STATUS_PENDING_PAYMENT]);

        $order->update([
            'status' => Order::STATUS_PAYMENT_CONFIRMED,
            'payment_confirmed_at' => now(),
            'payment_confirmed_by' => $admin->id,
        ]);

        $this->addEvent($order, $admin, 'payment_confirmed', 'Admin confirmed payment receipt. Seller notified to transfer the asset.');

        $order->loadMissing('seller');
        $this->notificationService->send(
            $order->seller,
            'payment_confirmed',
            'Payment confirmed',
            "Payment for order {$order->order_number} has been confirmed. Please transfer the asset to the buyer now.",
            ['order_id' => $order->id]
        );

        return $order;
    }

    public function markTransferring(Order $order, User $seller): Order
    {
        $this->assertStatus($order, [Order::STATUS_PAYMENT_CONFIRMED]);

        $order->update([
            'status' => Order::STATUS_SELLER_TRANSFERRING,
            'asset_transferred_at' => now(),
        ]);

        $this->addEvent($order, $seller, 'seller_transferring', 'Seller marked the asset as being transferred.');

        $order->loadMissing('buyer');
        $this->notificationService->send(
            $order->buyer,
            'seller_transferring',
            'Asset transfer in progress',
            "The seller has started transferring the asset for order {$order->order_number}. Please confirm once you receive it.",
            ['order_id' => $order->id]
        );

        $order->update(['status' => Order::STATUS_BUYER_CONFIRMATION]);

        return $order;
    }

    public function confirmReceipt(Order $order, User $buyer): Order
    {
        $this->assertStatus($order, [Order::STATUS_BUYER_CONFIRMATION, Order::STATUS_SELLER_TRANSFERRING]);

        $order->update([
            'buyer_confirmed_at' => now(),
        ]);

        $this->addEvent($order, $buyer, 'buyer_confirmed_receipt', 'Buyer confirmed receipt of the asset.');

        return $this->completeOrder($order, $buyer);
    }

    public function completeOrder(Order $order, ?User $actor = null): Order
    {
        return DB::transaction(function () use ($order, $actor) {
            $order->refresh();

            if ($order->status === Order::STATUS_COMPLETED) {
                return $order;
            }

            $order->update([
                'status' => Order::STATUS_COMPLETED,
                'completed_at' => now(),
            ]);

            $order->loadMissing('seller');

            $this->walletService->credit(
                $order->seller,
                (float) $order->seller_amount,
                'sale',
                "Sale proceeds for order {$order->order_number}",
                $order
            );

            $this->addEvent($order, $actor, 'order_completed', 'Order completed. Funds released to seller wallet.');

            $this->notificationService->send(
                $order->seller,
                'order_completed',
                'Funds released',
                "Order {$order->order_number} is complete. \${$order->seller_amount} has been credited to your wallet.",
                ['order_id' => $order->id]
            );

            return $order;
        });
    }

    public function cancelOrder(Order $order, User $actor, ?string $reason = null): Order
    {
        if (in_array($order->status, [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED], true)) {
            throw new RuntimeException('This order cannot be cancelled.');
        }

        return DB::transaction(function () use ($order, $actor, $reason) {
            $order->update([
                'status' => Order::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancel_reason' => $reason,
            ]);

            $order->loadMissing('listing');
            if ($order->listing && $order->listing->status === 'sold') {
                $order->listing->update(['status' => 'approved', 'sold_at' => null]);
            }

            $this->addEvent($order, $actor, 'order_cancelled', $reason ?? 'Order cancelled.');

            return $order;
        });
    }

    public function openDispute(Order $order, User $actor, string $reason, ?string $evidence = null): Order
    {
        if (in_array($order->status, [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED, Order::STATUS_DISPUTED], true)) {
            throw new RuntimeException('A dispute cannot be opened for this order.');
        }

        $order->update([
            'status' => Order::STATUS_DISPUTED,
            'dispute_reason' => $reason,
            'dispute_opened_at' => now(),
        ]);

        $this->addEvent($order, $actor, 'dispute_opened', $reason, $evidence ? ['evidence' => $evidence] : []);

        return $order;
    }

    public function resolveDispute(Order $order, User $admin, string $resolution, string $outcome = 'completed', ?string $note = null): Order
    {
        $this->assertStatus($order, [Order::STATUS_DISPUTED]);

        $order->update([
            'dispute_resolved_at' => now(),
            'dispute_resolution' => $resolution,
            'admin_notes' => $note,
        ]);

        $this->addEvent($order, $admin, 'dispute_resolved', $resolution);

        if ($outcome === 'completed') {
            return $this->completeOrder($order, $admin);
        }

        if ($outcome === 'refunded') {
            return $this->refund($order, $admin);
        }

        return $this->cancelOrder($order, $admin, $resolution);
    }

    public function refund(Order $order, User $admin): Order
    {
        return DB::transaction(function () use ($order, $admin) {
            $order->update([
                'status' => Order::STATUS_CANCELLED,
                'refunded_at' => now(),
                'cancelled_at' => now(),
            ]);

            $order->loadMissing('listing');
            if ($order->listing && $order->listing->status === 'sold') {
                $order->listing->update(['status' => 'approved', 'sold_at' => null]);
            }

            $this->addEvent($order, $admin, 'order_refunded', 'Order refunded by admin.');

            return $order;
        });
    }

    public function addEvent(Order $order, ?User $actor, string $event, ?string $message = null, array $meta = []): void
    {
        $order->events()->create([
            'actor_id' => $actor?->id,
            'event' => $event,
            'message' => $message,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }

    private function assertStatus(Order $order, array $allowed): void
    {
        if (! in_array($order->status, $allowed, true)) {
            throw new RuntimeException("This action is not allowed for an order with status \"{$order->status}\".");
        }
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'LWG-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
