// lib/account/datenexport.ts
//
// V1-Kontoexport: eine JSON-Datei mit den Konto- und Reisezeilen, die die
// angemeldete Sitzung unter bestehendem RLS lesen darf.
//
// Kein Service-Role, kein persistenter Archiveimer, kein Rate-Limit, das über
// Serverless-Instanzen hinweg so täte, als sei es verbindlich. Authenticated
// plus no-store ist der ehrliche V1-Rahmen.

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { lese, type Leseantwort, type Lesung, type Problem } from '@/lib/api/datenbank-lesen'
import type { Database } from '@/types/supabase'

export const KONTO_DATENEXPORT_SCHEMA_VERSION = 'jetnity.account-export.v1' as const

export const KONTO_DATENEXPORT_TABELLEN = [
  'profiles',
  'account_travellers',
  'account_traveller_citizenships',
  'account_traveller_documents',
  'account_visits',
  'trips',
  'trip_stages',
  'trip_days',
  'trip_items',
  'trip_travellers',
  'trip_traveller_citizenships',
  'trip_traveller_documents',
  'trip_readiness_items',
] as const

export type KontoDatenexportTabelle = (typeof KONTO_DATENEXPORT_TABELLEN)[number]

export const KONTO_DATENEXPORT_SEITE = 1000
export const KONTO_DATENEXPORT_MAX_ZEILEN = 20_000

export const KONTO_DATENEXPORT_VOLLSTAENDIGKEIT =
  'jetnity-owned-account-travel-rows' as const

/**
 * Frozen V1 export columns for the 13 reviewed owner-scoped tables.
 *
 * These are the current Production columns. A later migration must not enter
 * the download automatically. Adding or removing a field needs explicit
 * export-contract review and, where the JSON shape changes, schema-version
 * handling. `schemaVersion` stays `jetnity.account-export.v1` while this
 * semantic field set is unchanged.
 */
export const KONTO_DATENEXPORT_SPALTEN = {
  profiles: [
    'avatar_url',
    'created_at',
    'display_name',
    'email',
    'id',
    'last_seen_at',
    'role',
    'status',
    'user_id',
  ],
  account_travellers: [
    'client_ref',
    'created_at',
    'id',
    'label',
    'residence_country_code',
    'updated_at',
    'user_id',
  ],
  account_traveller_citizenships: [
    'client_ref',
    'country_code',
    'created_at',
    'id',
    'traveller_id',
    'updated_at',
    'user_id',
  ],
  account_traveller_documents: [
    'citizenship_id',
    'client_ref',
    'created_at',
    'document_type',
    'expires_on',
    'id',
    'issuing_country_code',
    'traveller_id',
    'updated_at',
    'user_id',
  ],
  account_visits: [
    'country_code',
    'created_at',
    'id',
    'latitude',
    'longitude',
    'place_id',
    'place_label',
    'updated_at',
    'user_id',
    'visited_day',
    'visited_month',
    'visited_year',
  ],
  trips: [
    'budget_amount',
    'client_ref',
    'created_at',
    'currency',
    'day_stage_assignment_mode',
    'end_date',
    'id',
    'interests',
    'last_mutation_id',
    'metadata',
    'origin',
    'origin_place_id',
    'pace',
    'revision',
    'start_date',
    'status',
    'title',
    'travel_wish',
    'travellers',
    'updated_at',
    'user_id',
  ],
  trip_stages: [
    'arrival_date',
    'country_code',
    'created_at',
    'departure_date',
    'id',
    'latitude',
    'longitude',
    'metadata',
    'name',
    'place_id',
    'position',
    'trip_id',
    'updated_at',
    'user_id',
  ],
  trip_days: [
    'created_at',
    'day_date',
    'day_index',
    'id',
    'metadata',
    'stage_id',
    'title',
    'trip_id',
    'updated_at',
    'user_id',
  ],
  trip_items: [
    'booking_confirmed_at',
    'booking_source',
    'booking_status',
    'booking_url',
    'connection_ref',
    'created_at',
    'day_id',
    'destination_name',
    'destination_place_id',
    'ends_at',
    'ends_on',
    'external_ref',
    'id',
    'kind',
    'metadata',
    'mobility_changes',
    'mobility_evidence',
    'mobility_mode',
    'note',
    'origin_name',
    'origin_place_id',
    'position',
    'price_amount',
    'price_currency',
    'provider',
    'rental_evidence',
    'rental_supplier',
    'stage_id',
    'starts_at',
    'starts_on',
    'time_zone',
    'title',
    'transmission',
    'trip_id',
    'updated_at',
    'user_id',
    'vehicle_class',
  ],
  trip_travellers: [
    'client_ref',
    'created_at',
    'document_expires_on',
    'document_issuing_country_code',
    'document_type',
    'id',
    'label',
    'nationality_country_code',
    'residence_country_code',
    'trip_id',
    'updated_at',
    'user_id',
  ],
  trip_traveller_citizenships: [
    'client_ref',
    'country_code',
    'created_at',
    'id',
    'traveller_id',
    'trip_id',
    'updated_at',
    'user_id',
  ],
  trip_traveller_documents: [
    'citizenship_id',
    'client_ref',
    'created_at',
    'document_type',
    'expires_on',
    'id',
    'issuing_country_code',
    'traveller_id',
    'trip_id',
    'updated_at',
    'user_id',
  ],
  trip_readiness_items: [
    'client_ref',
    'context_fingerprint',
    'country_code',
    'created_at',
    'evidence',
    'id',
    'kind',
    'title',
    'traveller_id',
    'trip_id',
    'trip_item_id',
    'updated_at',
    'user_id',
    'user_status',
  ],
} as const satisfies {
  [K in KontoDatenexportTabelle]: readonly (keyof Database['public']['Tables'][K]['Row'] & string)[]
}

