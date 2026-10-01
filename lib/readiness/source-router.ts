// lib/readiness/source-router.ts
//
// Reine Quellenplanung. Kein Netz, kein Official-Resultat, kein Ranking
// eines „besten“ Passes. Staatsbürgerschaft, Wohnsitz und Dokument haben
// die Modi independent, exact und not_applicable. Eine leere Liste ist
// kein Wildcard. Fehlende Abdeckung bleibt unbekannt und wird nie zu
// `not_required`. Die Engine bleibt die einzige Auswertung.

import { landescodeLesen } from '@/lib/readiness/domain'
import { evidenceKombinationen, type EvidenceAtom, type EvidenceRahmenFehler } from '@/lib/readiness/evidence'
import type { QuellenRegistry, RegistrierteQuelle } from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES, type OfficialRequirementType, type TravellerDocumentType } from '@/types/trips'

export type LaenderAbdeckung =
  | { mode: 'independent' }
  | { mode: 'not_applicable' }
  | { mode: 'exact'; countryCodes: readonly string[] }

export type DokumentAbdeckung =
  | { mode: 'independent' }
  | { mode: 'not_applicable' }
  | { mode: 'exact'; options: readonly { documentType: TravellerDocumentType; issuingCountryCode: string }[] }

export type QuellenAbdeckung = {
  destinationCountryCodes: readonly string[]
  transitCountryCodes: readonly string[]
  requirementTypes: readonly OfficialRequirementType[]
  citizenship: LaenderAbdeckung
  residence: LaenderAbdeckung
  documents: DokumentAbdeckung
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

function laenderlisteGueltig(codes: readonly string[], leerErlaubt: boolean): boolean {
  if (!Array.isArray(codes) || (codes.length === 0 && !leerErlaubt)) return false
  const gesehen = new Set<string>()
  for (const code of codes) {
    if (landescodeLesen(code) !== code || gesehen.has(code)) return false
    gesehen.add(code)
  }
  return true
}

function laenderAbdeckungGueltig(abdeckung: LaenderAbdeckung): boolean {
  if (abdeckung.mode === 'independent' || abdeckung.mode === 'not_applicable') return true
  if (abdeckung.mode !== 'exact' || !Array.isArray(abdeckung.countryCodes)) return false
  return laenderlisteGueltig(abdeckung.countryCodes, false)
}

function dokumentAbdeckungGueltig(abdeckung: DokumentAbdeckung): boolean {
  if (abdeckung.mode === 'independent' || abdeckung.mode === 'not_applicable') return true
  if (abdeckung.mode !== 'exact' || !Array.isArray(abdeckung.options) || abdeckung.options.length === 0) return false
  const gesehen = new Set<string>()
  for (const option of abdeckung.options) {
    if (!(TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes(option.documentType)) return false
    if (landescodeLesen(option.issuingCountryCode) !== option.issuingCountryCode) return false
    const schluessel = `${option.documentType}:${option.issuingCountryCode}`
    if (gesehen.has(schluessel)) return false
    gesehen.add(schluessel)
  }
  return true
}

function abdeckungGueltig(coverage: QuellenAbdeckung): boolean {
  if (coverage.destinationCountryCodes.length === 0 && coverage.transitCountryCodes.length === 0) return false
  if (!laenderlisteGueltig(coverage.destinationCountryCodes, true)) return false
  if (!laenderlisteGueltig(coverage.transitCountryCodes, true)) return false
  if (coverage.requirementTypes.length === 0) return false
  const anforderungen = new Set<string>()
  for (const typ of coverage.requirementTypes) {
    if (!(OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(typ) || anforderungen.has(typ)) return false
    anforderungen.add(typ)
  }
  return laenderAbdeckungGueltig(coverage.citizenship) && laenderAbdeckungGueltig(coverage.residence) && dokumentAbdeckungGueltig(coverage.documents)
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

function staatsbuergerschaftDeckt(abdeckung: LaenderAbdeckung, atom: EvidenceAtom): boolean {
  if (abdeckung.mode === 'independent') return true
  if (abdeckung.mode === 'not_applicable') return atom.citizenship.mode === 'not_applicable'
  if (atom.credentialOption.mode === 'option') {
    const related = atom.credentialOption.relatedCitizenshipCountryCode
    return related != null && abdeckung.countryCodes.includes(related)
  }
  if (atom.citizenship.mode !== 'required') return false
  return atom.citizenship.countryCodes.every((code) => abdeckung.countryCodes.includes(code))
}

function wohnsitzDeckt(abdeckung: LaenderAbdeckung, atom: EvidenceAtom): boolean {
  if (abdeckung.mode === 'independent') return true
  if (abdeckung.mode === 'not_applicable') return atom.residence.mode === 'not_applicable'
  if (atom.residence.mode !== 'required') return false
  return abdeckung.countryCodes.includes(atom.residence.countryCode)
}

function dokumentDeckt(abdeckung: DokumentAbdeckung, atom: EvidenceAtom): boolean {
  if (abdeckung.mode === 'independent') return true
  if (abdeckung.mode === 'not_applicable') return atom.credentialOption.mode === 'not_applicable'
  if (atom.credentialOption.mode !== 'option') return false
  const documentType = atom.credentialOption.documentType
  const issuingCountryCode = atom.credentialOption.issuingCountryCode
  return abdeckung.options.some(
    (option) => option.documentType === documentType && option.issuingCountryCode === issuingCountryCode,
  )
}

function zellePasst(coverage: QuellenAbdeckung, atom: EvidenceAtom): boolean {
  if (!enthaelt(coverage.requirementTypes, atom.requirementType)) return false
  if (atom.destinationCountryCode && !enthaelt(coverage.destinationCountryCodes, atom.destinationCountryCode)) return false
  if (atom.transitCountryCode && !enthaelt(coverage.transitCountryCodes, atom.transitCountryCode)) return false
  return (
    staatsbuergerschaftDeckt(coverage.citizenship, atom) &&
    wohnsitzDeckt(coverage.residence, atom) &&
    dokumentDeckt(coverage.documents, atom)
  )
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
