'use client'

import type { RefObject } from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import type { WorldMapAbleitung, WorldMapReise } from '@/lib/account/world-map'
import { weltOrtReiseAnzeigen } from '@/lib/account/world-map-ansicht'
import { countryTrips, positionText, recordStatus, type ExplorerRecord } from '@/lib/account/world-explorer-1/presentation'

export default function ExplorerDetails({ record, country, welt, besucht, titleRef, onClose, id }: {
  record: ExplorerRecord | null
  country: ExplorerRecord | null
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  titleRef: RefObject<HTMLHeadingElement | null>
  onClose: () => void
  id: string
}) {
  if (!record) return <aside id={id} className="rounded-[22px] border border-line-200 bg-surface-50 p-5 text-sm leading-6 text-ink-800">
    <h3 className="font-semibold text-brand-800">Ein Land entdecken</h3>
    <p className="mt-2">Wähle ein Land oder einen Ort aus deinen Einträgen. Hier siehst du bestätigte Besuche und zugehörige Reisepläne getrennt.</p>
  </aside>
  const code = record.code
  const events = besucht.lage === 'fehler' ? [] : code
    ? besucht.eintraege.filter((b) => b.countryCode === code)
    : record.besuch ? [record.besuch] : []
  const trips: readonly WorldMapReise[] = welt.lage === 'fehler' ? [] : code
    ? countryTrips(welt.orte, code) : record.ort?.reisen ?? []
  const selected = country ?? record
  return <aside id={id} aria-labelledby={`${id}-titel`} data-explorer-details className="min-w-0 rounded-[22px] border border-line-200 bg-surface-50 p-5">
    <button type="button" className="mb-3 min-h-11 rounded-xl px-2 text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClose}>Details schliessen</button>
    <h3 id={`${id}-titel`} ref={titleRef} tabIndex={-1} className="scroll-mt-28 break-words text-xl font-semibold text-brand-800 outline-none focus-visible:ring-2 focus-visible:ring-ring">{selected.label}</h3>
    <p className="mt-1 text-sm text-ink-800">{recordStatus(selected)}</p>
    {record.art !== 'land' && code ? <p className="mt-2 break-words text-sm text-brand-800">Ausgewählt: {record.label}{record.besuch ? ` · ${record.besuch.zeitText}` : ''}</p> : null}
    {!code ? <p className="mt-2 text-sm leading-6 text-ink-800">Kein gespeicherter Ländercode. Dieser Eintrag wird keinem Land zugeordnet.</p> : null}
    {positionText(record) ? <p className="mt-2 text-sm text-ink-800">{positionText(record)}</p> : null}
    {code ? <p className="mt-3 text-xs leading-5 text-ink-800">Alle verfügbaren Einträge für dieses Land, unabhängig von der aktuellen Suche. Ein Besuch wird dadurch keiner Reise zugeordnet.</p> : null}
    <section className="mt-5 border-t border-line-200 pt-4" aria-labelledby={`${id}-besuche`}>
      <h4 id={`${id}-besuche`} className="font-semibold text-brand-800">Bestätigte Besuche{besucht.lage !== 'fehler' ? ` (${events.length})` : ''}</h4>
      {besucht.lage === 'fehler' ? <p className="mt-2 text-sm text-ink-800">Besuche gerade nicht lesbar. Der Besuchsstand bleibt unbekannt.</p> : events.length ?
        <ul className="mt-2 space-y-3">{events.map((event) => <li key={event.id} data-explorer-visit={event.id} className="break-words text-sm leading-5 text-ink-800">
          <span className="font-semibold text-brand-800">{event.titel}</span><br />{event.zeitText}{event.wiederholungText ? ` · ${event.wiederholungText}` : ''}
        </li>)}</ul> : <p className="mt-2 text-sm text-ink-800">{code ? 'Keine bestätigten Besuche für dieses Land gespeichert.' : 'Für diesen Eintrag liegt kein bestätigter Besuch vor.'}</p>}
    </section>
    <section className="mt-5 border-t border-line-200 pt-4" aria-labelledby={`${id}-reisen`}>
      <h4 id={`${id}-reisen`} className="font-semibold text-brand-800">Geplante Reisen{welt.lage !== 'fehler' ? ` (${trips.length})` : ''}</h4>
      {welt.lage === 'fehler' ? <p className="mt-2 text-sm text-ink-800">Reisepläne gerade nicht lesbar. Der Planungsstand bleibt unbekannt.</p> : trips.length ?
        <ul className="mt-2 space-y-2">{weltOrtReiseAnzeigen(trips).map((trip) => <li key={trip.tripId}>
          <Link href={`/reisen/${trip.tripId}` as Route} prefetch={false} aria-label={trip.ariaLabel} className="flex min-h-11 flex-col justify-center rounded-xl border border-line-200 bg-surface-0 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="break-words font-semibold text-brand-800 underline underline-offset-4">{trip.titel}</span>
            <span className="mt-1 break-words text-xs leading-5 text-ink-800">{trip.meta}{trip.ordinalText ? ` · ${trip.ordinalText}` : ''}</span>
          </Link>
        </li>)}</ul> : <p className="mt-2 text-sm text-ink-800">{code ? 'Keine zugehörigen Reisepläne gespeichert.' : 'Keine gespeicherte Reiseverknüpfung. Aus einem Besuch wird keine Reise abgeleitet.'}</p>}
    </section>
    <p className="mt-5 text-xs leading-5 text-ink-800">Besuche kannst du in der bestehenden Besuchsverwaltung unter der Karte bearbeiten.</p>
  </aside>
}
