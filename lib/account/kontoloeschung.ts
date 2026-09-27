// lib/account/kontoloeschung.ts
//
// V1-Kontolöschung: Vertrag, keine Ausführung.
//
// Die privilegierte Ausführung liegt in `kontoloeschung-ausfuehren.ts` und in
// der Edge Function `account-delete-v1`. Diese Datei entscheidet nur, was
// erlaubt ist. Sie kennt keinen Service-Role-Schlüssel und kein Netzwerk.
//
// Traveller-Kontext: Das Löschen betrifft das ganze Konto. Staatsbürgerschaft,
// Dokument und Wohnsitz ändern das Ergebnis nicht und werden hier nicht erhoben.

export const KONTO_LOESCHEN_PHRASE = 'KONTO LÖSCHEN'

export const KONTO_LOESCHUNG_FUNKTION = 'account-delete-v1'

/** Bewusst leer. Eine spätere Nutzer-Upload-Fläche muss sich hier eintragen, bevor sie live geht. */
export const KONTO_SPEICHER_FLAECHEN = [] as const

export type KontoSpeicherFlaeche = {
  bucket: string
  prefix: string
}

export const KONTO_LOESCHUNG_CODES = [
  'nicht_angemeldet',
  'ziel_nicht_erlaubt',
  'ungueltig',
  'bestaetigung_falsch',
  'passwort_fehlt',
  'passwort_falsch',
  'identitaet_weicht_ab',
  'nur_oauth',
  'nicht_unterstuetzt',
  'aal2_erforderlich',
  'aal_unbekannt',
  'faktoren_unlesbar',
  'speicher_blockiert',
  'speicher_unbekannt',
  'loeschung_fehlgeschlagen',
  'nicht_verfuegbar',
  'methode',
] as const

export type KontoLoeschungCode = (typeof KONTO_LOESCHUNG_CODES)[number]

export type KontoLoeschungIdentitaet = {
  id: string
  email: string | null
  anbieter: readonly string[]
  aal: 'aal1' | 'aal2' | null
  verifizierteTotp: number
}

export type IdentitaetPruefung =
  | { art: 'ok'; identitaet: KontoLoeschungIdentitaet }
  | { art: 'keine_sitzung' }
  | { art: 'faktoren_unlesbar' }
  | { art: 'fehler' }

export type PasswortBeweis =
  | { art: 'ok'; benutzerId: string }
  | { art: 'falsch' }
  | { art: 'fehler' }

export type SpeicherLoeschung = { art: 'geleert' } | { art: 'unbekannt' } | { art: 'fehler' }

export type AuthLoeschung =
  | { art: 'geloescht' }
  | { art: 'nicht_gefunden' }
  | { art: 'speicher_blockiert' }
  | { art: 'fehler' }

export type EreignisLoeschung = { art: 'entfernt' } | { art: 'fehler' }

const ERLAUBTE_FELDER = new Set(['confirmation', 'password'])

const VERBOTENE_AUTORITAET = new Set([
  'user_id',
  'userid',
  'user',
  'email',
  'role',
  'account_id',
  'accountid',
  'target',
  'sub',
  'id',
  'uid',
  'factor_id',
  'factorid',
  'challenge_id',
  'challengeid',
  'aal',
  'authorization',
  'token',
  'access_token',
  'refresh_token',
])

const OAUTH_ANBIETER = new Set([
  'google',
  'apple',
  'github',
  'facebook',
  'azure',
  'linkedin',
  'linkedin_oidc',
  'twitter',
  'discord',
  'slack',
  'slack_oidc',
  'spotify',
  'twitch',
  'notion',
  'workos',
  'zoom',
  'keycloak',
  'kakao',
  'bitbucket',
  'gitlab',
])

const PROTOKOLL_CODES = new Set([
  'eingang',
  'abgelehnt',
  'geloescht',
  'nicht_gefunden',
  'residual',
  'speicher_blockiert',
  'nicht_verfuegbar',
])

const GEHEIME_SCHLUESSEL = new Set([
  'password',
  'passwort',
  'authorization',
  'jwt',
  'access_token',
  'refresh_token',
  'service_role',
  'servicerolekey',
  'service_role_key',
  'apikey',
  'email',
  'user_id',
  'userid',
  'factor_id',
  'factorid',
  'challenge_id',
  'challengeid',
  'token',
  'url',
])

