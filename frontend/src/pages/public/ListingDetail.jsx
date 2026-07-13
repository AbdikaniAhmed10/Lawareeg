import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  Heart,
  Star,
  Eye,
  Calendar,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Link2,
} from 'lucide-react'
import listingsApi from '../../api/listings'
import messagesApi from '../../api/messages'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Alert from '../../components/ui/Alert'
import { formatCurrency, formatDate, initials } from '../../lib/format'
import { normalizeListing } from '../../lib/normalize'
import { mediaUrl } from '../../lib/mediaUrl'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

export default function ListingDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [favorited, setFavorited] = useState(false)
  const [messageError, setMessageError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', slug],
    queryFn: () => listingsApi.bySlug(slug),
    retry: 0,
  })

  const listing = useMemo(() => (data?.data ? normalizeListing(data.data) : null), [data])

  const profileImage = mediaUrl(listing?.avatar_url || listing?.cover_image)
  const screenshots = useMemo(() => {
    const urls = (listing?.screenshots || [])
      .map((s) => mediaUrl(typeof s === 'string' ? s : s?.url))
      .filter(Boolean)
      // Don't repeat the same profile avatar in the screenshot strip
      .filter((url) => url !== profileImage)
    return urls
  }, [listing, profileImage])

  const isOwner =
    Boolean(listing?.is_owner) ||
    (user && (user.id === listing?.user_id || user.id === listing?.seller?.id))
  const isAdmin = user?.role === 'admin'
  const canPurchase = !isOwner && !isAdmin && listing?.status !== 'sold'

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (favorited || listing?.is_favorited) {
        await listingsApi.removeFavorite(listing.id)
        setFavorited(false)
      } else {
        await listingsApi.addFavorite(listing.id)
        setFavorited(true)
      }
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => messagesApi.start({ listing_id: listing.id }),
    onSuccess: (res) => {
      const conversationId = res?.data?.id
      if (conversationId) {
        navigate(`/dashboard/messages/${conversationId}`)
      } else {
        navigate('/dashboard/messages')
      }
    },
    onError: (err) => {
      setMessageError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.user_id?.[0] ||
          'Could not start a conversation right now.'
      )
    },
  })

  if (isLoading) return <Spinner className="py-32" label="Loading listing…" />

  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState title="Listing not found" description="This listing may have been removed or sold." />
      </div>
    )
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/listings/${slug}` } })
    navigate(`/checkout/buy-now/${listing.slug}`)
  }

  const handleMessage = () => {
    setMessageError('')
    if (!isAuthenticated) return navigate('/login', { state: { from: `/listings/${slug}` } })
    messageMutation.mutate()
  }

  const handleFavorite = () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/listings/${slug}` } })
    favoriteMutation.mutate()
  }

  const ageMonths = listing.age_months ?? listing.statistics?.age_months ?? '—'
  const transferMethod = listing.statistics?.transfer_method || 'full_handover'
  const sellerRating = listing.seller?.rating ?? listing.seller?.rating_avg
  const assetLink = listing.public_asset_url || listing.asset_url
  const saved = favorited || listing.is_favorited

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/browse" label="Back" className="mb-4" />
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-soft">
        <Link to="/browse" className="hover:text-primary">
          Browse
        </Link>
        <span>/</span>
        <Link to={`/category/${listing.category_slug || 'all'}`} className="hover:text-primary">
          {listing.category}
        </Link>
      </nav>

          {isOwner && (
            <Alert variant="info" className="mb-6" title="This is your listing">
              Buyers see Buy Now here. You can edit the listing or manage ownership verification instead.
            </Alert>
          )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Fetched profile / avatar as primary visual */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="relative aspect-square max-h-[420px] w-full bg-sand-deep sm:aspect-16/10">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 via-sand-deep to-accent/10">
                  <span className="font-display text-5xl text-primary/25">Lawareeg</span>
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <Badge variant="primary">{listing.category}</Badge>
                {listing.verified && (
                  <Badge variant="success" icon={ShieldCheck}>
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="border-t border-border p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Fetched profile</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">{listing.title}</h1>
              {assetLink && (
                <a
                  href={assetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Link2 className="size-3.5" /> Open original profile / asset page
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Extra screenshots uploaded by seller */}
          {screenshots.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-medium text-ink">Screenshots &amp; proof</h2>
              <p className="mt-1 text-sm text-ink-soft">Extra images uploaded by the seller (analytics, panels, etc.).</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {screenshots.map((src, idx) => (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-4/3 overflow-hidden rounded-xl border border-border bg-sand-deep"
                  >
                    <img src={src} alt={`Screenshot ${idx + 1}`} className="size-full object-cover" referrerPolicy="no-referrer" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-ink-soft">
              {listing.rating ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-accent text-accent" /> {Number(listing.rating).toFixed(1)} ({listing.reviews_count} reviews)
                </span>
              ) : (
                <span>New listing</span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="size-4" /> {listing.views} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-4" /> Listed {formatDate(listing.created_at)}
              </span>
            </div>

            <div className="mt-6 text-ink-soft">
              <h3 className="font-display text-lg font-medium text-ink">About this asset</h3>
              <p className="mt-2 leading-relaxed whitespace-pre-line">{listing.description || listing.summary}</p>

              <h3 className="mt-6 font-display text-lg font-medium text-ink">Key details</h3>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <li className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-ink">
                  <TrendingUp className="size-4 text-primary" /> Monthly revenue: {formatCurrency(listing.monthly_revenue)}
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-ink">
                  <Calendar className="size-4 text-primary" /> Asset age: {ageMonths} months
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-ink">
                  <CheckCircle2 className="size-4 text-primary" /> Transfer: {String(transferMethod).replaceAll('_', ' ')}
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-ink">
                  <ShieldCheck className="size-4 text-primary" /> Escrow protected transaction
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm text-ink-soft">Asking price</p>
            <p className="font-display text-4xl font-semibold text-ink">{formatCurrency(listing.price)}</p>

            <div className="mt-5 flex flex-col gap-2.5">
              {isOwner ? (
                <>
                  <Button as={Link} to={`/dashboard/my-listings/${listing.id}/edit`} size="lg" className="w-full">
                    <Pencil className="size-4" /> Edit listing
                  </Button>
                  <Button as={Link} to="/dashboard/my-listings" size="lg" variant="secondary" className="w-full">
                    Manage ownership / listings
                  </Button>
                </>
              ) : isAdmin ? (
                <Button as={Link} to="/admin/listings" size="lg" className="w-full">
                  Review in admin
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" onClick={handleBuyNow} disabled={!canPurchase}>
                    {listing.status === 'sold' ? 'Sold' : 'Buy Now'}
                  </Button>
                  <Button size="lg" variant="secondary" className="w-full" onClick={handleFavorite} loading={favoriteMutation.isPending}>
                    <Heart className={`size-4 ${saved ? 'fill-danger text-danger' : ''}`} />
                    {saved ? 'Saved to favorites' : 'Save to favorites'}
                  </Button>
                </>
              )}
            </div>

            {messageError && <Alert variant="danger" className="mt-4">{messageError}</Alert>}

            <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
              <Link
                to={listing.seller?.id ? `/users/${listing.seller.id}` : '#'}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-colors hover:bg-sand-deep/50 -m-1 p-1"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                  {listing.seller?.avatar ? (
                    <img src={mediaUrl(listing.seller.avatar)} alt="" className="size-full object-cover" />
                  ) : (
                    initials(listing.seller?.name || 'S')
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                    {isOwner ? 'You (seller)' : listing.seller?.name}
                    {(listing.seller?.verified || listing.seller?.is_verified_seller) && (
                      <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-soft">
                    <Star className="size-3 fill-accent text-accent" />{' '}
                    {sellerRating != null ? Number(sellerRating).toFixed(1) : 'New'} seller rating
                    {!isOwner && listing.seller?.id ? ' · View profile' : ''}
                  </p>
                </div>
              </Link>
            </div>

            {!isOwner && !isAdmin && (
              <Button variant="outline" className="mt-4 w-full" onClick={handleMessage} loading={messageMutation.isPending}>
                <MessageSquare className="size-4" /> Message seller
              </Button>
            )}

            {!isOwner && !isAdmin && (
              <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-soft">
                <ShieldCheck className="size-3.5 text-primary" /> Your payment is held by Lawareeg until you confirm receipt.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
