<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;

class SettingController extends Controller
{
    /**
     * Public escrow / platform settings used on checkout.
     */
    public function show()
    {
        $platform = Setting::platform();

        return response()->json([
            'data' => [
                'commission_percent' => $platform['commission_percent'],
                'bank_transfer_details' => $platform['bank_transfer_details'],
                'mobile_money_details' => $platform['mobile_money_details'],
                'support_email' => $platform['support_email'],
                'site_name' => $platform['site_name'],
            ],
        ]);
    }
}
