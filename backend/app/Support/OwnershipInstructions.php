<?php

namespace App\Support;

use App\Models\Category;

class OwnershipInstructions
{
    public static function forCategory(?Category $category): string
    {
        return static::forCategorySlug($category?->slug ?? '', $category?->name ?? 'your asset');
    }

    public static function forCategorySlug(?string $slug, string $name = 'your asset'): string
    {
        $slug = strtolower((string) $slug);

        return match (true) {
            str_contains($slug, 'youtube') => 'Place this code in your YouTube channel About / description section so Lawareeg can confirm you control the channel.',
            str_contains($slug, 'instagram') => 'Place this code temporarily in your Instagram bio or a pinned post caption.',
            str_contains($slug, 'tiktok') => 'Place this code temporarily in your TikTok bio.',
            str_contains($slug, 'facebook') => 'Place this code temporarily in your Facebook Page About section or pinned post.',
            str_contains($slug, 'twitter') || str_contains($slug, 'x-') || $slug === 'twitter' => 'Place this code temporarily in your X (Twitter) bio.',
            str_contains($slug, 'website') || str_contains($slug, 'blog') || str_contains($slug, 'e-commerce') => 'Place this code on your homepage text, footer, or create a temporary page/file that contains the code.',
            str_contains($slug, 'domain') => 'Add this code as a DNS TXT record for the domain (recommended), or show it on a page hosted on that domain.',
            str_contains($slug, 'app') => 'Place this code in the app store listing description, or in an in-app settings/about screen screenshot you can share.',
            str_contains($slug, 'saas') => 'Place this code on the product homepage, login footer, or an authenticated settings page screenshot.',
            default => "Place this code somewhere only the owner of {$name} can edit (bio, about section, DNS, homepage, or equivalent). Then click \"I've added the code\".",
        };
    }

    public static function generateCode(): string
    {
        $part = static function () {
            return strtoupper(substr(str_replace(['/', '+', '='], '', base64_encode(random_bytes(4))), 0, 4));
        };

        return 'LWG-'.$part().'-'.$part();
    }
}
