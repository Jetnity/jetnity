// lib/readiness/reisende-aktionen.ts
//
// Schreibweg für Reisendenkontext im Konto.
// Setzen/Übernahme atomar über party_schreiben. Löschen über party_loeschen.
// Registry→Trip nutzt S1-Projektion und denselben atomaren Write-Pfad.
// Kein Service-Role. Kein direktes Tabellen-DELETE. Keine Legacy-Credential-Spalten.

'use server'

import { revalidatePath } from 'next/cache'

import { PARTY_GRENZEN, partyLimitUeberschritten, partyVon } from '@/lib/readiness/party'
import {
  partyUebernahmeSchema,
  travellerKontoEingabeSchema,
  travellerKontoLoeschenSchema,
} from '@/lib/readiness/schema'
import { travellerAlsPayload, travellerBauen } from '@/lib/readiness/reisende'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'
import { registryMitClientLaden } from '@/lib/traveller/account-registry-daten'
import { registryTripUebernahmeOrchestrieren } from '@/lib/traveller/account-registry-trip'

function ersteMeldung(fehler: { issues: { message: string }[] }): string {
  return fehler.issues[0]?.message ?? 'Diese Reisendenangabe ist ungültig.'
}

async function reiseDesKontos(tripId: string) {
  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false as const, meldung: NICHT_ANGEMELDET }

  const geladen = await reiseLaden(tripId)
  if (geladen.problem) {
    return {
      ok: false as const,
      meldung:
        geladen.problem.status === 503
          ? 'Die Reise konnte gerade nicht geladen werden. Bitte versuche es in einem Moment erneut.'
          : 'Die Reise konnte nicht geladen werden.',
    }
  }

  const reise = geladen.zeilen[0]
  if (!reise) return { ok: false as const, meldung: 'Diese Reise wurde nicht gefunden.' }
  return { ok: true as const, supabase, reise }
}

async function partySchreiben(
  supabase: Awaited<ReturnType<typeof konto>>['supabase'],
  tripId: string,
  party: ReturnType<typeof travellerAlsPayload>[],
): Promise<{ ok: true } | { ok: false; meldung: string }> {
  const { error, status } = await supabase.rpc('party_schreiben', {
    _payload: { tripId, party },
  })
  if (error) return { ok: false, meldung: meldungAus(error, status) }
  return { ok: true }
}

export async function travellerSetzen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = travellerKontoEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const bestehend = partyVon(rahmen.reise).find((item) => item.clientRef === geprueft.data.clientRef) ?? null
  const gebaut = travellerBauen(rahmen.reise, geprueft.data, bestehend)
  if (!gebaut.ok) return { ok: false, meldung: gebaut.meldung }

  if (!bestehend && partyVon(rahmen.reise).length >= PARTY_GRENZEN.slots) {
    return { ok: false, meldung: `Eine Reise trägt höchstens ${PARTY_GRENZEN.slots} Reisendenprofile.` }
  }

  const geschrieben = await partySchreiben(rahmen.supabase, geprueft.data.tripId, [travellerAlsPayload(gebaut.item)])
  if (!geschrieben.ok) return geschrieben
  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function travellerEntfernen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = travellerKontoLoeschenSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const { error, status } = await rahmen.supabase.rpc('party_loeschen', {
    _payload: { tripId: geprueft.data.tripId, clientRef: geprueft.data.clientRef },
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }
  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function partyUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = partyUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }
  if (geprueft.data.party.length === 0) return { ok: true, wert: null }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const items = geprueft.data.party
    .map((eintrag) => travellerBauen(rahmen.reise, eintrag))
    .filter((gebaut): gebaut is { ok: true; item: import('@/types/trips').TripTraveller } => gebaut.ok)
    .map((gebaut) => travellerAlsPayload(gebaut.item))

  if (items.length === 0) return { ok: true, wert: null }

  if (
    partyLimitUeberschritten(
      partyVon(rahmen.reise).map((item) => item.clientRef),
      items.map((item) => item.clientRef),
    )
  ) {
    return { ok: false, meldung: `Eine Reise trägt höchstens ${PARTY_GRENZEN.slots} Reisendenprofile.` }
  }

  const geschrieben = await partySchreiben(rahmen.supabase, geprueft.data.tripId, items)
  if (!geschrieben.ok) return geschrieben
  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function registryTravellerInReiseUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const { supabase, benutzerId } = await konto()
  const ergebnis = await registryTripUebernahmeOrchestrieren({
    eingabe,
    benutzerId,
    reiseLesen: async (tripId) => {
      const geladen = await reiseLaden(tripId)
      if (geladen.problem) return { problem: geladen.problem, reise: null }
      const reise = geladen.zeilen[0] ?? null
      return { problem: null, reise: reise ? { party: partyVon(reise) } : null }
    },
    registryLesen: (id) => registryMitClientLaden(supabase, { id }),
    partySchreiben: (tripId, party) => partySchreiben(supabase, tripId, [...party]),
    jetzt: new Date().toISOString(),
  })
  if (!ergebnis.ok) return { ok: false, meldung: ergebnis.meldung ?? 'Die Übernahme ist fehlgeschlagen.' }
  if (!ergebnis.tripId) return { ok: false, meldung: 'Die Übernahme ist fehlgeschlagen.' }
  revalidatePath(`/reisen/${ergebnis.tripId}`)
  return { ok: true, wert: null }
}
