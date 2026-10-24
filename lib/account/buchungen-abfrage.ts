// lib/account/buchungen-abfrage.ts
//
// Reine Abfragebeschreibung für den lesenden Buchungsordner.
// Kein Supabase-Import, kein Netzwerk, keine Zählung.
//
// Die Titelsuche ist PostgREST `imatch` mit dem PostgreSQL-Direktor `***=`.
// Der Wert bleibt der angenommene Titel, ohne zusätzliche Anführungszeichen.
// Ob PostgreSQL ihn so anwendet, ist hier nicht ausgeführt.

import { createHash } from 'node:crypto'

import {
  buchungAusZeile,
  buchungPlanpunktPfad,
  buchungenSchnittVergleich,
  istBuchungsUuid,
  type BuchungenSchnittSchluessel,
  type KontoBuchung,
  type RoheBuchungszeile,
} from '@/lib/account/buchungen'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { TRIP_ITEM_KINDS, TRIP_STATUSES, type TripItemKind, type TripStatus } from '@/types/trips'

export const BUCHUNGEN_SEITE = 50
export const BUCHUNGEN_LIMIT = BUCHUNGEN_SEITE + 1
export const BUCHUNGEN_TITEL_MAX = 120
const BUCHUNGEN_CURSOR_MAX = 512

const BUCHUNGEN_SPALTEN =
  'id, kind, title, starts_on, starts_at, ends_on, ends_at, booking_status, booking_confirmed_at, ' +
  'trips!inner(id, title, status)'

const ZEIT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,6})?(Z|\+00:00)$/

export type BuchungenArchiv = 'aktiv' | 'archiviert' | 'alle'

export type BuchungenFilter = {
  titel: string | null
  art: TripItemKind | null
  archiv: BuchungenArchiv
}

export type BuchungenCursor = {
  zeit: string | null
  id: string
}

export type BuchungenRohQuery = Record<string, string | string[] | undefined>

export type BuchungenAnfrage =
  | {
      ok: false
      grund: 'parameter' | 'cursor'
      filter: BuchungenFilter | null
      ersteSeite: string
      wiederholen: string
    }
  | {
      ok: true
      filter: BuchungenFilter
      cursor: BuchungenCursor | null
      ersteSeite: string
      wiederholen: string
    }

export type BuchungenAbfrage = {
  spalten: string
  kind: { op: 'in'; werte: readonly TripItemKind[] } | { op: 'eq'; wert: TripItemKind }
  archiv: { op: 'in'; werte: readonly TripStatus[] } | { op: 'eq'; wert: 'archived' } | null
  titelMuster: string | null
  keyset: { op: 'or'; ausdruck: string } | { op: 'null'; id: string } | null
  limit: number
}

export type BuchungenSeite =
  | { ok: true; buchungen: KontoBuchung[]; weiter: string | null }
  | { ok: false; grund: 'unvollstaendig' }

export type BuchungenErgebnis =
  | {
      ok: false
      grund: 'parameter' | 'cursor'
      filter: BuchungenFilter | null
      ersteSeite: string
      wiederholen: string
    }
  | {
      ok: false
      grund: 'lesen'
      status: number
      filter: BuchungenFilter
      ersteSeite: string
      wiederholen: string
    }
  | {
      ok: true
      filter: BuchungenFilter
      fortsetzung: boolean
      buchungen: readonly KontoBuchung[]
      weiter: string | null
      ersteSeite: string
      wiederholen: string
    }

export type BuchungenAnsicht = {
  titel: string
  art: string
  archiv: BuchungenArchiv
  zurueckHref: string | null
  ersteSeiteHref: string
  ersteSeiteZeigen: boolean
  wiederholenHref: string
  wiederholenZeigen: boolean
  zustand: 'ungueltig' | 'fehler' | 'leer' | 'keine' | 'fortsetzungLeer' | 'liste'
  fehlerStatus: number | null
  buchungen: readonly KontoBuchung[]
  weiterHref: string | null
  endeZeigen: boolean
}

