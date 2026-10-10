// lib/readiness/official-truth-accepted-evidence.ts
//
// Nimmt einen amtlichen Evidence-Kandidaten an, den diese Datei selbst
// aus dem ursprünglichen Abrufumschlag neu baut. Ein mitgeliefertes
// Evidence-Objekt ist kein Argument. Die Annahme bleibt die bestehende
// Funktion. Diese Datei speichert nichts und zieht keine Regel heraus.

import { contentIdentityMatches } from '@/lib/readiness/official-truth-content-identity'
import {
  evidenceKandidatAkzeptieren,
  type EvidenceAnnahmeErgebnis,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import {
  officialTruthKandidatEvidenceAusAbruf,
  type OfficialTruthKandidatEvidenceSperrgrund,
} from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const EVIDENCE_FELDER = [
  'identitySchema', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion',
  'identityProfileId', 'identityProfileVersion', 'contentType',
  'versionId',
  'previousVersionId',
  'lifecycle',
  'validationState',
  'sourceId',
  'sourceClass',
  'authorityName',
  'publisherName',
  'canonicalUrl',
  'retrievedAt',
  'sourceContentHash',
  'validFrom',
  'validUntil',
  'scope',
  'lookupKey',
  'extractionNote',
] as const
const EVIDENCE_V2_FELDER = [...EVIDENCE_FELDER, 'sourceFingerprintProtocol'] as const

const SCOPE_FELDER = [
  'destinationCountryCode',
  'transitCountryCode',
  'citizenship',
  'credentialOption',
  'residence',
  'requirementType',
  'validity',
  'sourceId',
] as const

type AnnahmeSperre = Exclude<EvidenceAnnahmeErgebnis, { ok: true }>['reason']

export type OfficialTruthAkzeptierteEvidenceSperrgrund = OfficialTruthKandidatEvidenceSperrgrund | AnnahmeSperre

/**
 * Angenommene Evidence-Provenienz. Kein Regelresultat und keine Official Truth
 * über eine Einreisewirkung. `accepted_evidence` ist nur die Hülle.
 */
export type OfficialTruthAkzeptierteEvidenceErgebnis =
  | { readonly status: 'accepted_evidence'; readonly evidence: EvidenceVersion }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthAkzeptierteEvidenceSperrgrund }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function sperre(reason: OfficialTruthAkzeptierteEvidenceSperrgrund): OfficialTruthAkzeptierteEvidenceErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function genaueSchluessel(satz: object, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function genaueEvidenceSchluessel(evidence: EvidenceVersion): boolean {
  if (!Object.hasOwn(evidence, 'sourceFingerprintProtocol')) return genaueSchluessel(evidence, EVIDENCE_FELDER)
  return evidence.sourceFingerprintProtocol === 2 && genaueSchluessel(evidence, EVIDENCE_V2_FELDER)
}

function registryAusUmschlag(umschlag: unknown): QuellenRegistry | null {
  const satz = datensatz(umschlag)
  if (!satz) return null
  const registry = datensatz(satz.registry)
  if (!registry || !Array.isArray(registry.sources) || !Array.isArray(registry.blockedDomains)) return null
  return registry as QuellenRegistry
}

function pendingOfficial(evidence: EvidenceVersion): boolean {
  return (
    evidence.lifecycle === 'candidate' &&
    evidence.validationState === 'pending' &&
    evidence.sourceClass === 'official_authority' &&
    evidence.previousVersionId === null &&
    genaueEvidenceSchluessel(evidence) &&
    genaueSchluessel(evidence.scope, SCOPE_FELDER)
  )
}

/**
 * Dieselbe Quelle, dieselbe Zelle, dieselbe URL, dieselbe Abrufzeit und
 * derselbe Hash. Nur Lebenszyklus und Prüfungsstand wechseln.
 */
function annahmePasst(akzeptiert: EvidenceVersion, kandidat: EvidenceVersion): boolean {
  return (
    pendingOfficial(kandidat) && contentIdentityMatches(akzeptiert, kandidat) &&
    akzeptiert.identitySchema === 2 && akzeptiert.contentType === kandidat.contentType &&
    akzeptiert.lifecycle === 'accepted' &&
    akzeptiert.validationState === 'valid' &&
    akzeptiert.sourceClass === 'official_authority' &&
    genaueEvidenceSchluessel(akzeptiert) &&
    genaueSchluessel(akzeptiert.scope, SCOPE_FELDER) &&
    akzeptiert.sourceId === kandidat.sourceId &&
    akzeptiert.authorityName === kandidat.authorityName &&
    akzeptiert.publisherName === kandidat.publisherName &&
    akzeptiert.canonicalUrl === kandidat.canonicalUrl &&
    akzeptiert.retrievedAt === kandidat.retrievedAt &&
    akzeptiert.sourceFingerprintProtocol === kandidat.sourceFingerprintProtocol &&
    akzeptiert.sourceContentHash === kandidat.sourceContentHash &&
    akzeptiert.versionId === kandidat.versionId &&
    akzeptiert.previousVersionId === kandidat.previousVersionId &&
    akzeptiert.validFrom === kandidat.validFrom &&
    akzeptiert.validUntil === kandidat.validUntil &&
    akzeptiert.extractionNote === kandidat.extractionNote &&
    akzeptiert.lookupKey === kandidat.lookupKey &&
    JSON.stringify(akzeptiert.scope) === JSON.stringify(kandidat.scope)
  )
}

/**
 * Baut den Kandidaten erneut aus Umschlag, Uhr und Extraktion und nimmt
 * nur dieses Objekt an. Die Registry kommt aus demselben Umschlag, nachdem
 * der Kandidat entstanden ist. Ein vom Aufrufer gebautes Evidence-Objekt
 * hat hier keinen Parameter.
 */
export function officialTruthAkzeptierteEvidenceAusAbruf(
  umschlag: unknown,
  uhr: unknown,
  extraktion: unknown,
): OfficialTruthAkzeptierteEvidenceErgebnis {
  const kandidat = officialTruthKandidatEvidenceAusAbruf(umschlag, uhr, extraktion)
  if (kandidat.status !== 'candidate_evidence') return sperre(kandidat.reason)
  if (!pendingOfficial(kandidat.evidence)) return sperre('invalid_context')

  const registry = registryAusUmschlag(umschlag)
  if (!registry) return sperre('invalid_source_plan')

  const angenommen = evidenceKandidatAkzeptieren(kandidat.evidence, registry)
  if (!angenommen.ok) return sperre(angenommen.reason)
  if (!annahmePasst(angenommen.evidence, kandidat.evidence)) return sperre('invalid_context')
  return Object.freeze({ status: 'accepted_evidence', evidence: angenommen.evidence })
}
