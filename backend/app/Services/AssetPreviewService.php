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

        $meta = $this->fetchPageMeta($url, $platform);
        if (! empty($meta['handle'])) {
            $handle = $meta['handle'];
        }

        $avatarRemote = $this->resolveAvatar(
            $platform,
            $handle,
            $url,
            $meta['image'] ?? null
        );

        // Mirror to our storage so the browser is not stuck with expired TikTok CDN
        // signatures or flaky third-party avatar proxies.
        $mirrored = $this->mirrorAvatar($avatarRemote);
        $avatar = $mirrored
            ?? (is_string($avatarRemote) && str_contains($avatarRemote, 'unavatar.io') ? $avatarRemote : null);

        $title = $this->pickTitle($meta['title'] ?? null, $handle, $platform);

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

        // Already mirrored locally (preview cache or previous store)
        $localPath = null;
        if (! preg_match('#^https?://#i', $remoteUrl)) {
            $localPath = ltrim(preg_replace('#^/?storage/#', '', $remoteUrl) ?? $remoteUrl, '/');
        } elseif (preg_match('#/storage/(.+)$#', parse_url($remoteUrl, PHP_URL_PATH) ?? '', $m)) {
            $localPath = $m[1];
        }

        if ($localPath && Storage::disk('public')->exists($localPath)) {
            $ext = pathinfo($localPath, PATHINFO_EXTENSION) ?: 'jpg';
            $path = "listings/{$listingId}/avatar.{$ext}";
            Storage::disk('public')->put($path, Storage::disk('public')->get($localPath));

            return $path;
        }

        $downloaded = $this->downloadImage($remoteUrl);
        if (! $downloaded) {
            return null;
        }

        $path = "listings/{$listingId}/avatar.{$downloaded['ext']}";
        Storage::disk('public')->put($path, $downloaded['body']);

        return $path;
    }

    private function resolveAvatar(string $platform, ?string $handle, string $url, ?string $ogImage): ?string
    {
        // Prefer page/CDN image first — TikTok CDN links work from the server briefly;
        // we mirror them. Unavatar /tiktok/@user returns 403; use /tiktok/user.
        if ($ogImage && $this->urlLooksLikeImage($ogImage)) {
            return $ogImage;
        }

        if ($handle) {
            $safe = rawurlencode(ltrim($handle, '@'));
            $candidates = match ($platform) {
                'youtube' => [
                    'https://unavatar.io/youtube/@'.$safe,
                    'https://unavatar.io/youtube/'.$safe,
                ],
                'tiktok' => [
                    'https://unavatar.io/tiktok/'.$safe,
                ],
                'instagram' => [
                    'https://unavatar.io/instagram/'.$safe,
                ],
                'twitter' => [
                    'https://unavatar.io/x/'.$safe,
                    'https://unavatar.io/twitter/'.$safe,
                ],
                'facebook' => [
                    'https://graph.facebook.com/'.$safe.'/picture?type=large',
                    'https://unavatar.io/facebook/'.$safe,
                ],
                default => [],
            };

            foreach ($candidates as $candidate) {
                if ($this->urlLooksLikeImage($candidate)) {
                    return $candidate;
                }
            }
        }

        if ($ogImage) {
            return $ogImage;
        }

        if (in_array($platform, ['website', 'domain', 'saas', 'app', 'other'], true)) {
            $fallback = 'https://unavatar.io/'.rawurlencode($url);
            if ($this->urlLooksLikeImage($fallback)) {
                return $fallback;
            }
        }

        return null;
    }

    /**
     * Download a remote avatar once and expose it from /storage so <img> stays valid.
     */
    private function mirrorAvatar(?string $remoteUrl): ?string
    {
        if (! $remoteUrl) {
            return null;
        }

        if (! preg_match('#^https?://#i', $remoteUrl)) {
            return $remoteUrl;
        }

        $downloaded = $this->downloadImage($remoteUrl);
        if (! $downloaded) {
            return null;
        }

        $path = 'previews/'.sha1($remoteUrl).'.'.$downloaded['ext'];
        Storage::disk('public')->put($path, $downloaded['body']);

        return Storage::disk('public')->url($path);
    }

    /**
     * @return array{body: string, ext: string, mime: string}|null
     */
    private function downloadImage(string $remoteUrl): ?array
    {
        try {
            $response = Http::timeout(20)
                ->withHeaders($this->imageFetchHeaders($remoteUrl))
                ->withOptions(['allow_redirects' => true])
                ->get($remoteUrl);

            if (! $response->successful()) {
                return null;
            }

            $mime = strtolower((string) ($response->header('Content-Type') ?: 'image/jpeg'));
            $mime = trim(explode(';', $mime)[0]);
            if (! str_starts_with($mime, 'image/')) {
                return null;
            }

            $ext = match (true) {
                str_contains($mime, 'png') => 'png',
                str_contains($mime, 'webp') => 'webp',
                str_contains($mime, 'gif') => 'gif',
                default => 'jpg',
            };

            return [
                'body' => $response->body(),
                'ext' => $ext,
                'mime' => $mime,
            ];
        } catch (Throwable) {
            return null;
        }
    }

    private function urlLooksLikeImage(string $url): bool
    {
        try {
            $headers = $this->imageFetchHeaders($url);
            $response = Http::timeout(10)
                ->withHeaders($headers)
                ->withOptions(['allow_redirects' => true])
                ->head($url);

            if (! $response->successful()) {
                $response = Http::timeout(12)
                    ->withHeaders(array_merge($headers, ['Range' => 'bytes=0-1023']))
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

    private function pickTitle(?string $metaTitle, ?string $handle, string $platform): ?string
    {
        if ($metaTitle && ! $this->isGenericTitle($metaTitle, $platform)) {
            return $metaTitle;
        }

        return $handle ? ltrim($handle, '@') : ($metaTitle ?: null);
    }

    private function isGenericTitle(string $title, string $platform): bool
    {
        $normalized = Str::lower(trim(preg_replace('/\s+/', ' ', $title) ?? $title));
        $generics = [
            'tiktok - make your day',
            'tiktok | make your day',
            'tiktok',
            'instagram',
            'facebook',
            'youtube',
            'x',
            'twitter',
            'log in · instagram',
            'log in to facebook',
        ];

        if (in_array($normalized, $generics, true)) {
            return true;
        }

        return match ($platform) {
            'tiktok' => str_contains($normalized, 'make your day'),
            'instagram' => str_starts_with($normalized, 'log in'),
            default => false,
        };
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

    private function fetchPageMeta(string $url, string $platform): array
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
            $embedded = $this->extractEmbeddedProfile($html, $platform);

            $title = $embedded['title']
                ?? $this->metaContent($html, 'og:title')
                ?? $this->metaContent($html, 'twitter:title')
                ?? $this->tagContent($html, 'title');

            $description = $embedded['description']
                ?? $this->metaContent($html, 'og:description')
                ?? $this->metaContent($html, 'twitter:description')
                ?? $this->metaNameContent($html, 'description');

            $image = $embedded['image']
                ?? $this->absoluteUrl(
                    $this->metaContent($html, 'og:image')
                        ?: $this->metaContent($html, 'twitter:image')
                        ?: $this->metaContent($html, 'twitter:image:src'),
                    $url
                );

            return array_filter([
                'title' => $title,
                'description' => $description,
                'image' => $image,
                'handle' => $embedded['handle'] ?? null,
            ], fn ($v) => $v !== null && $v !== '');
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * Platforms often hide real avatar/title behind login OG shells; the page JSON still has them.
     */
    private function extractEmbeddedProfile(string $html, string $platform): array
    {
        if ($platform === 'tiktok') {
            if (preg_match(
                '/id=["\']__UNIVERSAL_DATA_FOR_REHYDRATION__["\'][^>]*>(.*?)<\/script>/is',
                $html,
                $m
            )) {
                $data = json_decode(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5), true);
                $user = $data['__DEFAULT_SCOPE__']['webapp.user-detail']['userInfo']['user'] ?? null;
                if (is_array($user)) {
                    return array_filter([
                        'handle' => $user['uniqueId'] ?? null,
                        'title' => $user['nickname'] ?? ($user['uniqueId'] ?? null),
                        'description' => $user['signature'] ?? null,
                        'image' => $this->decodeJsonUrl(
                            $user['avatarLarger'] ?? $user['avatarMedium'] ?? $user['avatarThumb'] ?? null
                        ),
                    ]);
                }
            }

            // Regex fallback if JSON parse path changes
            if (preg_match('/"uniqueId"\s*:\s*"([^"]+)"/', $html, $id)
                && preg_match('/"nickname"\s*:\s*"([^"]+)"/', $html, $nick)
                && preg_match('/"avatar(?:Larger|Medium|Thumb)"\s*:\s*"([^"]+)"/', $html, $av)) {
                return array_filter([
                    'handle' => $id[1],
                    'title' => $this->decodeJsonString($nick[1]),
                    'image' => $this->decodeJsonUrl($av[1]),
                ]);
            }
        }

        if ($platform === 'instagram' && preg_match('/"profile_pic_url_hd"\s*:\s*"([^"]+)"/', $html, $m)) {
            $title = null;
            if (preg_match('/"full_name"\s*:\s*"([^"]+)"/', $html, $n)) {
                $title = $this->decodeJsonString($n[1]);
            }

            return array_filter([
                'title' => $title,
                'image' => $this->decodeJsonUrl($m[1]),
            ]);
        }

        return [];
    }

    private function decodeJsonUrl(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $decoded = $this->decodeJsonString($value);
        $decoded = stripcslashes($decoded);

        return preg_match('#^https?://#i', $decoded) ? $decoded : null;
    }

    private function decodeJsonString(string $value): string
    {
        $decoded = json_decode('"'.$value.'"');

        return is_string($decoded) ? $decoded : html_entity_decode($value, ENT_QUOTES | ENT_HTML5);
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

    private function imageFetchHeaders(string $imageUrl): array
    {
        $host = Str::lower((string) parse_url($imageUrl, PHP_URL_HOST));
        $referer = match (true) {
            str_contains($host, 'tiktok') || str_contains($host, 'ttwstatic') || str_contains($host, 'musical.ly') => 'https://www.tiktok.com/',
            str_contains($host, 'instagram') || str_contains($host, 'cdninstagram') || str_contains($host, 'fbcdn') => 'https://www.instagram.com/',
            str_contains($host, 'facebook') => 'https://www.facebook.com/',
            str_contains($host, 'ytimg') || str_contains($host, 'youtube') || str_contains($host, 'ggpht') => 'https://www.youtube.com/',
            default => 'https://www.google.com/',
        };

        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Referer' => $referer,
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
