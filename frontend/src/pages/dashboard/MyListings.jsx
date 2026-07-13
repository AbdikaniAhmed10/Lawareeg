import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Tag, Pencil, Trash2, Eye, Copy, Check, ShieldCheck } from 'lucide-react'
import listingsApi from '../../api/listings'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

const STATUS_VARIANTS = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  sold: 'neutral',
  draft: 'neutral',
}

const OWNERSHIP_LABELS = {
  awaiting_placement: { label: 'Add verification code', variant: 'warning' },
  pending_check: { label: 'Ownership pending check', variant: 'info' },
  verified: { label: 'Ownership verified', variant: 'success' },
  failed: { label: 'Ownership failed', variant: 'danger' },
}

export default function MyListings() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['my-listings'], queryFn: () => listingsApi.myListings(), retry: 0 })

  const deleteMutation = useMutation({
    mutationFn: (id) => listingsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const markPlacedMutation = useMutation({
    mutationFn: (id) => listingsApi.markOwnershipCodePlaced(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const listings = data?.data || []

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My listings</h1>
          <p className="mt-1 text-ink-soft">Manage assets, ownership verification codes, and review status.</p>
        </div>
        <Button as={Link} to="/dashboard/my-listings/new">
          <PlusCircle className="size-4" /> New listing
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : listings.length ? (
        <div className="flex flex-col gap-4">
          {listings.map((listing) => {
            const ownership = OWNERSHIP_LABELS[listing.ownership_verification_status] || OWNERSHIP_LABELS.awaiting_placement
            const code = listing.ownership_verification_code

            return (
              <div key={listing.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                    <Tag className="size-5.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{listing.title}</p>
                    <p className="text-xs text-ink-soft">
                      Listed {formatDate(listing.created_at)} · {formatCurrency(listing.price)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[listing.status] || 'neutral'}>{listing.status || 'pending'}</Badge>
                  <Badge variant={ownership.variant} icon={ShieldCheck}>
                    {ownership.label}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Button as={Link} to={`/listings/${listing.slug}`} size="sm" variant="ghost">
                      <Eye className="size-4" />
                    </Button>
                    <Button as={Link} to={`/dashboard/my-listings/${listing.id}/edit`} size="sm" variant="ghost">
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(listing.id)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>

                {code && listing.ownership_verification_status !== 'verified' && (
                  <div className="mt-4 rounded-xl border border-border bg-sand-deep/40 p-4">
                    <p className="text-sm font-medium text-ink">Ownership verification code</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded-lg bg-surface px-3 py-2 font-mono text-sm font-semibold text-primary">
                        {code}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyCode(code)}>
                        {copied === code ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                        Copy
                      </Button>
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      {listing.ownership_instructions ||
                        'Place this code on the asset (bio, about section, homepage, or DNS TXT), then confirm below.'}
                    </p>
                    {listing.ownership_failure_reason && (
                      <Alert variant="danger" className="mt-3">
                        {listing.ownership_failure_reason}
                      </Alert>
                    )}
                    {listing.ownership_verification_status !== 'pending_check' ? (
                      <Button
                        className="mt-4"
                        size="sm"
                        loading={markPlacedMutation.isPending && markPlacedMutation.variables === listing.id}
                        onClick={() => markPlacedMutation.mutate(listing.id)}
                      >
                        I&apos;ve added the code
                      </Button>
                    ) : (
                      <Alert variant="info" className="mt-3">
                        Waiting for admin to check the code on your asset. You can remove it after verification.
                      </Alert>
                    )}
                  </div>
                )}

                {listing.ownership_verification_status === 'verified' && (
                  <Alert variant="success" className="mt-4">
                    Ownership verified. You can remove the verification code from the asset now.
                  </Alert>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="You haven't listed anything yet"
          description="Create your first listing to start selling on Lawareeg."
          action={
            <Button as={Link} to="/dashboard/my-listings/new">
              <PlusCircle className="size-4" /> Create listing
            </Button>
          }
        />
      )}
    </div>
  )
}
