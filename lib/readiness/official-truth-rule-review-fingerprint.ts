// lib/readiness/official-truth-rule-review-fingerprint.ts
//
// Deterministische Identität eines neu belegten Regel-Prüfpakets.
// Der Aufrufer liefert nur die ursprüngliche Paket-Eingabe. Das Paket
// wird neu gebaut. Ein mitgeliefertes Paket oder ein mitgelieferter
// Hash ist keine Identität. Die Identität bindet Prüfstoff, einschliesslich
// des schon angenommenen Gültigkeitsfensters. Sie ist nur eine Prüfsumme.
// Sie ist keine Anmeldung, keine Berechtigung, keine Prüferidentität,
// kein AAL, keine Fähigkeit, keine Freigabe, kein Serverzeuge, keine
// Annahme und keine Official Truth. Die freie Extraktionsnotiz bleibt
// draussen. Eine angenommene Regel bleibt draussen.

import { contentIdentityBinding, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  OFFICIAL_TRUTH_REVIEW_UNHASHED_SUPPORT_KEYS,
  officialTruthRegelReviewPacket,
  type OfficialTruthRegelReviewPacketErgebnis,
  type OfficialTruthRegelReviewPacketSperrgrund,
} from '@/lib/readiness/official-truth-rule-review-packet'

type RegelReviewPacket = Extract<OfficialTruthRegelReviewPacketErgebnis, { status: 'rule_review_packet' }>

const PRAEFIX = 'review-packet:v3:'
const HEX64 = /^[a-f0-9]{64}$/

const PROVENIENZ_FELDER = [
  'versionId',
  'sourceId',
  'canonicalUrl',
  'retrievedAt',
  'sourceContentHash',
  'validFrom',
  'validUntil',
] as const

export type OfficialTruthCompactReviewProvenance = ContentIdentityBinding & {
  readonly identitySchema: 2
  readonly sourceFingerprintProtocol?: 2 | 3
  readonly contentType: string
  readonly versionId: string
  readonly sourceId: string
  readonly canonicalUrl: string
  readonly retrievedAt: string
  readonly sourceContentHash: string
  readonly validFrom: string | null
  readonly validUntil: string | null
}

type Identitaet =
  | { readonly ok: true; readonly digest: string; readonly canonical: string; readonly preimage: unknown; readonly ruleScopeKey: string; readonly supportVersionIds: readonly string[] }
  | { readonly ok: false; readonly reason: OfficialTruthRegelReviewPacketSperrgrund }

/**
 * `rule_review_packet_fingerprint` ist die Prüfsumme des Prüfpakets.
 * Sie enthält weder Schnappschuss, URL, Inhaltshash, Vorschlag,
 * Extraktionsnotiz noch eine angenommene Regel. Der Schlüssel vergibt
 * nichts.
 */
export type OfficialTruthRegelReviewFingerprintErgebnis =
  | {
      readonly status: 'rule_review_packet_fingerprint'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly supportVersionIds: readonly string[]
    }
  | { readonly status: 'blocked'; readonly reason: OfficialTruthRegelReviewPacketSperrgrund }

function sperre(reason: OfficialTruthRegelReviewPacketSperrgrund): OfficialTruthRegelReviewFingerprintErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function text(wert: unknown): string | null {
  return typeof wert === 'string' && wert.length > 0 ? wert : null
}

function vergleich(links: string, rechts: string): number {
  return links < rechts ? -1 : links > rechts ? 1 : 0
}

function kanonisieren(wert: unknown): { ok: true; wert: unknown } | { ok: false } {
  if (wert === null) return { ok: true, wert: null }
  const art = typeof wert
  if (art === 'string' || art === 'boolean') return { ok: true, wert }
  if (art === 'number') return Number.isFinite(wert) ? { ok: true, wert } : { ok: false }
  if (Array.isArray(wert)) {
    const liste: unknown[] = []
    for (const eintrag of wert) {
      const kind = kanonisieren(eintrag)
      if (!kind.ok) return kind
      liste.push(kind.wert)
    }
    return { ok: true, wert: liste }
  }
  if (art !== 'object') return { ok: false }
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return { ok: false }
  const satz = wert as Record<string, unknown>
  const aus: Record<string, unknown> = {}
  for (const name of Object.keys(satz).sort()) {
    const kind = kanonisieren(satz[name])
    if (!kind.ok) return kind
    aus[name] = kind.wert
  }
  return { ok: true, wert: aus }
}

/** Übernimmt nur den schon normalisierten Wert. Kein zweites Gültigkeitslesen. */
function fenster(wert: unknown): string | null | undefined {
  if (wert === null) return null
  return text(wert) ?? undefined
}

