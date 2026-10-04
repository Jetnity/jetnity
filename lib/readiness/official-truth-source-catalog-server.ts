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
import { createContentIdentityGraph, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'

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
export const OFFICIAL_TRUTH_SOURCE_CATALOG_V2 = 'official_truth_source_catalog_v2'

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
  /** Test-only code definitions. Live entry uses the empty production registry. */
  identityProfiles?: readonly ContentIdentityProfileDefinition[]
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
      const { data, error } = await erzeugt.rpc('official_truth_source_catalog_v2', {
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

function row(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return null
  if (Reflect.ownKeys(value).length !== fields.length) return null
  for (const key of fields) {
    const field = Object.getOwnPropertyDescriptor(value, key)
    if (!field || !('value' in field) || !field.enumerable) return null
  }
  return value as Record<string, unknown>
}
function rows(value: unknown, fields: readonly string[], max: number): Record<string, unknown>[] | null {
  if (!Array.isArray(value) || value.length > max || Reflect.ownKeys(value).length !== value.length + 1) return null
  const result: Record<string, unknown>[] = []
  for (let i = 0; i < value.length; i++) {
    const property = Object.getOwnPropertyDescriptor(value, String(i))
    if (!property || !('value' in property)) return null
    const parsed = row(property.value, fields)
    if (!parsed) return null
    result.push(parsed)
  }
  return result
}
const ITEM = ['source_id', 'content_item_id'] as const
const REP = [...ITEM, 'representation_id'] as const
const REP_VERSION = [...REP, 'representation_version'] as const
function key(value: Record<string, unknown>, fields: readonly string[]): string {
  return JSON.stringify(fields.map((field) => value[field]))
}

/** Parse all S1 tables from ONE response. Orphans and silently repaired rows are invalid. */
function registryAusAntwort(antwort: unknown, profiles: readonly ContentIdentityProfileDefinition[] | undefined): QuellenRegistry | null {
  const data = row(antwort, ['ok', 'operation', 'identity_schema', 'sources', 'blocked_domains',
    'content_items', 'item_versions', 'representations', 'representation_urls', 'url_reservations'])
  if (!data || data.ok !== true || data.operation !== 'read_registry' || data.identity_schema !== 2) return null
  const sources = rows(data.sources, ['source_id', 'source_class', 'publisher_name', 'authority_name', 'domains'], 1024)
  const items = rows(data.content_items, [...ITEM, 'external_id_namespace', 'external_content_id'], 1024)
  const versions = rows(data.item_versions, [...ITEM, 'content_item_version', 'current', 'expected_publisher_ids', 'expected_authority_ids'], 1024)
  const reps = rows(data.representations, [...REP_VERSION, 'content_item_version', 'current', 'expected_final_url', 'expected_media_type',
    'identity_profile_id', 'identity_profile_version', 'expected_locale', 'expected_schema'], 4096)
  const urls = rows(data.representation_urls, [...REP_VERSION, 'url', 'request_ordinal', 'is_final'], 69632)
  const reservations = rows(data.url_reservations, ['url', ...REP], 69632)
  const blocked = textListe(data.blocked_domains)
  if (!sources || !items || !versions || !reps || !urls || !reservations || !blocked || new Set(blocked).size !== blocked.length) return null
  const inputs: QuellenEingabe[] = []
  const sourceIds = new Set<string>()
  for (const source of sources) {
    const domains = textListe(source.domains)
    if (!domains || new Set(domains).size !== domains.length || typeof source.source_id !== 'string'
      || typeof source.publisher_name !== 'string' || !(source.authority_name === null || typeof source.authority_name === 'string')
      || !['official_authority', 'licensed_evidence_provider'].includes(source.source_class as string)) return null
    if (sourceIds.has(source.source_id)) return null
    sourceIds.add(source.source_id)
    inputs.push({ sourceId: source.source_id, sourceClass: source.source_class as QuellenEingabe['sourceClass'],
      publisherName: source.publisher_name, authorityName: source.authority_name, domains })
  }
  const authority = quellenRegistryErstellen(inputs, { blockedDomains: blocked })
  if (!authority.ok) return null
  const byItem = new Map<string, Record<string, unknown>>()
  for (const item of items) {
    const id = key(item, ITEM)
    if (byItem.has(id)) return null
    byItem.set(id, item)
  }
  const usedItems = new Set<string>()
  const itemDescriptors = versions.map((version) => {
    const id = key(version, ITEM), item = byItem.get(id)
    if (!item) return null
    usedItems.add(id)
    return { sourceId: version.source_id, contentItemId: version.content_item_id, contentItemVersion: version.content_item_version,
      current: version.current, externalIdNamespace: item.external_id_namespace, externalContentId: item.external_content_id,
      expectedPublisherIds: version.expected_publisher_ids, expectedAuthorityIds: version.expected_authority_ids }
  })
  if (itemDescriptors.some((item) => item === null) || usedItems.size !== byItem.size) return null
  const reserved = new Map<string, string>()
  for (const reservation of reservations) {
    if (typeof reservation.url !== 'string' || reserved.has(reservation.url)) return null
    reserved.set(reservation.url, key(reservation, REP))
  }
  const usedUrls = new Set<Record<string, unknown>>(), usedReservations = new Set<string>()
  const repDescriptors: unknown[] = []
  for (const rep of reps) {
    const bindings = urls.filter((binding) => key(binding, REP_VERSION) === key(rep, REP_VERSION))
    const requestUrls: string[] = [], ordinals = new Set<number>(), boundUrls = new Set<string>()
    let finals = 0
    for (const binding of bindings) {
      if (usedUrls.has(binding) || typeof binding.url !== 'string' || boundUrls.has(binding.url)
        || typeof binding.is_final !== 'boolean' || reserved.get(binding.url) !== key(rep, REP)) return null
      if (binding.is_final) {
        if (binding.url !== rep.expected_final_url) return null
        finals++
      }
      if (binding.request_ordinal !== null) {
        const ordinal = binding.request_ordinal
        if (typeof ordinal !== 'number' || !Number.isInteger(ordinal) || ordinal < 1 || ordinal > 16 || ordinals.has(ordinal)) return null
        ordinals.add(ordinal)
        requestUrls[ordinal - 1] = binding.url
      } else if (!binding.is_final) return null
      boundUrls.add(binding.url); usedUrls.add(binding); usedReservations.add(binding.url)
    }
    if (finals !== 1 || requestUrls.length === 0 || Math.max(...ordinals) !== ordinals.size
      || requestUrls.some((url, index) => index > 0 && requestUrls[index - 1]! >= url)) return null
    repDescriptors.push({ sourceId: rep.source_id, contentItemId: rep.content_item_id, contentItemVersion: rep.content_item_version,
      representationId: rep.representation_id, representationVersion: rep.representation_version, current: rep.current,
      requestUrls, expectedFinalUrl: rep.expected_final_url, expectedMediaType: rep.expected_media_type,
      identityProfileId: rep.identity_profile_id, identityProfileVersion: rep.identity_profile_version,
      expectedLocale: rep.expected_locale, expectedSchema: rep.expected_schema })
  }
  if (usedUrls.size !== urls.length || usedReservations.size !== reservations.length) return null
  const graph = createContentIdentityGraph(authority.registry, itemDescriptors, repDescriptors, profiles)
  if (!graph.ok) return null
  return Object.freeze({ ...graph.value.authorityRegistry, contentIdentity: graph.value })
}

function registrierAntwort(antwort: unknown, sourceId: string): QuelleRegistrierenErgebnis {
  if (!antwort || typeof antwort !== 'object' || Array.isArray(antwort)) {
    return { ok: false, reason: 'catalog_failed' }
  }
  const satz = antwort as Record<string, unknown>
  if (satz.ok !== true || satz.identity_schema !== 2 || satz.operation !== 'register_source') return { ok: false, reason: 'catalog_failed' }
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
  try {
    const registry = registryAusAntwort(antwort.antwort, abhaengigkeiten?.identityProfiles)
    return registry ? { ok: true, registry } : { ok: false, reason: 'catalog_failed' }
  } catch { return { ok: false, reason: 'catalog_failed' } }
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

  const gelesen = await quellenKatalogLesen({ ...abhaengigkeiten, transport })
  if (!gelesen.ok) return gelesen

  const vorhanden = gelesen.registry.sources.find((quelle) => quelle.sourceId === vorgeschlagen.sourceId)
  if (vorhanden) {
    if (!quelleGleich(vorhanden, vorgeschlagen)) return { ok: false, reason: 'conflicting_duplicate' }
  } else {
    const kombiniert = quellenRegistryErstellen([
      ...gelesen.registry.sources.map(eingabeAusQuelle),
      eingabeAusQuelle(vorgeschlagen),
    ], { blockedDomains: gelesen.registry.blockedDomains })
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

/** In-memory replay of the one validated snapshot. No environment, client or second DB read. */
export function quellenKatalogSnapshotAntwort(registry: QuellenRegistry): Readonly<Record<string, unknown>> | null {
  const graph = registry.contentIdentity
  if (!graph || JSON.stringify(graph.authorityRegistry) !== JSON.stringify({ sources: registry.sources, blockedDomains: registry.blockedDomains })) return null
  const itemRows = new Map<string, Record<string, unknown>>()
  const itemVersions = graph.items.map((item) => {
    itemRows.set(JSON.stringify([item.sourceId, item.contentItemId]), { source_id: item.sourceId, content_item_id: item.contentItemId,
      external_id_namespace: item.externalIdNamespace, external_content_id: item.externalContentId })
    return { source_id: item.sourceId, content_item_id: item.contentItemId, content_item_version: item.contentItemVersion,
      current: item.current, expected_publisher_ids: [...item.expectedPublisherIds], expected_authority_ids: [...item.expectedAuthorityIds] }
  })
  const reserved = new Map<string, Record<string, unknown>>()
  const urls: Record<string, unknown>[] = []
  const representations = graph.representations.map((rep) => {
    for (const url of new Set([...rep.requestUrls, rep.expectedFinalUrl])) {
      const ref = { source_id: rep.sourceId, content_item_id: rep.contentItemId, representation_id: rep.representationId }
      reserved.set(url, { url, ...ref })
      const ordinal = rep.requestUrls.indexOf(url)
      urls.push({ ...ref, representation_version: rep.representationVersion, url,
        request_ordinal: ordinal < 0 ? null : ordinal + 1, is_final: url === rep.expectedFinalUrl })
    }
    return { source_id: rep.sourceId, content_item_id: rep.contentItemId, content_item_version: rep.contentItemVersion,
      representation_id: rep.representationId, representation_version: rep.representationVersion, current: rep.current,
      expected_final_url: rep.expectedFinalUrl, expected_media_type: rep.expectedMediaType,
      identity_profile_id: rep.identityProfileId, identity_profile_version: rep.identityProfileVersion,
      expected_locale: rep.expectedLocale, expected_schema: rep.expectedSchema }
  })
  const answer = { ok: true, operation: 'read_registry', identity_schema: 2,
    sources: registry.sources.map((source) => ({ source_id: source.sourceId, source_class: source.sourceClass,
      publisher_name: source.publisherName, authority_name: source.authorityName, domains: [...source.domains] })),
    blocked_domains: [...registry.blockedDomains], content_items: [...itemRows.values()], item_versions: itemVersions,
    representations, representation_urls: urls, url_reservations: [...reserved.values()] }
  const freeze = (value: unknown): void => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  }
  freeze(answer)
  return answer
}
