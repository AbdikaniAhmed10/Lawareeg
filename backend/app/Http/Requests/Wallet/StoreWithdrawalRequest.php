<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class StoreWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', 'in:bank_transfer,mobile_money,other'],
            'account_details' => ['required'],
        ];
    }
}
