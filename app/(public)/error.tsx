'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

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
    // Optionales Logging (nur lokal/Dev nützlich)
    // In Prod ggf. an Monitoring senden (Sentry o.ä.)
    // eslint-disable-next-line no-console
    console.error('[PublicRouteError]', error)
  }, [error])

  // simple (pseudo-)ID für Supportfälle
  const id =
    (error?.digest && `#${error.digest}`) ||
    `#${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Upps, da ist etwas schiefgelaufen</h1>
        </div>

        <p className="mb-4 text-muted-foreground">
          Die Seite konnte gerade nicht geladen werden. Das kann an einer instabilen Verbindung oder
          an einem kurzfristigen Serverproblem liegen.
        </p>

        {/* In Development zeigen wir eine kurze, sichere Fehlerzusammenfassung */}
        {process.env.NODE_ENV !== 'production' && (
          <pre className="mb-6 max-h-48 overflow-auto rounded-xl bg-muted/50 p-4 text-sm">
{String(error?.message ?? 'Unbekannter Fehler')}
          </pre>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Erneut versuchen
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 transition hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Zur Startseite
          </Link>

          <Link
            href="/search?sort=recent"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 transition hover:bg-accent hover:text-accent-foreground"
          >
            Entdecken
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Fehler-ID: <span className="font-mono">{id}</span>
        </p>
      </div>
    </main>
  )
}
