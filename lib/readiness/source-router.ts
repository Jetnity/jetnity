// lib/readiness/source-router.ts
//
// Reine Quellenplanung. Kein Netz, kein Official-Resultat, kein Ranking
// eines „besten“ Passes. Fehlende Abdeckung bleibt unbekannt und wird
// nie zu `not_required`. Die Engine bleibt die einzige Auswertung.

import { landescodeLesen } from '@/lib/readiness/domain'
import { evidenceKombinationen, type EvidenceAtom, type EvidenceRahmenFehler } from '@/lib/readiness/evidence'
import type { QuellenRegistry, RegistrierteQuelle } from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES, type OfficialRequirementType, type TravellerDocumentType } from '@/types/trips'

export type QuellenAbdeckung = {
  destinationCountryCodes: readonly string[]
  transitCountryCodes: readonly string[]
  requirementTypes: readonly OfficialRequirementType[]
  citizenshipCountryCodes: readonly string[]
  residenceCountryCodes: readonly string[]
  documents: readonly { documentType: TravellerDocumentType; issuingCountryCode: string }[]
}

export type QuellenDeskriptor = {
  source: RegistrierteQuelle
  coverage: QuellenAbdeckung
}

export type QuellenZelle = {
  atom: EvidenceAtom
  status: 'eligible_sources' | 'no_eligible_source'
  sourceIds: readonly string[]
}

export type QuellenRoutenPlan = {
  /** Diese Schicht wertet nicht. Das Ergebnis bleibt unbekannt. */
  officialResult: 'unknown'
  evaluation: 'not_performed'
  status: 'eligible_sources' | 'no_eligible_source'
  coverage: 'complete' | 'partial' | 'none'
  reason: 'ok' | 'no_source_coverage' | EvidenceRahmenFehler | 'invalid_descriptor'
  sources: readonly QuellenDeskriptor[]
  cells: readonly QuellenZelle[]
}

function abdeckungGueltig(coverage: QuellenAbdeckung): boolean {
  const laender = [
    ...coverage.destinationCountryCodes,
    ...coverage.transitCountryCodes,
    ...coverage.citizenshipCountryCodes,
    ...coverage.residenceCountryCodes,
    ...coverage.documents.map((option) => option.issuingCountryCode),
  ]
  if (laender.some((code) => landescodeLesen(code) !== code)) return false
  if (coverage.requirementTypes.some((typ) => !(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(typ))) return false
  if (coverage.documents.some((option) => !(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(option.documentType))) {
    return false
  }
  return true
}

function gleicheQuelle(links: RegistrierteQuelle, rechts: RegistrierteQuelle): boolean {
  return (
    links.sourceId === rechts.sourceId &&
    links.sourceClass === rechts.sourceClass &&
    links.authorityName === rechts.authorityName &&
    links.publisherName === rechts.publisherName &&
    links.domains.length === rechts.domains.length &&
    links.domains.every((domain, index) => domain === rechts.domains[index])
  )
}

function registriert(registry: QuellenRegistry, quelle: RegistrierteQuelle): boolean {
  return registry.sources.some((eintrag) => gleicheQuelle(eintrag, quelle))
}

function enthaelt(liste: readonly string[], wert: string): boolean {
  return liste.includes(wert)
}

function dokumentDeckt(coverage: QuellenAbdeckung, atom: EvidenceAtom): boolean {
  const document = atom.document
  if (document.mode !== 'required') return coverage.documents.length === 0
  const documentType = document.documentType
  const issuingCountryCode = document.issuingCountryCode
  return coverage.documents.some(
    (option) => option.documentType === documentType && option.issuingCountryCode === issuingCountryCode,
  )
}

function zellePasst(coverage: QuellenAbdeckung, atom: EvidenceAtom): boolean {
  if (!enthaelt(coverage.requirementTypes, atom.requirementType)) return false
  if (atom.destinationCountryCode && !enthaelt(coverage.destinationCountryCodes, atom.destinationCountryCode)) return false
  if (atom.transitCountryCode && !enthaelt(coverage.transitCountryCodes, atom.transitCountryCode)) return false
  if (atom.citizenship.mode === 'not_applicable') {
    if (coverage.citizenshipCountryCodes.length > 0) return false
  } else if (!enthaelt(coverage.citizenshipCountryCodes, atom.citizenship.countryCode)) {
    return false
  }
  if (atom.residence.mode === 'not_applicable') {
    if (coverage.residenceCountryCodes.length > 0) return false
  } else if (!enthaelt(coverage.residenceCountryCodes, atom.residence.countryCode)) {
    return false
  }
  return dokumentDeckt(coverage, atom)
}

function leerplan(
  reason: QuellenRoutenPlan['reason'],
): QuellenRoutenPlan {
  return {
    officialResult: 'unknown',
    evaluation: 'not_performed',
    status: 'no_eligible_source',
    coverage: 'none',
    reason,
    sources: [],
    cells: [],
  }
}

/**
 * Plant, welche registrierten Quellen eine wiederverwendbare Regulierungszelle
 * prüfen dürfen. Sortierung ist Stabilität, keine Präferenz.
 */
export function quellenRouten(
  registry: QuellenRegistry,
  deskriptoren: readonly QuellenDeskriptor[],
  eingabe: unknown,
): QuellenRoutenPlan {
  for (const deskriptor of deskriptoren) {
    if (!registriert(registry, deskriptor.source) || !abdeckungGueltig(deskriptor.coverage)) {
      return leerplan('invalid_descriptor')
    }
  }
  const kombinationen = evidenceKombinationen(eingabe)
  if (!kombinationen.ok) return leerplan(kombinationen.reason)

  const geordnet = [...deskriptoren].sort((links, rechts) =>
    links.source.sourceId < rechts.source.sourceId ? -1 : links.source.sourceId > rechts.source.sourceId ? 1 : 0,
  )

  const cells: QuellenZelle[] = kombinationen.atoms.map((atom) => {
    const sourceIds = geordnet.filter((deskriptor) => zellePasst(deskriptor.coverage, atom)).map((deskriptor) => deskriptor.source.sourceId)
    return {
      atom,
      status: sourceIds.length > 0 ? 'eligible_sources' : 'no_eligible_source',
      sourceIds,
    }
  })

  const benutzt = new Set(cells.flatMap((zelle) => zelle.sourceIds))
  const sources = geordnet.filter((deskriptor) => benutzt.has(deskriptor.source.sourceId))
  const gedeckt = cells.filter((zelle) => zelle.status === 'eligible_sources').length
  const coverage = gedeckt === 0 ? 'none' : gedeckt === cells.length ? 'complete' : 'partial'
  return {
    officialResult: 'unknown',
    evaluation: 'not_performed',
    status: gedeckt === 0 ? 'no_eligible_source' : 'eligible_sources',
    coverage,
    reason: gedeckt === 0 ? 'no_source_coverage' : 'ok',
    sources,
    cells,
  }
}
