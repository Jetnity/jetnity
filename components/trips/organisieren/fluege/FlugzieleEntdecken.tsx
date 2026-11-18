'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import { flugRahmen, type FlugRahmenPhase } from '@/lib/providers/travelpayouts/rahmen'
import { flugWidgetOrigin } from '@/lib/providers/travelpayouts/suche'

const ZIELE = [
  { iata: 'VIE', name: 'Wien (VIE)' },
  { iata: 'BCN', name: 'Barcelona (BCN)' },
  { iata: 'LIS', name: 'Lissabon (LIS)' },
]

function Zielkarte({ ziel, origin, onWaehlen }: {
  ziel: FlughafenAuswahl
  origin: string
  onWaehlen: (ziel: FlughafenAuswahl) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<FlugRahmenPhase>('laedt')
  const [versuch, setVersuch] = useState(0)
  useEffect(() => {
    if (host.current) return flugRahmen(host.current, `${origin}/entdecken.html?ziel=${ziel.iata}`, setPhase)
  }, [origin, ziel.iata, versuch])
  return (
    <article className="flug-discovery-card">
      <h3>{ziel.name}</h3>
      {phase !== 'bereit' && <div className="flug-discovery-status" role="status">
        {phase === 'laedt' ? 'Flugpreise werden geladen …' : phase === 'datenschutz'
          ? 'Flugpreise sind durch deine Datenschutzeinstellungen deaktiviert.'
          : 'Flugpreise sind gerade nicht verfügbar.'}
        {phase !== 'laedt' && <button type="button" onClick={() => setVersuch(v => v + 1)}><RotateCcw size={15} /> Erneut laden</button>}
      </div>}
      <div ref={host} className="flug-discovery-frame" />
      <button type="button" className="flug-discovery-select" onClick={() => onWaehlen(ziel)}>
        {ziel.name.split(' (')[0]} als Ziel wählen <ArrowUpRight size={17} aria-hidden="true" />
      </button>
    </article>
  )
}

export default function FlugzieleEntdecken({ origin, onWaehlen }: {
  origin: string
  onWaehlen: (ziel: FlughafenAuswahl) => void
}) {
  const [auswahl, setAuswahl] = useState('')
  if (!flugWidgetOrigin(origin)) return null
  return (
    <section className="flug-discovery" aria-label="Flugziele entdecken">
      <h2>Flugziele entdecken</h2>
      <p>Inspiration für deine nächste Reise. Die Karten zeigen Orientierungspreise ab verschiedenen Abflugorten. Datum und Verfügbarkeit können von deiner Reise abweichen.</p>
      <div className="flug-discovery-grid">
        {ZIELE.map(ziel => <Zielkarte key={ziel.iata} ziel={ziel} origin={origin} onWaehlen={wert => {
          onWaehlen(wert)
          setAuswahl(`${wert.name} ist oben ausgewählt. Deine Reisedaten und Reisenden bleiben erhalten. Starte jetzt „Flüge suchen“.`)
        }} />)}
      </div>
      <p className="flug-discovery-note">„Als Ziel wählen“ übernimmt den Flughafen in deine Suche. Preislinks öffnen das jeweilige Angebot beim Anbieter.</p>
      <p role="status" aria-live="polite">{auswahl}</p>
    </section>
  )
}