type GleicheMenge<A, B> = [Exclude<A, B>, Exclude<B, A>] extends [never, never] ? true : never

type KontoDatenexportSpaltenSindVollstaendig = {
  [K in KontoDatenexportTabelle]: GleicheMenge<
    (typeof KONTO_DATENEXPORT_SPALTEN)[K][number],
    keyof Database['public']['Tables'][K]['Row']
  >
}

const _spaltenSindVollstaendig: KontoDatenexportSpaltenSindVollstaendig = {
  profiles: true,
  account_travellers: true,
  account_traveller_citizenships: true,
  account_traveller_documents: true,
  account_visits: true,
  trips: true,
  trip_stages: true,
  trip_days: true,
  trip_items: true,
  trip_travellers: true,
  trip_traveller_citizenships: true,
  trip_traveller_documents: true,
  trip_readiness_items: true,
}

void _spaltenSindVollstaendig

export function kontoDatenexportSpaltenliste(tabelle: KontoDatenexportTabelle): string {
  return KONTO_DATENEXPORT_SPALTEN[tabelle].join(',')
}

export type KontoDatenexportDokument = {
  schemaVersion: typeof KONTO_DATENEXPORT_SCHEMA_VERSION
  generatedAt: string
  scope: {
    owner: 'authenticated-session'
    completeness: typeof KONTO_DATENEXPORT_VOLLSTAENDIGKEIT
    tables: typeof KONTO_DATENEXPORT_TABELLEN
  }
  data: Record<KontoDatenexportTabelle, unknown[]>
}

export type KontoDatenexportErgebnis =
  | { ok: true; dokument: KontoDatenexportDokument }
  | { ok: false; problem: Problem }

function alsAntwort<Zeile>(abfrage: PromiseLike<unknown>): PromiseLike<Leseantwort<Zeile>> {
  return abfrage as PromiseLike<Leseantwort<Zeile>>
}

type GeordneteSeite = {
  eq: (
    spalte: 'user_id',
    wert: string,
  ) => {
    order: (
      spalte: 'id',
      optionen: { ascending: true },
    ) => { range: (von: number, bis: number) => PromiseLike<unknown> }
  }
}

