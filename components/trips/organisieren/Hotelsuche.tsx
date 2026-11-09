'use client'

import { useState, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { BOOKING_HOTEL_PARTNERLINK, bookingHotelSuche, hotelDaten } from '@/lib/trips/organisieren/katalog'
import type { Trip, TripStage } from '@/types/trips'
import { Feld, Personen } from './Suchfelder'

export default function Hotelsuche({
  reise,
  start,
  etappen,
}: {
  reise: Trip
  start?: TripStage
  etappen: ReactNode
}) {
  const [stageId, setStageId] = useState(start?.id ?? '')
  const stage = reise.stages.find((s) => s.id === stageId)
  const [termine, setTermine] = useState(() => hotelDaten(reise, start))
  const [gaeste, setGaeste] = useState(Math.min(9, Math.max(1, reise.travellers)))
  const [zimmer, setZimmer] = useState(1)
  const [fehler, setFehler] = useState('')
  const suche = bookingHotelSuche(stage, { ...termine, gaeste, zimmer, waehrung: reise.currency })
  return (
    <>
      <form
        className="org-form"
        action={BOOKING_HOTEL_PARTNERLINK}
        method="get"
        target="_blank"
        rel="sponsored noopener noreferrer"
        onChange={() => setFehler('')}
        onSubmit={(e) => {
          if ('fehler' in suche) {
            e.preventDefault()
            setFehler(suche.fehler)
          }
        }}
      >
        {'ziel' in suche && <input type="hidden" name="url" value={suche.ziel} />}
        <input type="hidden" name="sid" value="jetnity-hotel" />
        <div className="org-formtop">
          <h2>Unterkunft suchen</h2>
        </div>
        <div className="org-fields">
          <Feld label="Reiseetappe">
            <select
              value={stageId}
              required
              onChange={(e) => {
                setStageId(e.target.value)
                setTermine(
                  hotelDaten(
                    reise,
                    reise.stages.find((s) => s.id === e.target.value),
                  ),
                )
              }}
            >
              {!reise.stages.length && <option value="">Etappe offen</option>}
              {reise.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Feld>
          <Feld label="Anreise">
            <input
              type="date"
              value={termine.anreise}
              onChange={(e) => setTermine({ ...termine, anreise: e.target.value })}
            />
          </Feld>
          <Feld label="Abreise">
            <input
              type="date"
              value={termine.abreise}
              min={termine.anreise}
              onChange={(e) => setTermine({ ...termine, abreise: e.target.value })}
            />
          </Feld>
          <Personen
            wert={gaeste}
            setzen={(n) => {
              setGaeste(n)
              setZimmer(Math.min(n, zimmer))
            }}
          />
          <Feld label="Zimmer">
            <select value={zimmer} onChange={(e) => setZimmer(Number(e.target.value))}>
              {Array.from({ length: Math.min(gaeste, 8) }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} Zimmer
                </option>
              ))}
            </select>
          </Feld>
          <button type="submit" className="org-go" disabled={!stage}>
            Auf Booking.com suchen <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
        <p className="org-note mt-3">
          Hotels, Fotos und Preise öffnen sich bei Booking.com in einem neuen Tab. Bei einer Buchung kann Jetnity
          eine Provision erhalten.
        </p>
        {fehler && <p role="alert">{fehler}</p>}
      </form>
      {etappen}
    </>
  )
}
