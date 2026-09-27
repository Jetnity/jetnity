// lib/account/kontoloeschung-client.ts
//
// Browser-Ablauf der V1-Kontolöschung. Das Passwort und der TOTP-Code
// bleiben aus dem Zustand. Erfolg räumt die lokale Sitzung erst nach der
// Klasse `geloescht` und leitet aus /account heraus.

import { mfaStepUpCodePruefen } from '@/lib/auth/account-mfa-step-up'
import {
  KONTO_GELOESCHT_PFAD,
  KONTO_LOESCHEN_BESTAETIGUNG,
  loeschAntwortKlasse,
  loeschUmgebungErlaubt,
} from '@/lib/account/kontoloeschung-vertrag'

/** Dieselben Schlüssel wie der Gastreisespeicher. Der Abgleich steht im Test. */
export const LOKALE_KONTO_SPUREN = [
  'jetnity:reise:v3',
  'jetnity:reisen-warteschlange:v3',
  'jetnity:guest-trips:v2',
] as const

export type KontoloeschungPhase =
  | 'bereit'
  | 'arbeiten'
  | 'mfa'
  | 'fertig'
  | 'fehler'
  | 'nicht_unterstuetzt'

export type KontoloeschungFehlerCode =
  | 'bestaetigung'
  | 'sitzung'
  | 'passwort'
  | 'rate'
  | 'mfa_code'
  | 'mfa_erforderlich'
  | 'oauth'
  | 'veraltet'
  | 'nicht_gefunden'
  | 'aufraeumen'
  | 'teilweise'
  | 'umgebung'
  | 'netz'
  | 'unbekannt'

export type KontoloeschungFehler = {
  code: KontoloeschungFehlerCode
  text: string
}

export type KontoloeschungZustand = {
  phase: KontoloeschungPhase
  fehler: KontoloeschungFehler | null
  faktorId: string | null
  challengeId: string | null
}

export type KontoloeschungEreignis =
  | { typ: 'starte' }
  | { typ: 'bestaetigung_ungueltig' }
  | { typ: 'sitzung' }
  | { typ: 'passwort' }
  | { typ: 'rate' }
  | { typ: 'oauth' }
  | { typ: 'mfa_noetig'; faktorId: string; challengeId: string }
  | { typ: 'mfa_code' }
  | { typ: 'mfa_erforderlich' }
  | { typ: 'veraltet' }
  | { typ: 'nicht_gefunden' }
  | { typ: 'aufraeumen' }
  | { typ: 'teilweise' }
  | { typ: 'umgebung' }
  | { typ: 'netz' }
  | { typ: 'unbekannt' }
  | { typ: 'geloescht' }

export type KontoloeschungNutzer = {
  id: string
  email: string | null
  providers: string[]
}

export type KontoloeschungPort = {
  getUser: () => Promise<{ user: KontoloeschungNutzer | null }>
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; rateLimited: boolean; accessToken: string | null }>
  faktorenUndAal: () => Promise<
    | {
        ok: true
        verifiedTotpIds: string[]
        verifiedAndere: number
        currentLevel: 'aal1' | 'aal2' | null
      }
    | { ok: false }
  >
  mfaChallenge: (factorId: string) => Promise<{ challengeId: string | null }>
  mfaVerify: (
    factorId: string,
    challengeId: string,
    code: string,
  ) => Promise<{ ok: boolean; accessToken: string | null; currentLevel: 'aal1' | 'aal2' | null }>
  loeschen: (accessToken: string) => Promise<{ klasse: string | 'unbekannt'; netz: boolean }>
  lokaleSitzungBeenden: () => Promise<void>
  speicher: { removeItem: (key: string) => void } | null
  ortWechseln: (pfad: string) => void
}

const TEXTE: Record<KontoloeschungFehlerCode, string> = {
  bestaetigung: 'Die Bestätigung muss exakt KONTO LÖSCHEN lauten.',
  sitzung: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  passwort: 'Das Passwort ist nicht richtig.',
  rate: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  mfa_code: 'Der Code ist ungültig. Bitte prüfe die Authenticator-App und versuche es erneut.',
  mfa_erforderlich: 'Zum Löschen ist eine aktuelle Zwei-Faktor-Bestätigung nötig. Das Konto wurde nicht gelöscht.',
  oauth:
    'Dieses Konto kann hier nicht gelöscht werden. Eine Anmeldung ohne Passwort ist dafür nicht freigegeben.',
  veraltet: 'Die Anmeldung ist nicht mehr frisch genug. Bitte bestätige das aktuelle Passwort erneut.',
  nicht_gefunden: 'Dieses Konto ist nicht mehr vorhanden.',
  aufraeumen: 'Das Konto wurde nicht gelöscht. Es liegt keine bestätigte Datenänderung vor. Bitte versuche es erneut.',
  teilweise:
    'Das Konto wurde nicht als gelöscht bestätigt. Ein Teil der in Jetnity gespeicherten Reisen, Reisenden oder Besuche kann bereits entfernt sein. Bitte versuche es erneut. Wenn das Konto danach noch besteht, wende dich an den Support.',
  umgebung: 'Das Löschen ist in dieser Umgebung nicht verfügbar.',
  netz: 'Die Verbindung war unterbrochen. Bitte prüfe das Netz und versuche es erneut.',
  unbekannt: 'Das hat gerade nicht geklappt. Bitte versuche es erneut.',
}

