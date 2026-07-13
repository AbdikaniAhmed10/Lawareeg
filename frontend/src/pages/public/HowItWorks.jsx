import { Link } from 'react-router-dom'
import { Search, Wallet, ShieldCheck, Handshake, PackageCheck, ArrowRight, AlertTriangle } from 'lucide-react'
import Button from '../../components/ui/Button'
import { ORDER_TIMELINE_STEPS, ORDER_STATUSES } from '../../lib/constants'
import BackButton from '../../components/ui/BackButton'

const BUYER_STEPS = [
  { icon: Search, title: 'Browse & choose an asset', description: 'Explore verified listings and review seller ratings, revenue and history before deciding.' },
  { icon: Wallet, title: 'Pay into escrow', description: 'Click "Buy Now" and pay via bank transfer or mobile money. Upload your payment receipt.' },
  { icon: ShieldCheck, title: 'Admin verifies payment', description: 'Our team confirms your payment was received before instructing the seller to proceed.' },
  { icon: Handshake, title: 'Seller transfers the asset', description: 'The seller hands over full ownership — login credentials, admin access, or domain transfer.' },
  { icon: PackageCheck, title: 'Confirm & funds released', description: 'You confirm you received the asset, and we release the payment to the seller. Done!' },
]

const SELLER_STEPS = [
  { title: 'List your asset for free', description: 'Submit details, screenshots and pricing. Our team reviews listings before they go live.' },
  { title: 'Get discovered by buyers', description: 'Verified buyers browse, message you with questions, and purchase through escrow.' },
  { title: 'Transfer after payment confirmation', description: 'Once admin confirms the buyer\'s payment, you transfer the asset securely.' },
  { title: 'Get paid to your wallet', description: 'After buyer confirmation, funds land in your Lawareeg wallet minus a small commission.' },
  { title: 'Withdraw anytime', description: 'Request a withdrawal to your bank or mobile money account whenever you like.' },
]

export default function HowItWorks() {
  return (
    <div>
      <section className="atmosphere-gradient px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-center">
          <BackButton to="/" label="Back to home" preferHistory={false} />
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">How Lawareeg works</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
          Every transaction on Lawareeg goes through manual escrow — no funds change hands directly between buyer and
          seller until both sides have fulfilled their part.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">For buyers</h2>
        <div className="mt-8 flex flex-col gap-6">
          {BUYER_STEPS.map((step, idx) => (
            <div key={step.title} className="flex gap-5 rounded-2xl border border-border bg-surface p-6 card-hover">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5.5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Step {idx + 1}</p>
                <h3 className="mt-1 font-medium text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand-deep/40 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">For sellers</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SELLER_STEPS.map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface p-6 card-hover">
                <span className="font-display text-2xl font-semibold text-primary/20">{idx + 1}</span>
                <h3 className="mt-2 font-medium text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Order status timeline</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-ink-soft">
          Every order moves through these statuses so both buyer and seller always know where things stand.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {ORDER_TIMELINE_STEPS.map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink">
                {ORDER_STATUSES[step].label}
              </span>
              {idx < ORDER_TIMELINE_STEPS.length - 1 && <ArrowRight className="size-4 text-ink-soft/40" />}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3.5 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
          <p>
            If something goes wrong at any stage, either party can open a dispute and our admin team will step in to
            review evidence and resolve it fairly.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6 lg:px-8">
        <Button as={Link} to="/browse" size="lg">
          Start browsing listings <ArrowRight className="size-4" />
        </Button>
      </section>
    </div>
  )
}
