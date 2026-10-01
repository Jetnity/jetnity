// lib/readiness/official-truth-source-catalog-server.ts
//
// Ruhendes, serverseitiges Gateway für den privaten Quellenkatalog.
// lib/readiness/source-registry.ts bleibt die kanonische Vertrauensregel.
// Diese Datei baut jede Registry mit quellenRegistryErstellen und speichert
// nur eine Quelle, die dadurch gültig ist. Kein zweites Modell, kein echter
// Katalog, kein Provider und kein Netz ausser dem einen Supabase-RPC,
// und der nur beim ausdrücklichen Aufruf.

import 'server-only'

import { createClient } from '@supabase/supabase-js'

import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'

/**
 * Derselbe Name wie das String-Literal im rpc()-Aufruf. Der Aufruf selbst bleibt
 * literal, damit check:schema-bezug ihn sieht. Die Konstante ist kein zweiter Weg.
 */
export const OFFICIAL_TRUTH_SOURCE_CATALOG_V1 = 'official_truth_source_catalog_v1'

const DIENST_URL = 'NEXT_PUBLIC_SUPABASE_URL'
const DIENST_GEHEIM = 'SUPABASE_SERVICE_ROLE_KEY'

export type OfficialTruthSourceCatalogTransport = {
  aufrufen(payload: Readonly<Record<string, unknown>>): Promise<
    { ok: true; antwort: unknown } | { ok: false }
  >
}

export type OfficialTruthSourceCatalogAbhaengigkeiten = {
  transport?: OfficialTruthSourceCatalogTransport
  env?: Record<string, string | undefined>
}

export type QuellenKatalogErgebnis =
  | { ok: true; registry: QuellenRegistry }
  | { ok: false; reason: string }

export type QuelleRegistrierenErgebnis =
  | { ok: true; outcome: 'inserted' | 'idempotent'; sourceId: string }
  | { ok: false; reason: string }

function dienstTransport(env: Record<string, string | undefined>): OfficialTruthSourceCatalogTransport | null {
  const url = env[DIENST_URL]?.trim()
  const geheim = env[DIENST_GEHEIM]?.trim()
  if (!url || !geheim) return null

  const erzeugt = createClient(url, geheim, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return {
    async aufrufen(payload) {
      const { data, error } = await erzeugt.rpc('official_truth_source_catalog_v1', {
        payload: { ...payload },
      })
      if (error) return { ok: false }
      return { ok: true, antwort: data }
    },
  }
}

function transportAus(
  deps: OfficialTruthSourceCatalogAbhaengigkeiten | undefined,
): OfficialTruthSourceCatalogTransport | null {
  if (deps?.transport) return deps.transport
  return dienstTransport(deps?.env ?? process.env)
}

function eingabeAusQuelle(quelle: RegistrierteQuelle): QuellenEingabe {
  return {
    sourceId: quelle.sourceId,
    sourceClass: quelle.sourceClass,
    publisherName: quelle.publisherName,
    authorityName: quelle.authorityName,
    domains: quelle.domains,
  }
}

function quelleGleich(links: RegistrierteQuelle, rechts: RegistrierteQuelle): boolean {
  if (links.sourceId !== rechts.sourceId) return false
  if (links.sourceClass !== rechts.sourceClass) return false
  if (links.publisherName !== rechts.publisherName) return false
  if (links.authorityName !== rechts.authorityName) return false
  if (links.domains.length !== rechts.domains.length) return false
  return links.domains.every((domain, index) => domain === rechts.domains[index])
}

function textListe(wert: unknown): string[] | null {
  if (!Array.isArray(wert)) return null
  const liste: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string') return null
    liste.push(eintrag)
  }
  return liste
}

function eingabenAusAntwort(antwort: unknown): QuellenEingabe[] | null {
  if (!antwort || typeof antwort !== 'object' || Array.isArray(antwort)) return null
  const satz = antwort as Record<string, unknown>
  if (satz.ok !== true || satz.operation !== 'read_registry' || !Array.isArray(satz.sources)) return null
  const eingaben: QuellenEingabe[] = []
  for (const roh of satz.sources) {
    if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
    const quelle = roh as Record<string, unknown>
    if (typeof quelle.source_id !== 'string') return null
    if (quelle.source_class !== 'official_authority' && quelle.source_class !== 'licensed_evidence_provider') {
      return null
    }
    if (typeof quelle.publisher_name !== 'string') return null
    if (quelle.authority_name != null && typeof quelle.authority_name !== 'string') return null
    const domains = textListe(quelle.domains)
    if (!domains) return null
    eingaben.push({
      sourceId: quelle.source_id,
      sourceClass: quelle.source_class,
      publisherName: quelle.publisher_name,
      authorityName: quelle.authority_name ?? null,
      domains,
    })
  }
  return eingaben
}

