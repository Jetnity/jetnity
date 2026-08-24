// lib/mobility/anfrage.ts
//
// HTTP-Hülle der Mobilitätssuche. Nutzt den gemeinsamen Provider-Ops-Vertrag.

import { MOBILITY_SUCHE_GRENZEN } from '@/lib/mobility/domain'
import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'

const ZU_GROSS = 'Die Suchanfrage ist zu gross.'
const KEIN_JSON = 'Die Suchanfrage war kein gültiges JSON.'

export function mobilitySucheInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function mobilitySucheContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = MOBILITY_SUCHE_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function mobilitySucheBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = MOBILITY_SUCHE_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, ZU_GROSS)
}

export function mobilitySucheKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, KEIN_JSON)
}

export function mobilitySucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  return providerOpsHttpHeader({
    httpStatus,
    retryAfterSec,
    cacheControl: 'no-store',
  })
}
