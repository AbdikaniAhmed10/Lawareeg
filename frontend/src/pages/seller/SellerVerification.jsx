import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, UploadCloud, ShieldCheck, Clock, XCircle } from 'lucide-react'
import walletApi from '../../api/wallet'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import { useAuthStore } from '../../store/authStore'
import BackButton from '../../components/ui/BackButton'

const STATUS_CONFIG = {
  approved: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', label: 'Verified' },
  verified: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', label: 'Verified' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Under review' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Rejected' },
  none: { icon: BadgeCheck, color: 'text-ink-soft', bg: 'bg-sand-deep', label: 'Not verified' },
  unverified: { icon: BadgeCheck, color: 'text-ink-soft', bg: 'bg-sand-deep', label: 'Not verified' },
}

const ID_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's license" },
  { value: 'other', label: 'Other government ID' },
]

function resolveStatus(payload, user) {
  if (user?.is_verified_seller || payload?.is_verified_seller) return 'approved'
  const fromUser = user?.seller_verification_status
  const fromApi = payload?.seller_verification_status || payload?.data?.status
  return fromApi || fromUser || 'none'
}

export default function SellerVerification() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()
  const [idType, setIdType] = useState('national_id')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['seller-verification'],
    queryFn: walletApi.sellerVerificationStatus,
    retry: 0,
  })

  const submitMutation = useMutation({
    mutationFn: (formData) => walletApi.submitSellerVerification(formData),
    onSuccess: (res) => {
      setSuccess(res?.message || 'Request submitted. An admin will review your documents.')
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ['seller-verification'] })
      if (user) {
        setUser({ ...user, seller_verification_status: 'pending' })
      }
    },
    onError: (err) =>
      setError(
        err?.response?.data?.errors?.document?.[0] ||
          err?.response?.data?.errors?.id_type?.[0] ||
          err?.response?.data?.message ||
          'Could not submit verification. Please try again.'
      ),
  })

  const status = resolveStatus(data, user)
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.none
  const notes = data?.data?.notes

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!file) {
      setError('Please upload a clear photo or PDF of your ID.')
      return
    }
    const formData = new FormData()
    formData.append('id_type', idType)
    formData.append('document', file)
    submitMutation.mutate(formData)
  }

  if (isLoading) return <Spinner className="py-24" />

  const canSubmit = status !== 'approved' && status !== 'verified' && status !== 'pending'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <BackButton to="/dashboard" label="Back to dashboard" preferHistory={false} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Seller verification</h1>
        <p className="mt-1 text-ink-soft">Request a verified badge. An admin reviews your ID, then approves or rejects.</p>
      </div>

      <div className={`flex items-center gap-3 rounded-2xl border border-border p-5 ${config.bg}`}>
        <config.icon className={`size-6 ${config.color}`} />
        <div>
          <p className={`font-medium ${config.color}`}>{config.label}</p>
          <p className="text-sm text-ink-soft">
            {status === 'approved' || status === 'verified'
              ? 'Your account is verified. Buyers will see your verification badge on your profile and listings.'
              : null}
            {status === 'pending' ? 'Your submission is being reviewed by our team.' : null}
            {status === 'rejected'
              ? notes || 'Your last submission was rejected. Please resubmit with clearer documents.'
              : null}
            {status === 'none' || status === 'unverified'
              ? 'Submit your identity document below to request a verified badge.'
              : null}
          </p>
        </div>
      </div>

      {success && <Alert variant="success">{success}</Alert>}

      {canSubmit && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="id_type" className="mb-1.5 block text-sm font-medium text-ink">
                ID type
              </label>
              <select
                id="id_type"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              >
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary/50 hover:bg-sand-deep/40">
              <UploadCloud className="size-7 text-ink-soft/60" />
              <span className="text-sm font-medium text-ink">{file ? file.name : 'Upload a photo or PDF of your ID'}</span>
              <span className="text-xs text-ink-soft">JPG, PNG, or PDF · up to 8MB</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <Button type="submit" loading={submitMutation.isPending} className="w-full">
              Request verification badge
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
