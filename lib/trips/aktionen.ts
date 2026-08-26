// lib/trips/aktionen.ts
//
// Die schreibenden Vorgänge an einer Reise im Konto.
//
// Server Actions sind eigene Eintrittspunkte: Kein Layout und keine Middleware
// schützt sie. Jede Funktion hier holt sich die Identität deshalb selbst über
// `auth.getUser()` – nicht über `auth.getSession()`, die auf dem Server nur den
// Cookie wiedergibt, ohne die Signatur zu prüfen.
//
// Der Zugriff läuft über den Anon-Key und damit als `authenticated`. Es gibt
// keinen `eq('user_id', …)`-Filter und keine Service-Role: Die Policies aus
// `20260817120000_reiseschema.sql` sind die Durchsetzung, dieses Modul ist der
// Aufrufer. Ein Löschvorgang auf eine fremde Kennung trifft null Zeilen,
// ein Schreibvorgang scheitert – beides ohne Zutun dieses Codes.
//
// Jede Eingabe läuft durch ein Zod-Schema, bevor sie die Datenbank erreicht.
// Der Aufrufer ist ein Client, auch wenn der Aufruf wie ein Funktionsaufruf
// aussieht: Eine Server Action ist ein öffentlicher HTTP-Endpunkt.
//
// Rückgabe ist immer ein Ergebnis und keine Ausnahme. Eine geworfene Ausnahme
// erreicht den Browser in der Produktion als „An error occurred in the Server
// Components render" – ein Satz, der niemandem sagt, was zu tun ist.
//
// Der Aufruf von `public.reise_anlegen()` selbst steht seit Phase 2.1 in
// `lib/trips/anlegen.ts`: Der Reisevorschlag ist ein dritter Anlass, aus dem eine
// Reise entsteht, und alle drei sollen durch dieselbe Prüfung und dieselbe
// Fehlerübersetzung laufen.

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { reiseorteBestaetigen } from '@/lib/places/aktionen'
import { istOrtId } from '@/lib/places/domain'
import { ORT_MELDUNG, ortAusBestand } from '@/lib/places/pruefen'
import { createServerActionClient } from '@/lib/supabase/server'
import { createZieleGraph } from '@/lib/trips/create-stages'
import {
  NICHT_ANGEMELDET,
  konto,
  meldungAus,
  reiseAusNutzlastAnlegen,
  type Aktionsergebnis,
} from '@/lib/trips/anlegen'
import {
  ersteMeldung,
  neuePlanpunktNutzlastSchema,
  neueReiseSchema,
  reiseNutzlastSchema,
  type ReiseNutzlast,
} from '@/lib/trips/schema'
import { reisetageBauen } from '@/lib/trips/tage'

/**
 * Legt eine Reise aus dem Formular unter /planen an.
 *
 * Die Tage entstehen serverseitig aus dem Zeitraum – dieselbe Aufteilung, die
 * ein Gast im Browser bekommt (`lib/trips/tage.ts`). Sie vom Client zu
 * übernehmen hiesse, ihm die Struktur der Reise zu überlassen.
 */
export async function reiseAnlegen(eingabe: unknown): Promise<Aktionsergebnis<string>> {
  const geprueft = neueReiseSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const reise = geprueft.data
  const orte = await reiseorteBestaetigen({
    zielId: reise.destinationPlaceId,
    abreiseId: reise.originPlaceId,
    weitereZielIds: reise.weitereDestinationPlaceIds,
  })
  if (!orte.ok) return orte

  const graph = createZieleGraph([orte.ziel, ...orte.weitereZiele], {
    startDate: reise.startDate,
    endDate: reise.endDate,
  })

  return reiseAusNutzlastAnlegen({
    client_ref: reise.clientRef,
    title: graph.title,
    origin: orte.abreise.name,
    origin_place_id: orte.abreise.id,
    start_date: reise.startDate,
    end_date: reise.endDate,
    travellers: reise.travellers,
    currency: reise.currency,
    budget_amount: reise.budgetAmount,
    pace: reise.pace,
    interests: reise.interests,
    travel_wish: reise.travelWish,
    stages: graph.stages.map((etappe) => ({
      position: etappe.position,
      name: etappe.name,
      country_code: etappe.countryCode,
      arrival_date: etappe.arrivalDate,
      departure_date: etappe.departureDate,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      place_id: etappe.placeId,
    })),
    days: reisetageBauen(reise.startDate, reise.endDate).map((tag) => ({
      day_index: tag.dayIndex,
      day_date: tag.dayDate,
      title: null,
      stage_position: graph.dayStagePosition,
      items: [],
    })),
    ungeplante: [],
    day_stage_assignment_source: graph.assignmentSource,
  })
}

/**
 * Übernimmt eine Gastreise aus dem Browser ins Konto.
 *
 * Der Aufruf darf beliebig oft geschehen: Über `trips.client_ref` ergibt
 * dieselbe Gastreise pro Konto genau eine Reise. Reload, Retry, doppelter
 * Request und ein zweiter Login liefern deshalb dieselbe Kennung zurück, und
 * der Browser räumt seinen Entwurf erst weg, wenn er sie gesehen hat.
 */
