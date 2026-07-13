import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Send, RotateCcw, Eye, MessageSquare } from 'lucide-react'
import adminApi from '../../api/admin'
import ordersApi from '../../api/orders'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import { ORDER_STATUSES } from '../../lib/constants'
import BackButton from '../../components/ui/BackButton'

export default function AdminOrders() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [refundTarget, setRefundTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState(null)
  const [chatError, setChatError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', statusFilter],
    queryFn: () => adminApi.orders({ status: statusFilter || undefined }),
    retry: 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })

  const confirmPaymentMutation = useMutation({ mutationFn: adminApi.confirmPayment, onSuccess: invalidate })
  const releaseFundsMutation = useMutation({ mutationFn: adminApi.releaseFunds, onSuccess: invalidate })
  const refundMutation = useMutation({
    mutationFn: () => adminApi.refundOrder(refundTarget.id, { reason }),
    onSuccess: () => {
      setRefundTarget(null)
      setReason('')
      invalidate()
    },
  })

  const openOrderChat = async (orderId) => {
    setChatError('')
    try {
      const res = await ordersApi.conversation(orderId)
      const conversationId = res?.data?.id
      if (conversationId) {
        setDetail(null)
        navigate(`/admin/support/${conversationId}`)
      }
    } catch (err) {
      setChatError(
        err?.response?.data?.errors?.order?.[0] ||
          err?.response?.data?.message ||
          'Could not open order chat.'
      )
    }
  }

  const orders = data?.data || []
  const detailLabels = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    recovery_email: 'Recovery email',
    recovery_phone: 'Recovery phone',
    auth_code: 'Auth code',
    admin_invite: 'Admin invite',
    transfer_method: 'Method',
    extra: 'Extra',
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Orders</h1>
          <p className="mt-1 text-ink-soft">Manage payment confirmations, fund releases and refunds.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : orders.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">Order</th>
                <th className="px-5 py-3.5 font-medium">Buyer / Seller</th>
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-sand-deep/30">
                  <td className="px-5 py-3.5 font-medium text-ink">#{order.id} — {order.listing?.title}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{order.buyer?.name} → {order.seller?.name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(order.amount ?? order.price)}</td>
                  <td className="px-5 py-3.5"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(order.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => { setChatError(''); setDetail(order) }}>
                        <Eye className="size-4" />
                      </Button>
                      {(order.status === 'payment_under_review' || order.status === 'pending_payment') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Confirm payment received"
                          onClick={() => confirmPaymentMutation.mutate(order.id)}
                        >
                          <CheckCircle2 className="size-4 text-info" />
                        </Button>
                      )}
                      {(order.status === 'buyer_confirmation' || order.status === 'seller_transferring') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Release funds to seller wallet"
                          onClick={() => releaseFundsMutation.mutate(order.id)}
                        >
                          <Send className="size-4 text-success" />
                        </Button>
                      )}
                      {!['completed', 'cancelled'].includes(order.status) && (
                        <Button size="sm" variant="ghost" title="Refund buyer" onClick={() => setRefundTarget(order)}>
                          <RotateCcw className="size-4 text-danger" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No orders found" description="Orders matching this filter will appear here." />
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order #${detail.id}` : ''}>
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Order</span><span className="font-medium text-ink">{detail.order_number || detail.id}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Listing</span><span className="font-medium text-ink">{detail.listing?.title}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Buyer</span><span className="font-medium text-ink">{detail.buyer?.name}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Seller</span><span className="font-medium text-ink">{detail.seller?.name}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Amount</span><span className="font-medium text-ink">{formatCurrency(detail.amount ?? detail.price)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Seller gets</span><span className="font-medium text-ink">{formatCurrency(detail.seller_amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Commission</span><span className="font-medium text-ink">{formatCurrency(detail.commission_amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Status</span><OrderStatusBadge status={detail.status} /></div>
            {detail.payment_proof_url && (
              <div className="border-t border-border pt-3">
                <p className="text-ink-soft">Payment proof</p>
                <a href={detail.payment_proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-primary hover:underline">
                  Open receipt
                </a>
              </div>
            )}
            {detail.payment_proof_note && (
              <p className="text-ink-soft">Note: {detail.payment_proof_note}</p>
            )}
            {(detail.handover_notes || detail.handover_details || detail.handover_attachment_url) && (
              <div className="border-t border-border pt-3">
                <p className="font-medium text-ink">Seller handover details</p>
                {detail.handover_notes && (
                  <pre className="mt-2 whitespace-pre-wrap text-ink-soft">{detail.handover_notes}</pre>
                )}
                {detail.handover_details && (
                  <dl className="mt-2 grid gap-2">
                    {Object.entries(detail.handover_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3">
                        <dt className="text-ink-soft">{detailLabels[key] || key}</dt>
                        <dd className="break-all text-right font-medium text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {detail.handover_attachment_url && (
                  <a href={detail.handover_attachment_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-primary hover:underline">
                    Open handover attachment
                  </a>
                )}
              </div>
            )}
            {[
              'payment_confirmed',
              'seller_transferring',
              'buyer_confirmation',
              'completed',
              'disputed',
            ].includes(detail.status) && (
              <Button className="mt-2 w-full" variant="secondary" onClick={() => openOrderChat(detail.id)}>
                <MessageSquare className="size-4" /> Open order chat
              </Button>
            )}
            {chatError && <p className="text-xs text-warning">{chatError}</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Refund order">
        <p className="text-sm text-ink-soft">This will cancel the order and refund the buyer. Please provide a reason.</p>
        <Textarea className="mt-4" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for refund…" />
        <Button className="mt-4 w-full" variant="danger" onClick={() => refundMutation.mutate()} disabled={!reason.trim()} loading={refundMutation.isPending}>
          Confirm refund
        </Button>
      </Modal>
    </div>
  )
}
