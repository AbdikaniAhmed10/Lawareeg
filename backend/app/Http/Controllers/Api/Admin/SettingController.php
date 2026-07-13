<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;

class SettingController extends Controller
{
    public function show()
    {
        return response()->json([
            'data' => Setting::platform(),
        ]);
    }

    public function update(UpdateSettingsRequest $request)
    {
        $data = $request->validated();

        // Prefer commission_percent; keep commission_rate in sync for OrderService aliases.
        if (array_key_exists('commission_percent', $data)) {
            $rate = (float) $data['commission_percent'];
            Setting::set('commission_percent', $rate);
            Setting::set('commission_rate', $rate);
            unset($data['commission_percent'], $data['commission_rate']);
        } elseif (array_key_exists('commission_rate', $data)) {
            $rate = (float) $data['commission_rate'];
            Setting::set('commission_percent', $rate);
            Setting::set('commission_rate', $rate);
            unset($data['commission_rate']);
        }

        foreach ($data as $key => $value) {
            Setting::set($key, $value);
        }

        // Keep combined payment_instructions synced for older order records / fallbacks.
        if (array_key_exists('bank_transfer_details', $request->validated())
            || array_key_exists('mobile_money_details', $request->validated())) {
            Setting::set('payment_instructions', Setting::paymentInstructionsFor());
        }

        return response()->json([
            'data' => Setting::platform(),
            'message' => 'Settings saved.',
        ]);
    }
}