async function nutzlastOrtePruefen(nutzlast: ReiseNutzlast): Promise<Aktionsergebnis<null>> {
  const originId = nutzlast.origin_place_id
  const zielIds = nutzlast.stages
    .map((etappe) => etappe.place_id)
    .filter((id): id is string => Boolean(id))
  if (!originId && zielIds.length === 0) return { ok: true, wert: null }

  const eindeutig = [...new Set([originId, ...zielIds].filter((id): id is string => Boolean(id && istOrtId(id))))]
  if (eindeutig.length === 0) return { ok: false, meldung: ORT_MELDUNG.idUngueltig }

  const { data, error } = await createServerActionClient()
    .from('places')
    .select(ORT_SPALTEN)
    .in('id', eindeutig)
  if (error || !data) return { ok: false, meldung: ORT_MELDUNG.idUngueltig }

  const bestand = data
    .map((zeile) => ortAusZeile(zeile as OrtZeile))
    .filter((ort): ort is NonNullable<typeof ort> => ort !== null)

  if (originId && !ortAusBestand(bestand, originId, 'abreise')) {
    return { ok: false, meldung: ORT_MELDUNG.abreiseUnbekannt }
  }
  for (const id of zielIds) {
    if (!ortAusBestand(bestand, id, 'ziel')) {
      return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt }
    }
  }
  return { ok: true, wert: null }
}

export async function gastreiseUebernehmen(nutzlast: unknown): Promise<Aktionsergebnis<string>> {
  const geprueft = reiseNutzlastSchema.safeParse(nutzlast)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const orte = await nutzlastOrtePruefen(geprueft.data)
  if (!orte.ok) return orte

  return reiseAusNutzlastAnlegen(geprueft.data)
}

/** Hängt einen Planpunkt an einen Tag einer Reise im Konto. */
export async function planpunktAnlegen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = neuePlanpunktNutzlastSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const punkt = geprueft.data

  // `position` als nächste freie Stelle des Tages. Der Wert kommt nicht vom
  // Client: Er wäre dort eine Annahme über einen Stand, den zwei offene
  // Fenster längst geändert haben können.
  const { count, error: zaehlfehler } = await supabase
    .from('trip_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', punkt.tripId)
    .eq('day_id', punkt.dayId)

  if (zaehlfehler) return { ok: false, meldung: meldungAus(zaehlfehler) }

  const { error, status } = await supabase.from('trip_items').insert({
    // `user_id` fehlt bewusst: `default auth.uid()` setzt sie, und die
    // INSERT-Policy verlangt genau diesen Wert. Sie mitzuschicken wäre die
    // Einladung, sie irgendwann aus einem Formularfeld zu nehmen.
    trip_id: punkt.tripId,
    day_id: punkt.dayId,
    kind: punkt.kind,
    title: punkt.title,
    note: punkt.note,
    position: Math.min((count ?? 0) + 1, 500),
    starts_at: punkt.startsAt,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${punkt.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}

const kennungenSchema = z.object({
  tripId: z.string().uuid(),
  itemId: z.string().uuid(),
})

const buchungsstatusSchema = kennungenSchema.extend({
  gebucht: z.boolean(),
})

/** Nimmt einen Planpunkt aus einer Reise im Konto. */
export async function planpunktEntfernen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = kennungenSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: 'Dieser Planpunkt ist unbekannt.' }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const { error, status } = await supabase
    .from('trip_items')
    .delete()
    .eq('id', geprueft.data.itemId)
    .eq('trip_id', geprueft.data.tripId)

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}

/**
 * Setzt oder korrigiert den manuellen Buchungsstatus eines Flug-, Stay-, Transfer- oder Mietwagen-Punkts.
 *
 * Kein Service-Role-Weg. RLS prüft das Eigentum. Die Quelle ist immer `user`;
 * der Client kann keine Provider-Bestätigung behaupten.
 */
export async function planpunktBuchungsstatusSetzen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = buchungsstatusSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: 'Dieser Planpunkt ist unbekannt.' }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const { data, error: lesefehler, status: lesestatus } = await supabase
    .from('trip_items')
    .select('id, kind')
    .eq('id', geprueft.data.itemId)
    .eq('trip_id', geprueft.data.tripId)
    .maybeSingle()

  if (lesefehler) return { ok: false, meldung: meldungAus(lesefehler, lesestatus) }
  if (!data) return { ok: false, meldung: 'Dieser Planpunkt ist unbekannt.' }
  if (data.kind !== 'flight' && data.kind !== 'stay' && data.kind !== 'transfer' && data.kind !== 'rental_car') {
    return { ok: false, meldung: 'Nur Flüge, Unterkünfte, Verbindungen und Mietwagen können als gebucht markiert werden.' }
  }

  const gebucht = geprueft.data.gebucht
  const { error, status } = await supabase
    .from('trip_items')
    .update({
      booking_status: gebucht ? 'booked' : 'unconfirmed',
      booking_source: gebucht ? 'user' : null,
      booking_confirmed_at: gebucht ? new Date().toISOString() : null,
    })
    .eq('id', geprueft.data.itemId)
    .eq('trip_id', geprueft.data.tripId)

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: null }
}

/**
 * Löscht eine Reise des angemeldeten Kontos.
 *
 * Etappen, Tage und Planpunkte gehen über `on delete cascade` mit. Das ist die
 * Erwartung an eine gelöschte Reise und nicht eine Abkürzung: Ein Reisetag ohne
 * seine Reise hat keine Bedeutung.
 */
export async function reiseLoeschen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = z.string().uuid().safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: 'Diese Reise ist unbekannt.' }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const { error, status } = await supabase.from('trips').delete().eq('id', geprueft.data)

  if (error) return { ok: false, meldung: meldungAus(error, status) }

  revalidatePath('/reisen')
  return { ok: true, wert: null }
}
