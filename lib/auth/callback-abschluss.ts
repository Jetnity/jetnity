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
// Besitz und Aufräumen:
// - Ein laufender Versuch gehört zu seinem eigenen Code oder Hash. Der
//   Schlüssel ist ein Fingerabdruck und wird mit dem Abschluss verworfen.
//   Dieselbe Adresse im selben Moment teilt sich den Lauf. Ein anderer Link
//   nicht. Ein älterer Abschluss löscht keinen neueren Code.
// - Wiederherstellung gehört zur Sitzung, die dieser Versuch erzeugt hat.
//   Das gilt, wenn der Client auf /auth/callback entstand, und auch, wenn ein
//   schon offener Client den Tausch selbst ausführt oder ein Hash
//   type=recovery setzt. Dieselbe Sitzung bleibt auf /auth/update-password.
//   Abmelden oder eine andere Sitzung verwirft sie. Die Passwortseite merkt
//   das nicht.
// - Ein expliziter Fehler in Adresse oder Hash ist kein Erfolg desselben
//   Links. Er wird beantwortet, bevor ein laufender Tausch übernommen wird.
// detectSessionInUrl bleibt an.

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

type CallbackLage = {
  wiederherstellung: boolean
  codeFinger: string | null
  sitzungsFinger: string | null
}

/** Fingerabdrücke, keine Codes, Verifier oder Tokens. */
const lagen = new Map<string, CallbackLage>()
const verknuepfteClients = new WeakSet<object>()

function fingerabdruck(wert: string): string {
  let a = 0x811c9dc5
  let b = 0x811c9dc5 ^ 0x01000193
  for (let i = 0; i < wert.length; i += 1) {
    const zeichencode = wert.charCodeAt(i)
    a ^= zeichencode
    a = Math.imul(a, 0x01000193)
    b ^= zeichencode + i
    b = Math.imul(b, 0x01000193)
  }
  return `${wert.length.toString(16)}:${(a >>> 0).toString(16)}:${(b >>> 0).toString(16)}`
}

function istCallbackPfad(href: string): boolean {
  try {
    return new URL(href).pathname === '/auth/callback'
  } catch {
    return false
  }
}

function sitzungsFinger(session: unknown): string | null {
  if (!session || typeof session !== 'object' || !('access_token' in session)) return null
  const token = (session as { access_token?: unknown }).access_token
  return typeof token === 'string' && token ? fingerabdruck(token) : null
}

function leereLage(): CallbackLage {
  return { wiederherstellung: false, codeFinger: null, sitzungsFinger: null }
}

/**
 * Vor createBrowserClient aufrufen. Nur ein Callback-Versuch mit
 * Wiederherstellungs-Verifier wird gemerkt, und nur als Fingerabdruck des
 * Codes. Die Passwortseite bleibt aussen vor.
 */
export function merkeCallbackLage(cookieHeader: string, href: string, supabaseUrl: string): void {
  const bisher = lagen.get(supabaseUrl)
  if (!istCallbackPfad(href)) {
    if (!bisher) lagen.set(supabaseUrl, leereLage())
    return
  }
  const code = codeAusHref(href)
  const wiederherstellung = Boolean(code) && istPasswortWiederherstellung(
    liesPkceCodeVerifier(cookieHeader, supabaseUrl),
  )
  if (!code && !wiederherstellung && bisher) return
  lagen.set(supabaseUrl, {
    wiederherstellung,
    codeFinger: code ? fingerabdruck(code) : null,
    sitzungsFinger: null,
  })
}

function verwerfeWiederherstellung(supabaseUrl: string): void {
  const lage = lagen.get(supabaseUrl)
  if (!lage?.wiederherstellung && !lage?.sitzungsFinger) return
  lagen.set(supabaseUrl, leereLage())
}

function verwerfeDiesenVersuch(supabaseUrl: string, code: string | null): void {
  const lage = lagen.get(supabaseUrl)
  if (!lage?.wiederherstellung) return
  if (code && lage.codeFinger && fingerabdruck(code) !== lage.codeFinger) return
  verwerfeWiederherstellung(supabaseUrl)
}

function bindWiederherstellung(supabaseUrl: string, session: unknown, code: string | null): void {
  const finger = sitzungsFinger(session)
  if (!finger) return
  const bisher = lagen.get(supabaseUrl)
  lagen.set(supabaseUrl, {
    wiederherstellung: true,
    codeFinger: code ? fingerabdruck(code) : bisher?.codeFinger ?? null,
    sitzungsFinger: finger,
  })
}

