'use client'

import { useId, useState, type ReactNode } from 'react'
import FlughafenSuche from '@/components/airports/FlughafenSuche'
import { ArrowUpRight } from 'lucide-react'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import type { FlugKabine } from '@/lib/flights/domain'
import {
  bookingFlugSuche,
  BOOKING_FLUG_PARTNERLINK,
  type Flugart,
} from '@/lib/trips/organisieren/booking-flug'
import { vorgeschlagenerFlughafen } from '@/lib/trips/organisieren/katalog'
import type { Trip } from '@/types/trips'
import { Personen } from '../Suchfelder'
import Suchkalender from '../auswahl/Suchkalender'
import Suchauswahl from '../auswahl/Suchauswahl'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { datumVerschieben } from '@/lib/trips/suchkalender'

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

export default function BookingFlugsuche({ reise, etappen }: { reise: Trip; etappen: ReactNode }) {
  const erste = reise.stages[0],
    letzte = reise.stages.at(-1)
  const [von, setVon] = useState(() => vorgeschlagenerFlughafen(reise.originPlaceId, reise.origin))
  const [nach, setNach] = useState(() =>
    vorgeschlagenerFlughafen(erste?.placeId ?? null, erste?.name ?? null, erste),
  )
  const [zurueck, setZurueck] = useState(() =>
    vorgeschlagenerFlughafen(letzte?.placeId ?? null, letzte?.name ?? null, letzte),
  )
  const [art, setArt] = useState<Flugart>(
    !reise.endDate
      ? 'einfach'
      : erste && letzte && (erste.placeId ?? erste.name) !== (letzte.placeId ?? letzte.name)
        ? 'gabel'
        : 'retour',
  )
  const [hin, setHin] = useState(reise.startDate ?? ''),
    [rueck, setRueck] = useState(reise.endDate ?? '')
  const [gaeste, setGaeste] = useState(Math.max(1, Math.min(9, reise.travellers)))
  const [kabine, setKabine] = useState<FlugKabine>('economy'),
    [direkt, setDirekt] = useState(false)
  const [fehler, setFehler] = useState('')
  const suche = bookingFlugSuche({
    art,
    von: von?.iata,
    nach: nach?.iata,
    rueckflugAb: zurueck?.iata,
    hin,
    rueck,
    gaeste,
    kabine,
    direkt,
    waehrung: reise.currency,
  })

  return (
    <>
      <form
        className="org-form"
        action={BOOKING_FLUG_PARTNERLINK}
        method="get"
        target="_blank"
        rel="sponsored noopener noreferrer"
        onChange={() => setFehler('')}
        onSubmit={(event) => {
          if ('fehler' in suche) {
            event.preventDefault()
            setFehler(suche.fehler)
          }
        }}
      >
        <input type="hidden" name="sid" value="jetnity-flug" />
        {'ziel' in suche && <input type="hidden" name="url" value={suche.ziel} />}
        <div className="org-formtop">
          <h2>Flug suchen</h2>
          <Suchauswahl label="Reiseart" wert={art} setzen={v => { setArt(v); setFehler('') }} optionen={[
            { wert: 'gabel', text: 'Gabelflug' }, { wert: 'retour', text: 'Hin- und Rückflug' }, { wert: 'einfach', text: 'Nur Hinflug' },
          ]} />
        </div>
        <div className={'org-fields ' + (art === 'einfach' ? 'org-four' : '')}>
          <FlughafenFeld
            label="Von"
            wert={von}
            setzen={(v) => {
              setFehler('')
              setVon(v)
            }}
          />
          <FlughafenFeld
            label="Nach"
            wert={nach}
            setzen={(v) => {
              setFehler('')
              setNach(v)
            }}
          />
          <Suchkalender start={hin} ende={rueck} startLabel="Hinflug" endeLabel="Rückflug"
            min={heutigesDatum()} max={datumVerschieben(heutigesDatum(), 330)} minTage={0} einzeln={art === 'einfach'}
            setzen={(start, ende) => { setHin(start); setRueck(ende); setFehler('') }} />
          <Personen wert={gaeste} setzen={setGaeste} />
          <button className="org-go" type="submit">
            Auf Booking.com suchen <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
        <div className="org-sub">
          {art === 'gabel' && (
            <FlughafenFeld
              label="Rückflug ab"
              wert={zurueck}
              setzen={(v) => {
                setFehler('')
                setZurueck(v)
              }}
            />
          )}
          <Suchauswahl label="Reiseklasse" wert={kabine} setzen={v => { setKabine(v); setFehler('') }} optionen={[
            { wert: 'economy', text: 'Economy' }, { wert: 'premium_economy', text: 'Premium Economy' },
            { wert: 'business', text: 'Business' }, { wert: 'first', text: 'First Class' },
          ]} />
          <label>
            <input type="checkbox" checked={direkt} onChange={(e) => setDirekt(e.target.checked)} /> Nur
            Direktflüge
          </label>
        </div>
        <p className="org-note mt-3">
          Flüge und Preise öffnen sich bei Booking.com in einem neuen Tab. Bei einer Buchung kann Jetnity eine
          Provision erhalten.
        </p>
        {fehler && <p role="alert">{fehler}</p>}
      </form>
      {etappen}
    </>
  )
}
