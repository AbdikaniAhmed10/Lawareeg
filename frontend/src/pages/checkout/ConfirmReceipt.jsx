import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, MessageSquare, Package } from 'lucide-react'
import ordersApi from '../../api/orders'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import OrderTimeline from '../../components/orders/OrderTimeline'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import { formatCurrency } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

const EMPTY_HANDOVER = {
  username: '',
  email: '',
  password: '',
  recovery_email: '',
  recovery_phone: '',
  auth_code: '',
  admin_invite: '',
  extra: '',
}

const DETAIL_LABELS = {
  username: 'Username / handle',
  email: 'Login email',
  password: 'Password',
  recovery_email: 'Recovery email',
  recovery_phone: 'Recovery phone',
  auth_code: 'Auth / transfer code',
  admin_invite: 'Admin invite link',
  transfer_method: 'Transfer method',
  extra: 'Extra steps',
}

export default function ConfirmReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [handoverNotes, setHandoverNotes] = useState('')
  const [handoverDetails, setHandoverDetails] = useState(EMPTY_HANDOVER)
  const [handoverFile, setHandoverFile] = useState(null)
  const [chatError, setChatError] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.detail(id),
    retry: 0,
    enabled: !!id && !String(id).startsWith('demo-'),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['order', id] })

  const confirmMutation = useMutation({
    mutationFn: () => ordersApi.confirmReceipt(id),
    onSuccess: invalidate,
  })

  const transferMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      if (handoverNotes.trim()) formData.append('notes', handoverNotes.trim())
      Object.entries(handoverDetails).forEach(([key, value]) => {
        if (String(value || '').trim()) {
          formData.append(`details[${key}]`, String(value).trim())
        }
      })
      if (handoverFile) formData.append('attachment', handoverFile)
      return ordersApi.markTransferring(id, formData)
    },
    onSuccess: () => {
      setHandoverOpen(false)
      setHandoverNotes('')
      setHandoverDetails(EMPTY_HANDOVER)
      setHandoverFile(null)
      invalidate()
    },
  })

  const disputeMutation = useMutation({
    mutationFn: () => ordersApi.openDispute(id, { reason: disputeReason }),
    onSuccess: () => {
      setDisputeOpen(false)
      invalidate()
    },
  })

  const openOrderChat = async () => {
    setChatError('')
    try {
      const res = await ordersApi.conversation(id)
      const conversationId = res?.data?.id
      if (conversationId) {
        navigate(`/dashboard/messages/${conversationId}`)
      }
    } catch (err) {
      setChatError(
        err?.response?.data?.errors?.order?.[0] ||
          err?.response?.data?.message ||
          'Order chat is not available yet.'
      )
    }
  }

  if (isLoading) return <Spinner className="py-24" />

  const order = data?.data
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <BackButton to="/dashboard/orders" label="Back to orders" className="mb-4" preferHistory={false} />
        <Alert variant="danger">
          {error?.response?.data?.message || 'Order not found. Make sure you are logged in and the order exists.'}
        </Alert>
        <Button as={Link} to="/dashboard/orders" className="mt-4">
          Back to orders
        </Button>
      </div>
    )
  }

  const amount = order.amount ?? order.price
  const isBuyer = user?.id === order.buyer_id || user?.id === order.buyer?.id
  const isSeller = user?.id === order.seller_id || user?.id === order.seller?.id
  const canConfirm = isBuyer && (order.status === 'buyer_confirmation' || order.status === 'seller_transferring')
  const canMarkTransfer = isSeller && order.status === 'payment_confirmed'
  const hasHandover =
    Boolean(order.handover_notes) ||
    Boolean(order.handover_attachment_url) ||
    (order.handover_details && Object.keys(order.handover_details).length > 0)
  const canOpenChat = [
    'payment_confirmed',
    'seller_transferring',
    'buyer_confirmation',
    'completed',
    'disputed',
  ].includes(order.status)

  const statusHint = {
    pending_payment: 'Buyer: send payment to Lawareeg escrow, then upload your receipt.',
    payment_under_review: 'Admin is checking the payment receipt. Seller should wait.',
    payment_confirmed: 'Seller: send transfer details to the buyer, then mark the asset as transferred.',
    seller_transferring: 'Seller is transferring the asset.',
    buyer_confirmation: 'Buyer: review transfer details, then confirm you received the asset so funds can be released.',
    completed: 'Order finished. Seller wallet was credited (minus commission).',
    cancelled: 'This order was cancelled.',
    disputed: 'Admin is reviewing the dispute. Use order chat if needed.',
  }[order.status]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/dashboard/orders" label="Back to orders" className="mb-4" />
      <h1 className="font-display text-2xl font-semibold text-ink">Order status</h1>
      <p className="mt-1 text-ink-soft">Track escrow progress for this trade</p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-sm text-ink-soft">{order.order_number || `Order #${order.id}`}</p>
            <p className="font-medium text-ink">{order.listing?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-display text-xl font-semibold text-ink">{formatCurrency(amount)}</p>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {statusHint && (
          <Alert variant="info" className="mt-5">
            {statusHint}
          </Alert>
        )}

        {(order.payment_method_instructions || order.payment_proof_url) && (
          <div className="mt-5 rounded-xl border border-border bg-sand-deep/40 p-4 text-sm">
            {order.payment_method_instructions && (
              <div className="mb-3">
                <p className="font-medium text-ink">Payment instructions (pay Lawareeg, not the seller)</p>
                <pre className="mt-2 whitespace-pre-wrap text-ink-soft">{order.payment_method_instructions}</pre>
              </div>
            )}
            {order.payment_proof_url && (
              <div>
                <p className="font-medium text-ink">Payment receipt</p>
                <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-primary hover:underline">
                  View uploaded proof
                </a>
              </div>
            )}
          </div>
        )}

        {hasHandover && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium text-ink">Transfer details from seller</p>
            <p className="mt-1 text-xs text-ink-soft">
              Only buyer, seller, and admin can see this. Change passwords after you confirm access.
            </p>
            {order.handover_notes && (
              <pre className="mt-3 whitespace-pre-wrap text-ink">{order.handover_notes}</pre>
            )}
            {order.handover_details && (
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(order.handover_details).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border bg-surface px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{DETAIL_LABELS[key] || key}</dt>
                    <dd className="mt-0.5 break-all font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {order.handover_attachment_url && (
              <a
                href={order.handover_attachment_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-primary hover:underline"
              >
                Download handover attachment
              </a>
            )}
          </div>
        )}

        <div className="py-6">
          <OrderTimeline status={order.status} events={order.events} />
        </div>

        {order.status === 'completed' ? (
          <Alert variant="success" title="Order completed" className="mt-2">
            Funds have been credited to the seller wallet (minus Lawareeg commission).
          </Alert>
        ) : order.status === 'cancelled' ? (
          <Alert variant="danger" title="Order cancelled" className="mt-2">
            {order.cancel_reason || 'This order was cancelled.'}
          </Alert>
        ) : (
          <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
            {canMarkTransfer && (
              <Button size="lg" className="flex-1" onClick={() => setHandoverOpen(true)}>
                <Package className="size-4" /> Send transfer details
              </Button>
            )}
            {canConfirm && (
              <Button size="lg" className="flex-1" loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                <CheckCircle2 className="size-4" /> Confirm I received the asset
              </Button>
            )}
            {(isBuyer || isSeller) && order.status !== 'disputed' && (
              <Button size="lg" variant="secondary" className="flex-1" onClick={() => setDisputeOpen(true)}>
                <AlertTriangle className="size-4" /> Open a dispute
              </Button>
            )}
          </div>
        )}

        {canOpenChat && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={openOrderChat}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <MessageSquare className="size-3.5" /> Open order chat
            </button>
            <p className="mt-1 text-xs text-ink-soft">
              Buyer &amp; seller can share login details here. Admins can join too. WhatsApp links are still blocked.
            </p>
            {chatError && <p className="mt-2 text-xs text-warning">{chatError}</p>}
          </div>
        )}
      </div>

      <Modal open={handoverOpen} onClose={() => setHandoverOpen(false)} title="Send transfer details">
        <p className="text-sm text-ink-soft">
          Tell the buyer exactly how to take over the asset. These details appear on the order page and stay private to this trade.
        </p>
        <Textarea
          className="mt-4"
          rows={4}
          label="Handover notes"
          placeholder="Example: I changed the email to yours and added you as admin. Login, then change the password."
          value={handoverNotes}
          onChange={(e) => setHandoverNotes(e.target.value)}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Username / handle"
            value={handoverDetails.username}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, username: e.target.value }))}
          />
          <Input
            label="Login email"
            value={handoverDetails.email}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, email: e.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={handoverDetails.password}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, password: e.target.value }))}
          />
          <Input
            label="Recovery email"
            value={handoverDetails.recovery_email}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, recovery_email: e.target.value }))}
          />
          <Input
            label="Recovery phone"
            value={handoverDetails.recovery_phone}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, recovery_phone: e.target.value }))}
          />
          <Input
            label="Auth / transfer code"
            value={handoverDetails.auth_code}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, auth_code: e.target.value }))}
          />
          <Input
            label="Admin invite link"
            containerClassName="sm:col-span-2"
            value={handoverDetails.admin_invite}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, admin_invite: e.target.value }))}
          />
          <Textarea
            label="Extra steps"
            containerClassName="sm:col-span-2"
            rows={3}
            value={handoverDetails.extra}
            onChange={(e) => setHandoverDetails((d) => ({ ...d, extra: e.target.value }))}
          />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">Screenshot / PDF (optional)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setHandoverFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-ink-soft"
          />
        </div>
        {(transferMutation.error || transferMutation.isError) && (
          <Alert variant="danger" className="mt-3">
            {transferMutation.error?.response?.data?.errors?.notes?.[0] ||
              transferMutation.error?.response?.data?.errors?.order?.[0] ||
              transferMutation.error?.response?.data?.message ||
              'Could not submit transfer details.'}
          </Alert>
        )}
        <Button
          className="mt-4 w-full"
          loading={transferMutation.isPending}
          onClick={() => transferMutation.mutate()}
        >
          Submit details &amp; mark transferred
        </Button>
      </Modal>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Open a dispute">
        <p className="text-sm text-ink-soft">
          Describe the problem. Admin will review both sides and either refund the buyer or release payment to the seller.
        </p>
        <Textarea
          className="mt-4"
          rows={5}
          placeholder="Describe the issue with your order…"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />
        <Button
          className="mt-4 w-full"
          variant="danger"
          loading={disputeMutation.isPending}
          onClick={() => disputeMutation.mutate()}
          disabled={!disputeReason.trim()}
        >
          Submit dispute
        </Button>
      </Modal>
    </div>
  )
}
