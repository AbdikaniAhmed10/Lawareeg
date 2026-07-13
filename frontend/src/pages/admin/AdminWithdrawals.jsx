import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Banknote } from 'lucide-react'
import adminApi from '../../api/admin'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

const STATUS_VARIANTS = { pending: 'warning', approved: 'info', paid: 'success', rejected: 'danger' }

export default function AdminWithdrawals() {
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'withdrawals'], queryFn: () => adminApi.withdrawals(), retry: 0 })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
  const approveMutation = useMutation({ mutationFn: adminApi.approveWithdrawal, onSuccess: invalidate })
  const markPaidMutation = useMutation({ mutationFn: adminApi.markWithdrawalPaid, onSuccess: invalidate })
  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectWithdrawal(rejectTarget.id, { reason }),
    onSuccess: () => {
      setRejectTarget(null)
      setReason('')
      invalidate()
    },
  })

  const withdrawals = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Withdrawals</h1>
        <p className="mt-1 text-ink-soft">Review and process seller withdrawal requests.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : withdrawals.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">User</th>
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Method</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Requested</th>
                <th className="px-5 py-3.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-sand-deep/30">
                  <td className="px-5 py-3.5 font-medium text-ink">{w.user?.name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(w.amount)}</td>
                  <td className="px-5 py-3.5 text-ink-soft capitalize">{w.method?.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5"><Badge variant={STATUS_VARIANTS[w.status] || 'neutral'}>{w.status}</Badge></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(w.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {w.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate(w.id)}>
                            <Check className="size-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectTarget(w)}>
                            <X className="size-4 text-danger" />
                          </Button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <Button size="sm" variant="secondary" onClick={() => markPaidMutation.mutate(w.id)}>
                          <Banknote className="size-4" /> Mark paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Banknote} title="No withdrawal requests" description="Seller withdrawal requests will appear here." />
      )}

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject withdrawal">
        <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" />
        <Button className="mt-4 w-full" variant="danger" onClick={() => rejectMutation.mutate()} disabled={!reason.trim()}>
          Reject request
        </Button>
      </Modal>
    </div>
  )
}
