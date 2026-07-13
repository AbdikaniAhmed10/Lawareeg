import { Link } from 'react-router-dom'
import { Heart, ShieldCheck, Star, Eye, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { formatCurrency, formatNumber } from '../../lib/format'
import { normalizeListing } from '../../lib/normalize'

export default function ListingCard({ listing, favorited = false, onToggleFavorite, className }) {
  const data = normalizeListing(listing)
  if (!data) return null

  const {
    slug,
    title,
    category,
    price,
    monthly_revenue,
    verified,
    rating,
    reviews_count,
    views,
    seller,
    cover_image,
  } = data

  return (
    <div
      className={clsx(
        'group card-hover relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface',
        className
      )}
    >
      <Link to={`/listings/${slug}`} className="block">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-sand-deep">
          {cover_image ? (
            <img
              src={cover_image}
              alt={title}
              referrerPolicy="no-referrer"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling
                if (fallback) fallback.classList.remove('hidden')
              }}
            />
          ) : null}
          <div
            className={`flex size-full items-center justify-center bg-gradient-to-br from-primary/10 via-sand-deep to-accent/10 ${cover_image ? 'hidden' : ''}`}
          >
            <span className="font-display text-3xl text-primary/30">Lw</span>
          </div>
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {category}
            </span>
            {verified && (
              <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="size-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onToggleFavorite?.(listing)
        }}
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
        aria-label="Toggle favorite"
      >
        <Heart className={clsx('size-4', favorited ? 'fill-danger text-danger' : 'text-ink-soft')} />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link to={`/listings/${slug}`}>
          <h3 className="line-clamp-2 font-medium text-ink transition-colors group-hover:text-primary">{title}</h3>
        </Link>

        <div className="flex items-center gap-3 text-xs text-ink-soft">
          {rating ? (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-accent text-accent" /> {Number(rating).toFixed(1)} ({reviews_count})
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 text-ink-soft/40" /> New
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" /> {formatNumber(views)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-ink-soft">Asking price</p>
            <p className="font-display text-lg font-semibold text-ink">{formatCurrency(price)}</p>
          </div>
          {Number(monthly_revenue) > 0 ? (
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-success">
                <TrendingUp className="size-3.5" /> {formatCurrency(monthly_revenue)}/mo
              </p>
              {seller?.id ? (
                <Link to={`/users/${seller.id}`} className="text-xs text-ink-soft hover:text-primary" onClick={(e) => e.stopPropagation()}>
                  {seller.name}
                </Link>
              ) : (
                <p className="text-xs text-ink-soft">{seller?.name}</p>
              )}
            </div>
          ) : seller?.id ? (
            <Link to={`/users/${seller.id}`} className="text-xs text-ink-soft hover:text-primary" onClick={(e) => e.stopPropagation()}>
              {seller.name}
            </Link>
          ) : (
            seller?.name && <p className="text-xs text-ink-soft">{seller.name}</p>
          )}
        </div>
      </div>
    </div>
  )
}
