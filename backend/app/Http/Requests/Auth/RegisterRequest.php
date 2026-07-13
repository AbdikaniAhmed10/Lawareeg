<?php

namespace App\Http\Requests\Auth;

use App\Support\Countries;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'country' => ['required', 'string', 'max:100', Rule::in(Countries::names())],
            'role' => ['nullable', 'in:buyer,seller'],
        ];
    }

    public function messages(): array
    {
        return [
            'country.required' => 'Please select your country.',
            'country.in' => 'Please choose a valid country from the list.',
        ];
    }
}
