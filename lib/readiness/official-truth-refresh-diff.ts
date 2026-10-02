// lib/readiness/official-truth-refresh-diff.ts
//
// Vergleicht eine erneut bewiesene angenommene Evidence mit einem neuen
// amtlichen Abruf derselben Quelle, derselben kanonischen Seite, derselben
// Registry-Identität und derselben regulatorischen Zelle. Ein mitgeliefertes
// Evidence-Objekt, eine Versionskennung oder ein Hash ist kein Argument.
// Der Inhaltsvergleich bleibt die bestehende Funktion. Diese Datei speichert
// nichts, ruft nichts ab und zieht keine Regel heraus.

import { evidenceVersionenVergleichen, type EvidenceVersion } from '@/lib/readiness/evidence'
import {
  officialTruthAkzeptierteEvidenceAusAbruf,
  type OfficialTruthAkzeptierteEvidenceSperrgrund,
} from '@/lib/readiness/official-truth-accepted-evidence'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbgerufenBeleg,
} from '@/lib/readiness/official-truth-retrieved-material'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'

export type OfficialTruthAuffrischungSperrgrund =
  | OfficialTruthAkzeptierteEvidenceSperrgrund
  | 'different_official_source'
  | 'different_rule_scope'
  | 'different_official_page'
  | 'different_source_registry'

/**
 * Nur die Entscheidung, ob der normalisierte Quellentext gleich geblieben ist.
 * `ruleChange` bleibt `not_asserted`. Das ist keine bestätigte Regel und
 * keine Einreisewirkung. `unchanged_source_content` ist nur die Hülle.
 */
export type OfficialTruthAuffrischungErgebnis =
  | {
      readonly status: 'unchanged_source_content' | 'changed_source_content'
      readonly baselineVersionId: string
      readonly baselineRequestKey: string
      readonly refreshedRequestKey: string
      readonly ruleScopeKey: string
      readonly sourceId: string
      readonly contentChanged: boolean
      readonly laterAnalysisShortCircuit: boolean
      readonly ruleChange: 'not_asserted'
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthAuffrischungSperrgrund }

const REGISTRY_SCHLUESSEL = ['blockedDomains', 'sources'] as const
const QUELLE_SCHLUESSEL = ['authorityName', 'domains', 'publisherName', 'sourceClass', 'sourceId'] as const

function sperre(reason: OfficialTruthAuffrischungSperrgrund): OfficialTruthAuffrischungErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function texte(werte: unknown): readonly string[] | null {
  if (!Array.isArray(werte) || werte.some((wert) => typeof wert !== 'string')) return null
  return werte
}

/**
 * Semantische Identität der bereits geprüften Registry.
 * Verglichen werden Quellenkennung, Klasse, Herausgeber, Behörde,
 * die vom bestehenden Registry-Bauer gespeicherte Domain-Reihenfolge
 * und `blockedDomains`. Gleiche Werte in verschiedenen Objekten sind
 * gleich. Eine Referenzgleichheit wird nicht benutzt. Ein zusätzliches
 * Feld oder eine unlesbare Form ist keine gleiche Identität.
 * Das ist kein zweites Registry-Regelwerk und schreibt die Registry nicht um.
 */
function registryIdentitaet(umschlag: unknown): string | null {
  const registry = datensatz(datensatz(umschlag)?.registry)
  if (!registry || !genaueSchluessel(registry, REGISTRY_SCHLUESSEL)) return null
  const blockedDomains = texte(registry.blockedDomains)
  if (!blockedDomains || !Array.isArray(registry.sources)) return null

  const sources: {
    sourceId: string
    sourceClass: 'official_authority' | 'licensed_evidence_provider'
    publisherName: string
    authorityName: string | null
    domains: readonly string[]
  }[] = []
  for (const roh of registry.sources) {
    const eintrag = datensatz(roh)
    if (!eintrag || !genaueSchluessel(eintrag, QUELLE_SCHLUESSEL)) return null
    const domains = texte(eintrag.domains)
    const sourceClass = eintrag.sourceClass
    if (
      typeof eintrag.sourceId !== 'string' ||
      (sourceClass !== 'official_authority' && sourceClass !== 'licensed_evidence_provider') ||
      typeof eintrag.publisherName !== 'string' ||
      (eintrag.authorityName !== null && typeof eintrag.authorityName !== 'string') ||
      !domains
    ) {
      return null
    }
    sources.push({
      sourceId: eintrag.sourceId,
      sourceClass,
      publisherName: eintrag.publisherName,
      authorityName: eintrag.authorityName,
      domains,
    })
  }
  return JSON.stringify({ sources, blockedDomains })
}

