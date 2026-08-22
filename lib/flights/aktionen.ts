// lib/flights/aktionen.ts
//
// Übernimmt eine geprüfte Flugoption in eine Reise im Konto.
//
// Die Option kommt aus dem Browser und wird erneut gegen das Jetnity-Schema
// geprüft. bookingUrl bleibt null. RLS prüft das Eigentum.

'use server'

import { revalidatePath } from 'next/cache'

import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import { ersteFlugmeldung, flugKontoUebernahmeSchema } from '@/lib/flights/schema'
import { flughafenReferenzLesen, iatasAusOption } from '@/lib/route/flughafen-lesen'
import { metadataAusItinerary } from '@/lib/route/metadata'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import type { Json } from '@/types/supabase'

export async function flugInReiseUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = flugKontoUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteFlugmeldung(geprueft.error) }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const refs = await flughafenReferenzLesen(iatasAusOption(geprueft.data.option), supabase)
  const aufnahme = alsFlugMomentaufnahme(geprueft.data.option, refs)
  if (!aufnahme) return { ok: false, meldung: 'Diese Flugoption ist unvollständig.' }

  let zaehlung = supabase
    .from('trip_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', geprueft.data.tripId)
  zaehlung = geprueft.data.dayId
    ? zaehlung.eq('day_id', geprueft.data.dayId)
    : zaehlung.is('day_id', null)

  const { count, error: zaehlfehler } = await zaehlung
  if (zaehlfehler) return { ok: false, meldung: meldungAus(zaehlfehler) }
  const position = Math.min((count ?? 0) + 1, 500)

  const { error, status } = await supabase.from('trip_items').insert({
    trip_id: geprueft.data.tripId,
    day_id: geprueft.data.dayId,
    kind: 'flight',
    title: aufnahme.title,
    note: aufnahme.note,
    position,
    starts_on: aufnahme.startsOn,
    starts_at: aufnahme.startsAt,
    ends_on: aufnahme.endsOn,
    ends_at: aufnahme.endsAt,
    price_amount: aufnahme.priceAmount,
    price_currency: aufnahme.priceCurrency,
    provider: aufnahme.provider,
    external_ref: aufnahme.externalRef,
    booking_url: null,
    metadata: metadataAusItinerary(aufnahme.routeItinerary) as Json,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}
