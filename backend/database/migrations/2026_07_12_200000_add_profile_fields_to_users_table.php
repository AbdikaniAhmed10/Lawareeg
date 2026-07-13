<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['buyer', 'seller', 'admin'])->default('buyer')->after('email');
            $table->string('phone')->nullable()->after('role');
            $table->text('bio')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('bio');
            $table->string('country')->nullable()->after('avatar');
            $table->boolean('is_verified_seller')->default(false)->after('country');
            $table->enum('seller_verification_status', ['none', 'pending', 'approved', 'rejected'])->default('none')->after('is_verified_seller');
            $table->text('seller_verification_notes')->nullable()->after('seller_verification_status');
            $table->decimal('rating_avg', 3, 2)->default(0)->after('seller_verification_notes');
            $table->unsignedInteger('rating_count')->default(0)->after('rating_avg');
            $table->boolean('is_suspended')->default(false)->after('rating_count');
            $table->timestamp('suspended_at')->nullable()->after('is_suspended');
            $table->string('referral_code')->nullable()->unique()->after('suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'phone', 'bio', 'avatar', 'country',
                'is_verified_seller', 'seller_verification_status', 'seller_verification_notes',
                'rating_avg', 'rating_count', 'is_suspended', 'suspended_at', 'referral_code',
            ]);
        });
    }
};
