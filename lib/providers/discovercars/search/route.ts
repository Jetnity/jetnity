import 'server-only'
import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { providerOpsInMemoryCostGuard } from '@/lib/provider-ops'
import { rentalCarRateKennungAus } from '@/lib/rental-cars/rate-limit'
import { rentalCarSucheBegrenztLesen, rentalCarSucheContentLengthUeberschritten, rentalCarSucheHttpHeader, rentalCarSucheInhaltstypOk } from '@/lib/rental-cars/anfrage'
import { requestInput, type RentalResponse } from './contract'
import { createRentalSearch, rentalAccess, RentalSearchError } from './server'

// Per-instance burst/abuse limits; the provider enforces its separate account-wide quota.
const guards = {
  locations: providerOpsInMemoryCostGuard({ fensterMs: 60_000, anfragenJeFenster: 30, tagMs: 86_400_000, anfragenJeTag: 600 }),
  search: providerOpsInMemoryCostGuard({ fensterMs: 600_000, anfragenJeFenster: 10, tagMs: 86_400_000, anfragenJeTag: 40 }),
  detail: providerOpsInMemoryCostGuard({ fensterMs: 600_000, anfragenJeFenster: 30, tagMs: 86_400_000, anfragenJeTag: 120 }),
}
const identifiers = new Set<string>()
let resetAt = Date.now() + 86_400_000

function json(status: number, body: RentalResponse) {
  return NextResponse.json(body, { status, headers: { ...rentalCarSucheHttpHeader(status, status === 429 ? 60 : undefined), 'X-Robots-Tag': 'noindex, nofollow' } })
}
export async function discoverCarsRequest(req: Request) {
  try {
    const key = rentalAccess()
    if (!key) return json(503, { status: 'unavailable', message: 'Die direkte Mietwagensuche ist gerade nicht verfügbar.' })
    const origin = req.headers.get('origin')
    if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(req.url).origin)) {
      return json(403, { status: 'error', message: 'Bitte öffne die Mietwagensuche auf Jetnity.' })
    }
    if (!rentalCarSucheInhaltstypOk(req.headers.get('content-type'))) return json(415, { status: 'error', message: 'Ungültiges Anfrageformat.' })
    if (rentalCarSucheContentLengthUeberschritten(req.headers.get('content-length'))) return json(413, { status: 'error', message: 'Die Anfrage ist zu gross.' })
    const body = await rentalCarSucheBegrenztLesen(req.body)
    if (!body.ok) return json(413, { status: 'error', message: body.message })
    let raw: unknown
    try { raw = JSON.parse(body.text) } catch { return json(400, { status: 'error', message: 'Die Anfrage konnte nicht gelesen werden.' }) }
    const parsed = requestInput.safeParse(raw)
    if (!parsed.success) return json(400, { status: 'error', message: 'Bitte prüfe Stationen, Mietdaten, Alter und Wohnsitzland.' })
    const input = parsed.data
    if (input.action === 'search' && input.search.pickupDate < new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
      return json(400, { status: 'error', message: 'Bitte wähle ein zukünftiges Abholdatum.' })
    }
    if (Date.now() >= resetAt) { Object.values(guards).forEach(g => g.leeren()); identifiers.clear(); resetAt = Date.now() + 86_400_000 }
    const identifier = createHmac('sha256', key).update(`rental-rate:${rentalCarRateKennungAus(req.headers)}`).digest('hex')
    if (!identifiers.has(identifier) && identifiers.size >= 10000) return json(429, { status: 'rate_limited', message: 'Die Suche ist gerade ausgelastet. Bitte versuche es später erneut.' })
    identifiers.add(identifier)
    const allowed = await guards[input.action].erlaubt(identifier)
    if (!allowed.ok) return NextResponse.json({ status: 'rate_limited', message: 'Bitte warte einen Moment, bevor du erneut suchst.' }, { status: 429, headers: { ...rentalCarSucheHttpHeader(429, allowed.retryAfterSec), 'X-Robots-Tag': 'noindex, nofollow' } })
    const api = createRentalSearch(key)
    if (input.action === 'locations') return json(200, { status: 'ok', kind: 'locations', locations: await api.locations(input.term, req.signal) })
    if (input.action === 'search') return json(200, { status: 'ok', kind: 'search', result: await api.search(input.search, req.signal) })
    return json(200, { status: 'ok', kind: 'detail', ...await api.detail(input.token, req.signal) })
  } catch (e) {
    if (e instanceof RentalSearchError) return json(e.status, { status: e.kind, message: e.message })
    return json(503, { status: 'error', message: 'Die Mietwagensuche konnte gerade nicht ausgeführt werden. Bitte versuche es erneut.' })
  }
}
