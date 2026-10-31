import { NextResponse } from 'next/server'

import {
  activitySucheBegrenztLesen,
  activitySucheContentLengthUeberschritten,
  activitySucheInhaltstypOk,
} from '@/lib/activities/anfrage'
import { activityRateKennungAus, activitySucheErlaubt } from '@/lib/activities/rate-limit'
import { viatorNoindexHeaders } from '@/lib/providers/viator/activities/contracts'

export const dynamic = 'force-dynamic'

export function viatorJson(status: number, body: unknown, retryAfterSec?: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...viatorNoindexHeaders(),
      'cache-control': 'no-store',
      ...(retryAfterSec ? { 'retry-after': String(retryAfterSec) } : {}),
    },
  })
}

export async function viatorJsonLesen(req: Request): Promise<{ ok: true; wert: unknown } | { ok: false; status: number; message: string }> {
  if (!activitySucheInhaltstypOk(req.headers.get('content-type'))) {
    return { ok: false, status: 415, message: 'Die Anfrage erwartet application/json.' }
  }
  if (activitySucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return { ok: false, status: 413, message: 'Die Anfrage ist zu gross.' }
  }
  const begrenzt = await activitySucheBegrenztLesen(req.body)
  if (!begrenzt.ok) return { ok: false, status: begrenzt.status, message: begrenzt.message }
  try {
    return { ok: true, wert: JSON.parse(begrenzt.text) as unknown }
  } catch {
    return { ok: false, status: 400, message: 'Die Anfrage ist kein JSON.' }
  }
}

export async function viatorRate(req: Request): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  return activitySucheErlaubt(activityRateKennungAus(req.headers))
}
