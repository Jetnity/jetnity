// lib/flights/anfrage.ts
//
// HTTP-Hülle der Flugsuche. Dieselbe Härtung wie Hotels/Activities.

import { FLUG_SUCHE_GRENZEN } from '@/lib/flights/domain'
import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'

const ZU_GROSS = 'Die Suchanfrage ist zu gross.'
const KEIN_JSON = 'Die Suchanfrage war kein gültiges JSON.'

export function flugSucheInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function flugSucheContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = FLUG_SUCHE_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function flugSucheBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = FLUG_SUCHE_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, ZU_GROSS)
}

export function flugSucheKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, KEIN_JSON)
}

export function flugSucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  return providerOpsHttpHeader({
    httpStatus,
    retryAfterSec,
    cacheControl: 'no-store',
  })
}
