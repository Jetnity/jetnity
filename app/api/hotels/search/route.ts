// app/api/hotels/search/route.ts
//
// Geschlossene Hotelsuche. Kein offener Provider-Proxy: nur die Jetnity-Anfrage,
// nur die normalisierte Antwort. Phase 3.2 hat noch keinen Hoteladapter.

import { NextResponse } from 'next/server'

import { hotelProviderAus } from '@/lib/hotels/factory'
import { hotelRateKennungAus } from '@/lib/hotels/rate-limit'
import { hotelSuchePortsAusUmgebung, hotelsSuchen } from '@/lib/hotels/suche'
import { hotelUmgebungAusProzess } from '@/lib/hotels/zustand'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  let eingabe: unknown
  try {
    eingabe = await req.json()
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Die Suchanfrage war kein gültiges JSON.',
        coverageNote: '',
        quartier: null,
        evidenz: {
          hatOrt: false,
          hatKoordinaten: false,
          hatZeitraum: false,
          hatReiseanker: false,
          hatWegezeiten: false,
          hatTransferzeiten: false,
          hatPraeferenzprofil: false,
        },
        options: [],
      },
      { status: 400, headers: { 'cache-control': 'no-store' } },
    )
  }

  const { httpStatus, koerper } = await hotelsSuchen(
    eingabe,
    hotelSuchePortsAusUmgebung(hotelUmgebungAusProzess(), hotelProviderAus(), hotelRateKennungAus(req.headers)),
  )

  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: { 'cache-control': 'no-store' },
  })
}
