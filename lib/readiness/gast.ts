// lib/readiness/gast.ts
//
// Readiness-Schreibweg der Gastreise. Dieselbe fachliche Form wie im Konto.

import { readinessItemBauen } from '@/lib/readiness/bauen'
import { READINESS_GRENZEN, readinessItemsVon } from '@/lib/readiness/domain'
import { readinessEingabeSchema, type ReadinessEingabe } from '@/lib/readiness/schema'
import { gastreiseSpeichern } from '@/lib/trips/gastspeicher'
import type { Trip } from '@/types/trips'

export function gastReadinessSetzen(reise: Trip, roh: unknown): Trip {
  const geprueft = readinessEingabeSchema.safeParse(roh)
  if (!geprueft.success) {
    throw new Error(geprueft.error.issues[0]?.message ?? 'Diese Vorbereitung ist ungültig.')
  }

  const bestand = readinessItemsVon(reise)
  const eingabe: ReadinessEingabe = geprueft.data
  const bestehend = eingabe.clientRef
    ? bestand.find((item) => item.clientRef === eingabe.clientRef) ?? null
    : bestand.find((item) => item.kind === eingabe.kind && item.countryCode === (eingabe.countryCode ?? null) && item.tripItemId === (eingabe.tripItemId ?? null)) ?? null

  const gebaut = readinessItemBauen(reise, { ...eingabe, clientRef: bestehend?.clientRef ?? eingabe.clientRef }, bestehend)
  if (!gebaut.ok) throw new Error(gebaut.meldung)

  const ohne = bestand.filter((item) => item.clientRef !== gebaut.item.clientRef)
  if (ohne.length + 1 > READINESS_GRENZEN.itemsJeReise) {
    throw new Error(`Eine Reise trägt höchstens ${READINESS_GRENZEN.itemsJeReise} Vorbereitungspunkte.`)
  }

  return gastreiseSpeichern({
    ...reise,
    readinessItems: [...ohne, gebaut.item],
  })
}

export function gastReadinessEntfernen(reise: Trip, clientRef: string): Trip {
  return gastreiseSpeichern({
    ...reise,
    readinessItems: readinessItemsVon(reise).filter((item) => item.clientRef !== clientRef),
  })
}
