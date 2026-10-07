// lib/readiness/official-truth-trusted-fact-extractor-registry.ts
//
// Deterministischer Extraktor-Rahmen für servereigenes amtliches Material.
// Das Produktionsregister ist absichtlich leer. Diese Datei registriert
// keine echte Quellenfamilie und liest kein eingereichtes Abrufmaterial.
// Auswahl, Schema und Politik kommen aus dem Code, nicht vom Aufrufer.
// Der Rahmen reicht den kanonischen quellenneutralen RegelScope weiter.
// Er wählt keine Staatsbürgerschaft, kein Dokument und keinen Wohnsitz.
// Ein Erfolg ist ein kanonisch geprüfter Regel-Fakt, keine Annahme.
// Der Marker beschränkt das Modul auf den Server-Stapel. Er öffnet kein Netz.

import 'server-only'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry, readContentIdentityBinding, readContentItemRef, readDistinctContentItemRefs, type ContentItemRef, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { quelleUrlLesen } from '@/lib/readiness/official'
import {
  REGEL_EVIDENCE_QUALITAETEN,
  REGEL_FAKT_ARTEN,
  REGEL_SCOPE_PRAEFIX,
  REGEL_SUPPORT_MAX,
  regelFaktKanonischLesen,
  regelScopeAusEvidenceScope,
  type RegelClaimFehler,
  type RegelFakt,
  type RegelFaktArt,
  type RegelScope,
} from '@/lib/readiness/rule-claims'
import {
  QUELLEN_KLASSEN,
  domaeneNormalisieren,
  quellenUrlAufloesen,
  type QuellenRegistry,
} from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '@/types/trips'

const EXTRACTOR_ID = /^otx_[a-z][a-z0-9_]{0,40}$/
const POLICY_ID = /^otp_[a-z][a-z0-9_]{0,40}$/
const SCHEMA_FAMILIE = /^ots_[a-z][a-z0-9_]{0,40}$/
const QUELLEN_FAMILIE = /^otf_[a-z][a-z0-9_]{0,40}$/
const QUELLEN_ID = /^[a-z][a-z0-9_-]{1,63}$/
const VERSION_ID = /^ev2_[a-f0-9]{32}$/
const SCOPE_KEY = new RegExp(`^${REGEL_SCOPE_PRAEFIX}[a-f0-9]{64}$`)
/** Dieselbe beobachtete MIME-Form wie die serverseitige Lesung. Kein Import jener Datei, weil sie Netz öffnet. */
const MEDIENTYP = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/
const FELD_PFAD = /^[a-z][A-Za-z0-9]{0,40}(?:\.[a-z][A-Za-z0-9]{0,40}){0,4}$/
const ZEIT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const HASH = /^[a-f0-9]{64}$/
/** Obergrenze der serverseitigen Lesung. Dieser Rahmen erhöht sie nicht. */
const REDIRECT_MAX = 5
const TIEFE_MAX = 8
/** Obergrenze der quellenbezogenen Beobachtungen einer Ausführung. */
const BEOBACHTUNG_MAX = 256
const BEOBACHTUNG_SCHLUESSEL = ['targetKey', 'sourceId', 'contentItemId', 'canonical'] as const
/** Ein Atom-Locator ist eine Herkunftsadresse der Kompositionsschicht, kein Faktfeld. */
const FAKT_MARKER = new Set(['atomKey', 'atomLocator', 'atomId'])

const EINGABE_SCHLUESSEL = [
  'factKind',
  'requirementType',
  'scopeKey',
  'scope',
  'evidenceQuality',
  'supports',
  'policy',
  'registry',
] as const

/** Quellenneutrale Zelle. `sourceId` gehört nicht in den dekodierten Scope. */
const SCOPE_SCHLUESSEL = [
  'destinationCountryCode',
  'transitCountryCode',
  'citizenship',
  'credentialOption',
  'residence',
  'requirementType',
  'validity',
] as const

const STUETZE_SCHLUESSEL = ['versionId', 'sourceId', 'retrieval'] as const

const ABRUF_SCHLUESSEL = [
  'status',
  'sourceId',
  'identitySchema', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion', 'identityProfileId', 'identityProfileVersion',
  'canonicalUrl',
  'retrievedAt',
  'contentType',
  'sourceSnapshot',
  'sourceContentHash',
  'redirectCount',
] as const

const POLITIK_SCHLUESSEL = ['policyId', 'policyVersion', 'assignments'] as const
const ZUWEISUNG_SCHLUESSEL = ['fieldPath', 'sourceId', 'contentItemId'] as const
const REGISTRY_SCHLUESSEL = ['sources', 'blockedDomains', 'contentIdentity'] as const
const QUELLE_SCHLUESSEL = ['sourceId', 'sourceClass', 'publisherName', 'authorityName', 'domains'] as const

const DEFINITION_SCHLUESSEL = [
  'extractorId',
  'extractorVersion',
  'current',
  'factKind',
  'sourceFamilyId',
  'contentItemRefs',
  'representations',
  'urlAllowlist',
  'contentTypes',
  'schemaFamily',
  'policyId',
  'policyVersion',
  'requiredFieldPaths',
  'match',
  'extract',
] as const

const PERSONEN = new Set([
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'tripId',
  'trip_id',
  'travellerId',
  'travellerClientRef',
  'traveller_client_ref',
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'mrz',
  'biometric',
  'biometrics',
  'dateOfBirth',
  'dob',
  'birthDate',
  'birth_date',
  'healthRecord',
  'health',
  'diagnosis',
  'email',
  'fullName',
  'givenName',
  'familyName',
  'phone',
  'scan',
  'documentScan',
])

const VERBOTEN = new Set([
  'proposal',
  'suggestion',
  'suggestions',
  'reviewSuggestion',
  'review_suggestion',
  'model',
  'plugin',
  'modelOutput',
  'pluginOutput',
  'trustedRuleFact',
  'trusted_rule_fact',
  'witness',
  'extractionNote',
  'extraction_note',
  'schemaFamily',
  'schema_family',
  'atomKey',
  'atomLocator',
  'atomId',
  'extractorId',
  'extractorVersion',
  'extractor_id',
  'extractor_version',
  'responseBytes',
  'response_bytes',
  'attestation',
  'decision',
])

const ANNEHMBAR = ['explicit_primary_statement', 'composed_from_multiple_primary_sources'] as const
type AnnehmbareQualitaet = (typeof ANNEHMBAR)[number]

const ZELL_PFLICHT: Partial<Record<RegelFaktArt, OfficialRequirementType>> = {
  visa_options: 'visa',
  passport_validity: 'passport_validity',
  blank_passport_pages: 'blank_passport_pages',
  transit_conditions: 'transit',
}

