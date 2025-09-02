// app/copilot/page.tsx  (oder dein aktueller Pfad)
// Mega-Pro: Streaming + Skeleton + hübsches Header-Panel

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import Link from 'next/link'
import CoPilotFeedServer from '@/components/home/CoPilotFeedServer'

/** Optional: dynamische Meta-Daten */
export async function generateMetadata() {
  const title = 'CoPilot Empfehlungen'
  const description = 'Personalisierte Vorschläge aus deinem Jetnity-Kosmos.'
  return {
    title: `${title} • Jetnity`,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

/** QS-Helper direkt hier, damit keine extra Utils nötig sind */
function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') s.set(k, String(v))
  })
  return s.toString()
}

/** Kleines, hübsches Skeleton für das Streaming-Fallback */
function CoPilotSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card shadow-e1 overflow-hidden animate-pulse"
        >
          <div className="aspect-[16/9] bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/5" />
            <div className="h-3 bg-muted rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function Page() {
  const refreshHref = `?${qs({ ts: Date.now() })}` // harte URL-Aktualisierung ohne Client-Logic

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="surface-1 rounded-2xl p-5 md:p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground border border-border px-2.5 py-1 text-xs font-semibold">
            CoPilot
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
            🚀 CoPilot Empfehlungen
          </h1>
          <p className="text-sm text-muted-foreground">
            Smarte, personalisierte Vorschläge – frisch generiert aus deinem Jetnity-Kosmos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={refreshHref}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            Neu laden
          </Link>
          <a
            href="mailto:support@jetnity.com?subject=Feedback%20zu%20CoPilot&body=Mein%20Feedback%3A%20"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            Feedback geben
          </a>
        </div>
      </header>

      {/* Streamender Feed */}
      <Suspense fallback={<CoPilotSkeleton />}>
        {/* Belasse Props wie bisher – dein Server-Feed liest eigene Kontexte/Session aus */}
        <CoPilotFeedServer />
      </Suspense>

      {/* Footer-Hint */}
      <p className="text-xs text-muted-foreground text-center">
        Tipp: Ein Klick auf <span className="font-medium">Neu laden</span> fordert frische Empfehlungen an.
      </p>
    </main>
  )
}
