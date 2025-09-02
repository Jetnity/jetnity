// components/feed/FeedCard.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import FeedCardActions from '@/components/feed/FeedCardActions'
import { cn } from '@/lib/utils'
import { incrementSessionImpression } from '@/lib/supabase/actions'
import type { Tables } from '@/types/supabase'

type CreatorProfile = Tables<'creator_profiles'>

interface FeedCardProps {
  id: string
  title: string
  rating?: number | null
  imageUrl?: string | null
  creator?: CreatorProfile | null
  className?: string
}

/** clamp helper */
function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n))
}

/** tolerant: akzeptiert 0–5 oder 0–100 und liefert Prozentwert */
function ratingToPercent(r?: number | null) {
  if (r == null || Number.isNaN(r)) return null
  const v = r <= 5 ? (r / 5) * 100 : r
  return clamp(Math.round(v))
}

/** Farbe abhängig vom Score */
function scoreClass(perc: number) {
  if (perc >= 75) return 'bg-emerald-500'
  if (perc >= 50) return 'bg-amber-500'
  if (perc > 0) return 'bg-rose-500'
  return 'bg-muted'
}

export default function FeedCard({
  id,
  title,
  rating,
  imageUrl,
  creator,
  className,
}: FeedCardProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const firedRef = React.useRef(false)
  const [imgLoaded, setImgLoaded] = React.useState(false)

  // Impression nur, wenn Karte im Viewport sichtbar ist (einmalig)
  React.useEffect(() => {
    const el = cardRef.current
    if (!el || firedRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        const [e] = entries
        if (e.isIntersecting && !firedRef.current) {
          firedRef.current = true
          // best-effort: Fehler stillschweigend ignorieren
          Promise.resolve(incrementSessionImpression(id)).catch(() => {})
          io.disconnect()
        }
      },
      { rootMargin: '200px 0px 400px 0px', threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [id])

  const percent = React.useMemo(() => ratingToPercent(rating), [rating])
  const scoreLabel = percent == null ? 'n/a' : `${percent}%`

  return (
    <article
      ref={cardRef}
      className={cn(
        'group relative rounded-2xl border border-border bg-card shadow-e1 transition hover:shadow-e3 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Stretched Link */}
      <Link
        href={`/story/${id}`}
        aria-label={`Öffne Story: ${title}`}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">{title}</span>
      </Link>

      {/* Bildbereich */}
      <div className="relative overflow-hidden rounded-2xl p-3 pb-0">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              priority={false}
              onLoadingComplete={() => setImgLoaded(true)}
              className={cn(
                'object-cover transition duration-700',
                imgLoaded ? 'blur-0 scale-100' : 'blur-[8px] scale-[1.03]'
              )}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
              Kein Bild
            </div>
          )}

          {/* Actions oben rechts */}
          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            <FeedCardActions sessionId={id} title={title} href={`/story/${id}`} size="sm" />
          </div>

          {/* dezente Hover-Politur */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
        </div>
      </div>

      {/* Inhalt */}
      <div className="p-4 pt-3">
        <h3 className="line-clamp-2 text-base md:text-lg font-semibold tracking-tight group-hover:underline">
          {title}
        </h3>

        {/* Creator */}
        {creator ? (
          <div className="mt-2">
            <CreatorMiniProfile creator={creator} size={32} />
          </div>
        ) : (
          <div className="mt-2 text-xs text-muted-foreground italic">
            Kein Creator-Profil
          </div>
        )}

        {/* Rating */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>🧠 Score</span>
            <span className="font-medium text-foreground">{scoreLabel}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all', percent != null ? scoreClass(percent) : 'bg-muted')}
              style={{ width: `${percent ?? 0}%` }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Fokus-Ring für Tastatur */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-primary/40 focus-within:ring-2" />
    </article>
  )
}
