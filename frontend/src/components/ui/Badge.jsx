import clsx from 'clsx'

const VARIANTS = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-sand-deep text-ink-soft',
  accent: 'bg-accent/10 text-accent',
}

export default function Badge({ children, variant = 'neutral', className, icon: Icon, dot = false }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        VARIANTS[variant],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  )
}
