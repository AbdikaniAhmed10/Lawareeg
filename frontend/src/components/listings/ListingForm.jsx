import { useEffect, useState } from 'react'
import { UploadCloud, X, Save, Link2, Loader2, ImageIcon } from 'lucide-react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import { CATEGORIES } from '../../lib/constants'
import { mediaUrl } from '../../lib/mediaUrl'
import listingsApi from '../../api/listings'

const DEFAULT_FORM = {
  title: '',
  category: '',
  asset_url: '',
  avatar_url: '',
  price: '',
  monthly_revenue: '',
  age_months: '',
  summary: '',
  description: '',
  transfer_method: 'full_handover',
}

const URL_PLACEHOLDERS = {
  'youtube-channels': 'https://youtube.com/@yourchannel',
  'instagram-accounts': 'https://instagram.com/yourprofile',
  'tiktok-accounts': 'https://tiktok.com/@yourprofile',
  'facebook-pages': 'https://facebook.com/yourpage',
  'twitter-x-accounts': 'https://x.com/yourhandle',
  websites: 'https://yourwebsite.com',
  domains: 'https://yourdomain.com',
  'mobile-apps': 'https://play.google.com/store/apps/details?id=...',
  'saas-projects': 'https://yourproduct.com',
  'digital-businesses': 'https://yourbusiness.com',
  'other-digital-assets': 'https://link-to-your-asset.com',
}

const PLACEMENT_HINTS = {
  'youtube-channels': 'Verification code goes in the YouTube channel About / description.',
  'instagram-accounts': 'Verification code goes temporarily in the Instagram bio.',
  'tiktok-accounts': 'Verification code goes temporarily in the TikTok bio.',
  'facebook-pages': 'Verification code goes in the Facebook Page About section.',
  'twitter-x-accounts': 'Verification code goes temporarily in the X bio.',
  websites: 'Verification code goes on the homepage, footer, or a temporary page.',
  domains: 'Verification code goes in a DNS TXT record (or a page on that domain).',
  'mobile-apps': 'Verification code goes in the store listing description or in-app About.',
  'saas-projects': 'Verification code goes on the product homepage or settings page.',
  'digital-businesses': 'Verification code goes somewhere only the owner can edit.',
  'other-digital-assets': 'Verification code goes somewhere only the owner can edit.',
}