const RAHMEN_GRUENDE = [
  'personal_identifier_forbidden',
  'unexpected_fields',
  'fact_kind_mismatch',
  'requirement_type_mismatch',
  'extractor_not_registered',
  'source_not_allowlisted',
  'domain_or_path_not_allowlisted',
  'content_type_not_allowlisted',
  'schema_family_not_allowlisted',
  'schema_mismatch',
  'structure_not_recognized',
  'required_key_missing',
  'selector_missing',
  'heading_meaning_changed',
  'duplicate_value',
  'conflicting_value',
  'unknown_unit',
  'unknown_qualifier',
  'ambiguous_structure',
  'snapshot_hash_mismatch',
  'snapshot_bound_exceeded',
  'source_epoch_unreadable',
  'policy_required',
  'policy_version_mismatch',
  'policy_field_unassigned',
  'fact_incomplete',
  'representation_not_eligible',
  'invalid_extractor_definition',
  'duplicate_extractor_version',
  'duplicate_extractor_match',
  'insufficient_support',
  'same_content_item_composition',
  'support_bound_exceeded',
  'invalid_support',
  'quality_not_acceptable',
] as const

const MATCH_GRUENDE = new Set<string>([
  'schema_mismatch',
  'structure_not_recognized',
  'schema_family_not_allowlisted',
  'required_key_missing',
  'selector_missing',
  'heading_meaning_changed',
  'representation_not_eligible',
  'ambiguous_structure',
  'unknown_unit',
  'unknown_qualifier',
  'duplicate_value',
  'conflicting_value',
  'source_epoch_unreadable',
  'snapshot_bound_exceeded',
  'fact_incomplete',
])

const EXTRAKT_GRUENDE = new Set<string>([
  ...MATCH_GRUENDE,
  'policy_field_unassigned',
  'fact_kind_mismatch',
  'requirement_type_mismatch',
  'fact_incomplete',
])

export type OfficialTruthTrustedFactExtractorSperrgrund = (typeof RAHMEN_GRUENDE)[number] | RegelClaimFehler

export type OfficialTruthExtractorUrlRegel =
  | { readonly kind: 'exact'; readonly canonicalUrl: string }
  | { readonly kind: 'path'; readonly host: string; readonly path: string }

export type OfficialTruthExtractorZuweisung = ContentItemRef & {
  readonly fieldPath: string
  readonly sourceId: string
}

export type OfficialTruthExtractorPolitik = {
  readonly policyId: string
  readonly policyVersion: number
  readonly assignments: readonly OfficialTruthExtractorZuweisung[]
}

export type OfficialTruthExtractorStuetze = ContentIdentityBinding & {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string
  readonly sourceSnapshot: string
  readonly sourceContentHash: string
}

export type OfficialTruthExtractorKontext = {
  readonly factKind: RegelFaktArt
  readonly requirementType: OfficialRequirementType
  readonly scopeKey: string
  readonly scope: RegelScope
  readonly evidenceQuality: AnnehmbareQualitaet
  readonly schemaFamily: string
  readonly supports: readonly OfficialTruthExtractorStuetze[]
  readonly policy: OfficialTruthExtractorPolitik | null
  readonly registry: QuellenRegistry
}

export type OfficialTruthExtractorDefinition = {
  readonly extractorId: string
  readonly extractorVersion: number
  readonly current: boolean
  readonly factKind: RegelFaktArt
  readonly sourceFamilyId: string
  readonly contentItemRefs: readonly ContentItemRef[]
  readonly representations: readonly ContentIdentityBinding[]
  readonly urlAllowlist: readonly OfficialTruthExtractorUrlRegel[]
  readonly contentTypes: readonly string[]
  readonly schemaFamily: string
  readonly policyId: string | null
  readonly policyVersion: number | null
  readonly requiredFieldPaths: readonly string[]
  readonly match: (kontext: OfficialTruthExtractorKontext) => unknown
  readonly extract: (kontext: OfficialTruthExtractorKontext) => unknown
}

/**
 * Quellenbezogene Beobachtung einer Ausführung. Sie entsteht nur im
 * codeeigenen Extraktor über servereigenes frisches Material. Der
 * `targetKey` ist für diesen Rahmen undurchsichtig; die aufrufende
 * Schicht besitzt seine Bedeutung.
 */
export type OfficialTruthExtractorBeobachtung = ContentItemRef & {
  readonly targetKey: string
  readonly sourceId: string
  readonly canonical: string
}

export type OfficialTruthExtractorHerkunft = ContentIdentityBinding & {
  readonly fieldPath: string
  readonly extractorId: string
  readonly extractorVersion: number
  readonly sourceId: string
  readonly versionId: string
  readonly policyId: string | null
  readonly policyVersion: number | null
}

export type OfficialTruthTrustedFactExtractorErfolg = {
  readonly status: 'trusted_fact_extracted'
  readonly fact: RegelFakt
  readonly extractorId: string
  readonly extractorVersion: number
  readonly schemaFamily: string
  readonly policyId: string | null
  readonly policyVersion: number | null
  readonly sourceIds: readonly string[]
  readonly contentItemRefs: readonly ContentItemRef[]
  readonly supportVersionIds: readonly string[]
  readonly provenance: readonly OfficialTruthExtractorHerkunft[]
}

export type OfficialTruthTrustedFactExtractorErgebnis =
  | OfficialTruthTrustedFactExtractorErfolg
  | { readonly status: 'blocked'; readonly reason: OfficialTruthTrustedFactExtractorSperrgrund }

/** Serverintern: die tatsächlich ausgeführte Definition und das ganze geprüfte
 * Register. Namen allein oder eine Kopie des Ergebnisses ersetzen diese Bindung
 * nicht. Der rohe Extraktoreingang wird niemals an den Verbraucher projiziert. */
export type OfficialTruthTrustedFactExecutionContext = {
  readonly extractors: readonly OfficialTruthExtractorDefinition[]
  readonly selected: OfficialTruthExtractorDefinition
  readonly fact: RegelFakt
  readonly provenance: readonly OfficialTruthExtractorHerkunft[]
}

const executionContexts = new WeakMap<OfficialTruthTrustedFactExtractorErfolg, {
  readonly input: object
  readonly context: OfficialTruthTrustedFactExecutionContext
}>()

/** Nur die servereigene Same-Request-Naht konsumiert eine echte Ausführung.
 * Auch ein echter Erfolg eines anderen Eingangs ist kein Same-Request-Beweis. */
