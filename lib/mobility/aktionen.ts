// lib/mobility/aktionen.ts
//
// Manuelle Mobilität in eine Reise im Konto. Nutzerangabe, kein Providerfakt.
// Kein Service-Role-Weg. RLS prüft das Eigentum. Keine Booking-URL.

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { mobilityManuellLesen, mobilityManuellZuPunkt, mobilityZugehoerigkeitPruefen } from '@/lib/mobility/manuell'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'

const manuellKontoSchema = z.object({
  tripId: z.string().uuid(),
})

export async function mobilityManuellInReiseAnlegen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const rahmen = manuellKontoSchema.safeParse(eingabe)
  if (!rahmen.success) return { ok: false, meldung: 'Diese Reise ist unbekannt.' }

  const gelesen = mobilityManuellLesen(eingabe)
  if (!gelesen.ok) return { ok: false, meldung: gelesen.meldung }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const geladen = await reiseLaden(rahmen.data.tripId)
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

  const zugehoerig = mobilityZugehoerigkeitPruefen(reise, gelesen.eingabe.dayId, gelesen.eingabe.stageId)
  if (!zugehoerig.ok) return { ok: false, meldung: zugehoerig.meldung }

  const dayId = gelesen.eingabe.dayId
  const zaehlung = supabase.from('trip_items').select('id', { count: 'exact', head: true }).eq(
    'trip_id',
    rahmen.data.tripId,
  )
  const { count, error: zaehlfehler } = dayId
    ? await zaehlung.eq('day_id', dayId)
    : await zaehlung.is('day_id', null)

  if (zaehlfehler) return { ok: false, meldung: meldungAus(zaehlfehler) }

  const punkt = mobilityManuellZuPunkt(gelesen.eingabe, {
    id: '00000000-0000-0000-0000-000000000000',
    dayId,
    stageId: gelesen.eingabe.stageId,
    position: Math.min((count ?? 0) + 1, 500),
  })

  const { error, status } = await supabase.from('trip_items').insert({
    trip_id: rahmen.data.tripId,
    day_id: punkt.dayId,
    stage_id: punkt.stageId,
    kind: 'transfer',
    title: punkt.title,
    note: punkt.note,
    position: punkt.position,
    starts_on: punkt.startsOn,
    starts_at: punkt.startsAt,
    ends_on: punkt.endsOn,
    ends_at: punkt.endsAt,
    price_amount: punkt.priceAmount,
    price_currency: punkt.priceCurrency,
    provider: null,
    external_ref: null,
    booking_url: null,
    booking_status: 'unconfirmed',
    booking_source: null,
    booking_confirmed_at: null,
    mobility_mode: punkt.mobilityMode,
    origin_place_id: punkt.originPlaceId,
    destination_place_id: punkt.destinationPlaceId,
    origin_name: punkt.originName,
    destination_name: punkt.destinationName,
    connection_ref: punkt.connectionRef,
    mobility_changes: punkt.mobilityChanges,
    mobility_evidence: 'user',
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${rahmen.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}
