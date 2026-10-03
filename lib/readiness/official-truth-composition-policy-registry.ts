// lib/readiness/official-truth-composition-policy-registry.ts
//
// Schlafende, codeeigene Kompositionspolitik.
// Das Produktionsregister ist absichtlich leer. Diese Datei registriert
// keine echte Quellenfamilie, kein Land und keinen Rechtsausgang.
// Phase A läuft vor jedem HTTP-Abruf. Phase B prüft nur das bereits
// eingefrorene Paar und sucht nicht erneut. Das Siegel ist eine
// modulprivate Klasse, kein Annahmeergebnis und kein Bearer.

import 'server-only'

import { OFFICIAL_VISA_MODES, type OfficialVisaMode } from '@/lib/readiness/official'
import {
  officialTruthExtractorDefinitionenPruefen,
  officialTruthExtractorMedienTyp,
  officialTruthExtractorUrlErlaubt,
  type OfficialTruthExtractorDefinition,
  type OfficialTruthExtractorKontext,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import {
  regulierungsAusdruckStrukturSchluessel,
  type RegulierungsAusdruck,
} from '@/lib/readiness/regulierungs-anwendbarkeit'
import {
  REGEL_FAKT_ARTEN,
  REGEL_SUPPORT_MAX,
  regelFaktKanonischLesen,
  type RegelFakt,
  type RegelFaktArt,
  type RegelScope,
} from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, type OfficialRequirementType } from '@/types/trips'

const POLICY_ID = /^otp_[a-z][a-z0-9_]{0,40}$/
const QUELLEN_FAMILIE = /^otf_[a-z][a-z0-9_]{0,40}$/
const SCHEMA_FAMILIE = /^ots_[a-z][a-z0-9_]{0,40}$/
const QUELLEN_ID = /^[a-z][a-z0-9_-]{1,63}$/
const ZWEIG_ID = /^[a-z][a-z0-9_]{0,40}$/
const VERSION_ID = /^ev1_[a-f0-9]{32}$/
const INDEX = /^(0|[1-9]\d*)$/
const FELD_PFAD = /^[a-z][A-Za-z0-9]{0,40}(?:\.[a-z][A-Za-z0-9]{0,40}){0,4}$/

const POLICY_SCHLUESSEL = [
  'policyId',
  'policyVersion',
  'current',
  'factKind',
  'requirementType',
  'sourceIds',
  'sourceFamilyId',
  'schemaFamily',
  'applicabilitySchema',
  'completeness',
  'assignments',
] as const

const ZUWEISUNG_SCHLUESSEL = ['target', 'sourceIds', 'relation', 'role'] as const
const VISA_MODI = OFFICIAL_VISA_MODES.filter((modus) => modus !== 'unknown')
type VisaSlot = Exclude<OfficialVisaMode, 'unknown'>

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
])

const FAKT_VERBOTEN = new Set(['atomKey', 'atomLocator', 'atomId'])

export type OfficialTruthCompositionSperrgrund =
  | 'composition_policy_unavailable'
  | 'domain_or_path_not_allowlisted'
  | 'ambiguous_policy'
  | 'policy_version_mismatch'
  | 'duplicate_extractor_match'
  | 'duplicate_policy_match'
  | 'duplicate_policy_version'
  | 'invalid_policy_definition'
  | 'invalid_extractor_definition'
  | 'duplicate_extractor_version'
  | 'content_type_not_allowlisted'
  | 'schema_mismatch'
  | 'fact_kind_mismatch'
  | 'same_source_composition'
  | 'ambiguous_structure'
  | 'support_mismatch'
  | 'condition_provenance_ambiguous'
  | 'policy_field_unassigned'
  | 'conflicting_value'
  | 'duplicate_value'
  | 'fact_incomplete'
  | 'atom_locator_missing'
  | 'atom_locator_unassigned'
  | 'atom_locator_duplicate'
  | 'unexpected_fields'
  | 'structure_not_recognized'
  | 'source_changed_since_evidence'
  | 'source_url_changed_since_evidence'
  | 'support_binding_mismatch'
  | 'invalid_fact'
  | 'policy_required'

export type OfficialTruthCompositionCitationTarget =
  | { readonly kind: 'fact_field'; readonly fieldPath: string }
  | { readonly kind: 'branch'; readonly branchId: string }
  | {
      readonly kind: 'branch_outcome'
      readonly branchId: string
      readonly field: 'effect' | 'visaMode' | 'eligibility' | 'mandate'
    }
  | { readonly kind: 'atom'; readonly branchId: string; readonly atomLocator: string }
  | { readonly kind: 'otherwise'; readonly branchId: string }
  | {
      readonly kind: 'visa_option_field'
      readonly visaMode: VisaSlot
      readonly field: 'eligibility' | 'mandate'
    }
  | { readonly kind: 'visa_option_branch'; readonly visaMode: VisaSlot; readonly branchId: string }
  | {
      readonly kind: 'visa_option_outcome'
      readonly visaMode: VisaSlot
      readonly branchId: string
      readonly field: 'eligibility' | 'mandate'
    }
  | {
      readonly kind: 'visa_option_atom'
      readonly visaMode: VisaSlot
      readonly branchId: string
      readonly atomLocator: string
    }
  | { readonly kind: 'visa_option_otherwise'; readonly visaMode: VisaSlot; readonly branchId: string }

export type OfficialTruthCompositionAssignment = {
  readonly target: OfficialTruthCompositionCitationTarget
  readonly sourceIds: readonly string[]
  readonly relation: 'single_source' | 'equal_values'
  readonly role:
    | 'complementary_part'
    | 'equal_values'
    | 'general_rule'
    | 'exception'
    | 'applicability_list'
    | 'exemption_set'
}

export type OfficialTruthCompositionPolicy = {
  readonly policyId: string
  readonly policyVersion: number
  readonly current: boolean
  readonly factKind: RegelFaktArt
  readonly requirementType: OfficialRequirementType
  readonly sourceIds: readonly string[]
  readonly sourceFamilyId: string
  readonly schemaFamily: string
  readonly applicabilitySchema: 1 | null
  readonly completeness: 'joint_complete_fact'
  readonly assignments: readonly OfficialTruthCompositionAssignment[]
}

export type OfficialTruthCompositionPreHttpKey = {
  readonly factKind: RegelFaktArt
  readonly requirementType: OfficialRequirementType
  readonly sourceIds: readonly string[]
  readonly sourceFamilyId: string
  readonly schemaFamily: string
}

export type OfficialTruthCompositionFreeze = {
  readonly extractorId: string
  readonly extractorVersion: number
  readonly policyId: string
  readonly policyVersion: number
  readonly extractor: OfficialTruthExtractorDefinition
  readonly policy: OfficialTruthCompositionPolicy
}

export type OfficialTruthCompositionHerkunft = {
  readonly citationKey: string
  readonly target: OfficialTruthCompositionCitationTarget
  readonly extractorId: string
  readonly extractorVersion: number
  readonly sourceId: string
  readonly versionId: string
  readonly policyId: string
  readonly policyVersion: number
}

