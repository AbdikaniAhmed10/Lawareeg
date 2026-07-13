import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, containerClassName, type = 'text', ...props },
  ref
) {
  const inputId = id || props.name
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)
  const resolvedType = isPassword && revealed ? 'text' : type

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
          type={resolvedType}
          className={clsx(
            'h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-soft/50',
            'transition-all duration-200 outline-none',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-sand-deep hover:text-ink cursor-pointer"
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
})

export default Input
