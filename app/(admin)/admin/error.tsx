'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, LayoutDashboard, RefreshCw } from 'lucide-react'
import { Statuskarte, statusAktionHaupt, statusAktionNeben } from '@/components/ui/statuskarte'
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
    <Statuskarte
      symbol={AlertTriangle}
      ton="fehler"
      kicker="Administration"
      titel="Es ist ein Fehler aufgetreten"
      aktionen={
        <>
          <button type="button" onClick={() => reset()} className={statusAktionHaupt}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Neu laden
          </button>
          <Link href="/admin" className={statusAktionNeben}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Zum Dashboard
          </Link>
        </>
      }
    >
      <p>
        Dieser Bereich konnte gerade nicht geladen werden. Du kannst es erneut versuchen oder zum
        Dashboard zurückkehren.
      </p>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="max-h-48 overflow-auto rounded-control bg-muted p-3 text-left text-xs leading-5 text-foreground">
          {String(error?.message ?? 'Unbekannter Fehler')}
        </pre>
      )}
      <p className="break-words text-meta">
        Fehler-ID: <span className="font-mono">{id}</span>
      </p>
      <p className="text-meta">
        Du kannst uns unter{' '}
        <a
          href="mailto:info@jetnity.ch"
          className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          info@jetnity.ch
        </a>{' '}
        schreiben und die angezeigte Fehler-ID angeben.
      </p>
    </Statuskarte>
  )
}
