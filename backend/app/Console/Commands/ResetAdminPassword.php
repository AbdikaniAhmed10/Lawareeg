<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password
                            {--email= : Admin email (defaults to ADMIN_EMAIL)}
                            {--password= : New password (defaults to ADMIN_PASSWORD)}';

    protected $description = 'Reset the platform admin password from env or options';

    public function handle(): int
    {
        $email = Str::lower(trim((string) ($this->option('email') ?: env('ADMIN_EMAIL'))));
        $password = $this->option('password') ?: env('ADMIN_PASSWORD');

        if ($email === '' || ! $password) {
            $this->error('Provide --email/--password or set ADMIN_EMAIL and ADMIN_PASSWORD.');

            return self::FAILURE;
        }

        $admin = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $admin) {
            $admin = User::create([
                'name' => env('ADMIN_NAME', 'Lawareeg Admin'),
                'email' => $email,
                'password' => $password,
                'role' => 'admin',
                'email_verified_at' => now(),
                'referral_code' => Str::upper(Str::random(8)),
            ]);
            $admin->wallet()->firstOrCreate([]);
            $this->info("Created admin {$email} with the new password.");

            return self::SUCCESS;
        }

        $admin->forceFill([
            'password' => $password,
            'role' => 'admin',
            'email_verified_at' => $admin->email_verified_at ?? now(),
            'is_suspended' => false,
            'suspended_at' => null,
        ])->save();

        $this->info("Password updated for admin {$email}.");

        return self::SUCCESS;
    }
}
