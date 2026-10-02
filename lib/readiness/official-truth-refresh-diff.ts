// lib/readiness/official-truth-refresh-diff.ts
//
// Vergleicht eine erneut bewiesene angenommene Evidence mit einem neuen
// amtlichen Abruf derselben Quelle und derselben regulatorischen Zelle.
// Ein mitgeliefertes Evidence-Objekt, eine Versionskennung oder ein Hash
// ist kein Argument. Der Inhaltsvergleich bleibt die bestehende Funktion.
// Diese Datei speichert nichts, ruft nichts ab und zieht keine Regel heraus.

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

function sperre(reason: OfficialTruthAuffrischungSperrgrund): OfficialTruthAuffrischungErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

/**
 * Der Beleg darf die angenommene Evidence nur benennen, wenn Quelle, Zelle
 * und normalisierter Quellentext dieselben sind. Der Hash wird nicht selbst
 * verglichen. Das tut nur `evidenceVersionenVergleichen`.
 */
function belegBindet(evidence: EvidenceVersion, beleg: OfficialTruthAbgerufenBeleg): boolean {
  if (evidence.sourceClass !== 'official_authority' || evidence.sourceId !== beleg.sourceId) return false
  const zelle = regelScopeAusEvidenceScope(evidence.scope)
  if (!zelle.ok || zelle.key !== beleg.ruleScopeKey) return false
  const vergleich = evidenceVersionenVergleichen(evidence, { sourceContentHash: beleg.sourceContentHash })
  return vergleich.ok && vergleich.contentChanged === false && vergleich.ruleChange === 'not_asserted' && vergleich.laterAnalysisShortCircuit === true
}

/**
 * Beweist die bestehende Annahme aus dem ursprünglichen Abrufumschlag,
 * der injizierten Uhr und der Extraktion neu. Der neue Abruf läuft
 * unabhängig durch dieselbe Belegprüfung. Verglichen wird nur, wenn
 * Quelle und Regel-Scope übereinstimmen.
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
