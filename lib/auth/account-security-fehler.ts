// lib/auth/account-security-fehler.ts
//
// AP-5-S1: GoTrue-/Supabase-Rohfehler bleiben aus der Security-UI.
// Die Einordnung ist prüfbar; die Nutzercopy enthält keine Secrets,
// Tokens, QR-URIs oder Provider-Rohtexte.

export const SECURITY_FEHLER_CODES = [
  'totp_list_unsupported',
  'totp_list_failed',
  'totp_enroll_unavailable',
  'totp_enroll_failed',
  'totp_verify_invalid',
  'totp_verify_expired',
  'totp_verify_failed',
  'totp_unenroll_aal2_required',
  'totp_unenroll_failed',
  'totp_session_required',
  'totp_rate_limited',
  'passkey_unsupported',
  'passkey_unavailable',
  'passkey_register_failed',
  'network',
  'unknown',
] as const

export type SecurityFehlerCode = (typeof SECURITY_FEHLER_CODES)[number]

export type SecurityFehlerVorgang =
  | 'list'
  | 'enroll'
  | 'verify'
  | 'unenroll'
  | 'passkey_register'

export type SecurityFehlerEinordnung = {
  vorgang: SecurityFehlerVorgang
  meldung?: string | null
  code?: string | null
  status?: number | null
}

export type SecurityFehler = {
  code: SecurityFehlerCode
  text: string
}

const TEXTE: Record<SecurityFehlerCode, string> = {
  totp_list_unsupported: 'Die Liste der zweiten Faktoren wird in dieser Umgebung nicht unterstützt.',
  totp_list_failed: 'Die zweiten Faktoren konnten nicht geladen werden. Bitte versuche es erneut.',
  totp_enroll_unavailable: 'Die Einrichtung der Authenticator-App ist in dieser Umgebung nicht verfügbar.',
  totp_enroll_failed: 'Die Authenticator-App konnte nicht eingerichtet werden. Bitte versuche es erneut.',
  totp_verify_invalid: 'Der Code ist ungültig. Bitte prüfe die Authenticator-App und versuche es erneut.',
  totp_verify_expired: 'Der Bestätigungscode ist abgelaufen. Bitte starte die Bestätigung neu.',
  totp_verify_failed: 'Die Bestätigung ist fehlgeschlagen. Bitte versuche es erneut.',
  totp_unenroll_aal2_required:
    'Zum Entfernen einer bestätigten Authenticator-App ist eine aktuelle Zwei-Faktor-Bestätigung nötig.',
  totp_unenroll_failed: 'Die Authenticator-App konnte nicht entfernt werden. Bitte versuche es erneut.',
  totp_session_required: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  totp_rate_limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  passkey_unsupported: 'Passkeys sind in der Jetnity-Anmeldung derzeit nicht unterstützt.',
  passkey_unavailable: 'Dieser Browser bietet keine Passkey-Anmeldung an.',
  passkey_register_failed: 'Der Passkey konnte nicht eingerichtet werden.',
  network: 'Die Verbindung war unterbrochen. Bitte prüfe das Netz und versuche es erneut.',
  unknown: 'Das hat gerade nicht geklappt. Bitte versuche es erneut.',
}

const LEAK_MUSTER =
  /otpauth:|secret=|bearer\s|authorization:|refresh_token|access_token|sbp_|eyj[a-z0-9_-]+\.|qr_code|totp:\/\//i

export function securityFehlerAusUnbekannt(fehler: unknown): {
  meldung: string | null
  code: string | null
  status: number | null
} {
  if (fehler && typeof fehler === 'object') {
    const objekt = fehler as { message?: unknown; code?: unknown; status?: unknown }
    return {
      meldung: typeof objekt.message === 'string' ? objekt.message : null,
      code: typeof objekt.code === 'string' ? objekt.code : null,
      status: typeof objekt.status === 'number' ? objekt.status : null,
    }
  }
  if (typeof fehler === 'string') {
    return { meldung: fehler, code: null, status: null }
  }
  return { meldung: null, code: null, status: null }
}

