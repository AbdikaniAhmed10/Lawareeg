import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Headset, MessageSquare } from 'lucide-react'
import messagesApi from '../../api/messages'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import BackButton from '../../components/ui/BackButton'
import { formatRelativeTime, initials } from '../../lib/format'

export default function Messages() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [supportError, setSupportError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.conversations,
    retry: 0,
  })
  const conversations = data?.data || []

  const supportMutation = useMutation({
    mutationFn: messagesApi.startSupport,
    onSuccess: (res) => {
      const id = res?.data?.id
      if (id) navigate(`/dashboard/messages/${id}`, { replace: true })
    },
    onError: (err) => {
      setSupportError(err?.response?.data?.errors?.support?.[0] || err?.response?.data?.message || 'Could not open support chat.')
    },
  })

  useEffect(() => {
    if (searchParams.get('support') === '1' && !supportMutation.isPending && !supportMutation.isSuccess) {
      supportMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <BackButton to="/dashboard" label="Back to dashboard" preferHistory={false} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Messages</h1>
          <p className="mt-1 text-sm text-ink-soft">Chat with buyers, sellers, or Lawareeg support.</p>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        loading={supportMutation.isPending}
        onClick={() => {
          setSupportError('')
          supportMutation.mutate()
        }}
      >
        <Headset className="size-4" /> Contact support
      </Button>

      {supportError && <Alert variant="danger">{supportError}</Alert>}

      {isLoading ? (
        <Spinner className="py-20" />
      ) : conversations.length ? (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {conversations.map((conv) => {
            const isSupport = conv.is_support || conv.type === 'support'
            const isOrder = conv.is_order || conv.type === 'order'
            const participant = conv.participant || conv.other_user
            const name = isSupport ? 'Lawareeg Support' : participant?.name || 'Conversation'
            const preview =
              typeof conv.last_message === 'string'
                ? conv.last_message
                : conv.last_message?.body ||
                  (isOrder ? conv.subtitle || conv.order?.order_number : null) ||
                  conv.listing?.title ||
                  'No messages yet'

            return (
              <Link
                key={conv.id}
                to={`/dashboard/messages/${conv.id}`}
                className="flex items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-sand-deep/40 active:bg-sand-deep/60"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isSupport ? 'bg-primary text-white' : isOrder ? 'bg-info/15 text-info' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isSupport ? <Headset className="size-5" /> : initials(participant?.name || 'U')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{name}</p>
                    <span className="shrink-0 text-[11px] text-ink-soft">{formatRelativeTime(conv.last_message_at)}</span>
                  </div>
                  <p className="truncate text-sm text-ink-soft">{preview}</p>
                  {isSupport ? (
                    <p className="mt-0.5 truncate text-xs text-primary">Help &amp; support</p>
                  ) : isOrder ? (
                    <p className="mt-0.5 truncate text-xs text-info">
                      Order chat · {conv.order?.order_number || conv.subtitle || 'credentials allowed'}
                    </p>
                  ) : (
                    conv.listing?.title && (
                      <p className="mt-0.5 truncate text-xs text-primary">{conv.listing.title}</p>
                    )
                  )}
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
          icon={MessageSquare}
          title="No conversations yet"
          description="Message a seller from a listing, or contact Lawareeg support if you need help."
        />
      )}
    </div>
  )
}
