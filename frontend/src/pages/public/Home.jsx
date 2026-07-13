import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck, ArrowRight, Star, ChevronDown, Wallet, Handshake, PackageCheck } from 'lucide-react'
import listingsApi from '../../api/listings'
import ListingCard from '../../components/listings/ListingCard'
import CategoryGrid from '../../components/listings/CategoryGrid'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { initials } from '../../lib/format'
import BrandLogo from '../../components/ui/BrandLogo'
import { useT } from '../../context/LanguageContext'
import { getFaqItems } from '../../i18n'

const STEP_KEYS = [
  { icon: Search, titleKey: 'home.stepFind', descKey: 'home.stepFindDesc' },
  { icon: Wallet, titleKey: 'home.stepPay', descKey: 'home.stepPayDesc' },
  { icon: Handshake, titleKey: 'home.stepTransfer', descKey: 'home.stepTransferDesc' },
  { icon: PackageCheck, titleKey: 'home.stepRelease', descKey: 'home.stepReleaseDesc' },
]

export default function Home() {
  const navigate = useNavigate()
  const { t, locale } = useT()
  const [query, setQuery] = useState('')
  const faqs = getFaqItems(locale).slice(0, 3)

  const featuredQuery = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: listingsApi.featured,
    retry: 0,
  })
  const latestQuery = useQuery({
    queryKey: ['listings', 'latest'],
    queryFn: listingsApi.latest,
    retry: 0,
  })
  const sellersQuery = useQuery({
    queryKey: ['sellers', 'top'],
    queryFn: listingsApi.topSellers,
    retry: 0,
  })

  const featured = featuredQuery.data?.data || []
  const latest = latestQuery.data?.data || []
  const topSellers = sellersQuery.data?.data || []

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/browse?q=${encodeURIComponent(query)}` : '/browse')
  }

  return (
    <div className="w-full overflow-x-hidden">
      <section className="relative w-full atmosphere-gradient">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary sm:mb-6 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>{t('home.badge')}</span>
          </span>

          <div className="mx-auto mb-4 flex justify-center sm:mb-5">
            <BrandLogo asLink={false} size="hero" showWordmark={false} imgClassName="rounded-2xl shadow-lg" />
          </div>

          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-ink sm:text-6xl lg:text-8xl">
            Lawareeg
          </h1>

          <p className="mx-auto mt-4 max-w-[22rem] text-pretty font-display text-lg font-medium leading-snug text-ink sm:mt-6 sm:max-w-2xl sm:text-3xl">
            {t('home.tagline')}
          </p>
          <p className="mx-auto mt-3 max-w-[22rem] text-pretty text-sm leading-relaxed text-ink-soft sm:max-w-xl sm:text-lg">
            {t('home.subtitle')}
          </p>

          <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-md sm:flex-row sm:justify-center">
            <Button as={Link} to="/browse" size="lg" className="w-full sm:w-auto">
              {t('home.browseListings')} <ArrowRight className="size-4" />
            </Button>
            <Button as={Link} to="/dashboard/my-listings/new" size="lg" variant="secondary" className="w-full sm:w-auto">
              {t('home.sellAsset')}
            </Button>
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-7 flex w-full max-w-sm items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-lg sm:mt-10 sm:max-w-xl sm:p-2"
          >
            <Search className="ml-2 size-4 shrink-0 text-ink-soft/60 sm:size-5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50 sm:h-11"
            />
            <Button type="submit" size="sm" className="shrink-0 sm:h-11 sm:px-5">
              {t('common.search')}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex min-w-0 items-end justify-between gap-4 sm:mb-10">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{t('home.categoriesTitle')}</h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">{t('home.categoriesSubtitle')}</p>
          </div>
          <Link to="/browse" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
            {t('home.viewAll')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink">{t('home.featuredTitle')}</h2>
              <p className="mt-2 text-ink-soft">{t('home.featuredSubtitle')}</p>
            </div>
          </div>
          {featured.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState title={t('home.featuredEmpty')} description={t('home.featuredEmptyDesc')} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">{t('home.latestTitle')}</h2>
            <p className="mt-2 text-ink-soft">{t('home.latestSubtitle')}</p>
          </div>
          <Link to="/browse" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
            {t('home.viewAll')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {latest.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('home.latestEmpty')} description={t('home.latestEmptyDesc')} />
        )}
      </section>

      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink">{t('home.sellersTitle')}</h2>
          <p className="mt-2 text-ink-soft">{t('home.sellersSubtitle')}</p>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {topSellers.length ? (
              topSellers.map((seller) => (
                <Link
                  key={seller.id}
                  to={`/users/${seller.id}`}
                  className="card-hover flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center"
                >
                  <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                    {seller.avatar ? (
                      <img src={seller.avatar} alt="" className="size-full object-cover" />
                    ) : (
                      initials(seller.name)
                    )}
                  </span>
                  <div>
                    <p className="flex items-center justify-center gap-1 font-medium text-ink">
                      {seller.name}
                      {(seller.verified || seller.is_verified_seller) && (
                        <ShieldCheck className="size-3.5 text-primary" />
                      )}
                    </p>
                    <p className="flex items-center justify-center gap-1 text-xs text-ink-soft">
                      <Star className="size-3.5 fill-accent text-accent" />{' '}
                      {Number(seller.rating ?? seller.rating_avg ?? 0).toFixed(1)} ·{' '}
                      {seller.sales ?? seller.rating_count ?? 0}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState title={t('home.sellersEmpty')} description={t('home.sellersEmptyDesc')} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-ink">{t('home.howTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">{t('home.howSubtitle')}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((step, idx) => (
            <div key={step.titleKey} className="relative rounded-2xl border border-border bg-surface p-6 card-hover">
              <span className="absolute right-5 top-5 font-display text-3xl font-semibold text-primary/10">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5.5" />
              </div>
              <h3 className="mt-4 font-medium text-ink">{t(step.titleKey)}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button as={Link} to="/how-it-works" variant="outline">
            {t('home.learnEscrow')} <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">{t('home.faqTitle')}</h2>
        <div className="mt-10 flex flex-col gap-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-border bg-surface p-5 open:shadow-sm transition-shadow">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink">
                {faq.q}
                <ChevronDown className="size-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button as={Link} to="/faq" variant="link">
            {t('home.viewFaqs')} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-white/5" />
          <h2 className="relative font-display text-3xl font-semibold text-white sm:text-4xl">{t('home.ctaTitle')}</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/80">{t('home.ctaSubtitle')}</p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              as={Link}
              to="/register"
              size="lg"
              variant="ghost"
              className="border border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              {t('home.ctaRegister')}
            </Button>
            <Button as={Link} to="/browse" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              {t('home.ctaBrowse')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
