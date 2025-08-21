'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const RANGES = [
  { key: '30', label: '30T' },
  { key: '90', label: '90T' },
  { key: '180', label: '180T' },
  { key: 'all', label: 'Gesamt' },
] as const

export default function TimeframeTabs() {
  const pathname = usePathname()
  const search = useSearchParams()
  const current = (search.get('range') ?? '90').toLowerCase()

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1">
      {RANGES.map(r => {
        const href = `${pathname}?range=${r.key}`
        const active = current === r.key
        return (
          <Link
            key={r.key}
            href={href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              active
                ? 'border border-primary/30 bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {r.label}
          </Link>
        )
      })}
    </div>
  )
}
