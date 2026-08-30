// lib/auth/globales-sign-out.ts
//
// AP-5-R1: allgemeines/admin Abmelden bleibt unscoped/global.
// Erfolg ist nur die bestätigte Auth-Antwort. { error } oder ein Wurf
// ist kein Success-Redirect und keine „abgemeldet“-Behauptung.

import {
  securityFehlerAusUnbekannt,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'

export const GLOBALES_SIGN_OUT_ZIEL_PUBLIC = '/' as const
export const GLOBALES_SIGN_OUT_ZIEL_ADMIN = '/admin/login' as const

export const GLOBALES_SIGN_OUT_ZIELE = [
  GLOBALES_SIGN_OUT_ZIEL_PUBLIC,
  GLOBALES_SIGN_OUT_ZIEL_ADMIN,
] as const

export type GlobalesSignOutZiel = (typeof GLOBALES_SIGN_OUT_ZIELE)[number]

export type GlobalesSignOutFehlerCode = 'network' | 'rate_limited' | 'failed'

export type GlobalesSignOutFehler = {
  code: GlobalesSignOutFehlerCode
  text: string
}

export type GlobalesSignOutErgebnis =
  | { ok: true; ziel: GlobalesSignOutZiel }
  | { ok: false; fehler: GlobalesSignOutFehler }

export type GlobalesSignOutAuth = {
  signOut: () => Promise<{ error?: unknown } | void>
}

const FEHLER_TEXTE: Record<GlobalesSignOutFehlerCode, string> = {
  network:
    'Die Verbindung war unterbrochen. Ob die Abmeldung abgeschlossen wurde, ist unbestätigt. Bitte versuche es erneut.',
  rate_limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  failed: 'Die Abmeldung konnte nicht bestätigt werden. Bitte versuche es erneut.',
}

export function globalesSignOutFehler(code: GlobalesSignOutFehlerCode): GlobalesSignOutFehler {
  return { code, text: FEHLER_TEXTE[code] }
}

export function globalesSignOutZielLesen(wert: unknown): GlobalesSignOutZiel | null {
  if (wert === GLOBALES_SIGN_OUT_ZIEL_PUBLIC || wert === GLOBALES_SIGN_OUT_ZIEL_ADMIN) {
    return wert
  }
  return null
}

export function globalesSignOutFehlerEinordnen(fehler: unknown): GlobalesSignOutFehler {
  const gelesen = securityFehlerAusUnbekannt(fehler)
  const meldung = (gelesen.meldung ?? '').toLowerCase()
  const apiCode = (gelesen.code ?? '').toLowerCase()
  const status = gelesen.status

  if (istNetz(meldung, apiCode, status)) return globalesSignOutFehler('network')
  if (istRateLimit(meldung, apiCode, status)) return globalesSignOutFehler('rate_limited')
  return globalesSignOutFehler('failed')
}

export function globalesSignOutAusAntwort(
  error: unknown,
  ziel: unknown,
): GlobalesSignOutErgebnis {
  const erlaubt = globalesSignOutZielLesen(ziel)
  if (!erlaubt) return { ok: false, fehler: globalesSignOutFehler('failed') }
  if (error) {
    return { ok: false, fehler: globalesSignOutFehlerEinordnen(error) }
  }
  return { ok: true, ziel: erlaubt }
}

export function globalesSignOutAusWurf(fehler: unknown): GlobalesSignOutErgebnis {
  return { ok: false, fehler: globalesSignOutFehlerEinordnen(fehler) }
}

export async function globalesSignOutAusfuehren(
  auth: GlobalesSignOutAuth,
  ziel: unknown,
): Promise<GlobalesSignOutErgebnis> {
  try {
    if (typeof auth.signOut !== 'function') {
      return { ok: false, fehler: globalesSignOutFehler('failed') }
    }
    const antwort = await auth.signOut()
    const error = antwort && typeof antwort === 'object' ? antwort.error : null
    return globalesSignOutAusAntwort(error ?? null, ziel)
  } catch (fehler) {
    return globalesSignOutAusWurf(fehler)
  }
}

export function globalesSignOutDarfWeiterleiten(ergebnis: GlobalesSignOutErgebnis): boolean {
  return ergebnis.ok === true
}

export function globalesSignOutWeiterleitungsziel(
  ergebnis: GlobalesSignOutErgebnis,
): GlobalesSignOutZiel | null {
  return ergebnis.ok ? ergebnis.ziel : null
}

export function globalesSignOutFehlerIstDicht(text: string, roh?: string | null): boolean {
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
