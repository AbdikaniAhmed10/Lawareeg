<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Sole place that creates / repairs the platform admin (from ADMIN_* env).
 * Admins cannot be suspended or deleted via the API.
 *
 * Password is set from ADMIN_PASSWORD only when the admin is first created,
 * or when ADMIN_FORCE_PASSWORD=true (use this to reset a forgotten admin password).
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = Str::lower(trim((string) env('ADMIN_EMAIL')));
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Lawareeg Admin');
        $forcePassword = filter_var(env('ADMIN_FORCE_PASSWORD', false), FILTER_VALIDATE_BOOLEAN);

        if ($email === '' || ! $password) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');

            return;
        }

        $existing = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        $payload = [
            'name' => $name,
            'role' => 'admin',
            'email_verified_at' => now(),
            'is_suspended' => false,
            'suspended_at' => null,
            'referral_code' => $existing?->referral_code ?: Str::upper(Str::random(8)),
        ];

        // User model `hashed` cast — pass plain password only.
        if (! $existing || $forcePassword) {
            $payload['password'] = $password;
        }

        $admin = User::updateOrCreate(
            ['email' => $existing?->email ?? $email],
            $payload
        );

        $admin->wallet()->firstOrCreate([]);

        // Ensure no other users keep the admin role except this seeded account.
        User::query()
            ->where('role', 'admin')
            ->where('id', '!=', $admin->id)
            ->update(['role' => 'buyer']);

        if ($forcePassword) {
            $this->command?->info("Admin password reset from ADMIN_PASSWORD for: {$email}");
        } else {
            $this->command?->info("Admin ready: {$email}".($existing ? ' (password unchanged)' : ' (password set from ADMIN_PASSWORD)'));
        }
    }
}
