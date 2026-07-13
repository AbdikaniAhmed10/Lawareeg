<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class MarkTransferringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:5000'],
            'details' => ['nullable', 'array'],
            'details.username' => ['nullable', 'string', 'max:255'],
            'details.email' => ['nullable', 'string', 'max:255'],
            'details.password' => ['nullable', 'string', 'max:255'],
            'details.recovery_email' => ['nullable', 'string', 'max:255'],
            'details.recovery_phone' => ['nullable', 'string', 'max:64'],
            'details.auth_code' => ['nullable', 'string', 'max:255'],
            'details.admin_invite' => ['nullable', 'string', 'max:2048'],
            'details.transfer_method' => ['nullable', 'string', 'max:120'],
            'details.extra' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $notes = trim((string) $this->input('notes', ''));
            $details = $this->input('details', []);
            $hasDetail = is_array($details) && collect($details)->filter(fn ($v) => trim((string) $v) !== '')->isNotEmpty();

            if ($notes === '' && ! $hasDetail && ! $this->hasFile('attachment')) {
                $validator->errors()->add(
                    'notes',
                    'Add at least a short note or login / access details for the buyer.'
                );
            }
        });
    }
}
