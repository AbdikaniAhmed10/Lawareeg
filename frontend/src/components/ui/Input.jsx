import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, containerClassName, ...props },
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
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft/60" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-soft/50',
            'transition-all duration-200 outline-none',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            Icon && 'pl-10',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
})

export default Input
