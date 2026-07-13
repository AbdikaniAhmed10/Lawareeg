import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UploadCloud, ArrowRight, ShieldCheck } from 'lucide-react'
import ordersApi from '../../api/orders'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Textarea from '../../components/ui/Textarea'
import BackButton from '../../components/ui/BackButton'

export default function UploadPaymentProof() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please upload your payment receipt to continue.')
      return
    }
    if (String(id).startsWith('demo-')) {
      setError('Order was not created on the server. Go back and click Buy again while logged in.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('note', note)
      await ordersApi.uploadPaymentProof(id, formData)
      navigate(`/checkout/confirm-receipt/${id}`)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.file?.[0] ||
        err?.response?.data?.errors?.order?.[0] ||
        'Could not upload receipt. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton to="/dashboard/orders" label="Back to orders" className="mb-4" />
      <h1 className="font-display text-2xl font-semibold text-ink">Upload payment proof</h1>
      <p className="mt-1 text-ink-soft">Step 2 of 3 — Our team will verify your payment</p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-border bg-surface p-6">
        {error && <Alert variant="danger" className="mb-5">{error}</Alert>}

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-12 text-center transition-colors hover:border-primary/50 hover:bg-sand-deep/40">
          <UploadCloud className="size-8 text-ink-soft/60" />
          <span className="text-sm font-medium text-ink">{file ? file.name : 'Click to upload your payment receipt'}</span>
          <span className="text-xs text-ink-soft">Screenshot or photo of your transfer confirmation (JPG, PNG, PDF)</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        <Textarea
          label="Additional notes (optional)"
          placeholder="e.g. transaction reference number, time of payment"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-5"
        />

        <Alert variant="info" className="mt-5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Your order will move to &quot;Payment Under Review&quot; once submitted.
          </div>
        </Alert>

        <Button type="submit" size="lg" className="mt-5 w-full" loading={loading}>
          Submit receipt <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  )
}
