import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Headset } from 'lucide-react'
import Button from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'

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
  {
    q: 'Is there a fee to list an asset?',
    a: 'Listing is completely free. Lawareeg only charges a small commission on successfully completed sales.',
  },
  {
    q: 'How do I know a seller or buyer is trustworthy?',
    a: 'Verified sellers display a verification badge after completing our identity and ownership checks. You can also review ratings and past sales history before buying.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <BackButton to="/" label="Back to home" className="mb-8" preferHistory={false} />
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-ink">Frequently asked questions</h1>
        <p className="mt-3 text-ink-soft">Everything you need to know about buying and selling on Lawareeg.</p>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx
          return (
            <div key={faq.q} className="overflow-hidden rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink cursor-pointer"
              >
                {faq.q}
                <ChevronDown className={`size-4 shrink-0 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-5 text-sm text-ink-soft transition-all ${isOpen ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                {faq.a}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-sand-deep/40 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Headset className="size-5.5" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink">Still have questions?</h3>
        <p className="max-w-sm text-sm text-ink-soft">Message Lawareeg support in the app — an admin will reply in your inbox.</p>
        <Button as={Link} to="/dashboard/messages?support=1" variant="secondary">
          Contact support
        </Button>
      </div>
    </div>
  )
}
