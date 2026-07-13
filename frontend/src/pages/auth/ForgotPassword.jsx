import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import authApi from '../../api/auth'
import BackButton from '../../components/ui/BackButton'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen atmosphere-gradient">
      <div className="flex w-full flex-col items-center justify-center px-4 py-16 sm:px-6">
        <BackButton to="/login" label="Back to sign in" className="mb-6" preferHistory={false} />
        <Link to="/" className="mb-8 font-display text-2xl font-semibold text-ink">
          Law<span className="text-primary">areeg</span>
        </Link>

        <div className="w-full max-w-md animate-fade-in-up rounded-2xl border border-border bg-surface p-8 shadow-lg">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Check your inbox</h1>
              <p className="mt-2 text-sm text-ink-soft">
                If an account exists for <strong className="text-ink">{email}</strong>, we've sent a link to reset your password.
              </p>
              <Button as={Link} to="/login" variant="secondary" className="mt-6 w-full">
                <ArrowLeft className="size-4" /> Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
              <p className="mt-1.5 text-sm text-ink-soft">Enter your email and we'll send you a reset link.</p>

              {error && <Alert variant="danger" className="mt-5">{error}</Alert>}

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Input
                  label="Email address"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
                  Send reset link <ArrowRight className="size-4" />
                </Button>
              </form>

              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="size-3.5" /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
