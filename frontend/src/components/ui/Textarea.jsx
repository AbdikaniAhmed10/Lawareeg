import { forwardRef } from 'react'
import clsx from 'clsx'

const Textarea = forwardRef(function Textarea(
  { className, label, error, hint, id, rows = 4, containerClassName, ...props },
  ref
) {
  const inputId = id || props.name

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx(
          'w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-ink-soft/50',
          'transition-all duration-200 outline-none',
          'focus:border-primary focus:ring-4 focus:ring-primary/15',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
})

export default Textarea
