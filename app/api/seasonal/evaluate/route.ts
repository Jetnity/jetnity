// app/api/seasonal/evaluate/route.ts
//
// Geschlossene, provider-neutrale Seasonal-Naht.
// Ohne Provider: ehrliches unavailable. Keine Fake-Reisezeit, keine Modellantwort.

import { NextResponse } from 'next/server'

import {
  seasonalBegrenztLesen,
  seasonalContentLengthUeberschritten,
  seasonalHttpHeader,
  seasonalInhaltstypOk,
  seasonalKoerperLesen,
} from '@/lib/seasonal/anfrage'
import { seasonalEvaluationsPruefen, tripAusSeasonalAnfrage } from '@/lib/seasonal/auswerten'
import { seasonalAnfrageErlaubt, seasonalRateKennungAus } from '@/lib/seasonal/rate-limit'
import { seasonalAnfrageSchema } from '@/lib/seasonal/schema'
import { seasonalAnsicht, seasonalApiStatus } from '@/lib/seasonal/status'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

function antwort(httpStatus: number, koerper: unknown) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: seasonalHttpHeader(),
  })
}

export async function POST(req: Request) {
  const limit = seasonalAnfrageErlaubt(seasonalRateKennungAus(req.headers))
  if (!limit.ok) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Zu viele Anfragen. Bitte später erneut versuchen.',
      },
      {
        status: 429,
        headers: {
          ...seasonalHttpHeader(),
          'retry-after': String(limit.retryAfterSec),
        },
      },
    )
  }

  if (!seasonalInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, {
      status: 'error',
      message: 'Die Anfrage erwartet application/json.',
    })
  }

  if (seasonalContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, {
      status: 'error',
      message: 'Die Anfrage ist zu gross.',
    })
  }

  const begrenzt = await seasonalBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, {
      status: 'error',
      message: begrenzt.message,
    })
  }

  const gelesen = seasonalKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, {
      status: 'error',
      message: gelesen.message,
    })
  }

  const geprueft = seasonalAnfrageSchema.safeParse(gelesen.wert ?? {})
  if (!geprueft.success) {
    return antwort(400, {
      status: 'error',
      message: geprueft.error.issues[0]?.message ?? 'Die Anfrage ist ungültig.',
    })
  }

  const evaluations = await seasonalEvaluationsPruefen(geprueft.data)
  const ansicht = seasonalAnsicht(tripAusSeasonalAnfrage(geprueft.data), evaluations)
  const apiStatus = seasonalApiStatus(ansicht.summary)
  return antwort(200, {
    status: apiStatus,
    evaluations,
    summary: ansicht.summary,
    message:
      apiStatus === 'unavailable'
        ? 'Saisonale Hinweise können derzeit nicht geprüft werden. Das ist keine Aussage über eine gute Reisezeit.'
        : apiStatus === 'unknown'
          ? 'Der saisonale Kontext für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Aussage über eine gute Reisezeit.'
          : 'Seasonal-Evaluation abgeschlossen.',
  })
}
