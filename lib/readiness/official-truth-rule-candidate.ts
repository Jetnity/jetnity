// lib/readiness/official-truth-rule-candidate.ts
//
// Baut aus bereits angenommener amtlicher Evidence einen Regel-Kandidaten.
// Scope, Schlüssel und Stütz-IDs kommen nur aus diesen EvidenceVersions.
// Der Aufruf darf nur Faktart, Evidence-Qualität und Forschungsvorschlag nennen.
// Diese Datei nimmt keine Regel an, speichert nichts und ruft kein Modell.

import { readDistinctContentItemRefs } from '@/lib/readiness/official-truth-content-identity'
import { akzeptierteEvidenceLesen, type EvidenceVersion } from '@/lib/readiness/evidence'
import {
  regelKandidatErstellen,
  regelScopeAusEvidenceScope,
  type RegelClaimFehler,
  type RegelKandidatErgebnis,
  type RegelScope,
} from '@/lib/readiness/rule-claims'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

const TIEFE_MAX = 8
const META_FELDER = ['factKind', 'evidenceQuality', 'proposal'] as const

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

type Gelesen =
  | { ok: true; scope: RegelScope; key: string; ids: string[]; versions: EvidenceVersion[] }
  | { ok: false; reason: RegelClaimFehler }

type Vorschlag =
  | { ok: true; factKind: unknown; evidenceQuality: unknown; proposal: unknown }
  | { ok: false; reason: RegelClaimFehler }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return null
  return wert as Record<string, unknown>
}

function personenkennung(wert: unknown, tiefe = 0): boolean {
  if (tiefe > TIEFE_MAX || !wert || typeof wert !== 'object') return false
  if (Array.isArray(wert)) return wert.some((eintrag) => personenkennung(eintrag, tiefe + 1))
  return Object.entries(wert as Record<string, unknown>).some(
    ([schluessel, kind]) => PERSONEN_SCHLUESSEL.has(schluessel) || personenkennung(kind, tiefe + 1),
  )
}

function registryLesen(wert: unknown): QuellenRegistry | null {
  const satz = datensatz(wert)
  if (!satz || !Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return null
  return wert as QuellenRegistry
}

function vorschlagLesen(wert: unknown): Vorschlag {
  if (personenkennung(wert)) return { ok: false, reason: 'personal_identifier_forbidden' }
  const satz = datensatz(wert)
  if (!satz) return { ok: false, reason: 'unexpected_fields' }
  const vorhanden = Object.keys(satz)
  if (vorhanden.length !== META_FELDER.length || META_FELDER.some((feld) => !(feld in satz))) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  return {
    ok: true,
    factKind: satz.factKind,
    evidenceQuality: satz.evidenceQuality,
    proposal: satz.proposal,
  }
}

function versionenLesen(wert: unknown, registry: QuellenRegistry): Gelesen {
  if (personenkennung(wert)) return { ok: false, reason: 'personal_identifier_forbidden' }
  if (!Array.isArray(wert) || wert.length === 0) return { ok: false, reason: 'invalid_support' }

  const versions: EvidenceVersion[] = []
  const ids: string[] = []
  let scope: RegelScope | null = null
  let key: string | null = null

  for (const eintrag of wert) {
    if (!datensatz(eintrag)) return { ok: false, reason: 'evidence_not_accepted' }
    const version = akzeptierteEvidenceLesen(eintrag as EvidenceVersion, registry)
    if (!version) return { ok: false, reason: 'evidence_not_accepted' }
    if (version.sourceClass !== 'official_authority') return { ok: false, reason: 'primary_source_required' }
    const zelle = regelScopeAusEvidenceScope(version.scope)
    if (!zelle.ok) return zelle
    if (key === null || scope === null) {
      key = zelle.key
      scope = zelle.scope
    } else if (zelle.key !== key) {
      return { ok: false, reason: 'scope_mismatch' }
    }
    if (ids.includes(version.versionId)) return { ok: false, reason: 'support_mismatch' }
    ids.push(version.versionId)
    versions.push(version)
  }

  if (!scope || key === null) return { ok: false, reason: 'invalid_support' }
  const sortiert = [...ids].sort()
  return { ok: true, scope, key, ids: sortiert, versions }
}

function kandidatPasst(
  erzeugt: Extract<RegelKandidatErgebnis, { ok: true }>,
  zelle: { key: string; ids: readonly string[] },
  factKind: unknown,
  evidenceQuality: unknown,
): RegelKandidatErgebnis {
  const kandidat = erzeugt.kandidat
  if (kandidat.lifecycle !== 'candidate' || kandidat.validationState !== 'pending') {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (kandidat.key !== zelle.key) return { ok: false, reason: 'scope_mismatch' }
  if (
    kandidat.supportVersionIds.length !== zelle.ids.length ||
    kandidat.supportVersionIds.some((id, index) => id !== zelle.ids[index])
  ) {
    return { ok: false, reason: 'support_mismatch' }
  }
  if (kandidat.factKind !== factKind || kandidat.evidenceQuality !== evidenceQuality) {
    return { ok: false, reason: 'invalid_evidence_quality' }
  }
  return erzeugt
}

/**
 * Ein Aufruf ist eine regulatorische Zelle.
 * Die Staatsbürgerschaftsmenge der angenommenen Evidence bleibt vollständig.
 * Eine andere Credential-Option ist eine andere Zelle und wird nicht beigemischt.
 * Der Rückgabewert im Erfolgsfall ist das Objekt von `regelKandidatErstellen`.
 */
export function officialTruthRegelKandidatAusEvidence(
  evidenceVersions: unknown,
  registry: unknown,
  metadata: unknown,
): RegelKandidatErgebnis {
  const vorschlag = vorschlagLesen(metadata)
  if (!vorschlag.ok) return vorschlag

  const basis = registryLesen(registry)
  if (!basis) return { ok: false, reason: 'invalid_fact' }

  const gelesen = versionenLesen(evidenceVersions, basis)
  if (!gelesen.ok) return gelesen

  const erzeugt = regelKandidatErstellen(
    {
      scope: gelesen.scope,
      factKind: vorschlag.factKind,
      evidenceQuality: vorschlag.evidenceQuality,
      supportVersionIds: gelesen.ids,
      proposal: vorschlag.proposal,
    },
    basis,
  )
  if (!erzeugt.ok) return erzeugt

  const items = readDistinctContentItemRefs(gelesen.versions.map(({ sourceId, contentItemId }) => ({ sourceId, contentItemId })))
  if (!items.ok) return { ok: false, reason: gelesen.versions.length === 2 ? 'same_content_item_composition' : 'support_mismatch' }
  if (erzeugt.kandidat.evidenceQuality === 'explicit_primary_statement' && items.value.length !== 1) return { ok: false, reason: 'support_mismatch' }
  if (erzeugt.kandidat.evidenceQuality === 'composed_from_multiple_primary_sources' && items.value.length < 2) return { ok: false, reason: 'insufficient_support' }

  return kandidatPasst(erzeugt, gelesen, vorschlag.factKind, vorschlag.evidenceQuality)
}
