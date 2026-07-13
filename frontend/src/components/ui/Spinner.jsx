import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function Spinner({ className, size = 'md', label }) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-9' }
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 text-primary', className)}>
      <Loader2 className={clsx('animate-spin', sizes[size])} />
      {label && <p className="text-sm text-ink-soft">{label}</p>}
    </div>
  )
}
