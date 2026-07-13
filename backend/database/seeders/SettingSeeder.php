<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('commission_percent', 10);
        Setting::set('commission_rate', 10);
        Setting::set('min_withdrawal', 20);
        Setting::set('site_name', 'Lawareeg');
        Setting::set('support_email', 'support@lawareeg.com');
        Setting::set(
            'bank_transfer_details',
            "Bank: Lawareeg Escrow Bank Ltd.\nAccount name: Lawareeg Marketplace Escrow\nAccount number: 0123456789\nReference: Your order number"
        );
        Setting::set(
            'mobile_money_details',
            "Provider: Lawareeg Pay\nMobile number: +000 700 000 000\nAccount name: Lawareeg Escrow\nReference: Your order number"
        );
        Setting::set('payment_instructions', Setting::paymentInstructionsFor());
    }
}
