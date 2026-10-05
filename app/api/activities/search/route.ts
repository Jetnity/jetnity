// app/api/activities/search/route.ts
//
// Geschlossene Aktivitätensuche. Kein offener Provider-Proxy: nur die Jetnity-Anfrage,
// nur die normalisierte Antwort. Phase 3.3 hat noch keinen Activity-Adapter.

import { NextResponse } from 'next/server'

import {
  activitySucheBegrenztLesen,
  activitySucheContentLengthUeberschritten,
  activitySucheHttpHeader,
  activitySucheInhaltstypOk,
  activitySucheKoerperLesen,
} from '@/lib/activities/anfrage'
import { sucheFuerClient, type ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { LEERE_ACTIVITY_EVIDENZ } from '@/lib/activities/domain'
import { activityProviderAus } from '@/lib/activities/factory'
import { activityRateKennungAus } from '@/lib/activities/rate-limit'
import { activitiesSuchen, activitySuchePortsAusUmgebung } from '@/lib/activities/suche'
import { activityUmgebungAusProzess } from '@/lib/activities/zustand'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function antwort(
  httpStatus: number,
  koerper: ActivitySucheAntwort,
  retryAfterSec?: number,
) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: activitySucheHttpHeader(httpStatus, retryAfterSec),
  })
}

function leer(status: ActivitySucheAntwort['status'], message: string): ActivitySucheAntwort {
  return sucheFuerClient({
    status,
    message,
    evidenz: LEERE_ACTIVITY_EVIDENZ,
    options: [],
  })
}

export async function POST(req: Request) {
  if (!activitySucheInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, leer('error', 'Die Aktivitätensuche erwartet application/json.'))
  }

  if (activitySucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, leer('error', 'Die Suchanfrage ist zu gross.'))
  }

  const begrenzt = await activitySucheBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, leer('error', begrenzt.message))
  }

  const gelesen = activitySucheKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, leer('error', gelesen.message))
  }

  const { httpStatus, koerper, retryAfterSec } = await activitiesSuchen(
    gelesen.wert,
    activitySuchePortsAusUmgebung(
      activityUmgebungAusProzess(),
      activityProviderAus(),
      activityRateKennungAus(req.headers),
    ),
  )

  return antwort(httpStatus, koerper, retryAfterSec)
}
