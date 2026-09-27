// Ein PKCE-Code darf genau einmal getauscht werden.
//
// createBrowserClient setzt flowType=pkce und detectSessionInUrl=isBrowser().
// Der Konstruktor von auth-js 2.71.1 startet initialize(); liegt der Code
// zusammen mit dem Verifier schon in der Adresse, tauscht _initialize ihn
// und entfernt ihn aus der URL. exchangeCodeForSession wartet auf genau
// dieses initializePromise und tauscht danach erneut. Der zweite Tausch
// schickt einen leeren Verifier. Die Sitzung aus dem ersten Tausch bleibt
// liegen, die Oberfläche zeigt aber den Fehler – ein Neuladen findet sie
// dann ohne Code.
//
// Diese Funktion liest den Verifier, bevor der Client entsteht, und tauscht
// nur, wenn die Initialisierung den Code nicht selbst verbraucht hat.
// detectSessionInUrl bleibt an, damit die Passwort-Rücksetzung auf
// /auth/update-password weiter dem SDK gehört.

import { erlaubtesNaechstesZiel } from '@/lib/auth/naechstes-ziel'

export const PASSWORT_AKTUALISIEREN = '/auth/update-password'

export const CALLBACK_MELDUNG_UNGUELTIG =
  'Dieser Bestätigungslink ist ungültig oder wurde schon verwendet. Bitte fordere einen neuen Link an.'

export const CALLBACK_MELDUNG_NETZ =
  'Die Verbindung ist gerade fehlgeschlagen. Bitte versuche es erneut.'

export const CALLBACK_MELDUNG_LEER =
  'Dieser Link enthält keine Anmeldung. Bitte öffne den Link aus der E-Mail erneut.'

export const CALLBACK_MELDUNG_ABBRUCH =
  'Die Anmeldung konnte nicht abgeschlossen werden. Bitte fordere einen neuen Link an.'

const VERIFIER_SUFFIX = '-code-verifier'
const BASE64_PREFIX = 'base64-'

export type CallbackAbschluss =
  | { art: 'ok'; ziel: string }
  | { art: 'fehler'; meldung: string }

type FehlerMitMeldung = { message: string } | null

export type CallbackAuthClient = {
  auth: {
    initialize: () => Promise<{ error: FehlerMitMeldung }>
    exchangeCodeForSession: (code: string) => Promise<{
      data: unknown
      error: FehlerMitMeldung
    }>
    getSession: () => Promise<{
      data: { session: unknown }
      error: FehlerMitMeldung
    }>
    setSession: (session: {
      access_token: string
      refresh_token: string
    }) => Promise<{ error: FehlerMitMeldung }>
  }
}

export type CallbackAbschlussEingabe = {
  suche: string
  hash: string
  cookieHeader: string
  supabaseUrl: string
  hrefLesen: () => string
  adresseSchreiben: (href: string) => void
  client: () => CallbackAuthClient
}

const laeufe = new Map<string, Promise<CallbackAbschluss>>()

function sicherDekodieren(wert: string): string {
  try {
    return decodeURIComponent(wert)
  } catch {
    return wert
  }
}

function cookieWerte(header: string): Map<string, string> {
  const werte = new Map<string, string>()
  for (const teil of header.split(';')) {
    const stueck = teil.trim()
    if (!stueck) continue
    const eq = stueck.indexOf('=')
    if (eq <= 0) continue
    const name = sicherDekodieren(stueck.slice(0, eq).trim())
    const wert = sicherDekodieren(stueck.slice(eq + 1).trim())
    if (name) werte.set(name, wert)
  }
  return werte
}

function teileZusammen(werte: Map<string, string>, schluessel: string): string | null {
  const direkt = werte.get(schluessel)
  if (direkt) return direkt
  const stuecke: string[] = []
  for (let i = 0; ; i += 1) {
    const teil = werte.get(`${schluessel}.${i}`)
    if (!teil) break
    stuecke.push(teil)
  }
  return stuecke.length > 0 ? stuecke.join('') : null
}

