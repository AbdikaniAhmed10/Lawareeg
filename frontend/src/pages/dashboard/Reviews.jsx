import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import listingsApi from '../../api/listings'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatDate, initials } from '../../lib/format'
import clsx from 'clsx'
import BackButton from '../../components/ui/BackButton'

export default function Reviews() {
  const { data, isLoading } = useQuery({ queryKey: ['my-reviews'], queryFn: listingsApi.myReviews, retry: 0 })
  const reviews = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" className="lg:hidden" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Reviews</h1>
        <p className="mt-1 text-ink-soft">Feedback you've received from buyers and sellers.</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : reviews.length ? (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(review.reviewer?.name || 'U')}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{review.reviewer?.name}</p>
                    <p className="text-xs text-ink-soft">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={clsx('size-4', n <= review.rating ? 'fill-accent text-accent' : 'text-border')} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{review.comment}</p>
              {review.listing?.title && <p className="mt-2 text-xs font-medium text-primary">{review.listing.title}</p>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Star} title="No reviews yet" description="Reviews from your completed orders will show up here." />
      )}
    </div>
  )
}
