import { mapPilotConfig, type MapEnvironment } from '@/lib/maps/config'

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'strict-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Content-Security-Policy': [
    "default-src 'none'", "base-uri 'none'", "object-src 'none'", "form-action 'none'",
    "frame-ancestors 'self'", "frame-src 'none'",
    "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
    "script-src 'self' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    'img-src data: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com',
    'connect-src https://*.googleapis.com https://*.gstatic.com https://*.google.com',
  ].join('; '),
}

export function tripMapFrameResponse(request: Request, env: MapEnvironment): Response {
  const url = new URL(request.url)
  const framed = request.headers.get('sec-fetch-dest') === 'iframe'
    && request.headers.get('sec-fetch-site') === 'same-origin'
    && request.headers.get('sec-fetch-mode') === 'navigate'
  const config = framed && url.search === '' ? mapPilotConfig(env, url.origin) : null
  // A blocked frame carries no key and no external resource references.
  const json = JSON.stringify(config).replaceAll('<', '\\u003c')
  return new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Reiseorte auf Google Maps</title>
<link rel="stylesheet" href="/maps/trip-map.css"></head><body>
<div id="map" aria-label="Reiseorte auf Google Maps"></div>
<p id="status" role="status">${config ? 'Karte wird vorbereitet.' : 'Die Karte ist noch nicht freigeschaltet.'}</p>
<div id="cluster" hidden><p>Stopps an diesem Ort</p><div id="cluster-stops"></div><button id="cluster-close" type="button">Schliessen</button></div>
<script id="map-config" type="application/json">${json}</script>
<script src="/maps/trip-map.js" defer></script></body></html>`, { headers })
}
