// lib/trips/reisen-sammlung-abfrage.ts
//
// Adresse, Cursor und literale Titel-/Herkunftssuche für /reisen.
// Kein Supabase-Client und kein regulärer Ausdruck aus der Nutzereingabe.

import type { Problem } from '@/lib/api/datenbank-lesen'
import type { TripSummary } from '@/types/trips'

export const REISEN_SAMMLUNG_SEITENGROESSE = 48
export const REISEN_SAMMLUNG_ABRUF = REISEN_SAMMLUNG_SEITENGROESSE + 1
export const REISEN_SAMMLUNG_CURSOR_MAX = 626
export const REISEN_SAMMLUNG_NAV_LEASE_MS = 8000

const SUCHE_MAX = 120
const ARCHIV_MAX = 16
const ARCHIV = ['alle', 'offen', 'archiv'] as const

export type ArchivAuswahl = (typeof ARCHIV)[number]

export type SammlungSuchparameter = Record<string, string | string[] | undefined>

export type GueltigeSammlung = {
  ok: true
  q: string
  archiv: ArchivAuswahl
  cursor: string | null
  suchOder: string | null
  keysetOder: string | null
}

export type SammlungAnfrage = GueltigeSammlung | { ok: false }

const META = new Set(['\\', '.', '+', '*', '?', '^', '$', '(', ')', '[', ']', '{', '}', '|'])

const ZEIT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-](\d{2}):(\d{2}))$/

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function hatC0(wert: string): boolean {
  for (let i = 0; i < wert.length; i += 1) {
    if (wert.charCodeAt(i) <= 0x1f) return true
  }
  return false
}

function hatUnpaarigenSurrogat(wert: string): boolean {
  for (let i = 0; i < wert.length; i += 1) {
    const code = wert.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = wert.charCodeAt(i + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true
      i += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true
    }
  }
  return false
}

function schaltjahr(jahr: number): boolean {
  if (jahr % 400 === 0) return true
  if (jahr % 100 === 0) return false
  return jahr % 4 === 0
}

function tageImMonat(jahr: number, monat: number): number {
  if (monat === 2) return schaltjahr(jahr) ? 29 : 28
  if (monat === 4 || monat === 6 || monat === 9 || monat === 11) return 30
  return 31
}

export function zeitstempelGueltig(wert: string): boolean {
  const treffer = ZEIT.exec(wert)
  if (!treffer) return false
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  if (jahr < 1 || jahr > 9999) return false
  if (monat < 1 || monat > 12) return false
  if (tag < 1 || tag > tageImMonat(jahr, monat)) return false
  if (stunde > 23 || minute > 59 || sekunde > 59) return false
  if (treffer[8] === 'Z') return true
  const offsetStunde = Number(treffer[9])
  const offsetMinute = Number(treffer[10])
  return offsetStunde <= 15 && offsetMinute <= 59
}

