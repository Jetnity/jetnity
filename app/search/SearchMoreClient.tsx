// app/search/SearchMoreClient.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInfiniteSearch, type SearchItem } from '@/lib/hooks/useInfiniteSearch'
import { Search, Loader2, MapPin, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SearchMoreClient({
  baseParams,
  initialCursor,
  initialColumns = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
}: {
  baseParams: Record<string, string | number | undefined>
  initialCursor: string | null
  initialColumns?: string
}) {
  const { items, hasMore, loading, error, loadMore, sentinelRef } =
    useInfiniteSearch({ baseParams, initialCursor })
  const [showTop, setShowTop] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="mt-6">
      <div className={initialColumns}>
        {items.map((u) => <ResultCard key={u.id} upload={u} />)}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
      </div>

      <div className="mt-6 flex items-center justify-center">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loading && hasMore && (
          <button
            onClick={loadMore}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm hover:bg-card"
          >
            Mehr laden
          </button>
        )}
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lädt …
          </div>
        )}
      </div>

      <div ref={sentinelRef} className="h-px w-full" />

      {/* Back-to-Top */}
      <button
        aria-label="Nach oben"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'fixed bottom-6 right-6 z-50 rounded-full border border-border bg-card/80 p-3 shadow backdrop-blur transition',
          showTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </section>
  )
}

function ResultCard({ upload }: { upload: SearchItem }) {
  const u = upload
  const img = u.image_url
  const title = u.title || 'Reiseidee'
  const region = u.region || null
  const city = u.city || null
  const mood = u.mood || null
  const tags: string[] = [mood, region].filter(Boolean) as string[]
  const isVirtual = Boolean(u.is_virtual)
  const href = `/search?city=${encodeURIComponent(city ?? '')}&region=${encodeURIComponent(region ?? '')}&mood=${encodeURIComponent(mood ?? '')}`

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur',
        'shadow-sm transition hover:shadow-xl'
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-emerald-400/20">
            <MapPin className="h-8 w-8" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {city && <><span>{city}</span>{region && ' · '}</>}
          {region && <span>{region}</span>}
          {(!city && !region) && 'Inspiration'}
        </p>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Jetzt entdecken <Search className="h-4 w-4" />
          </Link>
          {isVirtual && (
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-700">
              Empfohlen
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card/60">
      <div className="aspect-[4/3] w-full rounded-t-2xl bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-muted" />
          <div className="h-6 w-14 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
