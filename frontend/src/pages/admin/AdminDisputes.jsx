import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Eye } from 'lucide-react'
import adminApi from '../../api/admin'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

export default function AdminDisputes() {
  const [detail, setDetail] = useState(null)
  const [resolution, setResolution] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'disputes'], queryFn: () => adminApi.disputes(), retry: 0 })

  const resolveMutation = useMutation({
    mutationFn: (outcome) => adminApi.resolveDispute(detail.id, { outcome, resolution }),
    onSuccess: () => {
      setDetail(null)
      setResolution('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
    },
  })

  const disputes = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Disputes</h1>
        <p className="mt-1 text-ink-soft">Review and resolve buyer/seller disputes fairly.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : disputes.length ? (
        <div className="flex flex-col gap-3">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-danger/20 bg-danger/5 p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <AlertTriangle className="size-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">Order #{dispute.order_id} — {dispute.listing?.title}</p>
                <p className="truncate text-sm text-ink-soft">{dispute.reason}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {dispute.buyer?.name} vs {dispute.seller?.name} · {formatDate(dispute.created_at)} · {formatCurrency(dispute.amount)}
                </p>
              </div>
              <Badge variant={dispute.status === 'resolved' ? 'success' : 'warning'}>{dispute.status || 'open'}</Badge>
              <Button size="sm" variant="secondary" onClick={() => setDetail(dispute)}>
                <Eye className="size-4" /> Review
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={AlertTriangle} title="No open disputes" description="Disputed orders will show up here for review." />
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Dispute — Order #${detail.order_id}` : ''}>
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-sand-deep/50 p-4 text-sm text-ink-soft">{detail.reason}</div>
            <Textarea label="Resolution notes" rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Explain the resolution decision…" />
            <div className="flex gap-3">
              <Button className="flex-1" variant="secondary" onClick={() => resolveMutation.mutate('refund_buyer')} disabled={!resolution.trim()}>
                Refund buyer
              </Button>
              <Button className="flex-1" onClick={() => resolveMutation.mutate('release_seller')} disabled={!resolution.trim()}>
                Release to seller
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
