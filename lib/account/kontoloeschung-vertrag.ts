// lib/account/kontoloeschung-vertrag.ts
//
// V1 Kontolöschung: reine Verträge ohne Netz, ohne Service-Role und ohne
// Nutzertext aus GoTrue. Die Edge Function und die Einstellungen teilen
// dieselben Klassen, dieselbe Bestätigung und dieselbe Frischegrenze.

export const KONTO_LOESCHEN_BESTAETIGUNG = 'KONTO LÖSCHEN'

export const KONTO_GELOESCHT_PFAD = '/konto-geloescht'

/** Frische Passwort- und TOTP-Belege. Danach gilt die Sitzung nicht mehr als Neu-Beweis. */
export const KONTO_LOESCHUNG_FRISCHE_SEKUNDEN = 300

export const PRODUKTIONS_PROJEKT_REF = 'qscbgcdmivbbnzrcyegn'

export const ENTWICKLUNGS_PROJEKT_REF = 'yfvbxvijcorffwxbxahl' // pragma: allowlist secret

const LOESCH_KLASSEN = [
  'geloescht',
  'nicht_angemeldet',
  'nicht_gefunden',
  'anfrage_ungueltig',
  'oauth_nicht_unterstuetzt',
  'reauth_veraltet',
  'mfa_erforderlich',
  'beweis_unvollstaendig',
  'aufraeumen_fehlgeschlagen',
  'teilweise_entfernt',
  'umgebung_gesperrt',
  'nicht_verfuegbar',
] as const

export type LoeschKlasse = (typeof LOESCH_KLASSEN)[number]

export const LOESCH_STATUS: Record<LoeschKlasse, number> = {
  geloescht: 200,
  nicht_angemeldet: 401,
  nicht_gefunden: 404,
  anfrage_ungueltig: 400,
  oauth_nicht_unterstuetzt: 403,
  reauth_veraltet: 403,
  mfa_erforderlich: 403,
  beweis_unvollstaendig: 403,
  aufraeumen_fehlgeschlagen: 500,
  teilweise_entfernt: 500,
  umgebung_gesperrt: 403,
  nicht_verfuegbar: 503,
}

const KLASSEN = new Set<string>(LOESCH_KLASSEN)

const SCHRITTE = new Set([
  'anfrage',
  'umgebung',
  'identitaet',
  'beweis',
  'speicher',
  'ereignisse',
  'konto',
  'fertig',
  'abbruch',
])

const NUTZER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NIL_ID = '00000000-0000-0000-0000-000000000000'

export type AmrEintrag = {
  method: string
  timestamp: number
}

export type LoeschBeweis = {
  userId: string
  tokenSub: string
  providers: string[] | null
  aal: 'aal1' | 'aal2' | null
  amr: AmrEintrag[]
  verifiedFactorCount: number | null
  jetztSekunden: number
}

function istNutzerId(wert: string): boolean {
  return NUTZER_ID.test(wert) && wert.toLowerCase() !== NIL_ID
}

export function loeschAnfragePruefen(koerper: unknown): { ok: true } | { ok: false } {
  if (!koerper || typeof koerper !== 'object' || Array.isArray(koerper)) return { ok: false }
  const eintraege = Object.entries(koerper as Record<string, unknown>)
  if (eintraege.length !== 1) return { ok: false }
  const [schluessel, wert] = eintraege[0]
  if (schluessel !== 'confirmation') return { ok: false }
  if (wert !== KONTO_LOESCHEN_BESTAETIGUNG) return { ok: false }
  return { ok: true }
}

/**
 * Exaktes Development- und Production-Projekt nur über HTTPS, plus die
 * geprüften lokalen HTTP-Hosts. Jede andere gehostete URL bleibt geschlossen.
 * Production- und Development-HTTP bleiben geschlossen.
 */
export function loeschUmgebungErlaubt(supabaseUrl: string | null | undefined): boolean {
  if (!supabaseUrl) return false
  let url: URL
  try {
    url = new URL(supabaseUrl)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  const host = url.hostname.toLowerCase()
  if (
    host === `${PRODUKTIONS_PROJEKT_REF}.supabase.co` ||
    host === `${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`
  ) {
    return url.protocol === 'https:'
  }
  if (url.protocol !== 'http:') return false
  // Node liefert die IPv6-Loopback-Adresse als `[::1]`, nicht als `::1`.
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]' || host === 'kong'
}

