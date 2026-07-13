import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import authApi from '../../api/auth'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAuthStore } from '../../store/authStore'
import { isEmailVerified } from '../../components/auth/RequireVerified'

export default function VerifyEmailNotice() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isEmailVerified(user)) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    setStatus('')
    try {
      const res = await authApi.resendVerification()
      setStatus(res?.message || 'Verification email sent. Check your inbox (and spam folder).')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen atmosphere-gradient">
      <div className="flex w-full flex-col items-center justify-center px-4 py-16 sm:px-6">
        <Link to="/" className="mb-8 font-display text-2xl font-semibold text-ink">
          Law<span className="text-primary">areeg</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-7" />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-semibold text-ink">Verify your email</h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            We sent a verification link to{' '}
            <span className="font-medium text-ink">{user?.email || 'your email'}</span>. Open it to unlock your
            dashboard.
          </p>

          {status && (
            <Alert variant="success" className="mt-5">
              {status}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="mt-5">
              {error}
            </Alert>
          )}

          <Button className="mt-6 w-full" loading={loading} onClick={handleResend}>
            <RefreshCw className="size-4" /> Resend verification email
          </Button>

          <button
            type="button"
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
            className="mt-4 w-full text-center text-sm font-medium text-ink-soft hover:text-primary cursor-pointer"
          >
            Sign out and use a different account
          </button>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-soft">
          <ShieldCheck className="size-3.5 text-primary" /> Email verification protects accounts and escrow trades.
        </p>
      </div>
    </div>
  )
}
