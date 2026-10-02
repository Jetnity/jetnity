// lib/readiness/official-truth-refresh-diff.ts
//
// Vergleicht eine bereits angenommene amtliche Evidence mit einem neu
// belegten Abruf derselben Quelle und derselben regulatorischen Zelle.
// Diese Datei ruft nichts ab, speichert nichts und zieht keine Regel heraus.
//
// Der Abruf wird neu belegt. Ein mitgelieferter Beleg, ein fertiger Vergleich
// und ein beliebiger Hash sind keine Argumente. Gleicher Inhaltsfingerprint
// bedeutet nur denselben normalisierten Quellentext. Er bedeutet nicht, dass
// eine Regel stimmt, aktuell bleibt oder eine Einreisewirkung feststeht.

import {
  akzeptierteEvidenceLesen,
  evidenceVersionenVergleichen,
  type EvidenceVersion,
  type EvidenceVersionsVergleich,
} from '@/lib/readiness/evidence'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbgerufenBeleg,
  type OfficialTruthAbrufSperrgrund,
} from '@/lib/readiness/official-truth-retrieved-material'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const TIEFE_MAX = 8
const VERSION_ID = /^ev1_[a-f0-9]{32}$/
const ANFRAGE_KEY = /^research-request:v1:[a-f0-9]{64}$/
const REGEL_KEY = /^rule-scope:v1:[a-f0-9]{64}$/
const SOURCE_ID = /^[a-z][a-z0-9_-]{1,63}$/

