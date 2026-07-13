import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          'relative w-full rounded-2xl bg-surface shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-soft hover:bg-sand-deep hover:text-ink cursor-pointer transition-colors"
            >
              <X className="size-4.5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
