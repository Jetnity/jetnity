// lib/traveller/account-registry-daten.ts
//
// Lesender Zugriff auf die Account-Registry des angemeldeten Owners.
// Authenticated + bestehende S2-RLS. Kein Service-Role. Empty ≠ Error.

import 'server-only'

import { lese, type Leseantwort, type Lesung, type Problem } from '@/lib/api/datenbank-lesen'
import { registryTravellersAusZeilen } from '@/lib/traveller/account-registry-abbildung'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { createServerComponentClient } from '@/lib/supabase/server'

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

export async function registryLaden(): Promise<RegistryLesung> {
  const supabase = await createServerComponentClient()
  const ergebnis = await lese<Record<string, unknown>>(() =>
    alsAntwort<Record<string, unknown>>(
      supabase
        .from('account_travellers')
        .select(REGISTRY_SPALTEN)
        .order('created_at', { ascending: true }),
    ),
  )

  if (ergebnis.problem) return ergebnis

  const travellers = registryTravellersAusZeilen(ergebnis.zeilen)
  if (!travellers) return { zeilen: null, problem: ABBILDUNGSFEHLER }
  return { zeilen: travellers, problem: null }
}
