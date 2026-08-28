'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, MapPin, RefreshCw } from 'lucide-react'

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
    console.error('[PublicRouteError]', error)
  }, [error])

  // Support-ID nur aus dem Framework-Digest. Kein Date.now()/Math.random()
  // im Render – Next 16 / react-hooks/purity verbietet unreine Render-Werte.
  const id = error?.digest ? `#${error.digest}` : '#unbekannt'

  return (
    <main className="min-h-[70dvh] bg-surface-75 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,46,42,0.07)] sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-3xl">
            Das hat gerade nicht funktioniert.
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-800">
            Die Seite konnte nicht geladen werden. Das kann an einer instabilen Verbindung oder an
            einem kurzfristigen Serverproblem liegen. Deine gespeicherten Reisen sind davon nicht
            betroffen.
          </p>

          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-5 max-h-48 overflow-auto rounded-2xl bg-surface-50 p-4 text-xs leading-5 text-ink-900">
              {String(error?.message ?? 'Unbekannter Fehler')}
            </pre>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </button>
            <Link
              href="/reisen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:border-line-500"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Meine Reisen
            </Link>
          </div>

          <p className="mt-6 break-words text-xs text-ink-700">
            Fehler-ID: <span className="font-mono">{id}</span>
          </p>
        </div>
      </div>
    </main>
  )
}
