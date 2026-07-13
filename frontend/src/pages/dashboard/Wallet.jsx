import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet as WalletIcon, TrendingUp, Clock, ArrowDownToLine, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import clsx from 'clsx'
import walletApi from '../../api/wallet'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

export default function Wallet() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'bank_transfer', account_details: '' })
  const [error, setError] = useState('')

  const summaryQuery = useQuery({ queryKey: ['wallet', 'summary'], queryFn: walletApi.summary, retry: 0 })
  const transactionsQuery = useQuery({ queryKey: ['wallet', 'transactions'], queryFn: () => walletApi.transactions(), retry: 0 })

  const withdrawMutation = useMutation({
    mutationFn: walletApi.requestWithdrawal,
    onSuccess: () => {
      setModalOpen(false)
      setForm({ amount: '', method: 'bank_transfer', account_details: '' })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (err) => setError(err?.response?.data?.message || 'Could not submit withdrawal request.'),
  })

  const wallet = summaryQuery.data?.data || { available: 0, pending: 0, total_earnings: 0, currency: 'USD' }
  const transactions = transactionsQuery.data?.data || []

  const cards = [
    { label: 'Available balance', value: wallet.available, icon: WalletIcon, color: 'bg-primary/10 text-primary' },
    { label: 'Pending balance', value: wallet.pending, icon: Clock, color: 'bg-warning/10 text-warning' },
    { label: 'Total earnings', value: wallet.total_earnings, icon: TrendingUp, color: 'bg-success/10 text-success' },
  ]

  const handleWithdraw = (e) => {
    e.preventDefault()
    setError('')
    withdrawMutation.mutate(form)
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Wallet</h1>
          <p className="mt-1 text-ink-soft">Track your earnings and manage withdrawals.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <ArrowDownToLine className="size-4" /> Request withdrawal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface p-5 card-hover">
            <div className={clsx('flex size-10 items-center justify-center rounded-xl', card.color)}>
              <card.icon className="size-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{formatCurrency(card.value)}</p>
            <p className="text-sm text-ink-soft">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Transaction history</h2>
        {transactionsQuery.isLoading ? (
          <Spinner className="py-12" />
        ) : transactions.length ? (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 py-3.5">
                <div
                  className={clsx(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    tx.type === 'credit' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  )}
                >
                  {tx.type === 'credit' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{tx.description}</p>
                  <p className="text-xs text-ink-soft">{formatDate(tx.created_at, 'MMM d, yyyy · h:mm a')}</p>
                </div>
                <p className={clsx('shrink-0 font-medium', tx.type === 'credit' ? 'text-success' : 'text-danger')}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No transactions yet" description="Completed sales and withdrawals will appear here." />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request withdrawal">
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
          <Input
            label="Amount (USD)"
            type="number"
            min="1"
            max={wallet.available}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            hint={`Available: ${formatCurrency(wallet.available)}`}
            required
          />
          <Select label="Withdrawal method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="mobile_money">Mobile money</option>
          </Select>
          <Input
            label="Account details"
            placeholder="Account number / mobile money number"
            value={form.account_details}
            onChange={(e) => setForm({ ...form, account_details: e.target.value })}
            required
          />
          <Button type="submit" loading={withdrawMutation.isPending} className="mt-1 w-full">
            Submit request
          </Button>
        </form>
      </Modal>
    </div>
  )
}
