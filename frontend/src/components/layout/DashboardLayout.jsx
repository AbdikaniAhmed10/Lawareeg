import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom'
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
  Menu,
  X,
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

const MOBILE_CHIPS = [
  { to: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/dashboard/my-listings', label: 'Listings', icon: Tag },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { to: '/dashboard/my-listings/new', label: 'Sell', icon: PlusCircle },
]

function DashboardNav({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
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
  )
}

export default function DashboardLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerified(user)) {
    return <Navigate to="/verify-email" replace />
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={closeMenu} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-surface shadow-xl animate-fade-in">
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {initials(user?.name || 'U')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-soft">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand-deep cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DashboardNav onNavigate={closeMenu} />
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-3 border-b border-border pb-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {initials(user?.name || 'U')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-soft">{user?.email}</p>
              </div>
            </div>
            <DashboardNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-ink shadow-sm hover:bg-primary/10 hover:text-primary cursor-pointer"
              aria-label="Open dashboard menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display text-base font-medium text-ink">My dashboard</p>
              <p className="truncate text-xs text-ink-soft">Tap menu for all pages</p>
            </div>
          </div>

          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {MOBILE_CHIPS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-ink shadow-sm"
              >
                <item.icon className="size-4 text-primary" />
                {item.label}
              </Link>
            ))}
          </div>

          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
