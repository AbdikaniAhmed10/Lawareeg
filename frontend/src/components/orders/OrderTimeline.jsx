import { Check, X as XIcon, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { ORDER_TIMELINE_STEPS, ORDER_STATUSES } from '../../lib/constants'
import { formatDate } from '../../lib/format'

export default function OrderTimeline({ status, events = [] }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-sand-deep/50 px-4 py-3.5 text-sm text-ink-soft">
        <XIcon className="size-4.5 shrink-0" /> This order was cancelled.
      </div>
    )
  }

  if (status === 'disputed') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3.5 text-sm text-danger">
        <AlertTriangle className="size-4.5 shrink-0" /> This order is under dispute review by our admin team.
      </div>
    )
  }

  const currentIndex = ORDER_TIMELINE_STEPS.indexOf(status)

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx < currentIndex || status === 'completed'
        const isCurrent = idx === currentIndex && status !== 'completed'
        const event = events.find((e) => e.status === step)
        const isLast = idx === ORDER_TIMELINE_STEPS.length - 1

        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={clsx(
                  'absolute left-[15px] top-8 h-full w-0.5',
                  isDone ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <span
              className={clsx(
                'z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                isDone && 'border-primary bg-primary text-white',
                isCurrent && 'border-primary bg-white text-primary animate-pulse',
                !isDone && !isCurrent && 'border-border bg-surface text-ink-soft/50'
              )}
            >
              {isDone ? <Check className="size-4" /> : idx + 1}
            </span>
            <div className="pt-0.5">
              <p className={clsx('text-sm font-medium', isDone || isCurrent ? 'text-ink' : 'text-ink-soft/60')}>
                {ORDER_STATUSES[step]?.label}
              </p>
              {event?.created_at && <p className="text-xs text-ink-soft">{formatDate(event.created_at, 'MMM d, yyyy · h:mm a')}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
