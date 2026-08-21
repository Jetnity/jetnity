// app/api/rental-cars/search/route.ts
//
// Geschlossene Mietwagensuche. Kein offener Provider-Proxy.
// Diese Foundation hat noch keinen Adapter: Production und Preview fail closed.

import { NextResponse } from 'next/server'

import {
  rentalCarSucheBegrenztLesen,
  rentalCarSucheContentLengthUeberschritten,
  rentalCarSucheHttpHeader,
  rentalCarSucheInhaltstypOk,
  rentalCarSucheKoerperLesen,
} from '@/lib/rental-cars/anfrage'
import { sucheFuerClient, type RentalCarSucheAntwort } from '@/lib/rental-cars/client-sicht'
import { LEERE_RENTAL_EVIDENZ } from '@/lib/rental-cars/domain'
import { rentalCarProviderAus } from '@/lib/rental-cars/factory'
import { rentalCarRateKennungAus } from '@/lib/rental-cars/rate-limit'
import { rentalCarSuchePortsAusUmgebung, rentalCarSuchen } from '@/lib/rental-cars/suche'
import { rentalCarUmgebungAusProzess } from '@/lib/rental-cars/zustand'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function antwort(
  httpStatus: number,
  koerper: RentalCarSucheAntwort,
  retryAfterSec?: number,
) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: rentalCarSucheHttpHeader(httpStatus, retryAfterSec),
  })
}

function leer(status: RentalCarSucheAntwort['status'], message: string): RentalCarSucheAntwort {
  return sucheFuerClient({
    status,
    message,
    coverageNote: '',
    evidenz: LEERE_RENTAL_EVIDENZ,
    options: [],
  })
}

export async function POST(req: Request) {
  if (!rentalCarSucheInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, leer('error', 'Die Mietwagensuche erwartet application/json.'))
  }

  if (rentalCarSucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, leer('error', 'Die Suchanfrage ist zu gross.'))
  }

  const begrenzt = await rentalCarSucheBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, leer('error', begrenzt.message))
  }

  const gelesen = rentalCarSucheKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, leer('error', gelesen.message))
  }

  const { httpStatus, koerper, retryAfterSec } = await rentalCarSuchen(
    gelesen.wert,
    rentalCarSuchePortsAusUmgebung(
      rentalCarUmgebungAusProzess(),
      rentalCarProviderAus(),
      rentalCarRateKennungAus(req.headers),
    ),
  )

  return antwort(httpStatus, koerper, retryAfterSec)
}
