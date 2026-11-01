'use client'

import * as React from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { DISCOVERCARS_GENERISCH_HREF } from '@/lib/providers/discovercars/affiliate/ziel'
import { DISCOVERCARS_DATENSCHUTZ } from '@/lib/providers/discovercars/widget/vertrag'
import { discoverCarsWidgetLaden, type DiscoverCarsWidgetPhase } from '@/lib/providers/discovercars/widget/renderer'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'

const AKTION = 'inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal rounded-full px-4 py-2 text-center text-sm font-semibold leading-6 [overflow-wrap:anywhere] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'
const SEKUNDAER = `${AKTION} border border-line-200 bg-white text-brand-800 hover:border-line-400`

// The parent keys this component by trip and unmounts it when the rental area
// is hidden. Display intent is never persisted or transferred to another trip.
export default function DiscoverCarsSuche() {
  const [anzeigen, setAnzeigen] = React.useState(false)
  const [phase, setPhase] = React.useState<DiscoverCarsWidgetPhase>('laedt')
  const host = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    if (!anzeigen || !host.current) return
    return discoverCarsWidgetLaden(host.current, setPhase)
  }, [anzeigen])

  const fehlgeschlagen = anzeigen && (phase === 'fehler' || phase === 'datenschutz')
  return (
    <section aria-label="Mietwagensuche" data-discovercars-suche="1" data-discovercars-zustand={anzeigen ? phase : 'ruhend'} data-organisieren-flaeche="suche" className={ORGANISIEREN_FLAECHE_KLASSE}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">DiscoverCars · Affiliate-Partner</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 break-words sm:text-2xl">Mietwagen finden</h2>
      <p className="mt-3 text-sm leading-6 text-ink-800">
        Abholort, Rückgabe und Mietdaten hier festlegen. Fahrzeuge, Preise und Mietbedingungen
        vergleichst du anschließend bei DiscoverCars. Die Buchung öffnet dort in einem neuen Tab.
      </p>
      {!anzeigen ? (
        <div className="mt-4 rounded-2xl bg-surface-25 p-4 text-sm leading-6 text-ink-800">
          <p id={`${id}-hinweis`}>
            Mit „Suchformular laden“ verbindest du dich mit DiscoverCars. Dabei erhält der Anbieter
            Verbindungsdaten wie deine IP-Adresse und kann Cookies oder ähnliche Technologien nutzen.
            Deine gespeicherte Reise wird nicht übermittelt.
          </p>
          <button type="button" onClick={() => { setPhase('laedt'); setAnzeigen(true) }} aria-describedby={`${id}-hinweis`} aria-controls={`${id}-formular`} className={`${AKTION} mt-4 bg-brand-800 text-white hover:bg-brand-900`}>
            Suchformular laden
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div role="status" className="text-sm leading-6 text-ink-800">
            {phase === 'laedt' ? <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />Suchformular wird geladen …</p> : null}
            {phase === 'sichtbar' ? <p>Bitte prüfe die vorgeschlagenen Mietdaten, das Alter und den Wohnsitz des Fahrers. CHF ist die Anzeigeeinstellung dieses Formulars.</p> : null}
            {phase === 'fehler' ? <p>Das Suchformular konnte gerade nicht geladen werden. Du kannst die Suche direkt bei DiscoverCars öffnen oder es erneut versuchen.</p> : null}
            {phase === 'datenschutz' ? <p>Deine Datenschutzeinstellungen verhindern das Laden. Der direkte Link zu DiscoverCars bleibt verfügbar.</p> : null}
          </div>
          <button type="button" onClick={() => setAnzeigen(false)} className={`${SEKUNDAER} mt-3`} aria-controls={`${id}-formular`}>
            {fehlgeschlagen ? 'Zurück' : 'Suchformular ausblenden'}
          </button>
        </div>
      )}
      <div id={`${id}-formular`} ref={host} hidden={!anzeigen || fehlgeschlagen} className="mt-4 min-w-0 max-w-full" />
      <div className="mt-4 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <a href={DISCOVERCARS_GENERISCH_HREF} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" className={SEKUNDAER}>
          Direkt bei DiscoverCars suchen<ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="sr-only">, neuer Tab</span>
        </a>
        <a href={DISCOVERCARS_DATENSCHUTZ} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15">
          Datenschutz von DiscoverCars<span className="sr-only">, neuer Tab</span>
        </a>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-600">Jetnity kann für eine Buchung über diesen Partnerlink eine Provision erhalten. Ausblenden beendet die Einbindung; bereits übertragene Daten bleiben beim Anbieter.</p>
    </section>
  )
}
