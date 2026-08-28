// lib/auth/account-password-aenderung.ts
//
// AP-5-S2: eingeloggte Passwortänderung über den bestehenden
// Reauthentication-Vertrag. Recovery bleibt eine eigene Authority.
// Kein Current-Password-Submit. Kein Roh-GoTrue. Kein Secret-Log.

import {
  securityFehlerAusUnbekannt,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'
import {
  RICHTLINIE_TEXT,
  erfuelltRichtlinie,
  passwortAblehnung,
} from '@/lib/auth/passwort-richtlinie'

export type PasswortAenderungSchritt =
  | 'idle'
  | 'requesting_code'
  | 'code_sent'
  | 'verifying'
  | 'updating'
  | 'success'
  | 'error'
  | 'unsupported'
  | 'unavailable'

export type PasswortAenderungFehlerCode =
  | 'session_required'
  | 'reauth_unsupported'
  | 'reauth_unavailable'
  | 'reauth_failed'
  | 'reauth_rate_limited'
  | 'nonce_missing'
  | 'nonce_invalid'
  | 'nonce_expired'
  | 'password_mismatch'
  | 'password_policy'
  | 'password_leaked'
  | 'password_same'
  | 'update_failed'
  | 'network'
  | 'unknown'

export type PasswortAenderungVorgang = 'sitzung' | 'reauth' | 'update' | 'lokal'

export type PasswortAenderungFehler = {
  code: PasswortAenderungFehlerCode
  text: string
  erneut: 'idle' | 'code_sent' | null
}

export type PasswortAenderungZustand = {
  schritt: PasswortAenderungSchritt
  fehler: PasswortAenderungFehler | null
}

export type PasswortAenderungEreignis =
  | { typ: 'client_unbekannt' }
  | { typ: 'client_ohne_sitzung' }
  | { typ: 'client_ohne_email' }
  | { typ: 'client_bereit' }
  | { typ: 'sitzung_fehler'; fehler: PasswortAenderungFehler }
  | { typ: 'starte_reauth' }
  | { typ: 'reauth_ok' }
  | { typ: 'reauth_fehler'; fehler: PasswortAenderungFehler }
  | { typ: 'starte_pruefung' }
  | { typ: 'pruefung_fehler'; fehler: PasswortAenderungFehler }
  | { typ: 'starte_update' }
  | { typ: 'update_ok' }
  | { typ: 'update_fehler'; fehler: PasswortAenderungFehler }
  | { typ: 'abbrechen' }
  | { typ: 'erneut' }

export type PasswortAenderungAuthFehler = {
  message?: string
  code?: string
  status?: number
}

export type PasswortAenderungAuth = {
  getUser: () => Promise<{
    data: { user: { email?: string | null } | null }
    error: PasswortAenderungAuthFehler | null
  }>
  reauthenticate?: () => Promise<{ error: PasswortAenderungAuthFehler | null }>
  updateUser: (eingabe: { password: string; nonce: string }) => Promise<{
    error: PasswortAenderungAuthFehler | null
  }>
}

export const PASSWORT_AENDERUNG_ANFANG: PasswortAenderungZustand = {
  schritt: 'idle',
  fehler: null,
}

const FEHLER_TEXTE: Record<PasswortAenderungFehlerCode, string> = {
  session_required: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  reauth_unsupported: 'Die Passwortänderung ist in dieser Umgebung nicht unterstützt.',
  reauth_unavailable: 'Für dieses Konto kann kein Bestätigungscode per E-Mail geschickt werden.',
  reauth_failed: 'Der Bestätigungscode konnte nicht gesendet werden. Bitte versuche es erneut.',
  reauth_rate_limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  nonce_missing: 'Bitte gib den Bestätigungscode aus der E-Mail ein.',
  nonce_invalid: 'Der Bestätigungscode ist ungültig. Bitte prüfe die E-Mail und versuche es erneut.',
  nonce_expired: 'Der Bestätigungscode ist abgelaufen. Bitte fordere einen neuen Code an.',
  password_mismatch: 'Die Passwörter stimmen nicht überein.',
  password_policy: RICHTLINIE_TEXT,
  password_leaked: 'Dieses Passwort steht in einem bekannten Datenleck. Bitte wähle ein anderes.',
  password_same: 'Das neue Passwort muss sich vom bisherigen unterscheiden.',
  update_failed: 'Das Passwort konnte nicht geändert werden. Bitte versuche es erneut.',
  network: 'Die Verbindung war unterbrochen. Bitte prüfe das Netz und versuche es erneut.',
  unknown: 'Das hat gerade nicht geklappt. Bitte versuche es erneut.',
}

const PASSWORT_AENDERUNG_LAGE_TEXTE: Record<PasswortAenderungSchritt, string> = {
  idle: 'Du kannst einen Bestätigungscode anfordern, um dein Passwort zu ändern.',
  requesting_code: 'Bestätigungscode wird gesendet.',
  code_sent: 'Bestätigungscode wurde gesendet. Gib den Code und ein neues Passwort ein.',
  verifying: 'Eingaben werden geprüft.',
  updating: 'Passwort wird geändert.',
  success: 'Dein Passwort wurde geändert.',
  error: 'Die Passwortänderung ist fehlgeschlagen.',
  unsupported: FEHLER_TEXTE.reauth_unsupported,
  unavailable: FEHLER_TEXTE.reauth_unavailable,
}

export function passwortAenderungFehler(
  code: PasswortAenderungFehlerCode,
): PasswortAenderungFehler {
  return {
    code,
    text: FEHLER_TEXTE[code],
    erneut: erneutFuer(code),
  }
}

function erneutFuer(code: PasswortAenderungFehlerCode): PasswortAenderungFehler['erneut'] {
  if (code === 'reauth_unsupported' || code === 'reauth_unavailable' || code === 'session_required') {
    return null
  }
  if (
    code === 'nonce_missing' ||
    code === 'nonce_invalid' ||
    code === 'password_mismatch' ||
    code === 'password_policy' ||
    code === 'password_leaked' ||
    code === 'password_same' ||
    code === 'update_failed'
  ) {
    return 'code_sent'
  }
  if (code === 'nonce_expired') return 'idle'
  return 'idle'
}

export function passwortAenderungFehlerEinordnen(eingabe: {
  vorgang: PasswortAenderungVorgang
  meldung?: string | null
  code?: string | null
  status?: number | null
}): PasswortAenderungFehler {
  const meldung = (eingabe.meldung ?? '').toLowerCase()
  const apiCode = (eingabe.code ?? '').toLowerCase()
  const status = eingabe.status ?? null

  if (istNetz(meldung, apiCode, status)) return passwortAenderungFehler('network')
  if (istSitzungFehlt(meldung, apiCode, status)) return passwortAenderungFehler('session_required')
  if (istRateLimit(meldung, apiCode, status)) return passwortAenderungFehler('reauth_rate_limited')

  if (eingabe.vorgang === 'lokal') {
    if (meldung.includes('mismatch') || meldung.includes('überein')) {
      return passwortAenderungFehler('password_mismatch')
    }
    if (meldung.includes('nonce') || meldung.includes('code')) {
      return passwortAenderungFehler('nonce_missing')
    }
    return passwortAenderungFehler('password_policy')
  }

  if (eingabe.vorgang === 'sitzung') {
    if (istNichtUnterstuetzt(meldung, apiCode)) return passwortAenderungFehler('reauth_unsupported')
    if (istNichtVerfuegbar(meldung, apiCode)) return passwortAenderungFehler('reauth_unavailable')
    return passwortAenderungFehler('unknown')
  }

  if (eingabe.vorgang === 'reauth') {
    if (istNichtUnterstuetzt(meldung, apiCode)) return passwortAenderungFehler('reauth_unsupported')
    if (istNichtVerfuegbar(meldung, apiCode)) return passwortAenderungFehler('reauth_unavailable')
    return passwortAenderungFehler('reauth_failed')
  }

  const leck = passwortAblehnung(eingabe.meldung)
  if (leck?.includes('Datenleck')) return passwortAenderungFehler('password_leaked')
  if (leck === RICHTLINIE_TEXT) return passwortAenderungFehler('password_policy')

  if (istGleichesPasswort(meldung, apiCode)) return passwortAenderungFehler('password_same')
  if (istNonceAbgelaufen(meldung, apiCode)) return passwortAenderungFehler('nonce_expired')
  if (istNonceUngueltig(meldung, apiCode)) return passwortAenderungFehler('nonce_invalid')
  if (istNichtUnterstuetzt(meldung, apiCode)) return passwortAenderungFehler('reauth_unsupported')
  if (istNichtVerfuegbar(meldung, apiCode)) return passwortAenderungFehler('reauth_unavailable')

  return passwortAenderungFehler('update_failed')
}

export function passwortAenderungLokalPruefen(eingabe: {
  nonce: string
  passwort: string
  wiederholung: string
}): PasswortAenderungFehler | null {
  const nonce = eingabe.nonce.trim()
  if (!nonce) return passwortAenderungFehler('nonce_missing')
  if (!nonceIstAnnehmbar(nonce)) return passwortAenderungFehler('nonce_invalid')
  if (!erfuelltRichtlinie(eingabe.passwort)) return passwortAenderungFehler('password_policy')
  if (eingabe.passwort !== eingabe.wiederholung) return passwortAenderungFehler('password_mismatch')
  return null
}

export function nonceIstAnnehmbar(nonce: string): boolean {
  const wert = nonce.trim()
  if (wert.length < 4 || wert.length > 64) return false
  if (/\s/.test(wert)) return false
  return true
}

export function passwortAenderungUpdateNutzlast(eingabe: {
  passwort: string
  nonce: string
}): { password: string; nonce: string } {
  return {
    password: eingabe.passwort,
    nonce: eingabe.nonce.trim(),
  }
}

export function passwortAenderungWeiter(
  zustand: PasswortAenderungZustand,
  ereignis: PasswortAenderungEreignis,
): PasswortAenderungZustand {
  switch (ereignis.typ) {
    case 'client_unbekannt':
      return { schritt: 'unsupported', fehler: passwortAenderungFehler('reauth_unsupported') }
    case 'client_ohne_sitzung':
      return { schritt: 'error', fehler: passwortAenderungFehler('session_required') }
    case 'client_ohne_email':
      return { schritt: 'unavailable', fehler: passwortAenderungFehler('reauth_unavailable') }
    case 'sitzung_fehler':
      return lageFuerFehler(ereignis.fehler)
    case 'client_bereit':
      if (zustand.schritt === 'unsupported' || zustand.schritt === 'unavailable') {
        return PASSWORT_AENDERUNG_ANFANG
      }
      return zustand
    case 'starte_reauth':
      if (!darfReauthStarten(zustand)) return zustand
      return { schritt: 'requesting_code', fehler: null }
    case 'reauth_ok':
      if (zustand.schritt !== 'requesting_code') return zustand
      return { schritt: 'code_sent', fehler: null }
    case 'reauth_fehler':
      if (zustand.schritt !== 'requesting_code') return zustand
      return lageFuerFehler(ereignis.fehler)
    case 'starte_pruefung':
      if (!darfAenderungSenden(zustand)) return zustand
      return { schritt: 'verifying', fehler: null }
    case 'pruefung_fehler':
      if (zustand.schritt !== 'verifying') return zustand
      return lageFuerFehler(ereignis.fehler)
    case 'starte_update':
      if (zustand.schritt !== 'verifying') return zustand
      return { schritt: 'updating', fehler: null }
    case 'update_ok':
      if (zustand.schritt !== 'updating') return zustand
      return { schritt: 'success', fehler: null }
    case 'update_fehler':
      if (zustand.schritt !== 'updating') return zustand
      return lageFuerFehler(ereignis.fehler)
    case 'abbrechen':
      if (zustand.schritt === 'unsupported' || zustand.schritt === 'unavailable') return zustand
      if (zustand.schritt === 'requesting_code' || zustand.schritt === 'updating') return zustand
      return PASSWORT_AENDERUNG_ANFANG
    case 'erneut':
      if (zustand.schritt !== 'error' || !zustand.fehler?.erneut) return zustand
      return { schritt: zustand.fehler.erneut, fehler: null }
    default:
      return zustand
  }
}

function lageFuerFehler(fehler: PasswortAenderungFehler): PasswortAenderungZustand {
  if (fehler.code === 'reauth_unsupported') {
    return { schritt: 'unsupported', fehler }
  }
  if (fehler.code === 'reauth_unavailable') {
    return { schritt: 'unavailable', fehler }
  }
  return { schritt: 'error', fehler }
}

export function darfReauthStarten(zustand: PasswortAenderungZustand): boolean {
  return zustand.schritt === 'idle' || (zustand.schritt === 'error' && zustand.fehler?.erneut === 'idle')
}

export function darfAenderungSenden(zustand: PasswortAenderungZustand): boolean {
  return (
    zustand.schritt === 'code_sent' ||
    (zustand.schritt === 'error' && zustand.fehler?.erneut === 'code_sent')
  )
}

export function darfPasswortFormularZeigen(zustand: PasswortAenderungZustand): boolean {
  return (
    zustand.schritt === 'code_sent' ||
    zustand.schritt === 'verifying' ||
    zustand.schritt === 'updating' ||
    (zustand.schritt === 'error' && zustand.fehler?.erneut === 'code_sent')
  )
}

export function passwortAenderungIstBeschaeftigt(zustand: PasswortAenderungZustand): boolean {
  return (
    zustand.schritt === 'requesting_code' ||
    zustand.schritt === 'verifying' ||
    zustand.schritt === 'updating'
  )
}

export function passwortAenderungStatusText(zustand: PasswortAenderungZustand): string {
  if (zustand.schritt === 'error' && zustand.fehler) return zustand.fehler.text
  if (zustand.schritt === 'unsupported' || zustand.schritt === 'unavailable') {
    return zustand.fehler?.text ?? PASSWORT_AENDERUNG_LAGE_TEXTE[zustand.schritt]
  }
  return PASSWORT_AENDERUNG_LAGE_TEXTE[zustand.schritt]
}

export function passwortAenderungErfolgBehaupten(zustand: PasswortAenderungZustand): boolean {
  return zustand.schritt === 'success'
}

function sitzungLesenEreignisAusFehler(fehler: unknown): PasswortAenderungEreignis {
  const gelesen = securityFehlerAusUnbekannt(fehler)
  const eingeordnet = passwortAenderungFehlerEinordnen({
    vorgang: 'sitzung',
    meldung: gelesen.meldung,
    code: gelesen.code,
    status: gelesen.status,
  })
  if (eingeordnet.code === 'reauth_unsupported') return { typ: 'client_unbekannt' }
  if (eingeordnet.code === 'reauth_unavailable') return { typ: 'client_ohne_email' }
  if (eingeordnet.code === 'session_required') return { typ: 'client_ohne_sitzung' }
  return { typ: 'sitzung_fehler', fehler: eingeordnet }
}

export async function passwortAenderungSitzungLesen(
  auth: PasswortAenderungAuth,
): Promise<PasswortAenderungEreignis> {
  if (typeof auth.reauthenticate !== 'function') return { typ: 'client_unbekannt' }
  try {
    const { data, error } = await auth.getUser()
    if (error) return sitzungLesenEreignisAusFehler(error)
    if (!data.user) return { typ: 'client_ohne_sitzung' }
    if (!data.user.email?.trim()) return { typ: 'client_ohne_email' }
    return { typ: 'client_bereit' }
  } catch (fehler) {
    return sitzungLesenEreignisAusFehler(fehler)
  }
}

export async function passwortAenderungReauthAusfuehren(
  auth: PasswortAenderungAuth,
): Promise<Extract<PasswortAenderungEreignis, { typ: 'reauth_ok' | 'reauth_fehler' }>> {
  if (typeof auth.reauthenticate !== 'function') {
    return { typ: 'reauth_fehler', fehler: passwortAenderungFehler('reauth_unsupported') }
  }
  try {
    const { error } = await auth.reauthenticate()
    if (error) {
      const gelesen = securityFehlerAusUnbekannt(error)
      return {
        typ: 'reauth_fehler',
        fehler: passwortAenderungFehlerEinordnen({
          vorgang: 'reauth',
          meldung: gelesen.meldung,
          code: gelesen.code,
          status: gelesen.status,
        }),
      }
    }
    return { typ: 'reauth_ok' }
  } catch (fehler) {
    const gelesen = securityFehlerAusUnbekannt(fehler)
    return {
      typ: 'reauth_fehler',
      fehler: passwortAenderungFehlerEinordnen({
        vorgang: 'reauth',
        meldung: gelesen.meldung,
        code: gelesen.code,
        status: gelesen.status,
      }),
    }
  }
}

export async function passwortAenderungUpdateAusfuehren(
  auth: PasswortAenderungAuth,
  eingabe: { passwort: string; nonce: string },
): Promise<Extract<PasswortAenderungEreignis, { typ: 'update_ok' | 'update_fehler' }>> {
  const nutzlast = passwortAenderungUpdateNutzlast(eingabe)
  try {
    const { error } = await auth.updateUser({ password: nutzlast.password, nonce: nutzlast.nonce })
    if (error) {
      const gelesen = securityFehlerAusUnbekannt(error)
      return {
        typ: 'update_fehler',
        fehler: passwortAenderungFehlerEinordnen({
          vorgang: 'update',
          meldung: gelesen.meldung,
          code: gelesen.code,
          status: gelesen.status,
        }),
      }
    }
    return { typ: 'update_ok' }
  } catch (fehler) {
    const gelesen = securityFehlerAusUnbekannt(fehler)
    return {
      typ: 'update_fehler',
      fehler: passwortAenderungFehlerEinordnen({
        vorgang: 'update',
        meldung: gelesen.meldung,
        code: gelesen.code,
        status: gelesen.status,
      }),
    }
  }
}

export function passwortAenderungFehlerIstDicht(text: string, roh?: string | null): boolean {
  if (!securityFehlerIstDicht(text, roh)) return false
  if (/otpauth:|nonce=|reauthenticate|gotrue|supabase|factor_id|otp:\/\//i.test(text)) return false
  return true
}

function istNetz(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 0 ||
    apiCode.includes('network') ||
    apiCode.includes('request_timeout') ||
    meldung.includes('failed to fetch') ||
    meldung.includes('networkerror') ||
    meldung.includes('load failed') ||
    (meldung.includes('network') && !meldung.includes('nonce'))
  )
}

function istRateLimit(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 429 ||
    apiCode.includes('over_request') ||
    apiCode.includes('over_email_send') ||
    meldung.includes('too many') ||
    meldung.includes('rate limit')
  )
}

