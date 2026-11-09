'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { MapPinned } from 'lucide-react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'

export type Standort = { id: string; name: string; ort: string; lat: number; lng: number }

function kartenErlaubt() {
  if (window.PrivacyBee === undefined) return true
  const stand = readCmpApi(window.PrivacyBee)
  return stand.status === 'explicit' && stand.optionalSatisfied
}
function abonnieren(notify: () => void) {
  return attachCmpBridge(document, () => window.PrivacyBee, notify).stop
}

function Uebersicht({
  orte,
  aktiv,
  waehlen,
}: {
  orte: Standort[]
  aktiv: string
  waehlen: (id: string) => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const karte = useRef<LeafletMap | null>(null)
  const pins = useRef(new Map<string, Marker>())
  const [fehler, setFehler] = useState(false)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    let beendet = false
    const container = node.current
    const markierungen = pins.current
    if (!container || !orte.length) return
    const observer = new ResizeObserver(() => karte.current?.invalidateSize())
    observer.observe(container)
    void import('leaflet')
      .then((L) => {
        if (beendet) return
        const map = L.map(container, { scrollWheelZoom: false })
        karte.current = map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        map.fitBounds(L.latLngBounds(orte.map((o) => [o.lat, o.lng])), { padding: [34, 34], maxZoom: 16 })
        orte.forEach((o, i) => {
          const text = document.createElement('span')
          text.textContent = o.name
          const marker = L.marker([o.lat, o.lng], {
            alt: o.name,
            title: o.name,
            icon: L.divIcon({
              className: 'org-marker',
              html: '<b>' + (i + 1) + '</b>',
              iconSize: [31, 31],
              iconAnchor: [15, 28],
            }),
          }).addTo(map)
          marker.bindTooltip(text).on('click', () => waehlen(o.id))
          markierungen.set(o.id, marker)
          marker.getElement()?.setAttribute('data-id', o.id)
        })
        setGeneration((g) => g + 1)
      })
      .catch(() => {
        if (!beendet) setFehler(true)
      })
    return () => {
      beendet = true
      observer.disconnect()
      karte.current?.remove()
      karte.current = null
      markierungen.clear()
    }
  }, [orte, waehlen])
  useEffect(() => {
    const pin = pins.current.get(aktiv)
    if (!pin) return
    pin.setZIndexOffset(500).openTooltip()
    pin.getElement()?.classList.add('org-marker-selected')
    karte.current?.panInside(pin.getLatLng(), { padding: [25, 25] })
    return () => {
      pin.closeTooltip()
      pin.setZIndexOffset(0)
      pin.getElement()?.classList.remove('org-marker-selected')
    }
  }, [aktiv, generation])
  return (
    <div className="org-mapcanvas" ref={node} aria-label="Standorte aller Suchergebnisse">
      {fehler && <p>Die Kartenübersicht konnte nicht geladen werden.</p>}
    </div>
  )
}

export default function Hotelkarte({
  orte,
  aktiv,
  waehlen,
}: {
  orte: Standort[]
  aktiv: string
  waehlen: (id: string) => void
}) {
  const [ansicht, setAnsicht] = useState<'karte' | 'google'>('karte')
  const erlaubt = useSyncExternalStore(abonnieren, kartenErlaubt, () => false)
  const ausgewaehlt = orte.find((o) => o.id === aktiv) ?? orte[0]
  if (!ausgewaehlt) return null
  // The embedded place query contains only a public hotel name and its public location.
  const query = new URLSearchParams({
    q: ausgewaehlt.name + ' ' + ausgewaehlt.ort,
    ll: ausgewaehlt.lat + ',' + ausgewaehlt.lng,
    z: '16',
    hl: 'de',
    output: 'embed',
  })
  return (
    <aside className="org-mapbox" aria-label="Hotelstandorte">
      <div className="org-maphead">
        <strong>
          <MapPinned size={17} /> Hotelstandorte
        </strong>
        <div>
          <button type="button" aria-pressed={ansicht === 'karte'} onClick={() => setAnsicht('karte')}>
            Übersicht
          </button>
          <button type="button" aria-pressed={ansicht === 'google'} onClick={() => setAnsicht('google')}>
            Google Maps
          </button>
        </div>
      </div>
      {!erlaubt ? (
        <p>Externe Karten sind in deinen Datenschutzeinstellungen deaktiviert.</p>
      ) : ansicht === 'google' ? (
        <iframe
          key={ausgewaehlt.id}
          title={'Google Maps · ' + ausgewaehlt.name}
          className="org-mapcanvas"
          referrerPolicy="strict-origin-when-cross-origin"
          src={'https://maps.google.com/maps?' + query}
        />
      ) : (
        <Uebersicht orte={orte} aktiv={ausgewaehlt.id} waehlen={waehlen} />
      )}
      <div className="org-mapfoot">
        <b>{ausgewaehlt.name}</b>
        <p>{ausgewaehlt.ort}</p>
        {ansicht === 'google' && <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ausgewaehlt.name + ', ' + ausgewaehlt.ort)} target="_blank" rel="noopener noreferrer">In Google Maps öffnen</a>}
      </div>
    </aside>
  )
}
