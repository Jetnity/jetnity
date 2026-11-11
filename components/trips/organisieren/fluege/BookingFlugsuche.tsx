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
import { Feld, Personen } from '../Suchfelder'

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
          <select aria-label="Reiseart" value={art} onChange={(e) => setArt(e.target.value as Flugart)}>
            <option value="gabel">Gabelflug</option>
            <option value="retour">Hin- und Rückflug</option>
            <option value="einfach">Nur Hinflug</option>
          </select>
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
          <Feld label="Hinflug">
            <input required type="date" value={hin} onChange={(e) => setHin(e.target.value)} />
          </Feld>
          {art !== 'einfach' && (
            <Feld label="Rückflug">
              <input
                required
                type="date"
                min={hin}
                value={rueck}
                onChange={(e) => setRueck(e.target.value)}
              />
            </Feld>
          )}
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
          <label>
            Reiseklasse{' '}
            <select value={kabine} onChange={(e) => setKabine(e.target.value as FlugKabine)}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </label>
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
