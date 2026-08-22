// lib/readiness/reisende-gast.ts
//
// Reisendenkontext der Gastreise. Dieselbe fachliche Form wie im Konto.

import { PARTY_GRENZEN, partyVon } from '@/lib/readiness/party'
import { travellerBauen } from '@/lib/readiness/reisende'
import { gastreiseSpeichern } from '@/lib/trips/gastspeicher'
import type { Trip } from '@/types/trips'

export function gastTravellerSetzen(reise: Trip, roh: unknown): Trip {
  const bestehend = (() => {
    const geprueft = (roh as { clientRef?: string } | null)?.clientRef
    return geprueft ? partyVon(reise).find((item) => item.clientRef === geprueft) ?? null : null
  })()
  const gebaut = travellerBauen(reise, roh, bestehend)
  if (!gebaut.ok) throw new Error(gebaut.meldung)

  const ohne = partyVon(reise).filter((item) => item.clientRef !== gebaut.item.clientRef)
  if (ohne.length + 1 > PARTY_GRENZEN.slots) {
    throw new Error(`Eine Reise trägt höchstens ${PARTY_GRENZEN.slots} Reisendenprofile.`)
  }

  return gastreiseSpeichern({
    ...reise,
    party: [...ohne, gebaut.item],
  })
}

export function gastTravellerEntfernen(reise: Trip, clientRef: string): Trip {
  return gastreiseSpeichern({
    ...reise,
    party: partyVon(reise).filter((item) => item.clientRef !== clientRef),
  })
}
