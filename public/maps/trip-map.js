/* Maps JS runs only inside the removable /embed/trip-map browsing context.
 * No persistence, geocoding, Places, routes, Street View or parent DOM access.
 */
(function () {
  'use strict'
  const config = JSON.parse(document.getElementById('map-config').textContent)
  const status = document.getElementById('status')
  const send = (type, extra = {}) => parent.postMessage({ source: 'jetnity-trip-map', type, ...extra }, location.origin)
  if (parent === window) return
  const expired = () => config.expiresAt !== null && !(Number.isFinite(config.expiresAt) && config.expiresAt > Date.now())
  if (!config || config.origin !== location.origin || expired()) {
    send('blocked')
    return
  }
  let stopped = false
  let started = false
  let map = null
  let line = null
  let abschnittLinien = []
  let fokus = []
  let setzen = false
  let routeVersion = 0
  let stops = []
  let selected = null
  let markers = []
  let zoom = null
  const cluster = document.getElementById('cluster')
  const clusterStops = document.getElementById('cluster-stops')
  const close = document.getElementById('cluster-close')
  let returnIndex = null
  const fail = () => {
    if (stopped) return
    stopped = true
    status.hidden = false
    status.textContent = 'Google Maps konnte nicht geladen werden.'
    send('error')
  }
  const timer = setTimeout(fail, 25000)
  if (config.expiresAt !== null) setTimeout(() => { stopped = true; send('expired') }, Math.max(0, config.expiresAt - Date.now()))
  window.gm_authFailure = fail
  const validStops = (value) => Array.isArray(value) && value.length > 0 && value.length <= 1000
    && new Set(value.map((p) => p?.index)).size === value.length
    && value.every((p) => p && Number.isInteger(p.index) && p.index >= 0
      && typeof p.label === 'string' && p.label.length <= 500
      && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180)
  function fit() {
    if (!map || !stops.length) return
    const punkte = fokus.length ? stops.filter(p => fokus.includes(p.index)) : stops
    if (!punkte.length) return
    if (punkte.length === 1) { map.setCenter(punkte[0]); map.setZoom(10); return }
    const bounds = new window.google.maps.LatLngBounds()
    punkte.forEach((stop) => bounds.extend(stop))
    map.fitBounds(bounds, 48)
  }
  function planZeigen(data) {
    if (!Array.isArray(data.abschnitte) || data.abschnitte.length > 2000 || !Array.isArray(data.fokus)) return
    for (const linie of abschnittLinien) {
      window.google.maps.event.clearInstanceListeners(linie)
      linie.setMap(null)
    }
    abschnittLinien = []
    const punkte = new Map(stops.map(p => [p.index, p]))
    fokus = data.fokus.filter(i => punkte.has(i)).slice(0, 2)
    setzen = data.setzen === true
    for (const kante of data.abschnitte) {
      if (!kante || !punkte.has(kante.von) || !punkte.has(kante.nach)) continue
      const farbe = kante.aktiv ? '#174c39' : '#416f61'
      const linie = new window.google.maps.Polyline({
        map, path: [punkte.get(kante.von), punkte.get(kante.nach)], geodesic: true,
        strokeColor: farbe, strokeOpacity: kante.aktiv ? 0.65 : 0.18, strokeWeight: kante.aktiv ? 5 : 3,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: farbe, strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '12px' }],
        zIndex: kante.aktiv ? 2 : 1, clickable: !setzen,
      })
      linie.addListener('click', () => send('abschnitt', { von: kante.von, nach: kante.nach }))
      abschnittLinien.push(linie)
    }
    highlight()
    fit()
  }
  function highlight() {
    markers.forEach(({ marker, node, group }) => {
      const active = group.some((stop) => stop.index === selected || fokus.includes(stop.index))
      node.dataset.selected = String(active)
      marker.zIndex = active ? 1000 : group.length
    })
  }
  function choose(index) {
    selected = index
    highlight()
    send('select', { index })
  }
  function closeCluster() {
    cluster.hidden = true
    // Zooming replaces marker elements; return focus to the current element.
    markers.find(({ group }) => group.some((stop) => stop.index === returnIndex))?.marker.focus()
  }
  close.addEventListener('click', closeCluster)
  cluster.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCluster() })
  function showCluster(group) {
    returnIndex = group[0].index
    clusterStops.replaceChildren()
    group.forEach((stop) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = `${stop.symbol || stop.index + 1}. ${stop.label}`
      button.addEventListener('click', () => { choose(stop.index); closeCluster() })
      clusterStops.append(button)
    })
    cluster.hidden = false
    clusterStops.querySelector('button')?.focus()
  }
  // Small trip-sized radius grouping in projected pixels, including the date line.
  // Exact duplicate locations stay a selectable group even at maximum zoom.
  function groups() {
    const scale = 256 * 2 ** Math.min(20, Math.max(0, Math.floor(map.getZoom() ?? 2)))
    const project = (stop) => {
      const sin = Math.sin(Math.min(85.05112878, Math.max(-85.05112878, stop.lat)) * Math.PI / 180)
      return { x: (stop.lng + 180) / 360 * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale }
    }
    const result = []
    for (const stop of stops) {
      const point = project(stop)
      const group = result.find((entry) => {
        const dx = Math.abs(point.x - entry.point.x)
        return Math.hypot(Math.min(dx, scale - dx), point.y - entry.point.y) < 56
      })
      if (group) group.stops.push(stop)
      else result.push({ point, stops: [stop] })
    }
    return result.map((group) => group.stops)
  }
  function renderMarkers() {
    markers.forEach(({ marker }) => { window.google.maps.event.clearInstanceListeners(marker); marker.map = null })
    markers = groups().map((group) => {
      const node = document.createElement('span')
      node.className = group.length > 1 ? 'map-marker map-cluster' : 'map-marker'
      node.textContent = group.length > 1 ? String(group.length) : (group[0].symbol || String(group[0].index + 1))
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map, position: group[0], content: node, gmpClickable: true,
        title: group.length > 1 ? `${group.length} Reiseorte anzeigen` : `${group[0].symbol || group[0].index + 1}. ${group[0].label}`,
      })
      marker.addListener('click', () => {
        if (group.length === 1) choose(group[0].index)
        else {
          // Explicit list also resolves coincident locations without fabricating offsets.
          showCluster(group)
          map.panTo(group[0])
          if (map.getZoom() < 18) map.setZoom(Math.min(18, map.getZoom() + 2))
        }
      })
      return { marker, node, group }
    })
    highlight()
  }
  window.__jetnityTripMapsReady = () => {
    if (stopped || expired()) return
    try {
      map = new window.google.maps.Map(document.getElementById('map'), {
        mapId: config.mapId, center: stops[0] ?? { lat: 18, lng: 8 }, zoom: stops.length ? 10 : 2,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        clickableIcons: false, gestureHandling: 'cooperative', keyboardShortcuts: true,
        maxZoom: 20,
      })
      fit()
      map.addListener('zoom_changed', () => { if (stopped) return; const next = Math.floor(map.getZoom()); if (zoom !== next) { zoom = next; renderMarkers() } })
      map.addListener('click', event => {
        if (setzen && event.latLng) send('position', { position: event.latLng.toJSON() })
      })
      let sichtbar = true
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(([entry]) => {
        const jetzt = entry.contentRect.width > 0 && entry.contentRect.height > 0
        if (!sichtbar && jetzt) fit()
        sichtbar = jetzt
      }).observe(document.getElementById('map'))
      renderMarkers()
      window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        if (stopped) return
        clearTimeout(timer)
        status.hidden = true
        send('ready')
      })
    } catch { fail() }
  }
  window.addEventListener('message', async (event) => {
    if (stopped || event.source !== parent || event.origin !== config.origin || expired()) return
    const data = event.data
    if (!data || data.source !== 'jetnity-trip-map-parent') return
    if (data.type === 'init' && !started && (validStops(data.stops) || (data.setzen === true && Array.isArray(data.stops) && data.stops.length === 0))) {
      started = true
      stops = data.stops.map(({ index, label, lat, lng, symbol }) => ({ index, label, lat, lng, symbol: symbol === 'A' ? 'A' : undefined }))
      const script = document.createElement('script')
      const params = new URLSearchParams({ key: config.key, v: 'quarterly', libraries: 'marker', loading: 'async',
        callback: '__jetnityTripMapsReady', auth_referrer_policy: 'origin', language: 'de', region: 'CH' })
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`
      script.async = true
      script.onerror = fail
      document.head.append(script)
      send('loading', { expiresAt: config.expiresAt })
    } else if (data.type === 'reiseplan' && map) {
      planZeigen(data)
    } else if (data.type === 'clear-path' && map) {
      routeVersion++
      line?.setMap(null)
      line = null
    } else if (data.type === 'path' && map && typeof data.path === 'string' && data.path.length <= 250000) {
      const version = ++routeVersion
      let geometry
      try { geometry = await window.google.maps.importLibrary('geometry') } catch { send('route-error'); return }
      if (version !== routeVersion || stopped || expired()) return
      const path = geometry.encoding.decodePath(data.path)
      line?.setMap(null)
      line = new window.google.maps.Polyline({ map, path, zIndex: 4, strokeColor: '#205945', strokeOpacity: 0.95, strokeWeight: 5 })
      const bounds = new window.google.maps.LatLngBounds()
      path.forEach(point => bounds.extend(point))
      if (!bounds.isEmpty()) map.fitBounds(bounds, 48)
    } else if (data.type === 'stops' && map && (validStops(data.stops) || (Array.isArray(data.stops) && !data.stops.length))) {
      stops = data.stops.map(({ index, label, lat, lng, symbol }) => ({ index, label, lat, lng, symbol: symbol === 'A' ? 'A' : undefined }))
      cluster.hidden = true
      renderMarkers()
      fit()
    } else if (data.type === 'select' && (data.index === null || stops.some((stop) => stop.index === data.index))) {
      selected = data.index
      if (map) {
        highlight()
        const stop = stops.find((stop) => stop.index === selected)
        if (stop) {
          if (data.focus === true && map.getZoom() < 15) map.setZoom(15)
          map.panTo(stop)
        }
      }
    } else if (data.type === 'fit' && map) fit()
  })
  send('frame-ready', { expiresAt: config.expiresAt })
})()
