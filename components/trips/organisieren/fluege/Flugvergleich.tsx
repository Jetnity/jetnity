'use client'

import { useId, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Plane,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import FlughafenSuche from '@/components/airports/FlughafenSuche'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageUtc } from '@/lib/activities/zeit'
import { vorgeschlagenerFlughafen } from '@/lib/trips/organisieren/katalog'
import {
  flugVergleichUrl,
  type FlugVergleichEingabe,
} from '@/lib/providers/travelpayouts/suche'
import type { Trip } from '@/types/trips'
import Suchkalender from '../auswahl/Suchkalender'
import Suchauswahl from '../auswahl/Suchauswahl'
import Fluggaeste, { type FluggaesteWert } from './Fluggaeste'
import Flugergebnisse, { type FlugSuchauftrag } from './Flugergebnisse'

function FlughafenFeld({
  label,
  wert,
  setzen,
}: {
  label: string
  wert: FlughafenAuswahl | null
  setzen: (v: FlughafenAuswahl | null) => void
}) {
  const id = useId()
  return (
    <div className="org-field">
      <label htmlFor={id}>{label}</label>
      <FlughafenSuche
        inputId={id}
        value={wert}
        onChange={setzen}
        placeholder="Stadt oder Flughafen"
        inputClassName="org-air-input"
      />
    </div>
  )
}
const datumText = (d: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(d + 'T12:00:00Z'))

