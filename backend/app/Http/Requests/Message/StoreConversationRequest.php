<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'listing_id' => ['nullable', 'exists:listings,id'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
