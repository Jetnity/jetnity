'use client'

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Crosshair, MapPin } from 'lucide-react'
import type { LatLngTuple } from 'leaflet'
import type { Trip } from '@/types/trips'
import { tripMapStops } from '@/lib/maps/trip-map'
import { ortBestaetigen } from '@/lib/places/aktionen'

type Position = { lat: number; lng: number }
type Marker = { id: string; label: string; point: Position | null; number: number }

export default function Etappenkarte({
  reise,
  auswahl,
  onAuswahl,
  setzen,
  onPosition,
}: {
  reise: Trip
  auswahl: string | null
  onAuswahl: (id: string) => void
  setzen: boolean
  onPosition: (point: Position) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const fitRef = useRef<() => void>(() => {})
  const [error, setError] = useState('')
  const [mitAnreise, setMitAnreise] = useState(false)
  const [start, setStart] = useState<Position | null>(null)
  const [startHinweis, setStartHinweis] = useState('')
  const stops = useMemo(() => tripMapStops(reise), [reise])
  const markers = useMemo<Marker[]>(() => {
    const list = stops.map((s) => ({ id: s.stageId, label: s.name, point: s.position, number: s.index + 1 }))
    return mitAnreise && start && reise.origin
      ? [{ id: '', label: reise.origin, point: start, number: 0 }, ...list]
      : list
  }, [stops, mitAnreise, start, reise.origin])

  useEffect(() => {
    if (!mitAnreise || !reise.originPlaceId) return
    let live = true
    void ortBestaetigen(reise.originPlaceId, 'abreise')
      .then((result) => {
        if (!live) return
        if (result.ok && result.wert.lat != null && result.wert.lon != null) {
          setStart({ lat: result.wert.lat, lng: result.wert.lon })
          setStartHinweis('')
        } else setStartHinweis('Für den Abreiseort ist keine Kartenposition verfügbar.')
      })
      .catch(() => {
        if (live) setStartHinweis('Der Abreiseort kann gerade nicht geladen werden.')
      })
    return () => {
      live = false
    }
  }, [mitAnreise, reise.originPlaceId])

  const click = useEffectEvent((id: string) => {
    if (!setzen && id) onAuswahl(id)
  })
  const pick = useEffectEvent((p: Position) => {
    if (setzen) onPosition(p)
  })
  useEffect(() => {
    if (!host.current) return
    const node = host.current
    let closed = false
    const abort = new AbortController()
    let dispose: undefined | (() => void)
    void import('leaflet')
      .then((L) => {
        if (closed) return
        const map = L.map(node, {
          scrollWheelZoom: false,
          minZoom: 1,
          maxZoom: 10,
          zoomSnap: 0.25,
          zoomControl: false,
        })
        L.control.zoom({ position: 'bottomright' }).addTo(map)
        map.attributionControl.setPrefix(false)
        map.attributionControl.addAttribution('Kartengrundlage © Natural Earth · Luftlinien')
        L.imageOverlay(
          '/images/reiseatlas/world.webp',
          [
            [-85.05112878, -180],
            [85.05112878, 180],
          ],
          { interactive: false },
        ).addTo(map)
        L.imageOverlay(
          '/images/reiseatlas/asia.webp',
          [
            [-1, 89],
            [26, 114],
          ],
          { interactive: false },
        ).addTo(map)
        const names = L.layerGroup().addTo(map)
        let countries: [string, number, number, number][] = []
        function drawNames() {
          names.clearLayers()
          const zoom = map.getZoom()
          const bounds = map.getBounds()
          for (const [name, lat, lng, minimum] of countries) {
            if (zoom < minimum || !bounds.contains([lat, lng])) continue
            const label = document.createElement('span')
            label.className = 'et-map-country'
            label.textContent = name
            L.marker([lat, lng], {
              interactive: false,
              keyboard: false,
              zIndexOffset: -500,
              icon: L.divIcon({ className: 'et-map-name', html: label, iconSize: [0, 0] }),
            }).addTo(names)
          }
        }
        map.on('moveend zoomend', drawNames)
        void fetch('/images/reiseatlas/laender.json', { signal: abort.signal })
          .then((r) => (r.ok ? r.json() : []))
          .then((labels) => {
            if (!closed && Array.isArray(labels)) {
              countries = labels
              drawNames()
            }
          })
          .catch(() => {})
        L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 80 }).addTo(map)
        const points: LatLngTuple[] = []
        let previous: LatLngTuple | null = null
        let focus: LatLngTuple | null = null
        for (const m of markers) {
          if (!m.point) {
            previous = null
            continue
          }
          const lng = m.point.lng
          const coords: LatLngTuple = [m.point.lat, lng]
          if (previous && Math.abs(lng - previous[1]) <= 180)
            L.polyline([previous, coords], {
              color: '#386c60',
              weight: 3,
              dashArray: '7 7',
              interactive: false,
            }).addTo(map)
          // Keep the marker over the local basemap even when an itinerary crosses the date line.
          const pin: LatLngTuple = [m.point.lat, m.point.lng]
          previous = coords
          points.push(pin)
          if (m.id === auswahl) focus = pin
          const marker = L.marker(pin, {
            title: m.label,
            alt: m.label,
            keyboard: !!m.id,
            icon: L.divIcon({
              className: 'et-pin' + (m.id === auswahl ? ' active' : ''),
              html: m.number ? String(m.number) : 'A',
              iconSize: [31, 31],
              iconAnchor: [15, 15],
            }),
          }).addTo(map)
          const label = document.createElement('span')
          label.textContent = m.label
          marker.bindTooltip(label, {
            permanent: !!m.id && (markers.length <= 5 || m.id === auswahl),
            direction: 'right',
            offset: [13, 0],
          })
          if (m.id) marker.on('click', () => click(m.id))
        }
        map.on('click', (e) =>
          pick({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.wrap().lng.toFixed(6)) }),
        )
        const fit = () => {
          map.invalidateSize()
          if (focus && !mitAnreise) map.setView(focus, 6.5)
          else if (points.length)
            map.fitBounds(L.latLngBounds(points), { padding: [48, 45], maxZoom: 6.5, animate: false })
          else map.setView([18, 8], 2)
        }
        fitRef.current = fit
        fit()
        const observer = new ResizeObserver(() => {
          if (node.clientWidth > 0 && node.clientHeight > 0) fit()
        })
        observer.observe(node)
        dispose = () => {
          observer.disconnect()
          map.remove()
        }
      })
      .catch(() => {
        if (!closed) setError('Die Karte konnte nicht geladen werden.')
      })
    return () => {
      closed = true
      abort.abort()
      dispose?.()
    }
  }, [markers, auswahl, mitAnreise])
  return (
    <aside className="et-map" aria-label="Interaktive Reisekarte">
      <div className="et-map-tools">
        <button type="button" aria-pressed={!mitAnreise} onClick={() => setMitAnreise(false)}>
          Etappen
        </button>
        {reise.originPlaceId && reise.origin && (
          <button type="button" aria-pressed={mitAnreise} onClick={() => setMitAnreise(true)}>
            Mit Anreise
          </button>
        )}
        <button type="button" aria-label="Karte auf Auswahl zentrieren" onClick={() => fitRef.current()}>
          <Crosshair size={18} />
        </button>
      </div>
      <div ref={host} className={'et-canvas' + (setzen ? ' picking' : '')} />
      <div className="et-map-note" role="status">
        <MapPin size={15} />
        {error ||
          (setzen
            ? 'Position auf der Karte wählen'
            : mitAnreise && startHinweis
              ? startHinweis
              : !stops.some((s) => s.position)
                ? 'Für die Etappen sind noch keine Positionen gespeichert.'
                : auswahl
                  ? stops.find((s) => s.stageId === auswahl)?.name
                  : 'Deine Route')}
      </div>
    </aside>
  )
}
