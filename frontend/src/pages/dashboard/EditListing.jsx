import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ListingForm from '../../components/listings/ListingForm'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import listingsApi from '../../api/listings'
import BackButton from '../../components/ui/BackButton'

function splitDescription(description = '') {
  const parts = String(description).split(/\n\n+/)
  if (parts.length <= 1) {
    return { summary: description || '', description: description || '' }
  }
  return {
    summary: parts[0],
    description: parts.slice(1).join('\n\n'),
  }
}

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: listingsApi.categories,
    retry: 0,
  })
  const categories = categoriesData?.data || []

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-listing', id],
    queryFn: () => listingsApi.myListing(id),
    retry: 0,
    enabled: !!id,
  })

  const listing = data?.data

  const initialValue = useMemo(() => {
    if (!listing) return null
    const { summary, description } = splitDescription(listing.description)
    const stats = listing.statistics || {}
    const categorySlug =
      listing.category_slug ||
      listing.category?.slug ||
      (typeof listing.category === 'string' ? listing.category : '')

    return {
      title: listing.title || '',
      category: categorySlug || '',
      asset_url: listing.asset_url || listing.public_asset_url || '',
      avatar_url: listing.avatar_url || listing.cover_image || '',
      price: listing.price ?? '',
      monthly_revenue: listing.monthly_revenue ?? stats.monthly_revenue ?? '',
      age_months: stats.age_months ?? '',
      summary,
      description,
      transfer_method: stats.transfer_method || 'full_handover',
    }
  }, [listing])

  const handleSubmit = async (payload) => {
    setLoading(true)
    setError('')
    try {
      const matched = categories.find((c) => c.slug === payload.category)
      if (!matched?.id) {
        setError('Please select a valid category.')
        return
      }

      const body = {
        title: payload.title,
        category_id: matched.id,
        description: [payload.summary, payload.description].filter(Boolean).join('\n\n'),
        price: Number(payload.price),
        asset_url: payload.asset_url,
        avatar_url: payload.avatar_url || null,
        status: 'pending',
        statistics: {
          monthly_revenue: Number(payload.monthly_revenue || 0),
          age_months: Number(payload.age_months || 0),
          transfer_method: payload.transfer_method,
          platform: payload.preview?.platform || listing?.statistics?.platform || null,
        },
      }

      await listingsApi.update(id, body)

      if (payload.images?.length) {
        const formData = new FormData()
        payload.images.forEach((file) => formData.append('screenshots[]', file))
        try {
          await listingsApi.uploadScreenshot(id, formData)
        } catch {
          // Keep listing update even if new screenshots fail
        }
      }

      setSuccess(true)
      setTimeout(() => navigate('/dashboard/my-listings'), 1200)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.listing?.[0] ||
          err?.response?.data?.errors?.asset_url?.[0] ||
          'Could not update this listing right now.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <Spinner className="py-24" />

  if (isError || !listing || !initialValue) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
        <BackButton to="/dashboard/my-listings" label="Back to my listings" preferHistory={false} />
        <Alert variant="danger">Listing not found or you are not allowed to edit it.</Alert>
        <Button as={Link} to="/dashboard/my-listings">
          Back to my listings
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <BackButton to="/dashboard/my-listings" label="Back to my listings" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Edit listing</h1>
        <p className="mt-1 text-ink-soft">
          Update details or the asset link. Saving sends the listing back for admin review.
        </p>
      </div>

      {success && (
        <Alert variant="success" title="Listing updated">
          Your changes have been submitted for review.
        </Alert>
      )}

      {!success && (
        <ListingForm
          key={listing.id}
          initialValue={initialValue}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          submitLabel="Save changes"
        />
      )}
    </div>
  )
}
