'use client'

import { useId, useState } from 'react'
import { tripAuditV1, type AuditDomain, type AuditFinding, type TripAuditReport } from '@/lib/trips/trip-audit-v1/audit'
import type { Trip, TripItem } from '@/types/trips'

const DOMAIN: Record<AuditDomain, string> = { lodging: 'Unterkunftsnächte', time: 'Gespeicherte Zeiten', flights: 'Flugplanung', mobility: 'Verbindungsplanung' }
const COVERAGE = { complete: 'Auswertung vollständig', partial: 'Teilweise bewertbar', unavailable: 'Nicht bewertbar', error: 'Auswertung fehlgeschlagen', not_run: 'Nicht ausgewertet' }
const STATE = { known_gap: 'Planungslücke', proven_conflict: 'Belegter Konflikt', possible_conflict: 'Möglicher Konflikt', not_evaluable: 'Nicht bewertbar', unknown: 'Unbekannt' }
const BUTTON = 'min-h-11 rounded-full border border-brand-800 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-surface-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-800'
const PAGE_SIZE = 6

export function TripAuditFinding({ finding }: { finding: AuditFinding }) {
  const pair = 'comparisonBasis' in finding.evidence ? finding.evidence : null
  return (
    <li className="min-w-0 rounded-xl border border-line-200 p-3">
      <p className="text-xs font-semibold text-ink-700">{STATE[finding.state]}</p>
      <h5 className="mt-1 text-sm font-semibold text-brand-800">{finding.title}</h5>
      <p className="mt-1 text-sm leading-6 text-ink-800">{finding.detail}</p>
      {finding.items?.length ? (
        <div className="mt-2 text-xs leading-5 text-ink-700">
          <p className="font-semibold">Gespeicherte Planpunkte:</p>
          <ul className="mt-1 space-y-2">
            {finding.items.map((item, index) => (
              <li key={index}>
                <p className="font-semibold">{item.title ?? 'Bezeichnung unbekannt'}</p>
                <p>Beginn: {item.startsOn ?? 'Datum unbekannt'} · {item.startsAt ?? 'Uhrzeit unbekannt'}</p>
                <p>Ende: {item.endsOn ?? 'Datum unbekannt'} · {item.endsAt ?? 'Uhrzeit unbekannt'}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {pair ? (
        <p className="mt-2 text-xs leading-5 text-ink-700">
          Vergleichsgrundlage: {{ instant: 'Zeitpunkte', civil_only: 'Ortszeiten ohne bestätigte Zeitzone', estimate: 'Schätzung', none: 'nicht ausreichend' }[pair.comparisonBasis]}.
        </p>
      ) : null}
    </li>
  )
}

function Results({ report }: { report: TripAuditReport }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = report.findings.slice(0, visible)
  return (
    <div className="mt-4 grid min-w-0 gap-4">
      <p role="status" className="text-sm leading-6 text-ink-800">
        {report.evaluation === 'incomplete' ? 'Auswertung unvollständig: Eine Grenze oder ein Fehler verhindert den vollständigen Bericht.'
          : report.evaluation === 'partial' ? 'Dein gespeicherter Plan ist nur teilweise bewertbar.'
            : 'Die gespeicherten Angaben wurden ausgewertet. Das ist keine Bestätigung, dass die Reise problemlos durchführbar ist.'}
        {' '}Der geöffnete Bericht wird bei Änderungen am Reiseplan neu berechnet.
      </p>
      {report.limitReasons.length ? (
        <p className="rounded-xl border border-line-200 bg-surface-50 p-3 text-sm leading-6 text-ink-800">
          Begrenzte Auswertung. {report.omittedFindings > 0 ? `${report.omittedFindings} weitere Befunde sind wegen der Berichtsgrenze nicht enthalten. ` : ''}
          Nicht ausgewertete Angaben bleiben unbekannt. Höchstens {report.limits.findings} Befunde werden angezeigt.
        </p>
      ) : null}
      {report.sections.map(section => (
        <section key={section.domain} aria-label={DOMAIN[section.domain]} className="min-w-0">
          <h4 className="font-semibold text-brand-800">{DOMAIN[section.domain]}</h4>
          <p className="mt-1 text-xs font-semibold text-ink-700">{COVERAGE[section.coverage]}</p>
          <p className="mt-1 text-sm leading-6 text-ink-800">{section.detail}</p>
          {shown.some(finding => finding.domain === section.domain) ? (
            <ul className="mt-3 grid min-w-0 gap-2">
              {shown.filter(finding => finding.domain === section.domain).map(finding => <TripAuditFinding key={finding.id} finding={finding} />)}
            </ul>
          ) : null}
        </section>
      ))}
      <div className="min-w-0">
        <p aria-live="polite" className="text-sm leading-6 text-ink-700">
          {shown.length} von {report.findingCount} ermittelten Befunden angezeigt.
          {report.findingCount === 0 ? ' Keine Einzelbefunde ausgegeben; beachte die Auswertbarkeit der Bereiche.' : ''}
        </p>
        {shown.length < report.findings.length ? (
          <button type="button" className={`${BUTTON} mt-2`} onClick={() => setVisible(count => count + PAGE_SIZE)}>
            Weitere anzeigen
          </button>
        ) : null}
      </div>
      <section aria-label="Nicht geprüft" className="min-w-0 rounded-xl bg-surface-50 p-3">
        <h4 className="font-semibold text-brand-800">Nicht geprüft</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-800">
          {report.notChecked.map(scope => <li key={scope}>{scope}</li>)}
        </ul>
      </section>
    </div>
  )
}

function CurrentResults({ reise, ungeplantePunkte }: { reise: Trip; ungeplantePunkte?: readonly TripItem[] }) {
  // Intentionally no memo/effect/cache: same-revision and in-place content changes
  // must be reflected on every parent render. This component mounts only on click.
  return <Results report={tripAuditV1(reise, ungeplantePunkte)} />
}

export default function TripAuditV1Panel({ reise, ungeplantePunkte, integriert = false }: { reise: Trip; ungeplantePunkte?: readonly TripItem[]; integriert?: boolean }) {
  const [open, setOpen] = useState(false)
  const controls = useId()
  return (
    <section aria-label="Reise prüfen" data-workspace-audit={integriert ? 'integrated' : undefined} className="min-w-0 max-w-full break-words rounded-2xl border border-line-200 bg-white p-4 [overflow-wrap:anywhere]">
      <div className={integriert ? 'workspace-audit-intro' : undefined}>
      <div>
      <h3 className="font-semibold text-brand-800">Gespeicherten Reiseplan prüfen</h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">
        Unterkunftsnächte, Zeiten und Verbindungen gemeinsam ansehen. Die Prüfung liest deinen Plan und ändert nichts.
        Ausgewählt bedeutet nicht gebucht; auch deine Buchungsmarkierungen sind keine Bestätigung durch einen Anbieter.
      </p>
      </div>
      <button type="button" aria-expanded={open} aria-controls={controls} onClick={() => setOpen(value => !value)} className={`${BUTTON} mt-3`}>
        {open ? 'Prüfung schliessen' : 'Reise prüfen'}
      </button>
      </div>
      <div id={controls} hidden={!open}>
        {open ? <CurrentResults reise={reise} ungeplantePunkte={ungeplantePunkte} /> : null}
      </div>
    </section>
  )
}