export default function Flugvergleich({
  reise,
  origin,
}: {
  reise: Trip
  origin: string
}) {
  const erste = reise.stages[0],
    letzte = reise.stages.at(-1)
  const [von, setVon] = useState(() =>
    vorgeschlagenerFlughafen(reise.originPlaceId, reise.origin),
  )
  const [nach, setNach] = useState(() =>
    vorgeschlagenerFlughafen(
      erste?.placeId ?? null,
      erste?.name ?? null,
      erste,
    ),
  )
  const [zurueck, setZurueck] = useState(() =>
    vorgeschlagenerFlughafen(
      letzte?.placeId ?? null,
      letzte?.name ?? null,
      letzte,
    ),
  )
  const [art, setArt] = useState<FlugVergleichEingabe['art']>(
    !reise.endDate
      ? 'einfach'
      : erste &&
          letzte &&
          (erste.placeId ?? erste.name) !== (letzte.placeId ?? letzte.name)
        ? 'gabel'
        : 'retour',
  )
  const [hin, setHin] = useState(reise.startDate ?? '')
  const [rueck, setRueck] = useState(reise.endDate ?? '')
  const [gaeste, setGaeste] = useState<FluggaesteWert>({
    erwachsene: Math.max(1, reise.travellers),
    kinder: 0,
    babys: 0,
  })
  const [kabine, setKabine] =
    useState<FlugVergleichEingabe['kabine']>('economy')
  const [fehler, setFehler] = useState('')
  const [suche, setSuche] = useState<FlugSuchauftrag | null>(null)
  const [suchlauf, setSuchlauf] = useState(0)
  const ergebnis = useRef<HTMLDivElement>(null)
  const heute = heutigesDatum()
  const heuteUtc = tageUtc(heute)
  const max = heuteUtc === null
    ? undefined
    : new Date(heuteUtc + 330 * 86400000).toISOString().slice(0, 10)
  const summe = gaeste.erwachsene + gaeste.kinder + gaeste.babys
  const aktuell = flugVergleichUrl(
    {
      art,
      von: von?.iata,
      nach: nach?.iata,
      rueckflugAb: zurueck?.iata,
      hin,
      rueck,
      ...gaeste,
      kabine,
    },
    origin,
    heute,
  )
  const geaendert = suche && ('fehler' in aktuell || aktuell.url !== suche.url)
  return (
    <div className="flug-workspace">
      <form
        className="org-form flug-search"
        onChange={() => setFehler('')}
        onSubmit={(event) => {
          event.preventDefault()
          if ('fehler' in aktuell) {
            setFehler(aktuell.fehler)
            return
          }
          setFehler('')
          setSuchlauf((lauf) => lauf + 1)
          setSuche({
            url: aktuell.url,
            hin: `${von?.iata} → ${nach?.iata}`,
            rueck:
              art === 'einfach'
                ? null
                : `${art === 'gabel' ? zurueck?.iata : nach?.iata} → ${von?.iata}`,
            zeitraum:
              datumText(hin) +
              (art === 'einfach' ? '' : ' – ' + datumText(rueck)),
            gaeste: `${summe} ${summe === 1 ? 'Person' : 'Personen'}`,
            kabine: kabine === 'business' ? 'Business' : 'Economy',
          })
          requestAnimationFrame(() => {
            ergebnis.current?.scrollIntoView({
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
              block: 'start',
            })
            ergebnis.current?.focus({ preventScroll: true })
          })
        }}
      >
        <div className="org-formtop">
          <div>
            <h2>Flüge vergleichen</h2>
            <p className="flug-intro">Deine Route. Dein Flug. Deine Auswahl.</p>
          </div>
          <div className="flug-trip-hint">
            <CalendarDays size={16} aria-hidden="true" /> Reisedaten
            vorausgefüllt
          </div>
        </div>
        <div className="flug-options">
          <Suchauswahl label="Reiseart" wert={art} setzen={v => { setArt(v); setFehler('') }} optionen={[
            { wert: 'retour', text: 'Hin- und Rückflug' },
            { wert: 'einfach', text: 'Nur Hinflug' },
            { wert: 'gabel', text: 'Gabelflug' },
          ]} />
          <Suchauswahl label="Reiseklasse" wert={kabine} setzen={v => { setKabine(v); setFehler('') }} optionen={[
            { wert: 'economy', text: 'Economy' }, { wert: 'business', text: 'Business' },
          ]} />
        </div>
        <div
          className={'flug-fields' + (art === 'einfach' ? ' flug-oneway' : '')}
        >
          <div className="flug-airports">
            <FlughafenFeld label="Von" wert={von} setzen={setVon} />
            <button
              type="button"
              className="flug-swap"
              aria-label="Abflug und Ziel tauschen"
              title="Abflug und Ziel tauschen"
              onClick={() => {
                setVon(nach)
                setNach(von)
              }}
            >
              <ArrowLeftRight size={17} />
            </button>
            <FlughafenFeld label="Nach" wert={nach} setzen={setNach} />
          </div>
          <Suchkalender start={hin} ende={rueck} startLabel="Hinflug" endeLabel="Rückflug"
            min={heute} max={max ?? heute} minTage={0} einzeln={art === 'einfach'}
            setzen={(start, ende) => { setHin(start); setRueck(ende); setFehler('') }} />
          <Fluggaeste wert={gaeste} setzen={setGaeste} />
          <button className="org-go" type="submit">
            <Search size={20} aria-hidden="true" /> Flüge suchen
          </button>
        </div>
        {art === 'gabel' && (
          <div className="flug-openjaw">
            <FlughafenFeld
              label="Rückflug ab"
              wert={zurueck}
              setzen={setZurueck}
            />
            <p>
              <Plane size={17} aria-hidden="true" /> Zurück nach{' '}
              {von?.name || 'deinem Abflughafen'} – passend zum letzten
              Reiseziel.
            </p>
          </div>
        )}
        <div className="flug-form-foot">
          <span>
            <Check size={15} aria-hidden="true" /> Ergebnisse direkt hier
            vergleichen
          </span>
        </div>
        {fehler && (
          <p className="flug-error" role="alert">
            {fehler}
          </p>
        )}
      </form>
      <div ref={ergebnis} className="flug-result-anchor" tabIndex={-1}>
        {geaendert && (
          <div className="flug-changed" role="status">
            Deine Suchdaten wurden geändert. Starte „Flüge suchen“, um die
            Angebote zu aktualisieren.
          </div>
        )}
        {suche ? (
          <Flugergebnisse key={`${suche.url}:${suchlauf}`} suche={suche} />
        ) : (
          <div className="flug-start">
            <div className="flug-start-icon">
              <Plane size={28} aria-hidden="true" />
            </div>
            <h3>Finde den Flug, der zu deiner Reise passt.</h3>
            <p>
              Vergleiche verfügbare Flüge und Preise. Buche dein gewähltes
              Angebot anschliessend beim Anbieter.
            </p>
            <div className="flug-benefits">
              <span>
                <SlidersHorizontal size={17} /> Gepäck & Zwischenstopps
              </span>
              <span>
                <ArrowLeftRight size={17} /> Airlines & Flugzeiten
              </span>
              <span>
                <Check size={17} /> Preise in CHF
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