function textAusBase64Url(wert: string): string | null {
  try {
    const normalisiert = wert.replace(/-/g, '+').replace(/_/g, '/')
    const aufgefuellt = normalisiert.padEnd(Math.ceil(normalisiert.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(aufgefuellt), (zeichen) => zeichen.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function pkceVerifierSchluessel(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname.split('.')[0]
    if (!host) return null
    return `sb-${host}-auth-token${VERIFIER_SUFFIX}`
  } catch {
    return null
  }
}

/** Liest den PKCE-Verifier, wie ihn @supabase/ssr in Cookies ablegt. */
export function liesPkceCodeVerifier(cookieHeader: string, supabaseUrl: string): string | null {
  const schluessel = pkceVerifierSchluessel(supabaseUrl)
  if (!schluessel) return null
  const roh = teileZusammen(cookieWerte(cookieHeader), schluessel)
  if (!roh) return null
  const dekodiert = roh.startsWith(BASE64_PREFIX)
    ? textAusBase64Url(roh.slice(BASE64_PREFIX.length))
    : roh
  if (!dekodiert) return null
  try {
    const geparst: unknown = JSON.parse(dekodiert)
    return typeof geparst === 'string' && geparst ? geparst : null
  } catch {
    return dekodiert || null
  }
}

function istPasswortWiederherstellung(verifier: string | null): boolean {
  if (!verifier) return false
  return verifier.split('/')[1] === 'PASSWORD_RECOVERY'
}

function suchParameter(suche: string): URLSearchParams {
  const roh = suche.startsWith('?') ? suche.slice(1) : suche
  return new URLSearchParams(roh)
}

function hashParameter(hash: string): URLSearchParams {
  const roh = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(roh)
}

function codeAusSuche(suche: string): string | null {
  const code = suchParameter(suche).get('code')
  return code && code.trim() ? code : null
}

function codeAusHref(href: string): string | null {
  try {
    const code = new URL(href).searchParams.get('code')
    return code && code.trim() ? code : null
  } catch {
    return null
  }
}

function ohneAuthCode(href: string): string | null {
  try {
    const url = new URL(href)
    if (!url.searchParams.has('code')) return null
    url.searchParams.delete('code')
    return url.toString()
  } catch {
    return null
  }
}

function sitzungDa(session: unknown): boolean {
  return Boolean(session && typeof session === 'object')
}

function umleitungsart(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('redirectType' in data)) return null
  const wert = (data as { redirectType?: unknown }).redirectType
  return typeof wert === 'string' ? wert : null
}

function meldungFuerFehler(message: string | undefined): string {
  const text = (message ?? '').toLowerCase()
  if (
    text.includes('failed to fetch') ||
    text.includes('network') ||
    text.includes('fetch') ||
    text.includes('load failed') ||
    text.includes('timeout') ||
    text.includes('econnrefused') ||
    text.includes('enotfound')
  ) {
    return CALLBACK_MELDUNG_NETZ
  }
  return CALLBACK_MELDUNG_UNGUELTIG
}

function fehler(meldung: string): CallbackAbschluss {
  return { art: 'fehler', meldung }
}

function zielNachErfolg(wiederherstellung: boolean, umleitung: string | null, next: string): string {
  if (wiederherstellung || umleitung === 'PASSWORD_RECOVERY') return PASSWORT_AKTUALISIEREN
  return next
}

function codeAusAdresseEntfernen(eingabe: CallbackAbschlussEingabe) {
  const bereinigt = ohneAuthCode(eingabe.hrefLesen())
  if (bereinigt) eingabe.adresseSchreiben(bereinigt)
}

async function ausfuehren(eingabe: CallbackAbschlussEingabe): Promise<CallbackAbschluss> {
  try {
    const verifier = liesPkceCodeVerifier(eingabe.cookieHeader, eingabe.supabaseUrl)
    const wiederherstellung = istPasswortWiederherstellung(verifier)
    const suche = suchParameter(eingabe.suche)
    const hash = hashParameter(eingabe.hash)
    const next = erlaubtesNaechstesZiel(suche.get('next'))
    const code = codeAusSuche(eingabe.suche)

    if (hash.get('error') || hash.get('error_description') || hash.get('error_code')) {
      return fehler(CALLBACK_MELDUNG_ABBRUCH)
    }

    if (suche.get('error') || suche.get('error_description') || suche.get('error_code')) {
      return fehler(CALLBACK_MELDUNG_ABBRUCH)
    }

    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')
    if (accessToken && refreshToken) {
      const client = eingabe.client()
      const gesetzt = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (gesetzt.error) return fehler(meldungFuerFehler(gesetzt.error.message))
      const ziel = hash.get('type') === 'recovery'
        ? PASSWORT_AKTUALISIEREN
        : zielNachErfolg(wiederherstellung, null, next)
      return { art: 'ok', ziel }
    }

    if (code) {
      const client = eingabe.client()
      const init = await client.auth.initialize()
      const verbraucht = codeAusHref(eingabe.hrefLesen()) !== code

      if (verbraucht) {
        if (init.error) return fehler(meldungFuerFehler(init.error.message))
        const { data, error } = await client.auth.getSession()
        if (error || !sitzungDa(data.session)) return fehler(CALLBACK_MELDUNG_ABBRUCH)
        codeAusAdresseEntfernen(eingabe)
        return { art: 'ok', ziel: zielNachErfolg(wiederherstellung, null, next) }
      }

      if (init.error) return fehler(meldungFuerFehler(init.error.message))

      const getauscht = await client.auth.exchangeCodeForSession(code)
      if (getauscht.error || !sitzungDa(sitzungAusTausch(getauscht.data))) {
        return fehler(meldungFuerFehler(getauscht.error?.message))
      }
      codeAusAdresseEntfernen(eingabe)
      return {
        art: 'ok',
        ziel: zielNachErfolg(wiederherstellung, umleitungsart(getauscht.data), next),
      }
    }

    const client = eingabe.client()
    const { data, error } = await client.auth.getSession()
    if (error) return fehler(meldungFuerFehler(error.message))
    if (sitzungDa(data.session)) return { art: 'ok', ziel: next }
    return fehler(CALLBACK_MELDUNG_LEER)
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined
    return fehler(meldungFuerFehler(message))
  }
}

function sitzungAusTausch(data: unknown): unknown {
  if (!data || typeof data !== 'object' || !('session' in data)) return null
  return (data as { session?: unknown }).session ?? null
}

/**
 * Schliesst den Callback einmal ab. Gleiche Adresse im selben Dokument teilt
 * sich einen Lauf, damit ein erneutes Mounten den Code nicht ein zweites Mal
 * verbraucht.
 */
export function schliesseAuthCallbackAb(eingabe: CallbackAbschlussEingabe): Promise<CallbackAbschluss> {
  const schluessel = `${eingabe.supabaseUrl}\n${eingabe.suche}\n${eingabe.hash}`
  const vorhanden = laeufe.get(schluessel)
  if (vorhanden) return vorhanden
  const lauf = ausfuehren(eingabe)
  laeufe.set(schluessel, lauf)
  return lauf
}