export function buchungenAnsichtAus(ergebnis: BuchungenErgebnis): BuchungenAnsicht {
  const filter = ergebnis.filter ?? LEERER_FILTER
  const fortsetzung = ergebnis.ok && ergebnis.fortsetzung
  const zustand: BuchungenAnsicht['zustand'] = !ergebnis.ok
    ? ergebnis.grund === 'lesen'
      ? 'fehler'
      : 'ungueltig'
    : ergebnis.buchungen.length === 0 && ergebnis.fortsetzung
      ? 'fortsetzungLeer'
      : ergebnis.buchungen.length === 0 && buchungenFilterAktiv(ergebnis.filter)
        ? 'keine'
        : ergebnis.buchungen.length === 0
          ? 'leer'
          : 'liste'
  const zurueck =
    buchungenFilterAktiv(filter) || fortsetzung || (!ergebnis.ok && ergebnis.grund === 'cursor')
  return {
    titel: filter.titel ?? '',
    art: filter.art ?? '',
    archiv: filter.archiv,
    zurueckHref: zurueck ? '/account/bookings' : null,
    ersteSeiteHref: ergebnis.ersteSeite,
    ersteSeiteZeigen: zustand === 'ungueltig' || zustand === 'fortsetzungLeer' || fortsetzung,
    wiederholenHref: ergebnis.wiederholen,
    wiederholenZeigen: !ergebnis.ok,
    zustand,
    fehlerStatus: !ergebnis.ok && ergebnis.grund === 'lesen' ? ergebnis.status : null,
    buchungen: ergebnis.ok ? ergebnis.buchungen : [],
    weiterHref: ergebnis.ok ? ergebnis.weiter : null,
    endeZeigen: ergebnis.ok && ergebnis.buchungen.length > 0 && ergebnis.weiter === null,
  }
}

const LEERER_FILTER: BuchungenFilter = { titel: null, art: null, archiv: 'alle' }

export function buchbareBuchungsarten(): TripItemKind[] {
  return TRIP_ITEM_KINDS.filter((kind) => kannBuchungMarkieren({ kind }))
}

export function aktiveBuchungsStati(): TripStatus[] {
  return TRIP_STATUSES.filter((status) => status !== 'archived')
}

export function buchungenTitelMuster(titel: string): string {
  return `***=${titel}`
}

export function buchungenZeitGueltig(text: string): boolean {
  const treffer = ZEIT.exec(text)
  if (!treffer) return false
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  if (monat < 1 || monat > 12 || tag < 1 || stunde > 23 || minute > 59 || sekunde > 59) return false
  const probe = new Date(Date.UTC(jahr, monat - 1, tag))
  return probe.getUTCFullYear() === jahr && probe.getUTCMonth() === monat - 1 && probe.getUTCDate() === tag
}

function buchungenFilterAktiv(filter: BuchungenFilter): boolean {
  return filter.titel !== null || filter.art !== null || filter.archiv !== 'alle'
}

export function buchungenAdresse(filter: BuchungenFilter, weiter: string | null = null): string {
  const params = new URLSearchParams()
  if (filter.titel) params.set('titel', filter.titel)
  if (filter.art) params.set('art', filter.art)
  if (filter.archiv !== 'alle') params.set('archiv', filter.archiv)
  if (weiter) params.set('weiter', weiter)
  const text = params.toString()
  return text ? `/account/bookings?${text}` : '/account/bookings'
}

function buchungenAdresseAusRoh(roh: BuchungenRohQuery): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(roh)) {
    const wert = roh[key]
    if (wert === undefined) continue
    for (const eintrag of Array.isArray(wert) ? wert : [wert]) params.append(key, eintrag)
  }
  const text = params.toString()
  return text ? `/account/bookings?${text}` : '/account/bookings'
}

function fingerabdruck(filter: BuchungenFilter): string {
  const art = filter.art ?? ''
  const titel = filter.titel ?? ''
  return createHash('sha256')
    .update(`v1\n${art}\n${filter.archiv}\n${String(titel.length)}\n${titel}`, 'utf8')
    .digest('hex')
}

