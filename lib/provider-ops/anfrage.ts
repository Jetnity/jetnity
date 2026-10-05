// lib/provider-ops/anfrage.ts
//
// Gemeinsame JSON-Request-Härtung. Domain setzt nur Grenzen und Meldungen.
// Keine Request-Rohdaten in Fehlern. Frei von Next.

export function providerOpsInhaltstypOk(contentType: string | null): boolean {
  if (!contentType) return false
  const typ = contentType.split(';')[0]?.trim().toLowerCase()
  return typ === 'application/json'
}

export function providerOpsContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes: number,
): boolean {
  if (contentLength === null) return false
  const wert = contentLength.trim()
  if (!/^\d+$/.test(wert)) return false
  return Number(wert) > maxBytes
}

export async function providerOpsBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  zuGrossMeldung: string,
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
        return { ok: false, status: 413, message: zuGrossMeldung }
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

export function providerOpsKoerperLesen(
  text: string,
  jsonMeldung: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  try {
    return { ok: true, wert: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, status: 400, message: jsonMeldung }
  }
}

export function providerOpsHttpHeader(opts: {
  httpStatus?: number
  retryAfterSec?: number
  cacheControl?: string
}): Record<string, string> {
  const headers: Record<string, string> = {
    'cache-control': opts.cacheControl ?? 'private, no-store',
  }
  if (
    opts.httpStatus === 429 &&
    typeof opts.retryAfterSec === 'number' &&
    opts.retryAfterSec > 0
  ) {
    headers['retry-after'] = String(Math.ceil(opts.retryAfterSec))
  }
  return headers
}

export function providerOpsRateKennungAus(
  headers: Headers,
  praefix: 'ip' | 'plain' = 'ip',
): string {
  const weitergeleitet = headers.get('x-forwarded-for')
  const erste = weitergeleitet?.split(',')[0]?.trim()
  if (erste) return praefix === 'ip' ? `ip:${erste}` : erste
  const real = headers.get('x-real-ip')?.trim()
  if (real) return praefix === 'ip' ? `ip:${real}` : real
  return praefix === 'ip' ? 'ip:unbekannt' : 'unbekannt'
}
