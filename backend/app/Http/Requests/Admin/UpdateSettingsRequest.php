<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'commission_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'min_withdrawal' => ['sometimes', 'numeric', 'min:0'],
            'bank_transfer_details' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'mobile_money_details' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'site_name' => ['sometimes', 'string', 'max:255'],
            'payment_instructions' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
