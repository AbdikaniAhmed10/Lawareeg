import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import listingsApi from '../../api/listings'
import ListingCard from '../../components/listings/ListingCard'
import ListingFilters from '../../components/listings/ListingFilters'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import BackButton from '../../components/ui/BackButton'
import { useT } from '../../context/LanguageContext'

const PER_PAGE = 8

export default function Browse() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    price: '',
    sort: 'newest',
    verified: false,
    hasRevenue: false,
  })
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const listingsQuery = useQuery({
    queryKey: ['listings', 'browse', filters, query, page],
    queryFn: () =>
      listingsApi.browse({
        category: filters.category || undefined,
        price: filters.price || undefined,
        sort: filters.sort,
        verified: filters.verified || undefined,
        has_revenue: filters.hasRevenue || undefined,
        q: query || undefined,
        page,
        per_page: PER_PAGE,
      }),
    retry: 0,
  })

  const listings = listingsQuery.data?.data || []
  const totalPages = listingsQuery.data?.meta?.last_page || 1

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearchParams(query ? { q: query } : {})
  }

  const resetFilters = () => setFilters({ category: '', price: '', sort: 'newest', verified: false, hasRevenue: false })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/" label={t('common.backToHome')} className="mb-4" preferHistory={false} />
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{t('browse.title')}</h1>
        <p className="mt-1.5 text-ink-soft">{t('browse.subtitle')}</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-8 flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <Search className="ml-2 size-4.5 shrink-0 text-ink-soft/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('browse.searchPlaceholder')}
          className="h-10 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50"
        />
        <Button type="submit" size="sm">
          {t('common.search')}
        </Button>
        <Button type="button" size="sm" variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="size-4" />
        </Button>
      </form>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5">
            <ListingFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} onReset={resetFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {listingsQuery.isLoading ? (
            <Spinner className="py-24" label={t('browse.loading')} />
          ) : listings.length ? (
            <>
              <p className="mb-4 text-sm text-ink-soft">
                {t('browse.results', { count: listings.length })}
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          ) : (
            <EmptyState
              title={t('browse.emptyTitle')}
              description={t('browse.emptyDesc')}
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  <X className="size-4" /> {t('browse.clearFilters')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t('browse.filters')}>
        <ListingFilters
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(1) }}
          onReset={() => { resetFilters(); setFiltersOpen(false) }}
        />
        <Button className="mt-5 w-full" onClick={() => setFiltersOpen(false)}>
          {t('browse.showResults')}
        </Button>
      </Modal>
    </div>
  )
}
