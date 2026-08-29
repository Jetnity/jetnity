// lib/auth/account-session-view.ts
//
// AP-5-S5: ehrliche aktuelle Sessionansicht. Keine Geräteliste.
// Andere Sitzungen bleiben unsupported, niemals empty oder eine Zahl.
// Keine Service Role und kein privilegiertes Session-Schema.

import {
  securityFehlerAusUnbekannt,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'

export const SITZUNG_ANDERE_LAGE = 'unsupported' as const

export type SitzungLage = 'loading' | 'current' | 'unavailable' | 'unsupported' | 'error'

export type SitzungAal = 'aal1' | 'aal2'

export type SitzungFehlerCode =
  | 'session_required'
  | 'unsupported'
  | 'unavailable'
  | 'network'
  | 'unknown'

export type SitzungFehler = {
  code: SitzungFehlerCode
  text: string
}

export type AktuelleSitzungFakten = {
  zugangscodeBisUnix: number | null
  aal: SitzungAal | null
}

export type LokalerGeraeteHinweis = {
  text: string
  quelle: 'lokal'
}

export type SitzungZustand = {
  lage: SitzungLage
  aktuelle: AktuelleSitzungFakten | null
  andere: typeof SITZUNG_ANDERE_LAGE
  lokal: LokalerGeraeteHinweis | null
  fehler: SitzungFehler | null
}

export type SitzungAuthFehler = {
  message?: string
  code?: string
  status?: number
}

export type SitzungAuth = {
  getUser?: () => Promise<{
    data: { user: { id?: string | null } | null }
    error: SitzungAuthFehler | null
  }>
  getSession?: () => Promise<{
    data: { session: unknown }
    error: SitzungAuthFehler | null
  }>
  mfa?: {
    getAuthenticatorAssuranceLevel?: () => Promise<{
      data: { currentLevel?: string | null } | null
      error: SitzungAuthFehler | null
    }>
  }
}

export type NavigatorHinweis = {
  userAgentData?: {
    brands?: Array<{ brand?: string; version?: string }>
    platform?: string
  }
  userAgent?: string
}

export const SITZUNG_ANFANG: SitzungZustand = {
  lage: 'loading',
  aktuelle: null,
  andere: SITZUNG_ANDERE_LAGE,
  lokal: null,
  fehler: null,
}

export const SITZUNG_ABMELDEN_ANKER = 'account-abmelden'

export const SITZUNG_ZUGANGSCODE_HINWEIS =
  'Das ist die Gültigkeit des aktuellen Zugangscodes, nicht das Ende der Sitzung und keine letzte Aktivität.'

export const ANDERE_SITZUNGEN_TEXT =
  'Einzelne andere Sitzungen können mit der vorhandenen Anmeldung nicht aufgelistet werden. Jetnity zeigt deshalb keine Geräteliste und keine Zahl – auch nicht null. Andere Sitzungen kannst du trotzdem über die vorhandene Abmelden-Aktion beenden.'

export const LOKAL_HINWEIS_LABEL =
  'Lokal erkannt, nicht serverseitig als Geräteidentität geprüft'

const FEHLER_TEXTE: Record<SitzungFehlerCode, string> = {
  session_required: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  unsupported:
    'Die aktuelle Sitzung kann in dieser Umgebung nicht sicher bestimmt werden. Das heisst nicht, dass keine Sitzung besteht.',
  unavailable: 'Die aktuelle Sitzung ist gerade nicht verfügbar.',
  network: 'Die Verbindung war unterbrochen. Ob die aktuelle Sitzung besteht, ist deshalb unbekannt.',
  unknown: 'Die aktuelle Sitzung konnte gerade nicht bestätigt werden. Bitte versuche es erneut.',
}

const LAGE_TEXTE: Record<SitzungLage, string> = {
  loading: 'Die aktuelle Sitzung wird geprüft.',
  current: 'Diese Sitzung ist aktiv. Andere Sitzungen können derzeit nicht einzeln aufgelistet werden.',
  unavailable: FEHLER_TEXTE.session_required,
  unsupported: FEHLER_TEXTE.unsupported,
  error: FEHLER_TEXTE.unknown,
}

const AAL_TEXTE: Record<SitzungAal, string> = {
  aal1: 'Passwort oder gleichwertige Anmeldung',
  aal2: 'Zwei-Faktor-bestätigt für diese Sitzung',
}

const BROWSER_ERLAUBT = new Set([
  'Chrome',
  'Edge',
  'Firefox',
  'Safari',
  'Opera',
  'Brave',
  'Chromium-Browser',
])

const PLATTFORM_ERLAUBT = new Set(['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'Chrome OS'])

const LEAK_MUSTER =
  /session_id|access_token|refresh_token|authorization:|bearer\s|cookie|set-cookie|user-agent|eyj[a-z0-9_-]+\.|gotrue|supabase|sbp_|factor_id|challenge_id/i

export function sitzungFehler(code: SitzungFehlerCode): SitzungFehler {
  return { code, text: FEHLER_TEXTE[code] }
}

export function andereSitzungenLage(): typeof SITZUNG_ANDERE_LAGE {
  return SITZUNG_ANDERE_LAGE
}

export function andereSitzungenSindLeer(_zustand: SitzungZustand): false {
  return false
}

export function andereSitzungenAnzahl(_zustand: SitzungZustand): null {
  return null
}

export function sitzungIstBeschaeftigt(zustand: SitzungZustand): boolean {
  return zustand.lage === 'loading'
}

export function sitzungFehlerIstDicht(text: string, roh?: string | null): boolean {
  if (!securityFehlerIstDicht(text, roh)) return false
  if (LEAK_MUSTER.test(text)) return false
  return true
}

export function zugangscodeZeitLesen(
  expiresAt: unknown,
  jetztSekunden: number = Math.floor(Date.now() / 1000),
): number | null {
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null
  const expires = Math.trunc(expiresAt)
  if (expires <= 0) return null
  const delta = expires - jetztSekunden
  if (delta < -2 * 3600 || delta > 24 * 3600) return null
  return expires
}

export function zugangscodeZeitText(unix: number): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(unix * 1000))
}

export function sitzungAalLesen(wert: unknown): SitzungAal | null {
  return wert === 'aal1' || wert === 'aal2' ? wert : null
}

export function sitzungExpiresAtLesen(session: unknown): unknown {
  if (!session || typeof session !== 'object') return null
  return (session as { expires_at?: unknown }).expires_at ?? null
}

export function lokalenGeraeteHinweisAbleiten(nav: NavigatorHinweis | null | undefined): LokalerGeraeteHinweis | null {
  if (!nav) return null
  const hints = nav.userAgentData
  const browser =
    markeAusHints(hints?.brands) ?? browserAusUserAgent(nav.userAgent)
  const plattform =
    plattformNormalisieren(hints?.platform) ?? plattformAusUserAgent(nav.userAgent)
  const teile = [browser, plattform].filter((teil): teil is string => Boolean(teil))
  if (teile.length === 0) return null
  const klasse = teile.join(' · ')
  if (LEAK_MUSTER.test(klasse) || klasse.length > 40) return null
  return {
    text: `${LOKAL_HINWEIS_LABEL}: ${klasse}`,
    quelle: 'lokal',
  }
}

export function sitzungWeiter(
  zustand: SitzungZustand,
  ereignis:
    | { typ: 'starte_lesen' }
    | { typ: 'gelesen'; ergebnis: SitzungZustand },
): SitzungZustand {
  if (ereignis.typ === 'starte_lesen') {
    return { ...SITZUNG_ANFANG, lokal: zustand.lokal }
  }
  return mitAnderenUnsupported(ereignis.ergebnis)
}

export async function aktuelleSitzungLesen(
  auth: SitzungAuth,
  nav?: NavigatorHinweis | null,
  jetztSekunden?: number,
): Promise<SitzungZustand> {
  const lokal = lokalenGeraeteHinweisAbleiten(nav)
  if (typeof auth.getUser !== 'function') {
    return mitAnderenUnsupported({
      lage: 'unsupported',
      aktuelle: null,
      andere: SITZUNG_ANDERE_LAGE,
      lokal,
      fehler: sitzungFehler('unsupported'),
    })
  }

  try {
    const sitzung = await auth.getUser()
    if (sitzung.error) {
      return lageAusFehler(sitzung.error, lokal)
    }
    if (!sitzung.data.user) {
      return mitAnderenUnsupported({
        lage: 'unavailable',
        aktuelle: null,
        andere: SITZUNG_ANDERE_LAGE,
        lokal,
        fehler: sitzungFehler('session_required'),
      })
    }

    const aktuelle: AktuelleSitzungFakten = {
      zugangscodeBisUnix: await zugangscodeOptionalLesen(auth, jetztSekunden),
      aal: await aalOptionalLesen(auth),
    }

    return mitAnderenUnsupported({
      lage: 'current',
      aktuelle,
      andere: SITZUNG_ANDERE_LAGE,
      lokal,
      fehler: null,
    })
  } catch (fehler) {
    return lageAusFehler(fehler, lokal)
  }
}

export function sitzungStatusText(zustand: SitzungZustand): string {
  if ((zustand.lage === 'error' || zustand.lage === 'unsupported' || zustand.lage === 'unavailable') && zustand.fehler) {
    return zustand.fehler.text
  }
  return LAGE_TEXTE[zustand.lage]
}

export function sitzungAalText(aal: SitzungAal | null): string | null {
  return aal ? AAL_TEXTE[aal] : null
}

export function sitzungZugangscodeText(unix: number | null): string | null {
  if (!unix) return null
  return `Aktueller Zugangscode gültig bis ${zugangscodeZeitText(unix)}. ${SITZUNG_ZUGANGSCODE_HINWEIS}`
}

export function sitzungFaktenTexte(zustand: SitzungZustand): string[] {
  if (zustand.lage !== 'current' || !zustand.aktuelle) return []
  return [
    sitzungAalText(zustand.aktuelle.aal),
    sitzungZugangscodeText(zustand.aktuelle.zugangscodeBisUnix),
    zustand.lokal?.text ?? null,
  ].filter((text): text is string => Boolean(text))
}

function mitAnderenUnsupported(zustand: SitzungZustand): SitzungZustand {
  return { ...zustand, andere: SITZUNG_ANDERE_LAGE }
}

function lageAusFehler(fehler: unknown, lokal: LokalerGeraeteHinweis | null): SitzungZustand {
  const gelesen = securityFehlerAusUnbekannt(fehler)
  const eingeordnet = sitzungFehlerEinordnen({
    meldung: gelesen.meldung,
    code: gelesen.code,
    status: gelesen.status,
  })
  if (eingeordnet.code === 'unsupported') {
    return {
      lage: 'unsupported',
      aktuelle: null,
      andere: SITZUNG_ANDERE_LAGE,
      lokal,
      fehler: eingeordnet,
    }
  }
  if (eingeordnet.code === 'session_required' || eingeordnet.code === 'unavailable') {
    return {
      lage: 'unavailable',
      aktuelle: null,
      andere: SITZUNG_ANDERE_LAGE,
      lokal,
      fehler: eingeordnet.code === 'session_required' ? sitzungFehler('session_required') : eingeordnet,
    }
  }
  return {
    lage: 'error',
    aktuelle: null,
    andere: SITZUNG_ANDERE_LAGE,
    lokal,
    fehler: eingeordnet,
  }
}

function sitzungFehlerEinordnen(eingabe: {
  meldung?: string | null
  code?: string | null
  status?: number | null
}): SitzungFehler {
  const meldung = (eingabe.meldung ?? '').toLowerCase()
  const apiCode = (eingabe.code ?? '').toLowerCase()
  const status = eingabe.status ?? null

  if (istNetz(meldung, apiCode, status)) return sitzungFehler('network')
  if (istSitzungFehlt(meldung, apiCode, status)) return sitzungFehler('session_required')
  if (istNichtUnterstuetzt(meldung, apiCode)) return sitzungFehler('unsupported')
  if (istNichtVerfuegbar(meldung, apiCode)) return sitzungFehler('unavailable')
  return sitzungFehler('unknown')
}

async function zugangscodeOptionalLesen(auth: SitzungAuth, jetztSekunden?: number): Promise<number | null> {
  if (typeof auth.getSession !== 'function') return null
  try {
    const { data, error } = await auth.getSession()
    if (error || !data.session) return null
    return zugangscodeZeitLesen(sitzungExpiresAtLesen(data.session), jetztSekunden)
  } catch {
    return null
  }
}

async function aalOptionalLesen(auth: SitzungAuth): Promise<SitzungAal | null> {
  if (typeof auth.mfa?.getAuthenticatorAssuranceLevel !== 'function') return null
  try {
    const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) return null
    return sitzungAalLesen(data?.currentLevel)
  } catch {
    return null
  }
}

