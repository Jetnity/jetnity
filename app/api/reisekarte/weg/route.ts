import { mapPilotConfig } from '@/lib/maps/config'
import { istPosition, type Position } from '@/lib/maps/reisekarte'

const antwort = (status: number, body: object = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
const waypoint = (p: Position) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } })
type Agency = { name?: string; uri?: string }
type GoogleRoute = { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string }; warnings?: string[]
  legs?: { steps?: { transitDetails?: { transitLine?: { agencies?: Agency[] } } }[] }[] }

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const key = process.env.GOOGLE_MAPS_ROUTES_SERVER_KEY
  if (!key || !mapPilotConfig(process.env, origin)) return antwort(404)
  if (req.headers.get('origin') !== origin || req.headers.get('sec-fetch-site') !== 'same-origin') return antwort(403)
  if (!req.headers.get('content-type')?.startsWith('application/json')) return antwort(415)
  const body = await req.json().catch(() => null)
  if (!body || !istPosition(body.von) || !istPosition(body.nach) || !['WALK', 'TRANSIT'].includes(body.mode)) return antwort(400)
  const fields = ['routes.distanceMeters', 'routes.duration', 'routes.polyline.encodedPolyline', 'routes.warnings']
  if (body.mode === 'TRANSIT') fields.push('routes.legs.steps.transitDetails.transitLine.agencies')
  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(9000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields.join(',') },
      body: JSON.stringify({ origin: waypoint(body.von), destination: waypoint(body.nach), travelMode: body.mode, languageCode: 'de', units: 'METRIC' }),
    })
    if (!res.ok) return antwort(res.status === 429 ? 429 : 502)
    const route: GoogleRoute | undefined = (await res.json()).routes?.[0]
    const path = route?.polyline?.encodedPolyline
    if (!path || path.length > 250000 || !Number.isFinite(route?.distanceMeters) || !/^\d+(\.\d+)?s$/.test(route?.duration ?? '')) return antwort(404)
    const agencies = new Map<string,{ name: string; url: string }>()
    for (const leg of route?.legs ?? []) for (const step of leg.steps ?? []) for (const a of step.transitDetails?.transitLine?.agencies ?? []) {
      if (a.name && a.uri && /^https?:\/\//i.test(a.uri)) agencies.set(a.uri, { name: a.name, url: a.uri })
    }
    return antwort(200, { path, meters: route?.distanceMeters, seconds: Number.parseFloat(route!.duration!), agencies: [...agencies.values()],
      warnings: (route?.warnings ?? []).filter(w => typeof w === 'string') })
  } catch { return antwort(503) }
}
