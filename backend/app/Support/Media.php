<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class Media
{
    /**
     * Turn a storage-relative path or /storage/... URL into an absolute public URL.
     * External http(s) URLs are returned unchanged.
     */
    public static function url(?string $pathOrUrl): ?string
    {
        if (! $pathOrUrl) {
            return null;
        }

        if (Str::startsWith($pathOrUrl, ['http://', 'https://', '//'])) {
            return $pathOrUrl;
        }

        // Already a /storage/... public path
        if (Str::startsWith($pathOrUrl, '/storage/')) {
            return url($pathOrUrl);
        }

        // Raw disk path like listings/7/avatar.jpg
        return url(Storage::url(ltrim($pathOrUrl, '/')));
    }

    /**
     * Temporary signed download URL for private sensitive files (receipts, IDs, attachments).
     */
    public static function signedRoute(string $name, array $parameters, int $minutes = 30): string
    {
        return URL::temporarySignedRoute($name, now()->addMinutes($minutes), $parameters);
    }
}
