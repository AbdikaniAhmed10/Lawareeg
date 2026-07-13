import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import authApi from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.user, res.token || res.access_token)
      navigate('/verify-email')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create your account. Please check your details.')
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
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Join Lawareeg to buy and sell digital assets safely.</p>

          {error && <Alert variant="danger" className="mt-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Full name"
              icon={User}
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              icon={Lock}
              placeholder="Re-enter your password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required
            />

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              Create account <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-soft">
          <ShieldCheck className="size-3.5 text-primary" /> Every purchase is protected by manual escrow.
        </p>
      </div>
    </div>
  )
}
