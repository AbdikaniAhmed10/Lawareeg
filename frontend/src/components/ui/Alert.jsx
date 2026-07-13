import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import clsx from 'clsx'

const VARIANTS = {
  info: { icon: Info, className: 'bg-info/10 text-info border-info/20' },
  success: { icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
  warning: { icon: AlertTriangle, className: 'bg-warning/10 text-warning border-warning/20' },
  danger: { icon: XCircle, className: 'bg-danger/10 text-danger border-danger/20' },
}

export default function Alert({ variant = 'info', title, children, className, onDismiss }) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant]
  return (
    <div className={clsx('flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm', variantClass, className)}>
      <Icon className="mt-0.5 size-4.5 shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx('text-ink-soft', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 rounded-full p-1 hover:bg-black/5 cursor-pointer">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
