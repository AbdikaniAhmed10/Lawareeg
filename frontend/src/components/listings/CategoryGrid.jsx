import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { CATEGORIES } from '../../lib/constants'

export default function CategoryGrid({ categories = CATEGORIES }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {categories.map((cat, idx) => {
        const Icon = cat.icon
        return (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className={clsx(
              'group animate-fade-in-up flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 card-hover'
            )}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:size-11">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{cat.name}</p>
              <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{cat.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
