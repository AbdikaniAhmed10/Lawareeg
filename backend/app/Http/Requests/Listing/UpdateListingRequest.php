<?php

namespace App\Http\Requests\Listing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'asset_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'statistics' => ['sometimes', 'nullable', 'array'],
            'status' => ['sometimes', 'in:draft,pending'],
        ];
    }
}
