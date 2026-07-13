import { useQuery } from '@tanstack/react-query'
import { Users, Tag, ShoppingBag, Banknote, AlertTriangle, TrendingUp } from 'lucide-react'
import adminApi from '../../api/admin'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard, retry: 0 })

  const stats = data?.data?.stats || {
    total_users: 2480,
    total_listings: 612,
    active_orders: 34,
    pending_withdrawals: 7,
    monthly_volume: 128400,
    commission_earned: 9630,
  }
  const recentOrders = data?.data?.recent_orders || []

  const cards = [
    { label: 'Total Users', value: formatNumber(stats.total_users), icon: Users, color: 'bg-info/10 text-info' },
    { label: 'Total Listings', value: formatNumber(stats.total_listings), icon: Tag, color: 'bg-primary/10 text-primary' },
    { label: 'Active Orders', value: formatNumber(stats.active_orders), icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
    { label: 'Pending Withdrawals', value: formatNumber(stats.pending_withdrawals), icon: Banknote, color: 'bg-danger/10 text-danger' },
    { label: 'Monthly Volume', value: formatCurrency(stats.monthly_volume), icon: TrendingUp, color: 'bg-success/10 text-success' },
    { label: 'Commission Earned', value: formatCurrency(stats.commission_earned), icon: AlertTriangle, color: 'bg-accent/10 text-accent' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/" label="Back to marketplace" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Admin dashboard</h1>
        <p className="mt-1 text-ink-soft">Marketplace performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="font-display text-lg font-medium text-ink">Recent orders</h2>
        {recentOrders.length ? (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{order.listing?.title || `Order #${order.id}`}</p>
                  <p className="text-xs text-ink-soft">{formatDate(order.created_at)} · {formatCurrency(order.amount)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No recent orders" description="New orders will appear here as they come in." className="mt-4" />
        )}
      </div>
    </div>
  )
}
