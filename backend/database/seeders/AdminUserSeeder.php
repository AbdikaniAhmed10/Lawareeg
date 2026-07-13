<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Creates / updates the platform admin from env — no demo buyers/sellers/listings.
 *
 * Required in production .env / .env.docker:
 *   ADMIN_EMAIL=you@example.com
 *   ADMIN_PASSWORD=strong-password
 * Optional:
 *   ADMIN_NAME=Lawareeg Admin
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

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
                'is_suspended' => false,
                'suspended_at' => null,
                'referral_code' => Str::upper(Str::random(8)),
            ]
        );

        $admin->wallet()->firstOrCreate([]);

        $this->command?->info("Admin ready: {$email}");
    }
}
