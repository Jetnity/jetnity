'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, MapPinned } from 'lucide-react'
import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { land, type Ort } from './katalog'

function erlaubt() {
  if (window.PrivacyBee === undefined) return true
  const s = readCmpApi(window.PrivacyBee)
  return s.status === 'explicit' && s.optionalSatisfied
}
function folgen(notify: () => void) {
  return attachCmpBridge(document, () => window.PrivacyBee, notify).stop
}
function punkt(o: Ort): o is Ort & { lat: number; lng: number } {
  return (
    o.lat !== null &&
    o.lng !== null &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lng) &&
    Math.abs(o.lat) <= 90 &&
    Math.abs(o.lng) <= 180
  )
}
function Kartenausschnitt({ a, b, auswahl }: { a: Ort; b: Ort; auswahl: (i: number) => void }) {
  const node = useRef<HTMLDivElement>(null),
    [fehler, setFehler] = useState(false)
  useEffect(() => {
    const el = node.current
    if (!el || !punkt(a) || !punkt(b)) return
    let beendet = false,
      abbau: (() => void) | undefined
    void import('leaflet')
      .then((L) => {
        if (beendet) return
        const map = L.map(el, {
          scrollWheelZoom: false,
          attributionControl: true,
          zoomControl: true,
          zoomSnap: 0.25,
          fadeAnimation: false,
        })
        let geladen = 0
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        tiles
          .on('tileload', () => {
            geladen++
            setFehler(false)
          })
          .on('load', () => setFehler(geladen === 0))
          .addTo(map)
        const lng2 = b.lng + 360 * Math.round((a.lng - b.lng) / 360)
        const coords: [number, number][] = [
          [a.lat, a.lng],
          [b.lat, lng2],
        ]
        L.polyline(coords, {
          color: '#225e51',
          weight: 2.4,
          opacity: 0.85,
          dashArray: '5 7',
          interactive: false,
        }).addTo(map)
        const points = [a, b]
        coords.forEach((loc, i) => {
          const name = points[i]!.name
          const marker = L.marker(loc, {
            alt: (i ? 'Ziel ' : 'Start ') + name,
            title: name,
            icon: L.divIcon({
              className: 'ov-pin ' + (i ? 'ov-pin-b' : 'ov-pin-a'),
              html: i ? 'B' : 'A',
              iconSize: [29, 29],
              iconAnchor: [15, 15],
            }),
          }).addTo(map)
          const tip = document.createElement('span')
          tip.textContent = name
          marker.bindTooltip(tip, {
            permanent: name.length < 25,
            direction: i ? 'left' : 'right',
            offset: [i ? -12 : 12, 0],
            className: 'ov-tooltip',
          })
          marker.on('click', () => auswahl(i))
        })
        const bounds = L.latLngBounds(coords)
        const fit = () => {
          map.invalidateSize()
          map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12, animate: false })
        }
        fit()
        const obs = new ResizeObserver(fit)
        obs.observe(el)
        abbau = () => {
          obs.disconnect()
          map.remove()
        }
      })
      .catch(() => {
        if (!beendet) setFehler(true)
      })
    return () => {
      beendet = true
      abbau?.()
    }
  }, [a, b, auswahl])
  return (
    <>
      <div ref={node} className="ov-canvas" aria-label={'Karte von ' + a.name + ' nach ' + b.name} />
      {fehler && (
        <p className="ov-mapnotice" role="status">
          Kartenausschnitte sind gerade nicht erreichbar.
        </p>
      )}
    </>
  )
}
export default function Streckenkarte({ von, nach }: { von: Ort; nach: Ort }) {
  const [tab, setTab] = useState('karte'),
    [aktiv, setAktiv] = useState(0)
  const anzeigen = useSyncExternalStore(folgen, erlaubt, () => false)
  const o = aktiv ? nach : von
  const google = new URL('https://www.google.com/maps/dir/')
  google.search = new URLSearchParams({
    api: '1',
    origin: punkt(von) ? von.lat + ',' + von.lng : von.name,
    destination: punkt(nach) ? nach.lat + ',' + nach.lng : nach.name,
  }).toString()
  const query = punkt(o) ? o.lat + ',' + o.lng : [o.name, land(o)].filter(Boolean).join(', ')
  return (
    <aside className="ov-map" id="ov-streckenkarte" aria-label="Streckenkarte">
      <div className="ov-maphead">
        <h3>
          <MapPinned size={18} />
          Streckenkarte
        </h3>
        <div className="ov-mapbuttons" aria-label="Kartenansicht">
          {['karte', 'google'].map((k) => (
            <button key={k} type="button" aria-pressed={k === tab} onClick={() => setTab(k)}>
              {k === 'karte' ? 'Übersicht' : 'Google Maps'}
            </button>
          ))}
        </div>
      </div>
      {!anzeigen ? (
        <p className="ov-mapnotice">Externe Karten sind in deinen Datenschutzeinstellungen deaktiviert.</p>
      ) : tab === 'karte' ? (
        punkt(von) && punkt(nach) ? (
          <Kartenausschnitt a={von} b={nach} auswahl={setAktiv} />
        ) : (
          <p className="ov-mapnotice">
            Für diese Etappe fehlen Standortkoordinaten. Die Ortsnamen kannst du in Google Maps öffnen.
          </p>
        )
      ) : (
        <iframe
          title={'Google Maps · ' + o.name}
          className="ov-canvas"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={
            'https://maps.google.com/maps?' +
            new URLSearchParams({ q: query, hl: 'de', z: '12', output: 'embed' })
          }
        />
      )}
      <div className="ov-stops">
        {[von, nach].map((place, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setAktiv(i)
              setTab('google')
            }}
            aria-pressed={tab === 'google' && aktiv === i}
          >
            <span className={'ov-letter ' + (i ? 'ov-letter-b' : '')}>{i ? 'B' : 'A'}</span>
            <span>
              <small>{i ? 'Ziel' : 'Start'}</small>
              <b>{place.name}</b>
            </span>
          </button>
        ))}
      </div>
      <div className="ov-mapfoot">
        <span>{tab === 'karte' ? 'Gestrichelte Linie: Luftlinie.' : 'Google Maps · Ortsansicht'}</span>
        <a href={google.href} target="_blank" rel="noopener noreferrer">
          Route öffnen <ArrowUpRight size={13} />
        </a>
      </div>
    </aside>
  )
}