export type OfficialTruthCompositionProvenanceIdentity = {
  readonly extractorId: string
  readonly extractorVersion: number
  readonly policyId: string
  readonly policyVersion: number
  readonly supportVersionIds: readonly string[]
  readonly citations: readonly { readonly citationKey: string; readonly sourceId: string; readonly versionId: string }[]
}

export type OfficialTruthCompositionBeobachtung = {
  readonly target: OfficialTruthCompositionCitationTarget
  readonly sourceId: string
  readonly canonical: string
}

export type OfficialTruthCompositionRetrieval = {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly contentType: string | null
  readonly sourceContentHash: string
  readonly sourceSnapshot: string
  readonly retrievedAt: string
}

export type OfficialTruthCompositionProofSupport = {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly sourceContentHash: string
}

type Block = {
  readonly ok: false
  readonly reason: OfficialTruthCompositionSperrgrund
  readonly policyId: string | null
  readonly policyVersion: number | null
  readonly extractorId: string | null
  readonly extractorVersion: number | null
}

export type OfficialTruthCompositionRegistryErgebnis =
  | {
      readonly ok: true
      readonly policies: readonly OfficialTruthCompositionPolicy[]
      readonly extractors: readonly OfficialTruthExtractorDefinition[]
    }
  | { readonly ok: false; readonly reason: OfficialTruthCompositionSperrgrund }

export type OfficialTruthCompositionPhaseAErgebnis =
  | { readonly ok: true; readonly freeze: OfficialTruthCompositionFreeze }
  | Block

export type OfficialTruthCompositionPhaseBErgebnis =
  | {
      readonly ok: true
      readonly seal: object
      readonly provenance: readonly OfficialTruthCompositionHerkunft[]
      readonly policyId: string
      readonly policyVersion: number
      readonly extractorId: string
      readonly extractorVersion: number
    }
  | Block

/**
 * Produktionsregister. Absichtlich leer und eingefroren.
 * Eine echte Politik wird hier nicht eingetragen.
 */
export const OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY: readonly OfficialTruthCompositionPolicy[] = Object.freeze([])

const SEAL_BRAND: unique symbol = Symbol('officialTruthCompositionExecution')

class OfficialTruthCompositionExecutionSeal {
  readonly #fact: RegelFakt
  readonly #policyId: string
  readonly #policyVersion: number
  readonly #supportVersionIds: readonly string[]
  readonly #brand = SEAL_BRAND

  constructor(fact: RegelFakt, policyId: string, policyVersion: number, supportVersionIds: readonly string[]) {
    this.#fact = fact
    this.#policyId = policyId
    this.#policyVersion = policyVersion
    this.#supportVersionIds = Object.freeze([...supportVersionIds])
    void this.#brand
  }

  view(): {
    fact: RegelFakt
    policyId: string
    policyVersion: number
    supportVersionIds: readonly string[]
  } {
    return {
      fact: this.#fact,
      policyId: this.#policyId,
      policyVersion: this.#policyVersion,
      supportVersionIds: this.#supportVersionIds,
    }
  }
}

export function isOfficialTruthCompositionSeal(wert: unknown): boolean {
  return wert instanceof OfficialTruthCompositionExecutionSeal
}

