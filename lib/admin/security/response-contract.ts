// Bounded read contract for the Admin security console.
// The list route stays frozen. A 200 is current data only when every displayed
// field fits this shape. Anything else must not become an empty or current list.

import { SECURITY_LISTEN_MAX_ZEILEN } from '@/lib/admin/security/filter-ehrlichkeit'

export const SECURITY_KURZFELD_MAX = 200
export const SECURITY_DETAIL_MAX = 2000

export type SecurityEventRow = {
  id: string
  created_at: string | null
  ip: string | null
  type: string | null
  user_id: string | null
  detail: string | null
}

export type SecurityBlockRow = {
  ip: string
  reason: string | null
  created_at: string | null
}

export type SecurityListenAntwort = {
  events: SecurityEventRow[]
  blocklist: SecurityBlockRow[]
}

export type AntwortProblem = 'form' | 'zeile' | 'doppelt' | 'datum' | 'grenze' | 'feld'

export type GepruefteAntwort =
  | { ok: true; daten: SecurityListenAntwort }
  | { ok: false; problem: AntwortProblem }

export type LesungsArt = 'erste' | 'angenommen' | 'veraltet' | 'verweigert' | 'unlesbar' | 'stoerung'

export type LeseZustand = {
  daten: SecurityListenAntwort | null
  art: LesungsArt
}

export type LeseAusgang =
  | { art: 'angenommen'; daten: SecurityListenAntwort }
  | { art: 'verweigert' }
  | { art: 'unlesbar' }
  | { art: 'stoerung' }

export type LeseLadung = {
  daten: SecurityListenAntwort | null
  fehler: { meldung: string; wiederholbar: boolean } | null
}

export const LEERE_LESUNG: LeseZustand = { daten: null, art: 'erste' }

