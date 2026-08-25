'use client'

import { useState } from 'react'
import { AlertTriangle, Clock3, Info } from 'lucide-react'

import type { Arbeitsbereich } from '@/lib/trips/arbeitsbereich'
import type {
  AttentionAbleitung,
  AttentionLeerstand,
  AttentionPunkt,
  AttentionSchwere,
} from '@/lib/trips/attention'
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

export default function TripWorkspaceJetztWichtig({
  attention,
  onBereich,
}: {
  attention: AttentionAbleitung
  onBereich: (bereich: Arbeitsbereich) => void
}) {
  const [weitereOffen, setWeitereOffen] = useState(false)
  const sichtbare = weitereOffen ? attention.punkte : attention.sichtbar

  return (
    <section
      aria-label="Jetzt wichtig"
      data-attention-leerstand={attention.leerstand ?? undefined}
      data-attention-safety={attention.orchestrierung.safety}
      data-attention-seasonal={attention.orchestrierung.seasonal}
      className="min-w-0 max-w-full overflow-x-hidden rounded-2xl border border-line-200 bg-white px-3 py-4 sm:px-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 break-words">Jetzt wichtig</p>
      <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800 break-words hyphens-auto">
        Was jetzt Aufmerksamkeit braucht
      </h3>
      {attention.leerstand &&
      (attention.leerstand !== 'nichts_dringend_geprueft' || attention.punkte.length === 0) ? (
        <p className="mt-1 text-sm leading-6 text-ink-800 break-words hyphens-auto">
          {LEERSTAND_TEXT[attention.leerstand]}
        </p>
      ) : null}

      {sichtbare.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {sichtbare.map((eintrag) => (
            <AttentionZeile key={eintrag.id} punkt={eintrag} onBereich={onBereich} />
          ))}
        </ul>
      )}

      {attention.weitere.length > 0 && (
        <button
          type="button"
          aria-expanded={weitereOffen}
          onClick={() => setWeitereOffen((bisher) => !bisher)}
          className="mt-3 flex min-h-11 w-full max-w-full flex-wrap items-center whitespace-normal text-left text-sm font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {weitereOffen
            ? 'Weniger anzeigen'
            : `${attention.weitere.length === 1 ? '1 weiteren Hinweis' : `${attention.weitere.length} weitere Hinweise`} anzeigen`}
        </button>
      )}
    </section>
  )
}

function AttentionZeile({
  punkt,
  onBereich,
}: {
  punkt: AttentionPunkt
  onBereich: (bereich: Arbeitsbereich) => void
}) {
  const Symbol = SCHWERE_SYMBOL[punkt.schwere]
  const inhalt = (
    <>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          punkt.schwere === 'blockierend' ? 'bg-surface-100 text-brand-800' : 'bg-surface-25 text-ink-800',
        )}
      >
        <Symbol className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-brand-800 break-words hyphens-auto">{punkt.titel}</strong>
        <span className="sr-only">{punkt.lage}</span>
      </span>
    </>
  )

  if (punkt.aktion) {
    return (
      <li>
        <button
          type="button"
          data-attention-punkt={punkt.id}
          data-attention-lage={punkt.lage}
          onClick={() => onBereich(punkt.aktion!.bereich)}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-line-200 bg-surface-0 px-3 py-3 text-left transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
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
      className="flex min-h-11 items-center gap-3 rounded-2xl border border-line-200 bg-surface-0 px-3 py-3"
    >
      {inhalt}
    </li>
  )
}
