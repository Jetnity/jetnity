// app/api/flights/search/route.ts
//
// Geschlossene Flugsuche. Kein offener Provider-Proxy: nur diese eine Aktion,
// nur die Jetnity-Suchanfrage, nur die normalisierte Antwort.

import { NextResponse } from 'next/server'

import { duffelProviderAus } from '@/lib/flights/duffel/factory'
import { flugRateKennungAus } from '@/lib/flights/rate-limit'
import { fluegeSuchen, suchePortsAusUmgebung } from '@/lib/flights/suche'
import { flugUmgebungAusProzess } from '@/lib/flights/zustand'

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
        options: [],
      },
      { status: 400, headers: { 'cache-control': 'no-store' } },
    )
  }

  const { httpStatus, koerper } = await fluegeSuchen(
    eingabe,
    suchePortsAusUmgebung(flugUmgebungAusProzess(), duffelProviderAus(), flugRateKennungAus(req.headers)),
  )

  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: { 'cache-control': 'no-store' },
  })
}
