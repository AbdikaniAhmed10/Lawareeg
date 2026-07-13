import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import authApi from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import { useAuthStore } from '../../store/authStore'
import { isEmailVerified } from '../../components/auth/RequireVerified'
import BrandLogo from '../../components/ui/BrandLogo'

export default function VerifyEmailNotice() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, setUser } = useAuthStore()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isEmailVerified(user)) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldError('')
    setStatus('')
    try {
      const res = await authApi.verifyEmailCode(code.trim())
      if (res?.user) setUser(res.user)
      navigate(res?.user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.code?.[0] ||
        err?.response?.data?.message ||
        'Could not verify that code.'
      setFieldError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setStatus('')
    setFieldError('')
    try {
      const res = await authApi.resendVerification()
      setStatus(res?.message || 'A new code was sent. Check your inbox (and spam).')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend the verification code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen atmosphere-gradient">
      <div className="flex w-full flex-col items-center justify-center px-4 py-16 sm:px-6">
        <BrandLogo to="/" size="lg" className="mb-8" />

        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-7" />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-semibold text-ink">Enter verification code</h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            We emailed a 6-digit code to{' '}
            <span className="font-medium text-ink">{user?.email || 'your email'}</span>. Enter it below to unlock
            your dashboard.
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

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <Input
              label="Verification code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              icon={KeyRound}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              error={fieldError}
              className="tracking-[0.35em] text-center font-semibold text-lg"
            />
            <Button type="submit" className="w-full" loading={loading} disabled={code.length !== 6}>
              Verify email
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full"
            loading={resending}
            onClick={handleResend}
          >
            <RefreshCw className="size-4" /> Resend code
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
