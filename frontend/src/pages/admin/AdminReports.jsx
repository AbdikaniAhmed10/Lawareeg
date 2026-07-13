import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import adminApi from '../../api/admin'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency, formatNumber } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

const MOCK_MONTHLY = [
  { month: 'Feb', volume: 62000 },
  { month: 'Mar', volume: 74500 },
  { month: 'Apr', volume: 81200 },
  { month: 'May', volume: 96800 },
  { month: 'Jun', volume: 112400 },
  { month: 'Jul', volume: 128400 },
]

export default function AdminReports() {
  const { data } = useQuery({ queryKey: ['admin', 'reports'], queryFn: () => adminApi.reports(), retry: 0 })

  const report = data?.data || {
    total_volume: 555300,
    total_commission: 44424,
    total_users: 2480,
    total_orders: 1204,
    monthly: MOCK_MONTHLY,
  }

  const monthly = report.monthly?.length ? report.monthly : MOCK_MONTHLY
  const maxVolume = Math.max(...monthly.map((m) => m.volume), 1)

  const cards = [
    { label: 'Total Volume', value: formatCurrency(report.total_volume), icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Total Commission', value: formatCurrency(report.total_commission), icon: TrendingUp, color: 'bg-success/10 text-success' },
    { label: 'Total Users', value: formatNumber(report.total_users), icon: Users, color: 'bg-info/10 text-info' },
    { label: 'Total Orders', value: formatNumber(report.total_orders), icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-ink-soft">Marketplace performance and financial overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface p-5">
            <div className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="size-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{card.value}</p>
            <p className="text-sm text-ink-soft">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Monthly transaction volume</h2>
        {monthly.length ? (
          <div className="mt-8 flex items-end gap-4 sm:gap-6">
            {monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <p className="text-xs font-medium text-ink-soft">{formatCurrency(m.volume)}</p>
                <div
                  className="w-full max-w-12 rounded-t-lg bg-primary/80 transition-all duration-500"
                  style={{ height: `${Math.max((m.volume / maxVolume) * 180, 8)}px` }}
                />
                <p className="text-xs text-ink-soft">{m.month}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No data yet" description="Reports will populate as transactions occur." className="mt-4" />
        )}
      </div>
    </div>
  )
}
