// lib/account/besuche-aktionen.ts
//
// Schreibweg der bestätigten Besuchshistorie. Authenticated-Session, kein
// Service-Role, keine Fremdkonto-Sicht.
//
// Geschrieben wird ausschliesslich über die Datenbankfunktionen
// `account_visit_bestaetigen`, `account_visit_aendern` und
// `account_visit_widerrufen`. Diese Datei setzt den Wahrheitsvertrag also
// nicht durch, sie ruft ihn auf: `authenticated` hat auf `account_visits`
// kein INSERT, UPDATE oder DELETE.
//
// Der Unterschied ist nicht akademisch. Solange die Tabelle direkte
// Schreibrechte hatte, war jede Prüfung hier nur eine Bitte: ein angemeldeter
// Client konnte dieselbe Zeile über PostgREST selbst schreiben, mit erfundenem
// Ortsnamen, erfundenem Land und einem Besuchsdatum von morgen – und RLS hätte
// nichts dagegen gehabt, weil das Eigentum ja stimmte. Der Vertrag steht
// deshalb in der Datenbank, und was hier bleibt, sind zwei Dinge: früh und
// verständlich ablehnen, was ohnehin abgelehnt würde, und die Fehlerhinweise
// der Datenbank in Sätze übersetzen.
//
// Keine Zeile in `trips` oder `trip_stages` wird angefasst: eine bestätigte
// Vergangenheit verändert keine geplante Reise.

'use server'

import { revalidatePath } from 'next/cache'

import {
  BESUCH_MELDUNG,
  besuchAenderungLesen,
  besuchAnlageLesen,
  besuchLoeschungLesen,
  type GeprueftesZiel,
} from '@/lib/account/besuche-eingabe'
import { createServerActionClient } from '@/lib/supabase/server'

type Aktionsergebnis<Wert> = { ok: true; wert: Wert } | { ok: false; meldung: string }

const SCHREIBFEHLER = 'Dieser Besuch konnte nicht gespeichert werden.'
const SCHREIBFEHLER_AUSFALL =
  'Dein Besuch konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.'

/**
 * Die Hinweise, die der Schreibvertrag der Datenbank mitschickt.
 *
 * Die Datenbank liefert `hint`, nicht Prosa. So bleibt die angezeigte Meldung
 * dieselbe, egal ob die Ablehnung hier oder dort entstanden ist, und es wird
 * keine Datenbankmeldung an den Browser durchgereicht.
 */
const HINWEIS_MELDUNG: Readonly<Record<string, string>> = {
  nicht_angemeldet: BESUCH_MELDUNG.nichtAngemeldet,
  ohne_ziel: BESUCH_MELDUNG.ohneZiel,
  ort_unbekannt: BESUCH_MELDUNG.ortUnbekannt,
  land_unbekannt: BESUCH_MELDUNG.landUnbekannt,
  datum_ungueltig: BESUCH_MELDUNG.datumUngueltig,
  datum_zukunft: BESUCH_MELDUNG.datumZukunft,
  jahr_bereich: BESUCH_MELDUNG.jahrBereich,
  grenze: BESUCH_MELDUNG.grenze,
}

type Schreibfehler = {
  message: string
  code?: string | null
  hint?: string | null
}

function schreibmeldung(fehler: Schreibfehler, status?: number): { ok: false; meldung: string } {
  const bekannt = fehler.hint ? HINWEIS_MELDUNG[fehler.hint] : undefined
  if (bekannt) return { ok: false, meldung: bekannt }
  if (status === 0 || (fehler.code ?? '').startsWith('08') || (fehler.code ?? '').startsWith('57')) {
    return { ok: false, meldung: SCHREIBFEHLER_AUSFALL }
  }
  return { ok: false, meldung: SCHREIBFEHLER }
}

async function konto() {
  const supabase = await createServerActionClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { supabase, benutzerId: null as string | null }
  return { supabase, benutzerId: data.user.id }
}

/**
 * Die Argumente des Schreibvertrags.
 *
 * Nur Referenzen und Zahlen. Kein Ortsname, kein Land zu einem Ort, keine
 * Koordinate – die holt die Datenbank aus `public.places`.
 */
function vertragsargumente(ziel: GeprueftesZiel) {
  // Weggelassen statt `null`: die Funktion hat für jedes dieser Argumente den
  // Vorgabewert `null`, und ein fehlendes Argument ist dasselbe wie ein
  // ausdrücklich unbekanntes. Die erzeugten Typen kennen die Argumente
  // deshalb als optional.
  return {
    _place_id: ziel.placeId ?? undefined,
    _country_code: ziel.countryCode ?? undefined,
    _jahr: ziel.jahr ?? undefined,
    _monat: ziel.monat ?? undefined,
    _tag: ziel.tag ?? undefined,
  }
}

function pfadeErneuern() {
  revalidatePath('/account/welt')
  revalidatePath('/account')
}

export async function besuchBestaetigen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = besuchAnlageLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: BESUCH_MELDUNG.nichtAngemeldet }

  const { error, status } = await supabase.rpc(
    'account_visit_bestaetigen',
    vertragsargumente(geprueft.wert),
  )

  if (error) return schreibmeldung(error, status)
  pfadeErneuern()
  return { ok: true, wert: null }
}

export async function besuchAendern(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = besuchAenderungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: BESUCH_MELDUNG.nichtAngemeldet }

  // Die Funktion filtert selbst auf das eigene Konto und liefert `null`, wenn
  // die Zeile nicht existiert oder einem anderen gehört. Beides ist für den
  // Aufrufer dieselbe Auskunft, und keine davon verrät, welche es war.
  const { data, error, status } = await supabase.rpc('account_visit_aendern', {
    _id: geprueft.wert.id,
    ...vertragsargumente(geprueft.wert),
  })

  if (error) return schreibmeldung(error, status)
  if (!data) return { ok: false, meldung: BESUCH_MELDUNG.nichtGefunden }
  pfadeErneuern()
  return { ok: true, wert: null }
}

export async function besuchWiderrufen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = besuchLoeschungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: BESUCH_MELDUNG.nichtAngemeldet }

  const { data, error, status } = await supabase.rpc('account_visit_widerrufen', {
    _id: geprueft.wert.id,
  })

  if (error) return schreibmeldung(error, status)
  if (!data) return { ok: false, meldung: BESUCH_MELDUNG.nichtGefunden }
  pfadeErneuern()
  return { ok: true, wert: null }
}
