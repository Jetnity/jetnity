// lib/traveller/account-registry-aktionen.ts
//
// Owner-CRUD der Account-Registry über authenticated Session + S2-RLS.
// Kein Service-Role. Kein Registry→Trip. Kein Guest-Import.

'use server'

import { revalidatePath } from 'next/cache'

import {
  registryCitizenshipAnlageLesen,
  registryCitizenshipGegenBestandPruefen,
  registryCitizenshipLoeschungLesen,
  registryDocumentAenderungLesen,
  registryDocumentAnlageLesen,
  registryDocumentGegenBestandPruefen,
  registryDocumentLoeschungLesen,
  registryTravellerAenderungLesen,
  registryTravellerAnlageLesen,
  registryTravellerLoeschungLesen,
} from '@/lib/traveller/account-registry-eingabe'
import {
  REGISTRY_NICHT_ANGEMELDET,
  REGISTRY_NICHT_GEFUNDEN,
  registrySchreibmeldung,
} from '@/lib/traveller/account-registry-meldung'
import { createServerActionClient } from '@/lib/supabase/server'

type Aktionsergebnis<Wert> = { ok: true; wert: Wert } | { ok: false; meldung: string }

async function registryKonto() {
  const supabase = await createServerActionClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { supabase, benutzerId: null as string | null }
  return { supabase, benutzerId: data.user.id }
}

function pfadErneuern() {
  revalidatePath('/account/travellers')
}

function schreibfehler(
  fehler: { message: string; code?: string | null },
  status?: number,
): { ok: false; meldung: string } {
  return { ok: false, meldung: registrySchreibmeldung(fehler, status) }
}

async function travellerDesOwners(
  supabase: Awaited<ReturnType<typeof registryKonto>>['supabase'],
  travellerId: string,
): Promise<Aktionsergebnis<null>> {
  const { data, error, status } = await supabase
    .from('account_travellers')
    .select('id')
    .eq('id', travellerId)

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  return { ok: true, wert: null }
}

async function citizenshipsDesTravellers(
  supabase: Awaited<ReturnType<typeof registryKonto>>['supabase'],
  travellerId: string,
): Promise<Aktionsergebnis<{ id: string; country_code: string }[]>> {
  const { data, error, status } = await supabase
    .from('account_traveller_citizenships')
    .select('id, country_code')
    .eq('traveller_id', travellerId)

  if (error) return schreibfehler(error, status)
  return { ok: true, wert: data ?? [] }
}

async function documentsAnzahl(
  supabase: Awaited<ReturnType<typeof registryKonto>>['supabase'],
  travellerId: string,
): Promise<Aktionsergebnis<number>> {
  const { data, error, status } = await supabase
    .from('account_traveller_documents')
    .select('id')
    .eq('traveller_id', travellerId)

  if (error) return schreibfehler(error, status)
  return { ok: true, wert: data?.length ?? 0 }
}

