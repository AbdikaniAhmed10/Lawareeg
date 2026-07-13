import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag } from 'lucide-react'
import ordersApi from '../../api/orders'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'buyer', label: 'Buying' },
  { value: 'seller', label: 'Selling' },
]

export default function MyOrders() {
  const [tab, setTab] = useState('all')
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', tab],
    queryFn: () =>
      ordersApi.myOrders({
        role: tab === 'all' ? undefined : tab,
      }),
    retry: 0,
  })

  const orders = data?.data || []

  const actionLabel = (order) => {
    const isBuyer = user?.id === order.buyer_id || user?.id === order.buyer?.id
    const isSeller = user?.id === order.seller_id || user?.id === order.seller?.id
    if (isBuyer && order.status === 'pending_payment') return 'Upload receipt'
    if (isBuyer && order.status === 'buyer_confirmation') return 'Confirm receipt'
    if (isSeller && order.status === 'payment_confirmed') return 'Mark transferred'
    if (isSeller && order.status === 'pending_payment') return 'Waiting for payment'
    return 'View'
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My orders</h1>
        <p className="mt-1 text-ink-soft">Track the status of everything you&apos;re buying or selling.</p>
      </div>

      <div className="flex w-fit gap-1.5 rounded-xl border border-border bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.value ? 'bg-primary text-white' : 'text-ink-soft hover:bg-sand-deep'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : orders.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">Listing</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isBuyer = user?.id === order.buyer_id || user?.id === order.buyer?.id
                const href =
                  isBuyer && order.status === 'pending_payment'
                    ? `/checkout/upload-proof/${order.id}`
                    : `/checkout/confirm-receipt/${order.id}`

                return (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-sand-deep/30">
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {order.listing?.title || order.order_number || `Order #${order.id}`}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{isBuyer ? 'Buying' : 'Selling'}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(order.amount ?? order.price)}</td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button as={Link} to={href} size="sm" variant="ghost">
                        {actionLabel(order)}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Once you buy or sell an asset, your orders will appear here."
          action={
            <Button as={Link} to="/browse">
              Browse listings
            </Button>
          }
        />
      )}
    </div>
  )
}
