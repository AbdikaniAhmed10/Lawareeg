import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center animate-fade-in">
      <div className="flex size-14 items-center justify-center rounded-full bg-sand-deep text-ink-soft">
        <Icon className="size-6" />
      </div>
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
