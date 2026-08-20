// lib/activities/anfrage.ts
//
// HTTP-Hülle der Aktivitätensuche: Content-Type, Grösse, Header.
// Die Bytegrenze greift vor dem vollständigen Einlesen: zuerst Content-Length,
// danach ein harter Stream-Cap. Frei von Next.

import { ACTIVITY_SUCHE_GRENZEN } from '@/lib/activities/domain'

export function activitySucheInhaltstypOk(contentType: string | null): boolean {
  if (!contentType) return false
  const typ = contentType.split(';')[0]?.trim().toLowerCase()
  return typ === 'application/json'
}

export function activitySucheContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes,
): boolean {
  if (contentLength === null) return false
  const wert = contentLength.trim()
  if (!/^\d+$/.test(wert)) return false
  return Number(wert) > maxBytes
}

export async function activitySucheBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  if (!body) return { ok: true, text: '' }

  const leser = body.getReader()
  const teile: Uint8Array[] = []
  let gesamt = 0
  try {
    while (true) {
      const { done, value } = await leser.read()
      if (done) break
      if (!value || value.byteLength === 0) continue
      if (gesamt + value.byteLength > maxBytes) {
        await leser.cancel()
        return { ok: false, status: 413, message: 'Die Suchanfrage ist zu gross.' }
      }
      teile.push(value)
      gesamt += value.byteLength
    }
  } finally {
    leser.releaseLock()
  }

  const bytes = new Uint8Array(gesamt)
  let versatz = 0
  for (const teil of teile) {
    bytes.set(teil, versatz)
    versatz += teil.byteLength
  }
  return { ok: true, text: new TextDecoder('utf-8').decode(bytes) }
}

export function activitySucheKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  try {
    return { ok: true, wert: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, status: 400, message: 'Die Suchanfrage war kein gültiges JSON.' }
  }
}

export function activitySucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  const headers: Record<string, string> = { 'cache-control': 'no-store' }
  if (httpStatus === 429 && typeof retryAfterSec === 'number' && retryAfterSec > 0) {
    headers['retry-after'] = String(Math.ceil(retryAfterSec))
  }
  return headers
}
