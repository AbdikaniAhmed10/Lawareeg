import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { CATEGORIES } from '../../lib/constants'

export default function CategoryGrid({ categories = CATEGORIES }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((cat, idx) => {
        const Icon = cat.icon
        return (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className={clsx(
              'group animate-fade-in-up flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 card-hover'
            )}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Icon className="size-5.5" />
            </div>
            <div>
              <p className="font-medium text-ink">{cat.name}</p>
              <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{cat.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
