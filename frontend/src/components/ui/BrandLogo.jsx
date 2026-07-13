import { Link } from 'react-router-dom'
import clsx from 'clsx'

const SIZES = {
  sm: { img: 'h-8 w-8', text: 'text-lg' },
  md: { img: 'h-10 w-10', text: 'text-xl' },
  lg: { img: 'h-12 w-12', text: 'text-2xl' },
  xl: { img: 'h-16 w-16', text: 'text-3xl' },
  hero: { img: 'h-24 w-24 sm:h-28 sm:w-28', text: 'text-5xl sm:text-6xl lg:text-7xl' },
}

/**
 * Lawareeg brand mark — logo image + optional wordmark.
 * Use across nav, auth, admin, footer, and hero.
 */
export default function BrandLogo({
  to = '/',
  size = 'md',
  showWordmark = true,
  className,
  imgClassName,
  asLink = true,
}) {
  const s = SIZES[size] || SIZES.md

  const content = (
    <>
      <img
        src="/logo.png"
        alt="Lawareeg"
        width={112}
        height={112}
        className={clsx(
          'shrink-0 rounded-xl object-contain',
          s.img,
          imgClassName
        )}
        decoding="async"
      />
      {showWordmark && (
        <span className={clsx('font-display font-semibold tracking-tight text-ink', s.text)}>
          Law<span className="text-primary">areeg</span>
        </span>
      )}
    </>
  )

  const classes = clsx('inline-flex items-center gap-2.5 shrink-0', className)

  if (!asLink) {
    return <span className={classes}>{content}</span>
  }

  return (
    <Link to={to} className={classes} aria-label="Lawareeg home">
      {content}
    </Link>
  )
}
