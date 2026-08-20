// lib/hotels/aktionen.ts
//
// Übernimmt eine geprüfte Hoteloption in eine Reise im Konto.
// bookingUrl bleibt null. RLS prüft das Eigentum.

'use server'

import { revalidatePath } from 'next/cache'

import { alsHotelMomentaufnahme } from '@/lib/hotels/uebernahme'
import { ersteHotelmeldung, hotelKontoUebernahmeSchema } from '@/lib/hotels/schema'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'

export async function hotelInReiseUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = hotelKontoUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteHotelmeldung(geprueft.error) }

  const aufnahme = alsHotelMomentaufnahme(geprueft.data.option, {
    checkIn: geprueft.data.checkIn,
    checkOut: geprueft.data.checkOut,
  })
  if (!aufnahme) return { ok: false, meldung: 'Diese Hoteloption ist unvollständig.' }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const { data: etappe, error: etappenfehler } = await supabase
    .from('trip_stages')
    .select('id')
    .eq('id', geprueft.data.stageId)
    .eq('trip_id', geprueft.data.tripId)
    .maybeSingle()
  if (etappenfehler) return { ok: false, meldung: meldungAus(etappenfehler) }
  if (!etappe) return { ok: false, meldung: 'Diese Etappe gehört nicht zur Reise.' }

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
    stage_id: geprueft.data.stageId,
    kind: 'stay',
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
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}
