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
      return supabase.from('profiles').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'account_travellers':
      return supabase.from('account_travellers').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'account_traveller_citizenships':
      return supabase
        .from('account_traveller_citizenships')
        .select(spalten)
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'account_traveller_documents':
      return supabase
        .from('account_traveller_documents')
        .select(spalten)
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'account_visits':
      return supabase.from('account_visits').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trips':
      return supabase.from('trips').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_stages':
      return supabase.from('trip_stages').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_days':
      return supabase.from('trip_days').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_items':
      return supabase.from('trip_items').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_travellers':
      return supabase.from('trip_travellers').select(spalten).eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_traveller_citizenships':
      return supabase
        .from('trip_traveller_citizenships')
        .select(spalten)
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'trip_traveller_documents':
      return supabase
        .from('trip_traveller_documents')
        .select(spalten)
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'trip_readiness_items':
      return supabase
        .from('trip_readiness_items')
        .select(spalten)
        .eq('user_id', sitzungUserId)
        .range(von, bis)
  }
}

async function tabelleLesen(
  supabase: SupabaseClient<Database>,
  tabelle: KontoDatenexportTabelle,
  sitzungUserId: string,
): Promise<Lesung<unknown>> {
  const gesammelt: unknown[] = []

  for (let von = 0; ; von += KONTO_DATENEXPORT_SEITE) {
    const bis = von + KONTO_DATENEXPORT_SEITE - 1
    const lesung = await lese<unknown>(() =>
      alsAntwort<unknown>(tabelleSeite(supabase, tabelle, sitzungUserId, von, bis)),
    )
    if (lesung.problem) return lesung

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
