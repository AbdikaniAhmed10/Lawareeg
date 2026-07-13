import { SlidersHorizontal, X } from 'lucide-react'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '../../lib/constants'

export default function ListingFilters({ filters, onChange, onReset, className }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
          <SlidersHorizontal className="size-4.5 text-primary" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="size-3.5" /> Reset
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Select
          label="Category"
          placeholder="All categories"
          value={filters.category || ''}
          onChange={(e) => update('category', e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          label="Price range"
          placeholder="Any price"
          value={filters.price || ''}
          onChange={(e) => update('price', e.target.value)}
        >
          <option value="">Any price</option>
          {PRICE_RANGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>

        <Select label="Sort by" value={filters.sort || 'newest'} onChange={(e) => update('sort', e.target.value)}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        <label className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 text-sm text-ink cursor-pointer hover:bg-sand-deep/50 transition-colors">
          <input
            type="checkbox"
            checked={!!filters.verified}
            onChange={(e) => update('verified', e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary/30"
          />
          Verified sellers only
        </label>

        <label className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 text-sm text-ink cursor-pointer hover:bg-sand-deep/50 transition-colors">
          <input
            type="checkbox"
            checked={!!filters.hasRevenue}
            onChange={(e) => update('hasRevenue', e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary/30"
          />
          Generating revenue
        </label>
      </div>
    </div>
  )
}
