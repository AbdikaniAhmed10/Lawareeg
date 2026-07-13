import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Sun,
  Moon,
  Heart,
  MessageSquare,
  Bell,
  Wallet,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../../context/ThemeContext'
import { useAuthStore } from '../../store/authStore'
import Button from '../ui/Button'
import BrandLogo from '../ui/BrandLogo'
import { initials } from '../../lib/format'

const NAV_LINKS = [
  { to: '/browse', label: 'Browse' },
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/faq', label: 'FAQ' },
]

const DASHBOARD_MOBILE_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/orders', label: 'My Orders' },
  { to: '/dashboard/my-listings', label: 'My Listings' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/wallet', label: 'Wallet' },
  { to: '/dashboard/profile', label: 'Profile' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl min-w-0 items-center justify-between gap-2 px-3 sm:h-18 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <BrandLogo to={isAdmin ? '/admin' : '/'} size="sm" />

          {!isAdmin && (
            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      'link-underline text-sm font-medium transition-colors',
                      isActive ? 'text-primary' : 'text-ink-soft hover:text-ink'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
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

          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <>
                  <Link
                    to="/dashboard/favorites"
                    className="hidden size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-deep hover:text-ink sm:flex cursor-pointer"
                  >
                    <Heart className="size-4.5" />
                  </Link>
                  <Link
                    to="/dashboard/messages"
                    className="hidden size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-deep hover:text-ink sm:flex cursor-pointer"
                  >
                    <MessageSquare className="size-4.5" />
                  </Link>
                  <Link
                    to="/dashboard/notifications"
                    className="hidden size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-deep hover:text-ink sm:flex cursor-pointer"
                  >
                    <Bell className="size-4.5" />
                  </Link>
                </>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-sand-deep cursor-pointer"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {initials(user?.name || 'U')}
                  </span>
                  <ChevronDown className="hidden size-3.5 text-ink-soft sm:block" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 animate-fade-in-up rounded-xl border border-border bg-surface p-1.5 shadow-xl">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
                        <p className="text-xs text-ink-soft truncate">{user?.email}</p>
                        {isAdmin && (
                          <p className="mt-1 text-xs font-medium text-primary">Platform admin</p>
                        )}
                      </div>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-deep hover:text-ink"
                        >
                          <LayoutDashboard className="size-4" /> Admin Panel
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-deep hover:text-ink"
                          >
                            <LayoutDashboard className="size-4" /> Dashboard
                          </Link>
                          <Link
                            to="/dashboard/wallet"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-deep hover:text-ink"
                          >
                            <Wallet className="size-4" /> Wallet
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 cursor-pointer"
                      >
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/register" variant="primary" size="sm">
                Get started
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand-deep lg:hidden cursor-pointer"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-border bg-surface px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {!isAdmin &&
              NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-primary/10 text-primary' : 'text-ink-soft hover:bg-sand-deep'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            {isAuthenticated && !isAdmin && (
              <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Account</p>
                {DASHBOARD_MOBILE_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/dashboard'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'rounded-lg px-3 py-2.5 text-sm font-medium',
                        isActive ? 'bg-primary/10 text-primary' : 'text-ink-soft hover:bg-sand-deep'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
              >
                Admin Panel
              </Link>
            )}
            {!isAuthenticated && (
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <Button as={Link} to="/login" variant="secondary" onClick={() => setOpen(false)}>
                  Sign in
                </Button>
                <Button as={Link} to="/register" variant="primary" onClick={() => setOpen(false)}>
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
