'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Bus, Car, Clock3, Loader2, Plane, Ship, TrainFront } from 'lucide-react'
import { lade, type Ladung } from '@/lib/admin/ladezustand'
import { twelveGoKantenFuerReise, type TwelveGoKante } from '@/lib/providers/twelve-go/affiliate/kanten'
import { timetableAnfrageFuerKante, timetableAntwortSchema, timetableVerkehrsmittel, type TimetableAnfrage, type TimetableAntwort } from '@/lib/providers/twelve-go/timetable/schema'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import type { Trip } from '@/types/trips'

const BUTTON = 'inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full border border-line-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30'
const ICONS = { train: TrainFront, bus: Bus, avia: Plane, van: Bus, ferry: Ship, charter: Car }

function TimetableCards({ data }: { data: TimetableAntwort }) {
  if (data.status === 'unmatched') return <p role="status" className="rounded-2xl bg-surface-25 p-4 text-sm leading-6 text-ink-800">Für genau diesen Abschnitt konnte 12Go keine eindeutig passenden Fahrplaninformationen liefern. Das bedeutet nicht, dass es keine Verbindung gibt.</p>
  return <>
    <div className={`grid min-w-0 gap-3 ${data.options.length > 1 ? 'lg:grid-cols-2' : ''}`}>
      {data.options.map((option) => {
        const Icon = ICONS[option.mode]
        return <article key={option.mode} className="flex min-w-0 flex-col rounded-2xl border border-line-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2 text-brand-800"><Icon size={22} aria-hidden="true" /></span><h3 className="text-lg font-semibold text-brand-800">{timetableVerkehrsmittel[option.mode]}</h3></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-700">Preisangabe von 12Go · CHF</p>
          <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-brand-800">{option.price}</p>
          <p className="mt-3 flex items-start gap-2 text-sm text-ink-800"><Clock3 size={17} aria-hidden="true" className="mt-0.5 shrink-0" /><span>Typische Fahrtdauer: {option.duration ?? 'nicht angegeben'}</span></p>
          <details className="my-4 rounded-xl bg-surface-25 px-3 py-1 text-sm text-ink-800">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">Klassen und Abfahrtszeiten</summary>
            {option.departures.length ? <ul className="divide-y divide-line-200 pb-2">{option.departures.map((departure, index) => <li key={index} className="py-3"><p className="break-words font-medium">{departure.service}</p><p className="mt-1 break-words">{departure.times ?? 'Keine festen Abfahrtszeiten angegeben'}</p></li>)}</ul> : <p className="pb-3">Keine Abfahrtsangaben hinterlegt.</p>}
          </details>
          <a className={`${BUTTON} mt-auto w-full`} href={option.href} target="_blank" rel="noopener noreferrer sponsored">Bei 12Go prüfen <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only">: {timetableVerkehrsmittel[option.mode]}, neues Fenster</span></a>
        </article>
      })}
    </div>
    <p className="mt-3 text-xs leading-5 text-ink-700">Quelle: 12Go · Abgerufen {new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(new Date(data.fetchedAt))} (Schweizer Zeit). Angaben können sich ändern.</p>
  </>
}

function TimetableDetails({ request }: { request: TimetableAnfrage }) {
  const [result, setResult] = useState<Ladung<TimetableAntwort> | null>(null)
  const [retry, setRetry] = useState(0)
  const { from, to, country, fromPlaceId, toPlaceId } = request
  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    const timer = setTimeout(() => controller.abort(), 12000)
    void lade(() => fetch('/api/mobility/twelve-go-timetable', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, country, fromPlaceId, toPlaceId }), signal: controller.signal,
    }), (body) => timetableAntwortSchema.parse(body)).then((value) => {
      if (!disposed) setResult(value)
    }).finally(() => clearTimeout(timer))
    return () => { disposed = true; clearTimeout(timer); controller.abort() }
  }, [from, to, country, fromPlaceId, toPlaceId, retry])
  if (!result) return <div role="status" className="flex min-h-32 items-center gap-3 rounded-2xl bg-surface-25 p-5 text-sm text-brand-800"><Loader2 className="motion-safe:animate-spin" aria-hidden="true" />12Go-Streckeninformationen werden geladen …</div>
  if (result.fehler) return <div role="status" className="rounded-2xl border border-line-200 p-4"><p className="text-sm leading-6 text-ink-800">{result.fehler.meldung}</p>{result.fehler.wiederholbar ? <button type="button" className={`${BUTTON} mt-3`} onClick={() => { setResult(null); setRetry((n) => n + 1) }}>Erneut versuchen</button> : null}</div>
  return <TimetableCards data={result.daten} />
}

