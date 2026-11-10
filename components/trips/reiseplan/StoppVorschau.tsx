import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import type { ManuelleVorschau } from '@/lib/reiseaenderung/direct/speichern'
import type { Trip, TripStage } from '@/types/trips'

function aufenthalt(stage: TripStage, trip: Trip) {
  const tage = trip.days.filter((d) => d.stageId === stage.id).sort((a, b) => a.dayIndex - b.dayIndex)
  const start = tage[0],
    ende = tage.at(-1)
  return (
    etappenZeitraumAnzeigen(start?.dayDate, ende?.dayDate) ||
    (start && ende
      ? start.id === ende.id
        ? 'Tag ' + start.dayIndex
        : 'Tag ' + start.dayIndex + ' – ' + ende.dayIndex
      : 'Zeitraum offen')
  )
}

export default function StoppVorschau({ vorschau }: { vorschau: ManuelleVorschau }) {
  const { vorher, nachher } = vorschau
  const neu = nachher.stages.find((s) => !vorher.stages.some((alt) => s.id === alt.id))
  if (!neu) return null

  const tage = new Map(nachher.days.map((tag) => [tag.id, tag]))
  const verschobeneTage = vorher.days.filter((tag) => {
    const neu = tage.get(tag.id)
    return neu && (tag.dayDate !== neu.dayDate || tag.dayIndex !== neu.dayIndex)
  })
  const festeEintraege = verschobeneTage
    .flatMap((tag) => tag.items)
    .filter((item) => item.startsOn || item.endsOn)
  const verschobeneEtappen = vorher.stages.flatMap((alt) => {
    const stage = nachher.stages.find((s) => s.id === alt.id)
    if (!stage) return []
    const von = aufenthalt(alt, vorher),
      zu = aufenthalt(stage, nachher)
    return von === zu ? [] : [{ id: stage.id, name: stage.name, von, zu }]
  })
  const ende = (trip: Trip) =>
    trip.endDate ? etappenZeitraumAnzeigen(trip.endDate, trip.endDate) : 'Datum offen'
  return (
    <section className="grid gap-3" aria-label="Auswirkungen des neuen Stopps">
      <div className="rounded-xl border border-line-200 bg-surface-50 p-3">
        <h4>{neu.name}</h4>
        <p className="mt-1 flex items-center gap-2">
          <CalendarDays size={15} aria-hidden="true" />
          {aufenthalt(neu, nachher)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" />
          {neu.latitude == null || neu.longitude == null
            ? 'Ohne Kartenposition'
            : neu.placeId
              ? 'Standort aus dem Ortskatalog'
              : 'Eigene Kartenposition'}
        </p>
      </div>
      <div>
        <h4>Reiseende</h4>
        <p>
          {vorher.endDate !== nachher.endDate ? (
            <>
              {ende(vorher)} <ArrowRight className="inline" size={14} aria-label="wird zu" /> {ende(nachher)}
            </>
          ) : (
            ende(nachher)
          )}
        </p>
        <p>
          {vorher.days.length} → {nachher.days.length} Reisetage
        </p>
      </div>
      {verschobeneTage.length > 0 && (
        <details className="rounded-lg border border-line-200 px-3">
          <summary className="cursor-pointer py-3 text-sm font-semibold">
            {verschobeneTage.length}{' '}
            {verschobeneTage.length === 1
              ? 'vorhandener Reisetag verschiebt sich'
              : 'vorhandene Reisetage verschieben sich'}
          </summary>
          <ul className="mb-3 grid gap-2">
            {verschobeneEtappen.map((s) => (
              <li key={s.id}>
                <b>{s.name}</b>
                <p>
                  {s.von} → {s.zu}
                </p>
              </li>
            ))}
            {!verschobeneEtappen.length &&
              verschobeneTage.map((tag) => (
                <li key={tag.id}>
                  Tag {tag.dayIndex} → Tag {tage.get(tag.id)?.dayIndex}
                </li>
              ))}
          </ul>
        </details>
      )}
      {festeEintraege.length > 0 && (
        <p>
          {festeEintraege.length === 1
            ? 'Ein Eintrag behält seinen eigenen Termin'
            : festeEintraege.length + ' Einträge behalten ihre eigenen Termine'}
          . Prüfe die Termine der verschobenen Tage im Plan.
        </p>
      )}
    </section>
  )
}
