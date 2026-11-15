'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { CloudSun, Sunset } from 'lucide-react'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { istPosition } from '@/lib/maps/reisekarte'
import { wetterAmTag, wetterZurUhrzeit, type Vorhersage } from '@/lib/reisewetter/vorhersage'
import type { TripItem, TripStage } from '@/types/trips'

const WetterVorschau = createContext(false)
export function WetterRahmen({ aktiv, children }: { aktiv: boolean; children: ReactNode }) {
  return <WetterVorschau.Provider value={aktiv}>{children}</WetterVorschau.Provider>
}
const datumFormat = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatTag = (datum: string) => datumFormat.format(new Date(datum + 'T12:00:00Z'))

type Zustand = { status: 'laedt' | 'fehler' | 'ohne-ort' } | { status: 'bereit'; daten: Vorhersage }
type Ort = Pick<TripStage, 'name' | 'placeId' | 'latitude' | 'longitude'>

type Props = { ort: Ort; datum: string | null; aktivitaeten?: TripItem[] }

function WetterFuerOrt({ ort, datum, aktivitaeten }: Props) {
  const { latitude, longitude, placeId } = ort
  const [stand, setStand] = useState<Zustand>({ status: 'laedt' })
  const [versuch, setVersuch] = useState(0)
  const [jetzt, setJetzt] = useState(Date.now)
  useEffect(() => {
    const intervall = window.setInterval(() => setJetzt(Date.now()), 15 * 60_000)
    return () => window.clearInterval(intervall)
  }, [])
  // Margin for local dates on either side of UTC; the returned slots decide availability.
  const abstand = datum ? (Date.parse(datum + 'T00:00:00Z') - jetzt) / 86_400_000 : 0
  const zuFrueh = abstand > 6
  const vorbei = abstand < -2
  useEffect(() => {
    if (zuFrueh || vorbei) return
    const ctrl = new AbortController()
    async function lesen() {
      let position = { lat: latitude, lng: longitude }
      if (!istPosition(position) && placeId) {
        const antwort = await ortBestaetigen(placeId, 'ziel')
        if (antwort.ok && antwort.wert.id === placeId && antwort.wert.typ !== 'country') {
          position = { lat: antwort.wert.lat, lng: antwort.wert.lon }
        }
      }
      if (ctrl.signal.aborted) return
      if (!istPosition(position)) { setStand({ status: 'ohne-ort' }); return }
      const params = new URLSearchParams({ lat: position.lat.toFixed(2), lon: position.lng.toFixed(2) })
      const res = await fetch('/api/reisewetter?' + params, { signal: ctrl.signal, referrerPolicy: 'no-referrer' })
      if (!res.ok) throw new Error('Wetterabruf')
      const daten: Vorhersage = await res.json()
      if (!ctrl.signal.aborted) setStand({ status: 'bereit', daten })
    }
    void lesen().catch(() => { if (!ctrl.signal.aborted) setStand({ status: 'fehler' }) })
    return () => ctrl.abort()
  }, [latitude, longitude, placeId, zuFrueh, vorbei, versuch, jetzt])

  if (vorbei || stand.status === 'ohne-ort') return null
  const tag = stand.status === 'bereit' ? wetterAmTag(stand.daten, datum) : null
  return <section aria-label={'Wetter in ' + ort.name} className="my-3 min-w-0 rounded-2xl border border-line-200 bg-white p-4 text-sm text-ink-900">
    <h3 className="flex items-center gap-2 font-semibold"><CloudSun size={19} aria-hidden />Wetter in {ort.name}</h3>
    {zuFrueh ? <p className="mt-1 text-ink-700">Die Vorhersage erscheint rund fünf Tage vor diesem Reisetag.</p>
      : stand.status === 'fehler' ? <div role="status">Wetterdaten sind gerade nicht erreichbar.{' '}
        <button type="button" className="min-h-11 underline" onClick={() => { setStand({ status: 'laedt' }); setVersuch(v => v + 1) }}>Erneut laden</button></div>
      : !tag ? <p role="status">Wetter wird geladen …</p>
      : !tag.zeiten.length ? <p>Für diesen Tag liegt noch keine aktuelle Vorhersage vor.</p>
      : <>
        <p className="mt-1">{formatTag(tag.tag)} · Ortszeit</p>
        <p className="mt-2 font-medium">{Math.min(...tag.zeiten.map(z => z.temperatur))} bis {Math.max(...tag.zeiten.map(z => z.temperatur))} °C
          {' · '}bis {Math.max(...tag.zeiten.map(z => z.regen))} % Niederschlagsrisiko</p>
        {tag.untergang && <p className="mt-1 flex items-center gap-2"><Sunset size={16} aria-hidden />Sonnenuntergang um {tag.untergang} Uhr</p>}
        {aktivitaeten?.map(punkt => {
          if (punkt.kind !== 'activity' || !punkt.startsAt || (punkt.startsOn && punkt.startsOn !== tag.tag)) return null
          const zeit = wetterZurUhrzeit(tag.zeiten, punkt.startsAt)
          return zeit && <p key={punkt.id} className="mt-2 break-words">
            <strong>{punkt.startsAt} · {punkt.title}</strong><br />
            Prognose um {zeit.zeit.slice(11)} Uhr · {zeit.temperatur} °C · {zeit.regen} % Niederschlagsrisiko
          </p>
        })}
        <details className="mt-2">
          <summary className="cursor-pointer py-3 font-medium">Wetter nach Uhrzeit</summary>
          <ul className="divide-y divide-line-200">{tag.zeiten.map(z => <li key={z.zeit} className="py-2">
            <strong>{z.zeit.slice(11)} · {z.temperatur} °C</strong>{z.beschreibung && ' · ' + z.beschreibung}
            <div className="text-ink-700">{z.regen} % Niederschlagsrisiko · Wind {z.wind} km/h
              {z.sicht !== null && ' · Sicht ' + (z.sicht / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 }) + ' km'}</div>
          </li>)}</ul>
        </details>
        <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-ink-700">
          <Image src="/brand/openweather.png" alt="" width={48} height={27} unoptimized />Weather data provided by OpenWeather</a>
      </>}
  </section>
}

export default function Tageswetter({ ort, datum, aktivitaeten }: Props) {
  const aktiv = useContext(WetterVorschau)
  if (!aktiv || (!ort.placeId && (ort.latitude === null || ort.longitude === null))) return null
  return <WetterFuerOrt key={JSON.stringify([ort.placeId, ort.latitude, ort.longitude])} ort={ort} datum={datum} aktivitaeten={aktivitaeten} />
}