export function securityFehlerEinordnen(eingabe: SecurityFehlerEinordnung): SecurityFehler {
  const meldung = (eingabe.meldung ?? '').toLowerCase()
  const apiCode = (eingabe.code ?? '').toLowerCase()
  const status = eingabe.status ?? null
  const code = waehleCode({ vorgang: eingabe.vorgang, meldung, apiCode, status })
  return { code, text: TEXTE[code] }
}

function waehleCode(eingabe: {
  vorgang: SecurityFehlerVorgang
  meldung: string
  apiCode: string
  status: number | null
}): SecurityFehlerCode {
  if (istNetz(eingabe.meldung, eingabe.apiCode, eingabe.status)) return 'network'
  if (istRateLimit(eingabe.meldung, eingabe.apiCode, eingabe.status)) return 'totp_rate_limited'
  if (istSitzungFehlt(eingabe.meldung, eingabe.apiCode, eingabe.status)) return 'totp_session_required'

  if (eingabe.vorgang === 'list') {
    if (istNichtVerfuegbar(eingabe.meldung)) return 'totp_list_unsupported'
    return 'totp_list_failed'
  }

  if (eingabe.vorgang === 'enroll') {
    if (istNichtVerfuegbar(eingabe.meldung)) return 'totp_enroll_unavailable'
    return 'totp_enroll_failed'
  }

  if (eingabe.vorgang === 'verify') {
    if (istAbgelaufen(eingabe.meldung, eingabe.apiCode)) return 'totp_verify_expired'
    if (istUngueltigerCode(eingabe.meldung, eingabe.apiCode)) return 'totp_verify_invalid'
    return 'totp_verify_failed'
  }

  if (eingabe.vorgang === 'unenroll') {
    if (istAal2Noetig(eingabe.meldung, eingabe.apiCode, eingabe.status)) {
      return 'totp_unenroll_aal2_required'
    }
    return 'totp_unenroll_failed'
  }

  if (eingabe.vorgang === 'passkey_register') {
    if (istNichtVerfuegbar(eingabe.meldung) || eingabe.meldung.includes('not enabled')) {
      return 'passkey_unsupported'
    }
    if (eingabe.meldung.includes('publickeycredential') || eingabe.meldung.includes('webauthn')) {
      return 'passkey_unavailable'
    }
    return 'passkey_register_failed'
  }

  return 'unknown'
}

function istNetz(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 0 ||
    apiCode.includes('network') ||
    meldung.includes('failed to fetch') ||
    meldung.includes('networkerror') ||
    meldung.includes('load failed') ||
    (meldung.includes('network') && !meldung.includes('aal'))
  )
}

function istRateLimit(meldung: string, apiCode: string, status: number | null): boolean {
  return status === 429 || apiCode.includes('over_request') || meldung.includes('too many') || meldung.includes('rate limit')
}

function istSitzungFehlt(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 401 ||
    apiCode.includes('session_not_found') ||
    meldung.includes('auth session missing') ||
    meldung.includes('session from session_id') ||
    meldung.includes('not authenticated')
  )
}

function istNichtVerfuegbar(meldung: string): boolean {
  return (
    meldung.includes('nicht verfügbar') ||
    meldung.includes('nicht unterstützt') ||
    meldung.includes('nicht aktiviert') ||
    meldung.includes('not available') ||
    meldung.includes('not enabled') ||
    meldung.includes('not supported') ||
    meldung.includes('is disabled') ||
    meldung.includes('disabled')
  )
}

function istUngueltigerCode(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('invalid') ||
    meldung.includes('invalid totp') ||
    meldung.includes('invalid code') ||
    meldung.includes('incorrect') ||
    meldung.includes('wrong code')
  )
}

function istAbgelaufen(meldung: string, apiCode: string): boolean {
  return apiCode.includes('expired') || meldung.includes('expired') || meldung.includes('challenge not found')
}

function istAal2Noetig(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 403 ||
    apiCode.includes('insufficient_aal') ||
    apiCode.includes('aal2') ||
    meldung.includes('aal2') ||
    meldung.includes('insufficient aal') ||
    meldung.includes('higher aal')
  )
}

export function securityFehlerIstDicht(text: string, roh?: string | null): boolean {
  if (LEAK_MUSTER.test(text)) return false
  const rohtext = (roh ?? '').trim()
  if (rohtext.length >= 12 && text.toLowerCase().includes(rohtext.toLowerCase())) return false
  return true
}
