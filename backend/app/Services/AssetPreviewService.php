<?php

namespace App\Services;

use App\Support\OwnershipInstructions;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class AssetPreviewService
{
    public function preview(string $url, ?string $categorySlug = null): array
    {
        $url = $this->normalizeUrl($url);
        $host = parse_url($url, PHP_URL_HOST) ?: '';
        $platform = $this->detectPlatform($host, $categorySlug);
        $handle = $this->extractHandle($url, $platform);

        $meta = $this->fetchOpenGraph($url);
        $avatar = $this->resolveAvatar($platform, $handle, $url, $meta['image'] ?? null);

        return [
            'url' => $url,
            'platform' => $platform,
            'handle' => $handle,
            'title' => $meta['title'] ?? ($handle ? ltrim($handle, '@') : null),
            'description' => $meta['description'] ?? null,
            'avatar_url' => $avatar,
            'ownership_instructions' => OwnershipInstructions::forCategorySlug($categorySlug ?: $platform),
            'placement_hint' => $this->placementHint($platform),
        ];
    }

    public function storeRemoteAvatar(?string $remoteUrl, int $listingId): ?string
    {
        if (! $remoteUrl) {
            return null;
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders($this->browserHeaders())
                ->withOptions(['allow_redirects' => true])
                ->get($remoteUrl);

            if (! $response->successful()) {
                return null;
            }

            $mime = $response->header('Content-Type') ?: 'image/jpeg';
            if (! str_starts_with(strtolower($mime), 'image/')) {
                return null;
            }

            $ext = match (true) {
                str_contains($mime, 'png') => 'png',
                str_contains($mime, 'webp') => 'webp',
                str_contains($mime, 'gif') => 'gif',
                default => 'jpg',
            };

            $path = "listings/{$listingId}/avatar.{$ext}";
            Storage::disk('public')->put($path, $response->body());

            return $path;
        } catch (Throwable) {
            return null;
        }
    }

    private function resolveAvatar(string $platform, ?string $handle, string $url, ?string $ogImage): ?string
    {
        // Social networks often block server-side HEAD/GET. Prefer unavatar URLs
        // and let the browser / later download step resolve the real image.
        if ($handle) {
            $candidates = match ($platform) {
                'youtube' => [
                    'https://unavatar.io/youtube/@'.rawurlencode($handle),
                    'https://unavatar.io/youtube/'.rawurlencode($handle),
                ],
                'tiktok' => [
                    'https://unavatar.io/tiktok/@'.rawurlencode($handle),
                    'https://unavatar.io/tiktok/'.rawurlencode($handle),
                ],
                'instagram' => [
                    'https://unavatar.io/instagram/'.rawurlencode($handle),
                ],
                'twitter' => [
                    'https://unavatar.io/x/'.rawurlencode($handle),
                    'https://unavatar.io/twitter/'.rawurlencode($handle),
                ],
                'facebook' => [
                    'https://graph.facebook.com/'.rawurlencode($handle).'/picture?type=large',
                    'https://unavatar.io/facebook/'.rawurlencode($handle),
                ],
                default => [],
            };

            foreach ($candidates as $candidate) {
                if ($this->urlLooksLikeImage($candidate)) {
                    return $candidate;
                }
            }

            // Trust first social candidate even when CDN blocks our server probe.
            if ($candidates !== []) {
                return $candidates[0];
            }
        }

        if ($ogImage) {
            return $ogImage;
        }

        if (in_array($platform, ['website', 'domain', 'saas', 'app', 'other'], true)) {
            $generic = 'https://unavatar.io/'.rawurlencode($url);
            if ($this->urlLooksLikeImage($generic)) {
                return $generic;
            }

            return $generic;
        }

        return null;
    }

    private function urlLooksLikeImage(string $url): bool
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders($this->browserHeaders())
                ->withOptions(['allow_redirects' => true])
                ->head($url);

            if (! $response->successful()) {
                // Some CDNs don't allow HEAD — try a tiny GET range
                $response = Http::timeout(12)
                    ->withHeaders(array_merge($this->browserHeaders(), ['Range' => 'bytes=0-1023']))
                    ->get($url);
            }

            if (! $response->successful() && $response->status() !== 206) {
                return false;
            }

            $mime = strtolower((string) $response->header('Content-Type'));

            return str_starts_with($mime, 'image/') || str_contains($mime, 'octet-stream');
        } catch (Throwable) {
            return false;
        }
    }

    private function extractHandle(string $url, string $platform): ?string
    {
        $path = trim((string) parse_url($url, PHP_URL_PATH), '/');
        $parts = array_values(array_filter(explode('/', $path)));

        if ($parts === []) {
            return null;
        }

        return match ($platform) {
            'youtube' => $this->youtubeHandle($parts, $url),
            'tiktok' => $this->tiktokHandle($parts),
            'instagram', 'twitter' => ltrim($parts[0] ?? '', '@') ?: null,
            'facebook' => $this->facebookHandle($parts, $url),
            default => null,
        };
    }

    private function tiktokHandle(array $parts): ?string
    {
        foreach ($parts as $part) {
            if ($part === '' || in_array($part, ['video', 'tag', 'music', 'live'], true)) {
                continue;
            }

            return ltrim($part, '@') ?: null;
        }

        return null;
    }

    private function facebookHandle(array $parts, string $url): ?string
    {
        if (($parts[0] ?? '') === 'profile.php') {
            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

            return isset($query['id']) ? (string) $query['id'] : null;
        }

        $skip = ['pages', 'groups', 'watch', 'share', 'photo', 'permalink.php'];
        foreach ($parts as $part) {
            if ($part === '' || in_array($part, $skip, true)) {
                continue;
            }

            return ltrim($part, '@') ?: null;
        }

        return null;
    }

    private function youtubeHandle(array $parts, string $url): ?string
    {
        // @handle, /channel/UCxxx, /c/Name, /user/Name
        if (isset($parts[0]) && str_starts_with($parts[0], '@')) {
            return ltrim($parts[0], '@');
        }

        if (($parts[0] ?? '') === 'channel' && ! empty($parts[1])) {
            return $parts[1];
        }

        if (in_array($parts[0] ?? '', ['c', 'user'], true) && ! empty($parts[1])) {
            return $parts[1];
        }

        if (! empty($parts[0]) && ! in_array($parts[0], ['watch', 'shorts', 'playlist', 'feed'], true)) {
            return ltrim($parts[0], '@');
        }

        if (preg_match('/[@\/]([A-Za-z0-9._-]{2,})/', $url, $m)) {
            return ltrim($m[1], '@');
        }

        return null;
    }

    private function fetchOpenGraph(string $url): array
    {
        try {
            $response = Http::timeout(12)
                ->withHeaders($this->browserHeaders())
                ->withOptions(['allow_redirects' => true])
                ->get($url);

            if (! $response->successful()) {
                return [];
            }

            $html = $response->body();

            return [
                'title' => $this->metaContent($html, 'og:title')
                    ?: $this->metaContent($html, 'twitter:title')
                    ?: $this->tagContent($html, 'title'),
                'description' => $this->metaContent($html, 'og:description')
                    ?: $this->metaContent($html, 'twitter:description')
                    ?: $this->metaNameContent($html, 'description'),
                'image' => $this->absoluteUrl(
                    $this->metaContent($html, 'og:image')
                        ?: $this->metaContent($html, 'twitter:image')
                        ?: $this->metaContent($html, 'twitter:image:src'),
                    $url
                ),
            ];
        } catch (Throwable) {
            return [];
        }
    }

    private function detectPlatform(string $host, ?string $categorySlug = null): string
    {
        $host = Str::lower($host);
        $slug = Str::lower((string) $categorySlug);

        return match (true) {
            str_contains($host, 'youtube') || str_contains($host, 'youtu.be') || str_contains($slug, 'youtube') => 'youtube',
            str_contains($host, 'tiktok') || str_contains($slug, 'tiktok') => 'tiktok',
            str_contains($host, 'instagram') || str_contains($slug, 'instagram') => 'instagram',
            str_contains($host, 'facebook') || str_contains($host, 'fb.com') || str_contains($slug, 'facebook') => 'facebook',
            str_contains($host, 'twitter') || str_contains($host, 'x.com') || str_contains($slug, 'twitter') => 'twitter',
            str_contains($slug, 'domain') => 'domain',
            str_contains($slug, 'website') || str_contains($slug, 'blog') || str_contains($slug, 'e-commerce') => 'website',
            str_contains($slug, 'app') => 'app',
            str_contains($slug, 'saas') => 'saas',
            default => 'other',
        };
    }

    private function placementHint(string $platform): string
    {
        return match ($platform) {
            'youtube' => 'After you get your verification code, put it in the YouTube channel About / description.',
            'tiktok' => 'After you get your verification code, put it temporarily in your TikTok bio.',
            'instagram' => 'After you get your verification code, put it temporarily in your Instagram bio.',
            'facebook' => 'After you get your verification code, put it in the Facebook Page About section.',
            'twitter' => 'After you get your verification code, put it temporarily in your X bio.',
            'website' => 'After you get your verification code, put it on the homepage, footer, or a temporary page.',
            'domain' => 'After you get your verification code, add it as a DNS TXT record (or on a page on that domain).',
            'app' => 'After you get your verification code, put it in the store listing description or an in-app About screen.',
            'saas' => 'After you get your verification code, put it on the product homepage or settings page.',
            default => 'After you get your verification code, place it somewhere only the owner can edit.',
        };
    }

    private function normalizeUrl(string $url): string
    {
        $url = trim($url);
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        return $url;
    }

    private function browserHeaders(): array
    {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language' => 'en-US,en;q=0.9',
        ];
    }

    private function metaContent(string $html, string $property): ?string
    {
        $patterns = [
            '/<meta[^>]+property=["\']'.preg_quote($property, '/').'["\'][^>]+content=["\']([^"\']+)["\']/i',
            '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']'.preg_quote($property, '/').'["\']/i',
            '/<meta[^>]+name=["\']'.preg_quote($property, '/').'["\'][^>]+content=["\']([^"\']+)["\']/i',
            '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']'.preg_quote($property, '/').'["\']/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $m)) {
                return html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
            }
        }

        return null;
    }

    private function metaNameContent(string $html, string $name): ?string
    {
        return $this->metaContent($html, $name);
    }

    private function tagContent(string $html, string $tag): ?string
    {
        if (preg_match('/<'.$tag.'[^>]*>(.*?)<\/'.$tag.'>/is', $html, $m)) {
            return trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_HTML5));
        }

        return null;
    }

    private function absoluteUrl(?string $maybeRelative, string $base): ?string
    {
        if (! $maybeRelative) {
            return null;
        }

        if (preg_match('#^https?://#i', $maybeRelative)) {
            return $maybeRelative;
        }

        $parts = parse_url($base);
        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? '';

        if (str_starts_with($maybeRelative, '//')) {
            return $scheme.':'.$maybeRelative;
        }

        if (str_starts_with($maybeRelative, '/')) {
            return $scheme.'://'.$host.$maybeRelative;
        }

        return $scheme.'://'.$host.'/'.ltrim($maybeRelative, '/');
    }
}
