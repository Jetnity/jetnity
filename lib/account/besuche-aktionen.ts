// lib/account/besuche-aktionen.ts
//
// Schreibweg der bestätigten Besuchshistorie. Authenticated-Session plus RLS,
// kein Service-Role, keine Fremdkonto-Sicht.
//
// Der Browser schickt eine Ortsreferenz oder einen Ländercode – nie einen
// Ortsnamen, nie ein Land zum Ort, nie Koordinaten. Name, Ländercode und
// Koordinaten schreibt diese Datei aus `public.places` ab. Dadurch kann kein
// Formular Geografie behaupten, und ein freier Text wird nie zu einem Ort.
//
// Keine Zeile in `trips` oder `trip_stages` wird hier angefasst: eine
// bestätigte Vergangenheit verändert keine geplante Reise.

'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  BESUCH_MELDUNG,
  besuchAenderungLesen,
  besuchAnlageLesen,
  besuchLoeschungLesen,
  type GeprueftesZiel,
} from '@/lib/account/besuche-eingabe'
import { lese } from '@/lib/api/datenbank-lesen'
import { countryCodeNormalisieren } from '@/lib/country/darstellung'
import { createServerActionClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Aktionsergebnis<Wert> = { ok: true; wert: Wert } | { ok: false; meldung: string }

type Kontoclient = SupabaseClient<Database>

/** Was tatsächlich geschrieben wird. Alles Geografische stammt aus `places`. */
type Besuchszeile = {
  place_id: string | null
  place_label: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  visited_year: number | null
  visited_month: number | null
  visited_day: number | null
}

const SCHREIBFEHLER = 'Dieser Besuch konnte nicht gespeichert werden.'
const SCHREIBFEHLER_AUSFALL =
  'Dein Besuch konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.'

function schreibmeldung(
  fehler: { message: string; code?: string | null },
  status?: number,
): { ok: false; meldung: string } {
  if (fehler.code === '23514' && fehler.message.includes('hoechstens 1000')) {
    return { ok: false, meldung: BESUCH_MELDUNG.grenze }
  }
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
 * Löst eine behauptete Ortsreferenz gegen die Jetnity-Ortsreferenz auf.
 *
 * Existiert sie nicht, wird der Besuch abgelehnt statt mit einer erfundenen
 * Geografie gespeichert. Flughäfen sind keine besuchten Orte: wer in Zürich
 * umgestiegen ist, war nicht in Zürich.
 */
async function ortAufloesen(
  supabase: Kontoclient,
  placeId: string,
): Promise<Aktionsergebnis<Besuchszeile>> {
  const gelesen = await lese<{
    id: string
    name: string
    typ: string
    country_code: string | null
    lat: number | null
    lon: number | null
  }>(() => supabase.from('places').select('id, name, typ, country_code, lat, lon').eq('id', placeId))

  if (gelesen.problem) {
    return {
      ok: false,
      meldung: gelesen.problem.status === 503 ? SCHREIBFEHLER_AUSFALL : SCHREIBFEHLER,
    }
  }

  const ort = gelesen.zeilen[0]
  if (!ort || ort.typ === 'airport') return { ok: false, meldung: BESUCH_MELDUNG.ortUnbekannt }

  const name = ort.name.trim()
  if (!name) return { ok: false, meldung: BESUCH_MELDUNG.ortUnbekannt }

  const koordinatenGueltig =
    typeof ort.lat === 'number' &&
    typeof ort.lon === 'number' &&
    Number.isFinite(ort.lat) &&
    Number.isFinite(ort.lon) &&
    ort.lat >= -90 &&
    ort.lat <= 90 &&
    ort.lon >= -180 &&
    ort.lon <= 180

  return {
    ok: true,
    wert: {
      place_id: ort.id,
      place_label: name.slice(0, 120),
      country_code: countryCodeNormalisieren(ort.country_code),
      latitude: koordinatenGueltig ? (ort.lat as number) : null,
      longitude: koordinatenGueltig ? (ort.lon as number) : null,
      visited_year: null,
      visited_month: null,
      visited_day: null,
    },
  }
}

async function zeileBauen(
  supabase: Kontoclient,
  ziel: GeprueftesZiel,
): Promise<Aktionsergebnis<Besuchszeile>> {
  const zeit = {
    visited_year: ziel.jahr,
    visited_month: ziel.monat,
    visited_day: ziel.tag,
  }

  if (ziel.placeId) {
    const ort = await ortAufloesen(supabase, ziel.placeId)
    if (!ort.ok) return ort
    return { ok: true, wert: { ...ort.wert, ...zeit } }
  }

  return {
    ok: true,
    wert: {
      place_id: null,
      place_label: null,
      country_code: ziel.countryCode,
      latitude: null,
      longitude: null,
      ...zeit,
    },
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

  const zeile = await zeileBauen(supabase, geprueft.wert)
  if (!zeile.ok) return zeile

  const { error, status } = await supabase
    .from('account_visits')
    .insert({ user_id: benutzerId, ...zeile.wert })

  if (error) return schreibmeldung(error, status)
  pfadeErneuern()
  return { ok: true, wert: null }
}

export async function besuchAendern(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = besuchAenderungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: BESUCH_MELDUNG.nichtAngemeldet }

  const zeile = await zeileBauen(supabase, geprueft.wert)
  if (!zeile.ok) return zeile

  // Kein `.eq('user_id', …)`: RLS entscheidet über das Eigentum. Ein Treffer
  // von null Zeilen heisst deshalb „nicht deiner oder nicht vorhanden“ – und
  // beides ist für den Schreibenden dieselbe Auskunft.
  const { data, error, status } = await supabase
    .from('account_visits')
    .update(zeile.wert)
    .eq('id', geprueft.wert.id)
    .select('id')

  if (error) return schreibmeldung(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: BESUCH_MELDUNG.nichtGefunden }
  pfadeErneuern()
  return { ok: true, wert: null }
}

export async function besuchWiderrufen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = besuchLoeschungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: BESUCH_MELDUNG.nichtAngemeldet }

  const { data, error, status } = await supabase
    .from('account_visits')
    .delete()
    .eq('id', geprueft.wert.id)
    .select('id')

  if (error) return schreibmeldung(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: BESUCH_MELDUNG.nichtGefunden }
  pfadeErneuern()
  return { ok: true, wert: null }
}
