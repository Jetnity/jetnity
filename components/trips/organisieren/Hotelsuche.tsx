'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight, MapPin } from 'lucide-react'
import Reisefoto from './Reisefoto'
import HotelKarte from '@/components/trips/HotelKarte'
import type { HotelSucheAntwort } from '@/lib/hotels/client-sicht'
import { hotelSucheEingabeAusReise } from '@/lib/hotels/quartier-kontext'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { bookingHotelLink, etappenZiel, hotelDaten } from '@/lib/trips/organisieren/katalog'
import type { Trip, TripStage } from '@/types/trips'
import { Feld, Personen, SucheKnopf, useSuchanfrage } from './Suchfelder'

const Hotelkarte = dynamic(() => import('./Hotelkarte'), { ssr: false })

export default function Hotelsuche({
  reise,
  start,
  sofort,
  etappen,
}: {
  reise: Trip
  start?: TripStage
  sofort: boolean
  etappen: ReactNode
}) {
  const [stageId, setStageId] = useState(start?.id ?? '')
  const stage = reise.stages.find((s) => s.id === stageId)
  const [termine, setTermine] = useState(() => hotelDaten(reise, start))
  const [gaeste, setGaeste] = useState(Math.min(9, Math.max(1, reise.travellers)))
  const [zimmer, setZimmer] = useState(1)
  const [gesucht, setGesucht] = useState(sofort)
  const [sort, setSort] = useState('auswahl')
  const [aktiv, setAktiv] = useState('')
  const suche = useSuchanfrage<HotelSucheAntwort>()
  const profile = etappenZiel(stage)?.hotels
  const sortiert = useMemo(
    () =>
      sort === 'name'
        ? [...(profile ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'de'))
        : (profile ?? []),
    [profile, sort],
  )
  const orte = useMemo(
    () => [
      ...sortiert.map((h) => ({
        id: h.slug,
        name: h.name,
        ort: h.viertel + ', ' + stage?.name + ', Thailand',
        lat: h.lat,
        lng: h.lng,
      })),
      ...(suche.daten?.options ?? []).map((h) => ({
        id: 'live-' + h.id,
        name: h.name,
        ort: h.adresse ?? stage?.name ?? '',
        lat: h.punkt.lat,
        lng: h.punkt.lon,
      })),
    ],
    [sortiert, stage, suche.daten],
  )
  const ausgewaehlt = orte.find((o) => o.id === aktiv)?.id ?? orte[0]?.id ?? ''
  const waehlen = useCallback(
    (id: string) => {
      setAktiv(id)
      document.getElementById('org-hotel-' + id)?.scrollIntoView({ block: 'nearest' })
    },
    [setAktiv],
  )
  function reset() {
    suche.reset()
    setGesucht(false)
    setAktiv('')
  }
  function starten() {
    suche.reset()
    if (!stage) return suche.setFehler('Bitte füge zuerst eine Reiseetappe hinzu.')
    if (
      !!termine.anreise !== !!termine.abreise ||
      (termine.anreise && (termine.abreise <= termine.anreise || termine.anreise < heutigesDatum()))
    )
      return suche.setFehler(
        'Bitte wähle einen zukünftigen Aufenthalt mit An- und Abreise oder lass beide Termine offen.',
      )
    setGesucht(true)
    if (!termine.anreise || !termine.abreise) return
    const eingabe = hotelSucheEingabeAusReise(reise, stage)
    void suche.suchen(async (signal) => {
      const res = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          ...eingabe,
          stage: { ...eingabe.stage, arrivalDate: termine.anreise, departureDate: termine.abreise },
          trip: { ...eingabe.trip, travellers: gaeste },
          rooms: zimmer,
        }),
      })
      const data: HotelSucheAntwort = await res.json()
      if (!res.ok || !Array.isArray(data.options))
        throw new Error(data.message || 'Aktuelle Hotelangebote sind gerade nicht verfügbar.')
      return data
    })
  }
  return (
    <>
      <form
        className="org-form"
        onChange={reset}
        onSubmit={(e) => {
          e.preventDefault()
          starten()
        }}
      >
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
          <SucheKnopf busy={suche.busy} />
        </div>
        {suche.fehler && <p role="alert">{suche.fehler}</p>}
      </form>
      {gesucht && stage ? (
        <section className="org-results">
          <div className="org-sectionhead">
            <div>
              <h2>Unterkünfte in {stage.name}</h2>
              <p>
                {sortiert.length ? sortiert.length + ' ausgewählte Hotels · ' : ''}
                {gaeste} Erwachsene · {zimmer} Zimmer
              </p>
            </div>
            {sortiert.length > 1 && (
              <select aria-label="Hotels sortieren" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="auswahl">Auswahl</option>
                <option value="name">Name A–Z</option>
              </select>
            )}
          </div>
          {orte.length ? (
            <div className="org-hotelgrid">
              <div className="org-list">
                {sortiert.map((hotel) => {
                  const link = bookingHotelLink(hotel, {
                    ...termine,
                    gaeste,
                    zimmer,
                    waehrung: reise.currency,
                  })
                  return (
                    <article
                      className={'org-hotel ' + (hotel.slug === ausgewaehlt ? 'org-selected' : '')}
                      key={hotel.slug}
                      id={'org-hotel-' + hotel.slug}
                    >
                      <a
                        className="org-thumb"
                        href={link}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        aria-label={hotel.name + ' bei Booking.com ansehen'}
                      >
                        <Reisefoto src={hotel.bild} breite={152} hoehe={107} />
                        {hotel.umgebung && <small>Region</small>}
                      </a>
                      <div className="org-hoteltext">
                        <span className="org-pill">{hotel.viertel}</span>
                        <h3>{hotel.name}</h3>
                        <p>{hotel.lage}</p>
                        <div className="org-cardactions">
                          <button
                            type="button"
                            onClick={() => {
                              setAktiv(hotel.slug)
                              document.querySelector('.org-mapbox')?.scrollIntoView({ block: 'nearest' })
                            }}
                          >
                            <MapPin size={14} /> Auf Karte
                          </button>
                          <a href={link} target="_blank" rel="sponsored noopener noreferrer">
                            Zum Hotel <ArrowUpRight size={14} />
                          </a>
                        </div>
                      </div>
                    </article>
                  )
                })}
                {suche.daten?.options.map((h) => (
                  <div key={h.id} id={'org-hotel-live-' + h.id}>
                    <HotelKarte option={h} laeuft={false} />
                  </div>
                ))}
              </div>
              <Hotelkarte orte={orte} aktiv={ausgewaehlt} waehlen={waehlen} />
            </div>
          ) : (
            <p role="status">
              {suche.busy
                ? 'Hotelangebote werden geprüft …'
                : suche.daten?.message || 'Für diese Etappe sind derzeit keine Hotelprofile verfügbar.'}
            </p>
          )}
          {sortiert.length > 0 && (
            <p className="org-note">
              Die Hotelauswahl ist unabhängig vom Reisedatum. Preis und Verfügbarkeit zeigt Booking.com. Bei
              einer Buchung über den Partnerlink kann Jetnity eine Provision erhalten.
            </p>
          )}
        </section>
      ) : (
        etappen
      )}
    </>
  )
}
