'use client'

import { useState, type ReactNode } from 'react'
import { mobilitySucheVomClient } from '@/lib/mobility/client-anfrage'
import type { MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import { timetableAnfrageSchema } from '@/lib/providers/twelve-go/timetable/schema'
import { TimetableDetails } from '@/components/trips/TwelveGoTimetable'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import type { Trip } from '@/types/trips'
import { Feld, Personen, SucheKnopf, useSuchanfrage } from './Suchfelder'

export default function Verbindungen({ reise, etappen }: { reise: Trip; etappen: ReactNode }) {
  const stationen = [
    ...(reise.origin
      ? [
          {
            id: 'origin',
            name: reise.origin,
            placeId: reise.originPlaceId,
            countryCode: null,
            datum: reise.startDate,
          },
        ]
      : []),
    ...reise.stages.map((s) => ({
      id: 'stage:' + s.id,
      name: s.name,
      placeId: s.placeId,
      countryCode: s.countryCode,
      datum: s.arrivalDate,
    })),
  ]
  const erster = reise.stages.length > 1 ? 'stage:' + reise.stages[0]!.id : (stationen[0]?.id ?? '')
  const zweiter = stationen[stationen.findIndex((s) => s.id === erster) + 1]
  const [vonId, setVon] = useState(erster),
    [nachId, setNach] = useState(zweiter?.id ?? '')
  const [datum, setDatum] = useState(zweiter?.datum ?? ''),
    [gaeste, setGaeste] = useState(Math.min(9, Math.max(1, reise.travellers)))
  const von = stationen.find((s) => s.id === vonId),
    nach = stationen.find((s) => s.id === nachId)
  const suche = useSuchanfrage<MobilitySucheAntwort>()
  const [gesucht, setGesucht] = useState(false)
  const timetable = timetableAnfrageSchema.safeParse({
    country: von?.countryCode === nach?.countryCode ? von?.countryCode : null,
    from: von?.name,
    to: nach?.name,
    fromPlaceId: von?.placeId,
    toPlaceId: nach?.placeId,
  })
  const optionen = stationen.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ))
  return (
    <>
      <form
        className="org-form"
        onChange={() => {
          suche.reset()
          setGesucht(false)
        }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!von || !nach || von.id === nach.id || Boolean(von.placeId && von.placeId === nach.placeId))
            return suche.setFehler('Wähle zwei verschiedene Orte deiner Reise.')
          setGesucht(true)
          void suche.suchen((signal) =>
            mobilitySucheVomClient(
              {
                originName: von.name,
                destinationName: nach.name,
                originPlaceId: von.placeId,
                destinationPlaceId: nach.placeId,
                date: datum || null,
                mode: null,
                travellers: gaeste,
                currency: reise.currency,
              },
              signal,
            ),
          )
        }}
      >
        <div className="org-formtop">
          <h2>Verbindung suchen</h2>
        </div>
        <div className="org-fields org-four">
          <Feld label="Von">
            <select
              required
              value={vonId}
              onChange={(e) => {
                setVon(e.target.value)
                const next = stationen[stationen.findIndex((s) => s.id === e.target.value) + 1]
                if (next) {
                  setNach(next.id)
                  setDatum(next.datum ?? '')
                }
              }}
            >
              {optionen}
            </select>
          </Feld>
          <Feld label="Nach">
            <select
              required
              value={nachId}
              onChange={(e) => {
                setNach(e.target.value)
                setDatum(stationen.find((s) => s.id === e.target.value)?.datum ?? '')
              }}
            >
              <option value="">Ziel wählen</option>
              {optionen}
            </select>
          </Feld>
          <Feld label="Reisedatum">
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </Feld>
          <Personen wert={gaeste} setzen={setGaeste} />
          <SucheKnopf busy={suche.busy} />
        </div>
        {suche.fehler && <p role="alert">{suche.fehler}</p>}
      </form>
      {gesucht && von && nach ? (
        <section className="org-results">
          <h2>
            {von.name} → {nach.name}
          </h2>
          {suche.daten && (
            <>
              <p role="status">{suche.daten.message}</p>
              {suche.daten.options.map((o) => (
                <article className="org-item" key={o.id}>
                  <h3>{o.title}</h3>
                  <p>
                    {[
                      o.originName + ' → ' + o.destinationName,
                      o.startsAt,
                      o.preis != null && o.preisWaehrung ? betragLesbar(o.preis, o.preisWaehrung) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </article>
              ))}
            </>
          )}
          {timetable.success && (
            <>
              <h3>Allgemeiner 12Go-Fahrplan</h3>
              <p>
                Die Fahrplanangaben gelten für die Strecke. Datum, Plätze und verbindlichen Preis prüfst du
                beim Anbieter.
              </p>
              <TimetableDetails key={von.id + ':' + nach.id} request={timetable.data} />
            </>
          )}
        </section>
      ) : (
        etappen
      )}
    </>
  )
}
