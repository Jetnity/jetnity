// lib/flights/aktionen.ts
//
// Übernimmt eine serverseitig nachgewiesene Flugoption in eine Reise im Konto.
// Der Browser liefert nur identifiers. bookingUrl bleibt null. RLS prüft das Eigentum.

'use server'

import { revalidatePath } from 'next/cache'

import { flugKontoUebernahmePruefen } from '@/lib/flights/konto-uebernahme'
import { flugNachweisAusUmgebung } from '@/lib/flights/nachweis'
import { ersteFlugmeldung, flugKontoUebernahmeSchema } from '@/lib/flights/schema'
import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import { flughafenReferenzLesen, iatasAusOption } from '@/lib/route/flughafen-lesen'
import { metadataAusItinerary } from '@/lib/route/metadata'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'
import type { Json } from '@/types/supabase'

export async function flugInReiseUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = flugKontoUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteFlugmeldung(geprueft.error) }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const geladen = await reiseLaden(geprueft.data.tripId)
  if (geladen.problem) {
    return {
      ok: false,
      meldung:
        geladen.problem.status === 503
          ? 'Die Reise konnte gerade nicht geladen werden. Bitte versuche es in einem Moment erneut.'
          : 'Die Reise konnte nicht geladen werden.',
    }
  }

  const reise = geladen.zeilen[0]
  if (!reise) return { ok: false, meldung: 'Diese Reise wurde nicht gefunden.' }

  const gepruefteUebernahme = await flugKontoUebernahmePruefen(geprueft.data, {
    nachweis: flugNachweisAusUmgebung(),
    reise,
    suche: null,
  })
  if (!gepruefteUebernahme.ok) return { ok: false, meldung: gepruefteUebernahme.message }

  const refs = await flughafenReferenzLesen(iatasAusOption(gepruefteUebernahme.option), supabase)
  const aufnahme =
    alsFlugMomentaufnahme(gepruefteUebernahme.option, refs) ?? gepruefteUebernahme.aufnahme

  let zaehlung = supabase
    .from('trip_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', geprueft.data.tripId)
  zaehlung = gepruefteUebernahme.dayId
    ? zaehlung.eq('day_id', gepruefteUebernahme.dayId)
    : zaehlung.is('day_id', null)

  const { count, error: zaehlfehler } = await zaehlung
  if (zaehlfehler) return { ok: false, meldung: meldungAus(zaehlfehler) }
  const position = Math.min((count ?? 0) + 1, 500)

  const { error, status } = await supabase.from('trip_items').insert({
    trip_id: geprueft.data.tripId,
    day_id: gepruefteUebernahme.dayId,
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
