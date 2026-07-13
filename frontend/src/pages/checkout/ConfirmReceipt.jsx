import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, MessageSquare, Package } from 'lucide-react'
import ordersApi from '../../api/orders'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Spinner from '../../components/ui/Spinner'
import OrderTimeline from '../../components/orders/OrderTimeline'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import { formatCurrency } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

export default function ConfirmReceipt() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')

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
    mutationFn: () => ordersApi.markTransferring(id),
    onSuccess: invalidate,
  })

  const disputeMutation = useMutation({
    mutationFn: () => ordersApi.openDispute(id, { reason: disputeReason }),
    onSuccess: () => {
      setDisputeOpen(false)
      invalidate()
    },
  })

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

  const statusHint = {
    pending_payment: 'Buyer: send payment to Lawareeg escrow, then upload your receipt.',
    payment_under_review: 'Admin is checking the payment receipt. Seller should wait.',
    payment_confirmed: 'Seller: transfer the asset to the buyer, then mark it as transferred.',
    seller_transferring: 'Seller is transferring the asset.',
    buyer_confirmation: 'Buyer: confirm you received the asset so funds can be released.',
    completed: 'Order finished. Seller wallet was credited (minus commission).',
    cancelled: 'This order was cancelled.',
    disputed: 'Admin is reviewing the dispute.',
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
          <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            {canMarkTransfer && (
              <Button size="lg" className="flex-1" loading={transferMutation.isPending} onClick={() => transferMutation.mutate()}>
                <Package className="size-4" /> I transferred the asset
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

        <div className="mt-4 text-center">
          <Link to="/dashboard/messages" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <MessageSquare className="size-3.5" /> Message the other party
          </Link>
        </div>
      </div>

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