export function consumeOfficialTruthTrustedFactExecutionContext(
  result: unknown,
  input: unknown,
): OfficialTruthTrustedFactExecutionContext | null {
  if (!result || typeof result !== 'object') return null
  const entry = executionContexts.get(result as OfficialTruthTrustedFactExtractorErfolg)
  if (!entry) return null
  executionContexts.delete(result as OfficialTruthTrustedFactExtractorErfolg)
  if (entry.input !== input) return null
  const success = result as OfficialTruthTrustedFactExtractorErfolg
  if (success.fact !== entry.context.fact || success.provenance !== entry.context.provenance ||
      !entry.context.extractors.includes(entry.context.selected) ||
      success.extractorId !== entry.context.selected.extractorId ||
      success.extractorVersion !== entry.context.selected.extractorVersion ||
      success.schemaFamily !== entry.context.selected.schemaFamily) return null
  return entry.context
}

/**
 * Ergebnis der einen kanonischen Ausführung einer bereits gewählten
 * und geprüften Definition. Es ist kein Annahmeergebnis.
 */
export type OfficialTruthExtractorEingefroreneErgebnis =
  | {
      readonly ok: true
      readonly fact: RegelFakt
      readonly observations: readonly OfficialTruthExtractorBeobachtung[]
      readonly supports: readonly OfficialTruthExtractorStuetze[]
    }
  | { readonly ok: false; readonly reason: OfficialTruthTrustedFactExtractorSperrgrund }

export type OfficialTruthExtractorRegistryErgebnis =
  | { readonly ok: true; readonly registry: readonly OfficialTruthExtractorDefinition[] }
  | {
      readonly ok: false
      readonly reason: 'invalid_extractor_definition' | 'duplicate_extractor_version' | 'duplicate_extractor_match'
    }

/**
 * Produktionsregister. Absichtlich leer.
 * Eine echte Behördenquelle wird hier nicht eingetragen.
 */
export const OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY: readonly OfficialTruthExtractorDefinition[] =
  Object.freeze([])

type GesperrteStuetze = ContentIdentityBinding & {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly contentType: string
  readonly sourceSnapshot: string
  readonly sourceContentHash: string
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genau(satz: Record<string, unknown>, schluessel: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === schluessel.length && schluessel.every((name) => Object.hasOwn(satz, name))
}

function einfrieren<T>(wert: T): T {
  if (Array.isArray(wert)) {
    for (const eintrag of wert) einfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  if (wert && typeof wert === 'object') {
    for (const eintrag of Object.values(wert)) einfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  return wert
}

function sperre(reason: OfficialTruthTrustedFactExtractorSperrgrund): OfficialTruthTrustedFactExtractorErgebnis {
  return einfrieren({ status: 'blocked', reason })
}

function positiveGanzeZahl(wert: unknown): number | null {
  if (typeof wert !== 'number' || !Number.isSafeInteger(wert) || wert < 1) return null
  return wert
}

function textIn<T extends string>(wert: unknown, liste: readonly T[]): wert is T {
  return typeof wert === 'string' && (liste as readonly string[]).includes(wert)
}

function baum(wert: unknown, tiefe: number, treffer: (satz: Record<string, unknown>, schluessel: string) => boolean): boolean {
  if (tiefe > TIEFE_MAX || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => baum(eintrag, tiefe + 1, treffer))
  const satz = wert as Record<string, unknown>
  return Object.keys(satz).some((schluessel) => treffer(satz, schluessel) || baum(satz[schluessel], tiefe + 1, treffer))
}

function zuTief(wert: unknown, tiefe = 0): boolean {
  if (!wert || typeof wert !== 'object') return false
  if (tiefe > TIEFE_MAX) return true
  if (Array.isArray(wert)) return wert.some((eintrag) => zuTief(eintrag, tiefe + 1))
  return Object.values(wert as Record<string, unknown>).some((eintrag) => zuTief(eintrag, tiefe + 1))
}

function itemKey(ref: ContentItemRef): string { return JSON.stringify([ref.sourceId, ref.contentItemId]) }

function sortiert(werte: readonly string[]): string[] {
  return [...werte].sort((links, rechts) => (links < rechts ? -1 : links > rechts ? 1 : 0))
}

function gleicheMenge(links: readonly string[], rechts: readonly string[]): boolean {
  const a = sortiert(links)
  const b = sortiert(rechts)
  return a.length === b.length && a.every((wert, index) => wert === b[index])
}

function medientyp(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const roh = wert.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!roh || !MEDIENTYP.test(roh)) return null
  return roh
}

function urlRegelLesen(wert: unknown): OfficialTruthExtractorUrlRegel | null {
  const satz = datensatz(wert)
  if (!satz) return null
  if (satz.kind === 'exact' && genau(satz, ['kind', 'canonicalUrl'])) {
    const canonicalUrl = quelleUrlLesen(satz.canonicalUrl)
    if (!canonicalUrl || canonicalUrl !== satz.canonicalUrl) return null
    return { kind: 'exact', canonicalUrl }
  }
  if (satz.kind === 'path' && genau(satz, ['kind', 'host', 'path'])) {
    const host = domaeneNormalisieren(satz.host)
    if (!host || host !== satz.host) return null
    if (typeof satz.path !== 'string' || !satz.path.startsWith('/') || satz.path.length > 200) return null
    if (satz.path.includes('..') || satz.path.includes('?') || satz.path.includes('#') || satz.path.includes('\\')) {
      return null
    }
    if (!/^\/[a-zA-Z0-9._~/-]*$/.test(satz.path)) return null
    return { kind: 'path', host, path: satz.path }
  }
  return null
}

export function officialTruthExtractorUrlErlaubt(
  canonicalUrl: string,
  regeln: readonly OfficialTruthExtractorUrlRegel[],
): boolean {
  return urlErlaubt(canonicalUrl, regeln)
}

export function officialTruthExtractorMedienTyp(wert: unknown): string | null {
  return medientyp(wert)
}

function urlErlaubt(canonicalUrl: string, regeln: readonly OfficialTruthExtractorUrlRegel[]): boolean {
  let adresse: URL
  try {
    adresse = new URL(canonicalUrl)
  } catch {
    return false
  }
  return regeln.some((regel) => {
    if (regel.kind === 'exact') return regel.canonicalUrl === canonicalUrl
    // Eine Pfadregel ist exakt Host und Pfad ohne Query. Eine funktionale
    // Query ändert die Seite und braucht eine eigene exakte URL-Regel.
    // Die Query am Abruf bleibt stehen. Sie wird hier nicht entfernt.
    if (adresse.search !== '') return false
    return adresse.hostname.toLowerCase() === regel.host && adresse.pathname === regel.path
  })
}

function definitionLesen(wert: unknown): OfficialTruthExtractorDefinition | null {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, DEFINITION_SCHLUESSEL)) return null
  if (typeof satz.extractorId !== 'string' || !EXTRACTOR_ID.test(satz.extractorId)) return null
  const extractorVersion = positiveGanzeZahl(satz.extractorVersion)
  if (!extractorVersion || typeof satz.current !== 'boolean') return null
  if (!textIn(satz.factKind, REGEL_FAKT_ARTEN)) return null
  if (typeof satz.sourceFamilyId !== 'string' || !QUELLEN_FAMILIE.test(satz.sourceFamilyId)) return null
  const refs = readDistinctContentItemRefs(satz.contentItemRefs)
  if (!refs.ok) return null
  const contentItemRefs = refs.value
  if (!Array.isArray(satz.representations) || !satz.representations.length || satz.representations.length > 16) return null
  const representations: ContentIdentityBinding[] = []
  for (const raw of satz.representations) {
    const pin = readContentIdentityBinding(raw)
    if (!pin.ok || !contentItemRefs.some((ref) => itemKey(ref) === itemKey(pin.value))) return null
    if (representations.some((other) => contentIdentityMatches(other, pin.value))) return null
    representations.push(pin.value)
  }
  if (contentItemRefs.some((ref) => !representations.some((pin) => itemKey(ref) === itemKey(pin)))) return null
  if (!Array.isArray(satz.urlAllowlist) || satz.urlAllowlist.length === 0 || satz.urlAllowlist.length > 8) return null
  const urlAllowlist: OfficialTruthExtractorUrlRegel[] = []
  const geseheneUrls = new Set<string>()
  for (const eintrag of satz.urlAllowlist) {
    const regel = urlRegelLesen(eintrag)
    if (!regel) return null
    const schluessel = regel.kind === 'exact' ? `exact:${regel.canonicalUrl}` : `path:${regel.host}${regel.path}`
    if (geseheneUrls.has(schluessel)) return null
    geseheneUrls.add(schluessel)
    urlAllowlist.push(regel)
  }
  if (!Array.isArray(satz.contentTypes) || satz.contentTypes.length === 0 || satz.contentTypes.length > 8) return null
  const contentTypes: string[] = []
  for (const eintrag of satz.contentTypes) {
    const typ = medientyp(eintrag)
    if (!typ || typ !== eintrag || contentTypes.includes(typ)) return null
    contentTypes.push(typ)
  }
  if (typeof satz.schemaFamily !== 'string' || !SCHEMA_FAMILIE.test(satz.schemaFamily)) return null
  const policyId = satz.policyId
  const policyVersion = satz.policyVersion
  const einzelneQuelle = policyId === null && policyVersion === null
  const versioniertePolitik =
    typeof policyId === 'string' && POLICY_ID.test(policyId) && positiveGanzeZahl(policyVersion) !== null
  if (!einzelneQuelle && !versioniertePolitik) return null
  if (!Array.isArray(satz.requiredFieldPaths) || satz.requiredFieldPaths.length > 16) return null
  const requiredFieldPaths: string[] = []
  for (const eintrag of satz.requiredFieldPaths) {
    if (typeof eintrag !== 'string' || !FELD_PFAD.test(eintrag) || requiredFieldPaths.includes(eintrag)) return null
    requiredFieldPaths.push(eintrag)
  }
  if (einzelneQuelle) {
    if (contentItemRefs.length !== 1 || requiredFieldPaths.length !== 0) return null
  } else if (contentItemRefs.length < 2) {
    return null
  }
  if (typeof satz.match !== 'function' || typeof satz.extract !== 'function') return null
  return {
    extractorId: satz.extractorId,
    extractorVersion,
    current: satz.current,
    factKind: satz.factKind,
    sourceFamilyId: satz.sourceFamilyId,
    contentItemRefs,
    representations: Object.freeze(representations),
    urlAllowlist: Object.freeze(urlAllowlist.map((regel) => Object.freeze(regel))),
    contentTypes: Object.freeze(sortiert(contentTypes)),
    schemaFamily: satz.schemaFamily,
    policyId: einzelneQuelle ? null : (policyId as string),
    policyVersion: einzelneQuelle ? null : (policyVersion as number),
    requiredFieldPaths: Object.freeze(sortiert(requiredFieldPaths)),
    match: satz.match as OfficialTruthExtractorDefinition['match'],
    extract: satz.extract as OfficialTruthExtractorDefinition['extract'],
  }
}

