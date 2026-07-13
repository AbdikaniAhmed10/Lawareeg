import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import authApi from '../../api/auth'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'

export default function VerifyEmailConfirm() {
  const { id, hash } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token, setUser, user } = useAuthStore()
  const [state, setState] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const query = Object.fromEntries(searchParams.entries())
        const res = await authApi.verifyEmail(id, hash, query)
        if (cancelled) return
        setState('success')
        setMessage(res?.message || 'Email verified successfully.')

        if (token) {
          try {
            const me = await authApi.me()
            if (me?.user) setUser(me.user)
          } catch {
            // ignore — user can sign in
          }
        }
      } catch (err) {
        if (cancelled) return
        setState('error')
        setMessage(
          err?.response?.data?.message ||
            err?.response?.data?.errors?.email?.[0] ||
            'This verification link is invalid or has expired.'
        )
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id, hash, searchParams, token, setUser])

  return (
    <div className="flex min-h-screen atmosphere-gradient">
      <div className="flex w-full flex-col items-center justify-center px-4 py-16">
        <Link to="/" className="mb-8 font-display text-2xl font-semibold text-ink">
          Law<span className="text-primary">areeg</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
          {state === 'loading' && (
            <>
              <Loader2 className="mx-auto size-10 animate-spin text-primary" />
              <p className="mt-4 text-ink-soft">Verifying your email…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Email verified</h1>
              <p className="mt-2 text-sm text-ink-soft">{message}</p>
              <Button
                className="mt-6 w-full"
                onClick={() => {
                  if (user?.email_verified || user?.email_verified_at) {
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard')
                  } else {
                    navigate('/login?verified=1')
                  }
                }}
              >
                Continue
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
                <XCircle className="size-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Verification failed</h1>
              <p className="mt-2 text-sm text-ink-soft">{message}</p>
              <Button as={Link} to="/verify-email" className="mt-6 w-full">
                Request a new link
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
