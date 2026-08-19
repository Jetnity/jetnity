// lib/trips/anlegen.ts
//
// Die eine Stelle, an der eine Reise im Konto entsteht.
//
// Sie stand bis Phase 2.1 als private Funktion in `lib/trips/aktionen.ts`. Mit
// dem Reisevorschlag kam ein zweiter Aufrufer dazu, und ein zweiter Aufrufer
// hätte drei Möglichkeiten gehabt: seinen eigenen `rpc('reise_anlegen')`-Aufruf,
// einen Umweg über eine fremd benannte Action, oder diese Datei. Die ersten
// beiden hätten die Prüfung der Nutzlast oder die Übersetzung der
// Datenbankfehler an einer Stelle wiederholt – oder vergessen.
//
// Hier liegt deshalb, was jeder Schreibweg braucht: die geprüfte Identität, die
// Übersetzung einer Ablehnung in einen Satz, und der Aufruf selbst.
//
// `auth.getUser()` und nicht `auth.getSession()`: Letzteres gibt auf dem Server
// nur den Cookie wieder, ohne die Signatur zu prüfen.

import 'server-only'

import { revalidatePath } from 'next/cache'

import { problemAus } from '@/lib/api/datenbank-lesen'
import { createServerActionClient } from '@/lib/supabase/server'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import type { Json } from '@/types/supabase'

export type Aktionsergebnis<Wert> = { ok: true; wert: Wert } | { ok: false; meldung: string }

export const NICHT_ANGEMELDET =
  'Für diesen Schritt ist eine Anmeldung erforderlich. Bitte melde dich erneut an.'

/**
 * Die geprüfte Identität des Aufrufers.
 *
 * `auth.getUser()` fragt den Auth-Server und prüft damit das Token. Ohne diesen
 * Weg wäre die Kennung eine Behauptung aus einem Cookie.
 */
export async function konto() {
  const supabase = createServerActionClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return { supabase, benutzerId: null as string | null }
  return { supabase, benutzerId: data.user.id }
}

/** Übersetzt eine Ablehnung der Datenbank in einen Satz, den Reisende lesen können. */
export function meldungAus(
  fehler: { message: string; code?: string | null },
  status?: number,
): string {
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
 * Schickt einen geprüften Reisegraphen an `public.reise_anlegen()`.
 *
 * Idempotent über `client_ref`: Derselbe Aufruf ergibt dieselbe Reise
 * (`unique (user_id, client_ref)`). Das gilt für das Formular unter /planen, für
 * einen übernommenen Gastentwurf und für einen freigegebenen Reisevorschlag –
 * eine Persistenz, drei Anlässe.
 */
export async function reiseAusNutzlastAnlegen(
  nutzlast: ReiseNutzlast,
): Promise<Aktionsergebnis<string>> {
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
      meldung:
        'Die Reise wurde angelegt, aber ohne Kennung gemeldet. Bitte lade „Meine Reisen" neu.',
    }
  }

  revalidatePath('/reisen')
  return { ok: true, wert: data }
}
