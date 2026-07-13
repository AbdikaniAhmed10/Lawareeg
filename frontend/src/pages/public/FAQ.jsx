import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Headset } from 'lucide-react'
import { MOCK_FAQS } from '../../lib/mockData'
import Button from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'

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
        {MOCK_FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx
          return (
            <div key={faq.q} className="overflow-hidden rounded-xl border border-border bg-surface">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink cursor-pointer"
              >
                {faq.q}
                <ChevronDown className={`size-4 shrink-0 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-5 text-sm text-ink-soft transition-all ${isOpen ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
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
        <p className="max-w-sm text-sm text-ink-soft">
          Message Lawareeg support in the app — an admin will reply in your inbox.
        </p>
        <Button as={Link} to="/dashboard/messages?support=1" variant="secondary">
          Contact support
        </Button>
      </div>
    </div>
  )
}
