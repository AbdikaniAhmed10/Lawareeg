import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, ExternalLink } from 'lucide-react'
import adminApi from '../../api/admin'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatDate, initials } from '../../lib/format'
import { mediaUrl } from '../../lib/mediaUrl'
import BackButton from '../../components/ui/BackButton'

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminVerifications() {
  const [tab, setTab] = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verifications', tab],
    queryFn: () => adminApi.verifications({ status: tab }),
    retry: 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })

  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveVerification(id),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectVerification(rejectTarget.id, { notes: reason }),
    onSuccess: () => {
      setRejectTarget(null)
      setReason('')
      invalidate()
    },
  })

  const items = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Seller verifications</h1>
        <p className="mt-1 text-ink-soft">Review ID documents and approve or reject verification badges.</p>
      </div>

      <div className="flex w-fit gap-1.5 rounded-xl border border-border bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.value ? 'bg-primary text-white' : 'text-ink-soft hover:bg-sand-deep hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : items.length ? (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const user = item.user
            const docUrl = mediaUrl(item.document_url)

            return (
              <div key={item.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials(user?.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{user?.name || 'User'}</p>
                        <Badge
                          variant={
                            item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-soft">{user?.email}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        ID type: <span className="capitalize text-ink">{String(item.id_type || '').replaceAll('_', ' ')}</span>
                        {' · '}Submitted {formatDate(item.created_at)}
                      </p>
                      {item.notes && <p className="mt-2 text-sm text-ink-soft">Notes: {item.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {user?.id && (
                          <Link
                            to={`/users/${user.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            View profile <ExternalLink className="size-3.5" />
                          </Link>
                        )}
                        {docUrl && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            Open document <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(item.id)}
                        loading={approveMutation.isPending}
                      >
                        <Check className="size-4" /> Approve badge
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRejectTarget(item)}>
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {docUrl && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(docUrl) && (
                  <a href={docUrl} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-xl border border-border">
                    <img src={docUrl} alt="ID document" className="max-h-64 w-full object-contain bg-sand-deep" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState title={`No ${tab} requests`} description="Verification requests will show up here." />
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null)
          setReason('')
        }}
        title="Reject verification"
      >
        <p className="mb-3 text-sm text-ink-soft">
          Tell {rejectTarget?.user?.name || 'the user'} why their request was rejected so they can resubmit.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection…"
          rows={4}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
            Reject request
          </Button>
        </div>
      </Modal>
    </div>
  )
}