function provenienz(support: OfficialTruthCompactReviewProvenance): OfficialTruthCompactReviewProvenance | null {
  const versionId = text(support.versionId)
  const sourceId = text(support.sourceId)
  const canonicalUrl = text(support.canonicalUrl)
  const retrievedAt = text(support.retrievedAt)
  const sourceContentHash = text(support.sourceContentHash)
  const validFrom = fenster(support.validFrom)
  const validUntil = fenster(support.validUntil)
  if (!versionId || !sourceId || !canonicalUrl || !retrievedAt || !sourceContentHash) return null
  if (validFrom === undefined || validUntil === undefined) return null
  if (support.sourceFingerprintProtocol !== undefined && support.sourceFingerprintProtocol !== 2) return null
  return { ...contentIdentityBinding(support), identitySchema: 2,
    ...(support.sourceFingerprintProtocol === 2 ? { sourceFingerprintProtocol: 2 as const } : {}),
    contentType: support.contentType,
    versionId, sourceId, canonicalUrl, retrievedAt, sourceContentHash, validFrom, validUntil }
}

function feldVergleich(links: string | null, rechts: string | null): number {
  if (links === rechts) return 0
  if (links === null) return -1
  if (rechts === null) return 1
  return vergleich(links, rechts)
}

function provenienzVergleich(links: OfficialTruthCompactReviewProvenance, rechts: OfficialTruthCompactReviewProvenance): number {
  const protocolOrder = (links.sourceFingerprintProtocol === 2 ? 2 : 1) - (rechts.sourceFingerprintProtocol === 2 ? 2 : 1)
  if (protocolOrder !== 0) return protocolOrder
  for (const feld of PROVENIENZ_FELDER) {
    const unterschied = feldVergleich(links[feld], rechts[feld])
    if (unterschied !== 0) return unterschied
  }
  return 0
}

/** Pure checksum seam over validated compact values; never issues authority or a packet. */
export function officialTruthReviewIdentityV3(
  kandidat: Pick<RegelReviewPacket['kandidat'], 'scope' | 'key' | 'factKind' | 'evidenceQuality' | 'supportVersionIds' | 'proposal'>,
  supports: readonly OfficialTruthCompactReviewProvenance[],
): Identitaet {
  const ruleScopeKey = text(kandidat.key)
  if (!ruleScopeKey) return { ok: false, reason: 'invalid_scope' }
  if (!Array.isArray(kandidat.supportVersionIds) || kandidat.supportVersionIds.length === 0) {
    return { ok: false, reason: 'invalid_support' }
  }
  const supportVersionIds = [...kandidat.supportVersionIds]
  if (supportVersionIds.some((id) => !text(id))) return { ok: false, reason: 'invalid_support' }
  supportVersionIds.sort(vergleich)

  const provenienzen: OfficialTruthCompactReviewProvenance[] = []
  for (const support of supports) {
    const eintrag = provenienz(support)
    if (!eintrag) return { ok: false, reason: 'invalid_support' }
    provenienzen.push(eintrag)
  }
  provenienzen.sort(provenienzVergleich)
  const ids = provenienzen.map((eintrag) => eintrag.versionId)
  if (ids.length !== supportVersionIds.length || ids.some((id, index) => id !== supportVersionIds[index])) {
    return { ok: false, reason: 'support_mismatch' }
  }

  const form = kanonisieren({
    v: 3,
    candidate: {
      scope: kandidat.scope,
      key: ruleScopeKey,
      factKind: kandidat.factKind,
      evidenceQuality: kandidat.evidenceQuality,
      supportVersionIds,
      proposal: kandidat.proposal,
    },
    supports: provenienzen,
  })
  if (!form.ok) return { ok: false, reason: 'invalid_fact' }
  let kanonisch: string
  try {
    kanonisch = JSON.stringify(form.wert)
  } catch {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (!kanonisch) return { ok: false, reason: 'invalid_fact' }
  const digest = sha256Hex(kanonisch)
  if (!HEX64.test(digest)) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, digest, canonical: kanonisch, preimage: form.wert, ruleScopeKey, supportVersionIds }
}

const SUPPORT_PFLICHT = [
  'sourceId', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion',
  'identityProfileId', 'identityProfileVersion', 'identitySchema', 'sourceFingerprintProtocol',
  'contentType', 'versionId', 'canonicalUrl', 'retrievedAt', 'sourceContentHash', 'validFrom', 'validUntil',
] as const
const KANDIDAT_PFLICHT = ['scope', 'key', 'factKind', 'evidenceQuality', 'supportVersionIds', 'proposal'] as const