export function officialTruthCompositionSealView(wert: unknown): {
  fact: RegelFakt
  policyId: string
  policyVersion: number
  supportVersionIds: readonly string[]
} | null {
  if (!(wert instanceof OfficialTruthCompositionExecutionSeal)) return null
  return wert.view()
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genau(satz: Record<string, unknown>, schluessel: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === schluessel.length && schluessel.every((name) => namen.includes(name))
}

function sortiert(werte: readonly string[]): string[] {
  return [...werte].sort((links, rechts) => (links < rechts ? -1 : links > rechts ? 1 : 0))
}

function gleicheListe(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((wert, index) => wert === rechts[index])
}

function positiveGanzeZahl(wert: unknown): number | null {
  if (typeof wert !== 'number' || !Number.isSafeInteger(wert) || wert < 1) return null
  return wert
}

function leerBlock(reason: OfficialTruthCompositionSperrgrund): Block {
  return { ok: false, reason, policyId: null, policyVersion: null, extractorId: null, extractorVersion: null }
}

function pinBlock(
  reason: OfficialTruthCompositionSperrgrund,
  policyId: string | null,
  policyVersion: number | null,
  extractorId: string | null,
  extractorVersion: number | null,
): Block {
  return { ok: false, reason, policyId, policyVersion, extractorId, extractorVersion }
}

function freezeBlock(reason: OfficialTruthCompositionSperrgrund, freeze: OfficialTruthCompositionFreeze): Block {
  return pinBlock(reason, freeze.policyId, freeze.policyVersion, freeze.extractorId, freeze.extractorVersion)
}

function visaSlot(wert: string): wert is VisaSlot {
  return (VISA_MODI as readonly string[]).includes(wert)
}

function citationKey(target: OfficialTruthCompositionCitationTarget): string {
  switch (target.kind) {
    case 'fact_field':
      return JSON.stringify({ kind: 'fact_field', fieldPath: target.fieldPath })
    case 'branch':
      return JSON.stringify({ kind: 'branch', branchId: target.branchId })
    case 'branch_outcome':
      return JSON.stringify({ kind: 'branch_outcome', branchId: target.branchId, field: target.field })
    case 'atom':
      return JSON.stringify({ kind: 'atom', branchId: target.branchId, atomLocator: target.atomLocator })
    case 'otherwise':
      return JSON.stringify({ kind: 'otherwise', branchId: target.branchId })
    case 'visa_option_field':
      return JSON.stringify({ kind: 'visa_option_field', visaMode: target.visaMode, field: target.field })
    case 'visa_option_branch':
      return JSON.stringify({ kind: 'visa_option_branch', visaMode: target.visaMode, branchId: target.branchId })
    case 'visa_option_outcome':
      return JSON.stringify({
        kind: 'visa_option_outcome',
        visaMode: target.visaMode,
        branchId: target.branchId,
        field: target.field,
      })
    case 'visa_option_atom':
      return JSON.stringify({
        kind: 'visa_option_atom',
        visaMode: target.visaMode,
        branchId: target.branchId,
        atomLocator: target.atomLocator,
      })
    case 'visa_option_otherwise':
      return JSON.stringify({ kind: 'visa_option_otherwise', visaMode: target.visaMode, branchId: target.branchId })
    default: {
      const nie: never = target
      return nie
    }
  }
}

function schrittGueltig(schritt: string): boolean {
  const tie = /^(all|any):tie:(\d+):(\d+)$/.exec(schritt)
  if (tie) return INDEX.test(tie[2] ?? '') && INDEX.test(tie[3] ?? '')
  const einfach = /^(all|any|not):(\d+)$/.exec(schritt)
  if (!einfach) return false
  if (einfach[1] === 'not' && einfach[2] !== '0') return false
  return INDEX.test(einfach[2] ?? '')
}

function locatorForm(
  locator: string,
  ziel: { branchId: string; visaMode: VisaSlot | null },
): boolean {
  let rest = locator
  let option: string | null = null
  if (rest.startsWith('option:')) {
    const slash = rest.indexOf('/')
    if (slash < 0) return false
    option = rest.slice('option:'.length, slash)
    rest = rest.slice(slash + 1)
  }
  if (ziel.visaMode) {
    if (option !== ziel.visaMode) return false
  } else if (option !== null) return false
  if (!rest.startsWith('branch:')) return false
  const bslash = rest.indexOf('/')
  if (bslash < 0) return false
  const branchId = rest.slice('branch:'.length, bslash)
  if (!ZWEIG_ID.test(branchId) || branchId !== ziel.branchId) return false
  rest = rest.slice(bslash + 1)
  if (!rest.endsWith('atom')) return false
  const schritte = rest.slice(0, -'atom'.length)
  if (schritte === '') return true
  if (!schritte.endsWith('/')) return false
  const teile = schritte.slice(0, -1).split('/')
  if (teile.length === 0 || teile.some((teil) => !schrittGueltig(teil))) return false
  return true
}

function zielLesen(wert: unknown): OfficialTruthCompositionCitationTarget | null {
  const satz = datensatz(wert)
  if (!satz || typeof satz.kind !== 'string') return null
  if (satz.kind === 'fact_field' && genau(satz, ['kind', 'fieldPath'])) {
    if (typeof satz.fieldPath !== 'string' || !FELD_PFAD.test(satz.fieldPath)) return null
    return { kind: 'fact_field', fieldPath: satz.fieldPath }
  }
  if (satz.kind === 'branch' && genau(satz, ['kind', 'branchId'])) {
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    return { kind: 'branch', branchId: satz.branchId }
  }
  if (satz.kind === 'branch_outcome' && genau(satz, ['kind', 'branchId', 'field'])) {
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    if (satz.field !== 'effect' && satz.field !== 'visaMode' && satz.field !== 'eligibility' && satz.field !== 'mandate') {
      return null
    }
    return { kind: 'branch_outcome', branchId: satz.branchId, field: satz.field }
  }
  if (satz.kind === 'atom' && genau(satz, ['kind', 'branchId', 'atomLocator'])) {
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    if (typeof satz.atomLocator !== 'string' || !locatorForm(satz.atomLocator, { branchId: satz.branchId, visaMode: null })) {
      return null
    }
    return { kind: 'atom', branchId: satz.branchId, atomLocator: satz.atomLocator }
  }
  if (satz.kind === 'otherwise' && genau(satz, ['kind', 'branchId'])) {
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    return { kind: 'otherwise', branchId: satz.branchId }
  }
  if (satz.kind === 'visa_option_field' && genau(satz, ['kind', 'visaMode', 'field'])) {
    if (typeof satz.visaMode !== 'string' || !visaSlot(satz.visaMode)) return null
    if (satz.field !== 'eligibility' && satz.field !== 'mandate') return null
    return { kind: 'visa_option_field', visaMode: satz.visaMode, field: satz.field }
  }
  if (satz.kind === 'visa_option_branch' && genau(satz, ['kind', 'visaMode', 'branchId'])) {
    if (typeof satz.visaMode !== 'string' || !visaSlot(satz.visaMode)) return null
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    return { kind: 'visa_option_branch', visaMode: satz.visaMode, branchId: satz.branchId }
  }
  if (satz.kind === 'visa_option_outcome' && genau(satz, ['kind', 'visaMode', 'branchId', 'field'])) {
    if (typeof satz.visaMode !== 'string' || !visaSlot(satz.visaMode)) return null
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    if (satz.field !== 'eligibility' && satz.field !== 'mandate') return null
    return { kind: 'visa_option_outcome', visaMode: satz.visaMode, branchId: satz.branchId, field: satz.field }
  }
  if (satz.kind === 'visa_option_atom' && genau(satz, ['kind', 'visaMode', 'branchId', 'atomLocator'])) {
    if (typeof satz.visaMode !== 'string' || !visaSlot(satz.visaMode)) return null
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    if (
      typeof satz.atomLocator !== 'string' ||
      !locatorForm(satz.atomLocator, { branchId: satz.branchId, visaMode: satz.visaMode })
    ) {
      return null
    }
    return { kind: 'visa_option_atom', visaMode: satz.visaMode, branchId: satz.branchId, atomLocator: satz.atomLocator }
  }
  if (satz.kind === 'visa_option_otherwise' && genau(satz, ['kind', 'visaMode', 'branchId'])) {
    if (typeof satz.visaMode !== 'string' || !visaSlot(satz.visaMode)) return null
    if (typeof satz.branchId !== 'string' || !ZWEIG_ID.test(satz.branchId)) return null
    return { kind: 'visa_option_otherwise', visaMode: satz.visaMode, branchId: satz.branchId }
  }
  return null
}

function rollePasst(assignment: OfficialTruthCompositionAssignment): boolean {
  const { relation, role, target } = assignment
  if (relation === 'equal_values') return role === 'equal_values'
  if (role === 'equal_values') return false
  if (relation !== 'single_source') return false
  if (role === 'complementary_part') return true
  if (role === 'general_rule') {
    return target.kind === 'otherwise' || target.kind === 'visa_option_otherwise' || target.kind === 'fact_field'
  }
  if (role === 'exception') {
    return (
      target.kind === 'branch' ||
      target.kind === 'branch_outcome' ||
      target.kind === 'atom' ||
      target.kind === 'visa_option_branch' ||
      target.kind === 'visa_option_outcome' ||
      target.kind === 'visa_option_atom'
    )
  }
  if (role === 'applicability_list') {
    return target.kind === 'fact_field' || target.kind === 'otherwise' || target.kind === 'atom' || target.kind === 'visa_option_atom' || target.kind === 'visa_option_otherwise'
  }
  if (role === 'exemption_set') {
    return target.kind === 'branch' || target.kind === 'atom' || target.kind === 'visa_option_branch' || target.kind === 'visa_option_atom'
  }
  return false
}

function quellenLesen(wert: unknown, erlaubt: ReadonlySet<string>, mindestens: number): string[] | null {
  if (!Array.isArray(wert) || wert.length < mindestens || wert.length > REGEL_SUPPORT_MAX) return null
  const ids: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !QUELLEN_ID.test(eintrag) || ids.includes(eintrag)) return null
    if (!erlaubt.has(eintrag)) return null
    ids.push(eintrag)
  }
  return sortiert(ids)
}