/**
 * Der Beleg darf die angenommene Evidence nur benennen, wenn Quelle, Zelle,
 * kanonische Seite und normalisierter Quellentext dieselben sind. Der Hash
 * wird nicht selbst verglichen. Das tut nur `evidenceVersionenVergleichen`.
 */
function belegBindet(evidence: EvidenceVersion, beleg: OfficialTruthAbgerufenBeleg): boolean {
  if (evidence.sourceClass !== 'official_authority' || evidence.sourceId !== beleg.sourceId) return false
  if (evidence.canonicalUrl !== beleg.canonicalUrl) return false
  const zelle = regelScopeAusEvidenceScope(evidence.scope)
  if (!zelle.ok || zelle.key !== beleg.ruleScopeKey) return false
  const vergleich = evidenceVersionenVergleichen(evidence, { sourceContentHash: beleg.sourceContentHash })
  return vergleich.ok && vergleich.contentChanged === false && vergleich.ruleChange === 'not_asserted' && vergleich.laterAnalysisShortCircuit === true
}

/**
 * Beweist die bestehende Annahme aus dem ursprünglichen Abrufumschlag,
 * der injizierten Uhr und der Extraktion neu. Der neue Abruf läuft
 * unabhängig durch dieselbe Belegprüfung. Der Quellentext wird nur
 * verglichen, wenn Quelle, Regel-Scope, die bereits normalisierte
 * kanonische Seite und die semantische Registry-Identität übereinstimmen.
 * Ein vom Aufrufer gebautes Evidence-Objekt hat hier keinen Parameter.
 */
export function officialTruthAkzeptierteEvidenceAuffrischungVergleichen(
  basisUmschlag: unknown,
  basisUhr: unknown,
  extraktion: unknown,
  neuUmschlag: unknown,
  neuUhr: unknown,
): OfficialTruthAuffrischungErgebnis {
  const angenommen = officialTruthAkzeptierteEvidenceAusAbruf(basisUmschlag, basisUhr, extraktion)
  if (angenommen.status !== 'accepted_evidence') return sperre(angenommen.reason)

  const basisBeleg = officialTruthAbgerufenMaterialPruefen(basisUmschlag, basisUhr)
  if (basisBeleg.status !== 'retrieved_material') return sperre(basisBeleg.reason)
  if (!belegBindet(angenommen.evidence, basisBeleg)) return sperre('invalid_context')

  const neuBeleg = officialTruthAbgerufenMaterialPruefen(neuUmschlag, neuUhr)
  if (neuBeleg.status !== 'retrieved_material') return sperre(neuBeleg.reason)
  if (neuBeleg.sourceId !== angenommen.evidence.sourceId) return sperre('different_official_source')
  if (neuBeleg.ruleScopeKey !== basisBeleg.ruleScopeKey) return sperre('different_rule_scope')
  if (neuBeleg.canonicalUrl !== basisBeleg.canonicalUrl) return sperre('different_official_page')
  const basisIdentitaet = registryIdentitaet(basisUmschlag)
  const neuIdentitaet = registryIdentitaet(neuUmschlag)
  if (!basisIdentitaet || basisIdentitaet !== neuIdentitaet) return sperre('different_source_registry')

  const vergleich = evidenceVersionenVergleichen(angenommen.evidence, { sourceContentHash: neuBeleg.sourceContentHash })
  if (!vergleich.ok) return sperre(vergleich.reason)
  if (vergleich.ruleChange !== 'not_asserted' || vergleich.laterAnalysisShortCircuit !== !vergleich.contentChanged) {
    return sperre('invalid_context')
  }

  return Object.freeze({
    status: vergleich.contentChanged ? 'changed_source_content' : 'unchanged_source_content',
    baselineVersionId: angenommen.evidence.versionId,
    baselineRequestKey: basisBeleg.requestKey,
    refreshedRequestKey: neuBeleg.requestKey,
    ruleScopeKey: basisBeleg.ruleScopeKey,
    sourceId: angenommen.evidence.sourceId,
    contentChanged: vergleich.contentChanged,
    laterAnalysisShortCircuit: vergleich.laterAnalysisShortCircuit,
    ruleChange: vergleich.ruleChange,
  })
}
