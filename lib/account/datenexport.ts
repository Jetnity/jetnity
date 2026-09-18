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
  switch (tabelle) {
    case 'profiles':
      return supabase.from('profiles').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'account_travellers':
      return supabase.from('account_travellers').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'account_traveller_citizenships':
      return supabase
        .from('account_traveller_citizenships')
        .select('*')
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'account_traveller_documents':
      return supabase
        .from('account_traveller_documents')
        .select('*')
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'account_visits':
      return supabase.from('account_visits').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trips':
      return supabase.from('trips').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_stages':
      return supabase.from('trip_stages').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_days':
      return supabase.from('trip_days').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_items':
      return supabase.from('trip_items').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_travellers':
      return supabase.from('trip_travellers').select('*').eq('user_id', sitzungUserId).range(von, bis)
    case 'trip_traveller_citizenships':
      return supabase
        .from('trip_traveller_citizenships')
        .select('*')
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'trip_traveller_documents':
      return supabase
        .from('trip_traveller_documents')
        .select('*')
        .eq('user_id', sitzungUserId)
        .range(von, bis)
    case 'trip_readiness_items':
      return supabase
        .from('trip_readiness_items')
        .select('*')
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