/**
 * `id` ist der vorhandene eindeutige Zeilenschlüssel jeder Exporttabelle.
 * `range` ohne `order` kann laut aktuellem Supabase-JS-Vertrag unerwartet
 * blättern. Die Sortierung gilt je Tabelle. Sie ist keine gemeinsame
 * Momentaufnahme über die 13 Tabellen: die Tabellen werden nacheinander
 * gelesen, und Schreibvorgänge dazwischen bleiben sichtbar.
 */
function geordneteSeite(
  abfrage: GeordneteSeite,
  sitzungUserId: string,
  von: number,
  bis: number,
) {
  return abfrage.eq('user_id', sitzungUserId).order('id', { ascending: true }).range(von, bis)
}

function tabelleSeite(
  supabase: SupabaseClient<Database>,
  tabelle: KontoDatenexportTabelle,
  sitzungUserId: string,
  von: number,
  bis: number,
) {
  const spalten = kontoDatenexportSpaltenliste(tabelle)
  switch (tabelle) {
    case 'profiles':
      return geordneteSeite(supabase.from('profiles').select(spalten), sitzungUserId, von, bis)
    case 'account_travellers':
      return geordneteSeite(supabase.from('account_travellers').select(spalten), sitzungUserId, von, bis)
    case 'account_traveller_citizenships':
      return geordneteSeite(
        supabase.from('account_traveller_citizenships').select(spalten),
        sitzungUserId,
        von,
        bis,
      )
    case 'account_traveller_documents':
      return geordneteSeite(
        supabase.from('account_traveller_documents').select(spalten),
        sitzungUserId,
        von,
        bis,
      )
    case 'account_visits':
      return geordneteSeite(supabase.from('account_visits').select(spalten), sitzungUserId, von, bis)
    case 'trips':
      return geordneteSeite(supabase.from('trips').select(spalten), sitzungUserId, von, bis)
    case 'trip_stages':
      return geordneteSeite(supabase.from('trip_stages').select(spalten), sitzungUserId, von, bis)
    case 'trip_days':
      return geordneteSeite(supabase.from('trip_days').select(spalten), sitzungUserId, von, bis)
    case 'trip_items':
      return geordneteSeite(supabase.from('trip_items').select(spalten), sitzungUserId, von, bis)
    case 'trip_travellers':
      return geordneteSeite(supabase.from('trip_travellers').select(spalten), sitzungUserId, von, bis)
    case 'trip_traveller_citizenships':
      return geordneteSeite(
        supabase.from('trip_traveller_citizenships').select(spalten),
        sitzungUserId,
        von,
        bis,
      )
    case 'trip_traveller_documents':
      return geordneteSeite(
        supabase.from('trip_traveller_documents').select(spalten),
        sitzungUserId,
        von,
        bis,
      )
    case 'trip_readiness_items':
      return geordneteSeite(
        supabase.from('trip_readiness_items').select(spalten),
        sitzungUserId,
        von,
        bis,
      )
  }
}

type ExportSeitengrund = 'ungueltige-kennung' | 'doppelt' | 'kein-fortschritt' | 'seite-zu-gross'

function exportSeitenSignatur(kennungen: readonly string[]): string {
  if (kennungen.length === 0) return ''
  return `${kennungen[0]}\n${kennungen[kennungen.length - 1]}\n${kennungen.length}`
}

function exportSeitePruefen(
  bisher: ReadonlySet<string>,
  seite: readonly unknown[],
  vorherSignatur: string | null,
):
  | { ok: true; kennungen: string[]; signatur: string }
  | { ok: false; grund: ExportSeitengrund } {
  if (seite.length > KONTO_DATENEXPORT_SEITE) return { ok: false, grund: 'seite-zu-gross' }
  const kennungen: string[] = []
  const inSeite = new Set<string>()
  for (const zeile of seite) {
    if (!zeile || typeof zeile !== 'object') return { ok: false, grund: 'ungueltige-kennung' }
    const id = (zeile as { id?: unknown }).id
    if (typeof id !== 'string' || id.length === 0 || id !== id.trim()) {
      return { ok: false, grund: 'ungueltige-kennung' }
    }
    if (inSeite.has(id)) return { ok: false, grund: 'doppelt' }
    inSeite.add(id)
    kennungen.push(id)
  }
  const signatur = exportSeitenSignatur(kennungen)
  if (seite.length > 0 && vorherSignatur !== null && signatur === vorherSignatur) {
    return { ok: false, grund: 'kein-fortschritt' }
  }
  for (const id of kennungen) {
    if (bisher.has(id)) return { ok: false, grund: 'doppelt' }
  }
  return { ok: true, kennungen, signatur }
}

