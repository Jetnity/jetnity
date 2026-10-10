// lib/readiness/official-truth-retrieved-candidate-evidence.ts
//
// Baut aus einem bereits geprüften amtlichen Abruf einen Kandidaten der
// bestehenden Evidence. Diese Datei ruft kein Modell, nimmt nichts an,
// speichert nichts und bewertet keine Einreisewirkung.
//
// Der Abruf wird neu belegt. Ein mitgelieferter Beleg ist kein Argument.
// Scope und sourceId kommen aus der Forschungsanfrage und aus diesem Beleg.
// Die Extraktion darf nur das Gültigkeitsfenster und eine kurze Notiz tragen.

import { contentIdentityMatches } from '@/lib/readiness/official-truth-content-identity'
import {
  evidenceKandidatAusModell,
  type EvidenceKandidatErgebnis,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbgerufenBeleg,
  type OfficialTruthAbrufSperrgrund,
} from '@/lib/readiness/official-truth-retrieved-material'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const TIEFE_MAX = 8
const EXTRAKTION_FELDER = ['validFrom', 'validUntil', 'extractionNote'] as const

/**
 * Dieselbe geschlossene Kennungsmenge wie der Abrufbeleg.
 * Sie ist dort modulprivat. Diese Datei ändert jenes Modul nicht.
 */
