import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Star, MapPin, Calendar, Package } from 'lucide-react'
import usersApi from '../../api/users'
import ListingCard from '../../components/listings/ListingCard'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import { formatDate, initials } from '../../lib/format'
import { mediaUrl } from '../../lib/mediaUrl'
import { normalizeListings } from '../../lib/normalize'
import BackButton from '../../components/ui/BackButton'

export default function UserProfile() {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => usersApi.profile(id),
    retry: 0,
    enabled: !!id,
  })

  if (isLoading) return <Spinner className="py-32" label="Loading profile…" />

  if (isError || !data?.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <BackButton to="/browse" label="Back" className="mb-6" />
        <EmptyState title="Profile not found" description="This user may be unavailable." />
      </div>
    )
  }

  const profile = data.data
  const listings = normalizeListings(data.listings || data.data?.listings || [])
  const avatar = mediaUrl(profile.avatar)
  const verified = profile.verified || profile.is_verified_seller
  const rating = profile.rating ?? profile.rating_avg

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/browse" label="Back" className="mb-6" />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-28 bg-gradient-to-br from-primary/20 via-sand-deep to-accent/15 sm:h-36" />
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-primary/10 font-display text-2xl font-semibold text-primary shadow-sm sm:size-28">
                {avatar ? (
                  <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  initials(profile.name)
                )}
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{profile.name}</h1>
                  {verified && (
                    <Badge variant="success" icon={ShieldCheck}>
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="mt-1 capitalize text-sm text-ink-soft">{profile.role || 'member'}</p>
              </div>
            </div>
          </div>

          {profile.bio && <p className="mt-5 max-w-2xl text-ink-soft">{profile.bio}</p>}

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {rating != null && (
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-accent text-accent" />
                {Number(rating).toFixed(1)} ({profile.rating_count || 0} reviews)
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Package className="size-4" />
              {profile.listings_count ?? listings.length} listings
            </span>
            {profile.country && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {profile.country}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              Joined {formatDate(profile.member_since || profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Listings</h2>
        <p className="mt-1 text-sm text-ink-soft">Approved assets from this seller.</p>

        {listings.length ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="No public listings" description="This user has no approved listings yet." />
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-ink-soft">
        <Link to="/browse" className="font-medium text-primary hover:underline">
          Browse all listings
        </Link>
      </p>
    </div>
  )
}
