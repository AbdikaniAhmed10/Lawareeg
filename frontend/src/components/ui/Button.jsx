import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md focus-visible:ring-primary/40',
  secondary:
    'bg-sand-deep text-ink hover:bg-border border border-border focus-visible:ring-primary/30',
  outline:
    'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary/30',
  ghost:
    'bg-transparent text-ink-soft hover:bg-sand-deep hover:text-ink focus-visible:ring-primary/20',
  danger:
    'bg-danger text-white hover:opacity-90 shadow-sm focus-visible:ring-danger/40',
  link: 'bg-transparent text-primary hover:text-primary-dark underline-offset-4 hover:underline p-0 h-auto',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2',
}

const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, as, ...props },
  ref
) {
  const Component = as || 'button'
  return (
    <Component
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-4',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        VARIANTS[variant],
        variant !== 'link' && SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Component>
  )
})

export default Button