export function officialTruthExtractorDefinitionenPruefen(wert: unknown): OfficialTruthExtractorRegistryErgebnis {
  if (!Array.isArray(wert)) return { ok: false, reason: 'invalid_extractor_definition' }
  const registry: OfficialTruthExtractorDefinition[] = []
  const paare = new Set<string>()
  for (const eintrag of wert) {
    const definition = definitionLesen(eintrag)
    if (!definition) return { ok: false, reason: 'invalid_extractor_definition' }
    const paar = `${definition.extractorId}@${definition.extractorVersion}`
    if (paare.has(paar)) return { ok: false, reason: 'duplicate_extractor_version' }
    paare.add(paar)
    registry.push(Object.freeze(definition))
  }
  const selektoren = new Set<string>()
  for (const definition of registry) {
    if (!definition.current) continue
    const selektor = `${definition.factKind}\u0000${definition.contentItemRefs.map(itemKey).join('\u0000')}`
    if (selektoren.has(selektor)) return { ok: false, reason: 'duplicate_extractor_match' }
    selektoren.add(selektor)
  }
  return { ok: true, registry: einfrieren(registry) }
}

function registryLesen(wert: unknown): QuellenRegistry | null {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, REGISTRY_SCHLUESSEL)) return null
  if (!Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return null
  for (const eintrag of satz.blockedDomains) {
    if (typeof eintrag !== 'string') return null
  }
  for (const eintrag of satz.sources) {
    const quelle = datensatz(eintrag)
    if (!quelle || !genau(quelle, QUELLE_SCHLUESSEL)) return null
    if (typeof quelle.sourceId !== 'string' || !QUELLEN_ID.test(quelle.sourceId)) return null
    if (!textIn(quelle.sourceClass, QUELLEN_KLASSEN)) return null
    if (!Array.isArray(quelle.domains) || quelle.domains.some((domain) => typeof domain !== 'string')) return null
  }
  return wert as QuellenRegistry
}

function politikForm(wert: unknown): { ok: true; policy: OfficialTruthExtractorPolitik } | { ok: false } {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, POLITIK_SCHLUESSEL)) return { ok: false }
  if (typeof satz.policyId !== 'string' || !POLICY_ID.test(satz.policyId)) return { ok: false }
  const policyVersion = positiveGanzeZahl(satz.policyVersion)
  if (!policyVersion) return { ok: false }
  if (!Array.isArray(satz.assignments) || satz.assignments.length === 0 || satz.assignments.length > 16) {
    return { ok: false }
  }
  const assignments: OfficialTruthExtractorZuweisung[] = []
  for (const eintrag of satz.assignments) {
    const zuweisung = datensatz(eintrag)
    if (!zuweisung || !genau(zuweisung, ZUWEISUNG_SCHLUESSEL)) return { ok: false }
    if (typeof zuweisung.fieldPath !== 'string' || !FELD_PFAD.test(zuweisung.fieldPath)) return { ok: false }
    if (typeof zuweisung.sourceId !== 'string' || !QUELLEN_ID.test(zuweisung.sourceId)) return { ok: false }
    const ref = readContentItemRef({ sourceId: zuweisung.sourceId, contentItemId: zuweisung.contentItemId })
    if (!ref.ok) return { ok: false }
    assignments.push({ fieldPath: zuweisung.fieldPath, ...ref.value })
  }
  return {
    ok: true,
    policy: { policyId: satz.policyId, policyVersion, assignments },
  }
}

