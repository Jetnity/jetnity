/* Maps JS runs only inside the removable /embed/trip-map browsing context.
 * No persistence, geocoding, Places, routes, Street View or parent DOM access.
 */
(function () {
  'use strict'
  const config = JSON.parse(document.getElementById('map-config').textContent)
  const status = document.getElementById('status')
  const send = (type, extra = {}) => parent.postMessage({ source: 'jetnity-trip-map', type, ...extra }, location.origin)
  if (parent === window) return
  if (!config || config.origin !== location.origin || config.expiresAt <= Date.now()) {
    send('blocked')
    return
  }
  let stopped = false
  let started = false
  let map = null
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
  setTimeout(() => { stopped = true; send('expired') }, Math.max(0, config.expiresAt - Date.now()))
  window.gm_authFailure = fail
  const validStops = (value) => Array.isArray(value) && value.length > 0 && value.length <= 1000
    && new Set(value.map((p) => p?.index)).size === value.length
    && value.every((p) => p && Number.isInteger(p.index) && p.index >= 0
      && typeof p.label === 'string' && p.label.length <= 500
      && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180)
  function fit() {
    if (!map || !stops.length) return
    if (stops.length === 1) { map.setCenter(stops[0]); map.setZoom(10); return }
    const bounds = new window.google.maps.LatLngBounds()
    stops.forEach((stop) => bounds.extend(stop))
    map.fitBounds(bounds, 48)
  }
  function highlight() {
    markers.forEach(({ marker, node, group }) => {
      const active = group.some((stop) => stop.index === selected)
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
      button.textContent = `${stop.index + 1}. ${stop.label}`
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
      node.textContent = group.length > 1 ? String(group.length) : String(group[0].index + 1)
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map, position: group[0], content: node, gmpClickable: true,
        title: group.length > 1 ? `${group.length} Reiseorte anzeigen` : `${group[0].index + 1}. ${group[0].label}`,
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
    if (stopped || config.expiresAt <= Date.now()) return
    try {
      map = new window.google.maps.Map(document.getElementById('map'), {
        mapId: config.mapId, center: stops[0], zoom: 10,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        clickableIcons: false, gestureHandling: 'cooperative', keyboardShortcuts: true,
        maxZoom: 20,
      })
      fit()
      map.addListener('zoom_changed', () => { if (stopped) return; const next = Math.floor(map.getZoom()); if (zoom !== next) { zoom = next; renderMarkers() } })
      renderMarkers()
      window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        if (stopped) return
        clearTimeout(timer)
        status.hidden = true
        send('ready')
      })
    } catch { fail() }
  }
  window.addEventListener('message', (event) => {
    if (stopped || event.source !== parent || event.origin !== config.origin || config.expiresAt <= Date.now()) return
    const data = event.data
    if (!data || data.source !== 'jetnity-trip-map-parent') return
    if (data.type === 'init' && !started && validStops(data.stops)) {
      started = true
      stops = data.stops.map(({ index, label, lat, lng }) => ({ index, label, lat, lng }))
      const script = document.createElement('script')
      const params = new URLSearchParams({ key: config.key, v: 'quarterly', libraries: 'marker', loading: 'async',
        callback: '__jetnityTripMapsReady', auth_referrer_policy: 'origin', language: 'de', region: 'CH' })
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`
      script.async = true
      script.onerror = fail
      document.head.append(script)
      send('loading', { expiresAt: config.expiresAt })
    } else if (data.type === 'stops' && map && validStops(data.stops)) {
      stops = data.stops.map(({ index, label, lat, lng }) => ({ index, label, lat, lng }))
      cluster.hidden = true
      renderMarkers()
      fit()
    } else if (data.type === 'select' && (data.index === null || stops.some((stop) => stop.index === data.index))) {
      selected = data.index
      if (map) {
        highlight()
        const stop = stops.find((stop) => stop.index === selected)
        if (stop) map.panTo(stop)
      }
    } else if (data.type === 'fit' && map) fit()
  })
  send('frame-ready', { expiresAt: config.expiresAt })
})()