const LAGE_TEXT: Record<KontoloeschungPhase, string> = {
  bereit: 'Zum Löschen sind die exakte Bestätigung, das aktuelle Passwort und gegebenenfalls ein Zwei-Faktor-Code nötig.',
  arbeiten: 'Das Konto wird geprüft.',
  mfa: 'Gib den aktuellen Code aus der Authenticator-App ein.',
  fertig: 'Das Konto wurde gelöscht.',
  fehler: 'Das Konto wurde nicht gelöscht.',
  nicht_unterstuetzt: TEXTE.oauth,
}

export const KONTOLOESCHUNG_ANFANG: KontoloeschungZustand = {
  phase: 'bereit',
  fehler: null,
  faktorId: null,
  challengeId: null,
}

function kontoloeschungFehler(code: KontoloeschungFehlerCode): KontoloeschungFehler {
  return { code, text: TEXTE[code] }
}

export function kontoloeschungStatusText(zustand: KontoloeschungZustand): string {
  if (zustand.fehler) return zustand.fehler.text
  return LAGE_TEXT[zustand.phase]
}

export function kontoloeschungIstBeschaeftigt(zustand: KontoloeschungZustand): boolean {
  return zustand.phase === 'arbeiten'
}

export function kontoloeschungSendenGesperrt(
  zustand: KontoloeschungZustand,
  bestaetigung: string,
  passwort: string,
  code: string,
): boolean {
  if (zustand.phase === 'arbeiten' || zustand.phase === 'fertig' || zustand.phase === 'nicht_unterstuetzt') {
    return true
  }
  if (zustand.phase === 'mfa') return mfaStepUpCodePruefen(code) !== null
  return bestaetigung !== KONTO_LOESCHEN_BESTAETIGUNG || passwort.length === 0
}

export function kontoloeschungLoeschkoerper(): { confirmation: typeof KONTO_LOESCHEN_BESTAETIGUNG } {
  return { confirmation: KONTO_LOESCHEN_BESTAETIGUNG }
}

export function kontoloeschungFunktionsUrl(supabaseUrl: string | null | undefined): string | null {
  if (!loeschUmgebungErlaubt(supabaseUrl) || !supabaseUrl) return null
  try {
    return `${new URL(supabaseUrl).origin}/functions/v1/account-delete-v1`
  } catch {
    return null
  }
}

function lokaleKontoSpurenLeeren(speicher: { removeItem: (key: string) => void } | null): void {
  if (!speicher) return
  for (const schluessel of LOKALE_KONTO_SPUREN) speicher.removeItem(schluessel)
}

export function kontoloeschungWeiter(
  zustand: KontoloeschungZustand,
  ereignis: KontoloeschungEreignis,
): KontoloeschungZustand {
  switch (ereignis.typ) {
    case 'starte':
      if (zustand.phase === 'arbeiten' || zustand.phase === 'fertig' || zustand.phase === 'nicht_unterstuetzt') {
        return zustand
      }
      return { phase: 'arbeiten', fehler: null, faktorId: zustand.faktorId, challengeId: zustand.challengeId }
    case 'bestaetigung_ungueltig':
      return fehlerZustand('bestaetigung')
    case 'sitzung':
      return fehlerZustand('sitzung')
    case 'passwort':
      return fehlerZustand('passwort')
    case 'rate':
      return fehlerZustand('rate')
    case 'oauth':
      return {
        phase: 'nicht_unterstuetzt',
        fehler: kontoloeschungFehler('oauth'),
        faktorId: null,
        challengeId: null,
      }
    case 'mfa_noetig':
      if (zustand.phase !== 'arbeiten') return zustand
      if (!ereignis.faktorId || !ereignis.challengeId) return fehlerZustand('mfa_erforderlich')
      return {
        phase: 'mfa',
        fehler: null,
        faktorId: ereignis.faktorId,
        challengeId: ereignis.challengeId,
      }
    case 'mfa_code':
      return {
        phase: 'mfa',
        fehler: kontoloeschungFehler('mfa_code'),
        faktorId: zustand.faktorId,
        challengeId: zustand.challengeId,
      }
    case 'mfa_erforderlich':
      return fehlerZustand('mfa_erforderlich')
    case 'veraltet':
      return fehlerZustand('veraltet')
    case 'nicht_gefunden':
      return fehlerZustand('nicht_gefunden')
    case 'aufraeumen':
      return fehlerZustand('aufraeumen')
    case 'teilweise':
      return fehlerZustand('teilweise')
    case 'umgebung':
      return fehlerZustand('umgebung')
    case 'netz':
      return fehlerZustand('netz')
    case 'unbekannt':
      return fehlerZustand('unbekannt')
    case 'geloescht':
      if (zustand.phase !== 'arbeiten') return zustand
      return { phase: 'fertig', fehler: null, faktorId: null, challengeId: null }
    default:
      return zustand
  }
}

