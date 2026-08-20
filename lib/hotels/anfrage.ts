// lib/hotels/anfrage.ts
//
// HTTP-Hülle der Hotelsuche: Content-Type, Grösse, Header.
// Frei von Next.

import { HOTEL_SUCHE_GRENZEN } from '@/lib/hotels/domain'

export function hotelSucheInhaltstypOk(contentType: string | null): boolean {
  if (!contentType) return false
  const typ = contentType.split(';')[0]?.trim().toLowerCase()
  return typ === 'application/json'
}

export function hotelSucheKoerperLesen(
  text: string,
  maxBytes = HOTEL_SUCHE_GRENZEN.maxAnfrageBytes,
): { ok: true; wert: unknown } | { ok: false; status: 400 | 413; message: string } {
  const bytes = new TextEncoder().encode(text).length
  if (bytes > maxBytes) {
    return { ok: false, status: 413, message: 'Die Suchanfrage ist zu gross.' }
  }
  try {
    return { ok: true, wert: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, status: 400, message: 'Die Suchanfrage war kein gültiges JSON.' }
  }
}

export function hotelSucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  const headers: Record<string, string> = { 'cache-control': 'no-store' }
  if (httpStatus === 429 && typeof retryAfterSec === 'number' && retryAfterSec > 0) {
    headers['retry-after'] = String(Math.ceil(retryAfterSec))
  }
  return headers
}
