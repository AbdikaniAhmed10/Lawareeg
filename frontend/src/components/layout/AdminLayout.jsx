import { Link, NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'
import { isEmailVerified } from '../auth/RequireVerified'

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

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

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

  return (
    <div className="flex min-h-screen bg-sand">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-18 items-center gap-2 border-b border-border px-6">
          <span className="font-display text-xl font-semibold text-ink">
            Law<span className="text-primary">areeg</span>
          </span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-18 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div>
            <p className="font-display text-lg font-medium text-ink">Admin Panel</p>
            <p className="text-xs text-ink-soft">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
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
              className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-sand-deep hover:text-danger cursor-pointer"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
