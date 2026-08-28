// lib/auth/account-logout-scopes.ts
//
// AP-5-S3: vorhandene Supabase-Logout-Scopes ehrlich nutzbar machen.
// Keine Sessionliste. Kein sofortiges JWT-Kill. Kein Client-only-Erfolg.
// Das allgemeine Jetnity-Abmelden bleibt unscoped und damit global.

import {
  securityFehlerAusUnbekannt,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'

export const LOGOUT_SCOPES = ['local', 'others', 'global'] as const

export type LogoutScope = (typeof LOGOUT_SCOPES)[number]

export type LogoutLage = 'idle' | 'working' | 'success' | 'error' | 'unavailable' | 'unsupported'

export type LogoutFehlerCode =
  | 'session_required'
  | 'unsupported'
  | 'unavailable'
  | 'invalid_scope'
  | 'network'
  | 'rate_limited'
  | 'failed'
  | 'others_ended_local'
  | 'unknown'

export type LogoutFehler = {
  code: LogoutFehlerCode
  text: string
}

export type LogoutZustand = {
  lage: LogoutLage
  scope: LogoutScope | null
  bestaetigungFuer: 'global' | null
  fehler: LogoutFehler | null
}

export type LogoutEreignis =
  | { typ: 'verlange_bestaetigung'; scope: 'global' }
  | { typ: 'brich_bestaetigung' }
  | { typ: 'starte'; scope: LogoutScope }
  | { typ: 'client_unbekannt' }
  | { typ: 'client_ohne_sitzung' }
  | { typ: 'ausfuehren_ok'; scope: LogoutScope }
  | { typ: 'ausfuehren_fehler'; fehler: LogoutFehler }

export type LogoutAuthFehler = {
  message?: string
  code?: string
  status?: number
}

export type LogoutAuth = {
  getUser: () => Promise<{
    data: { user: { id?: string | null } | null }
    error: LogoutAuthFehler | null
  }>
  signOut?: (options: { scope: LogoutScope }) => Promise<{ error: LogoutAuthFehler | null }>
}

export type LogoutAktion = {
  scope: LogoutScope
  label: string
  beschreibung: string
  gefaehrlich: boolean
}

export const LOGOUT_ANFANG: LogoutZustand = {
  lage: 'idle',
  scope: null,
  bestaetigungFuer: null,
  fehler: null,
}

export const LOGOUT_JWT_HINWEIS =
  'Bereits ausgestellte Zugangscodes können noch bis zu einer Stunde gültig bleiben. Jetnity behauptet nicht, dass sie sofort ungültig werden.'

export const LOGOUT_AKTIONEN: Record<LogoutScope, LogoutAktion> = {
  local: {
    scope: 'local',
    label: 'Dieses Gerät abmelden',
    beschreibung:
      'Beendet nur diese Sitzung auf diesem Gerät. Andere Sitzungen bleiben bestehen. Jetnity kann andere Geräte nicht aufzählen.',
    gefaehrlich: false,
  },
  others: {
    scope: 'others',
    label: 'Andere Geräte abmelden',
    beschreibung:
      'Beendet andere Sitzungen und behält diese. Jetnity zeigt nicht, wie viele andere Sitzungen es gibt oder betroffen waren.',
    gefaehrlich: false,
  },
  global: {
    scope: 'global',
    label: 'Überall abmelden',
    beschreibung:
      'Beendet alle Sitzungen, auch dieses Gerät. Das ist dieselbe Semantik wie das allgemeine Jetnity-Abmelden.',
    gefaehrlich: true,
  },
}

const FEHLER_TEXTE: Record<LogoutFehlerCode, string> = {
  session_required: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  unsupported: 'Diese Abmelde-Variante ist in dieser Umgebung nicht unterstützt.',
  unavailable: 'Die Abmeldung ist gerade nicht verfügbar.',
  invalid_scope: 'Diese Abmelde-Aktion ist ungültig.',
  network: 'Die Verbindung war unterbrochen. Ob andere Sitzungen beendet wurden, ist unbestätigt.',
  rate_limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  failed: 'Die Abmeldung konnte nicht bestätigt werden. Bitte versuche es erneut.',
  others_ended_local:
    'Die Abmeldung anderer Sitzungen hat auch diese Sitzung beendet. Das ist nicht die erwartete Semantik.',
  unknown: 'Das hat gerade nicht geklappt. Bitte versuche es erneut.',
}

const ERFOLG_TEXTE: Record<LogoutScope, string> = {
  local: `Diese Sitzung wurde abgemeldet. ${LOGOUT_JWT_HINWEIS}`,
  others: `Die Abmeldung anderer Sitzungen wurde bestätigt. Diese Sitzung bleibt aktiv. Wie viele andere Sitzungen betroffen waren, ist unbekannt. ${LOGOUT_JWT_HINWEIS}`,
  global: `Die Abmeldung überall wurde bestätigt. ${LOGOUT_JWT_HINWEIS}`,
}

const LAGE_TEXTE: Record<LogoutLage, string> = {
  idle: 'Du kannst diese Sitzung, andere Sitzungen oder alle Sitzungen beenden. Jetnity listet keine Geräte auf.',
  working: 'Abmeldung wird ausgeführt.',
  success: 'Die Abmeldung wurde bestätigt.',
  error: 'Die Abmeldung konnte nicht bestätigt werden.',
  unsupported: FEHLER_TEXTE.unsupported,
  unavailable: FEHLER_TEXTE.unavailable,
}

export function logoutScopeLesen(wert: unknown): LogoutScope | null {
  if (wert === 'local' || wert === 'others' || wert === 'global') return wert
  return null
}

export function logoutScopeAusAktion(label: string): LogoutScope | null {
  const treffer = LOGOUT_SCOPES.find((scope) => LOGOUT_AKTIONEN[scope].label === label)
  return treffer ?? null
}

export function logoutBeendetLokaleSitzung(scope: LogoutScope): boolean {
  return scope !== 'others'
}

export function logoutErfordertBestaetigung(scope: LogoutScope): boolean {
  return scope === 'global'
}

export function logoutFehler(code: LogoutFehlerCode): LogoutFehler {
  return { code, text: FEHLER_TEXTE[code] }
}

export function logoutFehlerEinordnen(eingabe: {
  meldung?: string | null
  code?: string | null
  status?: number | null
}): LogoutFehler {
  const meldung = (eingabe.meldung ?? '').toLowerCase()
  const apiCode = (eingabe.code ?? '').toLowerCase()
  const status = eingabe.status ?? null

  if (istNetz(meldung, apiCode, status)) return logoutFehler('network')
  if (istSitzungFehlt(meldung, apiCode, status)) return logoutFehler('session_required')
  if (istRateLimit(meldung, apiCode, status)) return logoutFehler('rate_limited')
  if (istNichtUnterstuetzt(meldung, apiCode)) return logoutFehler('unsupported')
  if (istNichtVerfuegbar(meldung, apiCode)) return logoutFehler('unavailable')
  return logoutFehler('failed')
}

export function logoutWeiter(zustand: LogoutZustand, ereignis: LogoutEreignis): LogoutZustand {
  switch (ereignis.typ) {
    case 'verlange_bestaetigung':
      if (!darfLogoutStarten(zustand)) return zustand
      if (ereignis.scope !== 'global') return zustand
      return {
        lage: 'idle',
        scope: null,
        bestaetigungFuer: 'global',
        fehler: null,
      }
    case 'brich_bestaetigung':
      if (zustand.lage !== 'idle' || zustand.bestaetigungFuer !== 'global') return zustand
      return LOGOUT_ANFANG
    case 'starte':
      if (!darfLogoutStarten(zustand)) return zustand
      if (logoutErfordertBestaetigung(ereignis.scope) && zustand.bestaetigungFuer !== 'global') {
        return zustand
      }
      return {
        lage: 'working',
        scope: ereignis.scope,
        bestaetigungFuer: null,
        fehler: null,
      }
    case 'client_unbekannt':
      if (zustand.lage !== 'working') return zustand
      return {
        lage: 'unsupported',
        scope: zustand.scope,
        bestaetigungFuer: null,
        fehler: logoutFehler('unsupported'),
      }
    case 'client_ohne_sitzung':
      if (zustand.lage !== 'working') return zustand
      return {
        lage: 'unavailable',
        scope: zustand.scope,
        bestaetigungFuer: null,
        fehler: logoutFehler('session_required'),
      }
    case 'ausfuehren_ok':
      if (zustand.lage !== 'working' || zustand.scope !== ereignis.scope) return zustand
      return {
        lage: 'success',
        scope: ereignis.scope,
        bestaetigungFuer: null,
        fehler: null,
      }
    case 'ausfuehren_fehler':
      if (zustand.lage !== 'working') return zustand
      return lageFuerFehler(zustand.scope, ereignis.fehler)
    default:
      return zustand
  }
}

function lageFuerFehler(scope: LogoutScope | null, fehler: LogoutFehler): LogoutZustand {
  if (fehler.code === 'unsupported') {
    return { lage: 'unsupported', scope, bestaetigungFuer: null, fehler }
  }
  if (fehler.code === 'unavailable' || fehler.code === 'session_required') {
    return { lage: 'unavailable', scope, bestaetigungFuer: null, fehler }
  }
  return { lage: 'error', scope, bestaetigungFuer: null, fehler }
}

export function darfLogoutStarten(zustand: LogoutZustand): boolean {
  if (zustand.lage === 'working' || zustand.lage === 'unsupported' || zustand.lage === 'unavailable') {
    return false
  }
  if (zustand.lage === 'success' && zustand.scope && logoutBeendetLokaleSitzung(zustand.scope)) {
    return false
  }
  return true
}

export function logoutIstBeschaeftigt(zustand: LogoutZustand): boolean {
  return zustand.lage === 'working'
}

export function logoutErfolgBehaupten(zustand: LogoutZustand): boolean {
  return zustand.lage === 'success'
}

export function logoutSollLokalenAuthVerlassen(zustand: LogoutZustand): boolean {
  return (
    zustand.lage === 'success' &&
    zustand.scope !== null &&
    logoutBeendetLokaleSitzung(zustand.scope)
  )
}

export function logoutStatusText(zustand: LogoutZustand): string {
  if (zustand.lage === 'success' && zustand.scope) return ERFOLG_TEXTE[zustand.scope]
  if ((zustand.lage === 'error' || zustand.lage === 'unsupported' || zustand.lage === 'unavailable') && zustand.fehler) {
    return zustand.fehler.text
  }
  if (zustand.lage === 'working' && zustand.scope) {
    return `${LOGOUT_AKTIONEN[zustand.scope].label} wird ausgeführt.`
  }
  if (zustand.bestaetigungFuer === 'global') {
    return 'Bitte bestätige, dass wirklich alle Sitzungen beendet werden sollen.'
  }
  return LAGE_TEXTE[zustand.lage]
}

export function logoutNutzlast(scope: LogoutScope): { scope: LogoutScope } {
  return { scope }
}

export async function logoutScopeAusfuehren(
  auth: LogoutAuth,
  scopeRoh: unknown,
): Promise<Extract<LogoutEreignis, { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'ausfuehren_ok' | 'ausfuehren_fehler' }>> {
  const scope = logoutScopeLesen(scopeRoh)
  if (!scope) {
    return { typ: 'ausfuehren_fehler', fehler: logoutFehler('invalid_scope') }
  }
  if (typeof auth.signOut !== 'function') {
    return { typ: 'client_unbekannt' }
  }

  try {
    const sitzung = await auth.getUser()
    if (sitzung.error) {
      return sitzungEreignisAusFehler(sitzung.error)
    }
    if (!sitzung.data.user) {
      return { typ: 'client_ohne_sitzung' }
    }

    const { error } = await auth.signOut(logoutNutzlast(scope))
    if (error) {
      const gelesen = securityFehlerAusUnbekannt(error)
      return {
        typ: 'ausfuehren_fehler',
        fehler: logoutFehlerEinordnen({
          meldung: gelesen.meldung,
          code: gelesen.code,
          status: gelesen.status,
        }),
      }
    }

    if (scope === 'others') {
      const danach = await auth.getUser()
      if (danach.error) {
        const gelesen = securityFehlerAusUnbekannt(danach.error)
        const eingeordnet = logoutFehlerEinordnen({
          meldung: gelesen.meldung,
          code: gelesen.code,
          status: gelesen.status,
        })
        if (eingeordnet.code === 'session_required') {
          return { typ: 'ausfuehren_fehler', fehler: logoutFehler('others_ended_local') }
        }
        return { typ: 'ausfuehren_fehler', fehler: eingeordnet }
      }
      if (!danach.data.user) {
        return { typ: 'ausfuehren_fehler', fehler: logoutFehler('others_ended_local') }
      }
    }

    return { typ: 'ausfuehren_ok', scope }
  } catch (fehler) {
    const gelesen = securityFehlerAusUnbekannt(fehler)
    const eingeordnet = logoutFehlerEinordnen({
      meldung: gelesen.meldung,
      code: gelesen.code,
      status: gelesen.status,
    })
    if (eingeordnet.code === 'unsupported') return { typ: 'client_unbekannt' }
    if (eingeordnet.code === 'session_required') return { typ: 'client_ohne_sitzung' }
    return { typ: 'ausfuehren_fehler', fehler: eingeordnet }
  }
}

function sitzungEreignisAusFehler(
  fehler: unknown,
): Extract<LogoutEreignis, { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'ausfuehren_fehler' }> {
  const gelesen = securityFehlerAusUnbekannt(fehler)
  const eingeordnet = logoutFehlerEinordnen({
    meldung: gelesen.meldung,
    code: gelesen.code,
    status: gelesen.status,
  })
  if (eingeordnet.code === 'unsupported') return { typ: 'client_unbekannt' }
  if (eingeordnet.code === 'session_required') return { typ: 'client_ohne_sitzung' }
  return { typ: 'ausfuehren_fehler', fehler: eingeordnet }
}

export function logoutFehlerIstDicht(text: string, roh?: string | null): boolean {
  if (!securityFehlerIstDicht(text, roh)) return false
  if (/refresh_token|access_token|session_id|gotrue|supabase|bearer\s|authorization:/i.test(text)) {
    return false
  }
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
    (meldung.includes('network') && !meldung.includes('session'))
  )
}

function istRateLimit(meldung: string, apiCode: string, status: number | null): boolean {
  return status === 429 || apiCode.includes('over_request') || meldung.includes('too many') || meldung.includes('rate limit')
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
    apiCode.includes('not_available') ||
    meldung.includes('not available') ||
    meldung.includes('not enabled') ||
    meldung.includes('nicht verfügbar')
  )
}
