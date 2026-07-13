<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->string('ownership_verification_status')->default('awaiting_placement')->after('ownership_verification_code');
            $table->timestamp('ownership_code_placed_at')->nullable()->after('ownership_verification_status');
            $table->text('ownership_failure_reason')->nullable()->after('ownership_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn([
                'ownership_verification_status',
                'ownership_code_placed_at',
                'ownership_failure_reason',
            ]);
        });
    }
};
