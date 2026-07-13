import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck, ArrowRight, Star, Quote, ChevronDown, Wallet, Handshake, PackageCheck } from 'lucide-react'
import listingsApi from '../../api/listings'
import ListingCard from '../../components/listings/ListingCard'
import CategoryGrid from '../../components/listings/CategoryGrid'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { MOCK_LISTINGS, MOCK_TOP_SELLERS, MOCK_TESTIMONIALS, MOCK_FAQS } from '../../lib/mockData'
import { formatCurrency, initials } from '../../lib/format'
import BrandLogo from '../../components/ui/BrandLogo'

const STEPS = [
  {
    icon: Search,
    title: 'Find an asset',
    description: 'Browse verified digital assets across ten categories, filtered by price, revenue and rating.',
  },
  {
    icon: Wallet,
    title: 'Pay into escrow',
    description: 'Send payment via bank transfer or mobile money and upload your receipt for review.',
  },
  {
    icon: Handshake,
    title: 'Seller transfers asset',
    description: 'Once payment is confirmed, the seller hands over full ownership and access.',
  },
  {
    icon: PackageCheck,
    title: 'Funds released',
    description: 'You confirm receipt, and we release payment to the seller. Simple and safe.',
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

  const featured = featuredQuery.data?.data?.length ? featuredQuery.data.data : MOCK_LISTINGS.slice(0, 4)
  const latest = latestQuery.data?.data?.length ? latestQuery.data.data : MOCK_LISTINGS.slice(4, 8)
  const topSellers = sellersQuery.data?.data?.length ? sellersQuery.data.data : MOCK_TOP_SELLERS

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/browse?q=${encodeURIComponent(query)}` : '/browse')
  }

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden atmosphere-gradient">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Escrow-protected trades, every time
          </span>

          <div className="animate-fade-in-up stagger-1 flex flex-col items-center gap-5">
            <BrandLogo asLink={false} size="hero" showWordmark={false} imgClassName="rounded-2xl shadow-lg" />
            <h1 className="font-display text-6xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-7xl lg:text-8xl">
              Lawareeg
            </h1>
          </div>

          <p className="animate-fade-in-up stagger-2 mt-6 max-w-2xl font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
            The trusted marketplace to buy and sell digital assets.
          </p>
          <p className="animate-fade-in-up stagger-2 mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
            Facebook pages, Instagram &amp; TikTok accounts, YouTube channels, websites, domains, apps and online
            businesses — every trade protected by manual escrow.
          </p>

          <div className="animate-fade-in-up stagger-3 mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button as={Link} to="/browse" size="lg">
              Browse listings <ArrowRight className="size-4" />
            </Button>
            <Button as={Link} to="/dashboard/my-listings/new" size="lg" variant="secondary">
              Sell an asset
            </Button>
          </div>

          <form
            onSubmit={handleSearch}
            className="animate-fade-in-up stagger-4 mt-10 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg"
          >
            <Search className="ml-2 size-5 shrink-0 text-ink-soft/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search “Instagram page”, “SaaS”, “domain”…"
              className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50"
            />
            <Button type="submit">Search</Button>
          </form>

          <div className="animate-fade-in-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-ink-soft">
            <span><strong className="text-ink">1,200+</strong> assets sold</span>
            <span><strong className="text-ink">$4.8M+</strong> in escrow processed</span>
            <span><strong className="text-ink">4.8/5</strong> average rating</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4 text-ink-soft/50">
          <ChevronDown className="size-5 animate-bounce" />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">Browse by category</h2>
            <p className="mt-2 text-ink-soft">Ten curated categories, all escrow-protected.</p>
          </div>
          <Link to="/browse" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* FEATURED */}
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

      {/* LATEST */}
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

      {/* TOP SELLERS */}
      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink">Top rated sellers</h2>
          <p className="mt-2 text-ink-soft">Sellers with proven track records and verified identities.</p>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {topSellers.map((seller) => (
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
                    {seller.sales ?? seller.rating_count ?? 0} reviews
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-ink">How Lawareeg works</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">
            A simple four-step manual escrow process built for trust.
          </p>
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
              <p className="mt-1.5 text-sm text-ink-soft">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button as={Link} to="/how-it-works" variant="outline">
            Learn more about escrow <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-sand-deep/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-semibold text-ink">Loved by buyers and sellers</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {MOCK_TESTIMONIALS.map((t) => (
              <div key={t.id} className="rounded-2xl border border-border bg-surface p-6 card-hover">
                <Quote className="size-6 text-primary/30" />
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink-soft">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">Frequently asked questions</h2>
        <div className="mt-10 flex flex-col gap-3">
          {MOCK_FAQS.slice(0, 3).map((faq) => (
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-white/5" />
          <h2 className="relative font-display text-3xl font-semibold text-white sm:text-4xl">
            Ready to buy or sell your next digital asset?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/80">
            Join thousands of buyers and sellers trading safely on Lawareeg.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button as={Link} to="/register" size="lg" className="bg-white text-primary hover:bg-white/90">
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