function zitiere(wert: string): string {
  return `"${wert.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function muster(nadel: string): string {
  let ausgabe = ''
  for (const zeichen of nadel) {
    ausgabe += META.has(zeichen) ? `\\${zeichen}` : zeichen
  }
  return ausgabe
}

export function suchOder(nadel: string): string | null {
  if (nadel.length === 0) return null
  const zitiert = zitiere(muster(nadel))
  return `title.imatch.${zitiert},origin.imatch.${zitiert}`
}

export function keysetOder(zeit: string, id: string): string {
  const zeitZitat = zitiere(zeit)
  const idZitat = zitiere(id)
  return `updated_at.lt.${zeitZitat},and(updated_at.eq.${zeitZitat},id.lt.${idZitat})`
}

function base64url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binaer = ''
  for (const byte of bytes) binaer += String.fromCharCode(byte)
  return btoa(binaer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '')
}

function textAusBase64Url(token: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(token)) return null
  const aufgefuellt = token + '='.repeat((4 - (token.length % 4)) % 4)
  try {
    const binaer = atob(aufgefuellt.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binaer, (zeichen) => zeichen.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

export function cursorCodieren(eingabe: {
  q: string
  archiv: ArchivAuswahl
  zeit: string
  id: string
}): string | null {
  if (!zeitstempelGueltig(eingabe.zeit) || !UUID.test(eingabe.id)) return null
  const json = JSON.stringify({
    v: 1,
    q: eingabe.q,
    a: eingabe.archiv,
    t: eingabe.zeit,
    i: eingabe.id,
  })
  const token = base64url(json)
  return token.length <= REISEN_SAMMLUNG_CURSOR_MAX ? token : null
}

function cursorLesen(
  token: string,
  q: string,
  archiv: ArchivAuswahl,
): { zeit: string; id: string } | null {
  if (token.length > REISEN_SAMMLUNG_CURSOR_MAX) return null
  const json = textAusBase64Url(token)
  if (json === null) return null
  let wert: unknown
  try {
    wert = JSON.parse(json)
  } catch {
    return null
  }
  if (wert === null || typeof wert !== 'object' || Array.isArray(wert)) return null
  const schluessel = Object.keys(wert)
  if (schluessel.join(',') !== 'v,q,a,t,i') return null
  const eintrag = wert as { v: unknown; q: unknown; a: unknown; t: unknown; i: unknown }
  if (eintrag.v !== 1 || typeof eintrag.q !== 'string' || typeof eintrag.a !== 'string') return null
  if (typeof eintrag.t !== 'string' || typeof eintrag.i !== 'string') return null
  if (eintrag.q !== q || eintrag.a !== archiv) return null
  if (hatC0(eintrag.q) || hatUnpaarigenSurrogat(eintrag.q)) return null
  if (!zeitstempelGueltig(eintrag.t) || !UUID.test(eintrag.i)) return null
  return { zeit: eintrag.t, id: eintrag.i }
}

function einzelnerText(wert: string | string[] | undefined): string | undefined | null {
  if (wert === undefined) return undefined
  if (typeof wert !== 'string') return null
  return wert
}

export function sammlungAnfrageAus(parameter: SammlungSuchparameter): SammlungAnfrage {
  const rohSuche = einzelnerText(parameter.q)
  const rohArchiv = einzelnerText(parameter.archiv)
  const rohCursor = einzelnerText(parameter.cursor)
  if (rohSuche === null || rohArchiv === null || rohCursor === null) return { ok: false }
  if (rohSuche !== undefined) {
    if (rohSuche.length > SUCHE_MAX || hatC0(rohSuche) || hatUnpaarigenSurrogat(rohSuche)) return { ok: false }
  }
  const q = (rohSuche ?? '').trim()
  let archiv: ArchivAuswahl = 'alle'
  if (rohArchiv !== undefined) {
    if (rohArchiv.length > ARCHIV_MAX || !(ARCHIV as readonly string[]).includes(rohArchiv)) return { ok: false }
    archiv = rohArchiv as ArchivAuswahl
  }
  let keysetOderText: string | null = null
  let cursor: string | null = null
  if (rohCursor !== undefined) {
    const gelesen = cursorLesen(rohCursor, q, archiv)
    if (!gelesen) return { ok: false }
    keysetOderText = keysetOder(gelesen.zeit, gelesen.id)
    cursor = rohCursor
  }
  return {
    ok: true,
    q,
    archiv,
    cursor,
    suchOder: suchOder(q),
    keysetOder: keysetOderText,
  }
}

export function sammlungHref(teile: {
  q?: string
  archiv?: ArchivAuswahl
  cursor?: string | null
}): string {
  const suche = new URLSearchParams()
  if (teile.q) suche.set('q', teile.q)
  if (teile.archiv && teile.archiv !== 'alle') suche.set('archiv', teile.archiv)
  if (teile.cursor) suche.set('cursor', teile.cursor)
  const text = suche.toString()
  return text ? `/reisen?${text}` : '/reisen'
}

export type SammlungErgebnis = {
  ungueltig: boolean
  zeilen: TripSummary[]
  problem: Problem | null
  hatWeiter: boolean
  naechsterCursor: string | null
  q: string
  archiv: ArchivAuswahl
  cursor: string | null
  adresse: string
}

const ADRESS_NAMEN = ['q', 'archiv', 'cursor'] as const

export function parameterAusSuche(suche: { getAll(name: string): string[] }): SammlungSuchparameter {
  const parameter: SammlungSuchparameter = {}
  for (const name of ADRESS_NAMEN) {
    const werte = suche.getAll(name)
    if (werte.length === 0) continue
    parameter[name] = werte.length === 1 ? werte[0] : werte
  }
  return parameter
}

export function ungueltigeAdresse(parameter: SammlungSuchparameter): string {
  const suche = new URLSearchParams()
  for (const name of ADRESS_NAMEN) {
    const wert = parameter[name]
    if (typeof wert === 'string' && wert.length > 0) suche.set(name, wert)
    if (Array.isArray(wert)) {
      for (const eintrag of wert) suche.append(name, eintrag)
    }
  }
  const text = suche.toString()
  return text ? `/reisen?${text}` : '/reisen'
}

export function kanonischeAdresse(suche: { getAll(name: string): string[] }): string {
  const parameter = parameterAusSuche(suche)
  const anfrage = sammlungAnfrageAus(parameter)
  if (!anfrage.ok) return ungueltigeAdresse(parameter)
  return sammlungHref(anfrage)
}

const AUSWAHL_NAME: Record<ArchivAuswahl, string> = {
  alle: 'Alle',
  offen: 'Offen',
  archiv: 'Archiv',
}

export function ansichtPhrase(teile: { q: string; archiv: ArchivAuswahl; fortsetzung: boolean }): string {
  const wahl = AUSWAHL_NAME[teile.archiv]
  const kern = teile.q ? `die Suche „${teile.q}“ in ${wahl}` : `ohne Suche in ${wahl}`
  return teile.fortsetzung ? `${kern}, weitere Seite` : kern
}

export function ansichtAusAdresse(adresse: string): { q: string; archiv: ArchivAuswahl; fortsetzung: boolean } | null {
  let suche: URLSearchParams
  try {
    suche = new URL(adresse, 'http://reise.local').searchParams
  } catch {
    return null
  }
  const anfrage = sammlungAnfrageAus(parameterAusSuche(suche))
  if (!anfrage.ok) return null
  return { q: anfrage.q, archiv: anfrage.archiv, fortsetzung: anfrage.cursor !== null }
}
