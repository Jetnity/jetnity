'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, MapPin, RefreshCw } from 'lucide-react'
import { oeffentlicheFehlerId } from '@/lib/next/oeffentliche-fehler-id'

/**
 * Fehlergrenze für alle Routen unter /app/(public).
 * Fängt Render-/Datenfehler ab und zeigt eine freundliche, handlungsfähige UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[PublicRouteError]', error)
    }
  }, [error])

  // Digest zuerst. Fallback ist useId(): render-rein, je Mount stabil,
  // ohne unreine Zeit- oder Zufallswerte und ohne gemeinsame Konstante.
  const id = oeffentlicheFehlerId(error?.digest, React.useId())

  return (
    <main className="min-h-[70dvh] px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-panel border border-border bg-card p-6 shadow-card sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-display text-foreground [overflow-wrap:anywhere]">
            Das hat gerade nicht funktioniert.
          </h1>
          <p className="mt-4 max-w-prose text-body text-muted-foreground">
            Die Seite konnte nicht geladen werden. Das kann an einer instabilen Verbindung oder an
            einem kurzfristigen Serverproblem liegen.
          </p>

          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-5 max-h-48 overflow-auto rounded-control bg-muted p-4 text-xs leading-5 text-foreground">
              {String(error?.message ?? 'Unbekannter Fehler')}
            </pre>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </button>
            <Link
              href="/reisen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Meine Reisen
            </Link>
          </div>

          <p className="mt-6 break-words text-meta text-muted-foreground">
            Fehler-ID: <span className="font-mono">{id}</span>
          </p>
          <p className="mt-3 text-meta text-muted-foreground">
            Du kannst uns unter{' '}
            <a
              href="mailto:info@jetnity.ch"
              className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              info@jetnity.ch
            </a>{' '}
            schreiben und die angezeigte Fehler-ID angeben.
          </p>
        </div>
      </div>
    </main>
  )
}