type SitzungsClient = {
  auth: {
    onAuthStateChange: (
      callback: (event: string, session: unknown) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } }
  }
}

/** Hängt die Wiederherstellung an die Sitzung dieses Clients. */
export function verknuepfeCallbackSitzung(supabaseUrl: string, client: SitzungsClient): void {
  if (verknuepfteClients.has(client)) return
  verknuepfteClients.add(client)
  client.auth.onAuthStateChange((event, session) => {
    const lage = lagen.get(supabaseUrl)
    if (!lage?.wiederherstellung) return
    if (event === 'SIGNED_OUT' || !sitzungDa(session)) {
      verwerfeWiederherstellung(supabaseUrl)
      return
    }
    const finger = sitzungsFinger(session)
    if (!finger) return
    if (event === 'TOKEN_REFRESHED') {
      lage.sitzungsFinger = finger
      return
    }
    if (!lage.sitzungsFinger) {
      lage.sitzungsFinger = finger
      return
    }
    if (lage.sitzungsFinger !== finger) verwerfeWiederherstellung(supabaseUrl)
  })
}

/** Nur für den Nachweis, dass abgeschlossene Läufe nicht liegen bleiben. */
export function offeneCallbackLaeufe(): number {
  return laeufe.size
}

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

function dieserCode(supabaseUrl: string, code: string): boolean {
  const lage = lagen.get(supabaseUrl)
  return Boolean(lage?.codeFinger && lage.codeFinger === fingerabdruck(code))
}

function zielNachErfolg(
  eingabe: CallbackAbschlussEingabe,
  verifier: string | null,
  umleitung: string | null,
  next: string,
  session: unknown,
  code: string | null,
): string {
  if (istPasswortWiederherstellung(verifier) || umleitung === 'PASSWORD_RECOVERY') {
    bindWiederherstellung(eingabe.supabaseUrl, session, code)
    return PASSWORT_AKTUALISIEREN
  }
  const lage = lagen.get(eingabe.supabaseUrl)
  const finger = sitzungsFinger(session)
  if (lage?.wiederherstellung && finger && lage.sitzungsFinger === finger) return PASSWORT_AKTUALISIEREN
  return next
}

function codeAusAdresseEntfernen(eingabe: CallbackAbschlussEingabe, code: string) {
  if (codeAusHref(eingabe.hrefLesen()) !== code) return
  const bereinigt = ohneAuthCode(eingabe.hrefLesen())
  if (bereinigt) eingabe.adresseSchreiben(bereinigt)
}