function markeAusHints(brands: Array<{ brand?: string; version?: string }> | undefined): string | null {
  if (!Array.isArray(brands)) return null
  const namen = brands
    .map((eintrag) => (typeof eintrag.brand === 'string' ? eintrag.brand.trim() : ''))
    .filter((name) => name && !/^not[.\s/-]/i.test(name) && !/brand/i.test(name))
  const bevorzugt = namen.find((name) => /chrome|edge|firefox|safari|opera|brave/i.test(name) && !/chromium/i.test(name))
  if (bevorzugt) return browserNormalisieren(bevorzugt)
  const chromium = namen.find((name) => /chromium/i.test(name))
  return chromium ? 'Chromium-Browser' : null
}

function browserAusUserAgent(ua: string | undefined): string | null {
  if (!ua || ua.length > 512) return null
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/firefox\//i.test(ua) || /fxios\//i.test(ua)) return 'Firefox'
  if (/crios\//i.test(ua) || /chrome\//i.test(ua)) return 'Chrome'
  if (/safari\//i.test(ua)) return 'Safari'
  return null
}

function plattformAusUserAgent(ua: string | undefined): string | null {
  if (!ua || ua.length > 512) return null
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os x|macintosh/i.test(ua)) return 'macOS'
  if (/cros/i.test(ua)) return 'Chrome OS'
  if (/linux/i.test(ua)) return 'Linux'
  return null
}

function browserNormalisieren(wert: string): string | null {
  const klein = wert.toLowerCase()
  if (klein.includes('edge')) return 'Edge'
  if (klein.includes('firefox')) return 'Firefox'
  if (klein.includes('safari')) return 'Safari'
  if (klein.includes('opera')) return 'Opera'
  if (klein.includes('brave')) return 'Brave'
  if (klein.includes('chrome')) return 'Chrome'
  return BROWSER_ERLAUBT.has(wert) ? wert : null
}

function plattformNormalisieren(wert: string | undefined): string | null {
  if (!wert) return null
  const klein = wert.toLowerCase()
  if (klein.includes('win')) return 'Windows'
  if (klein.includes('mac') || klein.includes('darwin')) return 'macOS'
  if (klein.includes('ios') || klein.includes('iphone') || klein.includes('ipad')) return 'iOS'
  if (klein.includes('android')) return 'Android'
  if (klein.includes('cros') || klein.includes('chrome os')) return 'Chrome OS'
  if (klein.includes('linux')) return 'Linux'
  return PLATTFORM_ERLAUBT.has(wert) ? wert : null
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
