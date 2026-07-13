import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LOCALES, translate } from '../i18n'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'lawareeg-lang'

function getInitialLocale() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'so') return stored
  const browser = (navigator.language || '').toLowerCase()
  if (browser.startsWith('so')) return 'so'
  return 'en'
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next) => {
    if (next === 'en' || next === 'so') setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'en' ? 'so' : 'en'))
  }, [])

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale])

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t, locales: LOCALES }),
    [locale, setLocale, toggleLocale, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** Shortcut: { t, locale, setLocale } */
export function useT() {
  return useLanguage()
}

export default LanguageContext
