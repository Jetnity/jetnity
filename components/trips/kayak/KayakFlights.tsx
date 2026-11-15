'use client'

import * as React from 'react'
import Suchkalender from '@/components/trips/organisieren/auswahl/Suchkalender'
import { ArrowRight, Plane } from 'lucide-react'
import FlughafenSuche from '@/components/airports/FlughafenSuche'
import { flughafenAusReiseort, type FlughafenAuswahl } from '@/lib/airports/auswahl'
import type { Trip } from '@/types/trips'
import type { FlightLegPreview, KayakSearch } from '@/lib/providers/kayak/contract'
import { ORGANISIEREN_EINGABE_KLASSE as inputClass, ORGANISIEREN_FLAECHE_KLASSE as panelClass } from '@/lib/trips/organize-premium-experience-6'
import { PreviewNotice, PreviewFeedback, PreviewSearchButton, previewMoney, useKayakPreview } from './PreviewShared'

type Cabin = Extract<KayakSearch, { kind: 'flights' }>['cabin']
export default function KayakFlights({ reise, tagId }: { reise: Trip; tagId: string | null }) {
  const [origin, setOrigin] = React.useState<FlughafenAuswahl | null>(() => flughafenAusReiseort({ placeId: reise.originPlaceId, name: reise.origin }))
  const [destination, setDestination] = React.useState<FlughafenAuswahl | null>(() => flughafenAusReiseort({ placeId: reise.stages[0]?.placeId, name: reise.stages[0]?.name }))
  const [departure, setDeparture] = React.useState(reise.days.find((day) => day.id === tagId)?.dayDate ?? reise.startDate ?? '')
  const [returnDate, setReturnDate] = React.useState(reise.endDate ?? '')
  const [roundTrip, setRoundTrip] = React.useState(Boolean(reise.endDate))
  const [adults, setAdults] = React.useState(Math.min(9, Math.max(1, reise.travellers)))
  const [cabin, setCabin] = React.useState<Cabin>('economy')
  const [sort, setSort] = React.useState('price')
  const [direct, setDirect] = React.useState(false)
  const [visible, setVisible] = React.useState(12)
  const preview = useKayakPreview()
  const id = React.useId()
  const flights = [...(preview.data?.flights ?? [])].filter((flight) => !direct || flight.legs.every((leg) => leg.stops === 0)).sort((a, b) => sort === 'duration' ? totalDuration(a.legs) - totalDuration(b.legs) : (a.price ?? Infinity) - (b.price ?? Infinity))
  return <section aria-label="Flüge mit KAYAK entdecken" className="grid min-w-0 gap-5">
    <div className={panelClass}>
      <div className="mb-5 flex items-start gap-3"><span className="rounded-2xl bg-surface-50 p-3 text-brand-800"><Plane className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Anreise</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-brand-800">Der passende Flug für deine Reise.</h2><p className="mt-2 text-sm leading-6 text-ink-800">Vergleiche Flugzeiten, Zwischenstopps und Preise direkt in deiner Reiseübersicht.</p></div></div>
      <PreviewNotice />
      <form className="mt-5 grid gap-4" onChange={preview.reset} onSubmit={(event) => {
        event.preventDefault()
        if (!departure || (roundTrip && !returnDate)) { preview.setError('Bitte wähle die Flugdaten.'); return }
        if (!origin || !destination) { preview.setError('Bitte wähle Abflug- und Zielflughafen aus den Vorschlägen.'); return }
        setVisible(12)
        void preview.search({ kind: 'flights', origin: origin.iata, destination: destination.iata, departure, ...(roundTrip ? { returnDate } : {}), adults, cabin })
      }}>
        <div className="flex flex-wrap items-center gap-4"><label className="flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800"><input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="h-4 w-4 accent-brand-800" />Hin- und Rückflug</label><p className="text-xs text-ink-600">Reiseroute: {reise.origin || 'Abflug offen'} → {reise.stages[0]?.name || 'Ziel offen'}</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label htmlFor={`${id}-origin`} className="mb-2 block text-sm font-medium text-brand-800">Abflughafen</label><FlughafenSuche inputId={`${id}-origin`} value={origin} onChange={(value) => { setOrigin(value); preview.reset() }} placeholder="Stadt oder Flughafen suchen" inputClassName={inputClass} /></div>
          <div><label htmlFor={`${id}-destination`} className="mb-2 block text-sm font-medium text-brand-800">Zielflughafen</label><FlughafenSuche inputId={`${id}-destination`} value={destination} onChange={(value) => { setDestination(value); preview.reset() }} placeholder="Stadt oder Flughafen suchen" inputClassName={inputClass} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Suchkalender start={departure} ende={returnDate} startLabel="Hinflug" endeLabel="Rückflug"
            einzeln={!roundTrip} min="1900-01-01" max="9999-12-31" minTage={0} kontext="Deine Flugdaten"
            setzen={(start, ende) => { setDeparture(start); setReturnDate(ende); preview.reset() }} />
          <label className="grid gap-2 text-sm font-medium text-brand-800">Erwachsene<input type="number" className={inputClass} min={1} max={9} required value={adults} onChange={(e) => setAdults(Number(e.target.value))} /></label>
          <label className="grid gap-2 text-sm font-medium text-brand-800">Reiseklasse<select className={inputClass} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}><option value="economy">Economy</option><option value="premium">Premium Economy</option><option value="business">Business</option><option value="first">First Class</option></select></label>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3"><PreviewSearchButton busy={preview.busy} /><p className="text-xs leading-5 text-ink-600">Testsuche für Erwachsene · Preise in der gelieferten Währung</p></div>
      </form>
      <PreviewFeedback busy={preview.busy} error={preview.error} complete={preview.data?.complete} />
    </div>
    {preview.data && <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Beispielergebnisse</p><h3 className="mt-1 text-xl font-semibold text-brand-800">{flights.length} Flugverbindungen im Vergleich</h3><p className="mt-1 text-sm text-ink-600">KAYAK-Testdaten · angezeigte Zeiten gelten am jeweiligen Flughafen</p></div><div className="flex flex-wrap items-end gap-4"><label className="flex min-h-11 items-center gap-2 text-sm text-brand-800"><input type="checkbox" className="h-4 w-4 accent-brand-800" checked={direct} onChange={(e) => { setDirect(e.target.checked); setVisible(12) }} />Nur Direktflüge</label><label className="grid gap-1 text-xs text-ink-800">Sortieren<select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}><option value="price">Niedrigster Preis</option><option value="duration">Kürzeste Flugdauer</option></select></label></div></div>
      {!flights.length && <p className={panelClass}>{preview.data.flights.length ? 'Keine Beispielverbindung passt zu diesem Filter.' : 'KAYAK hat für diese Testsuche keine Beispielverbindungen geliefert.'}</p>}
      <div className="grid gap-4 xl:grid-cols-2">{flights.slice(0, visible).map((flight) => <article key={flight.id} className="flex min-w-0 flex-col rounded-3xl border border-line-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><span className="rounded-full bg-surface-50 px-3 py-1 text-xs font-semibold text-brand-800">Testangebot</span><p className="truncate text-xs text-ink-600">{[...new Set(flight.legs.flatMap((leg) => leg.airlines))].join(' · ') || 'Airline nicht angegeben'}</p></div>
        <div className="grid gap-4">{flight.legs.map((leg, index) => <div key={index} className="rounded-2xl bg-surface-25 p-3 sm:p-4"><p className="mb-3 text-xs font-semibold text-ink-600">{index === 0 ? 'Hinflug' : 'Rückflug'} · {leg.departure.slice(8, 10)}.{leg.departure.slice(5, 7)}.{leg.departure.slice(0, 4)}</p><div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3"><div><p className="whitespace-nowrap text-xl font-semibold text-brand-800 sm:text-2xl">{leg.departure.slice(11, 16)}</p><p className="mt-1 text-sm font-medium text-ink-800">{leg.origin}</p></div><div className="grid justify-items-center gap-1 text-xs text-ink-600"><p>{duration(leg.duration)}</p><ArrowRight className="h-5 w-5 text-brand-600" aria-hidden="true" /><p>{leg.stops ? `${leg.stops} ${leg.stops === 1 ? 'Stopp' : 'Stopps'}` : 'Direkt'}</p></div><div className="text-right"><p className="whitespace-nowrap text-xl font-semibold text-brand-800 sm:text-2xl">{leg.arrival.slice(11, 16)}</p><p className="mt-1 text-sm font-medium text-ink-800">{leg.destination}</p></div></div>{leg.arrival.slice(0, 10) !== leg.departure.slice(0, 10) && <p className="mt-2 text-right text-xs text-ink-600">Ankunft {leg.arrival.slice(8, 10)}.{leg.arrival.slice(5, 7)}.{leg.arrival.slice(0, 4)}</p>}</div>)}</div>
        <div className="mt-auto pt-4"><div className="flex flex-wrap items-end justify-between gap-3 border-t border-line-200 pt-4"><div><p className="text-xs text-ink-600">Beispielpreis{flight.priceMode === 'perPerson' ? ' pro Person' : flight.priceMode === 'total' ? ' gesamt' : ' · Preisbasis nicht angegeben'}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-brand-800">{previewMoney(flight.price, flight.currency)}</p></div><span className="text-xs text-ink-600">Nicht buchbar</span></div></div>
      </article>)}</div>
      {visible < flights.length && <button type="button" className="mt-5 min-h-11 rounded-full border border-line-200 bg-white px-6 text-sm font-semibold text-brand-800" onClick={() => setVisible(visible + 12)}>Weitere Beispielverbindungen anzeigen</button>}
    </div>}
  </section>
}

function totalDuration(legs: FlightLegPreview[]) { return legs.some((leg) => leg.duration === null) ? Infinity : legs.reduce((sum, leg) => sum + (leg.duration ?? 0), 0) }
function duration(minutes: number | null) { return minutes === null ? 'Dauer offen' : `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` }
