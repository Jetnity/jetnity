'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import {
  SAFETY_AKTION_TEXT,
  SAFETY_FRISCHE_TEXT,
  SAFETY_KATEGORIE_TEXT,
  SAFETY_KLASSE_TEXT,
  SAFETY_RELEVANZ_TEXT,
  safetyZusammenfassungText,
} from '@/lib/safety/anzeige'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { safetyAnsicht } from '@/lib/safety/status'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

export default function ReiseSicherheit({
  reise,
  evaluations,
}: {
  reise: Trip
  evaluations?: SafetyEvaluation[]
}) {
  const [offen, setOffen] = React.useState(false)
  const { sichtbare, summary } = safetyAnsicht(reise, evaluations)
  if (!summary.sichtbar) return null

  return (
    <section
      aria-labelledby="reise-sicherheit-titel"
      data-safety-foundation="ein"
      data-safety-status={summary.unavailable ? 'unavailable' : summary.critical > 0 ? 'critical' : 'notice'}
      className="rounded-2xl border border-line-200 bg-white px-4 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Sicherheit & Störungen</p>
      <h3 id="reise-sicherheit-titel" className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800">
        Was diese konkrete Reise betreffen kann
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{safetyZusammenfassungText(summary)}</p>
      {summary.critical > 0 ? (
        <p className="mt-2 text-sm font-semibold text-brand-800">{SAFETY_KLASSE_TEXT.critical_warning}</p>
      ) : summary.important > 0 ? (
        <p className="mt-2 text-sm font-semibold text-brand-800">{SAFETY_KLASSE_TEXT.important_notice}</p>
      ) : null}
      {sichtbare[0]?.affectedRefs[0]?.label ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">Betrifft: {sichtbare[0].affectedRefs[0].label}</p>
      ) : null}

      {sichtbare.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={offen}
            aria-controls="reise-sicherheit-detail"
            onClick={() => setOffen((wert) => !wert)}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            {offen ? 'Hinweise schliessen' : 'Hinweise ansehen'}
            <ChevronDown className={cn('h-4 w-4', offen && 'rotate-180')} aria-hidden="true" />
          </button>
          <div id="reise-sicherheit-detail" hidden={!offen} className={offen ? 'mt-4 grid gap-3' : 'hidden'}>
            {sichtbare.map((eintrag) => (
              <HinweisKarte key={eintrag.factId} evaluation={eintrag} />
            ))}
            <p className="text-xs leading-5 text-ink-800">
              Jetnity ändert Route, Etappe oder Buchung nicht automatisch.
            </p>
          </div>
        </>
      )}
    </section>
  )
}

function HinweisKarte({ evaluation }: { evaluation: SafetyEvaluation }) {
  const betroffen = evaluation.affectedRefs.map((ref) => ref.label).filter(Boolean).join(', ')
  return (
    <article
      data-safety-class={evaluation.presentationClass}
      className="rounded-2xl border border-line-200 bg-surface-25 px-3 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
        {SAFETY_KLASSE_TEXT[evaluation.presentationClass]}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-brand-800">
        {evaluation.evidence.headline ?? SAFETY_KATEGORIE_TEXT[evaluation.category]}
      </h4>
      {betroffen ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">Betrifft: {betroffen}</p>
      ) : (
        <p className="mt-1 text-sm leading-6 text-ink-800">{evaluation.reason}</p>
      )}
      <p className="mt-1 text-xs leading-5 text-ink-800">
        {SAFETY_RELEVANZ_TEXT[evaluation.relevance]}. {evaluation.reason}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-800">
        Als Nächstes: {SAFETY_AKTION_TEXT[evaluation.nextAction]}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-brand-800">Quelle und Aktualität</summary>
        <p className="mt-1 text-xs leading-5 text-ink-800">
          {evaluation.evidence.authority ?? 'Quelle nicht genannt'} · {SAFETY_FRISCHE_TEXT[evaluation.freshness]}
          {evaluation.evidence.checkedAt ? ` · Stand ${evaluation.evidence.checkedAt.slice(0, 10)}` : ''}
        </p>
        {evaluation.evidence.sourceUrl ? (
          <p className="mt-1 break-all text-xs leading-5 text-ink-800">{evaluation.evidence.sourceUrl}</p>
        ) : null}
      </details>
    </article>
  )
}
