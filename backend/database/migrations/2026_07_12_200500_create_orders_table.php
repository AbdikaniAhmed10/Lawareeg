<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->decimal('commission_rate', 5, 2)->default(10);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->decimal('seller_amount', 12, 2)->default(0);
            $table->enum('status', [
                'pending_payment',
                'payment_under_review',
                'payment_confirmed',
                'seller_transferring',
                'buyer_confirmation',
                'completed',
                'cancelled',
                'disputed',
            ])->default('pending_payment');
            $table->text('payment_method_instructions')->nullable();
            $table->string('payment_proof_path')->nullable();
            $table->text('payment_proof_note')->nullable();
            $table->timestamp('payment_confirmed_at')->nullable();
            $table->foreignId('payment_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('asset_transferred_at')->nullable();
            $table->timestamp('buyer_confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->text('dispute_reason')->nullable();
            $table->timestamp('dispute_opened_at')->nullable();
            $table->timestamp('dispute_resolved_at')->nullable();
            $table->text('dispute_resolution')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['buyer_id', 'status']);
            $table->index(['seller_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
