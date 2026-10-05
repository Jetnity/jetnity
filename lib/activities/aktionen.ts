// lib/activities/aktionen.ts
//
// Übernimmt eine serverseitig nachgewiesene Aktivitätsoption in eine Reise im Konto.
// Der Browser liefert nur identifiers. bookingUrl bleibt null. RLS prüft das Eigentum.

'use server'

import { revalidatePath } from 'next/cache'

import { activityKontoUebernahmePruefen } from '@/lib/activities/konto-uebernahme'
import { activityNachweisAusUmgebung } from '@/lib/activities/nachweis'
import { ersteActivitymeldung, activityKontoUebernahmeSchema } from '@/lib/activities/schema'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'

export async function activityInReiseUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = activityKontoUebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteActivitymeldung(geprueft.error) }

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

  const gepruefteUebernahme = await activityKontoUebernahmePruefen(geprueft.data, {
    nachweis: activityNachweisAusUmgebung(),
    reise,
  })
  if (!gepruefteUebernahme.ok) return { ok: false, meldung: gepruefteUebernahme.message }

  const { count, error: zaehlfehler } = await supabase
    .from('trip_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', geprueft.data.tripId)
    .eq('day_id', gepruefteUebernahme.dayId)

  if (zaehlfehler) return { ok: false, meldung: meldungAus(zaehlfehler) }
  const position = Math.min((count ?? 0) + 1, 500)

  const { error, status } = await supabase.from('trip_items').insert({
    trip_id: geprueft.data.tripId,
    day_id: gepruefteUebernahme.dayId,
    stage_id: gepruefteUebernahme.stageId,
    kind: 'activity',
    title: gepruefteUebernahme.aufnahme.title,
    note: gepruefteUebernahme.aufnahme.note,
    position,
    starts_on: gepruefteUebernahme.aufnahme.startsOn,
    starts_at: gepruefteUebernahme.aufnahme.startsAt,
    ends_on: gepruefteUebernahme.aufnahme.endsOn,
    ends_at: gepruefteUebernahme.aufnahme.endsAt,
    price_amount: gepruefteUebernahme.aufnahme.priceAmount,
    price_currency: gepruefteUebernahme.aufnahme.priceCurrency,
    provider: gepruefteUebernahme.aufnahme.provider,
    external_ref: gepruefteUebernahme.aufnahme.externalRef,
    booking_url: null,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}