function RoutePanel({ edge }: { edge: TwelveGoKante }) {
  const request = timetableAnfrageFuerKante(edge)
  return <div className="mt-5" data-twelve-go-kante={edge.id}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="break-words text-lg font-semibold text-brand-800">{edge.vonName} → {edge.nachName}</h3><p className="mt-1 text-sm leading-6 text-ink-800">{edge.datumHinweis}</p></div>
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">Allgemeiner Fahrplan</span>
    </div>
    <p className="mb-4 text-sm leading-6 text-ink-800">Allgemeine Angaben für die 12Go-Zielregionen, nicht für einen bestimmten Reisetag oder eine bestimmte Haltestelle. Prüfe Datum, Abholort, Reisende, Gesamtpreis und Verfügbarkeit bei 12Go. Bei privaten Transfers kann der Preis für ein Fahrzeug gelten.</p>
    {request ? <TimetableDetails request={request} /> : <p className="rounded-2xl bg-surface-25 p-4 text-sm leading-6 text-ink-800">Für diesen Abschnitt ist noch keine eindeutige Fahrplanzuordnung verfügbar. Du kannst die Strecke direkt bei 12Go suchen.</p>}
    <a href={edge.href} target="_blank" rel="noopener noreferrer sponsored" className={`${BUTTON} mt-4`}>Andere Verbindungen bei 12Go suchen <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only">, neues Fenster</span></a>
  </div>
}

export default function TwelveGoTimetable({ reise }: { reise: Trip }) {
  const edges = twelveGoKantenFuerReise(reise)
  const [selected, setSelected] = useState<string | null>(null)
  const edge = edges.find((item) => item.id === selected) ?? edges[0]
  const context = edge ? [reise.id, edge.id, edge.vonName, edge.nachName, edge.vonLand, edge.nachLand, edge.vonPlaceId, edge.nachPlaceId, edge.geplantesDatum].join('|') : ''
  return <section aria-label="12Go-Streckeninformationen" data-organisieren-flaeche="twelve-go" data-twelve-go-timetable="1" className={ORGANISIEREN_FLAECHE_KLASSE}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Unterwegs mit 12Go</p>
    <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-800 sm:text-2xl">Verbindungen für deine Route</h2>
    <p className="mt-2 text-sm leading-6 text-ink-800">Vergleiche Verkehrsmittel und allgemeine Fahrplanangaben für deine Weiterreise. Buchung und Bezahlung erfolgen bei 12Go. Die Links sind Affiliate-Links.</p>
    {edges.length ? <>
      <div role="group" aria-label="Reiseabschnitt auswählen" className="mt-5 flex flex-wrap gap-2">
        {edges.map((item, index) => <button key={item.id} type="button" aria-pressed={item.id === edge?.id} onClick={() => setSelected(item.id)} className={`${BUTTON} min-w-0 whitespace-normal text-left aria-pressed:border-brand-800 aria-pressed:bg-brand-50`}><span className="shrink-0 text-xs">{index + 1}.</span><span className="break-words">{item.vonName} → {item.nachName}</span></button>)}
      </div>
      {edge ? <RoutePanel key={context} edge={edge} /> : null}
    </> : <p className="mt-4 text-sm leading-6 text-ink-800">Sobald mindestens zwei Ziele in deiner Reise stehen, erscheinen hier die aufeinanderfolgenden Reiseabschnitte.</p>}
  </section>
}
