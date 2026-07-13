import clsx from 'clsx'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Compact En | So toggle — place next to theme control.
 */
export default function LanguageSwitcher({ className }) {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-semibold',
        className
      )}
      role="group"
      aria-label={t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={clsx(
          'rounded-full px-2.5 py-1.5 transition-colors cursor-pointer',
          locale === 'en' ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink'
        )}
        aria-pressed={locale === 'en'}
      >
        En
      </button>
      <button
        type="button"
        onClick={() => setLocale('so')}
        className={clsx(
          'rounded-full px-2.5 py-1.5 transition-colors cursor-pointer',
          locale === 'so' ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink'
        )}
        aria-pressed={locale === 'so'}
      >
        So
      </button>
    </div>
  )
}
