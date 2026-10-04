// lib/readiness/official-truth-discovered-url-candidates.ts
//
// Prüft vorgeschlagene Paare aus Quellenkennung und URL.
// Diese Datei sucht nichts, ruft nichts ab und speichert nichts.
// Ein bestandenes Paar ist nur eine zulässige URL-Kandidatin.
// Es ist keine Candidate Evidence und keine Official Truth.
//
// Der Allowlist-Plan wird neu ausgeführt. Ein mitgelieferter Plan ist kein Feld.
// Die URL-Vertrauensgrenze bleibt die bestehende Registry-Auflösung.

import {
  officialTruthRechercheAusfuehrungsplan,
  type OfficialTruthRechercheAusfuehrungsplanSperrgrund,
  type OfficialTruthRechercheQuellenplan,
} from '@/lib/readiness/official-truth-research-execution-plan'
import { contentIdentityBinding, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { quellenInhaltRouten } from '@/lib/readiness/source-router'
import { quellenUrlAufloesen, type QuellenRegistry, type QuellenUrlFehler } from '@/lib/readiness/source-registry'

const UMSCHLAG_FELDER = ['request', 'registry', 'descriptors', 'candidates'] as const
const KANDIDAT_FELDER = ['sourceId', 'url'] as const
const MAX_KANDIDATEN = 16
const TIEFE_MAX = 8
const AMTLICH = 'official_authority' as const
const LIZENZ = 'licensed_evidence_provider' as const

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

/** Reine Tracking-Namen. `lang` und `ref` gehören nicht dazu. */
const TRACKING_NAMEN = new Set(['gclid', 'dclid', 'fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid'])

export type OfficialTruthUrlKandidatenSperrgrund =
  | OfficialTruthRechercheAusfuehrungsplanSperrgrund
  | 'content_not_eligible'
  | 'no_eligible_official_source'
  | 'invalid_envelope'
  | 'sensitive_personal_field'
  | 'invalid_candidates'
  | 'too_many_candidates'
  | 'invalid_candidate'
  | 'licensed_provider'
  | 'source_not_in_plan'
  | 'source_not_official_authority'
  | 'another_source_url'
  | 'domain_not_allowlisted'
  | 'tracking_parameter'
  | 'duplicate_canonical_url'
  | QuellenUrlFehler

/**
 * Eine URL, die zur Quellenkennung und zu ihrer registrierten Hostliste passt.
 * Keine Punktzahl, keine Rangfolge und kein Quellenname.
 */
export type OfficialTruthUrlKandidat = ContentIdentityBinding & {
  readonly sourceId: string
  readonly canonicalUrl: string
}

export type OfficialTruthUrlKandidatenErgebnis =
  | {
      readonly status: 'validated_url_candidates'
      readonly candidates: readonly OfficialTruthUrlKandidat[]
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthUrlKandidatenSperrgrund
    }

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function genaueSchluessel(satz: Record<string, unknown>, erlaubt: readonly string[]): boolean {
  const namen = Object.keys(satz)
  return namen.length === erlaubt.length && erlaubt.every((name) => Object.hasOwn(satz, name))
}

function vergleich(links: string, rechts: string): number {
  return links < rechts ? -1 : links > rechts ? 1 : 0
}

function sperre(reason: OfficialTruthUrlKandidatenSperrgrund): OfficialTruthUrlKandidatenErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function schluesselGrund(schluessel: string): OfficialTruthUrlKandidatenSperrgrund | null {
  if (PERSONEN_SCHLUESSEL.has(schluessel) || NOTIZ_SCHLUESSEL.has(schluessel)) return 'sensitive_personal_field'
  return null
}

/**
 * Persönliche Schlüssel werden nur als Grund gemeldet. Der Wert wird nicht übernommen.
 * Geteilte Registry-Objekte sind kein Zyklus. Ein Objekt in der eigenen Vorfahrkette ist eine.
 */
function baumPruefen(wert: unknown, vorfahren: object[]): OfficialTruthUrlKandidatenSperrgrund | null {
  if (vorfahren.length > TIEFE_MAX) return 'invalid_envelope'
  if (!wert || typeof wert !== 'object') return null
  if (vorfahren.includes(wert)) return 'invalid_envelope'
  vorfahren.push(wert)
  try {
    if (Array.isArray(wert)) {
      for (const eintrag of wert) {
        const grund = baumPruefen(eintrag, vorfahren)
        if (grund) return grund
      }
      return null
    }
    for (const [schluessel, kind] of Object.entries(wert)) {
      const grund = schluesselGrund(schluessel)
      if (grund) return grund
      const tiefer = baumPruefen(kind, vorfahren)
      if (tiefer) return tiefer
    }
    return null
  } finally {
    vorfahren.pop()
  }
}

function trackingName(name: string): boolean {
  const klein = name.toLowerCase()
  return klein.startsWith('utm_') || TRACKING_NAMEN.has(klein)
}

/**
 * Tracking bleibt am ursprünglichen Namen hängen.
 * Die Funktion entfernt keine Parameter und liefert keine bereinigte Adresse.
 */
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

function klasseVon(registry: unknown, sourceId: string): string | null {
  const satz = datensatz(registry)
  if (!satz || !Array.isArray(satz.sources)) return null
  for (const eintrag of satz.sources) {
    const quelle = datensatz(eintrag)
    if (!quelle || quelle.sourceId !== sourceId) continue
    return typeof quelle.sourceClass === 'string' ? quelle.sourceClass : null
  }
  return null
}

function hostGedeckt(host: string, domains: readonly string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

function kandidatLesen(wert: unknown): { sourceId: string; url: string } | null {
  const satz = datensatz(wert)
  if (!satz || !genaueSchluessel(satz, KANDIDAT_FELDER)) return null
  if (typeof satz.sourceId !== 'string' || typeof satz.url !== 'string') return null
  return { sourceId: satz.sourceId, url: satz.url }
}

function kandidatPruefen(
  registry: unknown,
  quellplan: readonly OfficialTruthRechercheQuellenplan[],
  roh: { sourceId: string; url: string },
  gesehen: Set<string>,
): OfficialTruthUrlKandidat | OfficialTruthUrlKandidatenSperrgrund {
  if (klasseVon(registry, roh.sourceId) === LIZENZ) return 'licensed_provider'
  const eintrag = quellplan.find((quelle) => quelle.sourceId === roh.sourceId)
  if (!eintrag) return 'source_not_in_plan'

  const url = quellenUrlAufloesen(registry as QuellenRegistry, roh.url)
  if (!url.ok) return url.reason
  if (url.source.sourceClass !== AMTLICH) return 'source_not_official_authority'
  if (url.source.sourceId !== roh.sourceId) return 'another_source_url'

  let host: string
  try {
    host = new URL(url.canonicalUrl).hostname.toLowerCase()
  } catch {
    return 'invalid_url'
  }
  if (!eintrag.domains.includes(url.domain) || !hostGedeckt(host, eintrag.domains)) return 'domain_not_allowlisted'
  if (hatTracking(roh.url) || hatTracking(url.canonicalUrl)) return 'tracking_parameter'

  const schluessel = `${roh.sourceId}\n${url.canonicalUrl}`
  if (gesehen.has(schluessel)) return 'duplicate_canonical_url'
  gesehen.add(schluessel)
  const content = quellenInhaltRouten(registry as QuellenRegistry, roh.sourceId, url.canonicalUrl)
  if (!content.ok) return content.reason
  return Object.freeze({ ...contentIdentityBinding(content.representation), canonicalUrl: url.canonicalUrl })
}

/**
 * Prüft einen Umschlag aus Forschungsanfrage, Registry, Deskriptoren und
 * vorgeschlagenen Paaren `{ sourceId, url }`.
 * Der Allowlist-Plan wird mit diesen drei Eingaben neu ausgeführt.
 * Ein mitgeliefertes Planobjekt ist kein zugelassenes Feld.
 */
export function officialTruthEntdeckteUrlKandidatenPruefen(eingabe: unknown): OfficialTruthUrlKandidatenErgebnis {
  const satz = datensatz(eingabe)
  if (!satz) return sperre('invalid_envelope')
  const baum = baumPruefen(satz, [])
  if (baum) return sperre(baum)
  if (!genaueSchluessel(satz, UMSCHLAG_FELDER)) return sperre('invalid_envelope')

  const plan = officialTruthRechercheAusfuehrungsplan(satz.request, satz.registry, satz.descriptors)
  if (plan.status === 'blocked_invalid') return sperre(plan.reason)
  if (plan.status !== 'ready') return sperre('no_eligible_official_source')

  if (!Array.isArray(satz.candidates)) return sperre('invalid_candidates')
  if (satz.candidates.length > MAX_KANDIDATEN) return sperre('too_many_candidates')

  const gesehen = new Set<string>()
  const kandidaten: OfficialTruthUrlKandidat[] = []
  for (const eintrag of satz.candidates) {
    const roh = kandidatLesen(eintrag)
    if (!roh) return sperre('invalid_candidate')
    const ergebnis = kandidatPruefen(satz.registry, plan.sources, roh, gesehen)
    if (typeof ergebnis === 'string') return sperre(ergebnis)
    kandidaten.push(ergebnis)
  }

  kandidaten.sort((links, rechts) => vergleich(links.sourceId, rechts.sourceId) || vergleich(links.canonicalUrl, rechts.canonicalUrl))
  return Object.freeze({
    status: 'validated_url_candidates',
    candidates: Object.freeze(kandidaten),
  })
}