export async function registryTravellerAnlegen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryTravellerAnlageLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const { error, status } = await supabase.from('account_travellers').insert({
    user_id: benutzerId,
    client_ref: crypto.randomUUID(),
    label: geprueft.wert.label,
    residence_country_code: geprueft.wert.residenceCountryCode,
  })

  if (error) return schreibfehler(error, status)
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryTravellerAendern(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryTravellerAenderungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const { data, error, status } = await supabase
    .from('account_travellers')
    .update({
      label: geprueft.wert.label,
      residence_country_code: geprueft.wert.residenceCountryCode,
    })
    .eq('id', geprueft.wert.id)
    .select('id')

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryTravellerLoeschen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryTravellerLoeschungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const { data, error, status } = await supabase
    .from('account_travellers')
    .delete()
    .eq('id', geprueft.wert.id)
    .select('id')

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryCitizenshipAnlegen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryCitizenshipAnlageLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const parent = await travellerDesOwners(supabase, geprueft.wert.travellerId)
  if (!parent.ok) return parent

  const bestand = await citizenshipsDesTravellers(supabase, geprueft.wert.travellerId)
  if (!bestand.ok) return bestand
  const gegenBestand = registryCitizenshipGegenBestandPruefen(
    geprueft.wert.countryCode,
    bestand.wert.map((zeile) => zeile.country_code),
  )
  if (!gegenBestand.ok) return gegenBestand

  const { error, status } = await supabase.from('account_traveller_citizenships').insert({
    user_id: benutzerId,
    traveller_id: geprueft.wert.travellerId,
    client_ref: crypto.randomUUID(),
    country_code: geprueft.wert.countryCode,
  })

  if (error) return schreibfehler(error, status)
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryCitizenshipLoeschen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryCitizenshipLoeschungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const { data, error, status } = await supabase
    .from('account_traveller_citizenships')
    .delete()
    .eq('id', geprueft.wert.citizenshipId)
    .eq('traveller_id', geprueft.wert.travellerId)
    .select('id')

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryDocumentAnlegen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryDocumentAnlageLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const parent = await travellerDesOwners(supabase, geprueft.wert.travellerId)
  if (!parent.ok) return parent

  const [bestand, anzahl] = await Promise.all([
    citizenshipsDesTravellers(supabase, geprueft.wert.travellerId),
    documentsAnzahl(supabase, geprueft.wert.travellerId),
  ])
  if (!bestand.ok) return bestand
  if (!anzahl.ok) return anzahl

  const gegenBestand = registryDocumentGegenBestandPruefen(
    geprueft.wert.citizenshipId,
    bestand.wert.map((zeile) => zeile.id),
    anzahl.wert,
    'anlegen',
  )
  if (!gegenBestand.ok) return gegenBestand

  const { error, status } = await supabase.from('account_traveller_documents').insert({
    user_id: benutzerId,
    traveller_id: geprueft.wert.travellerId,
    client_ref: crypto.randomUUID(),
    document_type: geprueft.wert.documentType,
    issuing_country_code: geprueft.wert.issuingCountryCode,
    citizenship_id: geprueft.wert.citizenshipId,
    expires_on: geprueft.wert.expiresOn,
  })

  if (error) return schreibfehler(error, status)
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryDocumentAendern(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryDocumentAenderungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const bestand = await citizenshipsDesTravellers(supabase, geprueft.wert.travellerId)
  if (!bestand.ok) return bestand
  const gegenBestand = registryDocumentGegenBestandPruefen(
    geprueft.wert.citizenshipId,
    bestand.wert.map((zeile) => zeile.id),
    bestand.wert.length,
    'aendern',
  )
  if (!gegenBestand.ok) return gegenBestand

  const { data, error, status } = await supabase
    .from('account_traveller_documents')
    .update({
      document_type: geprueft.wert.documentType,
      issuing_country_code: geprueft.wert.issuingCountryCode,
      citizenship_id: geprueft.wert.citizenshipId,
      expires_on: geprueft.wert.expiresOn,
    })
    .eq('id', geprueft.wert.documentId)
    .eq('traveller_id', geprueft.wert.travellerId)
    .select('id')

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  pfadErneuern()
  return { ok: true, wert: null }
}

export async function registryDocumentLoeschen(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = registryDocumentLoeschungLesen(eingabe)
  if (!geprueft.ok) return geprueft

  const { supabase, benutzerId } = await registryKonto()
  if (!benutzerId) return { ok: false, meldung: REGISTRY_NICHT_ANGEMELDET }

  const { data, error, status } = await supabase
    .from('account_traveller_documents')
    .delete()
    .eq('id', geprueft.wert.documentId)
    .eq('traveller_id', geprueft.wert.travellerId)
    .select('id')

  if (error) return schreibfehler(error, status)
  if (!data || data.length === 0) return { ok: false, meldung: REGISTRY_NICHT_GEFUNDEN }
  pfadErneuern()
  return { ok: true, wert: null }
}
