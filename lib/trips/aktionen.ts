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

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { problemAus } from '@/lib/api/datenbank-lesen'
import { createServerActionClient } from '@/lib/supabase/server'
import {
  ersteMeldung,
  neuePlanpunktNutzlastSchema,
  neueReiseSchema,
  reiseNutzlastSchema,
  type ReiseNutzlast,
} from '@/lib/trips/schema'
import { reisetageBauen } from '@/lib/trips/tage'
import type { Json } from '@/types/supabase'

export type Aktionsergebnis<Wert> =
  | { ok: true; wert: Wert }
  | { ok: false; meldung: string }

const NICHT_ANGEMELDET =
  'Für diesen Schritt ist eine Anmeldung erforderlich. Bitte melde dich erneut an.'

/**
 * Die geprüfte Identität des Aufrufers.
 *
 * `auth.getUser()` fragt den Auth-Server und prüft damit das Token. Ohne diesen
 * Weg wäre die Kennung eine Behauptung aus einem Cookie.
 */
async function konto() {
  const supabase = createServerActionClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return { supabase, benutzerId: null as string | null }
  return { supabase, benutzerId: data.user.id }
}

/** Übersetzt eine Ablehnung der Datenbank in einen Satz, den Reisende lesen können. */
function meldungAus(fehler: { message: string; code?: string | null }, status?: number): string {
  const problem = problemAus({ data: null, error: fehler, status }, fehler)

  if (problem.status === 503) {
    return 'Die Reise konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.'
  }

  // Die Fehlermeldungen von `public.reise_anlegen()` sind für Reisende
  // geschrieben („Eine Reise trägt höchstens 366 Tage."). Ein SQLSTATE einer
  // verletzten Prüfbedingung ist es nicht – dafür der allgemeine Satz.
  return fehler.code === 'P0001' || fehler.code === '22023' || fehler.code === '53400'
    ? fehler.message
    : 'Die Reise konnte nicht gespeichert werden. Bitte prüfe deine Angaben.'
}

/**
 * Schickt einen Reisegraphen an `public.reise_anlegen()`.
 *
 * Die eine Stelle, an der eine Reise entsteht – gleich ob sie aus dem Formular
 * unter /planen kommt oder als Gastentwurf aus dem Browser. Zwei Wege dorthin
 * wären zwei Stellen, an denen die Prüfung der Nutzlast fehlen kann.
 */
async function anlegen(nutzlast: ReiseNutzlast): Promise<Aktionsergebnis<string>> {
  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  // Der geprüfte Reisegraph ist strukturell JSON; `ReiseNutzlast` sagt das
  // genauer als `Json`, nur beweist es der Typprüfung nichts.
  const { data, error, status } = await supabase.rpc('reise_anlegen', {
    _reise: nutzlast as unknown as Json,
  })

  if (error) return { ok: false, meldung: meldungAus(error, status) }
  if (typeof data !== 'string' || !data) {
    return {
      ok: false,
      meldung: 'Die Reise wurde angelegt, aber ohne Kennung gemeldet. Bitte lade „Meine Reisen" neu.',
    }
  }

  revalidatePath('/reisen')
  return { ok: true, wert: data }
}

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

  return anlegen({
    client_ref: reise.clientRef,
    title: reise.title,
    origin: reise.origin,
    start_date: reise.startDate,
    end_date: reise.endDate,
    travellers: reise.travellers,
    currency: reise.currency,
    budget_amount: reise.budgetAmount,
    pace: reise.pace,
    interests: reise.interests,
    travel_wish: reise.travelWish,
    stages: [
      {
        position: 1,
        name: reise.destination,
        country_code: null,
        arrival_date: reise.startDate,
        departure_date: reise.endDate,
      },
    ],
    days: reisetageBauen(reise.startDate, reise.endDate).map((tag) => ({
      day_index: tag.dayIndex,
      day_date: tag.dayDate,
      title: null,
      items: [],
    })),
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
export async function gastreiseUebernehmen(nutzlast: unknown): Promise<Aktionsergebnis<string>> {
  const geprueft = reiseNutzlastSchema.safeParse(nutzlast)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  return anlegen(geprueft.data)
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
