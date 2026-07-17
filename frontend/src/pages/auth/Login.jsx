import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import authApi from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { isEmailVerified } from '../../components/auth/RequireVerified'
import BackButton from '../../components/ui/BackButton'
import BrandLogo from '../../components/ui/BrandLogo'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const justVerified = searchParams.get('verified') === '1'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      setAuth(res.user, res.token || res.access_token)
      if (!isEmailVerified(res.user)) {
        navigate('/verify-email')
        return
      }
      const redirectTo = location.state?.from || (res.user?.role === 'admin' ? '/admin' : '/dashboard')
      navigate(redirectTo, { replace: true })
      // Ensure first paint of admin/dashboard is at the top (nested main scrolls too).
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
        document.querySelectorAll('[data-scroll-root], main').forEach((el) => {
          if (el instanceof HTMLElement) el.scrollTop = 0
        })
      })
    } catch (err) {
      const apiErrors = err?.response?.data?.errors
      const status = err?.response?.status
      const code = err?.code || ''
      const netMsg = String(err?.message || '')
      if (!err?.response) {
        // Chrome extensions (uBlock/AdGuard) often block /api/auth/* → axios "Network Error"
        // with no response. Incognito works because extensions are off there.
        const blocked =
          code === 'ERR_BLOCKED_BY_CLIENT' ||
          /blocked|ERR_BLOCKED/i.test(netMsg) ||
          code === 'ERR_NETWORK' ||
          /Network Error/i.test(netMsg)
        setError(
          blocked
            ? 'Chrome (or an extension) blocked the sign-in request. Turn off ad blockers for lawareeg.com, or use Incognito. This is not a wrong password.'
            : 'Cannot reach the server. Check your connection, disable VPN/ad-block, then try again.'
        )
      } else if (status >= 500) {
        setError('Server error during sign-in. Please try again shortly.')
      } else {
        setError(
          apiErrors?.email?.[0] ||
            apiErrors?.password?.[0] ||
            err?.response?.data?.message ||
            'Incorrect email or password. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen atmosphere-gradient">
      <div className="flex w-full flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="mb-6 flex w-full max-w-md items-center justify-between gap-3">
          <BackButton to="/" label="Back to home" preferHistory={false} />
        </div>
        <BrandLogo to="/" size="lg" className="mb-8" />

        <div className="w-full max-w-md animate-fade-in-up rounded-2xl border border-border bg-surface p-8 shadow-lg">
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Sign in to manage your listings, orders and wallet.</p>

          {justVerified && (
            <Alert variant="success" className="mt-5">
              Email verified. Sign in to continue.
            </Alert>
          )}

          {error && <Alert variant="danger" className="mt-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Link to="/forgot-password" className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              Sign in <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-soft">
          <ShieldCheck className="size-3.5 text-primary" /> Your data is protected and never shared.
        </p>
      </div>
    </div>
  )
}
