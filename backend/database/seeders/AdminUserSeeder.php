<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Sole place that creates / repairs the platform admin (from ADMIN_* env).
 * Admins cannot be suspended or deleted via the API.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Lawareeg Admin');

        if (! $email || ! $password) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');

            return;
        }

        $existing = User::query()->where('email', $email)->first();

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
                'is_suspended' => false,
                'suspended_at' => null,
                'referral_code' => $existing?->referral_code ?: Str::upper(Str::random(8)),
            ]
        );

        $admin->wallet()->firstOrCreate([]);

        // Ensure no other users keep the admin role except this seeded account.
        User::query()
            ->where('role', 'admin')
            ->where('id', '!=', $admin->id)
            ->update(['role' => 'buyer']);

        $this->command?->info("Admin ready: {$email}");
    }
}
