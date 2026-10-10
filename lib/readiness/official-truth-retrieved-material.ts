// lib/readiness/official-truth-retrieved-material.ts
//
// Fail-closed Beleg für bereits abgerufenes amtliches Quellenmaterial.
// Diese Datei ruft nichts ab, speichert nichts und zieht keine Regel heraus.
// Ein bestandener Beleg ist abgerufenes Material. Er ist keine Candidate
// Evidence und keine Official Truth.
//
// Die Zulässigkeit der Quelle beweist nur die bestehende Forschungsbrücke.
// Der Inhaltsfingerprint kommt nur aus dem bestehenden Quellenfingerprint.

import { evidenceQuellenFingerprint, type EvidenceQuellenmaterial } from '@/lib/readiness/evidence'
import {
  contentIdentityBinding,
  contentRepresentationFromRegistry,
  type ContentIdentityBinding,
} from '@/lib/readiness/official-truth-content-identity'
import { officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import { officialTruthChDeSourceFingerprintV2Allowed } from '@/lib/readiness/official-truth-ch-de-source-budget-128k-1'
import { checkedAtLesen } from '@/lib/readiness/official'
import { officialTruthRechercheQuellenRouten } from '@/lib/readiness/official-truth-research-source-routing'
import { quellenUrlAufloesen, type QuellenRegistry } from '@/lib/readiness/source-registry'

const UMSCHLAG_FELDER = ['request', 'registry', 'descriptors', 'sourceId', 'material'] as const
const MATERIAL_FELDER = ['canonicalUrl', 'retrievedAt', 'sourceSnapshot', 'contentType'] as const
const TIEFE_MAX = 8

/**
 * Dieselbe geschlossene Kennungsmenge wie die Forschungsanfrage.
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

/** Freitext, der in diesem Umschlag keine Bedeutung hat. */
const NOTIZ_SCHLUESSEL = new Set([
  'extractionNote',
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
])

/** Der Aufrufer liefert keinen Fingerprint. `sourceSnapshot` steht nur im Material. */
const FINGERPRINT_OVERRIDE = new Set(['content', 'contentHash', 'sourceContentHash'])

/** URL und Abrufzeit stehen nur im Material. */
const PROVENIENZ_OVERRIDE = new Set(['canonicalUrl', 'retrievedAt'])

/** Reine Tracking-Namen. `lang` und `ref` gehören nicht dazu. */
const TRACKING_NAMEN = new Set(['gclid', 'dclid', 'fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid'])

export type OfficialTruthAbrufSperrgrund =
  | 'content_identity_mismatch'
  | 'invalid_envelope'
  | 'sensitive_personal_field'
  | 'source_fingerprint_override_forbidden'
  | 'provenance_override_forbidden'
  | 'invalid_validation_clock'
  | 'invalid_request'
  | 'scope_mismatch'
  | 'invalid_source_plan'
  | 'source_not_official_authority'
  | 'source_not_eligible'
  | 'url_source_mismatch'
  | 'invalid_url'
  | 'insecure_scheme'
  | 'credentials'
  | 'unregistered_domain'
  | 'blocked_domain'
  | 'tracking_parameter'
  | 'invalid_retrieved_at'
  | 'retrieved_at_in_future'
  | 'invalid_source_snapshot'

/**
 * Abgerufenes Material für genau eine bereits belegte Forschungsanfrage
 * und genau eine ausgewählte amtliche Quelle.
 * Kein Regelresultat und keine angenommene Evidence.
 */
export type OfficialTruthAbgerufenBeleg = ContentIdentityBinding & {
  readonly identitySchema: 2
  readonly contentType: string
  readonly status: 'retrieved_material'
  readonly requestKey: string
  readonly ruleScopeKey: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly sourceContentHash: string
  readonly sourceFingerprintProtocol?: 2
  readonly material: EvidenceQuellenmaterial
}

export type OfficialTruthAbrufErgebnis =
  | OfficialTruthAbgerufenBeleg
  | { readonly status: 'blocked'; readonly reason: OfficialTruthAbrufSperrgrund }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function sperre(reason: OfficialTruthAbrufSperrgrund): OfficialTruthAbrufErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function schluesselGrund(schluessel: string, pfad: string): OfficialTruthAbrufSperrgrund | null {
  if (PERSONEN_SCHLUESSEL.has(schluessel) || NOTIZ_SCHLUESSEL.has(schluessel)) return 'sensitive_personal_field'
  if (FINGERPRINT_OVERRIDE.has(schluessel)) return 'source_fingerprint_override_forbidden'
  if (schluessel === 'sourceSnapshot' && pfad !== 'material.sourceSnapshot') return 'source_fingerprint_override_forbidden'
  if (PROVENIENZ_OVERRIDE.has(schluessel) && pfad !== `material.${schluessel}`) return 'provenance_override_forbidden'
  return null
}

/**
 * Persönliche Schlüssel, Fingerprint-Overrides und zweite Provenienz
 * werden nur als Grund gemeldet. Der Wert wird nicht übernommen.
 * Geteilte Registry-Objekte sind kein Zyklus. Ein Objekt in der eigenen
 * Vorfahrkette ist eine.
 */
function baumPruefen(wert: unknown, pfad: string, vorfahren: object[]): OfficialTruthAbrufSperrgrund | null {
  if (vorfahren.length > TIEFE_MAX) return 'invalid_envelope'
  if (!wert || typeof wert !== 'object') return null
  if (vorfahren.includes(wert)) return 'invalid_envelope'
  vorfahren.push(wert)
  try {
    if (Array.isArray(wert)) {
      for (let index = 0; index < wert.length; index += 1) {
        const grund = baumPruefen(wert[index], `${pfad}[${index}]`, vorfahren)
        if (grund) return grund
      }
      return null
    }
    for (const [schluessel, kind] of Object.entries(wert)) {
      const hier = pfad ? `${pfad}.${schluessel}` : schluessel
      const grund = schluesselGrund(schluessel, hier)
      if (grund) return grund
      const tiefer = baumPruefen(kind, hier, vorfahren)
      if (tiefer) return tiefer
    }
    return null
  } finally {
    vorfahren.pop()
  }
}

function schaltjahr(jahr: number): boolean {
  return (jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0
}

function kalenderdatum(jahr: number, monat: number, tag: number): boolean {
  if (monat < 1 || monat > 12 || tag < 1) return false
  const laenge = [0, 31, schaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return tag <= (laenge[monat] ?? 0)
}

/**
 * Dieselbe Instant-Form wie `checkedAtLesen`, ohne Zuschneiden.
 * Ein Kalenderüberlauf und eine Zeit ohne `Z` bleiben ungültig.
 */
function instantLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || checkedAtLesen(wert) !== wert) return null
  const teile = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/.exec(wert)
  if (!teile) return null
  const jahr = Number(teile[1])
  const monat = Number(teile[2])
  const tag = Number(teile[3])
  const stunde = Number(teile[4])
  const minute = Number(teile[5])
  const sekunde = Number(teile[6])
  if (!kalenderdatum(jahr, monat, tag) || stunde > 23 || minute > 59 || sekunde > 59) return null
  return wert
}

function uhrLesen(uhr: unknown): number | null {
  if (typeof uhr !== 'function') return null
  let instant: unknown
  try {
    instant = uhr()
  } catch {
    return null
  }
  if (!(instant instanceof Date)) return null
  const ms = instant.getTime()
  return Number.isFinite(ms) ? ms : null
}

function trackingName(name: string): boolean {
  const klein = name.toLowerCase()
  return klein.startsWith('utm_') || TRACKING_NAMEN.has(klein)
}

function hatTracking(url: string): boolean {
  let gelesen: URL
  try {
    gelesen = new URL(url)
  } catch {
    return false
  }
  for (const name of gelesen.searchParams.keys()) {
    if (trackingName(name)) return true
  }
  return false
}

function klassenVon(registry: unknown, sourceId: string): 'official_authority' | 'licensed_evidence_provider' | 'other' | 'absent' {
  const satz = datensatz(registry)
  if (!satz || !Array.isArray(satz.sources)) return 'absent'
  for (const eintrag of satz.sources) {
    const quelle = datensatz(eintrag)
    if (!quelle || quelle.sourceId !== sourceId) continue
    if (quelle.sourceClass === 'official_authority') return 'official_authority'
    if (quelle.sourceClass === 'licensed_evidence_provider') return 'licensed_evidence_provider'
    return 'other'
  }
  return 'absent'
}

/**
 * Prüft einen Umschlag aus Forschungsanfrage, Registry, Deskriptoren,
 * ausgewählter Quelle, Abrufmaterial und injizierter UTC-Uhr.
 * Die Route wird neu belegt. Ein mitgeliefertes Routenergebnis ist kein Feld.
 * Der Fingerprint wird neu berechnet. Ein mitgelieferter Hash wird abgelehnt.
 */
export function officialTruthAbgerufenMaterialPruefen(umschlag: unknown, uhr: unknown): OfficialTruthAbrufErgebnis {
  const satz = datensatz(umschlag)
  if (!satz) return sperre('invalid_envelope')
  const baum = baumPruefen(satz, '', [])
  if (baum) return sperre(baum)
  if (!genaueSchluessel(satz, UMSCHLAG_FELDER)) return sperre('invalid_envelope')
  const material = datensatz(satz.material)
  if (!material || !genaueSchluessel(material, MATERIAL_FELDER)) return sperre('invalid_envelope')
  if (typeof satz.sourceId !== 'string') return sperre('invalid_envelope')

  const entscheidung = officialTruthRechercheQuellenRouten(satz.request, satz.registry, satz.descriptors)
  if (entscheidung.status === 'blocked_invalid') return sperre(entscheidung.reason)

  const klasse = klassenVon(satz.registry, satz.sourceId)
  if (klasse === 'licensed_evidence_provider' || klasse === 'other') return sperre('source_not_official_authority')
  if (klasse !== 'official_authority' || !entscheidung.sourceIds.includes(satz.sourceId)) {
    return sperre('source_not_eligible')
  }

  const registry = satz.registry as QuellenRegistry
  const url = quellenUrlAufloesen(registry, material.canonicalUrl)
  if (!url.ok) return sperre(url.reason)
  if (typeof material.canonicalUrl === 'string' && (hatTracking(material.canonicalUrl) || hatTracking(url.canonicalUrl))) {
    return sperre('tracking_parameter')
  }
  if (url.source.sourceId !== satz.sourceId || url.source.sourceClass !== 'official_authority') {
    return sperre('url_source_mismatch')
  }

  const retrievedAt = instantLesen(material.retrievedAt)
  if (!retrievedAt) return sperre('invalid_retrieved_at')
  const uhrMs = uhrLesen(uhr)
  if (uhrMs == null) return sperre('invalid_validation_clock')
  if (Date.parse(retrievedAt) > uhrMs) return sperre('retrieved_at_in_future')

  if (typeof material.sourceSnapshot !== 'string') return sperre('invalid_source_snapshot')

  const representation = contentRepresentationFromRegistry(registry, url.canonicalUrl)
  if (!representation.ok || url.canonicalUrl !== representation.value.expectedFinalUrl
    || material.contentType !== representation.value.expectedMediaType) return sperre('content_identity_mismatch')
  const identity = contentIdentityBinding(representation.value)
  const sourceFingerprintProtocol = material.sourceSnapshot.length > 65_536 ? 2 : 1
  const sourceContentHash = sourceFingerprintProtocol === 2
    ? officialTruthChDeSourceFingerprintV2Allowed(registry, identity, url.canonicalUrl, material.contentType)
      ? officialTruthSourceFingerprintV2(material.sourceSnapshot, {
        ...identity,
        canonicalUrl: url.canonicalUrl,
        contentType: material.contentType,
      })
      : null
    : evidenceQuellenFingerprint(material.sourceSnapshot)
  if (!sourceContentHash) return sperre('invalid_source_snapshot')
  const belegMaterial: EvidenceQuellenmaterial = Object.freeze({
    contentType: representation.value.expectedMediaType,
    canonicalUrl: url.canonicalUrl,
    retrievedAt,
    sourceSnapshot: material.sourceSnapshot,
  })
  return Object.freeze({
    ...identity,
    identitySchema: 2,
    contentType: representation.value.expectedMediaType,
    status: 'retrieved_material',
    requestKey: entscheidung.requestKey,
    ruleScopeKey: entscheidung.ruleScopeKey,
    sourceId: url.source.sourceId,
    canonicalUrl: url.canonicalUrl,
    retrievedAt,
    sourceContentHash,
    ...(sourceFingerprintProtocol === 2 ? { sourceFingerprintProtocol: 2 as const } : {}),
    material: belegMaterial,
  })
}
