import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Building2, Smartphone, Copy, Check, ArrowRight } from 'lucide-react'
import listingsApi from '../../api/listings'
import ordersApi from '../../api/orders'
import apiClient from '../../api/client'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency } from '../../lib/format'
import { normalizeListing } from '../../lib/normalize'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

export default function BuyNow() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [method, setMethod] = useState('bank_transfer')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['listing', slug],
    queryFn: () => listingsApi.bySlug(slug),
    retry: 0,
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
    retry: 0,
  })

  const listing = data?.data ? normalizeListing(data.data) : null
  const isOwner =
    Boolean(listing?.is_owner) ||
    (user && listing && (user.id === listing.user_id || user.id === listing.seller?.id))
  const isAdmin = user?.role === 'admin'

  const settings = settingsQuery.data?.data || {}
  const paymentMethods = useMemo(
    () => [
      {
        id: 'bank_transfer',
        icon: Building2,
        label: 'Bank Transfer',
        instructions:
          settings.bank_transfer_details ||
          'Bank transfer details will appear here once configured by admin.',
      },
      {
        id: 'mobile_money',
        icon: Smartphone,
        label: 'Mobile Money',
        instructions:
          settings.mobile_money_details ||
          'Mobile money details will appear here once configured by admin.',
      },
    ],
    [settings.bank_transfer_details, settings.mobile_money_details]
  )
  const active = paymentMethods.find((m) => m.id === method) || paymentMethods[0]

  const handleCopy = () => {
    navigator.clipboard?.writeText(active.instructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleConfirmOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.create({ listing_id: listing.id, payment_method: method })
      const orderId = res?.data?.id
      if (!orderId) throw new Error('Order was not created')
      navigate(`/checkout/upload-proof/${orderId}`)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.listing_id?.[0] ||
          err?.message ||
          'Could not create order. Make sure you are logged in and the listing is still available.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || settingsQuery.isLoading) return <Spinner className="py-24" />

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <Alert variant="danger">Listing not found.</Alert>
      </div>
    )
  }

  if (isOwner || isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <BackButton to={`/listings/${listing.slug}`} label="Back to listing" className="mb-4" preferHistory={false} />
        <Alert variant="warning" title={isOwner ? 'This is your listing' : 'Admin accounts cannot buy'}>
          {isOwner
            ? 'You cannot purchase your own asset. Manage it from your listings instead.'
            : 'Use a buyer account to purchase listings.'}
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button as={Link} to={`/listings/${listing.slug}`} variant="secondary">
            Back to listing
          </Button>
          {isOwner && (
            <Button as={Link} to="/dashboard/my-listings">
              My listings
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to={`/listings/${listing.slug}`} label="Back to listing" className="mb-4" preferHistory={false} />
      <h1 className="font-display text-2xl font-semibold text-ink">Complete your purchase</h1>
      <p className="mt-1 text-ink-soft">Step 1 of 3 — Pay into Lawareeg escrow</p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm text-ink-soft">You're purchasing</p>
            <Link to={`/listings/${listing.slug}`} className="font-medium text-ink hover:text-primary">
              {listing.title}
            </Link>
          </div>
          <p className="font-display text-2xl font-semibold text-ink">{formatCurrency(listing.price)}</p>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-ink">Choose payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-2.5 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  method === m.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-sand-deep/40'
                }`}
              >
                <m.icon className={`size-5 ${method === m.id ? 'text-primary' : 'text-ink-soft'}`} />
                <span className={`text-sm font-medium ${method === m.id ? 'text-primary' : 'text-ink'}`}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-sand-deep/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">Payment instructions</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-soft hover:bg-surface cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-surface px-3.5 py-3 text-sm text-ink">{active.instructions}</pre>
        </div>

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <Alert variant="info" className="mt-5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Send exactly {formatCurrency(listing.price)} using the details above, then
            continue to upload your receipt.
          </div>
        </Alert>

        <Button size="lg" className="mt-5 w-full" onClick={handleConfirmOrder} loading={loading}>
          I've made the payment <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