function objekt(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function kurzOderNull(wert: unknown): string | null | undefined {
  if (wert == null) return null
  if (typeof wert !== 'string' || wert.length > SECURITY_KURZFELD_MAX) return undefined
  return wert.length > 0 ? wert : null
}

function detailOderNull(wert: unknown): string | null | undefined {
  if (wert == null) return null
  if (typeof wert !== 'string') return undefined
  return wert.length > 0 ? wert : null
}

/** Visible prefix only. The stored string stays intact for filtering. */
export function angezeigterSicherheitstext(wert: string | null): { text: string; hinweis: string | null } {
  if (!wert) return { text: '', hinweis: null }
  if (wert.length <= SECURITY_DETAIL_MAX) return { text: wert, hinweis: null }
  return {
    text: wert.slice(0, SECURITY_DETAIL_MAX),
    hinweis: `Gekürzt: die ersten ${SECURITY_DETAIL_MAX} von ${wert.length} Zeichen. Der übrige Text ist in dieser Ansicht nicht sichtbar.`,
  }
}

function datumOderNull(wert: unknown): string | null | undefined {
  if (wert == null) return null
  if (typeof wert !== 'string' || wert.length < 10 || wert.length > 40) return undefined
  if (!/^\d{4}-\d{2}-\d{2}/.test(wert)) return undefined
  const zeit = Date.parse(wert)
  if (!Number.isFinite(zeit)) return undefined
  return wert
}

function ereignis(wert: unknown): SecurityEventRow | AntwortProblem {
  const zeile = objekt(wert)
  if (!zeile) return 'zeile'
  const id = zeile.id
  if (typeof id !== 'string' || id.length === 0 || id.length > SECURITY_KURZFELD_MAX) return 'feld'
  const created_at = datumOderNull(zeile.created_at)
  if (created_at === undefined) return 'datum'
  const ip = kurzOderNull(zeile.ip)
  const type = kurzOderNull(zeile.type)
  const user_id = kurzOderNull(zeile.user_id)
  const detail = detailOderNull(zeile.detail)
  if (ip === undefined || type === undefined || user_id === undefined || detail === undefined) return 'feld'
  return { id, created_at, ip, type, user_id, detail }
}

function sperre(wert: unknown): SecurityBlockRow | AntwortProblem {
  const zeile = objekt(wert)
  if (!zeile) return 'zeile'
  if (typeof zeile.ip !== 'string') return 'feld'
  const ip = zeile.ip.trim()
  if (ip.length === 0 || ip.length > SECURITY_KURZFELD_MAX) return 'feld'
  const reason = detailOderNull(zeile.reason)
  const created_at = datumOderNull(zeile.created_at)
  if (reason === undefined) return 'feld'
  if (created_at === undefined) return 'datum'
  return { ip, reason, created_at }
}

export function pruefeSecurityListenAntwort(koerper: unknown): GepruefteAntwort {
  const wurzel = objekt(koerper)
  if (!wurzel || !Array.isArray(wurzel.events) || !Array.isArray(wurzel.blocklist)) {
    return { ok: false, problem: 'form' }
  }
  if (wurzel.events.length > SECURITY_LISTEN_MAX_ZEILEN || wurzel.blocklist.length > SECURITY_LISTEN_MAX_ZEILEN) {
    return { ok: false, problem: 'grenze' }
  }

  const events: SecurityEventRow[] = []
  const eventIds = new Set<string>()
  for (const roh of wurzel.events) {
    const zeile = ereignis(roh)
    if (typeof zeile === 'string') return { ok: false, problem: zeile }
    if (eventIds.has(zeile.id)) return { ok: false, problem: 'doppelt' }
    eventIds.add(zeile.id)
    events.push(zeile)
  }

  const blocklist: SecurityBlockRow[] = []
  const ips = new Set<string>()
  for (const roh of wurzel.blocklist) {
    const zeile = sperre(roh)
    if (typeof zeile === 'string') return { ok: false, problem: zeile }
    if (ips.has(zeile.ip)) return { ok: false, problem: 'doppelt' }
    ips.add(zeile.ip)
    blocklist.push(zeile)
  }

  return { ok: true, daten: { events, blocklist } }
}

export function leseAusgang(status: number, ladung: LeseLadung): LeseAusgang {
  if (status === 401 || status === 403) return { art: 'verweigert' }
  if (ladung.fehler) return { art: status === 200 ? 'unlesbar' : 'stoerung' }
  if (!ladung.daten) return { art: 'stoerung' }
  return { art: 'angenommen', daten: ladung.daten }
}

/**
 * Applies one authoritative read.
 * Denial drops protected rows. A later disturbance must not put them back.
 * A malformed 200 never replaces the snapshot with itself or with an empty list.
 * Only an accepted read restores rows.
 */
export function wendeLesungAn(bisher: LeseZustand, ausgang: LeseAusgang): LeseZustand {
  if (ausgang.art === 'angenommen') return { daten: ausgang.daten, art: 'angenommen' }
  if (ausgang.art === 'verweigert') return { daten: null, art: 'verweigert' }

  const snapshot = bisher.art === 'verweigert' || bisher.daten === null ? null : bisher.daten
  if (snapshot === null) {
    return { daten: null, art: ausgang.art === 'unlesbar' ? 'unlesbar' : 'stoerung' }
  }
  if (ausgang.art === 'unlesbar') return { daten: snapshot, art: 'unlesbar' }
  return { daten: snapshot, art: 'veraltet' }
}

/** Fixed operator text. The server body is not copied into the view. */
export function sichereLeseFehler(status: number): { meldung: string; wiederholbar: boolean } {
  if (status === 401) return { meldung: 'Nicht angemeldet.', wiederholbar: false }
  if (status === 403) return { meldung: 'Für diese Ansicht fehlt die Berechtigung.', wiederholbar: false }
  if (status === 200) return { meldung: 'Die Antwort des Servers war nicht lesbar.', wiederholbar: false }
  if (status === 0) return { meldung: 'Der Server ist nicht erreichbar.', wiederholbar: true }
  return {
    meldung: `Der Server antwortete mit Status ${status}.`,
    wiederholbar: status === 503,
  }
}
