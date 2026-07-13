/**
 * Client-side hint for off-platform contact sharing.
 * Server still enforces the real block — this is UX only.
 */
export function findContactShareViolation(text, { allowNumbers = false, allowEmails = false } = {}) {
  if (!text || !String(text).trim()) return null

  const body = String(text)
  const lower = body.toLowerCase()

  if (!allowEmails && /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i.test(body)) {
    return 'email addresses'
  }

  if (!allowNumbers) {
    if (/\d/.test(body)) {
      return 'numbers'
    }

    if (/\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/i.test(body)) {
      const spelled = lower.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/g)
      if (spelled && spelled.length >= 3) {
        return 'numbers'
      }
    }
  }

  if (
    /\b(?:whats?\s*app?s?|whatsap|watsapp|watsap|w\.?a\.?|wa\.me|wapp|wats|tg\b|t\.me\/?|telegram|tele\b|signal|viber|imo\b|skype|wechat|we\s*chat|line\.me|\bline\b|discord|snapchat|\bsnap\b|messenger|fb\s*messenger|instagram\s*dm|ig\s*dm|\bi\.?g\.?\b|sms|imessage)\b/i.test(
      lower
    )
  ) {
    return 'other messaging apps'
  }

  if (
    /\b(?:call\s*me|text\s*me|dm\s*me|pm\s*me|inbox\s*me|message\s*me\s+on|contact\s+me\s+on|reach\s+me\s+on|add\s+me\s+on|hit\s+me\s+up)\b/i.test(
      lower
    )
  ) {
    return 'off-platform contact requests'
  }

  return null
}

export function contactShareWarning(reason) {
  const detail =
    {
      numbers: ' Do not type any numbers (including phone numbers).',
      'email addresses': ' Do not share email addresses.',
      'other messaging apps':
        ' Do not mention WhatsApp, Telegram, or other apps (including short names like wa / tg).',
      'off-platform contact requests': ' Keep the conversation on Lawareeg only.',
    }[reason] || ' Do not share phone numbers, emails, or other contact details.'

  return `Keep chat on Lawareeg.${detail} Your message was not delivered.`
}
