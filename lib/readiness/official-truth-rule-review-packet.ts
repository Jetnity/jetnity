// lib/readiness/official-truth-rule-review-packet.ts
//
// Internes Prüfpaket nach angenommener Evidence und einem Regel-Kandidaten.
// Jede Stütze wird neu belegt und neu angenommen. Der Kandidat entsteht
// nur in der bestehenden Brücke. Dieses Paket ist Prüfstoff. Es nimmt
// keine Regel an, speichert nichts und zieht keine Wahrheit.

import {
  officialTruthAkzeptierteEvidenceAusAbruf,
  type OfficialTruthAkzeptierteEvidenceErgebnis,
  type OfficialTruthAkzeptierteEvidenceSperrgrund,
} from '@/lib/readiness/official-truth-accepted-evidence'
import {
  officialTruthAbgerufenMaterialPruefen,
  type OfficialTruthAbgerufenBeleg,
  type OfficialTruthAbrufSperrgrund,
} from '@/lib/readiness/official-truth-retrieved-material'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import {
  REGEL_SUPPORT_MAX,
  regelScopeAusEvidenceScope,
  type RegelClaimFehler,
  type RegelKandidat,
} from '@/lib/readiness/rule-claims'

const TIEFE_MAX = 8
const EINGABE_FELDER = ['supports', 'metadata'] as const
const BUENDEL_FELDER = ['umschlag', 'uhr', 'extraktion'] as const

/**
 * Dieselbe Kennungsmenge wie `PERSONEN_SCHLUESSEL` in `rule-claims.ts`,
 * plus die Notizschlüssel der Abrufbrücke. Beide Mengen sind dort
 * modulprivat. Diese Datei ändert jene Module nicht.
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
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
])

export type OfficialTruthRegelReviewPacketSperrgrund =
  | OfficialTruthAkzeptierteEvidenceSperrgrund
  | OfficialTruthAbrufSperrgrund
  | RegelClaimFehler

/**
 * Eine Stütze im Prüfpaket. Der Schnappschuss ist das neu belegte
 * Behördenmaterial. `validFrom` und `validUntil` kommen aus der schon
 * angenommenen Evidence. Die freie Extraktionsnotiz wird nicht übernommen.
 * Nichts davon ist eine Entscheidung.
 */
export type OfficialTruthRegelReviewSupport = {
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly sourceContentHash: string
  readonly validFrom: string | null
  readonly validUntil: string | null
  readonly sourceSnapshot: string
}

/**
 * `rule_review_packet` ist interne Prüfsicht. Der Kandidat bleibt
 * candidate/pending. Keine angenommene Regel und kein Wahrheitsfakt.
 */
export type OfficialTruthRegelReviewPacketErgebnis =
  | {
      readonly status: 'rule_review_packet'
      readonly kandidat: RegelKandidat
      readonly supports: readonly OfficialTruthRegelReviewSupport[]
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewPacketSperrgrund }

/**
 * Dieselbe Prüfung wie das öffentliche Paket, plus die angenommenen
 * EvidenceVersions, die das Paket dafür schon gebaut hat. Das öffentliche
 * Paket gibt diese Versionen nicht zurück. Nur die servergehaltene Grenze
 * darf sie für den gleichen Request behalten.
 */
export type OfficialTruthRegelReviewBelegErgebnis =
  | {
      readonly status: 'rule_review_packet'
      readonly kandidat: RegelKandidat
      readonly supports: readonly OfficialTruthRegelReviewSupport[]
      readonly evidenceVersions: readonly Angenommen['evidence'][]
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewPacketSperrgrund }

type Angenommen = Extract<OfficialTruthAkzeptierteEvidenceErgebnis, { status: 'accepted_evidence' }>

