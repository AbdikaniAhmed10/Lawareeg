<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        // Only fill keys that are missing — never wipe admin-edited payment details.
        $defaults = [
            'commission_percent' => 10,
            'commission_rate' => 10,
            'min_withdrawal' => 20,
            'site_name' => 'Lawareeg',
            'support_email' => 'support@lawareeg.com',
            'bank_transfer_details' => "Bank: …\nAccount name: …\nAccount number: …\nReference: Your order number",
            'mobile_money_details' => "Provider: …\nMobile number: …\nAccount name: …\nReference: Your order number",
        ];

        foreach ($defaults as $key => $value) {
            if (Setting::query()->where('key', $key)->exists()) {
                continue;
            }
            Setting::set($key, $value);
        }

        // Refresh combined instructions from whatever is currently stored.
        Setting::set('payment_instructions', Setting::paymentInstructionsFor());
    }
}