function stuetzeBinden(
  wert: unknown,
  registry: QuellenRegistry,
): { ok: true; stuetze: GesperrteStuetze } | { ok: false; reason: OfficialTruthTrustedFactExtractorSperrgrund } {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, STUETZE_SCHLUESSEL)) return { ok: false, reason: 'unexpected_fields' }
  if (typeof satz.versionId !== 'string' || !VERSION_ID.test(satz.versionId)) return { ok: false, reason: 'invalid_support' }
  if (typeof satz.sourceId !== 'string' || !QUELLEN_ID.test(satz.sourceId)) return { ok: false, reason: 'source_not_allowlisted' }
  const retrieval = datensatz(satz.retrieval)
  if (!retrieval) return { ok: false, reason: 'unexpected_fields' }
  if (retrieval.status === 'retrieved_material') return { ok: false, reason: 'representation_not_eligible' }
  if (retrieval.status !== 'server_owned_official_retrieval' || !genau(retrieval, ABRUF_SCHLUESSEL)) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  if (retrieval.sourceId !== satz.sourceId) return { ok: false, reason: 'source_not_allowlisted' }
  if (typeof retrieval.canonicalUrl !== 'string' || typeof retrieval.sourceSnapshot !== 'string') {
    return { ok: false, reason: 'unexpected_fields' }
  }
  if (typeof retrieval.retrievedAt !== 'string' || !ZEIT.test(retrieval.retrievedAt)) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  if (
    typeof retrieval.redirectCount !== 'number' ||
    !Number.isSafeInteger(retrieval.redirectCount) ||
    retrieval.redirectCount < 0 ||
    retrieval.redirectCount > REDIRECT_MAX
  ) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  const fingerprint = evidenceQuellenFingerprint(retrieval.sourceSnapshot)
  if (!fingerprint) return { ok: false, reason: 'snapshot_bound_exceeded' }
  if (typeof retrieval.sourceContentHash !== 'string' || !HASH.test(retrieval.sourceContentHash)) {
    return { ok: false, reason: 'snapshot_hash_mismatch' }
  }
  if (fingerprint !== retrieval.sourceContentHash) return { ok: false, reason: 'snapshot_hash_mismatch' }
  const aufgeloest = quellenUrlAufloesen(registry, retrieval.canonicalUrl)
  if (!aufgeloest.ok || aufgeloest.canonicalUrl !== retrieval.canonicalUrl) {
    return { ok: false, reason: 'source_not_allowlisted' }
  }
  if (aufgeloest.source.sourceClass !== 'official_authority' || aufgeloest.source.sourceId !== satz.sourceId) {
    return { ok: false, reason: 'source_not_allowlisted' }
  }
  const contentType = medientyp(retrieval.contentType)
  if (!contentType || retrieval.contentType !== contentType) return { ok: false, reason: 'content_type_not_allowlisted' }
  const rep = contentRepresentationFromRegistry(registry, retrieval.canonicalUrl)
  const identity = readContentIdentityBinding({ sourceId: retrieval.sourceId, contentItemId: retrieval.contentItemId, contentItemVersion: retrieval.contentItemVersion, representationId: retrieval.representationId, representationVersion: retrieval.representationVersion, identityProfileId: retrieval.identityProfileId, identityProfileVersion: retrieval.identityProfileVersion })
  if (retrieval.identitySchema !== 2 || !identity.ok || !rep.ok || !contentIdentityMatches(rep.value, identity.value) || rep.value.expectedFinalUrl !== retrieval.canonicalUrl || rep.value.expectedMediaType !== contentType) return { ok: false, reason: 'representation_not_eligible' }
  return {
    ok: true,
    stuetze: {
      ...identity.value,
      versionId: satz.versionId,
      sourceId: satz.sourceId,
      canonicalUrl: retrieval.canonicalUrl,
      retrievedAt: retrieval.retrievedAt,
      contentType,
      sourceSnapshot: retrieval.sourceSnapshot,
      sourceContentHash: retrieval.sourceContentHash,
    },
  }
}

function schrittGrund(
  wert: unknown,
  erlaubt: ReadonlySet<string>,
  ersatz: OfficialTruthTrustedFactExtractorSperrgrund,
  mitFakt: boolean,
  mitBeobachtungen = false,
): { ok: true; fact?: unknown; observations?: unknown } | { ok: false; reason: OfficialTruthTrustedFactExtractorSperrgrund } {
  const satz = datensatz(wert)
  if (!satz || typeof satz.ok !== 'boolean') return { ok: false, reason: ersatz }
  if (satz.ok === true) {
    const schluessel = mitFakt ? (mitBeobachtungen ? ['ok', 'fact', 'observations'] : ['ok', 'fact']) : ['ok']
    if (!genau(satz, schluessel)) return { ok: false, reason: ersatz }
    if (!mitFakt) return { ok: true }
    return mitBeobachtungen
      ? { ok: true, fact: satz.fact, observations: satz.observations }
      : { ok: true, fact: satz.fact }
  }
  if (!genau(satz, ['ok', 'reason']) || typeof satz.reason !== 'string' || !erlaubt.has(satz.reason)) {
    return { ok: false, reason: ersatz }
  }
  const reason = (RAHMEN_GRUENDE as readonly string[]).includes(satz.reason)
    ? (satz.reason as OfficialTruthTrustedFactExtractorSperrgrund)
    : ersatz
  return { ok: false, reason }
}

/**
 * Beobachtungen stammen ausschließlich aus dem codeeigenen Extraktor.
 * Sie dürfen nur Quellen nennen, die in dieser Ausführung frisch
 * servereigen gelesen wurden.
 */
