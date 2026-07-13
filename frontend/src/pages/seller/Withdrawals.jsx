import { useQuery } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import walletApi from '../../api/wallet'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

const STATUS_VARIANTS = {
  pending: 'warning',
  approved: 'info',
  paid: 'success',
  rejected: 'danger',
}

export default function Withdrawals() {
  const { data, isLoading } = useQuery({ queryKey: ['withdrawals'], queryFn: () => walletApi.withdrawals(), retry: 0 })
  const withdrawals = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard/wallet" label="Back to wallet" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Withdrawal history</h1>
        <p className="mt-1 text-ink-soft">Track your withdrawal requests and payouts.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : withdrawals.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Method</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Requested</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-medium text-ink">{formatCurrency(w.amount)}</td>
                  <td className="px-5 py-3.5 text-ink-soft capitalize">{w.method?.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5"><Badge variant={STATUS_VARIANTS[w.status] || 'neutral'}>{w.status}</Badge></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(w.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Banknote} title="No withdrawals yet" description="Withdrawal requests you submit from your wallet will appear here." />
      )}
    </div>
  )
}