function postgrestZitat(wert: string): string {
  return `"${wert.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

export function buchungenCursorSchreiben(
  filter: BuchungenFilter,
  zeit: string | null,
  id: string,
): string | null {
  if (!istBuchungsUuid(id)) return null
  if (zeit !== null && !buchungenZeitGueltig(zeit)) return null
  return `v1|${fingerabdruck(filter)}|${zeit ?? 'null'}|${id}`
}

export function buchungenCursorLesen(text: string, filter: BuchungenFilter): BuchungenCursor | null {
  if (text.length === 0 || text.length > BUCHUNGEN_CURSOR_MAX) return null
  const teile = text.split('|')
  if (teile.length !== 4) return null
  const [version, hash, zeitTeil, id] = teile
  if (version !== 'v1' || hash !== fingerabdruck(filter) || !istBuchungsUuid(id)) return null
  if (zeitTeil === 'null') return { zeit: null, id }
  if (!zeitTeil || !buchungenZeitGueltig(zeitTeil)) return null
  return { zeit: zeitTeil, id }
}

function rohWert(roh: BuchungenRohQuery, key: string): string | null | 'wiederholt' {
  const wert = roh[key]
  if (wert === undefined) return null
  if (Array.isArray(wert)) return wert.length === 1 ? wert[0] : 'wiederholt'
  return wert
}

function filterAus(roh: BuchungenRohQuery): BuchungenFilter | null {
  const titelRoh = rohWert(roh, 'titel')
  const artRoh = rohWert(roh, 'art')
  const archivRoh = rohWert(roh, 'archiv')
  if (titelRoh === 'wiederholt' || artRoh === 'wiederholt' || archivRoh === 'wiederholt') return null

  let titel: string | null = null
  if (titelRoh !== null) {
    const exakt = titelRoh.trim()
    if (exakt.length > BUCHUNGEN_TITEL_MAX) return null
    titel = exakt.length > 0 ? exakt : null
  }

  let art: TripItemKind | null = null
  if (artRoh !== null && artRoh.trim() !== '') {
    const kandidat = artRoh.trim()
    if (!buchbareBuchungsarten().includes(kandidat as TripItemKind)) return null
    art = kandidat as TripItemKind
  }

  let archiv: BuchungenArchiv = 'alle'
  if (archivRoh !== null && archivRoh.trim() !== '') {
    if (archivRoh !== 'aktiv' && archivRoh !== 'archiviert' && archivRoh !== 'alle') return null
    archiv = archivRoh
  }

  return { titel, art, archiv }
}

export function buchungenAnfrageAus(roh: BuchungenRohQuery): BuchungenAnfrage {
  const wiederholen = buchungenAdresseAusRoh(roh)
  const filter = filterAus(roh)
  if (!filter) {
    return { ok: false, grund: 'parameter', filter: null, ersteSeite: '/account/bookings', wiederholen }
  }
  const ersteSeite = buchungenAdresse(filter)
  const weiterRoh = rohWert(roh, 'weiter')
  if (weiterRoh === 'wiederholt') {
    return { ok: false, grund: 'parameter', filter: null, ersteSeite: '/account/bookings', wiederholen }
  }
  if (weiterRoh === null || weiterRoh === '') {
    return { ok: true, filter, cursor: null, ersteSeite, wiederholen }
  }
  const cursor = buchungenCursorLesen(weiterRoh, filter)
  if (!cursor) return { ok: false, grund: 'cursor', filter, ersteSeite, wiederholen }
  return { ok: true, filter, cursor, ersteSeite, wiederholen }
}

export function buchungenAbfrageBauen(
  filter: BuchungenFilter,
  cursor: BuchungenCursor | null,
): BuchungenAbfrage {
  const arten = buchbareBuchungsarten()
  const kind = filter.art ? { op: 'eq' as const, wert: filter.art } : { op: 'in' as const, werte: arten }
  const archiv =
    filter.archiv === 'aktiv'
      ? { op: 'in' as const, werte: aktiveBuchungsStati() }
      : filter.archiv === 'archiviert'
        ? { op: 'eq' as const, wert: 'archived' as const }
        : null
  let keyset: BuchungenAbfrage['keyset'] = null
  if (cursor?.zeit) {
    const zitiert = postgrestZitat(cursor.zeit)
    keyset = {
      op: 'or',
      ausdruck:
        `booking_confirmed_at.lt.${zitiert},` +
        `and(booking_confirmed_at.eq.${zitiert},id.gt.${cursor.id}),` +
        'booking_confirmed_at.is.null',
    }
  } else if (cursor) {
    keyset = { op: 'null', id: cursor.id }
  }
  return {
    spalten: BUCHUNGEN_SPALTEN,
    kind,
    archiv,
    titelMuster: filter.titel === null ? null : buchungenTitelMuster(filter.titel),
    keyset,
    limit: BUCHUNGEN_LIMIT,
  }
}

function bestaetigungLesen(wert: unknown): string | null | 'ungueltig' {
  if (wert === null) return null
  if (typeof wert !== 'string' || !buchungenZeitGueltig(wert)) return 'ungueltig'
  return wert
}

export function buchungenSeiteAusZeilen(
  zeilen: readonly (RoheBuchungszeile & { booking_confirmed_at?: unknown })[],
  filter: BuchungenFilter,
): BuchungenSeite {
  if (zeilen.length > BUCHUNGEN_LIMIT) return { ok: false, grund: 'unvollstaendig' }
  const buchungen: KontoBuchung[] = []
  const zeiten: (string | null)[] = []
  for (const zeile of zeilen) {
    const gelesen = buchungAusZeile(zeile)
    if (gelesen === 'auslassen' || gelesen === 'unvollstaendig') return { ok: false, grund: 'unvollstaendig' }
    if (!buchungPlanpunktPfad(gelesen.tripId, gelesen.id)) return { ok: false, grund: 'unvollstaendig' }
    const zeit = bestaetigungLesen(zeile.booking_confirmed_at)
    if (zeit === 'ungueltig') return { ok: false, grund: 'unvollstaendig' }
    zeiten.push(zeit)
    if (buchungen.length < BUCHUNGEN_SEITE) buchungen.push(gelesen)
  }
  if (zeilen.length <= BUCHUNGEN_SEITE) return { ok: true, buchungen, weiter: null }
  const letzteZeit = zeiten[BUCHUNGEN_SEITE - 1]
  const letzteId = buchungen[BUCHUNGEN_SEITE - 1]?.id
  if (letzteZeit === undefined || !letzteId) return { ok: false, grund: 'unvollstaendig' }
  const weiter = buchungenCursorSchreiben(filter, letzteZeit, letzteId)
  if (!weiter) return { ok: false, grund: 'unvollstaendig' }
  return { ok: true, buchungen, weiter }
}

function liegtNach(zeile: BuchungenSchnittSchluessel, cursor: BuchungenCursor): boolean {
  return buchungenSchnittVergleich(zeile, { id: cursor.id, bookingConfirmedAt: cursor.zeit }) > 0
}

export function buchungenSeitenLauf(
  zeilen: readonly BuchungenSchnittSchluessel[],
  filter: BuchungenFilter = LEERER_FILTER,
): { ids: string[]; seiten: string[][]; cursor: string[] } {
  const sortiert = [...zeilen].sort(buchungenSchnittVergleich)
  const seiten: string[][] = []
  const cursor: string[] = []
  const ids: string[] = []
  let stand: BuchungenCursor | null = null
  for (let schritt = 0; schritt <= sortiert.length; schritt += 1) {
    const fenster = (stand ? sortiert.filter((zeile) => liegtNach(zeile, stand as BuchungenCursor)) : sortiert).slice(
      0,
      BUCHUNGEN_LIMIT,
    )
    const sichtbar = fenster.slice(0, BUCHUNGEN_SEITE)
    seiten.push(sichtbar.map((zeile) => zeile.id))
    ids.push(...sichtbar.map((zeile) => zeile.id))
    if (fenster.length <= BUCHUNGEN_SEITE) break
    const letzte = sichtbar[BUCHUNGEN_SEITE - 1]
    if (!letzte) break
    const token = buchungenCursorSchreiben(filter, letzte.bookingConfirmedAt, letzte.id)
    if (!token) break
    const weiter = buchungenCursorLesen(token, filter)
    if (!weiter) break
    cursor.push(token)
    stand = weiter
  }
  return { ids, seiten, cursor }
}
