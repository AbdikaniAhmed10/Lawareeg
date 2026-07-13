import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { CATEGORIES } from '../../lib/constants'
import BrandLogo from '../ui/BrandLogo'

const TIKTOK_URL = 'https://www.tiktok.com/@lawareeg1'
const WHATSAPP_URL = 'https://wa.me/252687249986'
const WHATSAPP_DISPLAY = '+252 687 249 986'

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21 4.7 16.5A9 9 0 1 1 8 19.5L3 21Z" />
      <path d="M9.5 9.5c.4 1.6 1.9 3.1 3.5 3.5l1.2-.6c.2-.1.5 0 .6.2l.8 1.6c.1.3.1.5-.1.7-1.2.9-2.8.8-4.2.1-1.8-.9-3.2-2.4-3.9-4.3-.5-1.3-.5-2.8.2-4 .2-.2.5-.3.7-.1l1.6.8c.2.1.3.4.2.6l-.6 1.2Z" />
    </svg>
  )
}

export function SocialLinks({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Lawareeg on TikTok"
        title="TikTok"
        className="flex size-10 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-primary hover:text-primary"
      >
        <TikTokIcon className="size-4.5" />
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
        title="WhatsApp"
        className="flex size-10 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-primary hover:text-primary"
      >
        <WhatsAppIcon className="size-4.5" />
      </a>
    </div>
  )
}

export default function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="border-t border-border bg-sand-deep/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-ink-soft">© {new Date().getFullYear()} Lawareeg</p>
          <SocialLinks />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </div>
      </footer>
    )
  }

  return (
    <footer className="overflow-x-clip border-t border-border bg-sand-deep/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-5">
          <div className="col-span-2 min-w-0">
            <BrandLogo to="/" size="md" />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              The trusted marketplace for buying and selling digital assets — social pages, websites, apps and online
              businesses — protected by manual escrow.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
              <ShieldCheck className="size-4" /> Every trade is escrow protected
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Contact</p>
              <SocialLinks />
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-ink-soft transition-colors hover:text-primary"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-ink">Categories</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link to={`/category/${c.slug}`} className="text-sm text-ink-soft transition-colors hover:text-primary">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-ink">Company</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  Browse Listings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-ink">Account</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link to="/login" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/dashboard/my-listings" className="text-sm text-ink-soft transition-colors hover:text-primary">
                  Sell an asset
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-ink-soft">© {new Date().getFullYear()} Lawareeg. All rights reserved.</p>
          <p className="text-xs text-ink-soft">Manual escrow marketplace — built for trust, made for creators.</p>
        </div>
      </div>
    </footer>
  )
}
