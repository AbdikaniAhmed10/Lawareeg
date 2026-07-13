import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import clsx from 'clsx'
import messagesApi from '../../api/messages'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatRelativeTime } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

export default function Notifications() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => messagesApi.notifications(), retry: 0 })

  const markAllMutation = useMutation({
    mutationFn: messagesApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
          <p className="mt-1 text-ink-soft">Updates about your orders, listings and messages.</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllMutation.mutate()}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : notifications.length ? (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {notifications.map((n) => (
            <div key={n.id} className={clsx('flex gap-4 p-4', !n.read_at && 'bg-primary/5')}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-sm text-ink-soft">{n.body}</p>
                <p className="mt-1 text-xs text-ink-soft/70">{formatRelativeTime(n.created_at)}</p>
              </div>
              {!n.read_at && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      )}
    </div>
  )
}