const EVIDENCE_FELDER = [
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

/**
 * Dieselbe geschlossene Kennungsmenge wie der Abrufbeleg.
 * `extractionNote` bleibt ein Feld der bestehenden Evidence und ist hier
 * kein personenbezogener Schlüssel. Der Notiztext wird nicht zurückgegeben.
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

const NOTIZ_SCHLUESSEL = new Set([
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
])

export type OfficialTruthAktualisierungSperrgrund =
  | OfficialTruthAbrufSperrgrund
  | 'existing_evidence_not_accepted'
  | 'existing_source_not_official_authority'
  | 'source_id_mismatch'
  | 'invalid_hash'
  | 'invalid_context'

/**
 * Refresh-Entscheidung ohne Regelresultat.
 * `unchanged_source_content` heißt nur: der normalisierte Quellentext ist
 * derselbe. `ruleChange` bleibt `not_asserted`.
 */
export type OfficialTruthAktualisierungVergleichErgebnis =
  | {
      readonly status: 'unchanged_source_content'
      readonly existingVersionId: string
      readonly requestKey: string
      readonly ruleScopeKey: string
      readonly sourceId: string
      readonly contentChanged: false
      readonly laterAnalysisShortCircuit: true
      readonly ruleChange: 'not_asserted'
    }
  | {
      readonly status: 'changed_source_content'
      readonly existingVersionId: string
      readonly requestKey: string
      readonly ruleScopeKey: string
      readonly sourceId: string
      readonly contentChanged: true
      readonly laterAnalysisShortCircuit: false
      readonly ruleChange: 'not_asserted'
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthAktualisierungSperrgrund }

type Kennungen = {
  existingVersionId: string
  requestKey: string
  ruleScopeKey: string
  sourceId: string
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function sperre(reason: OfficialTruthAktualisierungSperrgrund): OfficialTruthAktualisierungVergleichErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function genaueSchluessel(satz: object, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function registryAusUmschlag(umschlag: unknown): QuellenRegistry | null {
  const satz = datensatz(umschlag)
  if (!satz) return null
  const registry = datensatz(satz.registry)
  if (!registry || !Array.isArray(registry.sources) || !Array.isArray(registry.blockedDomains)) return null
  return registry as QuellenRegistry
}

/**
 * Persönliche Schlüssel werden nur als Grund gemeldet. Der Wert wird nicht
 * übernommen. Ein Objekt in der eigenen Vorfahrkette ist ein Zyklus.
 */
function baumPruefen(wert: unknown, tiefe: number, vorfahren: object[]): 'personal' | 'kaputt' | null {
  if (tiefe > TIEFE_MAX) return 'kaputt'
  if (!wert || typeof wert !== 'object') return null
  if (vorfahren.includes(wert)) return 'kaputt'
  vorfahren.push(wert)
  try {
    if (Array.isArray(wert)) {
      for (const eintrag of wert) {
        const fund = baumPruefen(eintrag, tiefe + 1, vorfahren)
        if (fund) return fund
      }
      return null
    }
    for (const [schluessel, kind] of Object.entries(wert)) {
      if (PERSONEN_SCHLUESSEL.has(schluessel) || NOTIZ_SCHLUESSEL.has(schluessel)) return 'personal'
      const fund = baumPruefen(kind, tiefe + 1, vorfahren)
      if (fund) return fund
    }
    return null
  } finally {
    vorfahren.pop()
  }
}

function evidenceSatz(wert: unknown): EvidenceVersion | null {
  if (baumPruefen(wert, 0, []) !== null) return null
  const satz = datensatz(wert)
  if (!satz || !genaueSchluessel(satz, EVIDENCE_FELDER)) return null
  const scope = datensatz(satz.scope)
  if (!scope || !genaueSchluessel(scope, SCOPE_FELDER)) return null
  return satz as EvidenceVersion
}

function personenGrund(wert: unknown): OfficialTruthAktualisierungSperrgrund | null {
  return baumPruefen(wert, 0, []) === 'personal' ? 'sensitive_personal_field' : null
}

function kennungen(
  geleseneVersion: string,
  beleg: OfficialTruthAbgerufenBeleg,
): { ok: true; werte: Kennungen } | { ok: false; reason: OfficialTruthAktualisierungSperrgrund } {
  if (!VERSION_ID.test(geleseneVersion)) return { ok: false, reason: 'existing_evidence_not_accepted' }
  if (!ANFRAGE_KEY.test(beleg.requestKey)) return { ok: false, reason: 'invalid_request' }
  if (!REGEL_KEY.test(beleg.ruleScopeKey)) return { ok: false, reason: 'scope_mismatch' }
  if (!SOURCE_ID.test(beleg.sourceId)) return { ok: false, reason: 'source_id_mismatch' }
  return {
    ok: true,
    werte: {
      existingVersionId: geleseneVersion,
      requestKey: beleg.requestKey,
      ruleScopeKey: beleg.ruleScopeKey,
      sourceId: beleg.sourceId,
    },
  }
}

function entscheidung(
  vergleich: Extract<EvidenceVersionsVergleich, { ok: true }>,
  werte: Kennungen,
): OfficialTruthAktualisierungVergleichErgebnis {
  if (vergleich.ruleChange !== 'not_asserted') return sperre('invalid_context')
  if (!vergleich.contentChanged && vergleich.laterAnalysisShortCircuit === true) {
    return Object.freeze({
      status: 'unchanged_source_content',
      ...werte,
      contentChanged: false,
      laterAnalysisShortCircuit: true,
      ruleChange: vergleich.ruleChange,
    })
  }
  if (vergleich.contentChanged && vergleich.laterAnalysisShortCircuit === false) {
    return Object.freeze({
      status: 'changed_source_content',
      ...werte,
      contentChanged: true,
      laterAnalysisShortCircuit: false,
      ruleChange: vergleich.ruleChange,
    })
  }
  return sperre('invalid_context')
}

/**
 * Prüft den ursprünglichen Abrufumschlag erneut und vergleicht nur den
 * Inhaltsfingerprint der bereits angenommenen Evidence mit dem Fingerprint
 * aus diesem Beleg. Die Registry kommt erst danach aus demselben Umschlag.
 * URL, Snapshot, Hash und Notiz verlassen diese Funktion nicht.
 */
export function officialTruthAkzeptierteEvidenceAktualisierungVergleichen(
  bestehend: unknown,
  umschlag: unknown,
  uhr: unknown,
): OfficialTruthAktualisierungVergleichErgebnis {
  const beleg = officialTruthAbgerufenMaterialPruefen(umschlag, uhr)
  if (beleg.status !== 'retrieved_material') return sperre(beleg.reason)

  const registry = registryAusUmschlag(umschlag)
  if (!registry) return sperre('invalid_source_plan')

  const personen = personenGrund(bestehend)
  if (personen) return sperre(personen)

  const satz = evidenceSatz(bestehend)
  if (!satz) return sperre('existing_evidence_not_accepted')
  let gelesen: EvidenceVersion | null
  try {
    gelesen = akzeptierteEvidenceLesen(satz, registry)
  } catch {
    return sperre('existing_evidence_not_accepted')
  }
  if (!gelesen) return sperre('existing_evidence_not_accepted')
  if (gelesen.sourceClass !== 'official_authority') return sperre('existing_source_not_official_authority')
  if (gelesen.sourceId !== beleg.sourceId) return sperre('source_id_mismatch')

  let zelle: ReturnType<typeof regelScopeAusEvidenceScope>
  try {
    zelle = regelScopeAusEvidenceScope(gelesen.scope)
  } catch {
    return sperre('scope_mismatch')
  }
  if (!zelle.ok || zelle.key !== beleg.ruleScopeKey) return sperre('scope_mismatch')

  const vergleich = evidenceVersionenVergleichen(gelesen, { sourceContentHash: beleg.sourceContentHash })
  if (!vergleich.ok) return sperre(vergleich.reason)

  const ids = kennungen(gelesen.versionId, beleg)
  if (!ids.ok) return sperre(ids.reason)
  return entscheidung(vergleich, ids.werte)
}
