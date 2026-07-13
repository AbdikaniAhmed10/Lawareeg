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
        $url = $this->resolveShareUrl($url);
        $url = $this->stripTrackingParams($url);

        $host = parse_url($url, PHP_URL_HOST) ?: '';
        $platform = $this->detectPlatform($host, $categorySlug);
        $handle = $this->extractHandle($url, $platform);

        $meta = $this->fetchOpenGraph($url);
        $avatar = $this->resolveAvatar($platform, $handle, $url, $meta['image'] ?? null);

        // If share link did not expose a handle, still use OG title/image when available.
        $title = $meta['title']
            ?? ($handle ? ltrim($handle, '@') : null);

        return [
            'url' => $url,
            'platform' => $platform,
            'handle' => $handle,
            'title' => $title,
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

            if ($candidates !== []) {
                return $candidates[0];
            }
        }

        if ($ogImage) {
            return $ogImage;
        }

        if (in_array($platform, ['website', 'domain', 'saas', 'app', 'other'], true)) {
            return 'https://unavatar.io/'.rawurlencode($url);
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
            'instagram' => $this->instagramHandle($parts),
            'twitter' => $this->twitterHandle($parts),
            'facebook' => $this->facebookHandle($parts, $url),
            default => null,
        };
    }

    private function tiktokHandle(array $parts): ?string
    {
        $skip = ['video', 'tag', 'music', 'live', 'photo', 'find', 'foryou', 'following', 't'];

        foreach ($parts as $part) {
            $clean = ltrim($part, '@');
            if ($clean === '' || in_array(Str::lower($part), $skip, true) || in_array(Str::lower($clean), $skip, true)) {
                continue;
            }
            // Share short codes / video ids are usually alnum blobs without letters-only handles
            if (preg_match('/^\d+$/', $clean)) {
                continue;
            }
            if (str_starts_with($part, '@') || preg_match('/^[A-Za-z0-9._]{2,64}$/', $clean)) {
                return $clean;
            }
        }

        return null;
    }

    private function instagramHandle(array $parts): ?string
    {
        $skip = ['p', 'reel', 'reels', 'stories', 'share', 'tv', 'explore', 'accounts', 'direct'];

        foreach ($parts as $part) {
            $clean = ltrim($part, '@');
            if ($clean === '' || in_array(Str::lower($clean), $skip, true)) {
                continue;
            }
            if (preg_match('/^[A-Za-z0-9._]{2,64}$/', $clean)) {
                return $clean;
            }
        }

        return null;
    }

    private function twitterHandle(array $parts): ?string
    {
        $skip = ['i', 'intent', 'share', 'status', 'hashtag', 'search', 'home', 'explore'];

        foreach ($parts as $part) {
            $clean = ltrim($part, '@');
            if ($clean === '' || in_array(Str::lower($clean), $skip, true)) {
                continue;
            }
            if (preg_match('/^[A-Za-z0-9_]{1,50}$/', $clean)) {
                return $clean;
            }
        }

        return null;
    }

    private function facebookHandle(array $parts, string $url): ?string
    {
        if (($parts[0] ?? '') === 'profile.php') {
            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

            return isset($query['id']) ? (string) $query['id'] : null;
        }

        $skip = ['pages', 'groups', 'watch', 'share', 'photo', 'permalink.php', 'story.php', 'reel', 'reels', 'people', 'profile'];
        foreach ($parts as $i => $part) {
            if ($part === '' || in_array(Str::lower($part), $skip, true)) {
                continue;
            }
            // /people/Name/ID
            if (Str::lower($part) === 'people' && ! empty($parts[$i + 2])) {
                return (string) $parts[$i + 2];
            }
            if (preg_match('/^[A-Za-z0-9.\-]{2,}$/', $part)) {
                return ltrim($part, '@');
            }
        }

        return null;
    }

    private function youtubeHandle(array $parts, string $url): ?string
    {
        if (isset($parts[0]) && str_starts_with($parts[0], '@')) {
            return ltrim($parts[0], '@');
        }

        if (($parts[0] ?? '') === 'channel' && ! empty($parts[1])) {
            return $parts[1];
        }

        if (in_array($parts[0] ?? '', ['c', 'user'], true) && ! empty($parts[1])) {
            return $parts[1];
        }

        // youtu.be / watch / shorts are videos — no channel handle
        if (in_array($parts[0] ?? '', ['watch', 'shorts', 'playlist', 'feed', 'embed', 'live'], true)) {
            return null;
        }

        if (! empty($parts[0]) && preg_match('/^[A-Za-z0-9._\-]{2,}$/', $parts[0])) {
            return ltrim($parts[0], '@');
        }

        if (preg_match('/[@\/]([A-Za-z0-9._\-]{2,})/', $url, $m)) {
            return ltrim($m[1], '@');
        }

        return null;
    }

    private function fetchOpenGraph(string $url): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->browserHeaders())
                ->withOptions(['allow_redirects' => ['max' => 8]])
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
            str_contains($host, 'instagram') || str_contains($host, 'instagr.am') || str_contains($slug, 'instagram') => 'instagram',
            str_contains($host, 'facebook') || str_contains($host, 'fb.com') || str_contains($host, 'fb.watch') || str_contains($slug, 'facebook') => 'facebook',
            str_contains($host, 'twitter') || str_contains($host, 'x.com') || str_contains($host, 't.co') || str_contains($slug, 'twitter') => 'twitter',
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
        $url = trim(html_entity_decode($url, ENT_QUOTES | ENT_HTML5));
        // App paste sometimes includes surrounding quotes or zero-width chars
        $url = trim($url, " \t\n\r\0\x0B\"'`");
        $url = preg_replace('/\s+/', '', $url) ?: $url;

        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        return $url;
    }

    /**
     * Follow short / app share links (vm.tiktok.com, fb.me, t.co, instagr.am, …)
     * so we land on a profile/channel URL we can parse.
     */
    private function resolveShareUrl(string $url): string
    {
        $host = Str::lower((string) parse_url($url, PHP_URL_HOST));
        $needsResolve = (bool) preg_match(
            '/(^|\.)(vm\.tiktok\.com|vt\.tiktok\.com|fb\.me|fb\.watch|t\.co|bit\.ly|tinyurl\.com|instagr\.am|lnkd\.in|youtu\.be)$/i',
            $host
        ) || str_contains($host, 'm.facebook.com')
            || str_contains($host, 'lm.facebook.com')
            || str_contains($url, 'share/')
            || str_contains($url, '/s/')
            || str_contains($url, 'igsh')
            || str_contains($url, 'igshid');

        // Always try one lightweight resolve for mobile share hosts / tracking URLs
        if (! $needsResolve && ! $this->looksLikeShortSocialShare($url, $host)) {
            return $url;
        }

        try {
            $response = Http::timeout(12)
                ->withHeaders($this->browserHeaders())
                ->withOptions([
                    'allow_redirects' => false,
                    'http_errors' => false,
                ])
                ->head($url);

            $location = $response->header('Location');
            if (! $location && in_array($response->status(), [0, 403, 405, 501], true)) {
                $finalUrl = $url;
                $response = Http::timeout(15)
                    ->withHeaders($this->browserHeaders())
                    ->withOptions([
                        'allow_redirects' => ['max' => 8],
                        'http_errors' => false,
                        'on_stats' => function ($stats) use (&$finalUrl) {
                            if (is_object($stats) && method_exists($stats, 'getEffectiveUri')) {
                                $uri = $stats->getEffectiveUri();
                                if ($uri) {
                                    $finalUrl = (string) $uri;
                                }
                            }
                        },
                    ])
                    ->get($url);

                if ($finalUrl !== '' && $finalUrl !== $url) {
                    return $this->normalizeUrl($finalUrl);
                }

                // Parse meta refresh / canonical / og:url from body for awkward share pages
                $html = $response->body();
                if (preg_match('/property=["\']og:url["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)
                    || preg_match('/content=["\']([^"\']+)["\'][^>]+property=["\']og:url["\']/i', $html, $m)
                    || preg_match('/rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)
                    || preg_match('/href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']/i', $html, $m)) {
                    return $this->normalizeUrl(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5));
                }
            }

            // Walk redirects manually (HEAD)
            $current = $url;
            for ($i = 0; $i < 8; $i++) {
                $response = Http::timeout(10)
                    ->withHeaders($this->browserHeaders())
                    ->withOptions(['allow_redirects' => false, 'http_errors' => false])
                    ->head($current);

                $status = $response->status();
                $location = $response->header('Location');
                if (! $location || ! in_array($status, [301, 302, 303, 307, 308], true)) {
                    break;
                }

                $next = $this->absoluteUrl($location, $current) ?: $location;
                $next = $this->normalizeUrl($next);
                if ($next === $current) {
                    break;
                }
                $current = $next;
            }

            return $current;
        } catch (Throwable) {
            return $url;
        }
    }

    private function looksLikeShortSocialShare(string $url, string $host): bool
    {
        if (preg_match('/tiktok\.com\/[A-Za-z0-9]{5,20}\/?$/i', $url)) {
            return true;
        }

        return str_contains($host, 'tiktok')
            && ! str_contains($url, '@')
            && ! str_contains($url, '/video/');
    }

    private function stripTrackingParams(string $url): string
    {
        $parts = parse_url($url);
        if ($parts === false || empty($parts['host'])) {
            return $url;
        }

        $query = [];
        if (! empty($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        $drop = [
            'igsh', 'igshid', 'img_index', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'mc_eid', 'si', '_t', '_r', 'tt_from', 'is_from_webapp', 'sender_device',
            'feature', 'app', 'ref', 'refsrc', 'mibextid', 'rdid', 'share_app_id', 'share_id',
            'share_link_id', 'share_item_type', 'timestamp', 'social_sharing', 'source',
        ];

        foreach ($drop as $key) {
            unset($query[$key]);
        }

        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'];
        $path = $parts['path'] ?? '/';
        $built = $scheme.'://'.$host.$path;
        if ($query !== []) {
            $built .= '?'.http_build_query($query);
        }
        if (! empty($parts['fragment']) && ! str_starts_with($parts['fragment'], '!')) {
            // keep meaningful fragments rarely; drop app junk
        }

        return $built;
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