function policyLesen(wert: unknown): OfficialTruthCompositionPolicy | null {
  const satz = datensatz(wert)
  if (!satz || !genau(satz, POLICY_SCHLUESSEL)) return null
  if (typeof satz.policyId !== 'string' || !POLICY_ID.test(satz.policyId)) return null
  const policyVersion = positiveGanzeZahl(satz.policyVersion)
  if (!policyVersion || typeof satz.current !== 'boolean') return null
  if (typeof satz.factKind !== 'string' || !(REGEL_FAKT_ARTEN as readonly string[]).includes(satz.factKind)) return null
  if (typeof satz.requirementType !== 'string' || !(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(satz.requirementType)) {
    return null
  }
  if (typeof satz.sourceFamilyId !== 'string' || !QUELLEN_FAMILIE.test(satz.sourceFamilyId)) return null
  if (typeof satz.schemaFamily !== 'string' || !SCHEMA_FAMILIE.test(satz.schemaFamily)) return null
  if (satz.applicabilitySchema !== 1 && satz.applicabilitySchema !== null) return null
  if (satz.completeness !== 'joint_complete_fact') return null
  if (!Array.isArray(satz.sourceIds) || satz.sourceIds.length < 2 || satz.sourceIds.length > REGEL_SUPPORT_MAX) return null
  const sourceIds: string[] = []
  for (const eintrag of satz.sourceIds) {
    if (typeof eintrag !== 'string' || !QUELLEN_ID.test(eintrag) || sourceIds.includes(eintrag)) return null
    sourceIds.push(eintrag)
  }
  const kanonQuellen = sortiert(sourceIds)
  const erlaubt = new Set(kanonQuellen)
  if (!Array.isArray(satz.assignments) || satz.assignments.length === 0 || satz.assignments.length > 64) return null
  const assignments: OfficialTruthCompositionAssignment[] = []
  const gesehen = new Set<string>()
  for (const eintrag of satz.assignments) {
    const zuweisung = datensatz(eintrag)
    if (!zuweisung || !genau(zuweisung, ZUWEISUNG_SCHLUESSEL)) return null
    const target = zielLesen(zuweisung.target)
    if (!target) return null
    if (zuweisung.relation !== 'single_source' && zuweisung.relation !== 'equal_values') return null
    if (
      zuweisung.role !== 'complementary_part' &&
      zuweisung.role !== 'equal_values' &&
      zuweisung.role !== 'general_rule' &&
      zuweisung.role !== 'exception' &&
      zuweisung.role !== 'applicability_list' &&
      zuweisung.role !== 'exemption_set'
    ) {
      return null
    }
    const minimum = zuweisung.relation === 'single_source' ? 1 : 2
    const maximum = zuweisung.relation === 'single_source' ? 1 : REGEL_SUPPORT_MAX
    const ids = quellenLesen(zuweisung.sourceIds, erlaubt, minimum)
    if (!ids || ids.length > maximum) return null
    const assignment: OfficialTruthCompositionAssignment = {
      target,
      sourceIds: Object.freeze(ids),
      relation: zuweisung.relation,
      role: zuweisung.role,
    }
    if (!rollePasst(assignment)) return null
    const schluessel = citationKey(target)
    if (gesehen.has(schluessel)) return null
    gesehen.add(schluessel)
    assignments.push(Object.freeze(assignment))
  }
  return Object.freeze({
    policyId: satz.policyId,
    policyVersion,
    current: satz.current,
    factKind: satz.factKind as RegelFaktArt,
    requirementType: satz.requirementType as OfficialRequirementType,
    sourceIds: Object.freeze(kanonQuellen),
    sourceFamilyId: satz.sourceFamilyId,
    schemaFamily: satz.schemaFamily,
    applicabilitySchema: satz.applicabilitySchema,
    completeness: 'joint_complete_fact',
    assignments: Object.freeze(assignments),
  })
}

function preHttpKey(policy: OfficialTruthCompositionPolicy): string {
  return [
    policy.factKind,
    policy.requirementType,
    policy.sourceIds.join(','),
    policy.sourceFamilyId,
    policy.schemaFamily,
  ].join('|')
}

function pinPasst(policy: OfficialTruthCompositionPolicy, extractor: OfficialTruthExtractorDefinition): boolean {
  if (policy.factKind !== extractor.factKind) return false
  if (!gleicheListe(policy.sourceIds, extractor.sourceIds)) return false
  if (policy.sourceFamilyId !== extractor.sourceFamilyId) return false
  if (policy.schemaFamily !== extractor.schemaFamily) return false
  if (extractor.requiredFieldPaths.length === 0) return true
  const pfade = new Set(
    policy.assignments.flatMap((eintrag) => (eintrag.target.kind === 'fact_field' ? [eintrag.target.fieldPath] : [])),
  )
  return extractor.requiredFieldPaths.every((pfad) => pfade.has(pfad))
}

export function officialTruthCompositionRegistriesPruefen(
  policies: unknown,
  extractors: unknown,
): OfficialTruthCompositionRegistryErgebnis {
  const extraktoren = officialTruthExtractorDefinitionenPruefen(extractors)
  if (!extraktoren.ok) return { ok: false, reason: extraktoren.reason }
  if (!Array.isArray(policies)) return { ok: false, reason: 'invalid_policy_definition' }
  const geladen: OfficialTruthCompositionPolicy[] = []
  const paare = new Set<string>()
  for (const eintrag of policies) {
    const policy = policyLesen(eintrag)
    if (!policy) return { ok: false, reason: 'invalid_policy_definition' }
    const paar = `${policy.policyId}@${policy.policyVersion}`
    if (paare.has(paar)) return { ok: false, reason: 'duplicate_policy_version' }
    paare.add(paar)
    geladen.push(policy)
  }
  const schluessel = new Set<string>()
  for (const policy of geladen) {
    if (!policy.current) continue
    const key = preHttpKey(policy)
    if (schluessel.has(key)) return { ok: false, reason: 'duplicate_policy_match' }
    schluessel.add(key)
  }
  for (const extractor of extraktoren.registry) {
    if (!extractor.current || extractor.policyId === null || extractor.policyVersion === null) continue
    const policy = geladen.find(
      (eintrag) => eintrag.policyId === extractor.policyId && eintrag.policyVersion === extractor.policyVersion,
    )
    if (!policy || !policy.current || !pinPasst(policy, extractor)) return { ok: false, reason: 'invalid_policy_definition' }
  }
  return { ok: true, policies: Object.freeze(geladen), extractors: extraktoren.registry }
}

export function officialTruthCompositionPreHttpKey(policy: OfficialTruthCompositionPolicy): OfficialTruthCompositionPreHttpKey {
  return {
    factKind: policy.factKind,
    requirementType: policy.requirementType,
    sourceIds: policy.sourceIds,
    sourceFamilyId: policy.sourceFamilyId,
    schemaFamily: policy.schemaFamily,
  }
}

export function officialTruthCompositionPhaseA(input: {
  readonly factKind: RegelFaktArt
  readonly requirementType: OfficialRequirementType
  readonly supports: readonly { readonly sourceId: string; readonly canonicalUrl: string }[]
  readonly extractors: readonly OfficialTruthExtractorDefinition[]
  readonly policies: readonly OfficialTruthCompositionPolicy[]
}): OfficialTruthCompositionPhaseAErgebnis {
  const proofIds = sortiert([...new Set(input.supports.map((eintrag) => eintrag.sourceId))])
  const candidates = input.extractors.filter(
    (extractor) => extractor.current && extractor.factKind === input.factKind && gleicheListe(extractor.sourceIds, proofIds),
  )
  if (candidates.length === 0) return leerBlock('composition_policy_unavailable')
  const urlOk = candidates.filter((extractor) =>
    input.supports.every((support) => officialTruthExtractorUrlErlaubt(support.canonicalUrl, extractor.urlAllowlist)),
  )
  if (urlOk.length === 0) return leerBlock('domain_or_path_not_allowlisted')
  if (urlOk.length > 1) return leerBlock('ambiguous_policy')
  const extractor = urlOk[0]
  if (!extractor || extractor.policyId === null || extractor.policyVersion === null) {
    return leerBlock('composition_policy_unavailable')
  }
  const vorhanden = input.policies.find(
    (policy) => policy.policyId === extractor.policyId && policy.policyVersion === extractor.policyVersion,
  )
  if (!vorhanden) {
    return pinBlock('composition_policy_unavailable', extractor.policyId, extractor.policyVersion, extractor.extractorId, extractor.extractorVersion)
  }
  if (!vorhanden.current) {
    return pinBlock('policy_version_mismatch', extractor.policyId, extractor.policyVersion, extractor.extractorId, extractor.extractorVersion)
  }
  const stimmt =
    vorhanden.factKind === input.factKind &&
    vorhanden.factKind === extractor.factKind &&
    vorhanden.requirementType === input.requirementType &&
    gleicheListe(vorhanden.sourceIds, proofIds) &&
    gleicheListe(vorhanden.sourceIds, extractor.sourceIds) &&
    vorhanden.sourceFamilyId === extractor.sourceFamilyId &&
    vorhanden.schemaFamily === extractor.schemaFamily
  if (!stimmt) {
    return pinBlock('policy_version_mismatch', extractor.policyId, extractor.policyVersion, extractor.extractorId, extractor.extractorVersion)
  }
  return {
    ok: true,
    freeze: {
      extractorId: extractor.extractorId,
      extractorVersion: extractor.extractorVersion,
      policyId: vorhanden.policyId,
      policyVersion: vorhanden.policyVersion,
      extractor,
      policy: vorhanden,
    },
  }
}

type Atomic = Extract<RegulierungsAusdruck, { op: 'atomic' }>

type WalkErfolg = {
  readonly atoms: readonly { readonly locator: string; readonly atom: Atomic }[]
  readonly ties: readonly { readonly locators: readonly string[]; readonly atoms: readonly Atomic[] }[]
}

function istAtom(ausdruck: RegulierungsAusdruck): ausdruck is Atomic {
  return ausdruck.op === 'atomic'
}

function walk(prefix: string, ausdruck: RegulierungsAusdruck): { ok: true; wert: WalkErfolg } | { ok: false; reason: 'atom_locator_duplicate' } {
  if (ausdruck.op === 'atomic') {
    return { ok: true, wert: { atoms: [{ locator: `${prefix}atom`, atom: ausdruck }], ties: [] } }
  }
  if (ausdruck.op === 'not') return walk(`${prefix}not:0/`, ausdruck.operand)
  const gruppen = new Map<string, RegulierungsAusdruck[]>()
  for (const operand of ausdruck.operands) {
    const key = regulierungsAusdruckStrukturSchluessel(operand)
    const liste = gruppen.get(key)
    if (liste) liste.push(operand)
    else gruppen.set(key, [operand])
  }
  const geordnet = [...gruppen.entries()].sort((links, rechts) => (links[0] < rechts[0] ? -1 : links[0] > rechts[0] ? 1 : 0))
  const atoms: { locator: string; atom: Atomic }[] = []
  const ties: { locators: string[]; atoms: Atomic[] }[] = []
  let cursor = 0
  for (const [, glieder] of geordnet) {
    if (glieder.length === 1) {
      const einzig = glieder[0]
      if (!einzig) return { ok: false, reason: 'atom_locator_duplicate' }
      const innen = walk(`${prefix}${ausdruck.op}:${cursor}/`, einzig)
      if (!innen.ok) return innen
      cursor += 1
      atoms.push(...innen.wert.atoms)
      ties.push(...innen.wert.ties.map((gruppe) => ({ locators: [...gruppe.locators], atoms: [...gruppe.atoms] })))
      continue
    }
    const base = cursor
    cursor += glieder.length
    if (!glieder.every(istAtom)) return { ok: false, reason: 'atom_locator_duplicate' }
    const locators = glieder.map((_, index) => `${prefix}${ausdruck.op}:tie:${base}:${index}/atom`)
    ties.push({ locators, atoms: glieder })
  }
  return { ok: true, wert: { atoms, ties } }
}

type ZweigSicht = {
  readonly branchId: string
  readonly visaMode: VisaSlot | null
  readonly otherwise: boolean
  readonly supportVersionIds: readonly string[]
  readonly outcomeFields: readonly ('effect' | 'visaMode' | 'eligibility' | 'mandate')[]
  readonly expression: RegulierungsAusdruck | null
}

function zweigZiel(
  zweig: ZweigSicht,
  art: 'branch' | 'otherwise' | 'outcome',
  field?: 'effect' | 'visaMode' | 'eligibility' | 'mandate',
): OfficialTruthCompositionCitationTarget {
  if (zweig.visaMode) {
    if (art === 'otherwise') return { kind: 'visa_option_otherwise', visaMode: zweig.visaMode, branchId: zweig.branchId }
    if (art === 'branch') return { kind: 'visa_option_branch', visaMode: zweig.visaMode, branchId: zweig.branchId }
    return {
      kind: 'visa_option_outcome',
      visaMode: zweig.visaMode,
      branchId: zweig.branchId,
      field: field === 'mandate' ? 'mandate' : 'eligibility',
    }
  }
  if (art === 'otherwise') return { kind: 'otherwise', branchId: zweig.branchId }
  if (art === 'branch') return { kind: 'branch', branchId: zweig.branchId }
  return {
    kind: 'branch_outcome',
    branchId: zweig.branchId,
    field: field === 'visaMode' ? 'visaMode' : 'effect',
  }
}

function atomZiel(zweig: ZweigSicht, locator: string): OfficialTruthCompositionCitationTarget {
  if (zweig.visaMode) {
    return { kind: 'visa_option_atom', visaMode: zweig.visaMode, branchId: zweig.branchId, atomLocator: locator }
  }
  return { kind: 'atom', branchId: zweig.branchId, atomLocator: locator }
}

function faktSlots(fact: RegelFakt): { zweige: ZweigSicht[]; felder: OfficialTruthCompositionCitationTarget[] } {
  if (fact.kind === 'requirement_effect' && 'applicability' in fact && fact.applicability.kind === 'branches') {
    return {
      zweige: fact.applicability.branches.map((zweig) => ({
        branchId: zweig.id,
        visaMode: null,
        otherwise: zweig.when.kind === 'otherwise',
        supportVersionIds: zweig.supportVersionIds,
        outcomeFields: ['effect', 'visaMode'],
        expression: zweig.when.kind === 'expression' ? zweig.when.expression : null,
      })),
      felder: [],
    }
  }
  if (fact.kind === 'requirement_effect' && 'effect' in fact) {
    return {
      zweige: [],
      felder: [
        { kind: 'fact_field', fieldPath: 'effect' },
        { kind: 'fact_field', fieldPath: 'visaMode' },
      ],
    }
  }
  if (fact.kind === 'visa_options') {
    const zweige: ZweigSicht[] = []
    const felder: OfficialTruthCompositionCitationTarget[] = []
    for (const option of fact.options) {
      if ('applicability' in option && option.applicability.kind === 'branches') {
        for (const zweig of option.applicability.branches) {
          zweige.push({
            branchId: zweig.id,
            visaMode: option.visaMode,
            otherwise: zweig.when.kind === 'otherwise',
            supportVersionIds: zweig.supportVersionIds,
            outcomeFields: ['eligibility', 'mandate'],
            expression: zweig.when.kind === 'expression' ? zweig.when.expression : null,
          })
        }
        continue
      }
      felder.push({ kind: 'visa_option_field', visaMode: option.visaMode, field: 'eligibility' })
      felder.push({ kind: 'visa_option_field', visaMode: option.visaMode, field: 'mandate' })
    }
    return { zweige, felder }
  }
  const felder = Object.keys(fact)
    .filter((name) => name !== 'kind' && FELD_PFAD.test(name))
    .map((fieldPath) => ({ kind: 'fact_field' as const, fieldPath }))
  return { zweige: [], felder }
}

function zuweisungFuer(
  policy: OfficialTruthCompositionPolicy,
  target: OfficialTruthCompositionCitationTarget,
): OfficialTruthCompositionAssignment | null {
  const key = citationKey(target)
  return policy.assignments.find((eintrag) => citationKey(eintrag.target) === key) ?? null
}

function projektion(
  sourceIds: readonly string[],
  versionJeQuelle: ReadonlyMap<string, string>,
): string[] | null {
  const ids: string[] = []
  for (const sourceId of sourceIds) {
    const version = versionJeQuelle.get(sourceId)
    if (!version) return null
    ids.push(version)
  }
  return sortiert(ids)
}

function faktVerbote(wert: unknown, tiefe = 0): boolean {
  if (tiefe > 8 || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => faktVerbote(eintrag, tiefe + 1))
  return Object.entries(wert as Record<string, unknown>).some(
    ([name, eintrag]) => FAKT_VERBOTEN.has(name) || faktVerbote(eintrag, tiefe + 1),
  )
}

function schemaPin(fact: RegelFakt): 1 | null {
  if (fact.kind === 'requirement_effect' && 'schema' in fact && fact.schema === 1) return 1
  if (fact.kind === 'visa_options' && 'schema' in fact && fact.schema === 1) return 1
  return null
}

type ZitatErfolg = { ok: true; provenance: OfficialTruthCompositionHerkunft[] } | { ok: false; reason: OfficialTruthCompositionSperrgrund }

function zitatePruefen(input: {
  freeze: OfficialTruthCompositionFreeze
  fact: RegelFakt
  proofSupports: readonly OfficialTruthCompositionProofSupport[]
  acceptedVersionIds: readonly string[]
  observedTargetValues?: readonly OfficialTruthCompositionBeobachtung[]
}): ZitatErfolg {
  const { freeze, fact } = input
  const quellen = input.proofSupports.map((eintrag) => eintrag.sourceId)
  const distinct = new Set(quellen)
  if (distinct.size < 2) return { ok: false, reason: 'same_source_composition' }
  if (quellen.length !== distinct.size) return { ok: false, reason: 'ambiguous_structure' }
  const versionJeQuelle = new Map<string, string>()
  for (const support of input.proofSupports) {
    if (versionJeQuelle.has(support.sourceId)) return { ok: false, reason: 'ambiguous_structure' }
    versionJeQuelle.set(support.sourceId, support.versionId)
  }
  for (const sourceId of freeze.policy.sourceIds) {
    if (!versionJeQuelle.has(sourceId)) return { ok: false, reason: 'support_mismatch' }
  }
  const akzeptiert = new Set(input.acceptedVersionIds)
  const anspruch = sortiert(input.proofSupports.map((eintrag) => eintrag.versionId))
  if (anspruch.some((id) => !akzeptiert.has(id) || !VERSION_ID.test(id))) return { ok: false, reason: 'support_mismatch' }

  const sicht = faktSlots(fact)
  const erwartet = new Map<string, OfficialTruthCompositionCitationTarget>()
  for (const feld of sicht.felder) erwartet.set(citationKey(feld), feld)

  for (const zweig of sicht.zweige) {
    if (zweig.supportVersionIds.length === 0) return { ok: false, reason: 'support_mismatch' }
    if (zweig.supportVersionIds.some((id) => !anspruch.includes(id) || !akzeptiert.has(id))) {
      return { ok: false, reason: 'support_mismatch' }
    }
    const ziel = zweig.otherwise ? zweigZiel(zweig, 'otherwise') : zweigZiel(zweig, 'branch')
    erwartet.set(citationKey(ziel), ziel)
    if (!zweig.otherwise) {
      for (const field of zweig.outcomeFields) {
        const outcome = zweigZiel(zweig, 'outcome', field)
        erwartet.set(citationKey(outcome), outcome)
      }
    }
    if (!zweig.expression) continue
    const gelaufen = walk(zweig.visaMode ? `option:${zweig.visaMode}/branch:${zweig.branchId}/` : `branch:${zweig.branchId}/`, zweig.expression)
    if (!gelaufen.ok) return gelaufen
    const erforderlich = [
      ...gelaufen.wert.atoms.map((eintrag) => eintrag.locator),
      ...gelaufen.wert.ties.flatMap((gruppe) => gruppe.locators),
    ]
    if (new Set(erforderlich).size !== erforderlich.length) return { ok: false, reason: 'atom_locator_duplicate' }
    const policyLocators = freeze.policy.assignments.flatMap((eintrag) => {
      const target = eintrag.target
      if (target.kind === 'atom' && target.branchId === zweig.branchId && zweig.visaMode === null) return [target.atomLocator]
      if (target.kind === 'visa_option_atom' && target.branchId === zweig.branchId && target.visaMode === zweig.visaMode) {
        return [target.atomLocator]
      }
      return []
    })
    if (erforderlich.some((locator) => !policyLocators.includes(locator))) return { ok: false, reason: 'atom_locator_unassigned' }
    if (policyLocators.some((locator) => !erforderlich.includes(locator))) return { ok: false, reason: 'atom_locator_missing' }
    for (const eintrag of gelaufen.wert.atoms) {
      const target = atomZiel(zweig, eintrag.locator)
      erwartet.set(citationKey(target), target)
      const assignment = zuweisungFuer(freeze.policy, target)
      if (!assignment) return { ok: false, reason: 'atom_locator_unassigned' }
      const projected = projektion(assignment.sourceIds, versionJeQuelle)
      if (!projected) return { ok: false, reason: 'support_mismatch' }
      const cited = eintrag.atom.supportVersionIds ? sortiert([...eintrag.atom.supportVersionIds]) : []
      if (cited.length === 0) {
        if (zweig.supportVersionIds.length >= 2) return { ok: false, reason: 'condition_provenance_ambiguous' }
        if (!gleicheListe(projected, sortiert([...zweig.supportVersionIds]))) return { ok: false, reason: 'support_mismatch' }
      } else if (!gleicheListe(cited, projected) || cited.some((id) => !zweig.supportVersionIds.includes(id))) {
        return { ok: false, reason: 'support_mismatch' }
      }
    }
    for (const gruppe of gelaufen.wert.ties) {
      if (gruppe.atoms.some((atom) => !atom.supportVersionIds || atom.supportVersionIds.length === 0)) {
        return { ok: false, reason: 'condition_provenance_ambiguous' }
      }
      const assignments = gruppe.locators.map((locator) => zuweisungFuer(freeze.policy, atomZiel(zweig, locator)))
      if (assignments.some((eintrag) => !eintrag)) return { ok: false, reason: 'atom_locator_unassigned' }
      const getroffen: OfficialTruthCompositionAssignment[] = []
      for (const atom of gruppe.atoms) {
        const cited = sortiert([...(atom.supportVersionIds ?? [])])
        if (cited.some((id) => !zweig.supportVersionIds.includes(id))) return { ok: false, reason: 'support_mismatch' }
        const treffer = assignments.filter((eintrag): eintrag is OfficialTruthCompositionAssignment => {
          if (!eintrag) return false
          const projected = projektion(eintrag.sourceIds, versionJeQuelle)
          return projected !== null && gleicheListe(projected, cited)
        })
        if (treffer.length === 0) return { ok: false, reason: 'support_mismatch' }
        if (treffer.length > 1) return { ok: false, reason: 'atom_locator_duplicate' }
        const gewählt = treffer[0]
        if (!gewählt) return { ok: false, reason: 'atom_locator_duplicate' }
        getroffen.push(gewählt)
        const locator = gruppe.locators.find((eintrag) => {
          const assignment = zuweisungFuer(freeze.policy, atomZiel(zweig, eintrag))
          return assignment === gewählt
        })
        if (!locator) return { ok: false, reason: 'atom_locator_duplicate' }
        erwartet.set(citationKey(atomZiel(zweig, locator)), atomZiel(zweig, locator))
      }
      if (new Set(getroffen.map((eintrag) => citationKey(eintrag.target))).size !== getroffen.length) {
        return { ok: false, reason: 'atom_locator_duplicate' }
      }
    }
  }

  const vereinigung = sortiert([...new Set(sicht.zweige.flatMap((zweig) => [...zweig.supportVersionIds]))])
  if (sicht.zweige.length > 0 && !gleicheListe(vereinigung, anspruch)) return { ok: false, reason: 'support_mismatch' }

  for (const target of erwartet.values()) {
    if (!zuweisungFuer(freeze.policy, target)) return { ok: false, reason: 'policy_field_unassigned' }
  }
  for (const assignment of freeze.policy.assignments) {
    if (!erwartet.has(citationKey(assignment.target))) return { ok: false, reason: 'policy_field_unassigned' }
    const projected = projektion(assignment.sourceIds, versionJeQuelle)
    if (!projected || projected.some((id) => !akzeptiert.has(id))) return { ok: false, reason: 'support_mismatch' }
  }

  for (const zweig of sicht.zweige) {
    const zweigZielwert = zweig.otherwise ? zweigZiel(zweig, 'otherwise') : zweigZiel(zweig, 'branch')
    const zweigZuweisung = zuweisungFuer(freeze.policy, zweigZielwert)
    if (!zweigZuweisung) return { ok: false, reason: 'policy_field_unassigned' }
    const projected = projektion(zweigZuweisung.sourceIds, versionJeQuelle)
    if (!projected || !gleicheListe(projected, sortiert([...zweig.supportVersionIds]))) return { ok: false, reason: 'support_mismatch' }
    if (!zweig.otherwise) {
      const kinder = new Set<string>()
      for (const field of zweig.outcomeFields) {
        const outcome = zuweisungFuer(freeze.policy, zweigZiel(zweig, 'outcome', field))
        if (!outcome) return { ok: false, reason: 'policy_field_unassigned' }
        if (outcome.sourceIds.some((id) => !zweigZuweisung.sourceIds.includes(id))) return { ok: false, reason: 'support_mismatch' }
        for (const id of outcome.sourceIds) kinder.add(id)
      }
      for (const assignment of freeze.policy.assignments) {
        const target = assignment.target
        const passt =
          (target.kind === 'atom' && target.branchId === zweig.branchId && zweig.visaMode === null) ||
          (target.kind === 'visa_option_atom' && target.branchId === zweig.branchId && target.visaMode === zweig.visaMode)
        if (!passt) continue
        if (assignment.sourceIds.some((id) => !zweigZuweisung.sourceIds.includes(id))) return { ok: false, reason: 'support_mismatch' }
        for (const id of assignment.sourceIds) kinder.add(id)
      }
      if (!gleicheListe(sortiert([...kinder]), sortiert([...zweigZuweisung.sourceIds]))) {
        return { ok: false, reason: 'policy_field_unassigned' }
      }
    }
  }

  if (input.observedTargetValues) {
    const gruppen = new Map<string, OfficialTruthCompositionBeobachtung[]>()
    for (const beobachtung of input.observedTargetValues) {
      const key = citationKey(beobachtung.target)
      const liste = gruppen.get(key)
      if (liste) liste.push(beobachtung)
      else gruppen.set(key, [beobachtung])
    }
    for (const [key, werte] of gruppen) {
      const assignment = freeze.policy.assignments.find((eintrag) => citationKey(eintrag.target) === key)
      if (!assignment) return { ok: false, reason: 'policy_field_unassigned' }
      if (assignment.relation === 'single_source') {
        if (werte.some((eintrag) => !assignment.sourceIds.includes(eintrag.sourceId))) return { ok: false, reason: 'duplicate_value' }
        const kanon = new Set(werte.map((eintrag) => eintrag.canonical))
        if (kanon.size > 1) return { ok: false, reason: 'conflicting_value' }
      } else {
        if (assignment.sourceIds.some((sourceId) => !werte.some((eintrag) => eintrag.sourceId === sourceId))) {
          return { ok: false, reason: 'fact_incomplete' }
        }
        const kanon = new Set(werte.map((eintrag) => eintrag.canonical))
        if (kanon.size > 1) return { ok: false, reason: 'conflicting_value' }
      }
    }
  }

  const provenance: OfficialTruthCompositionHerkunft[] = []
  for (const assignment of freeze.policy.assignments) {
    for (const sourceId of assignment.sourceIds) {
      const versionId = versionJeQuelle.get(sourceId)
      if (!versionId) return { ok: false, reason: 'support_mismatch' }
      provenance.push({
        citationKey: citationKey(assignment.target),
        target: assignment.target,
        extractorId: freeze.extractorId,
        extractorVersion: freeze.extractorVersion,
        sourceId,
        versionId,
        policyId: freeze.policyId,
        policyVersion: freeze.policyVersion,
      })
    }
  }
  provenance.sort((links, rechts) => {
    if (links.citationKey < rechts.citationKey) return -1
    if (links.citationKey > rechts.citationKey) return 1
    if (links.versionId < rechts.versionId) return -1
    if (links.versionId > rechts.versionId) return 1
    return 0
  })
  return { ok: true, provenance }
}

function schritt(
  wert: unknown,
  erlaubt: ReadonlySet<string>,
  ersatz: OfficialTruthCompositionSperrgrund,
  mitFakt: boolean,
): { ok: true; fact?: unknown } | { ok: false; reason: OfficialTruthCompositionSperrgrund } {
  const satz = datensatz(wert)
  if (!satz || typeof satz.ok !== 'boolean') return { ok: false, reason: ersatz }
  if (satz.ok === true) {
    if (!genau(satz, mitFakt ? ['ok', 'fact'] : ['ok'])) return { ok: false, reason: ersatz }
    return mitFakt ? { ok: true, fact: satz.fact } : { ok: true }
  }
  if (!genau(satz, ['ok', 'reason']) || typeof satz.reason !== 'string' || !erlaubt.has(satz.reason)) {
    return { ok: false, reason: ersatz }
  }
  return { ok: false, reason: satz.reason as OfficialTruthCompositionSperrgrund }
}

export function officialTruthCompositionProvenanceIdentity(
  provenance: readonly OfficialTruthCompositionHerkunft[],
  supportVersionIds: readonly string[],
): string {
  const identity: OfficialTruthCompositionProvenanceIdentity = {
    extractorId: provenance[0]?.extractorId ?? '',
    extractorVersion: provenance[0]?.extractorVersion ?? 0,
    policyId: provenance[0]?.policyId ?? '',
    policyVersion: provenance[0]?.policyVersion ?? 0,
    supportVersionIds: sortiert([...supportVersionIds]),
    citations: provenance.map((eintrag) => ({
      citationKey: eintrag.citationKey,
      sourceId: eintrag.sourceId,
      versionId: eintrag.versionId,
    })),
  }
  return JSON.stringify(identity)
}

export function officialTruthCompositionPhaseB(input: {
  readonly freeze: OfficialTruthCompositionFreeze
  readonly retrievals: readonly OfficialTruthCompositionRetrieval[]
  readonly proofSupports: readonly OfficialTruthCompositionProofSupport[]
  readonly acceptedVersionIds: readonly string[]
  readonly requirementType: OfficialRequirementType
  readonly scopeKey: string
  readonly scope: RegelScope
  readonly registry: QuellenRegistry
  readonly observedTargetValues?: readonly OfficialTruthCompositionBeobachtung[]
}): OfficialTruthCompositionPhaseBErgebnis {
  const { freeze } = input
  const medien = input.retrievals.map((eintrag) => officialTruthExtractorMedienTyp(eintrag.contentType))
  if (medien.some((typ) => typ === null || !freeze.extractor.contentTypes.includes(typ))) {
    return freezeBlock('content_type_not_allowlisted', freeze)
  }
  if (input.retrievals.length !== input.proofSupports.length) return freezeBlock('support_binding_mismatch', freeze)
  for (const proof of input.proofSupports) {
    const abruf = input.retrievals.find((eintrag) => eintrag.versionId === proof.versionId)
    if (!abruf) return freezeBlock('support_binding_mismatch', freeze)
    if (abruf.sourceId !== proof.sourceId) return freezeBlock('support_binding_mismatch', freeze)
    if (abruf.canonicalUrl !== proof.canonicalUrl) return freezeBlock('source_url_changed_since_evidence', freeze)
    if (abruf.sourceContentHash !== proof.sourceContentHash) return freezeBlock('source_changed_since_evidence', freeze)
  }
  const quellen = new Set(input.proofSupports.map((eintrag) => eintrag.sourceId))
  if (quellen.size < 2) return freezeBlock('same_source_composition', freeze)
  if (input.proofSupports.length !== quellen.size) return freezeBlock('ambiguous_structure', freeze)
  const kontext: OfficialTruthExtractorKontext = {
    factKind: freeze.extractor.factKind,
    requirementType: input.requirementType,
    scopeKey: input.scopeKey,
    scope: input.scope,
    evidenceQuality: 'composed_from_multiple_primary_sources',
    schemaFamily: freeze.extractor.schemaFamily,
    supports: input.retrievals.map((eintrag) => ({
      versionId: eintrag.versionId,
      sourceId: eintrag.sourceId,
      canonicalUrl: eintrag.canonicalUrl,
      retrievedAt: eintrag.retrievedAt,
      contentType: officialTruthExtractorMedienTyp(eintrag.contentType) ?? '',
      sourceSnapshot: eintrag.sourceSnapshot,
      sourceContentHash: eintrag.sourceContentHash,
    })),
    policy: null,
    registry: input.registry,
  }
  let erkannt: unknown
  try {
    erkannt = freeze.extractor.match(kontext)
  } catch {
    return freezeBlock('structure_not_recognized', freeze)
  }
  const struktur = schritt(erkannt, MATCH_GRUENDE, 'structure_not_recognized', false)
  if (!struktur.ok) return freezeBlock(struktur.reason, freeze)
  let roh: unknown
  try {
    roh = freeze.extractor.extract(kontext)
  } catch {
    return freezeBlock('fact_incomplete', freeze)
  }
  const extrakt = schritt(roh, EXTRAKT_GRUENDE, 'fact_incomplete', true)
  if (!extrakt.ok) return freezeBlock(extrakt.reason, freeze)
  if (faktVerbote(extrakt.fact)) return freezeBlock('unexpected_fields', freeze)
  const fakt = regelFaktKanonischLesen(freeze.extractor.factKind, input.requirementType, extrakt.fact, input.registry)
  if (!fakt.ok) return freezeBlock(fakt.reason === 'invalid_fact' ? 'invalid_fact' : 'fact_incomplete', freeze)
  if (fakt.fact.kind !== freeze.extractor.factKind) return freezeBlock('fact_kind_mismatch', freeze)
  if (schemaPin(fakt.fact) !== freeze.policy.applicabilitySchema) return freezeBlock('schema_mismatch', freeze)
  const zitate = zitatePruefen({
    freeze,
    fact: fakt.fact,
    proofSupports: input.proofSupports,
    acceptedVersionIds: input.acceptedVersionIds,
    observedTargetValues: input.observedTargetValues,
  })
  if (!zitate.ok) return freezeBlock(zitate.reason, freeze)
  const supportVersionIds = sortiert(input.proofSupports.map((eintrag) => eintrag.versionId))
  const seal = new OfficialTruthCompositionExecutionSeal(fakt.fact, freeze.policyId, freeze.policyVersion, supportVersionIds)
  return {
    ok: true,
    seal,
    provenance: Object.freeze(zitate.provenance.map((eintrag) => Object.freeze(eintrag))),
    policyId: freeze.policyId,
    policyVersion: freeze.policyVersion,
    extractorId: freeze.extractorId,
    extractorVersion: freeze.extractorVersion,
  }
}

export function officialTruthCompositionZitatePruefen(input: {
  readonly freeze: OfficialTruthCompositionFreeze
  readonly fact: RegelFakt
  readonly proofSupports: readonly OfficialTruthCompositionProofSupport[]
  readonly acceptedVersionIds: readonly string[]
  readonly observedTargetValues?: readonly OfficialTruthCompositionBeobachtung[]
}): ZitatErfolg {
  return zitatePruefen(input)
}