export function jwtAnspruecheLesen(
  jwt: string,
): { sub: string; aal: 'aal1' | 'aal2' | null; amr: AmrEintrag[] } | null {
  const teile = jwt.split('.')
  if (teile.length !== 3 || teile.some((teil) => teil.length === 0)) return null
  const nutzlast = base64UrlObjekt(teile[1])
  if (!nutzlast) return null
  const sub = typeof nutzlast.sub === 'string' ? nutzlast.sub : ''
  if (!istNutzerId(sub)) return null
  const aal = nutzlast.aal === 'aal1' || nutzlast.aal === 'aal2' ? nutzlast.aal : null
  return { sub, aal, amr: amrLesen(nutzlast.amr) }
}

export function frischerAmr(
  amr: readonly AmrEintrag[],
  methoden: readonly string[],
  jetztSekunden: number,
): boolean {
  let neueste = Number.NEGATIVE_INFINITY
  for (const eintrag of amr) {
    if (!methoden.includes(eintrag.method)) continue
    if (eintrag.timestamp > neueste) neueste = eintrag.timestamp
  }
  if (!Number.isFinite(neueste)) return false
  if (neueste > jetztSekunden + 30) return false
  return jetztSekunden - neueste <= KONTO_LOESCHUNG_FRISCHE_SEKUNDEN
}

export function loeschBerechtigungPruefen(
  beweis: LoeschBeweis,
): { ok: true } | { ok: false; klasse: LoeschKlasse } {
  if (!istNutzerId(beweis.userId) || beweis.tokenSub.toLowerCase() !== beweis.userId.toLowerCase()) {
    return { ok: false, klasse: 'nicht_angemeldet' }
  }
  if (beweis.providers === null) return { ok: false, klasse: 'beweis_unvollstaendig' }
  const passwortKonto = beweis.providers.includes('email')
  if (beweis.providers.length > 0 && !passwortKonto) {
    return { ok: false, klasse: 'oauth_nicht_unterstuetzt' }
  }
  if (!passwortKonto) return { ok: false, klasse: 'beweis_unvollstaendig' }
  if (beweis.aal !== 'aal1' && beweis.aal !== 'aal2') {
    return { ok: false, klasse: 'beweis_unvollstaendig' }
  }
  if (!frischerAmr(beweis.amr, ['password'], beweis.jetztSekunden)) {
    return { ok: false, klasse: 'reauth_veraltet' }
  }
  if (beweis.verifiedFactorCount === null || beweis.verifiedFactorCount < 0) {
    return { ok: false, klasse: 'beweis_unvollstaendig' }
  }
  if (beweis.verifiedFactorCount > 0) {
    if (beweis.aal !== 'aal2') return { ok: false, klasse: 'mfa_erforderlich' }
    if (!frischerAmr(beweis.amr, ['totp', 'phone'], beweis.jetztSekunden)) {
      return { ok: false, klasse: 'mfa_erforderlich' }
    }
  }
  return { ok: true }
}

export function loeschAntwortKlasse(body: unknown): LoeschKlasse | 'unbekannt' {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'unbekannt'
  const klasse = (body as { klasse?: unknown }).klasse
  if (typeof klasse !== 'string' || !KLASSEN.has(klasse)) return 'unbekannt'
  return klasse as LoeschKlasse
}

export function loeschProtokollZeile(klasse: string, schritt: string): string {
  const sicherKlasse = KLASSEN.has(klasse) ? klasse : 'unbekannt'
  const sicherSchritt = SCHRITTE.has(schritt) ? schritt : 'abbruch'
  return `kontoloeschung klasse=${sicherKlasse} schritt=${sicherSchritt}`
}

function amrLesen(wert: unknown): AmrEintrag[] {
  if (!Array.isArray(wert)) return []
  const aus: AmrEintrag[] = []
  for (const eintrag of wert) {
    if (!eintrag || typeof eintrag !== 'object') continue
    const method = (eintrag as { method?: unknown }).method
    const timestamp = (eintrag as { timestamp?: unknown }).timestamp
    if (typeof method !== 'string' || method.length === 0 || method.length > 40) continue
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) continue
    aus.push({ method, timestamp })
  }
  return aus
}

function base64UrlObjekt(segment: string): Record<string, unknown> | null {
  try {
    const normalisiert = segment.replace(/-/g, '+').replace(/_/g, '/')
    const rest = normalisiert.length % 4
    const gepolstert = rest === 0 ? normalisiert : normalisiert + '='.repeat(4 - rest)
    const text = atob(gepolstert)
    const wert: unknown = JSON.parse(text)
    if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
    return wert as Record<string, unknown>
  } catch {
    return null
  }
}