export function kontoLoeschungProtokoll(code: string, extra?: Record<string, unknown>): string {
  const ereignis = PROTOKOLL_CODES.has(code) ? code : 'unbekannt'
  const sicher: Record<string, string> = {}
  if (extra) {
    for (const [schluessel, wert] of Object.entries(extra)) {
      const name = schluessel.toLowerCase()
      const text = typeof wert === 'string' ? wert : ''
      if (GEHEIME_SCHLUESSEL.has(name) || siehtGeheimAus(text) || typeof wert !== 'string') {
        sicher[schluessel] = '[entfernt]'
        continue
      }
      if (text.length > 40 || text.includes('@') || text.includes('http') || text.includes('eyJ')) {
        sicher[schluessel] = '[entfernt]'
        continue
      }
      sicher[schluessel] = text
    }
  }
  return JSON.stringify({ ereignis, ...sicher })
}

function siehtGeheimAus(text: string): boolean {
  if (!text) return false
  if (/bearer\s+\S+/i.test(text)) return true
  if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)) return true
  if (/service[_-]?role/i.test(text)) return true
  if (/sb_secret/i.test(text)) return true
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text)) return true
  return false
}

export function anbieterAusBenutzer(user: {
  identities?: { provider?: string | null }[] | null
  app_metadata?: { provider?: string | null; providers?: readonly string[] | null } | null
}): string[] {
  const menge = new Set<string>()
  for (const identitaet of user.identities ?? []) {
    if (typeof identitaet?.provider === 'string' && identitaet.provider) menge.add(identitaet.provider)
  }
  const meta = user.app_metadata
  if (typeof meta?.provider === 'string' && meta.provider) menge.add(meta.provider)
  if (Array.isArray(meta?.providers)) {
    for (const anbieter of meta.providers) {
      if (typeof anbieter === 'string' && anbieter) menge.add(anbieter)
    }
  }
  return [...menge]
}

export function identitaetsBeweis(anbieter: readonly string[]): 'passwort' | 'nur_oauth' | 'nicht_unterstuetzt' {
  const liste = anbieter.map((eintrag) => eintrag.toLowerCase())
  if (liste.includes('email')) return 'passwort'
  if (liste.length > 0 && liste.every((eintrag) => OAUTH_ANBIETER.has(eintrag))) return 'nur_oauth'
  return 'nicht_unterstuetzt'
}

/**
 * Verifizierte TOTP-Faktoren. `null` heisst unlesbar und damit fail-closed,
 * nicht „kein Faktor“.
 */
export function verifizierteTotpAnzahl(daten: unknown): number | null {
  if (daten == null || typeof daten !== 'object' || Array.isArray(daten)) return null
  const roh = daten as Record<string, unknown>
  const kandidat = roh.all !== undefined ? roh.all : roh.totp !== undefined ? roh.totp : roh.factors
  if (!Array.isArray(kandidat)) return null
  let anzahl = 0
  for (const eintrag of kandidat) {
    if (eintrag == null || typeof eintrag !== 'object' || Array.isArray(eintrag)) return null
    const faktor = eintrag as Record<string, unknown>
    if (typeof faktor.id !== 'string' || faktor.id.length === 0) return null
    const typ =
      typeof faktor.factor_type === 'string' && faktor.factor_type
        ? faktor.factor_type
        : typeof faktor.type === 'string'
          ? faktor.type
          : null
    if (typ === 'totp' && faktor.status === 'verified') anzahl += 1
  }
  return anzahl
}

export function ersterVerifizierterTotp(daten: unknown): string | null {
  if (verifizierteTotpAnzahl(daten) == null) return null
  const roh = daten as Record<string, unknown>
  const kandidat = (roh.all !== undefined ? roh.all : roh.totp !== undefined ? roh.totp : roh.factors) as unknown[]
  for (const eintrag of kandidat) {
    const faktor = eintrag as Record<string, unknown>
    const typ =
      typeof faktor.factor_type === 'string' && faktor.factor_type
        ? faktor.factor_type
        : typeof faktor.type === 'string'
          ? faktor.type
          : null
    if (typ === 'totp' && faktor.status === 'verified' && typeof faktor.id === 'string') return faktor.id
  }
  return null
}

export function mfaFreigabe(
  verifizierteTotp: number,
  aal: 'aal1' | 'aal2' | null,
): { ok: true } | { ok: false; code: 'aal2_erforderlich' | 'aal_unbekannt' } {
  if (verifizierteTotp === 0) return { ok: true }
  if (aal === 'aal2') return { ok: true }
  if (aal === 'aal1') return { ok: false, code: 'aal2_erforderlich' }
  return { ok: false, code: 'aal_unbekannt' }
}

