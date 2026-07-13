import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Tag, Wallet, Heart, ArrowRight, PlusCircle, TrendingUp, Headset } from 'lucide-react'
import ordersApi from '../../api/orders'
import listingsApi from '../../api/listings'
import walletApi from '../../api/wallet'
import Button from '../../components/ui/Button'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'
import { formatCurrency, formatDate } from '../../lib/format'

export default function Overview() {
  const { user } = useAuthStore()

  const ordersQuery = useQuery({ queryKey: ['my-orders', 'recent'], queryFn: () => ordersApi.myOrders({ per_page: 5 }), retry: 0 })
  const listingsQuery = useQuery({ queryKey: ['my-listings', 'count'], queryFn: () => listingsApi.myListings({ per_page: 5 }), retry: 0 })
  const walletQuery = useQuery({ queryKey: ['wallet', 'summary'], queryFn: walletApi.summary, retry: 0 })

  const orders = ordersQuery.data?.data || []
  const listings = listingsQuery.data?.data || []
  const wallet = walletQuery.data?.data || { available: 0, pending: 0, total_earnings: 0 }

  const stats = [
    { label: 'Available Balance', value: formatCurrency(wallet.available), icon: Wallet, color: 'text-primary' },
    { label: 'Pending Balance', value: formatCurrency(wallet.pending), icon: TrendingUp, color: 'text-warning' },
    { label: 'Active Listings', value: listings.length, icon: Tag, color: 'text-info' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-success' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/" label="Back to marketplace" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="mt-1 text-ink-soft">Here's what's happening with your account today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-5 card-hover">
            <div className={`flex size-10 items-center justify-center rounded-xl bg-sand-deep ${stat.color}`}>
              <stat.icon className="size-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{stat.value}</p>
            <p className="text-sm text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button as={Link} to="/dashboard/my-listings/new">
          <PlusCircle className="size-4" /> Create a listing
        </Button>
        <Button as={Link} to="/browse" variant="secondary">
          Browse marketplace
        </Button>
        <Button as={Link} to="/dashboard/messages?support=1" variant="outline">
          <Headset className="size-4" /> Contact support
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-ink">Recent orders</h2>
          <Link to="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-primary">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {orders.length ? (
          <div className="flex flex-col divide-y divide-border">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{order.listing?.title || `Order #${order.id}`}</p>
                  <p className="text-xs text-ink-soft">{formatDate(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No orders yet" description="Your buy and sell orders will show up here." />
        )}
      </div>
    </div>
  )
}
