'use client'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import FlughafenSuche from '@/components/airports/FlughafenSuche'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import OrtSuche from '@/components/places/OrtSuche'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import Reisekarte from '@/components/trips/Reisekarte'
import VorschlagVorschau from '@/components/trips/VorschlagVorschau'
import Hotelsuche from '@/components/trips/organisieren/Hotelsuche'
import Verbindungen from '@/components/trips/organisieren/Verbindungen'
import { RouteListe } from '@/components/trips/TripWorkspaceRoute'
import type { Reisevorschlag } from '@/lib/reisevorschlag/schema'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import { routeModell } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { tripAlsUebersicht } from '@/lib/trips/reise-orte'
import { vorgeschlagenerFlughafen } from '@/lib/trips/organisieren/katalog'

function reiseMitLissabon() {
  const reise = referenzReise()
  reise.title = 'Unsere Romreise'
  reise.origin = 'Vienna'
  reise.originPlaceId = null
  const erste = reise.stages[0]
  if (erste) {
    erste.name = 'Lisbon'
    erste.countryCode = 'PT'
    erste.placeId = 'geonames:2267057'
    erste.latitude = 38.72225
    erste.longitude = -9.13934
  }
  return reise
}

const VORSCHLAG = {
  titel: 'Ein Wochenende in Prague',
  abreiseort: 'Vienna',
  reisende: 2,
  waehrung: 'CHF',
  budgetziel: null,
  tempo: 'balanced',
  interessen: [],
  startdatum: null,
  annahmen: [],
  reisewunsch: null,
  fassung: 1,
  etappen: [
    { name: 'Prague', laendercode: 'CZ', vonTag: 1, bisTag: 2 },
    { name: 'Vienna', laendercode: null, vonTag: 3, bisTag: 3 },
  ],
  tage: [{
    nummer: 1,
    titel: 'Ankommen in Prague',
    punkte: [{ art: 'note', titel: 'Spaziergang in Prague', notiz: null, beginn: null }],
  }],
} as unknown as Reisevorschlag

export function DeChAnzeigeHarness() {
  const reise = useState(reiseMitLissabon)[0]
  const [ort, setOrt] = useState<OrtAuswahl | null>(null)
  const [flughafen, setFlughafen] = useState<FlughafenAuswahl | null>(() => {
    const etappe = reise.stages[0]
    return etappe ? vorgeschlagenerFlughafen(etappe.placeId, etappe.name, etappe) : null
  })
  const [iata, setIata] = useState(flughafen?.iata ?? '')
  const modell = routeModell(reise)
  const thema = typeof document === 'undefined' ? 'light' : (document.body.dataset.theme === 'dark' ? 'dark' : 'light')
  const tagId = reise.days[0]?.id ?? ''

  return (
    <div className="workspace-shell workspace-content" data-workspace-theme={thema} data-de-ch-harness>
      <section data-flaeche="ortssuche">
        <OrtSuche
          rolle="ziel"
          variante="field"
          value={ort}
          onChange={(wert) => setOrt(wert)}
          inputId="de-ch-ort"
          placeholder="Reiseziel"
        />
        <p data-kanonisch>{ort?.name ?? ''}</p>
        <p data-anzeige>{ort?.anzeige ?? ''}</p>
      </section>
      <section data-flaeche="reisen">
        <Reisekarte reise={tripAlsUebersicht(reise)} href="/reisen/gast" quelle="guest" />
      </section>
      <section data-flaeche="etappen">
        <RouteListe
          zeilen={modell.zeilen}
          ausgewaehlterTagId={tagId}
          aufloesung={{ art: 'keine' }}
          onLauf={() => {}}
          onKante={() => {}}
        />
      </section>
      <section data-flaeche="unterkunft">
        <Hotelsuche reise={reise} auswahlVersion={0} etappen={null} start={reise.stages[0]} />
      </section>
      <section data-flaeche="verbindungen">
        <Verbindungen reise={reise} etappen={null} abschnittFehlt />
      </section>
      <section data-flaeche="flug">
        <FlughafenSuche
          value={flughafen}
          onChange={(wert) => {
            setFlughafen(wert)
            setIata(wert?.iata ?? '')
          }}
          inputId="de-ch-flug"
          placeholder="Stadt, Land oder Flughafen"
        />
        <p data-iata>{iata}</p>
      </section>
      <section data-flaeche="vorschau">
        <VorschlagVorschau
          vorschlag={VORSCHLAG}
          laeuft={false}
          angemeldet={false}
          onUebernehmen={() => {}}
          onAendern={() => {}}
          onVerwerfen={() => {}}
        />
      </section>
    </div>
  )
}

if (typeof document !== 'undefined') {
  const wurzel = document.getElementById('root')
  if (wurzel) createRoot(wurzel).render(<DeChAnzeigeHarness />)
}
