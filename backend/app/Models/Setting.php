<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever("setting:{$key}", function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            $decoded = json_decode($setting->value, true);

            return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
        });
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_string($value) ? $value : json_encode($value)]
        );

        Cache::forget("setting:{$key}");
    }

    public static function commissionPercent(): float
    {
        $value = static::get('commission_percent');
        if ($value === null || $value === '') {
            $value = static::get('commission_rate', 10);
        }

        return (float) $value;
    }

    public static function minWithdrawal(): float
    {
        return (float) static::get('min_withdrawal', 20);
    }

    public static function paymentInstructionsFor(?string $method = null): string
    {
        $bank = (string) static::get('bank_transfer_details', '');
        $mobile = (string) static::get('mobile_money_details', '');
        $legacy = (string) static::get('payment_instructions', '');

        if ($method === 'mobile_money' && $mobile !== '') {
            return $mobile;
        }

        if ($method === 'bank_transfer' && $bank !== '') {
            return $bank;
        }

        if ($bank !== '' || $mobile !== '') {
            return trim("Bank transfer:\n{$bank}\n\nMobile money:\n{$mobile}");
        }

        return $legacy;
    }

    /**
     * Full admin / public settings payload used by the UI.
     */
    public static function platform(): array
    {
        $commission = static::commissionPercent();

        return [
            'commission_percent' => $commission,
            'commission_rate' => $commission, // alias for older clients
            'min_withdrawal' => static::minWithdrawal(),
            'bank_transfer_details' => (string) static::get(
                'bank_transfer_details',
                "Bank: Lawareeg Escrow Bank Ltd.\nAccount name: Lawareeg Marketplace Escrow\nAccount number: 0123456789\nReference: Your order number"
            ),
            'mobile_money_details' => (string) static::get(
                'mobile_money_details',
                "Provider: Lawareeg Pay\nMobile number: +000 700 000 000\nAccount name: Lawareeg Escrow\nReference: Your order number"
            ),
            'support_email' => (string) static::get('support_email', 'support@lawareeg.com'),
            'site_name' => (string) static::get('site_name', 'Lawareeg'),
            'payment_instructions' => static::paymentInstructionsFor(),
        ];
    }
}
