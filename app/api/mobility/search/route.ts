// app/api/mobility/search/route.ts
//
// Geschlossene Mobilitätssuche. Kein offener Provider-Proxy.
// Diese Foundation hat noch keinen Adapter: Production und Preview fail closed.

import { NextResponse } from 'next/server'

import {
  mobilitySucheBegrenztLesen,
  mobilitySucheContentLengthUeberschritten,
  mobilitySucheHttpHeader,
  mobilitySucheInhaltstypOk,
  mobilitySucheKoerperLesen,
} from '@/lib/mobility/anfrage'
import { sucheFuerClient, type MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import { LEERE_MOBILITY_EVIDENZ } from '@/lib/mobility/domain'
import { mobilityProviderAus } from '@/lib/mobility/factory'
import { mobilityRateKennungAus } from '@/lib/mobility/rate-limit'
import { mobilitySuchePortsAusUmgebung, mobilitySuchen } from '@/lib/mobility/suche'
import { mobilityUmgebungAusProzess } from '@/lib/mobility/zustand'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function antwort(
  httpStatus: number,
  koerper: MobilitySucheAntwort,
  retryAfterSec?: number,
) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: mobilitySucheHttpHeader(httpStatus, retryAfterSec),
  })
}

function leer(status: MobilitySucheAntwort['status'], message: string): MobilitySucheAntwort {
  return sucheFuerClient({
    status,
    message,
    coverageNote: '',
    evidenz: LEERE_MOBILITY_EVIDENZ,
    options: [],
  })
}

export async function POST(req: Request) {
  if (!mobilitySucheInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, leer('error', 'Die Mobilitätssuche erwartet application/json.'))
  }

  if (mobilitySucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, leer('error', 'Die Suchanfrage ist zu gross.'))
  }

  const begrenzt = await mobilitySucheBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, leer('error', begrenzt.message))
  }

  const gelesen = mobilitySucheKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, leer('error', gelesen.message))
  }

  const { httpStatus, koerper, retryAfterSec } = await mobilitySuchen(
    gelesen.wert,
    mobilitySuchePortsAusUmgebung(
      mobilityUmgebungAusProzess(),
      mobilityProviderAus(),
      mobilityRateKennungAus(req.headers),
    ),
  )

  return antwort(httpStatus, koerper, retryAfterSec)
}
