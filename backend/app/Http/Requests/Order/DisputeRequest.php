<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class DisputeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:2000'],
            'evidence' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
