import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import listingsApi from '../../api/listings'
import ListingCard from '../../components/listings/ListingCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { getCategoryBySlug } from '../../lib/constants'
import BackButton from '../../components/ui/BackButton'
import { useT } from '../../context/LanguageContext'

const PER_PAGE = 8

export default function CategoryPage() {
  const { t } = useT()
  const { slug } = useParams()
  const [page, setPage] = useState(1)
  const category = getCategoryBySlug(slug)

  const { data, isLoading } = useQuery({
    queryKey: ['category', slug, page],
    queryFn: () => listingsApi.byCategory(slug, { page, per_page: PER_PAGE }),
    retry: 0,
  })

  const listings = data?.data || []
  const totalPages = data?.meta?.last_page || 1
  const Icon = category?.icon

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/browse" label={t('browse.backToBrowse')} className="mb-4" />
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-soft">
        <Link to="/browse" className="hover:text-primary">{t('nav.browse')}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink">{category?.name || slug}</span>
      </nav>

      <div className="mb-10 flex items-center gap-4">
        {Icon && (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" />
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{category?.name || t('browse.category')}</h1>
          <p className="mt-1 text-ink-soft">{category?.description}</p>
        </div>
      </div>

      {isLoading ? (
        <Spinner className="py-24" label={t('browse.loading')} />
      ) : listings.length ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState title={t('browse.emptyCategoryTitle')} description={t('browse.emptyCategoryDesc')} />
      )}
    </div>
  )
}
