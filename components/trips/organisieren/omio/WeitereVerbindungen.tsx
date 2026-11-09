'use client'
import { useEffect, useState } from 'react'
import { TimetableDetails } from '@/components/trips/TwelveGoTimetable'
import { timetableAnfrageSchema } from '@/lib/providers/twelve-go/timetable/schema'
import { mobilitySucheFehlerAntwort, mobilitySucheVomClient } from '@/lib/mobility/client-anfrage'
import type { MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import type { Abschnitt } from '@/lib/providers/omio/katalog'

export default function WeitereVerbindungen({
  abschnitt,
  personen,
  waehrung,
}: {
  abschnitt: Abschnitt
  personen: number
  waehrung: string
}) {
  const { von, nach, datum } = abschnitt
  const [offen, setOffen] = useState(false),
    [antwort, setAntwort] = useState<MobilitySucheAntwort | null>(null)
  const timetable = timetableAnfrageSchema.safeParse({
    country: von.country === nach.country ? von.country : null,
    from: von.name,
    to: nach.name,
    fromPlaceId: von.placeId,
    toPlaceId: nach.placeId,
  })
  useEffect(() => {
    if (!offen) return
    const request = new AbortController()
    void mobilitySucheVomClient(
      {
        originName: von.name,
        destinationName: nach.name,
        originPlaceId: von.placeId ?? null,
        destinationPlaceId: nach.placeId ?? null,
        date: datum || null,
        mode: null,
        travellers: personen,
        currency: waehrung,
      },
      request.signal,
    )
      .then((data) => {
        if (!request.signal.aborted) setAntwort(data)
      })
      .catch(() => {
        if (!request.signal.aborted)
          setAntwort(mobilitySucheFehlerAntwort('Weitere Verbindungen sind gerade nicht erreichbar.'))
      })
    return () => request.abort()
  }, [offen, von, nach, datum, personen, waehrung])
  return (
    <details className="ov-bestehend" onToggle={(event) => setOffen(event.currentTarget.open)}>
      <summary>
        {timetable.success ? 'Weitere Verbindungen und 12Go-Fahrplan' : 'Weitere Verbindungen prüfen'}
      </summary>
      {offen && (
        <div className="ov-weitere">
          {timetable.success && (
            <section>
              <h3>Allgemeiner 12Go-Fahrplan</h3>
              <p>Die Fahrplanangaben gelten für die Strecke. Datum, Plätze und Preis prüfst du bei 12Go.</p>
              <TimetableDetails request={timetable.data} />
            </section>
          )}
          {!antwort ? (
            <p role="status">Weitere Mobilitätsangebote werden geprüft …</p>
          ) : (
            <>
              <p role="status">{antwort.message}</p>
              {antwort.options.map((o) => (
                <article className="ov-card" key={o.id}>
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
        </div>
      )}
    </details>
  )
}
