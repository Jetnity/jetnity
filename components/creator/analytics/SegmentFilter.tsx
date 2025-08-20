'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  { key: 'all', label: 'Alle' },
  { key: 'video', label: 'Video' },
  { key: 'image', label: 'Bild' },
  { key: 'guide', label: 'Guide' },
  { key: 'blog', label: 'Blog' },
  { key: 'story', label: 'Story' },
] as const

export default function SegmentFilter() {
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()
  const current = (search.get('type') ?? 'all').toLowerCase()

  const setType = (key: string) => {
    const params = new URLSearchParams(search.toString())
    params.set('type', key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1">
      {SEGMENTS.map(s => {
        const active = current === s.key
        return (
          <button
            key={s.key}
            onClick={() => setType(s.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              active
                ? 'border border-primary/30 bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={active}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
