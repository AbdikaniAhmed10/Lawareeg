import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import {
  BadgeCheck,
  Headset,
  LayoutDashboard,
  Users,
  Tag,
  ShoppingBag,
  Banknote,
  FolderTree,
  AlertTriangle,
  Settings,
  BarChart3,
  ArrowLeft,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'
import { isEmailVerified } from '../auth/RequireVerified'
import BrandLogo from '../ui/BrandLogo'
import Footer from './Footer'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/verifications', label: 'Verifications', icon: BadgeCheck },
  { to: '/admin/listings', label: 'Listings', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { to: '/admin/support', label: 'Support', icon: Headset },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminNav({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-4">
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

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll('[data-scroll-root], main').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.scrollTop = 0
      }
    })
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerified(user)) {
    return <Navigate to="/verify-email" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen bg-sand">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-18 items-center gap-2 border-b border-border px-5">
          <BrandLogo to="/admin" size="sm" />
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
        </div>
        <AdminNav />
        <div className="flex flex-col gap-1 border-t border-border p-4">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-sand-deep hover:text-primary">
            <ArrowLeft className="size-4" /> View marketplace
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10 cursor-pointer"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={closeMenu} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-surface shadow-xl animate-fade-in">
            <div className="flex h-18 items-center gap-2 border-b border-border px-4">
              <BrandLogo to="/admin" size="sm" />
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
              <button
                type="button"
                onClick={closeMenu}
                className="ml-auto flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand-deep cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <AdminNav onNavigate={closeMenu} />
              <div className="flex flex-col gap-1 border-t border-border p-4">
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-sand-deep hover:text-primary"
                >
                  <ArrowLeft className="size-4" /> View marketplace
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10 cursor-pointer"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-18 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-sand-deep text-ink shadow-sm hover:bg-primary/10 hover:text-primary lg:hidden cursor-pointer"
              aria-label="Open admin menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display text-lg font-medium text-ink">Admin Panel</p>
              <p className="truncate text-xs text-ink-soft">{user?.email}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-deep hover:text-ink cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-sand-deep hover:text-danger cursor-pointer sm:flex"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main data-scroll-root className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <Footer compact />
      </div>
    </div>
  )
}
