// app/api/flights/search/route.ts
//
// Geschlossene Flugsuche. Kein offener Provider-Proxy: nur diese eine Aktion,
// nur die Jetnity-Suchanfrage, nur die normalisierte Antwort.

import { NextResponse } from 'next/server'

import {
  flugSucheBegrenztLesen,
  flugSucheContentLengthUeberschritten,
  flugSucheHttpHeader,
  flugSucheInhaltstypOk,
  flugSucheKoerperLesen,
} from '@/lib/flights/anfrage'
import { sucheFuerClient, type FlugSucheAntwort } from '@/lib/flights/client-sicht'
import { duffelProviderAus } from '@/lib/flights/duffel/factory'
import { flugRateKennungAus } from '@/lib/flights/rate-limit'
import { fluegeSuchen, suchePortsAusUmgebung } from '@/lib/flights/suche'
import { flugUmgebungAusProzess } from '@/lib/flights/zustand'
import { flughafenReferenzLesen } from '@/lib/route/flughafen-lesen'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function antwort(
  httpStatus: number,
  koerper: FlugSucheAntwort,
  retryAfterSec?: number,
) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: flugSucheHttpHeader(httpStatus, retryAfterSec),
  })
}

function leer(status: FlugSucheAntwort['status'], message: string): FlugSucheAntwort {
  return sucheFuerClient({
    status,
    message,
    options: [],
  })
}

export async function POST(req: Request) {
  if (!flugSucheInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, leer('error', 'Die Flugsuche erwartet application/json.'))
  }

  if (flugSucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, leer('error', 'Die Suchanfrage ist zu gross.'))
  }

  const begrenzt = await flugSucheBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, leer('error', begrenzt.message))
  }

  const gelesen = flugSucheKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, leer('error', gelesen.message))
  }

  const ports = suchePortsAusUmgebung(
    flugUmgebungAusProzess(),
    duffelProviderAus(),
    flugRateKennungAus(req.headers),
  )
  const { httpStatus, koerper, retryAfterSec } = await fluegeSuchen(gelesen.wert, {
    ...ports,
    flughafenReferenz: (codes) => flughafenReferenzLesen(codes, createRouteHandlerClient()),
  })

  return antwort(httpStatus, koerper, retryAfterSec)
}