function registrierAntwort(antwort: unknown, sourceId: string): QuelleRegistrierenErgebnis {
  if (!antwort || typeof antwort !== 'object' || Array.isArray(antwort)) {
    return { ok: false, reason: 'catalog_failed' }
  }
  const satz = antwort as Record<string, unknown>
  if (satz.ok !== true || satz.operation !== 'register_source') return { ok: false, reason: 'catalog_failed' }
  if (satz.outcome !== 'inserted' && satz.outcome !== 'idempotent') return { ok: false, reason: 'catalog_failed' }
  if (satz.source_id !== sourceId) return { ok: false, reason: 'catalog_failed' }
  return { ok: true, outcome: satz.outcome, sourceId }
}

async function katalogAufrufen(
  transport: OfficialTruthSourceCatalogTransport,
  payload: Readonly<Record<string, unknown>>,
): Promise<{ ok: true; antwort: unknown } | { ok: false; reason: 'catalog_failed' }> {
  try {
    const antwort = await transport.aufrufen(payload)
    if (!antwort.ok) return { ok: false, reason: 'catalog_failed' }
    return antwort
  } catch {
    return { ok: false, reason: 'catalog_failed' }
  }
}

/**
 * Liest den gespeicherten Katalog und baut ihn ausschließlich über
 * quellenRegistryErstellen. Eine ungültige gespeicherte Kombination
 * wird nicht repariert.
 */
export async function quellenKatalogLesen(
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<QuellenKatalogErgebnis> {
  const transport = transportAus(abhaengigkeiten)
  if (!transport) return { ok: false, reason: 'catalog_not_configured' }
  const antwort = await katalogAufrufen(transport, { operation: 'read_registry' })
  if (!antwort.ok) return antwort
  const eingaben = eingabenAusAntwort(antwort.antwort)
  if (!eingaben) return { ok: false, reason: 'catalog_failed' }
  const erzeugt = quellenRegistryErstellen(eingaben)
  if (!erzeugt.ok) return { ok: false, reason: 'catalog_failed' }
  return { ok: true, registry: erzeugt.registry }
}

/**
 * Registriert genau eine QuellenEingabe.
 * Ungültige Eingaben und Überlappungen mit dem gelesenen Katalog erreichen
 * das Schreib-RPC nicht. Ein exaktes Duplikat bleibt dem Gateway überlassen
 * und schreibt nichts neu. Ein abweichendes Duplikat scheitert geschlossen.
 */
export async function quelleRegistrieren(
  eingabe: QuellenEingabe,
  abhaengigkeiten?: OfficialTruthSourceCatalogAbhaengigkeiten,
): Promise<QuelleRegistrierenErgebnis> {
  const allein = quellenRegistryErstellen([eingabe])
  if (!allein.ok) return { ok: false, reason: allein.reason }
  const vorgeschlagen = allein.registry.sources[0]
  if (!vorgeschlagen) return { ok: false, reason: 'catalog_failed' }

  const transport = transportAus(abhaengigkeiten)
  if (!transport) return { ok: false, reason: 'catalog_not_configured' }

  const gelesen = await quellenKatalogLesen({ transport })
  if (!gelesen.ok) return gelesen

  const vorhanden = gelesen.registry.sources.find((quelle) => quelle.sourceId === vorgeschlagen.sourceId)
  if (vorhanden) {
    if (!quelleGleich(vorhanden, vorgeschlagen)) return { ok: false, reason: 'conflicting_duplicate' }
  } else {
    const kombiniert = quellenRegistryErstellen([
      ...gelesen.registry.sources.map(eingabeAusQuelle),
      eingabeAusQuelle(vorgeschlagen),
    ])
    if (!kombiniert.ok) return { ok: false, reason: kombiniert.reason }
  }

  const antwort = await katalogAufrufen(transport, {
    operation: 'register_source',
    source: {
      source_id: vorgeschlagen.sourceId,
      source_class: vorgeschlagen.sourceClass,
      publisher_name: vorgeschlagen.publisherName,
      authority_name: vorgeschlagen.authorityName,
      domains: [...vorgeschlagen.domains],
    },
  })
  if (!antwort.ok) return antwort
  return registrierAntwort(antwort.antwort, vorgeschlagen.sourceId)
}
