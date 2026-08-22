// lib/readiness/aktionen.ts
//
// Schreibweg für Readiness im Konto. Kein Service-Role. RLS prüft Eigentum.
// Fingerprint wird serverseitig aus der geladenen Reise berechnet.

'use server'

import { revalidatePath } from 'next/cache'

import { readinessItemBauen } from '@/lib/readiness/bauen'
import { READINESS_GRENZEN, readinessItemsVon } from '@/lib/readiness/domain'
import {
  readinessKontoEingabeSchema,
  readinessKontoLoeschenSchema,
  readinessUebernahmeSchema,
} from '@/lib/readiness/schema'
import { readinessNachUebernahmeBauen } from '@/lib/readiness/uebernahme'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'

function ersteReadinessMeldung(fehler: { issues: { message: string }[] }): string {
  return fehler.issues[0]?.message ?? 'Diese Vorbereitung ist ungültig.'
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

export async function readinessSetzen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = readinessKontoEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteReadinessMeldung(geprueft.error) }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const bestehend = readinessItemsVon(rahmen.reise).find((item) => item.clientRef === geprueft.data.clientRef) ?? null
  const gebaut = readinessItemBauen(rahmen.reise, geprueft.data, bestehend)
  if (!gebaut.ok) return { ok: false, meldung: gebaut.meldung }

  if (!bestehend && readinessItemsVon(rahmen.reise).length >= READINESS_GRENZEN.itemsJeReise) {
    return { ok: false, meldung: `Eine Reise trägt höchstens ${READINESS_GRENZEN.itemsJeReise} Vorbereitungspunkte.` }
  }

  const zeile = {
    trip_id: geprueft.data.tripId,
    client_ref: gebaut.item.clientRef,
    kind: gebaut.item.kind,
    user_status: gebaut.item.userStatus,
    evidence: 'user' as const,
    country_code: gebaut.item.countryCode,
    trip_item_id: gebaut.item.tripItemId,
    title: gebaut.item.title,
    context_fingerprint: gebaut.item.contextFingerprint,
  }

  const { error, status } = bestehend
    ? await rahmen.supabase
        .from('trip_readiness_items')
        .update({
          user_status: zeile.user_status,
          evidence: 'user',
          country_code: zeile.country_code,
          trip_item_id: zeile.trip_item_id,
          title: zeile.title,
          context_fingerprint: zeile.context_fingerprint,
        })
        .eq('trip_id', geprueft.data.tripId)
        .eq('client_ref', gebaut.item.clientRef)
    : await rahmen.supabase.from('trip_readiness_items').insert(zeile)

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function readinessEntfernen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = readinessKontoLoeschenSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteReadinessMeldung(geprueft.error) }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const { error, status } = await rahmen.supabase
    .from('trip_readiness_items')
    .delete()
    .eq('trip_id', geprueft.data.tripId)
    .eq('client_ref', geprueft.data.clientRef)

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}

export async function readinessUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = readinessUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteReadinessMeldung(geprueft.error) }
  if (geprueft.data.items.length === 0) return { ok: true, wert: null }

  const rahmen = await reiseDesKontos(geprueft.data.tripId)
  if (!rahmen.ok) return rahmen

  const items = readinessNachUebernahmeBauen(rahmen.reise, geprueft.data.items)
  if (items.length === 0) return { ok: true, wert: null }

  const zeilen = items.map((item) => ({
    trip_id: geprueft.data.tripId,
    client_ref: item.clientRef,
    kind: item.kind,
    user_status: item.userStatus,
    evidence: 'user' as const,
    country_code: item.countryCode,
    trip_item_id: item.tripItemId,
    title: item.title,
    context_fingerprint: item.contextFingerprint,
  }))

  const { error, status } = await rahmen.supabase.from('trip_readiness_items').upsert(zeilen, {
    onConflict: 'user_id,trip_id,client_ref',
    ignoreDuplicates: false,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  return { ok: true, wert: null }
}
