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

const FAQS = [
  {
    q: 'How does the manual escrow process work?',
    a: 'When you buy an asset, you pay into Lawareeg via bank transfer or mobile money and upload your receipt. Our team verifies the payment, the seller transfers the asset, and funds are released only after you confirm you received it.',
  },
  {
    q: 'What happens if the seller never transfers the asset?',
    a: 'You can open a dispute at any point after payment confirmation. Our admin team reviews the case and can refund your payment if the seller fails to deliver.',
  },
  {
    q: 'How do I get paid as a seller?',
    a: 'Once the buyer confirms receipt of the asset, funds are released to your Lawareeg wallet minus our commission. You can then request a withdrawal to your bank or mobile money account.',
  },
]

const STEPS = [
  {
    icon: Search,
    title: 'Find an asset',
    desc: 'Browse verified digital assets across ten categories, filtered by price, revenue and rating.',
  },
  {
    icon: Wallet,
    title: 'Pay into escrow',
    desc: 'Send payment via bank transfer or mobile money and upload your receipt for review.',
  },
  {
    icon: Handshake,
    title: 'Seller transfers asset',
    desc: 'Once payment is confirmed, the seller hands over full ownership and access.',
  },
  {
    icon: PackageCheck,
    title: 'Funds released',
    desc: 'You confirm receipt, and we release payment to the seller. Simple and safe.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

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
    <div className="w-full overflow-x-clip">
      <section className="relative w-full atmosphere-gradient">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary sm:mb-6 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Escrow-protected trades, every time</span>
          </span>

          <div className="mx-auto mb-4 flex justify-center sm:mb-5">
            <BrandLogo asLink={false} size="hero" showWordmark={false} imgClassName="rounded-2xl shadow-lg" />
          </div>

          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-ink sm:text-6xl lg:text-8xl">
            Lawareeg
          </h1>

          <p className="mx-auto mt-4 max-w-[22rem] text-pretty font-display text-lg font-medium leading-snug text-ink sm:mt-6 sm:max-w-2xl sm:text-3xl">
            The trusted marketplace to buy and sell digital assets.
          </p>
          <p className="mx-auto mt-3 max-w-[22rem] text-pretty text-sm leading-relaxed text-ink-soft sm:max-w-xl sm:text-lg">
            Facebook pages, Instagram & TikTok accounts, YouTube channels, websites, domains, apps and online businesses — every trade protected by manual escrow.
          </p>

          <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-md sm:flex-row sm:justify-center">
            <Button as={Link} to="/browse" size="lg" className="w-full sm:w-auto">
              Browse listings <ArrowRight className="size-4" />
            </Button>
            <Button as={Link} to="/dashboard/my-listings/new" size="lg" variant="secondary" className="w-full sm:w-auto">
              Sell an asset
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
              placeholder="Search assets…"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50 sm:h-11"
            />
            <Button type="submit" size="sm" className="shrink-0 sm:h-11 sm:px-5">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex min-w-0 items-end justify-between gap-4 sm:mb-10">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Browse by category</h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">Ten curated categories, all escrow-protected.</p>
          </div>
          <Link to="/browse" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink">Featured listings</h2>
              <p className="mt-2 text-ink-soft">Hand-picked assets with strong performance history.</p>
            </div>
          </div>
          {featured.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState title="No featured listings yet" description="Check back soon for hand-picked assets." />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">Latest arrivals</h2>
            <p className="mt-2 text-ink-soft">Freshly listed digital assets, updated daily.</p>
          </div>
          <Link to="/browse" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {latest.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState title="No listings yet" description="Be the first to list a digital asset for sale." />
        )}
      </section>

      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink">Top rated sellers</h2>
          <p className="mt-2 text-ink-soft">Sellers with proven track records and verified identities.</p>
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
                <EmptyState title="No sellers yet" description="Verified sellers will appear here as the marketplace grows." />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-ink">How Lawareeg works</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">A simple four-step manual escrow process built for trust.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="relative rounded-2xl border border-border bg-surface p-6 card-hover">
              <span className="absolute right-5 top-5 font-display text-3xl font-semibold text-primary/10">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5.5" />
              </div>
              <h3 className="mt-4 font-medium text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button as={Link} to="/how-it-works" variant="outline">
            Learn more about escrow <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">Frequently asked questions</h2>
        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((faq) => (
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
            View all FAQs <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-white/5" />
          <h2 className="relative font-display text-3xl font-semibold text-white sm:text-4xl">Ready to buy or sell your next digital asset?</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/80">Create an account and trade safely with manual escrow on Lawareeg.</p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              as={Link}
              to="/register"
              size="lg"
              variant="ghost"
              className="border border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              Create free account
            </Button>
            <Button as={Link} to="/browse" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Explore listings
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
