import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const windowSize = 1
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex size-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-sand-deep disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`dots-${idx}`} className="px-2 text-ink-soft/60">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer',
              p === page ? 'bg-primary text-white' : 'text-ink-soft hover:bg-sand-deep'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex size-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-sand-deep disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
