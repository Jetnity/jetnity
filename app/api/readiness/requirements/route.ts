// app/api/readiness/requirements/route.ts
//
// Geschlossene, provider-neutrale Requirement-Naht.
// Ohne Provider: ehrliches unavailable / insufficient_context.
// Production fail closed. Keine Fake-Regeln, keine Modellantwort.

import { NextResponse } from 'next/server'

import {
  officialAusEvaluations,
  officialRequirementsPruefen,
  requirementsEvaluationsPruefen,
  type OfficialRequirementAnfrage,
} from '@/lib/readiness/anforderungen'
import { officialPruefungAusEvaluations } from '@/lib/readiness/bezeichnungen'
import {
  readinessBegrenztLesen,
  readinessContentLengthUeberschritten,
  readinessHttpHeader,
  readinessInhaltstypOk,
  readinessKoerperLesen,
} from '@/lib/readiness/anfrage'
import { readinessAnfrageErlaubt, readinessRateKennungAus } from '@/lib/readiness/rate-limit'
import { readinessAnforderungAnfrageSchema } from '@/lib/readiness/schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

function antwort(httpStatus: number, koerper: unknown) {
  return NextResponse.json(koerper, {
    status: httpStatus,
    headers: readinessHttpHeader(),
  })
}

export async function POST(req: Request) {
  const limit = await readinessAnfrageErlaubt(readinessRateKennungAus(req.headers))
  if (!limit.ok) {
    return NextResponse.json(
      {
        status: 'error',
        official: officialRequirementsPruefen(),
        message: 'Zu viele Anfragen. Bitte später erneut versuchen.',
      },
      {
        status: 429,
        headers: {
          ...readinessHttpHeader(),
          'retry-after': String(limit.retryAfterSec),
        },
      },
    )
  }

  if (!readinessInhaltstypOk(req.headers.get('content-type'))) {
    return antwort(415, {
      status: 'error',
      official: officialRequirementsPruefen(),
      message: 'Die Anfrage erwartet application/json.',
    })
  }

  if (readinessContentLengthUeberschritten(req.headers.get('content-length'))) {
    return antwort(413, {
      status: 'error',
      official: officialRequirementsPruefen(),
      message: 'Die Anfrage ist zu gross.',
    })
  }

  const begrenzt = await readinessBegrenztLesen(req.body)
  if (!begrenzt.ok) {
    return antwort(begrenzt.status, {
      status: 'error',
      official: officialRequirementsPruefen(),
      message: begrenzt.message,
    })
  }

  const gelesen = readinessKoerperLesen(begrenzt.text)
  if (!gelesen.ok) {
    return antwort(gelesen.status, {
      status: 'error',
      official: officialRequirementsPruefen(),
      message: gelesen.message,
    })
  }

  const geprueft = readinessAnforderungAnfrageSchema.safeParse(gelesen.wert ?? {})
  if (!geprueft.success) {
    return antwort(400, {
      status: 'error',
      official: officialRequirementsPruefen(),
      message: geprueft.error.issues[0]?.message ?? 'Die Anfrage ist ungültig.',
    })
  }

  const anfrage: OfficialRequirementAnfrage = geprueft.data
  const evaluations = await requirementsEvaluationsPruefen(anfrage)
  const official = officialAusEvaluations(evaluations, anfrage)

  return antwort(200, {
    status: official.status,
    evaluations,
    official,
    message: officialPruefungAusEvaluations(evaluations),
  })
}
