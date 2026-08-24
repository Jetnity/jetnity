// lib/rental-cars/anfrage.ts
//
// HTTP-Hülle der Mietwagensuche. Nutzt den gemeinsamen Provider-Ops-Vertrag.

import { RENTAL_SUCHE_GRENZEN } from '@/lib/rental-cars/domain'
import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'

const ZU_GROSS = 'Die Suchanfrage ist zu gross.'
const KEIN_JSON = 'Die Suchanfrage war kein gültiges JSON.'

export function rentalCarSucheInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function rentalCarSucheContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = RENTAL_SUCHE_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function rentalCarSucheBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number = RENTAL_SUCHE_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, ZU_GROSS)
}

export function rentalCarSucheKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, KEIN_JSON)
}

export function rentalCarSucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  return providerOpsHttpHeader({
    httpStatus,
    retryAfterSec,
    cacheControl: 'no-store',
  })
}