/** Copies own data without calling getters. Accessors, symbols and foreign prototypes fail. */
function datenKopie(wert: unknown, tiefe: number): { ok: true; wert: unknown } | { ok: false } {
  if (tiefe > 12) return { ok: false }
  if (wert === null || typeof wert === 'string' || typeof wert === 'boolean') return { ok: true, wert }
  if (typeof wert === 'number') return Number.isFinite(wert) ? { ok: true, wert } : { ok: false }
  if (typeof wert !== 'object') return { ok: false }
  const prototyp = Object.getPrototypeOf(wert)
  if (Array.isArray(wert)) {
    if (prototyp !== Array.prototype) return { ok: false }
    const laenge = Object.getOwnPropertyDescriptor(wert, 'length')
    if (!laenge || !('value' in laenge) || typeof laenge.value !== 'number') return { ok: false }
    for (const key of Reflect.ownKeys(wert)) {
      if (key === 'length') continue
      if (typeof key !== 'string' || !/^\d+$/.test(key) || Number(key) >= laenge.value) return { ok: false }
    }
    const liste: unknown[] = []
    for (let index = 0; index < laenge.value; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(wert, String(index))
      if (!descriptor || !('value' in descriptor)) return { ok: false }
      const kind = datenKopie(descriptor.value, tiefe + 1)
      if (!kind.ok) return kind
      liste.push(kind.wert)
    }
    return { ok: true, wert: liste }
  }
  if (prototyp !== Object.prototype) return { ok: false }
  const aus: Record<string, unknown> = {}
  for (const key of Reflect.ownKeys(wert)) {
    if (typeof key !== 'string') return { ok: false }
    const descriptor = Object.getOwnPropertyDescriptor(wert, key)
    if (!descriptor || !('value' in descriptor)) return { ok: false }
    const kind = datenKopie(descriptor.value, tiefe + 1)
    if (!kind.ok) return kind
    aus[key] = kind.wert
  }
  return { ok: true, wert: aus }
}

function geschlosseneSchluessel(satz: Record<string, unknown>, pflicht: readonly string[], optional: readonly string[]): boolean {
  const namen = Object.keys(satz)
  if (namen.some((name) => !pflicht.includes(name) && !optional.includes(name))) return false
  return pflicht.every((name) => Object.hasOwn(satz, name))
}

function provenienzAktuell(support: OfficialTruthCompactReviewProvenance): OfficialTruthCompactReviewProvenance | null {
  const kopie = datenKopie(support, 0)
  if (!kopie.ok || !kopie.wert || typeof kopie.wert !== 'object' || Array.isArray(kopie.wert)) return null
  const satz = kopie.wert as Record<string, unknown>
  if (!geschlosseneSchluessel(satz, SUPPORT_PFLICHT, OFFICIAL_TRUTH_REVIEW_UNHASHED_SUPPORT_KEYS)) return null
  if (satz.identitySchema !== 2 || satz.sourceFingerprintProtocol !== 3) return null
  if (OFFICIAL_TRUTH_REVIEW_UNHASHED_SUPPORT_KEYS.some((name) => name in satz && typeof satz[name] !== 'string')) return null
  const versionId = text(satz.versionId)
  const sourceId = text(satz.sourceId)
  const canonicalUrl = text(satz.canonicalUrl)
  const retrievedAt = text(satz.retrievedAt)
  const sourceContentHash = text(satz.sourceContentHash)
  const contentType = text(satz.contentType)
  const validFrom = fenster(satz.validFrom)
  const validUntil = fenster(satz.validUntil)
  if (!versionId || !sourceId || !canonicalUrl || !retrievedAt || !sourceContentHash || !contentType) return null
  if (validFrom === undefined || validUntil === undefined) return null
  const binding = contentIdentityBinding(satz as OfficialTruthCompactReviewProvenance)
  if (Object.values(binding).some((feld) => typeof feld !== 'string' && typeof feld !== 'number')) return null
  return {
    ...binding,
    identitySchema: 2,
    sourceFingerprintProtocol: 3,
    contentType,
    versionId,
    sourceId,
    canonicalUrl,
    retrievedAt,
    sourceContentHash,
    validFrom,
    validUntil,
  }
}

/**
 * Checksum for exactly one Protocol 3 current-request support.
 * Review structure stays v3. The preimage adds usage and the source marker.
 * The key prefix stays `review-packet:v3:`; the digest is not an old alias.
 */
