// app/api/safety/evaluate/route.ts
//
// Geschlossene, provider-neutrale Safety-Naht.
// Konto-Reisen: Route/Party nur aus RLS-geschütztem `reiseLaden`.
// Gast: transienter Routenkontext, keine Reisendenwahrheit.
// Ohne Provider: ehrliches unavailable. Keine Fake-Warnung, keine Modellantwort.

import { NextResponse } from 'next/server'

import {
  safetyBegrenztLesen,
  safetyContentLengthUeberschritten,
  safetyHttpHeader,
  safetyInhaltstypOk,
  safetyKoerperLesen,
} from '@/lib/safety/anfrage'
import { safetyEvaluationsPruefen } from '@/lib/safety/auswerten'
import { safetyAnfrageErlaubt, safetyRateKennungAus } from '@/lib/safety/rate-limit'
import { safetyAnfrageSchema } from '@/lib/safety/schema'
import { safetyAnsicht, safetyApiStatus } from '@/lib/safety/status'
import { reiseLaden } from '@/lib/trips/daten'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

function antwort(httpStatus: number, koerper: unknown) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: safetyHttpHeader(),
  })
}

export async function POST(req: Request) {
  const limit = await safetyAnfrageErlaubt(safetyRateKennungAus(req.headers))
  if (!limit.ok) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Zu viele Anfragen. Bitte später erneut versuchen.',
      },
      {
        status: 429,
        headers: {
          ...safetyHttpHeader(),
          'retry-after': String(limit.retryAfterSec),
        },
      },
    )
  }

  if (!safetyInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, {
      status: 'error',
      message: 'Die Anfrage erwartet application/json.',
    })
  }

  if (safetyContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, {
      status: 'error',
      message: 'Die Anfrage ist zu gross.',
    })
  }

  const begrenzt = await safetyBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, {
      status: 'error',
      message: begrenzt.message,
    })
  }

  const gelesen = safetyKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, {
      status: 'error',
      message: gelesen.message,
    })
  }

  const geprueft = safetyAnfrageSchema.safeParse(gelesen.wert ?? {})
  if (!geprueft.success) {
    return antwort(400, {
      status: 'error',
      message: geprueft.error.issues[0]?.message ?? 'Die Anfrage ist ungültig.',
    })
  }

  const auswertung = await safetyEvaluationsPruefen(geprueft.data, { reiseLesen: reiseLaden })
  if (!auswertung.ok) {
    return antwort(auswertung.status, {
      status: 'error',
      message: auswertung.message,
    })
  }

  const ansicht = safetyAnsicht(auswertung.reise, auswertung.evaluations)
  const apiStatus = safetyApiStatus(ansicht.summary)
  return antwort(200, {
    status: apiStatus,
    evaluations: auswertung.evaluations,
    summary: ansicht.summary,
    message:
      apiStatus === 'unavailable'
        ? 'Sicherheitshinweise können derzeit nicht geprüft werden. Das ist keine Entwarnung.'
        : apiStatus === 'unknown'
          ? 'Die Sicherheitslage für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Entwarnung.'
          : 'Safety-Evaluation abgeschlossen.',
  })
}
