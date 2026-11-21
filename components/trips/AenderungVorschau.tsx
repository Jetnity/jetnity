'use client'

// components/trips/AenderungVorschau.tsx
//
// Vorher/Nachher, bevor etwas gespeichert wird.
//
// Die Vorschau darf nicht wie eine gebuchte Reise aussehen. Sie zeigt die
// Änderung aus dem Reisegraphen: zugeordnete Reisetage, ungeplante Punkte und
// echte Löschungen getrennt. Die Kurzfassung des Modells ersetzt diese
// Aufstellung nicht. Preise und Anbieter stehen hier nicht.

import { ArrowRight, Info } from 'lucide-react'

import type { Aenderungsvorschau } from '@/lib/reiseaenderung/erzeugen'
import { strukturVergleich } from '@/lib/reiseaenderung/diff'
import { cn } from '@/lib/utils'

function Tagliste({ tage, leer }: { tage: string[]; leer: string }) {
  if (tage.length === 0) return <p className="break-words">{leer}</p>
  return (
    <ul className="grid gap-1">
      {tage.map((tag, index) => (
        <li key={`${index}-${tag}`} className="break-words">{tag}</li>
      ))}
    </ul>
  )
}

type AenderungVorschauProps = {
  vorschau: Aenderungsvorschau
  laeuft: boolean
  onUebernehmen: () => void
  onVerwerfen: () => void
}

export default function AenderungVorschau({
  vorschau,
  laeuft,
  onUebernehmen,
  onVerwerfen,
}: AenderungVorschauProps) {
  const plan = strukturVergleich(vorschau.vorher, vorschau.nachher)
  const loescht = plan.entfernt.length > 0
  const saetze = plan.strukturell
    ? vorschau.diff.filter((eintrag) =>
      !eintrag.text.startsWith('Ungeplant, nicht gelöscht:')
      && !eintrag.text.includes(': zugeordnete Reisetage '),
    )
    : vorschau.diff
  const tageswechsel = plan.tageVorher !== plan.tageNachher || plan.etappen.some((etappe) => etappe.geaendert)

  return (
    <section
      aria-label="Änderungsvorschlag"
      className="min-w-0 rounded-3xl border border-line-200 bg-white p-[16px] sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Vorschlag
        </span>
        <span className="text-xs text-ink-700">Noch nicht gespeichert.</span>
      </div>

      <h2 className="mt-4 break-words text-lg font-semibold text-brand-900 sm:text-xl">
        {vorschau.aenderung.zusammenfassung}
      </h2>
      <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-ink-800">
        Die Kurzfassung steht oben. Was sich im Reiseplan ändert, steht in der Aufstellung.
      </p>

      {plan.strukturell && (
        <div id="aenderung-plan" className="mt-6 min-w-0">
          <h3 className="break-words text-base font-semibold text-brand-900">Reiseplan vorher und nachher</h3>
          <dl className="mt-4 grid min-w-0 gap-4">
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">Reisetage</dt>
              <dd className="mt-1 break-words text-sm leading-6 text-brand-900">
                {plan.tageVorher} → {plan.tageNachher}
              </dd>
            </div>
            {plan.etappen.map((etappe) => (
              <div key={etappe.id} className="min-w-0">
                <dt className="break-words text-sm font-semibold text-brand-900">{etappe.name}</dt>
                <dd className="mt-1 grid min-w-0 gap-2 text-sm leading-6 text-ink-800">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">Vorher</p>
                    <Tagliste tage={etappe.vorherTage} leer={etappe.vorher} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">Nachher</p>
                    <Tagliste tage={etappe.nachherTage} leer={etappe.nachher} />
                  </div>
                </dd>
              </div>
            ))}
          </dl>
          {tageswechsel && (
            <p className="mt-4 break-words text-sm leading-6 text-ink-800">
              Zugeordnete Reisetage sind keine Hotelnächte. Diese Vorschau nennt keine Nachtzahl und bucht keine Unterkunft um.
            </p>
          )}
          {plan.ungeplant.length > 0 && (
            <div role="status" className="mt-4 min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">Ungeplant, nicht gelöscht</h3>
              <ul className="mt-3 grid gap-2">
                {plan.ungeplant.map((zeile) => (
                  <li key={zeile.id} className="break-words text-sm leading-6 text-brand-900">{zeile.text}</li>
                ))}
              </ul>
            </div>
          )}
          {loescht && (
            <div role="alert" className="mt-4 min-w-0 rounded-2xl bg-amber-50 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-950">Diese Punkte würden gelöscht</h3>
              <ul className="mt-3 grid gap-2">
                {plan.entfernt.map((zeile) => (
                  <li key={zeile.id} className="break-words text-sm leading-6 text-amber-950">{zeile.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ol className="mt-6 grid min-w-0 gap-3 border-y border-line-200 py-6">
        {saetze.map((eintrag) => (
          <li key={`${eintrag.art}-${eintrag.text}`} className="flex min-w-0 items-start gap-3">
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span className="min-w-0 break-words text-sm leading-6 text-brand-900">{eintrag.text}</span>
          </li>
        ))}
      </ol>

      {vorschau.aenderung.annahmen.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line-200 bg-surface-25 px-4 py-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Annahmen
          </p>
          <ul className="mt-3 grid gap-2">
            {vorschau.aenderung.annahmen.map((annahme) => (
              <li key={annahme} className="text-sm leading-6 text-ink-800">
                {annahme}
              </li>
            ))}
          </ul>
        </div>
      )}

      {vorschau.aenderung.warnungen.length > 0 && (
        <div
          role="status"
          className="mt-4 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">Offene Punkte</p>
          <ul className="mt-3 grid gap-2">
            {vorschau.aenderung.warnungen.map((warnung) => (
              <li key={warnung}>{warnung}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 border-t border-line-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-ink-700">
          Gespeichert wird erst, wenn du die Änderung übernimmst. Bei einem Fehler bleibt dieser
          Vorschlag stehen.
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onVerwerfen}
            disabled={laeuft}
            className="inline-flex h-12 items-center justify-center rounded-full px-4 text-sm font-medium text-ink-900 underline underline-offset-4 transition hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800 disabled:pointer-events-none disabled:opacity-60"
          >
            Verwerfen
          </button>
          <button
            type="button"
            onClick={onUebernehmen}
            disabled={laeuft}
            aria-describedby={plan.strukturell ? 'aenderung-plan' : undefined}
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-full bg-brand-800 px-6 text-sm font-semibold text-white',
              'transition hover:bg-brand-900',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            {laeuft ? 'Wird übernommen …' : loescht ? 'Löschung übernehmen' : 'Änderung übernehmen'}
          </button>
        </div>
      </div>
    </section>
  )
}
