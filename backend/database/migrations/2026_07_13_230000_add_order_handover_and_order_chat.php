<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Columns may already exist from a previous partial run that failed later.
        if (! Schema::hasColumn('orders', 'handover_notes')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->text('handover_notes')->nullable()->after('asset_transferred_at');
            });
        }

        if (! Schema::hasColumn('orders', 'handover_details')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->json('handover_details')->nullable()->after('handover_notes');
            });
        }

        if (! Schema::hasColumn('orders', 'handover_attachment_path')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('handover_attachment_path', 2048)->nullable()->after('handover_details');
            });
        }

        if (! Schema::hasColumn('conversations', 'order_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                // listing_id stays null for order chats so the existing listing unique is safe.
                $table->foreignId('order_id')
                    ->nullable()
                    ->after('listing_id')
                    ->constrained('orders')
                    ->nullOnDelete();

                $table->unique('order_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('conversations', 'order_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropUnique(['order_id']);
                $table->dropConstrainedForeignId('order_id');
            });
        }

        foreach (['handover_attachment_path', 'handover_details', 'handover_notes'] as $column) {
            if (Schema::hasColumn('orders', $column)) {
                Schema::table('orders', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
