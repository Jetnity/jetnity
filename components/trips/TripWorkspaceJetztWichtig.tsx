'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronRight, Clock3, Info } from 'lucide-react'

import type {
  AttentionAbleitung,
  AttentionAktion,
  AttentionEbene,
  AttentionLeerstand,
  AttentionPunkt,
  AttentionSchwere,
} from '@/lib/trips/attention'
import { attentionGruppieren } from '@/lib/trips/attention-presentation'
import { cn } from '@/lib/utils'

const LEERSTAND_TEXT: Record<AttentionLeerstand, string> = {
  nichts_dringend_geprueft: 'Im Moment nichts Dringendes. Die relevanten Prüfungen sind gelaufen.',
  noch_nicht_geprueft: 'Einige Prüfungen wurden noch nicht ausgeführt.',
  noch_nicht_pruefbar: 'Für einzelne Prüfungen fehlt noch notwendiger Kontext.',
  pruefung_nicht_verfuegbar: 'Einzelne Prüfungen sind derzeit nicht verfügbar.',
}

const SCHWERE_SYMBOL: Record<AttentionSchwere, typeof Info> = {
  blockierend: AlertTriangle,
  bald: Clock3,
  hinweis: Info,
}

const EBENE_TEXT: Record<AttentionEbene, string> = {
  reise: 'Diese Reise',
  etappe: 'Etappe',
  tag: 'Tag',
  item: 'Punkt',
  person: 'Reisende Person',
}

export default function TripWorkspaceJetztWichtig({
  attention,
  onAktion,
}: {
  attention: AttentionAbleitung
  onAktion: (aktion: AttentionAktion) => void
}) {
  const [weitereOffen, setWeitereOffen] = useState(false)
  const gruppen = attentionGruppieren(attention.punkte)
  // Das bestehende Limit gilt hier für Gruppen; die kanonischen Listen bleiben unverändert.
  const limit = attention.sichtbar.length
  const sichtbare = weitereOffen ? gruppen : gruppen.slice(0, limit)
  const weitereAnzahl = Math.max(0, gruppen.length - limit)

  return (
    <section
      aria-label="Jetzt wichtig"
      data-attention-leerstand={attention.leerstand ?? undefined}
      data-attention-safety={attention.orchestrierung.safety}
      data-attention-seasonal={attention.orchestrierung.seasonal}
      className="min-w-0 max-w-full overflow-hidden rounded-[24px] border border-line-200 bg-white"
    >
      <div className="lg:grid lg:grid-cols-[minmax(14rem,0.34fr)_minmax(0,1fr)]">
        <div className="bg-brand-800 px-4 py-4 text-white lg:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-citrus-400">Jetzt wichtig</p>
          <h3 className="mt-1 hyphens-auto break-words text-lg font-semibold tracking-[-0.03em]">
            Was jetzt Aufmerksamkeit braucht
          </h3>
        </div>
        <div className="min-w-0 px-3 py-3 sm:px-4">
          {attention.leerstand &&
          (attention.leerstand !== 'nichts_dringend_geprueft' || attention.punkte.length === 0) ? (
            <p className="hyphens-auto break-words text-sm leading-6 text-ink-800">
              {LEERSTAND_TEXT[attention.leerstand]}
            </p>
          ) : null}

          {sichtbare.length > 0 && (
            <ul className={cn('grid gap-px overflow-hidden rounded-2xl bg-line-100', attention.leerstand ? 'mt-3' : undefined)}>
              {sichtbare.map((eintrag, index) => (
                <AttentionZeile
                  key={eintrag.punkt.id}
                  punkt={eintrag.punkt}
                  anzahl={eintrag.anzahl}
                  zuerst={index === 0}
                  onAktion={onAktion}
                />
              ))}
            </ul>
          )}

          {weitereAnzahl > 0 && (
            <button
              type="button"
              aria-expanded={weitereOffen}
              onClick={() => setWeitereOffen((bisher) => !bisher)}
              className="mt-3 flex min-h-11 w-full max-w-full flex-wrap items-center whitespace-normal text-left text-sm font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              {weitereOffen
                ? 'Weniger anzeigen'
                : `${weitereAnzahl === 1 ? '1 weitere Hinweisgruppe' : `${weitereAnzahl} weitere Hinweisgruppen`} anzeigen`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function AttentionZeile({
  punkt,
  anzahl,
  zuerst,
  onAktion,
}: {
  punkt: AttentionPunkt
  anzahl: number
  zuerst: boolean
  onAktion: (aktion: AttentionAktion) => void
}) {
  const Symbol = SCHWERE_SYMBOL[punkt.schwere]
  const inhalt = (
    <>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          punkt.schwere === 'blockierend' ? 'bg-brand-800 text-citrus-400' : 'bg-surface-50 text-brand-800',
        )}
      >
        <Symbol className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-600">
          {EBENE_TEXT[punkt.ebene]}
        </span>
        <strong
          className={cn(
            'mt-0.5 block hyphens-auto break-words font-semibold text-brand-800',
            zuerst ? 'text-base' : 'text-sm',
          )}
        >
          {punkt.titel}
        </strong>
        {anzahl > 1 && (
          <span className="mt-1 block hyphens-auto break-words text-sm text-ink-700">
            {anzahl} Einzelprüfungen betroffen
          </span>
        )}
        <span className="sr-only">{({ unknown: 'Noch unklar', insufficient_context: 'Angaben fehlen', unavailable: 'Nicht verfügbar', stale: 'Erneut prüfen', error: 'Prüfung fehlgeschlagen', warning: 'Hinweis', known_gap: 'Im Plan offen', ungeprueft: 'Noch nicht geprüft' })[punkt.lage]}</span>
      </span>
      {punkt.aktion ? <ChevronRight className="h-4 w-4 shrink-0 text-brand-800" aria-hidden="true" /> : null}
    </>
  )

  if (punkt.aktion) {
    return (
      <li>
        <button
          type="button"
          data-attention-punkt={punkt.id}
          data-attention-lage={punkt.lage}
          onClick={() => onAktion(punkt.aktion!)}
          className="flex min-h-11 w-full items-center gap-3 bg-white px-3 py-3 text-left hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {inhalt}
        </button>
      </li>
    )
  }

  return (
    <li
      data-attention-punkt={punkt.id}
      data-attention-lage={punkt.lage}
      className="flex min-h-11 items-center gap-3 bg-white px-3 py-3"
    >
      {inhalt}
    </li>
  )
}
