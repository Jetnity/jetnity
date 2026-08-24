// lib/readiness/anfrage.ts
//
// HTTP-Hülle der geschlossenen Requirement-Naht. Body-Cap vor Allokation.

import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'
import { READINESS_GRENZEN } from '@/lib/readiness/domain'

export function readinessInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function readinessContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = READINESS_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function readinessBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = READINESS_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, 'Die Anfrage ist zu gross.')
}

export function readinessKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, 'Die Anfrage war kein gültiges JSON.')
}

export function readinessHttpHeader(): Record<string, string> {
  return providerOpsHttpHeader({ cacheControl: 'private, no-store' })
}
