'use client'

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Crosshair, MapPin, Route } from 'lucide-react'
import type { LatLngTuple, Map as LeafletMap } from 'leaflet'
import type { Trip } from '@/types/trips'
import { tripMapStops } from '@/lib/maps/trip-map'
import {
  ausschnittMitte,
  etappenVerbindung,
  laengengradBei,
  luftlinieText,
  type KartenPosition,
  type KartenVerbindung,
} from '@/lib/maps/etappen-kartenauswahl'
import { ortBestaetigen } from '@/lib/places/aktionen'

type Leaflet = typeof import('leaflet')
type Atlas = { L: Leaflet; map: LeafletMap }
type Anreise = { ort: string; position: KartenPosition | null; hinweis?: string }

function geografienAnzeigen({ L, map }: Atlas, signal: AbortSignal) {
  // Das lokale Relief liegt in Web Mercator. Eine angrenzende Weltkopie je Seite
  // hält nahe Etappen am 180. Längengrad im selben Kartenausschnitt.
  for (const offset of [-360, 0, 360]) {
    L.imageOverlay(
      '/images/reiseatlas/world.webp',
      [
        [-85.05112878, -180 + offset],
        [85.05112878, 180 + offset],
      ],
      { interactive: false },
    ).addTo(map)
    L.imageOverlay(
      '/images/reiseatlas/asia.webp',
      [
        [-1, 89 + offset],
        [26, 114 + offset],
      ],
      { interactive: false },
    ).addTo(map)
  }
  const namen = L.layerGroup().addTo(map)
  void fetch('/images/reiseatlas/laender.json', { signal })
    .then(async (r) => (r.ok ? r.json() : []))
    .then((labels: [string, number, number, number][]) => {
      if (signal.aborted || !Array.isArray(labels)) return
      function zeichnen() {
        namen.clearLayers()
        const west = map.getBounds().getWest()
        const ost = map.getBounds().getEast()
        for (const [name, lat, lng, minimum] of labels) {
          if (map.getZoom() < minimum || lat < map.getBounds().getSouth() || lat > map.getBounds().getNorth())
            continue
          for (let x = lng + 360 * Math.ceil((west - lng) / 360); x <= ost; x += 360) {
            const text = document.createElement('span')
            text.className = 'et-map-country'
            text.textContent = name
            L.marker([lat, x], {
              interactive: false,
              keyboard: false,
              zIndexOffset: -500,
              icon: L.divIcon({ className: 'et-map-name', html: text, iconSize: [0, 0] }),
            }).addTo(namen)
          }
        }
      }
      map.on('moveend zoomend', zeichnen)
      zeichnen()
    })
    .catch(() => {
      /* Das lokale Relief funktioniert auch ohne Länderbeschriftung. */
    })
}

