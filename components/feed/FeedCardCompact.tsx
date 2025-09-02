// components/feed/FeedCardCompact.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import FeedCardActions from '@/components/feed/FeedCardActions'
import type { Tables } from '@/types/supabase'

type CreatorProfile = Tables<'creator_profiles'>

type Props = {
  id: string
  title: string
  creator?: CreatorProfile | null
  rating?: number | null
  className?: string
}

function ratingToPercent(r?: number | null) {
  if (r == null || Number.isNaN(r)) return null
  const v = r <= 5 ? (r / 5) * 100 : r
  return Math.min(100, Math.max(0, Math.round(v)))
}
function scoreCls(p: number) {
  if (p >= 75) return 'bg-emerald-500'
  if (p >= 50) return 'bg-amber-500'
  if (p > 0) return 'bg-rose-500'
  return 'bg-muted'
}

export default function FeedCardCompact({
  id,
  title,
  creator,
  rating,
  className,
}: Props) {
  const p = ratingToPercent(rating)

  return (
    <article
      className={cn(
        'group relative flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-e1 hover:shadow-e2 transition',
        className
      )}
    >
      {/* Stretched Link */}
      <Link href={`/story/${id}`} className="absolute inset-0 z-10" aria-label={`Öffne Story: ${title}`}>
        <span className="sr-only">{title}</span>
      </Link>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold tracking-tight group-hover:underline">
          {title}
        </h3>
        {creator ? (
          <div className="mt-1">
            <CreatorMiniProfile creator={creator} size={24} />
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-muted-foreground italic">Kein Creator-Profil</div>
        )}

        {/* Score */}
        <div className="mt-2 w-44">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>🧠 Score</span>
            <span className="font-medium text-foreground">{p == null ? 'n/a' : `${p}%`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full transition-all', p != null ? scoreCls(p) : 'bg-muted')} style={{ width: `${p ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* Actions rechts */}
      <FeedCardActions sessionId={id} title={title} href={`/story/${id}`} size="sm" className="z-20 self-start" />
    </article>
  )
}