type Belegt = {
  evidence: Angenommen['evidence']
  beleg: OfficialTruthAbgerufenBeleg
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: object, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function sperre(
  reason: OfficialTruthRegelReviewPacketSperrgrund,
): { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewPacketSperrgrund } {
  return Object.freeze({ status: 'blocked', reason })
}

function personenkennung(wert: unknown, tiefe: number, gesehen: WeakSet<object>): boolean {
  if (tiefe > TIEFE_MAX || !wert || typeof wert !== 'object') return false
  if (gesehen.has(wert)) return false
  gesehen.add(wert)
  if (Array.isArray(wert)) return wert.some((eintrag) => personenkennung(eintrag, tiefe + 1, gesehen))
  return Object.entries(wert).some(
    ([schluessel, kind]) => PERSONEN_SCHLUESSEL.has(schluessel) || personenkennung(kind, tiefe + 1, gesehen),
  )
}

/** Persönliche Schlüssel ausserhalb der erlaubten Hülle. Der Wert wird nicht übernommen. */
function fremdePerson(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const gesehen = new WeakSet<object>()
  return Object.entries(satz).some(([schluessel, kind]) => {
    if ((erlaubt as readonly string[]).includes(schluessel)) return false
    return PERSONEN_SCHLUESSEL.has(schluessel) || personenkennung(kind, 0, gesehen)
  })
}

function registryText(wert: unknown): string | null {
  const satz = datensatz(wert)
  if (!satz || !Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return null
  try {
    const text = JSON.stringify(wert)
    return typeof text === 'string' ? text : null
  } catch {
    return null
  }
}

function stuetzEintrag(belegt: Belegt): OfficialTruthRegelReviewSupport {
  return Object.freeze({
    versionId: belegt.evidence.versionId,
    sourceId: belegt.evidence.sourceId,
    canonicalUrl: belegt.evidence.canonicalUrl,
    retrievedAt: belegt.evidence.retrievedAt,
    sourceContentHash: belegt.evidence.sourceContentHash,
    validFrom: belegt.evidence.validFrom,
    validUntil: belegt.evidence.validUntil,
    sourceSnapshot: belegt.beleg.material.sourceSnapshot,
  })
}

function buendelLesen(wert: unknown): { ok: true; belegt: Belegt; registry: string; registryWert: unknown } | { ok: false; reason: OfficialTruthRegelReviewPacketSperrgrund } {
  const buendel = datensatz(wert)
  if (!buendel) return { ok: false, reason: 'unexpected_fields' }
  if (fremdePerson(buendel, BUENDEL_FELDER)) return { ok: false, reason: 'personal_identifier_forbidden' }
  if (!genaueSchluessel(buendel, BUENDEL_FELDER)) return { ok: false, reason: 'unexpected_fields' }

  const akzeptiert = officialTruthAkzeptierteEvidenceAusAbruf(buendel.umschlag, buendel.uhr, buendel.extraktion)
  if (akzeptiert.status !== 'accepted_evidence') return { ok: false, reason: akzeptiert.reason }

  const beleg = officialTruthAbgerufenMaterialPruefen(buendel.umschlag, buendel.uhr)
  if (beleg.status !== 'retrieved_material') return { ok: false, reason: beleg.reason }

  const evidence = akzeptiert.evidence
  if (evidence.sourceClass !== 'official_authority') return { ok: false, reason: 'primary_source_required' }
  const zelle = regelScopeAusEvidenceScope(evidence.scope)
  if (!zelle.ok) return { ok: false, reason: zelle.reason }
  if (
    beleg.sourceId !== evidence.sourceId ||
    beleg.ruleScopeKey !== zelle.key ||
    beleg.canonicalUrl !== evidence.canonicalUrl ||
    beleg.retrievedAt !== evidence.retrievedAt ||
    beleg.sourceContentHash !== evidence.sourceContentHash
  ) {
    return { ok: false, reason: 'invalid_context' }
  }

  const umschlag = datensatz(buendel.umschlag)
  const registryWert = umschlag ? umschlag.registry : null
  const registry = registryText(registryWert)
  if (!registry) return { ok: false, reason: 'invalid_source_plan' }
  return { ok: true, belegt: { evidence, beleg }, registry, registryWert }
}

/** Eine Zelle, eine Registry, höchstens `REGEL_SUPPORT_MAX` Stützen. */
function regelReviewBauen(eingabe: unknown): OfficialTruthRegelReviewBelegErgebnis {
  const satz = datensatz(eingabe)
  if (!satz) return sperre('unexpected_fields')
  if (fremdePerson(satz, EINGABE_FELDER)) return sperre('personal_identifier_forbidden')
  if (!genaueSchluessel(satz, EINGABE_FELDER)) return sperre('unexpected_fields')
  if (!Array.isArray(satz.supports) || satz.supports.length === 0) return sperre('invalid_support')
  if (satz.supports.length > REGEL_SUPPORT_MAX) return sperre('support_bound_exceeded')

  const belegt: Belegt[] = []
  let registry: string | null = null
  let registryWert: unknown = null
  for (const eintrag of satz.supports) {
    const gelesen = buendelLesen(eintrag)
    if (!gelesen.ok) return sperre(gelesen.reason)
    if (registry === null) {
      registry = gelesen.registry
      registryWert = gelesen.registryWert
    } else if (gelesen.registry !== registry) {
      return sperre('invalid_source_plan')
    }
    belegt.push(gelesen.belegt)
  }

  const erzeugt = officialTruthRegelKandidatAusEvidence(
    belegt.map((eintrag) => eintrag.evidence),
    registryWert,
    satz.metadata,
  )
  if (!erzeugt.ok) return sperre(erzeugt.reason)

  const kandidat = erzeugt.kandidat
  if (kandidat.lifecycle !== 'candidate' || kandidat.validationState !== 'pending') return sperre('invalid_fact')

  const ids = [...belegt.map((eintrag) => eintrag.evidence.versionId)].sort()
  if (
    kandidat.supportVersionIds.length !== ids.length ||
    kandidat.supportVersionIds.some((id, index) => id !== ids[index])
  ) {
    return sperre('support_mismatch')
  }
  if (belegt.some((eintrag) => eintrag.beleg.ruleScopeKey !== kandidat.key)) return sperre('scope_mismatch')

  const nachId = new Map(belegt.map((eintrag) => [eintrag.evidence.versionId, eintrag]))
  const supports: OfficialTruthRegelReviewSupport[] = []
  const evidenceVersions: Angenommen['evidence'][] = []
  for (const id of ids) {
    const eintrag = nachId.get(id)
    if (!eintrag) return sperre('support_mismatch')
    supports.push(stuetzEintrag(eintrag))
    evidenceVersions.push(eintrag.evidence)
  }

  return Object.freeze({
    status: 'rule_review_packet',
    kandidat,
    supports: Object.freeze(supports),
    evidenceVersions: Object.freeze(evidenceVersions),
  })
}

/**
 * Server-Naht. Behält die EvidenceVersions, die dieser Aufbau schon
 * angenommen hat. Das ist kein öffentliches Prüfpaket.
 */
export function officialTruthRegelReviewBelege(eingabe: unknown): OfficialTruthRegelReviewBelegErgebnis {
  return regelReviewBauen(eingabe)
}

/**
 * Baut ein internes Prüfpaket.
 * Jede Stütze trägt den ursprünglichen Abrufumschlag, die injizierte Uhr
 * und die Extraktion. Die Metadaten tragen nur Faktart, Evidence-Qualität
 * und Vorschlag. Evidence, Regel-Kandidat, Beleg, Stütz-IDs und ein
 * Wahrheitsfakt des Aufrufers sind keine Argumente.
 * Eine Zelle, eine Registry, höchstens `REGEL_SUPPORT_MAX` Stützen.
 * Angenommene EvidenceVersions bleiben in `officialTruthRegelReviewBelege`.
 */
export function officialTruthRegelReviewPacket(eingabe: unknown): OfficialTruthRegelReviewPacketErgebnis {
  const gebaut = regelReviewBauen(eingabe)
  if (gebaut.status !== 'rule_review_packet') return gebaut
  return Object.freeze({
    status: 'rule_review_packet',
    kandidat: gebaut.kandidat,
    supports: gebaut.supports,
  })
}
