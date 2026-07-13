import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

/**
 * Consistent back control for nested / detail screens.
 * Uses browser history when available, otherwise falls back to `to`.
 */
export default function BackButton({
  to = '/',
  label = 'Back',
  className,
  preferHistory = true,
}) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (!preferHistory) return
    const idx = window.history.state?.idx
    if (typeof idx === 'number' ? idx > 0 : window.history.length > 1) {
      e.preventDefault()
      navigate(-1)
    }
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-primary',
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
