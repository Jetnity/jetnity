'use client'

// components/trips/AenderungVorschau.tsx
//
// Vorher/Nachher, bevor etwas gespeichert wird.
//
// Die Vorschau darf nicht wie eine gebuchte Reise aussehen. Sie zeigt die
// Änderung aus dem Reisegraphen: zugeordnete Reisetage, ungeplante Punkte und
// echte Löschungen getrennt. Die Kurzfassung des Modells ersetzt diese
// Aufstellung nicht. Preise und Anbieter stehen hier nicht.

import { ArrowRight } from 'lucide-react'

import { Hinweis } from '@/components/ui/hinweis'
import type { Aenderungsvorschau } from '@/lib/reiseaenderung/erzeugen'
import { gespeicherteEtappeAnzeigen } from '@/lib/places/titel-name'
import { strukturVergleich } from '@/lib/reiseaenderung/diff'
import { aenderungstextLesbar } from '@/lib/trips/datum-anzeige'
import { cn } from '@/lib/utils'

function Tagliste({ tage, leer }: { tage: string[]; leer: string }) {
  if (tage.length === 0) return <p className="break-words text-body">{aenderungstextLesbar(leer)}</p>
  return (
    <ul className="grid gap-1">
      {tage.map((tag, index) => (
        <li key={`${index}-${tag}`} className="break-words text-body">{aenderungstextLesbar(tag)}</li>
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

const nebenaktion = 'inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-body font-medium text-foreground underline underline-offset-4 motion-safe:active:translate-y-px hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 sm:w-auto'
const hauptaktion = 'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-center text-body font-semibold text-primary-foreground motion-safe:active:translate-y-px hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 sm:w-auto'

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
      className="min-w-0 max-w-full rounded-3xl border border-line-200 bg-white p-[16px] sm:p-5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="inline-flex max-w-full items-center break-words rounded-full bg-muted px-3 py-1 text-kicker text-foreground">
          Vorschlag
        </span>
        <span className="text-meta text-muted-foreground">Noch nicht gespeichert.</span>
      </div>

      <h2 className="mt-4 break-words text-title text-foreground">
        {aenderungstextLesbar(vorschau.aenderung.zusammenfassung)}
      </h2>
      <p className="mt-3 max-w-prose break-words text-body text-muted-foreground">
        Oben steht die kurze Zusammenfassung. Darunter siehst du, was sich im Reiseplan ändert.
      </p>

      {plan.strukturell && (
        <div id="aenderung-plan" className="mt-6 min-w-0">
          <h3 className="break-words text-subtitle text-foreground">Reiseplan vorher und nachher</h3>
          <dl className="mt-4 grid min-w-0 gap-4">
            <div className="min-w-0 rounded-control bg-muted p-3">
              <dt className="text-meta font-semibold text-foreground">Reisetage</dt>
              <dd className="mt-2 grid min-w-0 gap-2 text-body text-foreground sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-3">
                <span className="break-words"><span className="font-semibold">Vorher </span>{plan.tageVorher}</span>
                <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">→</span>
                <span className="break-words"><span className="font-semibold">Nachher </span>{plan.tageNachher}</span>
              </dd>
            </div>
            {plan.etappen.map((etappe) => (
              <div key={etappe.id} className="min-w-0 rounded-control border border-border p-3">
                <dt className="break-words text-subtitle text-foreground">{gespeicherteEtappeAnzeigen(etappe)}</dt>
                <dd className="mt-3 grid min-w-0 gap-3 text-muted-foreground sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-meta font-semibold text-foreground">Vorher</p>
                    <Tagliste tage={etappe.vorherTage} leer={etappe.vorher} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-meta font-semibold text-foreground">Nachher</p>
                    <Tagliste tage={etappe.nachherTage} leer={etappe.nachher} />
                  </div>
                </dd>
              </div>
            ))}
          </dl>
          {tageswechsel && (
            <p className="mt-4 max-w-prose break-words text-body text-muted-foreground">
              Zugeordnete Reisetage sind keine Hotelnächte. Diese Vorschau nennt keine Nachtzahl und bucht keine Unterkunft um.
            </p>
          )}
          {plan.ungeplant.length > 0 && (
            <Hinweis ton="info" role="status" titel="Ungeplant, nicht gelöscht" className="mt-4">
              <ul className="grid gap-2">
                {plan.ungeplant.map((zeile) => (
                  <li key={zeile.id} className="break-words">{aenderungstextLesbar(zeile.text)}</li>
                ))}
              </ul>
            </Hinweis>
          )}
          {loescht && (
            <Hinweis ton="aufgabe" role="alert" titel="Diese Punkte würden gelöscht" className="mt-4 border-status-achtung-line bg-status-achtung-soft">
              <ul className="grid gap-2">
                {plan.entfernt.map((zeile) => (
                  <li key={zeile.id} className="break-words [overflow-wrap:anywhere]">{aenderungstextLesbar(zeile.text)}</li>
                ))}
              </ul>
            </Hinweis>
          )}
        </div>
      )}

      <ol className="mt-6 grid min-w-0 gap-3 border-y border-border py-6">
        {saetze.map((eintrag) => (
          <li key={`${eintrag.art}-${eintrag.text}`} className="flex min-w-0 items-start gap-3">
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 break-words text-body text-foreground [overflow-wrap:anywhere]">{aenderungstextLesbar(eintrag.text)}</span>
          </li>
        ))}
      </ol>

      {vorschau.aenderung.annahmen.length > 0 && (
        <Hinweis ton="info" titel="Annahmen" className="mt-6">
          <ul className="grid min-w-0 gap-2">
            {vorschau.aenderung.annahmen.map((annahme) => (
              <li key={annahme} className="break-words [overflow-wrap:anywhere]">{aenderungstextLesbar(annahme)}</li>
            ))}
          </ul>
        </Hinweis>
      )}

      {vorschau.aenderung.warnungen.length > 0 && (
        <Hinweis ton="aufgabe" role="status" titel="Offene Punkte" className="mt-4">
          <ul className="grid min-w-0 gap-2">
            {vorschau.aenderung.warnungen.map((warnung) => (
              <li key={warnung} className="break-words [overflow-wrap:anywhere]">{aenderungstextLesbar(warnung)}</li>
            ))}
          </ul>
        </Hinweis>
      )}

      <div className="mt-7 flex min-w-0 flex-col gap-4 border-t border-border pt-6">
        <p className="max-w-prose break-words text-meta text-muted-foreground">
          Es wird erst gespeichert, wenn du die Änderung übernimmst. Gelingt das nicht, bleibt dieser Vorschlag stehen.
        </p>
        <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onVerwerfen} disabled={laeuft} className={nebenaktion}>
            Verwerfen
          </button>
          <button
            type="button"
            onClick={onUebernehmen}
            disabled={laeuft}
            aria-describedby={plan.strukturell ? 'aenderung-plan' : undefined}
            className={cn(hauptaktion)}
          >
            {laeuft ? 'Wird übernommen …' : loescht ? 'Löschung übernehmen' : 'Änderung übernehmen'}
          </button>
        </div>
      </div>
    </section>
  )
}
