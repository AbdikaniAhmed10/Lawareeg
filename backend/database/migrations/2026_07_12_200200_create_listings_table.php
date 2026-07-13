<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'sold'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_verified_ownership')->default(false);
            $table->string('ownership_verification_code')->nullable();
            $table->timestamp('ownership_verified_at')->nullable();
            $table->json('statistics')->nullable();
            $table->string('asset_url')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('favorites_count')->default(0);
            $table->text('rejection_reason')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
