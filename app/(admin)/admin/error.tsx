// app/(admin)/admin/error.tsx
'use client'

import * as React from 'react'
import { oeffentlicheFehlerId } from '@/lib/next/oeffentliche-fehler-id'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Digest zuerst. Fallback ist useId(): render-rein, je Mount stabil,
  // ohne unreine Zeit- oder Zufallswerte und ohne gemeinsame Konstante.
  const id = oeffentlicheFehlerId(error?.digest, React.useId())

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-lg font-semibold text-destructive">Es ist ein Fehler aufgetreten</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dieser Bereich konnte gerade nicht geladen werden. Du kannst es erneut versuchen oder zum
        Dashboard zurückkehren.
      </p>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs leading-5 text-foreground">
          {String(error?.message ?? 'Unbekannter Fehler')}
        </pre>
      )}
      <p className="mt-3 break-words text-xs text-muted-foreground">
        Fehler-ID: <span className="font-mono">{id}</span>
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Du kannst uns unter{' '}
        <a
          href="mailto:info@jetnity.ch"
          className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          info@jetnity.ch
        </a>{' '}
        schreiben und die angezeigte Fehler-ID angeben.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          Neu laden
        </button>
        <a
          href="/admin"
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          Zum Dashboard
        </a>
      </div>
    </div>
  )
}