export function officialTruthReviewIdentityCurrentRequest(
  kandidat: Pick<RegelReviewPacket['kandidat'], 'scope' | 'key' | 'factKind' | 'evidenceQuality' | 'supportVersionIds' | 'proposal'>,
  supports: readonly OfficialTruthCompactReviewProvenance[],
): Identitaet {
  if (supports.length !== 1) return { ok: false, reason: 'invalid_support' }
  const kopie = datenKopie(kandidat, 0)
  if (!kopie.ok || !kopie.wert || typeof kopie.wert !== 'object' || Array.isArray(kopie.wert)) {
    return { ok: false, reason: 'invalid_support' }
  }
  const satz = kopie.wert as Record<string, unknown>
  if (!geschlosseneSchluessel(satz, KANDIDAT_PFLICHT, ['lifecycle', 'validationState'])) {
    return { ok: false, reason: 'invalid_support' }
  }
  if ('lifecycle' in satz && satz.lifecycle !== 'candidate') return { ok: false, reason: 'invalid_support' }
  if ('validationState' in satz && satz.validationState !== 'pending') return { ok: false, reason: 'invalid_support' }
  if (satz.evidenceQuality !== 'explicit_primary_statement') return { ok: false, reason: 'invalid_support' }
  const ruleScopeKey = text(satz.key)
  if (!ruleScopeKey) return { ok: false, reason: 'invalid_scope' }
  if (!Array.isArray(satz.supportVersionIds) || satz.supportVersionIds.length !== 1) {
    return { ok: false, reason: 'invalid_support' }
  }
  const supportVersionIds = [...satz.supportVersionIds]
  if (supportVersionIds.some((id) => !text(id))) return { ok: false, reason: 'invalid_support' }
  const eintrag = provenienzAktuell(supports[0]!)
  if (!eintrag || eintrag.versionId !== supportVersionIds[0]) return { ok: false, reason: 'invalid_support' }
  const form = kanonisieren({
    v: 3,
    usage: 'current_request_only',
    sourceFingerprintProtocol: 3,
    candidate: {
      scope: satz.scope,
      key: ruleScopeKey,
      factKind: satz.factKind,
      evidenceQuality: satz.evidenceQuality,
      supportVersionIds,
      proposal: satz.proposal,
    },
    supports: [eintrag],
  })
  if (!form.ok) return { ok: false, reason: 'invalid_fact' }
  let kanonisch: string
  try {
    kanonisch = JSON.stringify(form.wert)
  } catch {
    return { ok: false, reason: 'invalid_fact' }
  }
  if (!kanonisch) return { ok: false, reason: 'invalid_fact' }
  const digest = sha256Hex(kanonisch)
  if (!HEX64.test(digest)) return { ok: false, reason: 'invalid_fact' }
  return { ok: true, digest, canonical: kanonisch, preimage: form.wert, ruleScopeKey, supportVersionIds }
}

/**
 * Bildet die Identität eines Prüfpakets.
 * Die Eingabe ist dieselbe Hülle wie bei `officialTruthRegelReviewPacket`:
 * Stützen aus Abrufumschlag, Uhr und Extraktion, plus Faktart,
 * Evidence-Qualität und Vorschlag. Das Paket wird hier neu erzeugt.
 * Die kanonische Form enthält die Kandidatenzelle und die Provenienz
 * der Stützen, einschliesslich des angenommenen Gültigkeitsfensters.
 * Der Seitenschnappschuss und die freie Extraktionsnotiz bleiben draussen.
 * `sourceContentHash` ist die schon vorhandene Materialidentität.
 * Ein älteres Präfix ist kein Alias dieses Schlüssels.
 */
export function officialTruthRegelReviewPacketFingerprint(eingabe: unknown): OfficialTruthRegelReviewFingerprintErgebnis {
  const ergebnis = officialTruthRegelReviewPacket(eingabe)
  if (ergebnis.status !== 'rule_review_packet') return ergebnis
  const markers = ergebnis.supports.map((support) => support.sourceFingerprintProtocol)
  if (markers.some((marker) => marker === 3)) {
    if (ergebnis.supports.length !== 1 || markers.some((marker) => marker !== 3)) return sperre('invalid_support')
    if (ergebnis.kandidat.evidenceQuality !== 'explicit_primary_statement') return sperre('invalid_support')
    const aktuell = officialTruthReviewIdentityCurrentRequest(ergebnis.kandidat, ergebnis.supports)
    if (!aktuell.ok) return sperre(aktuell.reason)
    return Object.freeze({
      status: 'rule_review_packet_fingerprint',
      reviewPacketKey: `${PRAEFIX}${aktuell.digest}`,
      ruleScopeKey: aktuell.ruleScopeKey,
      supportVersionIds: Object.freeze(aktuell.supportVersionIds),
    })
  }
  const gebaut = officialTruthReviewIdentityV3(ergebnis.kandidat, ergebnis.supports)
  if (!gebaut.ok) return sperre(gebaut.reason)
  return Object.freeze({
    status: 'rule_review_packet_fingerprint',
    reviewPacketKey: `${PRAEFIX}${gebaut.digest}`,
    ruleScopeKey: gebaut.ruleScopeKey,
    supportVersionIds: Object.freeze(gebaut.supportVersionIds),
  })
}