const PERSONEN_SCHLUESSEL = new Set([
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

/** Freitext ausser der einen erlaubten Extraktionsnotiz. */
const NOTIZ_SCHLUESSEL = new Set([
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
])

type KonstruktorSperre = Exclude<EvidenceKandidatErgebnis, { ok: true }>['reason']

export type OfficialTruthKandidatEvidenceSperrgrund =
  | OfficialTruthAbrufSperrgrund
  | KonstruktorSperre
  | 'invalid_extraction'
  | 'extraction_field_forbidden'

/**
 * Ein Kandidat ist keine angenommene Evidence und keine Official Truth.
 * `candidate_evidence` ist nur die Hülle. Lebenszyklus und Prüfung
 * stehen auf der Evidence, die der bestehende Konstruktor gebaut hat.
 */
export type OfficialTruthKandidatEvidenceErgebnis =
  | { readonly status: 'candidate_evidence'; readonly evidence: EvidenceVersion }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthKandidatEvidenceSperrgrund }

type Extraktion =
  | { ok: true; validFrom: string | null; validUntil: string | null; extractionNote: string | null }
  | { ok: false; reason: OfficialTruthKandidatEvidenceSperrgrund }

type Fund = { personal: boolean; forbidden: boolean; kaputt: boolean }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function sperre(reason: OfficialTruthKandidatEvidenceSperrgrund): OfficialTruthKandidatEvidenceErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function schluesselGrund(schluessel: string, tiefe: number): OfficialTruthKandidatEvidenceSperrgrund | null {
  if (PERSONEN_SCHLUESSEL.has(schluessel)) return 'sensitive_personal_field'
  if (NOTIZ_SCHLUESSEL.has(schluessel)) return 'sensitive_personal_field'
  if (tiefe === 0 && (EXTRAKTION_FELDER as readonly string[]).includes(schluessel)) return null
  return 'extraction_field_forbidden'
}

/**
 * Persönliche Schlüssel und jedes weitere Feld werden nur als Grund gemeldet.
 * Der Wert wird nicht übernommen. Ein Objekt in der eigenen Vorfahrkette
 * ist ein Zyklus.
 */
function baumPruefen(wert: unknown, tiefe: number, vorfahren: object[], fund: Fund): void {
  if (fund.personal) return
  if (tiefe > TIEFE_MAX) {
    fund.kaputt = true
    return
  }
  if (!wert || typeof wert !== 'object') return
  if (vorfahren.includes(wert)) {
    fund.kaputt = true
    return
  }
  vorfahren.push(wert)
  try {
    if (Array.isArray(wert)) {
      for (const eintrag of wert) baumPruefen(eintrag, tiefe + 1, vorfahren, fund)
      return
    }
    for (const [schluessel, kind] of Object.entries(wert)) {
      const grund = schluesselGrund(schluessel, tiefe)
      if (grund === 'sensitive_personal_field') fund.personal = true
      else if (grund === 'extraction_field_forbidden') fund.forbidden = true
      baumPruefen(kind, tiefe + 1, vorfahren, fund)
    }
  } finally {
    vorfahren.pop()
  }
}

function textOderNull(wert: unknown): string | null | undefined {
  if (wert === null) return null
  if (typeof wert === 'string') return wert
  return undefined
}

function extraktionLesen(wert: unknown): Extraktion {
  if (wert == null) return { ok: true, validFrom: null, validUntil: null, extractionNote: null }
  const fund: Fund = { personal: false, forbidden: false, kaputt: false }
  baumPruefen(wert, 0, [], fund)
  if (fund.personal) return { ok: false, reason: 'sensitive_personal_field' }
  if (fund.forbidden) return { ok: false, reason: 'extraction_field_forbidden' }
  if (fund.kaputt) return { ok: false, reason: 'invalid_extraction' }
  const satz = datensatz(wert)
  if (!satz) return { ok: false, reason: 'invalid_extraction' }
  const validFrom = textOderNull(Object.hasOwn(satz, 'validFrom') ? satz.validFrom : null)
  const validUntil = textOderNull(Object.hasOwn(satz, 'validUntil') ? satz.validUntil : null)
  const extractionNote = textOderNull(Object.hasOwn(satz, 'extractionNote') ? satz.extractionNote : null)
  if (validFrom === undefined || validUntil === undefined || extractionNote === undefined) {
    return { ok: false, reason: 'invalid_extraction' }
  }
  return { ok: true, validFrom, validUntil, extractionNote }
}

function kandidatPasst(evidence: EvidenceVersion, beleg: OfficialTruthAbgerufenBeleg): boolean {
  return (
    contentIdentityMatches(evidence, beleg) && evidence.contentType === beleg.contentType &&
    evidence.lifecycle === 'candidate' &&
    evidence.validationState === 'pending' &&
    evidence.previousVersionId === null &&
    evidence.sourceClass === 'official_authority' &&
    evidence.sourceId === beleg.sourceId &&
    evidence.canonicalUrl === beleg.canonicalUrl &&
    evidence.retrievedAt === beleg.retrievedAt &&
    evidence.sourceFingerprintProtocol === beleg.sourceFingerprintProtocol &&
    evidence.sourceContentHash === beleg.sourceContentHash
  )
}

/**
 * Prüft den ursprünglichen Abrufumschlag erneut und baut daraus höchstens
 * einen Evidence-Kandidaten. Die Extraktion kann `validFrom`, `validUntil`
 * und `extractionNote` setzen. Jedes andere Feld sperrt den Aufruf.
 * Staatsbürgerschaft, Dokument, Ziel, Transit, Wohnsitz und Reisedatum
 * bleiben die Zelle der Forschungsanfrage. `sourceId` kommt nur aus dem
 * neu belegten amtlichen Abruf.
 */
export function officialTruthKandidatEvidenceAusAbruf(
  umschlag: unknown,
  uhr: unknown,
  extraktion: unknown,
): OfficialTruthKandidatEvidenceErgebnis {
  const beleg = officialTruthAbgerufenMaterialPruefen(umschlag, uhr)
  if (beleg.status === 'blocked') return sperre(beleg.reason)

  const meta = extraktionLesen(extraktion)
  if (!meta.ok) return sperre(meta.reason)

  const satz = datensatz(umschlag)
  const request = satz ? datensatz(satz.request) : null
  if (!request || request.key !== beleg.requestKey || request.ruleScopeKey !== beleg.ruleScopeKey) {
    return sperre('invalid_request')
  }
  const zelle = regelScopeAusEvidenceScope(request.scope)
  if (!zelle.ok || zelle.key !== beleg.ruleScopeKey) return sperre('scope_mismatch')
  if (!satz || !datensatz(satz.registry)) return sperre('invalid_source_plan')

  const erzeugt = evidenceKandidatAusModell(
    {
      scope: {
        destinationCountryCode: zelle.scope.destinationCountryCode,
        transitCountryCode: zelle.scope.transitCountryCode,
        citizenship: zelle.scope.citizenship,
        credentialOption: zelle.scope.credentialOption,
        residence: zelle.scope.residence,
        requirementType: zelle.scope.requirementType,
        validity: zelle.scope.validity,
        sourceId: beleg.sourceId,
      },
      validFrom: meta.validFrom,
      validUntil: meta.validUntil,
      extractionNote: meta.extractionNote,
    },
    beleg.material,
    satz.registry as QuellenRegistry,
  )
  if (!erzeugt.ok) return sperre(erzeugt.reason)

  const erneut = regelScopeAusEvidenceScope(erzeugt.evidence.scope)
  if (!erneut.ok || erneut.key !== beleg.ruleScopeKey) return sperre('scope_mismatch')
  if (!kandidatPasst(erzeugt.evidence, beleg)) return sperre('invalid_context')
  return Object.freeze({ status: 'candidate_evidence', evidence: erzeugt.evidence })
}
