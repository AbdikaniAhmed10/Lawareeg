import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Eye, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import adminApi from '../../api/admin'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../lib/format'
import BackButton from '../../components/ui/BackButton'

const TABS = ['pending', 'approved', 'rejected']
const OWNERSHIP_FILTERS = [
  { value: '', label: 'All ownership' },
  { value: 'pending_check', label: 'Code ready to check' },
  { value: 'awaiting_placement', label: 'Awaiting seller code' },
  { value: 'verified', label: 'Verified' },
  { value: 'failed', label: 'Failed' },
]

export default function AdminListings() {
  const [tab, setTab] = useState('pending')
  const [ownershipFilter, setOwnershipFilter] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [failOwnershipTarget, setFailOwnershipTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listings', tab, ownershipFilter],
    queryFn: () =>
      adminApi.listings({
        status: tab,
        ownership_status: ownershipFilter || undefined,
      }),
    retry: 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] })

  const approveMutation = useMutation({
    mutationFn: ({ id, verifyOwnership }) => adminApi.approveListing(id, { verify_ownership: verifyOwnership }),
    onSuccess: invalidate,
  })
  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectListing(rejectTarget.id, { reason }),
    onSuccess: () => {
      setRejectTarget(null)
      setReason('')
      invalidate()
    },
  })
  const verifyOwnershipMutation = useMutation({
    mutationFn: (id) => adminApi.verifyOwnership(id),
    onSuccess: invalidate,
  })
  const rejectOwnershipMutation = useMutation({
    mutationFn: () => adminApi.rejectOwnership(failOwnershipTarget.id, { reason }),
    onSuccess: () => {
      setFailOwnershipTarget(null)
      setReason('')
      invalidate()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteListing(id),
    onSuccess: () => {
      setDeleteTarget(null)
      setDetail(null)
      invalidate()
    },
  })

  const listings = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Listings</h1>
        <p className="mt-1 text-ink-soft">Approve listings and verify ownership codes placed by sellers.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 rounded-xl border border-border bg-surface p-1.5 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
                tab === t ? 'bg-primary text-white' : 'text-ink-soft hover:bg-sand-deep'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
        >
          {OWNERSHIP_FILTERS.map((f) => (
            <option key={f.value || 'all'} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : listings.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">Listing</th>
                <th className="px-5 py-3.5 font-medium">Seller</th>
                <th className="px-5 py-3.5 font-medium">Price</th>
                <th className="px-5 py-3.5 font-medium">Ownership</th>
                <th className="px-5 py-3.5 font-medium">Submitted</th>
                <th className="px-5 py-3.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-sand-deep/30">
                  <td className="px-5 py-3.5 font-medium text-ink">{listing.title}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {listing.seller?.id ? (
                      <Link to={`/users/${listing.seller.id}`} className="hover:text-primary hover:underline">
                        {listing.seller.name}
                      </Link>
                    ) : (
                      listing.seller?.name
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(listing.price)}</td>
                  <td className="px-5 py-3.5">
                    {listing.is_verified_ownership || listing.ownership_verification_status === 'verified' ? (
                      <Badge variant="success" icon={ShieldCheck}>Verified</Badge>
                    ) : listing.ownership_verification_status === 'pending_check' ? (
                      <Badge variant="info">Code ready</Badge>
                    ) : listing.ownership_verification_status === 'failed' ? (
                      <Badge variant="danger">Failed</Badge>
                    ) : (
                      <Badge variant="warning">Awaiting code</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(listing.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(listing)}>
                        <Eye className="size-4" />
                      </Button>
                      {!listing.is_verified_ownership && listing.ownership_verification_status === 'pending_check' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Mark ownership verified"
                            onClick={() => verifyOwnershipMutation.mutate(listing.id)}
                          >
                            <ShieldCheck className="size-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Ownership failed" onClick={() => setFailOwnershipTarget(listing)}>
                            <ShieldX className="size-4 text-danger" />
                          </Button>
                        </>
                      )}
                      {tab === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Approve listing"
                            onClick={() => approveMutation.mutate({ id: listing.id, verifyOwnership: listing.is_verified_ownership })}
                          >
                            <Check className="size-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectTarget(listing)}>
                            <X className="size-4 text-danger" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete listing"
                        onClick={() => setDeleteTarget(listing)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={`No ${tab} listings`} description="Nothing to review right now." />
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'Listing'}>
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-ink-soft">Seller</span>
              {detail.seller?.id ? (
                <Link to={`/users/${detail.seller.id}`} className="font-medium text-primary hover:underline">
                  {detail.seller.name}
                </Link>
              ) : (
                <span className="font-medium text-ink">{detail.seller?.name}</span>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-soft">Asset URL</span>
              <span className="font-medium text-ink break-all">{detail.asset_url || '—'}</span>
            </div>
            <div className="rounded-xl border border-border bg-sand-deep/40 p-3">
              <p className="text-ink-soft">Verification code to look for</p>
              <code className="mt-1 block font-mono text-base font-semibold text-primary">
                {detail.ownership_verification_code || '—'}
              </code>
              <p className="mt-2 text-ink-soft">{detail.ownership_instructions}</p>
            </div>
            {detail.ownership_verification_status === 'pending_check' && (
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => { verifyOwnershipMutation.mutate(detail.id); setDetail(null) }}>
                  Code found — verify
                </Button>
                <Button className="flex-1" variant="danger" onClick={() => { setDetail(null); setFailOwnershipTarget(detail) }}>
                  Not found
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject listing">
        <p className="text-sm text-ink-soft">Provide a reason so the seller can make corrections.</p>
        <Textarea className="mt-4" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. missing verification screenshots" />
        <Button className="mt-4 w-full" variant="danger" onClick={() => rejectMutation.mutate()} disabled={!reason.trim()} loading={rejectMutation.isPending}>
          Reject listing
        </Button>
      </Modal>

      <Modal open={!!failOwnershipTarget} onClose={() => setFailOwnershipTarget(null)} title="Ownership verification failed">
        <p className="text-sm text-ink-soft">Explain why the code was not accepted so the seller can try again.</p>
        <Textarea
          className="mt-4"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. code not found in channel description"
        />
        <Button
          className="mt-4 w-full"
          variant="danger"
          onClick={() => rejectOwnershipMutation.mutate()}
          disabled={!reason.trim()}
          loading={rejectOwnershipMutation.isPending}
        >
          Mark ownership failed
        </Button>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete listing">
        <p className="text-sm text-ink-soft">
          Permanently delete <strong className="text-ink">{deleteTarget?.title}</strong>? This cannot be undone.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
