<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmail extends BaseVerifyEmail
{
    /**
     * Build the verification URL for the React SPA.
     */
    protected function verificationUrl($notifiable): string
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        $id = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());

        // Signed API URL — frontend will open this or call it with the same params.
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $id,
                'hash' => $hash,
            ]
        );

        // Prefer SPA deep-link so users land on a branded page; it will hit the API.
        $query = parse_url($apiUrl, PHP_URL_QUERY);

        return "{$frontend}/verify-email/{$id}/{$hash}".($query ? "?{$query}" : '');
    }
}
