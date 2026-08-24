// lib/activities/anfrage.ts
//
// HTTP-Hülle der Aktivitätensuche. Nutzt den gemeinsamen Provider-Ops-Vertrag.

import { ACTIVITY_SUCHE_GRENZEN } from '@/lib/activities/domain'
import {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
} from '@/lib/provider-ops'

const ZU_GROSS = 'Die Suchanfrage ist zu gross.'
const KEIN_JSON = 'Die Suchanfrage war kein gültiges JSON.'

export function activitySucheInhaltstypOk(contentType: string | null): boolean {
  return providerOpsInhaltstypOk(contentType)
}

export function activitySucheContentLengthUeberschritten(
  contentLength: string | null,
  maxBytes = ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes,
): boolean {
  return providerOpsContentLengthUeberschritten(contentLength, maxBytes)
}

export async function activitySucheBegrenztLesen(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = ACTIVITY_SUCHE_GRENZEN.maxAnfrageBytes,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; message: string }> {
  return providerOpsBegrenztLesen(body, maxBytes, ZU_GROSS)
}

export function activitySucheKoerperLesen(
  text: string,
): { ok: true; wert: unknown } | { ok: false; status: 400; message: string } {
  return providerOpsKoerperLesen(text, KEIN_JSON)
}

export function activitySucheHttpHeader(
  httpStatus: number,
  retryAfterSec?: number,
): Record<string, string> {
  return providerOpsHttpHeader({
    httpStatus,
    retryAfterSec,
    cacheControl: 'no-store',
  })
}
