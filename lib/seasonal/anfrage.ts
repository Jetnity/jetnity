// lib/seasonal/anfrage.ts
//
// HTTP-Hülle der Seasonal-Naht. Body-Cap vor Allokation.

import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'
import { SEASONAL_GRENZEN } from '@/lib/seasonal/domain'

export function seasonalInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function seasonalContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = SEASONAL_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function seasonalBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = SEASONAL_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, 'Die Anfrage ist zu gross.')
}

export function seasonalKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, 'Die Anfrage war kein gültiges JSON.')
}

export function seasonalHttpHeader(): Record<string, string> {
  return providerOpsHttpHeader({ cacheControl: 'private, no-store' })
}
