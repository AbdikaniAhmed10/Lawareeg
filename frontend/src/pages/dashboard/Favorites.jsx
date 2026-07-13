import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import listingsApi from '../../api/listings'
import ListingCard from '../../components/listings/ListingCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import BackButton from '../../components/ui/BackButton'

export default function Favorites() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['favorites'], queryFn: listingsApi.favorites, retry: 0 })

  const removeMutation = useMutation({
    mutationFn: (id) => listingsApi.removeFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const favorites = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Favorites</h1>
        <p className="mt-1 text-ink-soft">Listings you've saved for later.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : favorites.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((listing) => (
            <ListingCard key={listing.id} listing={listing} favorited onToggleFavorite={() => removeMutation.mutate(listing.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Save listings you're interested in to find them here later."
          action={
            <Button as={Link} to="/browse">
              Browse listings
            </Button>
          }
        />
      )}
    </div>
  )
}
