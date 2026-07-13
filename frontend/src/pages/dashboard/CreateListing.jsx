import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ListingForm from '../../components/listings/ListingForm'
import Alert from '../../components/ui/Alert'
import listingsApi from '../../api/listings'
import BackButton from '../../components/ui/BackButton'

export default function CreateListing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: listingsApi.categories,
    retry: 0,
  })
  const categories = categoriesData?.data || []

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
          platform: payload.preview?.platform || null,
        },
      }

      const res = await listingsApi.create(body)
      const listing = res?.data
      setCreated(listing)

      if (payload.images?.length && listing?.id) {
        const formData = new FormData()
        payload.images.forEach((file) => formData.append('screenshots[]', file))
        try {
          await listingsApi.uploadScreenshot(listing.id, formData)
        } catch {
          // Listing exists even if screenshot upload fails
        }
      }

      setTimeout(() => navigate('/dashboard/my-listings'), 2500)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.category_id?.[0] ||
          err?.response?.data?.errors?.title?.[0] ||
          'Could not submit your listing. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <BackButton to="/dashboard/my-listings" label="Back to my listings" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Create a listing</h1>
        <p className="mt-1 text-ink-soft">
          Submit your digital asset. You will get a verification code to prove ownership before admin approval.
        </p>
      </div>

      {created && (
        <Alert variant="success" title="Listing submitted">
          Your ownership code is <strong>{created.ownership_verification_code}</strong>. Place it on the asset, then open
          My Listings and click &quot;I&apos;ve added the code&quot;. Redirecting…
        </Alert>
      )}

      {!created && <ListingForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Submit for review" />}
    </div>
  )
}
