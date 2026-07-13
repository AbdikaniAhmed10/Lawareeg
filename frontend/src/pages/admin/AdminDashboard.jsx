import { useQuery } from '@tanstack/react-query'
import { Users, Tag, ShoppingBag, Banknote, AlertTriangle, TrendingUp } from 'lucide-react'
import adminApi from '../../api/admin'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'
import { useT } from '../../context/LanguageContext'

export default function AdminDashboard() {
  const { t } = useT()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboard,
    retry: 0,
  })

  const d = data?.data
  const stats = {
    total_users: d?.users?.total ?? 0,
    total_listings: d?.listings?.total ?? 0,
    active_orders: d?.orders?.in_progress ?? 0,
    pending_withdrawals: d?.withdrawals?.pending ?? 0,
    total_volume: d?.revenue?.total_sales_volume ?? 0,
    commission_earned: d?.revenue?.total_commission ?? 0,
  }
  const recentRaw = d?.recent_orders
  const recentOrders = Array.isArray(recentRaw) ? recentRaw : recentRaw?.data || []

  const cards = [
    { label: t('admin.stats.totalUsers'), value: formatNumber(stats.total_users), icon: Users, color: 'bg-info/10 text-info' },
    { label: t('admin.stats.totalListings'), value: formatNumber(stats.total_listings), icon: Tag, color: 'bg-primary/10 text-primary' },
    { label: t('admin.stats.activeOrders'), value: formatNumber(stats.active_orders), icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
    { label: t('admin.stats.pendingWithdrawals'), value: formatNumber(stats.pending_withdrawals), icon: Banknote, color: 'bg-danger/10 text-danger' },
    { label: t('admin.stats.totalVolume'), value: formatCurrency(stats.total_volume), icon: TrendingUp, color: 'bg-success/10 text-success' },
    { label: t('admin.stats.commissionEarned'), value: formatCurrency(stats.commission_earned), icon: AlertTriangle, color: 'bg-accent/10 text-accent' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/" label={t('common.backToMarketplace')} className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{t('admin.dashboardTitle')}</h1>
        <p className="mt-1 text-ink-soft">{t('admin.dashboardSubtitle')}</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : isError ? (
        <EmptyState title={t('common.loadError')} description={t('admin.dashboardLoadError')} />
      ) : (
        <>
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
            <h2 className="font-display text-lg font-medium text-ink">{t('admin.recentOrders')}</h2>
            {recentOrders.length ? (
              <div className="mt-4 flex flex-col divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{order.listing?.title || `${t('admin.order')} #${order.id}`}</p>
                      <p className="text-xs text-ink-soft">
                        {formatDate(order.created_at)} · {formatCurrency(order.price ?? order.amount)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('admin.noRecentOrders')}
                description={t('admin.noRecentOrdersDesc')}
                className="mt-4"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
