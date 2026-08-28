// lib/modell/kontingent.ts
//
// Die Schranke vor dem bezahlten Aufruf – und das Protokoll danach.
//
// Beides liegt in der Datenbank (`supabase/migrations/20260818040000_modellnutzung.sql`,
// Nachtrag `20260819010000_modell_kontingent_nur_server.sql`), und zwar nicht
// aus Bequemlichkeit: Vercel startet beliebig viele Instanzen, und ein Zähler
// in einem Serverprozess kennt nur seine eigene. Die einzige Stelle, die alle
// Aufrufe sieht, ist die Datenbank. Diese Datei ist der Aufrufer, nicht die
// Durchsetzung.
//
// ---------------------------------------------------------------------------
// Wer die Funktionen aufrufen darf
// ---------------------------------------------------------------------------
//
// `anon` und `authenticated` haben kein `EXECUTE`. Ein direkter PostgREST-Aufruf
// mit dem öffentlichen Key erzeugt deshalb keine Reservierung – das war der
// Befund vor diesem Nachtrag. Erreichbar sind die beiden Funktionen nur für
// `service_role`, also nur von hier. Der Client unten hängt keine Cookies an
// und wird nicht exportiert (ADR-0032, Nachtrag ADR-0052).
//
// ---------------------------------------------------------------------------
// Die Kennung eines Gastes
// ---------------------------------------------------------------------------
//
// Ein Gast hat serverseitig bewusst keine Identität (ADR-0042). Eine Schranke
// „je Kennung“ braucht trotzdem eine, sonst gibt es für Gäste nur noch eine
// gemeinsame Zahl – und ein einzelner Gast könnte sie allein aufbrauchen.
//
// Deshalb ein Cookie: 32 Hexzeichen aus `crypto.randomUUID()`, `httpOnly`,
// `sameSite: lax`, 30 Tage. Kein Konto, kein Datensatz, keine IP-Adresse. Der
// Wert steht nirgends im Klartext: Was in `public.model_usage` landet, ist sein
// SHA-256 (ADR-0052).
//
// Der Cookie ist **nicht** signiert, und das ist kein Versäumnis. Er gewährt
// nichts – er begrenzt. Ihn zu fälschen bringt niemandem mehr als ihn zu
// löschen, und beides fängt das gemeinsame Tageskontingent der Gäste auf, das
// kleiner ist als das gesamte.

