// lib/readiness/anfrage.ts
//
// HTTP-Hülle der geschlossenen Requirement-Naht. Body-Cap vor Allokation.

import { READINESS_GRENZEN } from '@/lib/readiness/domain'

export function readinessInhaltstypOk(contentType: string | null): boolean {
  if (!contentType) return false
  const typ = contentType.split(';')[0]?.trim().toLowerCase()
  return typ === 'application/json'
}

export function readinessContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = READINESS_GRENZEN.maxAnfrageBytes,
): boolean {
  if (contentLength === null) return false
  const wert = contentLength.trim()
  if (!/^\d+$/.test(wert)) return false
  return Number(wert) > maxBytes
}

export async function readinessBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = READINESS_GRENZEN.maxAnfrageBytes,
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
        return { ok: false, status: 413, message: 'Die Anfrage ist zu gross.' }
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

export function readinessKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  try {
    return { ok: true, wert: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, status: 400, message: 'Die Anfrage war kein gültiges JSON.' }
  }
}

export function readinessHttpHeader(): Record<string, string> {
  return {
    'cache-control': 'private, no-store',
  }
}
