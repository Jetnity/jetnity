// lib/safety/anfrage.ts
//
// HTTP-Hülle der Safety-Naht. Body-Cap vor Allokation.

import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'
import { SAFETY_GRENZEN } from '@/lib/safety/domain'

export function safetyInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function safetyContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = SAFETY_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function safetyBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = SAFETY_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, 'Die Anfrage ist zu gross.')
}

export function safetyKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, 'Die Anfrage war kein gültiges JSON.')
}

export function safetyHttpHeader(): Record<string, string> {
  return providerOpsHttpHeader({ cacheControl: 'private, no-store' })
}
