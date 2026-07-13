import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import adminApi from '../../api/admin'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import BackButton from '../../components/ui/BackButton'
import Spinner from '../../components/ui/Spinner'

const DEFAULTS = {
  commission_percent: 10,
  min_withdrawal: 20,
  bank_transfer_details: '',
  mobile_money_details: '',
  support_email: 'support@lawareeg.com',
}

export default function AdminSettings() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.settings,
    retry: 0,
  })

  useEffect(() => {
    if (data?.data) {
      setForm({
        ...DEFAULTS,
        ...data.data,
        commission_percent: data.data.commission_percent ?? data.data.commission_rate ?? DEFAULTS.commission_percent,
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: (res) => {
      setError('')
      setSaved(true)
      if (res?.data) {
        setForm({
          ...DEFAULTS,
          ...res.data,
          commission_percent: res.data.commission_percent ?? res.data.commission_rate ?? DEFAULTS.commission_percent,
        })
      }
      queryClient.setQueryData(['admin', 'settings'], res)
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (err) => {
      setSaved(false)
      setError(
        err?.response?.data?.message ||
          Object.values(err?.response?.data?.errors || {})?.[0]?.[0] ||
          'Could not save settings. Please try again.'
      )
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate({
      commission_percent: Number(form.commission_percent),
      min_withdrawal: Number(form.min_withdrawal),
      bank_transfer_details: form.bank_transfer_details,
      mobile_money_details: form.mobile_money_details,
      support_email: form.support_email,
    })
  }

  if (isLoading) return <Spinner className="py-24" />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Platform settings</h1>
        <p className="mt-1 text-ink-soft">Configure commission rates and escrow payment details.</p>
      </div>

      {saved && <Alert variant="success">Settings saved successfully.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-ink">Commission &amp; withdrawals</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Commission (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.commission_percent}
              onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
              required
            />
            <Input
              label="Minimum withdrawal (USD)"
              type="number"
              min="0"
              step="0.01"
              value={form.min_withdrawal}
              onChange={(e) => setForm({ ...form, min_withdrawal: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-ink">Escrow payment details</h2>
          <p className="mt-1 text-sm text-ink-soft">Shown to buyers during checkout.</p>
          <div className="mt-5 flex flex-col gap-4">
            <Textarea
              label="Bank transfer details"
              rows={4}
              value={form.bank_transfer_details}
              onChange={(e) => setForm({ ...form, bank_transfer_details: e.target.value })}
              required
            />
            <Textarea
              label="Mobile money details"
              rows={4}
              value={form.mobile_money_details}
              onChange={(e) => setForm({ ...form, mobile_money_details: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-ink">Support</h2>
          <Input
            className="mt-5"
            label="Support email"
            type="email"
            value={form.support_email}
            onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            required
          />
        </div>

        <Button type="submit" size="lg" loading={updateMutation.isPending} className="w-full">
          <Save className="size-4" /> Save settings
        </Button>
      </form>
    </div>
  )
}