function beobachtungenLesen(
  wert: unknown,
  quellen: ReadonlySet<string>,
):
  | { ok: true; observations: OfficialTruthExtractorBeobachtung[] }
  | { ok: false; reason: OfficialTruthTrustedFactExtractorSperrgrund } {
  if (!Array.isArray(wert)) return { ok: false, reason: 'fact_incomplete' }
  if (wert.length === 0) return { ok: false, reason: 'fact_incomplete' }
  if (wert.length > BEOBACHTUNG_MAX) return { ok: false, reason: 'snapshot_bound_exceeded' }
  const observations: OfficialTruthExtractorBeobachtung[] = []
  for (const eintrag of wert) {
    const satz = datensatz(eintrag)
    if (!satz || !genau(satz, BEOBACHTUNG_SCHLUESSEL)) return { ok: false, reason: 'unexpected_fields' }
    if (typeof satz.targetKey !== 'string' || satz.targetKey.length === 0 || satz.targetKey.length > 512) {
      return { ok: false, reason: 'unexpected_fields' }
    }
    if (typeof satz.canonical !== 'string' || satz.canonical.length > 512) {
      return { ok: false, reason: 'unexpected_fields' }
    }
    const ref = readContentItemRef({ sourceId: satz.sourceId, contentItemId: satz.contentItemId })
    if (!ref.ok || !quellen.has(itemKey(ref.value))) {
      return { ok: false, reason: 'source_not_allowlisted' }
    }
    observations.push({ targetKey: satz.targetKey, ...ref.value, canonical: satz.canonical })
  }
  return { ok: true, observations }
}

/**
 * Die eine kanonische Ausführung. Kontext, Matcher, Extraktor und
 * kanonischer Parser laufen genau hier. Es gibt keinen zweiten
 * Ausführungsstapel. Diese Funktion wählt keine Definition aus.
 */
function definitionAusfuehren(input: {
  readonly definition: OfficialTruthExtractorDefinition
  readonly factKind: RegelFaktArt
  readonly requirementType: OfficialRequirementType
  readonly scopeKey: string
  readonly scope: RegelScope
  readonly evidenceQuality: AnnehmbareQualitaet
  readonly supports: readonly GesperrteStuetze[]
  readonly policy: OfficialTruthExtractorPolitik | null
  readonly registry: QuellenRegistry
  readonly beobachtungenPflicht: boolean
  readonly faktMarkerVerboten: boolean
}):
  | { ok: true; fact: RegelFakt; observations: readonly OfficialTruthExtractorBeobachtung[] }
  | { ok: false; reason: OfficialTruthTrustedFactExtractorSperrgrund } {
  const kontext = einfrieren({
    factKind: input.factKind,
    requirementType: input.requirementType,
    scopeKey: input.scopeKey,
    scope: input.scope,
    evidenceQuality: input.evidenceQuality,
    schemaFamily: input.definition.schemaFamily,
    supports: input.supports,
    policy: input.policy,
    registry: input.registry,
  })

  let erkannt: unknown
  try {
    erkannt = input.definition.match(kontext)
  } catch {
    return { ok: false, reason: 'structure_not_recognized' }
  }
  const struktur = schrittGrund(erkannt, MATCH_GRUENDE, 'structure_not_recognized', false)
  if (!struktur.ok) return struktur

  let roh: unknown
  try {
    roh = input.definition.extract(kontext)
  } catch {
    return { ok: false, reason: 'fact_incomplete' }
  }
  const extrakt = schrittGrund(roh, EXTRAKT_GRUENDE, 'fact_incomplete', true, input.beobachtungenPflicht)
  if (!extrakt.ok) return extrakt
  if (input.faktMarkerVerboten && baum(extrakt.fact, 0, (_satz, schluessel) => FAKT_MARKER.has(schluessel))) {
    return { ok: false, reason: 'unexpected_fields' }
  }

  let observations: readonly OfficialTruthExtractorBeobachtung[] = []
  if (input.beobachtungenPflicht) {
    const gelesen = beobachtungenLesen(
      extrakt.observations,
      new Set(input.supports.map(itemKey)),
    )
    if (!gelesen.ok) return gelesen
    observations = gelesen.observations
  }

  const fakt = regelFaktKanonischLesen(input.factKind, input.requirementType, extrakt.fact, input.registry)
  if (!fakt.ok) return { ok: false, reason: fakt.reason }
  if (fakt.fact.kind !== input.factKind) return { ok: false, reason: 'fact_kind_mismatch' }
  return { ok: true, fact: fakt.fact, observations }
}

/**
 * Der dekodierte Scope ist nur die kanonische quellenneutrale Zelle.
 * `regelScopeAusEvidenceScope` bleibt der einzige Parser und die einzige
 * Schlüsselableitung. Der Matcher sieht die Kopie, nicht das Eingabeobjekt.
 * Der Rahmen wählt daraus keinen Fakt.
 */
function dekodiertenScopeLesen(
  roh: unknown,
  scopeKey: string,
  requirementType: string,
): { ok: true; scope: RegelScope } | { ok: false; reason: OfficialTruthTrustedFactExtractorSperrgrund } {
  const satz = datensatz(roh)
  if (!satz) return { ok: false, reason: 'invalid_scope' }
  if ('sourceId' in satz) return { ok: false, reason: 'unexpected_fields' }
  if (!genau(satz, SCOPE_SCHLUESSEL)) return { ok: false, reason: 'unexpected_fields' }
  const gelesen = regelScopeAusEvidenceScope(satz)
  if (!gelesen.ok) return { ok: false, reason: gelesen.reason }
  if (gelesen.key !== scopeKey) return { ok: false, reason: 'scope_mismatch' }
  if (gelesen.scope.requirementType !== requirementType) return { ok: false, reason: 'requirement_type_mismatch' }
  return { ok: true, scope: structuredClone(gelesen.scope) }
}

function herkunftFuer(
  definition: OfficialTruthExtractorDefinition,
  stuetzen: readonly GesperrteStuetze[],
  fact: RegelFakt,
  policy: OfficialTruthExtractorPolitik | null,
): OfficialTruthExtractorHerkunft[] {
  if (!policy) {
    const stuetze = stuetzen[0]
    if (!stuetze) return []
    return sortiert(Object.keys(fact)).map((fieldPath) => ({
      fieldPath,
      extractorId: definition.extractorId,
      extractorVersion: definition.extractorVersion,
      ...contentIdentityBinding(stuetze),
      versionId: stuetze.versionId,
      policyId: null,
      policyVersion: null,
    }))
  }
  return sortiert(policy.assignments.map((eintrag) => eintrag.fieldPath)).flatMap((fieldPath) => {
    const zuweisung = policy.assignments.find((eintrag) => eintrag.fieldPath === fieldPath)
    const stuetze = zuweisung && stuetzen.find((eintrag) => itemKey(eintrag) === itemKey(zuweisung))
    if (!stuetze) return []
    return {
      fieldPath,
      extractorId: definition.extractorId,
      extractorVersion: definition.extractorVersion,
      ...contentIdentityBinding(stuetze),
      versionId: stuetze.versionId,
      policyId: definition.policyId,
      policyVersion: definition.policyVersion,
    }
  })
}