export default function ListingForm({ initialValue, onSubmit, submitLabel = 'Submit for review', loading, error }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialValue })
  const [images, setImages] = useState([])
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [avatarBroken, setAvatarBroken] = useState(false)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    const raw = form.asset_url?.trim()
    if (!raw || raw.length < 8) {
      setPreview(null)
      setPreviewError('')
      setAvatarBroken(false)
      return undefined
    }

    // Clean copy/paste from mobile share sheets (quotes, newlines, tracking noise)
    const url = raw.replace(/^['"`]+|['"`]+$/g, '').replace(/\s+/g, '')

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      setPreviewError('')
      setAvatarBroken(false)
      try {
        const res = await listingsApi.previewAsset({
          url,
          category_slug: form.category || undefined,
        })
        const data = res?.data
        setPreview(data || null)
        if (data?.url && data.url !== form.asset_url) {
          setForm((f) => ({ ...f, asset_url: data.url }))
        }
        if (data?.avatar_url) {
          setForm((f) => ({ ...f, avatar_url: data.avatar_url }))
        }
        if (data?.title) {
          setForm((f) => (f.title ? f : { ...f, title: data.title }))
        }
        if (!data?.avatar_url) {
          setPreviewError(
            'Could not find a profile picture from this share link. Paste the public profile URL (e.g. tiktok.com/@user) or continue with screenshots.'
          )
        }
      } catch {
        setPreview(null)
        setPreviewError(
          'Could not fetch this shared link. Short app links sometimes fail — open the profile in a browser, copy the full profile URL, and paste that instead.'
        )
      } finally {
        setPreviewLoading(false)
      }
    }, 900)

    return () => clearTimeout(timer)
  }, [form.asset_url, form.category])

  const avatarSrc = mediaUrl(preview?.avatar_url || form.avatar_url)

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    setImages((prev) => [...prev, ...files].slice(0, 6))
  }

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.({ ...form, images, preview })
  }

  const placeholder = URL_PLACEHOLDERS[form.category] || 'https://link-to-your-asset.com'
  const placement = preview?.placement_hint || PLACEMENT_HINTS[form.category] || PLACEMENT_HINTS['other-digital-assets']

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Asset profile link</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Paste the public profile / channel / website URL. App share links (TikTok vm.tiktok.com, Instagram igsh=, etc.)
          are expanded automatically when possible.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Asset / profile URL"
            icon={Link2}
            type="url"
            placeholder={placeholder}
            value={form.asset_url}
            onChange={(e) => update('asset_url', e.target.value)}
            required
          />
        </div>

        {form.category && (
          <Alert variant="info" className="mt-4">
            <strong>Where the verification code will go:</strong> {placement}
          </Alert>
        )}

        <div className="mt-5 rounded-xl border border-border bg-sand-deep/40 p-4">
          <p className="text-sm font-medium text-ink">Profile preview</p>
          {previewLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <Loader2 className="size-4 animate-spin" /> Fetching avatar from the link…
            </div>
          ) : avatarSrc && !avatarBroken ? (
            <div className="mt-3 flex items-center gap-4">
              <img
                src={avatarSrc}
                alt="Asset avatar"
                className="size-16 rounded-xl object-cover border border-border bg-surface"
                referrerPolicy="no-referrer"
                onError={() => {
                  setAvatarBroken(true)
                  setPreviewError(
                    'Profile image link expired or was blocked. Paste the profile URL again to re-fetch, or upload a screenshot.'
                  )
                }}
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{preview?.title || form.title || 'Profile found'}</p>
                <p className="text-xs capitalize text-ink-soft">
                  {(preview?.platform || 'asset')} profile image {preview?.avatar_url ? 'detected' : 'saved'}
                </p>
                {preview?.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{preview.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 text-sm text-ink-soft">
              <span className="flex size-16 items-center justify-center rounded-xl border border-dashed border-border bg-surface">
                <ImageIcon className="size-5 opacity-50" />
              </span>
              Enter a valid profile link to load the avatar.
            </div>
          )}
          {previewError && <p className="mt-2 text-xs text-warning">{previewError}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Basic information</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Listing title"
            placeholder="e.g. Fitness Motivation Facebook Page — 450K Followers"
            containerClassName="sm:col-span-2"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
          <Select label="Transfer method" value={form.transfer_method} onChange={(e) => update('transfer_method', e.target.value)}>
            <option value="full_handover">Full account handover</option>
            <option value="domain_transfer">Domain transfer</option>
            <option value="admin_access">Admin access grant</option>
            <option value="source_code">Source code + assets</option>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Pricing &amp; performance</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Asking price (USD)" type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} required />
          <Input label="Monthly revenue (USD)" type="number" min="0" value={form.monthly_revenue} onChange={(e) => update('monthly_revenue', e.target.value)} />
          <Input label="Asset age (months)" type="number" min="0" value={form.age_months} onChange={(e) => update('age_months', e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Description</h2>
        <div className="mt-5 flex flex-col gap-4">
          <Textarea
            label="Short summary"
            rows={2}
            placeholder="One or two sentences that will appear on listing cards."
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
            required
          />
          <Textarea
            label="Full description"
            rows={6}
            placeholder="Describe traffic sources, monetization, included assets, and reason for selling."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink">Extra screenshots</h2>
        <p className="mt-1 text-sm text-ink-soft">Optional analytics screenshots (up to 6). Profile avatar is fetched from the link above.</p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary/50 hover:bg-sand-deep/40">
          <UploadCloud className="size-7 text-ink-soft/60" />
          <span className="text-sm font-medium text-ink">Click to upload or drag and drop</span>
          <span className="text-xs text-ink-soft">PNG, JPG up to 5MB each</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </label>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {images.map((file, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-ink/70 text-white cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg" loading={loading}>
          <Save className="size-4" /> {submitLabel}
        </Button>
      </div>
    </form>
  )
}
