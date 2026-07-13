<?php

namespace App\Http\Requests\Auth;

use App\Support\Countries;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()?->id)],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'country' => ['sometimes', 'required', 'string', 'max:100', Rule::in(Countries::names())],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:4096'],
        ];
    }
}