function ausfuehren(
  eingabe: unknown,
  definitionen: readonly OfficialTruthExtractorDefinition[],
  serverPolitik: unknown = null,
): OfficialTruthTrustedFactExtractorErgebnis {
  if (zuTief(eingabe)) return sperre('unexpected_fields')
  if (baum(eingabe, 0, (_satz, schluessel) => PERSONEN.has(schluessel))) {
    return sperre('personal_identifier_forbidden')
  }
  if (baum(eingabe, 0, (satz) => satz.status === 'retrieved_material')) {
    return sperre('representation_not_eligible')
  }
  if (baum(eingabe, 0, (_satz, schluessel) => VERBOTEN.has(schluessel))) return sperre('unexpected_fields')

  const satz = datensatz(eingabe)
  if (!satz || !genau(satz, EINGABE_SCHLUESSEL)) return sperre('unexpected_fields')
  if (!textIn(satz.factKind, REGEL_FAKT_ARTEN)) return sperre('fact_kind_mismatch')
  if (!textIn(satz.requirementType, OFFICIAL_REQUIREMENT_TYPES)) return sperre('requirement_type_mismatch')
  if (typeof satz.scopeKey !== 'string' || !SCOPE_KEY.test(satz.scopeKey)) return sperre('unexpected_fields')
  const scope = dekodiertenScopeLesen(satz.scope, satz.scopeKey, satz.requirementType)
  if (!scope.ok) return sperre(scope.reason)
  if (!textIn(satz.evidenceQuality, REGEL_EVIDENCE_QUALITAETEN)) return sperre('unexpected_fields')
  if (!textIn(satz.evidenceQuality, ANNEHMBAR)) return sperre('quality_not_acceptable')
  const pflicht = ZELL_PFLICHT[satz.factKind]
  if (pflicht && satz.requirementType !== pflicht) return sperre('requirement_type_mismatch')

  const registry = registryLesen(satz.registry)
  if (!registry) return sperre('unexpected_fields')
  if (!Array.isArray(satz.supports)) return sperre('invalid_support')
  if (satz.supports.length > REGEL_SUPPORT_MAX) return sperre('support_bound_exceeded')
  if (satz.supports.length === 0) return sperre('insufficient_support')

  const stuetzen: GesperrteStuetze[] = []
  const versionsIds = new Set<string>()
  for (const eintrag of satz.supports) {
    const gebunden = stuetzeBinden(eintrag, registry)
    if (!gebunden.ok) return sperre(gebunden.reason)
    if (versionsIds.has(gebunden.stuetze.versionId)) return sperre('invalid_support')
    versionsIds.add(gebunden.stuetze.versionId)
    stuetzen.push(gebunden.stuetze)
  }
  stuetzen.sort((links, rechts) => (links.versionId < rechts.versionId ? -1 : links.versionId > rechts.versionId ? 1 : 0))

  const quellen = new Set(stuetzen.map(itemKey))
  let policy: OfficialTruthExtractorPolitik | null = null
  if (satz.evidenceQuality === 'explicit_primary_statement') {
    if (stuetzen.length !== 1) return sperre('ambiguous_structure')
    if (satz.policy !== null) return sperre('unexpected_fields')
  } else {
    if (satz.policy !== null) return sperre('unexpected_fields')
    if (stuetzen.length < 2) return sperre('insufficient_support')
    if (quellen.size < 2) return sperre('same_content_item_composition')
    if (stuetzen.length !== quellen.size) return sperre('ambiguous_structure')
    if (serverPolitik === null || serverPolitik === undefined) return sperre('policy_required')
    const gelesen = politikForm(serverPolitik)
    if (!gelesen.ok) return sperre('unexpected_fields')
    policy = gelesen.policy
  }

  const beobachtet = new Set(stuetzen.map((eintrag) => eintrag.contentType))
  const passend = definitionen.filter((definition) => {
    if (!definition.current || definition.factKind !== satz.factKind) return false
    if (!gleicheMenge(definition.contentItemRefs.map(itemKey), [...quellen])) return false
    const einzelne = definition.policyId === null
    if (satz.evidenceQuality === 'explicit_primary_statement' ? !einzelne : einzelne) return false
    return [...beobachtet].every((typ) => definition.contentTypes.includes(typ))
  })
  const gleicheFamilie = definitionen.filter((definition) => {
    if (!definition.current || definition.factKind !== satz.factKind) return false
    if (!gleicheMenge(definition.contentItemRefs.map(itemKey), [...quellen])) return false
    const einzelne = definition.policyId === null
    return satz.evidenceQuality === 'explicit_primary_statement' ? einzelne : !einzelne
  })
  if (gleicheFamilie.length === 0) return sperre('extractor_not_registered')
  if (passend.length === 0) return sperre('content_type_not_allowlisted')
  if (passend.length > 1) return sperre('ambiguous_structure')
  const definition = passend[0]
  if (!definition) return sperre('extractor_not_registered')

  if (stuetzen.some((support) => !definition.representations.some((pin) => contentIdentityMatches(pin, support)))) {
    return sperre('representation_not_eligible')
  }
  if (stuetzen.some((eintrag) => !urlErlaubt(eintrag.canonicalUrl, definition.urlAllowlist))) {
    return sperre('domain_or_path_not_allowlisted')
  }

  if (policy) {
    if (policy.policyId !== definition.policyId || policy.policyVersion !== definition.policyVersion) {
      return sperre('policy_version_mismatch')
    }
    const pfade = policy.assignments.map((eintrag) => eintrag.fieldPath)
    if (new Set(pfade).size !== pfade.length) return sperre('conflicting_value')
    if (pfade.some((pfad) => !definition.requiredFieldPaths.includes(pfad))) return sperre('unexpected_fields')
    if (definition.requiredFieldPaths.some((pfad) => !pfade.includes(pfad))) return sperre('policy_field_unassigned')
    if (policy.assignments.some((eintrag) => !quellen.has(itemKey(eintrag)))) return sperre('source_not_allowlisted')
  }

  const gelaufen = definitionAusfuehren({
    definition,
    factKind: satz.factKind,
    requirementType: satz.requirementType,
    scopeKey: satz.scopeKey,
    scope: scope.scope,
    evidenceQuality: satz.evidenceQuality,
    supports: stuetzen,
    policy,
    registry,
    beobachtungenPflicht: false,
    faktMarkerVerboten: false,
  })
  if (!gelaufen.ok) return sperre(gelaufen.reason)

  const provenance = herkunftFuer(definition, stuetzen, gelaufen.fact, policy)
  if (provenance.length === 0 || provenance.some((eintrag) => eintrag.sourceId === '' || eintrag.versionId === '')) {
    return sperre('fact_incomplete')
  }
  const erfolg: OfficialTruthTrustedFactExtractorErfolg = {
    status: 'trusted_fact_extracted',
    fact: gelaufen.fact,
    extractorId: definition.extractorId,
    extractorVersion: definition.extractorVersion,
    schemaFamily: definition.schemaFamily,
    policyId: definition.policyId,
    policyVersion: definition.policyVersion,
    sourceIds: Object.freeze(sortiert([...new Set(stuetzen.map((support) => support.sourceId))])),
    contentItemRefs: Object.freeze(stuetzen.map(({ sourceId, contentItemId }) => Object.freeze({ sourceId, contentItemId }))),
    supportVersionIds: Object.freeze(sortiert(stuetzen.map((eintrag) => eintrag.versionId))),
    provenance,
  }
  einfrieren(erfolg)
  executionContexts.set(erfolg, Object.freeze({
    input: satz,
    context: Object.freeze({
      extractors: definitionen,
      selected: definition,
      fact: gelaufen.fact,
      provenance: erfolg.provenance,
    }),
  }))
  return erfolg
}

