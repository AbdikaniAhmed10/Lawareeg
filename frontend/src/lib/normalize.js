import { mediaUrl } from './mediaUrl'

/**
 * Normalize listing payloads from the API (nested category/seller/statistics)
 * and mock data (flat fields) into one shape the UI can safely render.
 */
export function normalizeListing(listing) {
  if (!listing) return null

  const categoryName =
    typeof listing.category === 'string'
      ? listing.category
      : listing.category?.name || listing.category_name || 'Digital Asset'

  const categorySlug =
    listing.category_slug ||
    (typeof listing.category === 'object' ? listing.category?.slug : null) ||
    null

  const stats = listing.statistics && typeof listing.statistics === 'object' ? listing.statistics : {}

  const coverImage = mediaUrl(
    listing.cover_image ||
      listing.avatar_url ||
      listing.cover_image_url ||
      listing.screenshots?.[0]?.url ||
      listing.screenshots?.[0]?.path ||
      null
  )

  const rating =
    listing.rating ??
    listing.seller?.rating_avg ??
    listing.seller?.rating ??
    null

  const reviewsCount =
    listing.reviews_count ?? listing.seller?.rating_count ?? 0

  return {
    ...listing,
    category: categoryName,
    category_slug: categorySlug,
    category_obj: typeof listing.category === 'object' ? listing.category : null,
    verified: Boolean(listing.verified ?? listing.is_verified_ownership),
    views: listing.views ?? listing.views_count ?? 0,
    monthly_revenue:
      listing.monthly_revenue ?? stats.monthly_revenue ?? stats.revenue ?? 0,
    cover_image: coverImage,
    avatar_url: mediaUrl(listing.avatar_url || coverImage),
    rating: rating != null ? Number(rating) : null,
    reviews_count: Number(reviewsCount) || 0,
    seller: listing.seller
      ? {
          ...listing.seller,
          rating: listing.seller.rating ?? listing.seller.rating_avg ?? null,
          verified: Boolean(listing.seller.verified ?? listing.seller.is_verified_seller),
        }
      : listing.seller,
  }
}

export function normalizeListings(items) {
  if (!Array.isArray(items)) return []
  return items.map(normalizeListing).filter(Boolean)
}
