<?php

namespace App\Http\Requests\Listing;

use Illuminate\Foundation\Http\FormRequest;

class StoreListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'asset_url' => ['required', 'url', 'max:2048'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'statistics' => ['nullable', 'array'],
            'status' => ['nullable', 'in:draft,pending'],
            'screenshots' => ['nullable', 'array'],
            'screenshots.*' => ['image', 'max:8192'],
        ];
    }
}
