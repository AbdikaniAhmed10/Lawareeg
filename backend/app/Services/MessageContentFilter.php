<?php

namespace App\Services;

class MessageContentFilter
{
    /**
     * Block off-platform contact sharing: no digits, emails, or messaging-app mentions.
     *
     * @return list<array{pattern: string, reason: string}>
     */
    private static function rules(): array
    {
        return [
            [
                'pattern' => '/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i',
                'reason' => 'email addresses',
            ],
            [
                // Any digit at all — phone numbers, obfuscated contact, etc.
                'pattern' => '/\d/u',
                'reason' => 'numbers',
            ],
            [
                // Messaging platforms + short / misspelled forms
                'pattern' => '/\b(?:whats?\s*app?s?|whatsap|watsapp|whatsap+|watsap|w\.?a\.?|wa\.me|wapp|wats|tg\b|t\.me\/?|telegram|tele\b|signal|viber|imo\b|skype|wechat|we\s*chat|line\.me|line\b|discord|snapchat|snap\b|messenger|fb\s*messenger|instagram\s*dm|ig\s*dm|i\.?g\.?\b|sms|imessage)\b/i',
                'reason' => 'other messaging apps',
            ],
            [
                'pattern' => '/\b(?:call\s*me|text\s*me|dm\s*me|pm\s*me|inbox\s*me|message\s*me\s+on|contact\s+me\s+on|reach\s+me\s+on|add\s+me\s+on|hit\s+me\s+up)\b/i',
                'reason' => 'off-platform contact requests',
            ],
        ];
    }

    public static function findViolation(?string $body): ?string
    {
        if ($body === null || trim($body) === '') {
            return null;
        }

        $normalized = self::normalize($body);

        foreach (self::rules() as $rule) {
            if (preg_match($rule['pattern'], $normalized) === 1 || preg_match($rule['pattern'], $body) === 1) {
                return $rule['reason'];
            }
        }

        // Spelled-out digits after normalize (zero six one … → 061…)
        if (preg_match('/\d/u', $normalized) === 1) {
            return 'numbers';
        }

        return null;
    }

    /**
     * Support chats may include order IDs / amounts / emails needed for help,
     * but still block off-platform contact apps.
     */
    public static function findSupportViolation(?string $body): ?string
    {
        return self::findRelaxedViolation($body);
    }

    /**
     * Paid-order handover chat: emails, passwords, recovery codes, and numbers are allowed.
     * Still keep WhatsApp / Telegram / “contact me on …” off the platform.
     */
    public static function findOrderViolation(?string $body): ?string
    {
        return self::findRelaxedViolation($body);
    }

    private static function findRelaxedViolation(?string $body): ?string
    {
        if ($body === null || trim($body) === '') {
            return null;
        }

        $normalized = self::normalize($body);
        $allowed = ['numbers', 'email addresses'];

        foreach (self::rules() as $rule) {
            if (in_array($rule['reason'], $allowed, true)) {
                continue;
            }
            if (preg_match($rule['pattern'], $normalized) === 1 || preg_match($rule['pattern'], $body) === 1) {
                return $rule['reason'];
            }
        }

        return null;
    }

    public static function warningMessage(?string $reason = null): string
    {
        $detail = match ($reason) {
            'numbers' => ' Do not type any numbers (including phone numbers).',
            'email addresses' => ' Do not share email addresses.',
            'other messaging apps' => ' Do not mention WhatsApp, Telegram, or other apps (including short names like wa / tg).',
            'off-platform contact requests' => ' Keep the conversation on Lawareeg only.',
            default => ' Do not share phone numbers, emails, or other contact details.',
        };

        return 'Keep chat on Lawareeg.'.$detail.' Your message was not delivered.';
    }

    /**
     * Normalize obfuscation: spelled digits, spaced letters (w h a t s a p), etc.
     */
    private static function normalize(string $body): string
    {
        $map = [
            'zero' => '0', 'one' => '1', 'two' => '2', 'three' => '3', 'four' => '4',
            'five' => '5', 'six' => '6', 'seven' => '7', 'eight' => '8', 'nine' => '9',
            'oh' => '0',
        ];

        $text = mb_strtolower($body);
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        foreach ($map as $word => $digit) {
            $text = preg_replace('/\b'.preg_quote($word, '/').'\b/u', $digit, $text) ?? $text;
        }

        // Collapse spaced single letters: "w h a t s a p" → "whatsap"
        $text = preg_replace_callback(
            '/\b(?:[a-z]\s+){3,}[a-z]\b/u',
            static fn (array $m) => str_replace(' ', '', $m[0]),
            $text
        ) ?? $text;

        return $text;
    }
}
