import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const Select = forwardRef(function Select(
  { className, label, error, hint, id, children, containerClassName, placeholder, ...props },
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
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'h-11 w-full appearance-none rounded-xl border border-border bg-surface px-3.5 pr-10 text-sm text-ink',
            'transition-all duration-200 outline-none',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
})

export default Select
