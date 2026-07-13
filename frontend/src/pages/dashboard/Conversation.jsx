import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, ShieldAlert, Headset } from 'lucide-react'
import messagesApi from '../../api/messages'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Alert from '../../components/ui/Alert'
import { useAuthStore } from '../../store/authStore'
import { formatRelativeTime, initials } from '../../lib/format'
import { contactShareWarning, findContactShareViolation } from '../../lib/messageFilter'
import clsx from 'clsx'

export default function Conversation({ backTo = '/dashboard/messages', listQueryKey = ['conversations'] }) {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef(null)

  const conversationQuery = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => messagesApi.conversation(id),
    retry: 0,
    enabled: !!id,
  })

  const messagesQuery = useQuery({
    queryKey: ['conversation', id, 'messages'],
    queryFn: () => messagesApi.messages(id, { per_page: 100 }),
    retry: 0,
    enabled: !!id,
    refetchInterval: 8000,
  })

  useEffect(() => {
    if (!id) return
    messagesApi
      .markRead(id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
      })
      .catch(() => {})
  }, [id, queryClient, listQueryKey])

  const sendMutation = useMutation({
    mutationFn: (payload) => messagesApi.send(id, payload),
    onSuccess: () => {
      setText('')
      setSendError('')
      queryClient.invalidateQueries({ queryKey: ['conversation', id, 'messages'] })
      queryClient.invalidateQueries({ queryKey: listQueryKey })
    },
    onError: (err) => {
      setSendError(err?.response?.data?.message || err?.response?.data?.errors?.body?.[0] || 'Could not send message.')
    },
  })

  const conversation = conversationQuery.data?.data
  const messages = messagesQuery.data?.data || []
  const isSupport = conversation?.is_support || conversation?.type === 'support'
  const participant = conversation?.participant || conversation?.other_user
  const title = isSupport
    ? user?.role === 'admin'
      ? participant?.name || 'User'
      : 'Lawareeg Support'
    : participant?.name || 'Conversation'
  const subtitle = isSupport
    ? user?.role === 'admin'
      ? participant?.email || 'Support request'
      : 'Help with orders, payments, or account issues'
    : conversation?.listing?.title || 'General inquiry'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return

    const violation = findContactShareViolation(text, { allowNumbers: isSupport })
    if (violation) {
      setSendError(contactShareWarning(violation))
      return
    }

    sendMutation.mutate({ body: text.trim() })
  }

  if (conversationQuery.isLoading || messagesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Spinner className="py-20" />
      </div>
    )
  }

  if (conversationQuery.isError || !conversation) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Alert variant="danger">Conversation not found or you do not have access.</Alert>
        <Link to={backTo} className="text-sm font-medium text-primary hover:underline">
          Back to messages
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <div className="flex h-[min(85dvh,calc(100dvh-8rem))] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:h-[min(88dvh,calc(100dvh-9rem))]">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-3">
          <Link to={backTo} className="rounded-full p-1.5 hover:bg-sand-deep" aria-label="Back">
            <ArrowLeft className="size-4.5" />
          </Link>
          <span
            className={clsx(
              'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              isSupport && user?.role !== 'admin' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            )}
          >
            {isSupport && user?.role !== 'admin' ? <Headset className="size-4.5" /> : initials(title)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{title}</p>
            <p className="truncate text-xs text-ink-soft">{subtitle}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {messages.length ? (
            <div className="flex flex-col gap-2.5">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={clsx(
                        'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm',
                        isMine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-sand-deep text-ink'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={clsx('mt-2 block text-xs underline', isMine ? 'text-white/90' : 'text-primary')}
                        >
                          View attachment
                        </a>
                      )}
                      <p className={clsx('mt-1 text-[10px]', isMine ? 'text-white/70' : 'text-ink-soft')}>
                        {formatRelativeTime(msg.created_at)}
                        {msg.read_at && isMine ? ' · Read' : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          ) : (
            <EmptyState
              title={isSupport ? 'How can we help?' : 'Say hello'}
              description={
                isSupport
                  ? 'Describe your issue — include your order number if you have one.'
                  : 'Start the conversation by sending a message below.'
              }
            />
          )}
        </div>

        {sendError && (
          <div className="shrink-0 px-3 pb-2">
            <Alert variant="warning" title="Message blocked">
              {sendError}
            </Alert>
          </div>
        )}

        <div className="shrink-0 border-t border-border bg-surface">
          <p className="flex items-start gap-1.5 px-3 pt-2.5 text-[11px] leading-snug text-ink-soft">
            <ShieldAlert className="mt-0.5 size-3 shrink-0 text-warning" />
            {isSupport
              ? 'Support chat — you can mention order numbers. Emails and WhatsApp are still blocked.'
              : 'Chat only — no numbers, emails, or WhatsApp / other apps (including short names).'}
          </p>

          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 pb-3 pt-2">
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                if (sendError) setSendError('')
              }}
              placeholder={isSupport ? 'Describe your issue…' : 'Type a message…'}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-sand px-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark cursor-pointer disabled:opacity-50"
              disabled={sendMutation.isPending || !text.trim()}
              aria-label="Send"
            >
              <Send className="size-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