export default function Etappenkarte({
  reise,
  auswahl,
  verbindung,
  onAuswahl,
  setzen,
  onPosition,
}: {
  reise: Trip
  auswahl: string | null
  verbindung?: KartenVerbindung | null
  onAuswahl: (id: string) => void
  setzen: boolean
  onPosition: (point: KartenPosition) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [fehler, setFehler] = useState('')
  const fitRef = useRef<() => void>(() => {})
  const letzterAusschnitt = useRef('')
  const fromId = verbindung?.vonId
  const toId = verbindung?.nachId
  const stops = useMemo(() => tripMapStops(reise), [reise])
  const strecke = useMemo(
    () =>
      etappenVerbindung(
        stops,
        fromId !== undefined && toId !== undefined ? { vonId: fromId, nachId: toId } : null,
      ),
    [stops, fromId, toId],
  )
  const etappe = stops.find((s) => s.stageId === auswahl)
  const kontext = JSON.stringify([reise.id, fromId, toId, auswahl])
  const [anreiseKontext, setAnreiseKontext] = useState<string | null>(null)
  const mitAnreise = anreiseKontext === kontext && !!reise.originPlaceId && !!reise.origin
  const [anreise, setAnreise] = useState<Anreise | null>(null)
  const start = mitAnreise && anreise?.ort === reise.originPlaceId ? anreise : null

  useEffect(() => {
    const ort = reise.originPlaceId
    if (!mitAnreise || !ort) return
    let live = true
    void ortBestaetigen(ort, 'abreise')
      .then((res) => {
        if (!live) return
        if (res.ok && res.wert.lat != null && res.wert.lon != null) {
          setAnreise({ ort, position: { lat: res.wert.lat, lng: res.wert.lon } })
        } else setAnreise({ ort, position: null, hinweis: 'Für den Abreiseort fehlt die Kartenposition.' })
      })
      .catch(() => {
        if (live) setAnreise({ ort, position: null, hinweis: 'Der Abreiseort konnte nicht geladen werden.' })
      })
    return () => {
      live = false
    }
  }, [mitAnreise, reise.originPlaceId])

  const waehlen = useEffectEvent((id: string, p: KartenPosition) => {
    if (setzen) onPosition(p)
    else if (id) onAuswahl(id)
  })
  const positionWaehlen = useEffectEvent((p: KartenPosition) => {
    if (setzen) onPosition(p)
  })

  useEffect(() => {
    const node = host.current
    if (!node) return
    const abort = new AbortController()
    let map: LeafletMap | undefined
    let observer: ResizeObserver | undefined
    void import('leaflet')
      .then((L) => {
        if (abort.signal.aborted) return
        map = L.map(node, {
          scrollWheelZoom: false,
          minZoom: 1,
          maxZoom: 10,
          zoomSnap: 0.25,
          zoomControl: false,
          maxBounds: [
            [-85.0511, -360],
            [85.0511, 360],
          ],
          maxBoundsViscosity: 0.9,
        }).setView([18, 8], 2)
        const current = map
        L.control.zoom({ position: 'bottomright' }).addTo(current)
        L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 80 }).addTo(current)
        current.attributionControl.setPrefix(false)
        current.attributionControl.addAttribution('Kartengrundlage © Natural Earth')
        geografienAnzeigen({ L, map: current }, abort.signal)
        current.on('click', (e) =>
          positionWaehlen({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.wrap().lng.toFixed(6)),
          }),
        )
        let warSichtbar = node.clientWidth > 0 && node.clientHeight > 0
        observer = new ResizeObserver(() => {
          const sichtbar = node.clientWidth > 0 && node.clientHeight > 0
          if (sichtbar) {
            current.invalidateSize({ pan: false, animate: false })
            if (!warSichtbar) fitRef.current()
          }
          warSichtbar = sichtbar
        })
        observer.observe(node)
        setAtlas({ L, map: current })
      })
      .catch(() => {
        if (!abort.signal.aborted) setFehler('Die Karte konnte nicht geladen werden.')
      })
    return () => {
      abort.abort()
      observer?.disconnect()
      map?.remove()
      letzterAusschnitt.current = ''
    }
  }, [])

  useEffect(() => {
    if (!atlas) return
    const { L, map } = atlas
    const layer = L.layerGroup().addTo(map)
    const stopsMitAnreise = start?.position
      ? [{ stageId: '', index: -1, position: start.position, name: reise.origin ?? 'Abreise' }, ...stops]
      : stops
    const alle = stopsMitAnreise.flatMap((s) => (s.position ? [s.position] : []))
    const endpunkte = [strecke?.von?.position, strecke?.nach?.position].flatMap((p) => (p ? [p] : []))
    const fokus = strecke ? endpunkte : etappe?.position ? [etappe.position] : alle
    const ziele = start?.position && fokus !== alle ? [...fokus, start.position] : fokus
    const rahmen = ziele.length ? ziele : alle
    const mitte = ausschnittMitte(rahmen)
    const koordinaten = (p: KartenPosition): LatLngTuple => [p.lat, laengengradBei(p.lng, mitte)]
    const linie = (a: KartenPosition, b: KartenPosition, aktiv: boolean) => {
      const von = koordinaten(a)
      const nach: LatLngTuple = [b.lat, laengengradBei(b.lng, von[1])]
      const linien = [[von, nach]]
      const sprung = koordinaten(b)[1] - nach[1]
      if (Math.abs(sprung) > 180) {
        linien.push([
          [von[0], von[1] + sprung],
          [nach[0], nach[1] + sprung],
        ])
      }
      const farbe = aktiv ? '#18593f' : strecke ? '#8b9e91' : '#386c60'
      for (const segment of linien) {
        if (aktiv)
          L.polyline(segment, { color: '#fff', opacity: 0.95, weight: 7, interactive: false }).addTo(layer)
        L.polyline(segment, {
          color: farbe,
          opacity: aktiv ? 1 : 0.83,
          weight: aktiv ? 4 : 2.5,
          dashArray: aktiv ? '9 5' : '5 6',
          className: aktiv ? 'et-map-selected-edge' : undefined,
          interactive: false,
        }).addTo(layer)
      }
    }

    let vorher: KartenPosition | null = null
    for (const s of stopsMitAnreise) {
      if (vorher && s.position) linie(vorher, s.position, false)
      vorher = s.position
    }
    if (strecke?.von?.position && strecke.nach?.position)
      linie(strecke.von.position, strecke.nach.position, true)
    for (const s of stopsMitAnreise) {
      const p = s.position
      if (!p) continue
      const endpunkt = strecke?.von?.stageId === s.stageId || strecke?.nach?.stageId === s.stageId
      const aktiv = strecke ? endpunkt : s.stageId === auswahl
      const marker = L.marker(koordinaten(p), {
        title: s.name,
        alt: s.name,
        keyboard: !!s.stageId,
        zIndexOffset: aktiv ? 200 : 0,
        icon: L.divIcon({
          className: 'et-pin' + (aktiv ? ' active' : '') + (endpunkt ? ' et-pin-endpoint' : ''),
          html: s.stageId ? String(s.index + 1) : 'A',
          iconSize: [31, 31],
          iconAnchor: [15, 15],
        }),
      }).addTo(layer)
      const text = document.createElement('span')
      text.textContent = s.name
      marker.bindTooltip(text, {
        permanent: aktiv || (!!s.stageId && !strecke && stops.length <= 5),
        direction: strecke?.von?.stageId === s.stageId ? 'top' : endpunkt ? 'bottom' : 'auto',
        offset: endpunkt ? [0, strecke?.von?.stageId === s.stageId ? -13 : 13] : [10, 0],
      })
      marker.on('click', () => waehlen(s.stageId, p))
    }
    const fit = () => {
      if (!host.current?.clientWidth || !host.current.clientHeight) return
      map.invalidateSize({ pan: false, animate: false })
      if (!rahmen.length) map.setView([18, 8], 2, { animate: false })
      else
        map.fitBounds(L.latLngBounds(rahmen.map(koordinaten)), {
          paddingTopLeft: [40, 70],
          paddingBottomRight: [40, 65],
          maxZoom: 6.5,
          animate: false,
        })
    }
    fitRef.current = fit
    const signatur = JSON.stringify([kontext, mitAnreise, rahmen])
    if (letzterAusschnitt.current !== signatur) {
      letzterAusschnitt.current = signatur
      fit()
    }
    return () => {
      layer.remove()
      fitRef.current = () => {}
    }
  }, [atlas, stops, start, strecke, etappe, reise.origin, auswahl, kontext, mitAnreise])

  let titel = etappe?.name || 'Deine Route'
  let detail = etappe && !etappe.position ? 'Für diese Etappe fehlt die Kartenposition.' : ''
  if (strecke) {
    titel = strecke.von && strecke.nach ? `${strecke.von.name} → ${strecke.nach.name}` : 'Verbindung'
    if (strecke.km != null) detail = luftlinieText(strecke.km) + ' · schematische Verbindung'
    else if (!strecke.von || !strecke.nach) detail = 'Die Endpunkte sind nicht eindeutig zugeordnet.'
    else
      detail =
        'Kartenposition fehlt: ' +
        [strecke.von, strecke.nach]
          .filter((s) => !s.position)
          .map((s) => s.name)
          .join(', ')
  } else if (!etappe && !stops.some((s) => s.position))
    detail = 'Für die Etappen fehlen die Kartenpositionen.'
  return (
    <aside className="et-map" aria-label="Interaktive Reisekarte">
      <div className="et-map-tools">
        <button type="button" aria-pressed={!mitAnreise} onClick={() => setAnreiseKontext(null)}>
          {strecke ? 'Verbindung' : 'Etappen'}
        </button>
        {reise.originPlaceId && reise.origin && (
          <button type="button" aria-pressed={mitAnreise} onClick={() => setAnreiseKontext(kontext)}>
            Mit Anreise
          </button>
        )}
        <button type="button" aria-label="Karte auf Auswahl zentrieren" onClick={() => fitRef.current()}>
          <Crosshair size={18} />
        </button>
      </div>
      <div ref={host} className={'et-canvas' + (setzen ? ' picking' : '')} />
      <div className="et-map-note et-map-selection" role="status">
        {strecke ? <Route size={17} aria-hidden /> : <MapPin size={17} aria-hidden />}
        <div>
          <strong>{fehler || (setzen ? 'Position auf der Karte wählen' : titel)}</strong>
          {!fehler && !setzen && detail && <span>{detail}</span>}
          {mitAnreise && !setzen && (
            <span>{start?.hinweis || (!start ? 'Abreiseort wird geladen …' : '')}</span>
          )}
        </div>
      </div>
    </aside>
  )
}