/** Produktions-Einstieg. Das leere Register ist fest. Der Aufrufer wählt keinen Extraktor. */
export function officialTruthTrustedFactExtrahieren(eingabe: unknown): OfficialTruthTrustedFactExtractorErgebnis {
  const geprueft = officialTruthExtractorDefinitionenPruefen(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY)
  if (!geprueft.ok) return sperre(geprueft.reason)
  return ausfuehren(eingabe, geprueft.registry)
}

/**
 * Testnaht. Synthetische Definitionen bleiben außerhalb des Produktionsregisters.
 * Eine Route darf diese Funktion nicht als Autorität aufrufen.
 */
export function officialTruthTrustedFactExtrahierenMitDefinitionen(
  eingabe: unknown,
  definitionen: unknown,
  serverPolitik?: unknown,
): OfficialTruthTrustedFactExtractorErgebnis {
  const geprueft = officialTruthExtractorDefinitionenPruefen(definitionen)
  if (!geprueft.ok) {
    const vorab = ausfuehren(eingabe, [])
    if (
      vorab.status === 'blocked' &&
      (vorab.reason === 'personal_identifier_forbidden' ||
        vorab.reason === 'unexpected_fields' ||
        vorab.reason === 'representation_not_eligible')
    ) {
      return vorab
    }
    return sperre(geprueft.reason)
  }
  return ausfuehren(eingabe, geprueft.registry, serverPolitik ?? null)
}

/**
 * Die eine servereigene Ausführungsnaht für eine bereits ausgewählte und
 * eingefrorene Definition. Sie sucht keine Definition, liest kein Register
 * und benutzt den beobachteten Medientyp nur zur Prüfung gegen die
 * eingefrorene Definition, niemals zur Auswahl.
 *
 * Die Beobachtungen entstehen im codeeigenen Extraktor über das frische
 * servereigene Material. Der Aufrufer liefert sie nicht.
 */
export function officialTruthExtractorEingefroreneAusfuehrung(input: {
  readonly definition: OfficialTruthExtractorDefinition
  readonly factKind: unknown
  readonly requirementType: unknown
  readonly scopeKey: unknown
  readonly scope: unknown
  readonly supports: unknown
  readonly registry: unknown
}): OfficialTruthExtractorEingefroreneErgebnis {
  const definition = definitionLesen(input.definition)
  if (!definition || !definition.current) return { ok: false, reason: 'invalid_extractor_definition' }
  if (definition.policyId === null || definition.policyVersion === null) {
    return { ok: false, reason: 'policy_required' }
  }
  if (!textIn(input.factKind, REGEL_FAKT_ARTEN) || input.factKind !== definition.factKind) {
    return { ok: false, reason: 'fact_kind_mismatch' }
  }
  if (!textIn(input.requirementType, OFFICIAL_REQUIREMENT_TYPES)) {
    return { ok: false, reason: 'requirement_type_mismatch' }
  }
  const pflicht = ZELL_PFLICHT[input.factKind]
  if (pflicht && input.requirementType !== pflicht) return { ok: false, reason: 'requirement_type_mismatch' }
  if (typeof input.scopeKey !== 'string' || !SCOPE_KEY.test(input.scopeKey)) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  const registry = registryLesen(input.registry)
  if (!registry) return { ok: false, reason: 'unexpected_fields' }
  const scope = dekodiertenScopeLesen(input.scope, input.scopeKey, input.requirementType)
  if (!scope.ok) return { ok: false, reason: scope.reason }

  if (!Array.isArray(input.supports)) return { ok: false, reason: 'invalid_support' }
  if (input.supports.length > REGEL_SUPPORT_MAX) return { ok: false, reason: 'support_bound_exceeded' }
  if (input.supports.length === 0) return { ok: false, reason: 'insufficient_support' }
  const stuetzen: GesperrteStuetze[] = []
  const versionsIds = new Set<string>()
  for (const eintrag of input.supports) {
    const gebunden = stuetzeBinden(eintrag, registry)
    if (!gebunden.ok) return { ok: false, reason: gebunden.reason }
    if (versionsIds.has(gebunden.stuetze.versionId)) return { ok: false, reason: 'invalid_support' }
    versionsIds.add(gebunden.stuetze.versionId)
    stuetzen.push(gebunden.stuetze)
  }
  stuetzen.sort((links, rechts) => (links.versionId < rechts.versionId ? -1 : links.versionId > rechts.versionId ? 1 : 0))

  const quellen = new Set(stuetzen.map(itemKey))
  if (quellen.size < 2) return { ok: false, reason: 'same_content_item_composition' }
  if (stuetzen.length !== quellen.size) return { ok: false, reason: 'ambiguous_structure' }
  if (!gleicheMenge(definition.contentItemRefs.map(itemKey), [...quellen])) return { ok: false, reason: 'source_not_allowlisted' }
  if (stuetzen.some((support) => !definition.representations.some((pin) => contentIdentityMatches(pin, support)))) {
    return { ok: false, reason: 'representation_not_eligible' }
  }
  if (stuetzen.some((eintrag) => !urlErlaubt(eintrag.canonicalUrl, definition.urlAllowlist))) {
    return { ok: false, reason: 'domain_or_path_not_allowlisted' }
  }
  if (stuetzen.some((eintrag) => !definition.contentTypes.includes(eintrag.contentType))) {
    return { ok: false, reason: 'content_type_not_allowlisted' }
  }

  const gelaufen = definitionAusfuehren({
    definition,
    factKind: input.factKind,
    requirementType: input.requirementType,
    scopeKey: input.scopeKey,
    scope: scope.scope,
    evidenceQuality: 'composed_from_multiple_primary_sources',
    supports: stuetzen,
    policy: null,
    registry,
    beobachtungenPflicht: true,
    faktMarkerVerboten: true,
  })
  if (!gelaufen.ok) return { ok: false, reason: gelaufen.reason }
  return einfrieren({
    ok: true as const,
    fact: gelaufen.fact,
    observations: gelaufen.observations,
    supports: stuetzen as readonly OfficialTruthExtractorStuetze[],
  })
}
