// lib/readiness/reisende-aktionen.ts
//
// Schreibweg für Reisendenkontext im Konto. Kein Service-Role.

'use server'

import { revalidatePath } from 'next/cache'

import { PARTY_GRENZEN, partyVon } from '@/lib/readiness/party'
import {
  partyUebernahmeSchema,
  travellerKontoEingabeSchema,
  travellerKontoLoeschenSchema,
} from '@/lib/readiness/schema'
import { travellerAlsZeile, travellerBauen } from '@/lib/readiness/reisende'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'

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

  const zeile = travellerAlsZeile(gebaut.item, geprueft.data.tripId)
  const { error, status } = bestehend
    ? await rahmen.supabase
        .from('trip_travellers')
        .update(zeile)
        .eq('trip_id', geprueft.data.tripId)
        .eq('client_ref', gebaut.item.clientRef)
    : await rahmen.supabase.from('trip_travellers').insert(zeile)

  if (error) return { ok: false, meldung: meldungAus(error, status) }
  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function travellerEntfernen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = travellerKontoLoeschenSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const { error, status } = await rahmen.supabase
    .from('trip_travellers')
    .delete()
    .eq('trip_id', geprueft.data.tripId)
    .eq('client_ref', geprueft.data.clientRef)

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
    .map((gebaut) => travellerAlsZeile(gebaut.item, geprueft.data.tripId))

  if (items.length === 0) return { ok: true, wert: null }

  const { error, status } = await rahmen.supabase.from('trip_travellers').upsert(items, {
    onConflict: 'user_id,trip_id,client_ref',
    ignoreDuplicates: false,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }
  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}