export async function kontoloeschungAnstossen(
  port: KontoloeschungPort,
  eingabe: { bestaetigung: string; passwort: string },
): Promise<KontoloeschungEreignis> {
  if (eingabe.bestaetigung !== KONTO_LOESCHEN_BESTAETIGUNG) return { typ: 'bestaetigung_ungueltig' }
  const { user } = await port.getUser()
  if (!user) return { typ: 'sitzung' }
  if (user.providers.length > 0 && !user.providers.includes('email')) return { typ: 'oauth' }
  if (!user.email || !user.providers.includes('email')) return { typ: 'unbekannt' }

  const reauth = await port.signInWithPassword(user.email, eingabe.passwort)
  if (!reauth.ok || !reauth.accessToken) return reauth.rateLimited ? { typ: 'rate' } : { typ: 'passwort' }

  const stand = await port.faktorenUndAal()
  if (!stand.ok) return { typ: 'unbekannt' }
  if (stand.verifiedAndere > 0 && stand.verifiedTotpIds.length === 0) return { typ: 'mfa_erforderlich' }
  if (stand.verifiedTotpIds.length > 0 && stand.currentLevel !== 'aal2') {
    const faktorId = stand.verifiedTotpIds[0]
    if (!faktorId) return { typ: 'mfa_erforderlich' }
    const challenge = await port.mfaChallenge(faktorId)
    if (!challenge.challengeId) return { typ: 'mfa_erforderlich' }
    return { typ: 'mfa_noetig', faktorId, challengeId: challenge.challengeId }
  }
  return loeschungAbschliessen(port, reauth.accessToken)
}

export async function kontoloeschungCodeSenden(
  port: KontoloeschungPort,
  eingabe: { code: string; faktorId: string; challengeId: string },
): Promise<KontoloeschungEreignis> {
  if (mfaStepUpCodePruefen(eingabe.code)) return { typ: 'mfa_code' }
  if (!eingabe.faktorId || !eingabe.challengeId) return { typ: 'mfa_erforderlich' }
  const bestaetigt = await port.mfaVerify(eingabe.faktorId, eingabe.challengeId, eingabe.code)
  if (!bestaetigt.ok || !bestaetigt.accessToken) return { typ: 'mfa_code' }
  if (bestaetigt.currentLevel !== 'aal2') return { typ: 'mfa_erforderlich' }
  return loeschungAbschliessen(port, bestaetigt.accessToken)
}

async function loeschungAbschliessen(
  port: KontoloeschungPort,
  accessToken: string,
): Promise<KontoloeschungEreignis> {
  const antwort = await port.loeschen(accessToken)
  if (antwort.netz) return { typ: 'netz' }
  const ereignis = ereignisAusKlasse(antwort.klasse)
  if (ereignis.typ !== 'geloescht') return ereignis
  try {
    await port.lokaleSitzungBeenden()
  } catch {
    // Das Konto ist serverseitig gelöscht. Die lokale Spur wird trotzdem geleert.
  }
  lokaleKontoSpurenLeeren(port.speicher)
  port.ortWechseln(KONTO_GELOESCHT_PFAD)
  return { typ: 'geloescht' }
}

function ereignisAusKlasse(klasse: string): KontoloeschungEreignis {
  switch (klasse) {
    case 'geloescht':
      return { typ: 'geloescht' }
    case 'nicht_angemeldet':
      return { typ: 'sitzung' }
    case 'nicht_gefunden':
      return { typ: 'nicht_gefunden' }
    case 'oauth_nicht_unterstuetzt':
      return { typ: 'oauth' }
    case 'reauth_veraltet':
      return { typ: 'veraltet' }
    case 'mfa_erforderlich':
      return { typ: 'mfa_erforderlich' }
    case 'aufraeumen_fehlgeschlagen':
      return { typ: 'aufraeumen' }
    case 'teilweise_entfernt':
      return { typ: 'teilweise' }
    case 'umgebung_gesperrt':
    case 'nicht_verfuegbar':
      return { typ: 'umgebung' }
    default:
      return { typ: 'unbekannt' }
  }
}

export async function kontoloeschungAntwortHolen(
  url: string,
  accessToken: string,
  anonKey: string,
  holen: typeof fetch = fetch,
): Promise<{ klasse: string | 'unbekannt'; netz: boolean }> {
  try {
    const antwort = await holen(url, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kontoloeschungLoeschkoerper()),
    })
    const text = await antwort.text()
    if (text.length > 512) return { klasse: 'unbekannt', netz: false }
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      return { klasse: 'unbekannt', netz: false }
    }
    return { klasse: loeschAntwortKlasse(body), netz: false }
  } catch {
    return { klasse: 'unbekannt', netz: true }
  }
}

function fehlerZustand(code: KontoloeschungFehlerCode): KontoloeschungZustand {
  return { phase: 'fehler', fehler: kontoloeschungFehler(code), faktorId: null, challengeId: null }
}
