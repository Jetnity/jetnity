// components/creator/CreatorDashboard.tsx
// Server Component (kein 'use client') – kann Client- & Server-Teile rendern
import { Suspense } from 'react'

import CreatorProfileCard from './dashboard/CreatorProfileCard'
import CreatorMediaGrid from './dashboard/CreatorMediaGrid'
import CreatorBlogSection from './dashboard/CreatorBlogSection'
import SessionStatsPanel from './dashboard/SessionStatsPanel'

type Mode = 'sidebar' | 'grid' | 'blog' | 'stats' | 'all'

type LegacyFlags = {
  /** @deprecated verwende stattdessen mode="sidebar" */
  sidebarOnly?: boolean
  /** @deprecated verwende stattdessen mode="grid" */
  gridOnly?: boolean
  /** @deprecated verwende stattdessen mode="blog" */
  blogOnly?: boolean
  /** @deprecated verwende stattdessen mode="stats" */
  statsOnly?: boolean
}

type Props = LegacyFlags & {
  /** Bevorzugtes API: steuert die Ausgabe eindeutig */
  mode?: Mode
}

export default function CreatorDashboard(props: Props) {
  const mode = resolveMode(props)

  switch (mode) {
    case 'sidebar':
      return (
        <Suspense fallback={<CardSkeleton />}>
          <CreatorProfileCard />
        </Suspense>
      )
    case 'grid':
      return (
        <Suspense fallback={<GridSkeleton />}>
          <CreatorMediaGrid />
        </Suspense>
      )
    case 'blog':
      return (
        <Suspense fallback={<ListSkeleton />}>
          <CreatorBlogSection />
        </Suspense>
      )
    case 'stats':
      return (
        <Suspense fallback={<CardSkeleton />}>
          <SessionStatsPanel />
        </Suspense>
      )
    case 'all':
    default:
      return (
        <div className="space-y-10" aria-label="Creator-Dashboard">
          <Suspense fallback={<CardSkeleton />}>
            <CreatorProfileCard />
          </Suspense>

          <Suspense fallback={<GridSkeleton />}>
            <CreatorMediaGrid />
          </Suspense>

          <Suspense fallback={<ListSkeleton />}>
            <CreatorBlogSection />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <SessionStatsPanel />
          </Suspense>
        </div>
      )
  }
}

/* ---------- Helpers ---------- */

function resolveMode({
  mode,
  sidebarOnly,
  gridOnly,
  blogOnly,
  statsOnly,
}: Props): Mode {
  if (mode) return mode
  if (sidebarOnly) return 'sidebar'
  if (gridOnly) return 'grid'
  if (blogOnly) return 'blog'
  if (statsOnly) return 'stats'
  return 'all'
}

/* ---------- Skeletons (a11y-freundlich) ---------- */

function CardSkeleton({ height = 'h-48' as const }: { height?: string }) {
  return (
    <div
      className={`w-full rounded-2xl border border-border bg-card shadow-sm ${height} animate-pulse`}
      role="status"
      aria-label="Lade Bereich …"
      aria-busy="true"
    />
  )
}

function GridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Lade Inhalte …"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-xl border border-border bg-card shadow-sm animate-pulse"
        />
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Lade Liste …" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl border border-border bg-card shadow-sm animate-pulse"
        />
      ))}
    </div>
  )
}
