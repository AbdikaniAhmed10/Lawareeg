import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import BrandLogo from '../components/ui/BrandLogo'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <BrandLogo asLink={false} size="xl" showWordmark={false} imgClassName="rounded-2xl" />
      <h1 className="mt-6 font-display text-4xl font-semibold text-ink">404</h1>
      <p className="mt-2 max-w-sm text-ink-soft">The page you're looking for doesn't exist or may have been moved.</p>
      <Button as={Link} to="/" className="mt-6">
        Back to homepage
      </Button>
    </div>
  )
}
