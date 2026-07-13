<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('handover_notes')->nullable()->after('asset_transferred_at');
            $table->json('handover_details')->nullable()->after('handover_notes');
            $table->string('handover_attachment_path', 2048)->nullable()->after('handover_details');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropUnique(['listing_id', 'buyer_id', 'seller_id']);

            $table->foreignId('order_id')
                ->nullable()
                ->after('listing_id')
                ->constrained('orders')
                ->nullOnDelete();

            $table->unique('order_id');
            $table->unique(['listing_id', 'buyer_id', 'seller_id'], 'conversations_listing_parties_unique');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropUnique(['order_id']);
            $table->dropUnique('conversations_listing_parties_unique');
            $table->dropConstrainedForeignId('order_id');
            $table->unique(['listing_id', 'buyer_id', 'seller_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['handover_notes', 'handover_details', 'handover_attachment_path']);
        });
    }
};
