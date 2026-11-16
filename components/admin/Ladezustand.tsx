// components/admin/Ladezustand.tsx
//
// Wie eine Admin-Ansicht sagt, dass sie nichts weiss.
//
// Die Fläche steht hier und nicht in den Karten, weil sie vorher in jeder Karte
// anders aussah: `OverviewCard` zeigte eine Zeile roten Text von zwölf Pixeln
// und darunter trotzdem „Keine Daten", `SecurityWidget` einen Toast, der nach
// vier Sekunden verschwand und die leere Tabelle zurückliess – und die beiden
// Zahlungskarten zeigten gar nichts (ADR-0040).
//
// Kein neues Aussehen: Rahmen, Radius und die Fehlerfarben sind dieselben, die
// die Formulare in `components/auth` für ihre Meldungen benutzen.

'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Fehler } from '@/lib/admin/ladezustand'
import { cn } from '@/lib/utils'
import { ADMIN_LESE_TEXTE } from '@/lib/localization/admin-lese-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

type Props = {
  fehler: Fehler
  /** Fehlt sie, erscheint keine Schaltfläche – etwa während ein Lauf läuft. */
  onWiederholen?: () => void
  laeuft?: boolean
  /**
   * Für den Fall, dass noch Daten von vorher auf dem Schirm stehen: Dann ist
   * nicht die Ansicht leer, sondern die Aktualisierung gescheitert.
   */
  veraltet?: boolean
  className?: string
  /** Presentation only; original diagnostics and retry semantics are unchanged. */
  sprache?: UiSprache
}

export function Fehlerflaeche({ fehler, onWiederholen, laeuft, veraltet, className, sprache = 'de' }: Props) {
  const texte = ADMIN_LESE_TEXTE[sprache]
  return (
    <div
      role="alert"
      lang={sprache}
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">
            {texte[veraltet ? 'adminRead.refreshFailed' : 'adminRead.loadFailed']}
          </p>
          <p className="mt-1 break-words opacity-90">{fehler.meldung}</p>
          {/* Der Satz ist die Antwort auf 503 aus ADR-0037: Ob es Daten gäbe,
              ist unbekannt. Bei 500 hat die Datenbank geantwortet und
              abgelehnt – dann hilft Wiederholen nicht, und die Zeile fehlt. */}
          {fehler.wiederholbar && <p className="mt-1 opacity-90">{texte['adminRead.retryHint']}</p>}
          {veraltet && <p className="mt-1 opacity-90">{texte['adminRead.staleHint']}</p>}
        </div>
      </div>

      {onWiederholen && (
        <Button
          size="sm"
          variant="outline"
          onClick={onWiederholen}
          disabled={laeuft}
          className="shrink-0 gap-1 self-start"
        >
          <RefreshCw className={cn('h-4 w-4', laeuft && 'animate-spin')} aria-hidden="true" />
          {texte['adminRead.retry']}
        </Button>
      )}
    </div>
  )
}

/**
 * Dieselbe Fläche innerhalb einer Tabelle.
 *
 * Eine Tabelle ohne Zeilen zeigt sonst ihre Leermeldung – „Keine
 * Transaktionen" –, und genau die soll im Fehlerfall nicht erscheinen.
 */
export function Fehlerzeile({ spalten, ...rest }: Props & { spalten: number }) {
  return (
    <tr>
      <td colSpan={spalten} className="p-3">
        <Fehlerflaeche {...rest} />
      </td>
    </tr>
  )
}