function exportSeitenProblem(tabelle: KontoDatenexportTabelle, grund: ExportSeitengrund): Problem {
  const text = {
    'ungueltige-kennung': `Die Tabelle ${tabelle} enthält eine Zeile ohne gültige Kennung.`,
    doppelt: `Die Tabelle ${tabelle} hat eine wiederholte Kennung.`,
    'kein-fortschritt': `Die Tabelle ${tabelle} hat beim Blättern keine neue Seite geliefert.`,
    'seite-zu-gross': `Die Tabelle ${tabelle} hat eine Seite über der erwarteten Grösse geliefert.`,
  }[grund]
  return { status: 500, message: text }
}

async function tabelleLesen(
  supabase: SupabaseClient<Database>,
  tabelle: KontoDatenexportTabelle,
  sitzungUserId: string,
): Promise<Lesung<unknown>> {
  const gesammelt: unknown[] = []
  const gesehen = new Set<string>()
  let vorherSignatur: string | null = null

  for (let von = 0; ; von += KONTO_DATENEXPORT_SEITE) {
    const bis = von + KONTO_DATENEXPORT_SEITE - 1
    const lesung = await lese<unknown>(() =>
      alsAntwort<unknown>(tabelleSeite(supabase, tabelle, sitzungUserId, von, bis)),
    )
    if (lesung.problem) return lesung

    const befund = exportSeitePruefen(gesehen, lesung.zeilen, vorherSignatur)
    if (!befund.ok) {
      return { zeilen: null, problem: exportSeitenProblem(tabelle, befund.grund) }
    }
    for (const id of befund.kennungen) gesehen.add(id)
    vorherSignatur = befund.signatur
    gesammelt.push(...lesung.zeilen)
    if (gesammelt.length > KONTO_DATENEXPORT_MAX_ZEILEN) {
      return {
        zeilen: null,
        problem: {
          status: 500,
          message: `Die Tabelle ${tabelle} überschreitet die Exportgrenze.`,
        },
      }
    }
    if (lesung.zeilen.length < KONTO_DATENEXPORT_SEITE) {
      return { zeilen: gesammelt, problem: null }
    }
  }
}

export function kontoDatenexportDateiname(generatedAt: string): string {
  const tag = generatedAt.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return 'jetnity-account-export.json'
  return `jetnity-account-export-${tag}.json`
}

export function kontoDatenexportDokument(args: {
  generatedAt: string
  data: Record<KontoDatenexportTabelle, unknown[]>
}): KontoDatenexportDokument {
  return {
    schemaVersion: KONTO_DATENEXPORT_SCHEMA_VERSION,
    generatedAt: args.generatedAt,
    scope: {
      owner: 'authenticated-session',
      completeness: KONTO_DATENEXPORT_VOLLSTAENDIGKEIT,
      tables: KONTO_DATENEXPORT_TABELLEN,
    },
    data: args.data,
  }
}

export async function kontoDatenexportErzeugen(
  supabase: SupabaseClient<Database>,
  sitzungUserId: string,
  jetzt: () => Date = () => new Date(),
): Promise<KontoDatenexportErgebnis> {
  const data = {} as Record<KontoDatenexportTabelle, unknown[]>

  for (const tabelle of KONTO_DATENEXPORT_TABELLEN) {
    const lesung = await tabelleLesen(supabase, tabelle, sitzungUserId)
    if (lesung.problem) return { ok: false, problem: lesung.problem }
    data[tabelle] = lesung.zeilen
  }

  return {
    ok: true,
    dokument: kontoDatenexportDokument({
      generatedAt: jetzt().toISOString(),
      data,
    }),
  }
}
