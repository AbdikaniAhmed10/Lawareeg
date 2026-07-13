import {
  ThumbsUp,
  Camera,
  Video,
  Globe,
  Smartphone,
  Layers,
  Building2,
  Sparkles,
  Link2,
} from 'lucide-react'

export const CATEGORIES = [
  {
    slug: 'facebook-pages',
    name: 'Facebook Pages',
    icon: ThumbsUp,
    description: 'Established pages with real followers and engagement.',
  },
  {
    slug: 'instagram-accounts',
    name: 'Instagram Accounts',
    icon: Camera,
    description: 'Niche and influencer accounts ready to grow.',
  },
  {
    slug: 'tiktok-accounts',
    name: 'TikTok Accounts',
    icon: Sparkles,
    description: 'Viral-ready accounts across trending niches.',
  },
  {
    slug: 'youtube-channels',
    name: 'YouTube Channels',
    icon: Video,
    description: 'Monetized and monetization-ready channels.',
  },
  {
    slug: 'websites',
    name: 'Websites',
    icon: Globe,
    description: 'Content sites, blogs, and revenue-generating websites.',
  },
  {
    slug: 'domains',
    name: 'Domains',
    icon: Link2,
    description: 'Premium and brandable domain names.',
  },
  {
    slug: 'mobile-apps',
    name: 'Mobile Apps',
    icon: Smartphone,
    description: 'iOS and Android apps with active users.',
  },
  {
    slug: 'saas-projects',
    name: 'SaaS Projects',
    icon: Layers,
    description: 'Subscription software with recurring revenue.',
  },
  {
    slug: 'digital-businesses',
    name: 'Digital Businesses',
    icon: Building2,
    description: 'Full online businesses, ready to hand over.',
  },
  {
    slug: 'other-digital-assets',
    name: 'Other Digital Assets',
    icon: Sparkles,
    description: 'Newsletters, communities, and more.',
  },
]

export const ORDER_STATUSES = {
  pending_payment: { label: 'Pending Payment', color: 'warning' },
  payment_under_review: { label: 'Payment Under Review', color: 'info' },
  payment_confirmed: { label: 'Payment Confirmed', color: 'info' },
  seller_transferring: { label: 'Seller Transferring', color: 'info' },
  buyer_confirmation: { label: 'Awaiting Buyer Confirmation', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'neutral' },
  disputed: { label: 'Disputed', color: 'danger' },
}

export const ORDER_TIMELINE_STEPS = [
  'pending_payment',
  'payment_under_review',
  'payment_confirmed',
  'seller_transferring',
  'buyer_confirmation',
  'completed',
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export const PRICE_RANGES = [
  { value: '0-100', label: 'Under $100' },
  { value: '100-500', label: '$100 – $500' },
  { value: '500-2000', label: '$500 – $2,000' },
  { value: '2000-10000', label: '$2,000 – $10,000' },
  { value: '10000-', label: '$10,000+' },
]

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)
}