import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { problemAus } from '@/lib/api/datenbank-lesen'
import { GAST_COOKIE_VERTRAG, istGueltigeGastkennung } from '@/lib/modell/gast-cookie'
import type { Ergebnisklasse } from '@/lib/modell/konfiguration'
import type { Modellname, Tokennutzung } from '@/lib/modell/preise'
import { createServerActionClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

/** Die eine Modellfunktion dieser Phase. Dieselben Werte wie `model_usage.funktion`. */
export type Modellfunktion = 'reisevorschlag' | 'reiseaenderung'

export type Kontingentergebnis =
  | { ok: true; id: string }
  /** `meldung` ist für Reisende geschrieben; die Datenbank formuliert sie. */
  | { ok: false; meldung: string }

const AUSGELASTET =
  'Die intelligente Planung ist gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.'

const NICHT_KONFIGURIERT =
  'Die intelligente Planung ist nicht richtig konfiguriert. Bitte plane deine Reise für den Moment über das Formular.'

/**
 * Cookie-loser Dienstclient nur für die zwei Kontingent-RPCs.
 *
 * Kein Cookie-Adapter, kein Export, kein anderer Datenzugriff. Fehlt der Key,
 * ist das kein stilles Überspringen: Der Aufrufer bekommt `null` und der Weg
 * bleibt zu (AGENTS.md Regel 14 und 25).
 */
function modelldienst(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/**
 * Die Gastkennung dieses Browsers, notfalls eine neue.
 *
 * Wird auch für ein angemeldetes Konto gelesen und mitgeschickt – die Datenbank
 * verwirft sie dann, weil `_konto` vorgeht. Die Kennung hier von der
 * Anmeldung abhängig zu machen hiesse, sie zweimal zu bestimmen.
 */
async function gastkennung(): Promise<string> {
  const speicher = await cookies()
  const bestehend = speicher.get(GAST_COOKIE_VERTRAG.name)?.value?.trim()

  // Die Datenbank verlangt 16 bis 64 Zeichen. Ein Wert ausserhalb ist entweder
  // von Hand gesetzt oder aus einer früheren Fassung – in beiden Fällen wird er
  // ersetzt, statt in eine Ablehnung zu laufen.
  if (istGueltigeGastkennung(bestehend)) return bestehend

  const neu = crypto.randomUUID().replace(/-/g, '')

  speicher.set({
    name: GAST_COOKIE_VERTRAG.name,
    value: neu,
    httpOnly: GAST_COOKIE_VERTRAG.httpOnly,
    sameSite: GAST_COOKIE_VERTRAG.sameSite,
    secure: process.env.NODE_ENV === 'production',
    path: GAST_COOKIE_VERTRAG.path,
    maxAge: GAST_COOKIE_VERTRAG.maxAgeTage * 24 * 60 * 60,
  })

  return neu
}

/** Kontokennung aus der geprüften Sitzung, nicht aus dem Cookie. */
async function kontoId(): Promise<string | null> {
  const supabase = await createServerActionClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.id) return null
  return data.user.id
}

/**
 * Bucht einen Aufruf, bevor er stattfindet.
 *
 * Die Reihenfolge ist der Punkt: Erst wenn diese Funktion eine Kennung
 * geliefert hat, darf ein bezahlter Aufruf geschehen. Ein Fehlschlag – auch ein
 * technischer – ist ein Nein. Fail closed heisst hier: Wer nicht zählen kann,
 * ruft nicht auf.
 */
export async function kontingentBeanspruchen(
  funktion: Modellfunktion,
  modell: Modellname,
): Promise<Kontingentergebnis> {
  const dienst = modelldienst()
  if (!dienst) return { ok: false, meldung: NICHT_KONFIGURIERT }

  const { data, error, status } = await dienst.rpc('modell_kontingent_beanspruchen', {
    _funktion: funktion,
    _modell: modell,
    _gastkennung: await gastkennung(),
    _konto: (await kontoId()) ?? undefined,
  })

  if (error) {
    // `53400` und `22023` tragen Meldungen, die für Reisende geschrieben sind –
    // erschöpftes Kontingent, fehlende Sitzungskennung, unbekanntes Modell.
    // Alles andere ist ein Defekt oder ein Ausfall und bekommt den allgemeinen
    // Satz; die Begründung der Datenbank gehört dann nicht in den Browser.
    if (error.code === '53400' || error.code === '22023' || error.code === 'P0001') {
      return { ok: false, meldung: error.message }
    }

    const problem = problemAus({ data: null, error, status }, error)
    return {
      ok: false,
      meldung: problem.status === 503 ? AUSGELASTET : NICHT_KONFIGURIERT,
    }
  }

  if (typeof data !== 'string' || !data) return { ok: false, meldung: AUSGELASTET }

  return { ok: true, id: data }
}

/**
 * Schliesst einen gebuchten Aufruf ab: Ergebnisklasse, Tokens, Laufzeit.
 *
 * Ohne Rückgabe und ohne Wurf. Ein Aufruf ist geschehen und bezahlt; ob sein
 * Protokolleintrag vollständig wurde, darf den Vorschlag nicht verhindern. Die
 * Reservierung bleibt in diesem Fall stehen, und das ist die sichere Richtung:
 * Sie rechnet den schlechtesten Fall.
 */
export async function nutzungAbschliessen(
  id: string,
  ergebnis: Ergebnisklasse,
  nutzung: Tokennutzung | null,
  laufzeitMs: number,
): Promise<void> {
  const dienst = modelldienst()
  if (!dienst) return

  await dienst.rpc('modell_nutzung_abschliessen', {
    _id: id,
    _ergebnis: ergebnis,
    // Ohne Nutzung bleiben die Argumente weg. Die Funktion sieht dann `null` –
    // „nicht berichtet“ – und lässt den reservierten Betrag stehen, statt ihn
    // auf null zu senken.
    _eingabe_tokens: nutzung?.eingabeTokens,
    _gecachte_tokens: nutzung?.gecachteTokens,
    _ausgabe_tokens: nutzung?.ausgabeTokens,
    _laufzeit_ms: Math.max(0, Math.round(laufzeitMs)),
  })
}