function istSitzungFehlt(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 401 ||
    apiCode.includes('session_not_found') ||
    apiCode.includes('session_expired') ||
    apiCode.includes('bad_jwt') ||
    meldung.includes('auth session missing') ||
    meldung.includes('not authenticated')
  )
}

function istNichtUnterstuetzt(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('not_supported') ||
    meldung.includes('not a function') ||
    meldung.includes('not supported') ||
    meldung.includes('nicht unterstützt')
  )
}

function istNichtVerfuegbar(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('otp_disabled') ||
    apiCode.includes('email_provider_disabled') ||
    meldung.includes('not available') ||
    meldung.includes('not enabled') ||
    meldung.includes('otp disabled') ||
    meldung.includes('no email')
  )
}

function istNonceAbgelaufen(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('otp_expired') ||
    apiCode.includes('reauthentication_needed') ||
    (apiCode.includes('reauthentication_not_valid') && meldung.includes('expir')) ||
    meldung.includes('otp expired') ||
    meldung.includes('nonce expired') ||
    meldung.includes('reauthentication needed')
  )
}

function istNonceUngueltig(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('reauth_nonce_missing') ||
    apiCode.includes('reauthentication_not_valid') ||
    apiCode.includes('validation_failed') ||
    meldung.includes('invalid nonce') ||
    meldung.includes('invalid otp') ||
    meldung.includes('nonce is invalid') ||
    meldung.includes('reauthentication not valid')
  )
}

function istGleichesPasswort(meldung: string, apiCode: string): boolean {
  return apiCode.includes('same_password') || meldung.includes('same password') || meldung.includes('should be different')
}
