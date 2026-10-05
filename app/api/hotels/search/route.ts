// app/api/hotels/search/route.ts
//
// Geschlossene Hotelsuche. Kein offener Provider-Proxy: nur die Jetnity-Anfrage,
// nur die normalisierte Antwort. Phase 3.2 hat noch keinen Hoteladapter.

import { NextResponse } from 'next/server'

import {
  hotelSucheBegrenztLesen,
  hotelSucheContentLengthUeberschritten,
  hotelSucheHttpHeader,
  hotelSucheInhaltstypOk,
  hotelSucheKoerperLesen,
} from '@/lib/hotels/anfrage'
import { sucheFuerClient, type HotelSucheAntwort } from '@/lib/hotels/client-sicht'
import { LEERE_QUARTIER_EVIDENZ } from '@/lib/hotels/domain'
import { hotelProviderAus } from '@/lib/hotels/factory'
import { hotelRateKennungAus } from '@/lib/hotels/rate-limit'
import { hotelSuchePortsAusUmgebung, hotelsSuchen } from '@/lib/hotels/suche'
import { hotelUmgebungAusProzess } from '@/lib/hotels/zustand'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function antwort(
  httpStatus: number,
  koerper: HotelSucheAntwort,
  retryAfterSec?: number,
) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: hotelSucheHttpHeader(httpStatus, retryAfterSec),
  })
}

function leer(status: HotelSucheAntwort['status'], message: string): HotelSucheAntwort {
  return sucheFuerClient({
    status,
    message,
    quartier: null,
    evidenz: LEERE_QUARTIER_EVIDENZ,
    options: [],
  })
}

export async function POST(req: Request) {
  if (!hotelSucheInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, leer('error', 'Die Hotelsuche erwartet application/json.'))
  }

  if (hotelSucheContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, leer('error', 'Die Suchanfrage ist zu gross.'))
  }

  const begrenzt = await hotelSucheBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, leer('error', begrenzt.message))
  }

  const gelesen = hotelSucheKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, leer('error', gelesen.message))
  }

  const { httpStatus, koerper, retryAfterSec } = await hotelsSuchen(
    gelesen.wert,
    hotelSuchePortsAusUmgebung(hotelUmgebungAusProzess(), hotelProviderAus(), hotelRateKennungAus(req.headers)),
  )

  return antwort(httpStatus, koerper, retryAfterSec)
}
