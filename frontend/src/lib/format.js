import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatCurrency(value, currency = 'USD') {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(number)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0))
}

export function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—'
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    return format(date, pattern)
  } catch {
    return '—'
  }
}

export function formatRelativeTime(value) {
  if (!value) return '—'
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
