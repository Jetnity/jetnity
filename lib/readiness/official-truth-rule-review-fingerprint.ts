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
  return { ...contentIdentityBinding(support), identitySchema: 2, contentType: support.contentType,
    versionId, sourceId, canonicalUrl, retrievedAt, sourceContentHash, validFrom, validUntil }
}

function feldVergleich(links: string | null, rechts: string | null): number {
  if (links === rechts) return 0
  if (links === null) return -1
  if (rechts === null) return 1
  return vergleich(links, rechts)
}

function provenienzVergleich(links: OfficialTruthCompactReviewProvenance, rechts: OfficialTruthCompactReviewProvenance): number {
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
  const gebaut = officialTruthReviewIdentityV3(ergebnis.kandidat, ergebnis.supports)
  if (!gebaut.ok) return sperre(gebaut.reason)
  return Object.freeze({
    status: 'rule_review_packet_fingerprint',
    reviewPacketKey: `${PRAEFIX}${gebaut.digest}`,
    ruleScopeKey: gebaut.ruleScopeKey,
    supportVersionIds: Object.freeze(gebaut.supportVersionIds),
  })
}
