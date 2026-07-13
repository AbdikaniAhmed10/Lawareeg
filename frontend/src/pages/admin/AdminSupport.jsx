import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Headset } from 'lucide-react'
import adminApi from '../../api/admin'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import BackButton from '../../components/ui/BackButton'
import { formatRelativeTime, initials } from '../../lib/format'

export default function AdminSupport() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'support'],
    queryFn: () => adminApi.support(),
    retry: 0,
    refetchInterval: 10000,
  })

  const conversations = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Support inbox</h1>
        <p className="mt-1 text-ink-soft">Messages from users who need help with orders, payments, or accounts.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : conversations.length ? (
        <div className="mx-auto flex w-full max-w-xl flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {conversations.map((conv) => {
            const user = conv.participant || conv.buyer || conv.other_user
            const preview =
              typeof conv.last_message === 'string'
                ? conv.last_message
                : conv.last_message?.body || 'No messages yet'

            return (
              <Link
                key={conv.id}
                to={`/admin/support/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sand-deep/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(user?.name || 'U')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-ink">{user?.name || 'User'}</p>
                    <span className="shrink-0 text-xs text-ink-soft">{formatRelativeTime(conv.last_message_at)}</span>
                  </div>
                  <p className="truncate text-sm text-ink-soft">{user?.email}</p>
                  <p className="mt-0.5 truncate text-sm text-ink">{preview}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                    {conv.unread_count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Headset}
          title="No support messages yet"
          description="When users tap Contact support, their chats will appear here."
        />
      )}
    </div>
  )
}
