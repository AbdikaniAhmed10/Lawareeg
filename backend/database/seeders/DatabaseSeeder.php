<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Production-safe seed: categories, settings, and admin from env.
     * Demo buyers/sellers/listings only when SEED_DEMO=true.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
        ]);

        if (filter_var(env('SEED_DEMO', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
