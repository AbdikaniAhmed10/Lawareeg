import { NavLink, Outlet, Navigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  User,
  Heart,
  ShoppingBag,
  Tag,
  PlusCircle,
  MessageSquare,
  Wallet,
  Bell,
  Star,
  BadgeCheck,
  Banknote,
} from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuthStore } from '../../store/authStore'
import { initials } from '../../lib/format'
import { isEmailVerified } from '../auth/RequireVerified'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
  { to: '/dashboard/favorites', label: 'Favorites', icon: Heart },
  { to: '/dashboard/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/dashboard/my-listings', label: 'My Listings', icon: Tag },
  { to: '/dashboard/my-listings/new', label: 'Create Listing', icon: PlusCircle },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { to: '/dashboard/seller-verification', label: 'Seller Verification', icon: BadgeCheck },
  { to: '/dashboard/withdrawals', label: 'Withdrawals', icon: Banknote },
]

export default function DashboardLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerified(user)) {
    return <Navigate to="/verify-email" replace />
  }

  // Admins manage the platform in /admin — not as buyers/sellers.
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-2">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {initials(user?.name || 'U')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-soft">{user?.email}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-ink-soft hover:bg-sand-deep hover:text-ink'
                    )
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
