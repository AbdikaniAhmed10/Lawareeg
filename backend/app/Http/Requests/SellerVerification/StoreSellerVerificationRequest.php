<?php

namespace App\Http\Requests\SellerVerification;

use Illuminate\Foundation\Http\FormRequest;

class StoreSellerVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_type' => ['required', 'string', 'max:100'],
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:8192'],
        ];
    }
}
