'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import {
  SEASONAL_AKTION_TEXT,
  SEASONAL_FRISCHE_TEXT,
  SEASONAL_KATEGORIE_TEXT,
  SEASONAL_KLASSE_TEXT,
  SEASONAL_RELEVANZ_TEXT,
  seasonalZusammenfassungText,
} from '@/lib/seasonal/anzeige'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { seasonalAnsicht } from '@/lib/seasonal/status'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

export default function ReisezeitHinweise({
  reise,
  evaluations,
}: {
  reise: Trip
  evaluations?: SeasonalEvaluation[]
}) {
  const [offen, setOffen] = React.useState(false)
  const { sichtbare, summary } = seasonalAnsicht(reise, evaluations)
  if (!summary.sichtbar) return null

  return (
    <section
      aria-labelledby="reise-zeit-titel"
      data-seasonal-foundation="ein"
      data-seasonal-status={
        summary.checkState === 'unavailable'
          ? 'unavailable'
          : summary.checkState === 'unknown'
            ? 'unknown'
            : summary.timingCheck > 0
              ? 'timing-check'
              : 'notice'
      }
      className="rounded-2xl border border-line-200 bg-white px-4 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Reisezeit & Saison</p>
      <h3 id="reise-zeit-titel" className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800">
        Typischer saisonaler Kontext für diese Reise
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{seasonalZusammenfassungText(summary)}</p>
      {summary.timingCheck > 0 ? (
        <p className="mt-2 text-sm font-semibold text-brand-800">{SEASONAL_KLASSE_TEXT.timing_check}</p>
      ) : summary.timingNotice > 0 ? (
        <p className="mt-2 text-sm font-semibold text-brand-800">{SEASONAL_KLASSE_TEXT.timing_notice}</p>
      ) : null}
      {sichtbare[0]?.affectedRefs[0]?.label ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">Für: {sichtbare[0].affectedRefs[0].label}</p>
      ) : null}

      {sichtbare.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={offen}
            aria-controls="reise-zeit-detail"
            onClick={() => setOffen((wert) => !wert)}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            {offen ? 'Hinweise schliessen' : 'Hinweise ansehen'}
            <ChevronDown className={cn('h-4 w-4', offen && 'rotate-180')} aria-hidden="true" />
          </button>
          <div id="reise-zeit-detail" hidden={!offen} className={offen ? 'mt-4 grid gap-3' : 'hidden'}>
            {sichtbare.map((eintrag) => (
              <HinweisKarte key={eintrag.factId} evaluation={eintrag} />
            ))}
            <p className="text-xs leading-5 text-ink-800">
              Das ist keine exakte Vorhersage. Jetnity ändert Datum, Ziel oder Etappe nicht automatisch.
            </p>
          </div>
        </>
      )}
    </section>
  )
}

function HinweisKarte({ evaluation }: { evaluation: SeasonalEvaluation }) {
  const betroffen = evaluation.affectedRefs.map((ref) => ref.label).filter(Boolean).join(', ')
  const referenz = evaluation.evidence.referencePeriod
    ? `Klimareferenz ${evaluation.evidence.referencePeriod.startYear}–${evaluation.evidence.referencePeriod.endYear}`
    : null
  return (
    <article
      data-seasonal-class={evaluation.presentationClass}
      className="rounded-2xl border border-line-200 bg-surface-25 px-3 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
        {SEASONAL_KLASSE_TEXT[evaluation.presentationClass]}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-brand-800">
        {evaluation.evidence.headline ?? SEASONAL_KATEGORIE_TEXT[evaluation.category]}
      </h4>
      {betroffen ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">Für diese Region / diesen Zeitraum: {betroffen}</p>
      ) : (
        <p className="mt-1 text-sm leading-6 text-ink-800">{evaluation.reason}</p>
      )}
      <p className="mt-1 text-xs leading-5 text-ink-800">
        {SEASONAL_RELEVANZ_TEXT[evaluation.relevance]}. {evaluation.reason}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-800">
        Als Nächstes: {SEASONAL_AKTION_TEXT[evaluation.nextAction]}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-brand-800">Quelle, Referenzperiode und Aktualität</summary>
        <p className="mt-1 text-xs leading-5 text-ink-800">
          {evaluation.evidence.authority ?? 'Quelle nicht genannt'} · {SEASONAL_FRISCHE_TEXT[evaluation.freshness]}
          {evaluation.evidence.checkedAt ? ` · Stand ${evaluation.evidence.checkedAt.slice(0, 10)}` : ''}
        </p>
        {referenz ? <p className="mt-1 text-xs leading-5 text-ink-800">{referenz}</p> : null}
        {evaluation.evidence.sourceUrl ? (
          <p className="mt-1 break-all text-xs leading-5 text-ink-800">{evaluation.evidence.sourceUrl}</p>
        ) : null}
      </details>
    </article>
  )
}