function enthaeltVerboteneAutoritaet(wert: unknown, tiefe = 0): boolean {
  if (tiefe > 4) return true
  if (Array.isArray(wert)) return wert.some((eintrag) => enthaeltVerboteneAutoritaet(eintrag, tiefe + 1))
  if (wert && typeof wert === 'object') {
    for (const [schluessel, inhalt] of Object.entries(wert)) {
      if (VERBOTENE_AUTORITAET.has(schluessel.toLowerCase())) return true
      if (enthaeltVerboteneAutoritaet(inhalt, tiefe + 1)) return true
    }
  }
  return false
}

export type GeleseneAnfrage =
  | { ok: true; confirmation: string; password: string }
  | { ok: false; code: 'ungueltig' | 'ziel_nicht_erlaubt' | 'bestaetigung_falsch' | 'passwort_fehlt' }

export function kontoLoeschungAnfrageLesen(roh: unknown): GeleseneAnfrage {
  if (roh == null || typeof roh !== 'object' || Array.isArray(roh)) return { ok: false, code: 'ungueltig' }
  if (enthaeltVerboteneAutoritaet(roh)) return { ok: false, code: 'ziel_nicht_erlaubt' }
  for (const schluessel of Object.keys(roh)) {
    if (!ERLAUBTE_FELDER.has(schluessel)) return { ok: false, code: 'ziel_nicht_erlaubt' }
  }
  const werte = roh as Record<string, unknown>
  if (typeof werte.confirmation !== 'string' || werte.confirmation !== KONTO_LOESCHEN_PHRASE) {
    return { ok: false, code: 'bestaetigung_falsch' }
  }
  if (typeof werte.password !== 'string' || werte.password.length === 0) {
    return { ok: false, code: 'passwort_fehlt' }
  }
  return { ok: true, confirmation: werte.confirmation, password: werte.password }
}

export function suchparameterWaehlenZiel(url: string): boolean {
  let adresse: URL
  try {
    adresse = new URL(url)
  } catch {
    return true
  }
  for (const schluessel of adresse.searchParams.keys()) {
    if (VERBOTENE_AUTORITAET.has(schluessel.toLowerCase()) || !ERLAUBTE_FELDER.has(schluessel)) {
      return true
    }
  }
  return false
}

export function authLoeschFehlerEinordnen(fehler: {
  message?: string
  code?: string
  status?: number
} | null): Exclude<AuthLoeschung['art'], 'geloescht'> {
  if (!fehler) return 'fehler'
  const code = (fehler.code ?? '').toLowerCase()
  const message = fehler.message ?? ''
  if (fehler.status === 404 || code === 'user_not_found' || /user not found/i.test(message)) {
    return 'nicht_gefunden'
  }
  if (
    code === 'storage_owner_delete_blocked' ||
    /storage\.objects/i.test(message) ||
    /owns storage/i.test(message) ||
    /storage objects/i.test(message) ||
    (/storage/i.test(message) && /owner/i.test(message))
  ) {
    return 'speicher_blockiert'
  }
  return 'fehler'
}

export async function registrierteSpeicherRaeumen(
  flaechen: readonly KontoSpeicherFlaeche[],
  port: {
    loescheUeberStorageApi: (flaeche: KontoSpeicherFlaeche, benutzerId: string) => Promise<SpeicherLoeschung>
  },
  benutzerId: string,
): Promise<SpeicherLoeschung> {
  for (const flaeche of flaechen) {
    const ergebnis = await port.loescheUeberStorageApi(flaeche, benutzerId)
    if (ergebnis.art !== 'geleert') return ergebnis
  }
  return { art: 'geleert' }
}

/**
 * Nach dem Löschen gilt nur noch, was `auth.getUser()` sagt.
 * Ein JWT im Cookie ist keine Berechtigung, wenn der Nutzer fehlt.
 */
export function geschuetzterKontozugangNachGetUser(ergebnis: {
  user: { id: string } | null
  fehlerIstSitzungFehlend: boolean
  pruefungAusgefallen: boolean
}): 'erlaubt' | 'abgelehnt' | 'nicht_pruefbar' {
  if (ergebnis.pruefungAusgefallen) return 'nicht_pruefbar'
  if (ergebnis.fehlerIstSitzungFehlend || !ergebnis.user) return 'abgelehnt'
  return 'erlaubt'
}
