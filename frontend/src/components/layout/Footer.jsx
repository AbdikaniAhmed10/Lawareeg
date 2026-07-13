import { Link } from 'react-router-dom'
import { ThumbsUp, Camera, MessageCircle, Video, ShieldCheck } from 'lucide-react'
import { CATEGORIES } from '../../lib/constants'
import BrandLogo from '../ui/BrandLogo'

export default function Footer() {
  return (
    <footer className="overflow-x-clip border-t border-border bg-sand-deep/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-5">
          <div className="col-span-2 min-w-0">
            <BrandLogo to="/" size="md" />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              The trusted marketplace for buying and selling digital assets — social pages, websites, apps and online businesses — protected by manual escrow.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
              <ShieldCheck className="size-4" /> Every trade is escrow protected
            </div>
            <div className="mt-5 flex items-center gap-3 text-ink-soft">
              <a href="#" aria-label="Facebook" className="transition-colors hover:text-primary">
                <ThumbsUp className="size-4.5" />
              </a>
              <a href="#" aria-label="Instagram" className="transition-colors hover:text-primary">
                <Camera className="size-4.5" />
              </a>
              <a href="#" aria-label="Twitter" className="transition-colors hover:text-primary">
                <MessageCircle className="size-4.5" />
              </a>
              <a href="#" aria-label="YouTube" className="transition-colors hover:text-primary">
                <Video className="size-4.5" />
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
          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} Lawareeg. All rights reserved.
          </p>
          <p className="text-xs text-ink-soft">Manual escrow marketplace — built for trust, made for creators.</p>
        </div>
      </div>
    </footer>
  )
}