async function ausfuehren(eingabe: CallbackAbschlussEingabe): Promise<CallbackAbschluss> {
  try {
    const verifier = liesPkceCodeVerifier(eingabe.cookieHeader, eingabe.supabaseUrl)
    const suche = suchParameter(eingabe.suche)
    const hash = hashParameter(eingabe.hash)
    const next = erlaubtesNaechstesZiel(suche.get('next'))
    const code = codeAusSuche(eingabe.suche)

    if (hash.get('error') || hash.get('error_description') || hash.get('error_code')) {
      verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
      return fehler(CALLBACK_MELDUNG_ABBRUCH)
    }

    if (suche.get('error') || suche.get('error_description') || suche.get('error_code')) {
      verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
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
      if (hash.get('type') === 'recovery') {
        bindWiederherstellung(eingabe.supabaseUrl, { access_token: accessToken }, null)
        return { art: 'ok', ziel: PASSWORT_AKTUALISIEREN }
      }
      return { art: 'ok', ziel: zielNachErfolg(eingabe, verifier, null, next, null, null) }
    }

    if (code) {
      const client = eingabe.client()
      const init = await client.auth.initialize()
      const jetzt = codeAusHref(eingabe.hrefLesen())
      const ersetzt = Boolean(jetzt && jetzt !== code)
      const weg = jetzt !== code
      const unserCode = dieserCode(eingabe.supabaseUrl, code)

      if (unserCode && weg) {
        if (init.error) {
          verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
          return fehler(meldungFuerFehler(init.error.message))
        }
        const { data, error } = await client.auth.getSession()
        if (error) return fehler(meldungFuerFehler(error.message))
        if (!sitzungDa(data.session)) {
          verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
          return fehler(CALLBACK_MELDUNG_ABBRUCH)
        }
        if (!ersetzt) codeAusAdresseEntfernen(eingabe, code)
        return { art: 'ok', ziel: zielNachErfolg(eingabe, verifier, null, next, data.session, code) }
      }

      if (init.error) {
        verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
        return fehler(meldungFuerFehler(init.error.message))
      }

      const getauscht = await client.auth.exchangeCodeForSession(code)
      if (getauscht.error || !sitzungDa(sitzungAusTausch(getauscht.data))) {
        verwerfeDiesenVersuch(eingabe.supabaseUrl, code)
        return fehler(meldungFuerFehler(getauscht.error?.message))
      }
      codeAusAdresseEntfernen(eingabe, code)
      return {
        art: 'ok',
        ziel: zielNachErfolg(
          eingabe,
          verifier,
          umleitungsart(getauscht.data),
          next,
          sitzungAusTausch(getauscht.data),
          code,
        ),
      }
    }

    const client = eingabe.client()
    const init = await client.auth.initialize()
    if (init.error) {
      verwerfeWiederherstellung(eingabe.supabaseUrl)
      return fehler(meldungFuerFehler(init.error.message))
    }
    const { data, error } = await client.auth.getSession()
    if (error) return fehler(meldungFuerFehler(error.message))
    if (!sitzungDa(data.session)) {
      verwerfeWiederherstellung(eingabe.supabaseUrl)
      return fehler(CALLBACK_MELDUNG_LEER)
    }
    const lage = lagen.get(eingabe.supabaseUrl)
    const finger = sitzungsFinger(data.session)
    const ersterAbschluss = Boolean(
      lage?.wiederherstellung &&
      lage.codeFinger &&
      !lage.sitzungsFinger &&
      finger &&
      !codeAusHref(eingabe.hrefLesen()),
    )
    if (ersterAbschluss) bindWiederherstellung(eingabe.supabaseUrl, data.session, null)
    return { art: 'ok', ziel: zielNachErfolg(eingabe, verifier, null, next, data.session, null) }
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined
    return fehler(meldungFuerFehler(message))
  }
}

function sitzungAusTausch(data: unknown): unknown {
  if (!data || typeof data !== 'object' || !('session' in data)) return null
  return (data as { session?: unknown }).session ?? null
}

function hatExplizitenFehler(eingabe: CallbackAbschlussEingabe): boolean {
  const suche = suchParameter(eingabe.suche)
  const hash = hashParameter(eingabe.hash)
  return Boolean(
    suche.get('error') || suche.get('error_description') || suche.get('error_code')
    || hash.get('error') || hash.get('error_description') || hash.get('error_code'),
  )
}

function versuchSchluessel(eingabe: CallbackAbschlussEingabe): string {
  const suche = suchParameter(eingabe.suche)
  const hash = hashParameter(eingabe.hash)
  const code = codeAusSuche(eingabe.suche)
  const access = hash.get('access_token')
  const refresh = hash.get('refresh_token')
  const next = erlaubtesNaechstesZiel(suche.get('next'))
  if (hatExplizitenFehler(eingabe)) return [eingabe.supabaseUrl, 'fehler', next].join('\n')
  if (code) return [eingabe.supabaseUrl, 'code', fingerabdruck(code), next].join('\n')
  if (access && refresh) {
    const art = hash.get('type') === 'recovery' ? 'recovery' : 'sonst'
    return [eingabe.supabaseUrl, 'hash', fingerabdruck(`${access}\n${refresh}`), art, next].join('\n')
  }
  return [eingabe.supabaseUrl, 'ohne', next].join('\n')
}

/**
 * Schliesst den Callback einmal ab. Nur ein noch laufender Versuch derselben
 * Form wird geteilt, damit ein erneutes Mounten den Code nicht ein zweites
 * Mal verbraucht. Nach dem Abschluss wird der Lauf verworfen.
 */
export function schliesseAuthCallbackAb(eingabe: CallbackAbschlussEingabe): Promise<CallbackAbschluss> {
  if (hatExplizitenFehler(eingabe)) return Promise.resolve(fehler(CALLBACK_MELDUNG_ABBRUCH))
  const schluessel = versuchSchluessel(eingabe)
  const vorhanden = laeufe.get(schluessel)
  if (vorhanden) return vorhanden
  const lauf = ausfuehren(eingabe).finally(() => {
    if (laeufe.get(schluessel) === lauf) laeufe.delete(schluessel)
  })
  laeufe.set(schluessel, lauf)
  return lauf
}
