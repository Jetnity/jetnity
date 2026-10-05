// lib/traveller/account-registry-daten.ts
//
// Lesender Zugriff auf die Account-Registry des angemeldeten Owners.
// Authenticated + bestehende S2-RLS. Kein Service-Role. Empty ≠ Error.
// Dieselbe Abfrage trägt die Account-Liste und die S4-Einzelübernahme.

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { lese, type Leseantwort, type Lesung, type Problem } from '@/lib/api/datenbank-lesen'
import { registryTravellersAusZeilen } from '@/lib/traveller/account-registry-abbildung'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const REGISTRY_SPALTEN =
  'id, client_ref, label, residence_country_code, created_at, updated_at, ' +
  'account_traveller_citizenships(id, client_ref, country_code, created_at, updated_at), ' +
  'account_traveller_documents(id, client_ref, document_type, issuing_country_code, citizenship_id, expires_on, created_at, updated_at)'

function alsAntwort<Zeile>(abfrage: PromiseLike<unknown>): PromiseLike<Leseantwort<Zeile>> {
  return abfrage as PromiseLike<Leseantwort<Zeile>>
}

export type RegistryLesung = Lesung<AccountRegistryTraveller>

const ABBILDUNGSFEHLER: Problem = {
  status: 500,
  message: 'Mindestens ein Registry-Eintrag konnte nicht sicher gelesen werden.',
}

export async function registryMitClientLaden(
  supabase: SupabaseClient<Database>,
  filter?: { readonly id: string },
): Promise<RegistryLesung> {
  const ergebnis = await lese<Record<string, unknown>>(() => {
    const abfrage = supabase.from('account_travellers').select(REGISTRY_SPALTEN)
    const gefiltert = filter ? abfrage.eq('id', filter.id) : abfrage
    return alsAntwort<Record<string, unknown>>(gefiltert.order('created_at', { ascending: true }))
  })

  if (ergebnis.problem) return ergebnis

  const travellers = registryTravellersAusZeilen(ergebnis.zeilen)
  if (!travellers) return { zeilen: null, problem: ABBILDUNGSFEHLER }
  return { zeilen: travellers, problem: null }
}

export async function registryLaden(): Promise<RegistryLesung> {
  const supabase = await createServerComponentClient()
  return registryMitClientLaden(supabase)
}
