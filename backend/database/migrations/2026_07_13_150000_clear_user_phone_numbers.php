<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Clear stored phone numbers so they cannot be used for off-platform contact.
        DB::table('users')->update(['phone' => null]);
    }

    public function down(): void
    {
        // Irreversible data wipe.
    }
};
