import en from './en'
import so from './so'

export const LOCALES = {
  en: { code: 'en', label: 'En', name: 'English' },
  so: { code: 'so', label: 'So', name: 'Soomaali' },
}

export const dictionaries = { en, so }

export function translate(locale, key, vars = {}) {
  const dict = dictionaries[locale] || dictionaries.en
  const fallback = dictionaries.en
  const parts = key.split('.')
  let value = parts.reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), dict)
  if (value === undefined) {
    value = parts.reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), fallback)
  }
  if (typeof value !== 'string') return key
  return Object.entries(vars).reduce(
    (text, [k, v]) => text.replaceAll(`{${k}}`, String(v)),
    value
  )
}

export function getFaqItems(locale) {
  const items = dictionaries[locale]?.faq?.items
  return Array.isArray(items) && items.length ? items : dictionaries.en.faq.items
}
