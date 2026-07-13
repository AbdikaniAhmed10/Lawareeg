import { useState } from 'react'
import { User, Mail, Phone, Lock, Save } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAuthStore } from '../../store/authStore'
import authApi from '../../api/auth'
import { initials } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [status, setStatus] = useState(null)
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      const res = await authApi.updateProfile(form)
      setUser(res.user || { ...user, ...form })
      setStatus({ type: 'success', message: 'Profile updated successfully.' })
    } catch (err) {
      setStatus({ type: 'danger', message: err?.response?.data?.message || 'Could not update your profile.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordStatus(null)
    setPasswordLoading(true)
    try {
      await authApi.changePassword(passwordForm)
      setPasswordStatus({ type: 'success', message: 'Password changed successfully.' })
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      setPasswordStatus({ type: 'danger', message: err?.response?.data?.message || 'Could not change password.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Profile settings</h1>
        <p className="mt-1 text-ink-soft">Manage your personal information and password.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-white">
            {initials(user?.name || 'U')}
          </span>
          <div>
            <p className="font-medium text-ink">{user?.name}</p>
            <p className="text-sm text-ink-soft">{user?.email}</p>
          </div>
        </div>

        {status && <Alert variant={status.type} className="mb-5">{status.message}</Alert>}

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" icon={User} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email address" type="email" icon={Mail} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone number" icon={Phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} containerClassName="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={loading}>
              <Save className="size-4" /> Save changes
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Change password</h2>
        {passwordStatus && <Alert variant={passwordStatus.type} className="mt-4 mb-1">{passwordStatus.message}</Alert>}
        <form onSubmit={handlePasswordSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Current password"
            type="password"
            icon={Lock}
            containerClassName="sm:col-span-2"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            icon={Lock}
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
          />
          <Input
            label="Confirm new password"
            type="password"
            icon={Lock}
            value={passwordForm.password_confirmation}
            onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" loading={passwordLoading}>
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
