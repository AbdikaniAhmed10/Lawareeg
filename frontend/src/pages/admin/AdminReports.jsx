import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import adminApi from '../../api/admin'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatNumber } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'
import { useT } from '../../context/LanguageContext'

export default function AdminReports() {
  const { t } = useT()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminApi.reports(),
    retry: 0,
  })

  const report = data?.data
  const totals = report?.totals || {}
  const monthly = (report?.sales_by_month || []).map((row) => ({
    month: row.month,
    volume: Number(row.sales_volume || 0),
  }))
  const maxVolume = Math.max(...monthly.map((m) => m.volume), 1)

  const cards = [
    {
      label: t('admin.stats.totalVolume'),
      value: formatCurrency(totals.total_sales_volume ?? 0),
      icon: DollarSign,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: t('admin.stats.totalCommission'),
      value: formatCurrency(totals.total_commission ?? 0),
      icon: TrendingUp,
      color: 'bg-success/10 text-success',
    },
    {
      label: t('admin.stats.totalUsers'),
      value: formatNumber(totals.total_users ?? 0),
      icon: Users,
      color: 'bg-info/10 text-info',
    },
    {
      label: t('admin.stats.totalOrders'),
      value: formatNumber(totals.total_orders ?? totals.completed_orders ?? 0),
      icon: ShoppingBag,
      color: 'bg-warning/10 text-warning',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/admin" label={t('common.backToAdmin')} className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{t('admin.reportsTitle')}</h1>
        <p className="mt-1 text-ink-soft">{t('admin.reportsSubtitle')}</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : isError ? (
        <EmptyState title={t('common.loadError')} description={t('admin.dashboardLoadError')} />
      ) : (
        <>
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
            <h2 className="font-display text-lg font-medium text-ink">{t('admin.monthlyVolume')}</h2>
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
              <EmptyState title={t('admin.noReportData')} description={t('admin.noReportDataDesc')} className="mt-4" />
            )}
          </div>
        </>
      )}
    </div>
  )
}
