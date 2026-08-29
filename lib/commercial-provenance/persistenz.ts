// lib/commercial-provenance/persistenz.ts
//
// S5-B Write-Authority und Legacy-Projektion (ADR-0197 / ADR-0198).
// Frei von Next, Supabase, Provider-SDKs und `process.env`.
//
// Persistiert wird nur S5-A-Evidence. CommercialBewertung entsteht zur Lesezeit.
// Client-sourceKind/persistenz werden nicht übernommen. Der kontrollierte Pfad
// mintet ausschließlich persisted_snapshot/snapshot nach S5-A-Validierung.

import {
  type CommercialAkteur,
  type CommercialProvenance,
  type CommercialProvenanceDomain,
  type CommercialProvenanceFehler,
} from '@/lib/commercial-provenance/domain'
import { commercialPersistiertenSnapshotPruefen, commercialProviderQuotePruefen } from '@/lib/commercial-provenance/pruefen'

export const TRIP_ITEM_COMMERCIAL_KINDS = ['flight', 'stay', 'activity', 'transfer', 'rental_car'] as const
export type TripItemCommercialKind = (typeof TRIP_ITEM_COMMERCIAL_KINDS)[number]

export const TRIP_ITEM_KIND_TO_COMMERCIAL_DOMAIN = {
  flight: 'flights',
  stay: 'hotels',
  activity: 'activities',
  transfer: 'mobility',
  rental_car: 'rental_cars',
} as const satisfies Record<TripItemCommercialKind, CommercialProvenanceDomain>

export type CommercialLegacyFeldvertrag = 'trusted_only' | 'user_intake' | 'forbidden'

export type CommercialLegacyGuard = {
  price: CommercialLegacyFeldvertrag
  provider: CommercialLegacyFeldvertrag
}

/**
 * Guard-Matrix aus ADR-0197 §5. Flight-Guard bleibt die Untergrenze.
 * Stay/Activity: ganze Legacy-Menge untrusted. Transfer/Rental: nur Preis
 * als User-Intake. Note: keine Domain, keine Handelsfelder.
 */
export const COMMERCIAL_LEGACY_GUARD = {
  flight: { price: 'trusted_only', provider: 'trusted_only' },
  stay: { price: 'trusted_only', provider: 'trusted_only' },
  activity: { price: 'trusted_only', provider: 'trusted_only' },
  transfer: { price: 'user_intake', provider: 'trusted_only' },
  rental_car: { price: 'user_intake', provider: 'trusted_only' },
  note: { price: 'forbidden', provider: 'forbidden' },
} as const satisfies Record<string, CommercialLegacyGuard>

export type CommercialLegacyProjektion = {
  price_amount: number | null
  price_currency: string | null
  provider: string | null
  external_ref: string | null
}

export type CommercialSnapshotMintFehler = {
  ok: false
  fehler: CommercialProvenanceFehler[]
}

export type CommercialSnapshotMintOk = {
  ok: true
  provenance: CommercialProvenance
  projektion: CommercialLegacyProjektion
}

export type CommercialSnapshotMint = CommercialSnapshotMintOk | CommercialSnapshotMintFehler

function istCommercialKind(kind: string): kind is TripItemCommercialKind {
  return (TRIP_ITEM_COMMERCIAL_KINDS as readonly string[]).includes(kind)
}

export function commercialDomainFuerTripItemKind(
  kind: string,
): CommercialProvenanceDomain | null {
  if (!istCommercialKind(kind)) return null
  return TRIP_ITEM_KIND_TO_COMMERCIAL_DOMAIN[kind]
}

export function commercialLegacyGuardFuerKind(kind: string): CommercialLegacyGuard | null {
  if (kind in COMMERCIAL_LEGACY_GUARD) {
    return COMMERCIAL_LEGACY_GUARD[kind as keyof typeof COMMERCIAL_LEGACY_GUARD]
  }
  return null
}

function quoteObjekt(wert: unknown): Record<string, unknown> | null {
  return wert && typeof wert === 'object' && !Array.isArray(wert) ? (wert as Record<string, unknown>) : null
}

function providerIdentitaetGleich(bestehend: CommercialProvenance, vorschlag: CommercialProvenance): boolean {
  if (bestehend.domain !== vorschlag.domain) return false
  if (!bestehend.quelle.providerId || bestehend.quelle.providerId !== vorschlag.quelle.providerId) {
    return false
  }
  const bestehendeRef = bestehend.referenz.externalRef?.trim() || null
  const vorschlagRef = vorschlag.referenz.externalRef?.trim() || null
  if (!bestehendeRef || !vorschlagRef) return false
  return bestehendeRef === vorschlagRef
}

/**
 * Kontrollierter Mint: serverseitig geprüfte Provider-Quote → persisted_snapshot.
 * Client-sourceKind, persistenz und Actor werden nicht übernommen.
 */
export function commercialSnapshotFuerPersistenzMinten(opts: {
  tripItemKind: string
  quote: unknown
  bestehend?: CommercialProvenance | null
  akteur?: unknown
  nowMs?: number
}): CommercialSnapshotMint {
  if (opts.tripItemKind === 'note') {
    return { ok: false, fehler: [{ code: 'bind_domain_mismatch', path: 'kind' }] }
  }

  const domain = commercialDomainFuerTripItemKind(opts.tripItemKind)
  if (!domain) {
    return { ok: false, fehler: [{ code: 'bind_domain_mismatch', path: 'kind' }] }
  }

  if (opts.akteur != null && opts.akteur !== 'provider_adapter') {
    const code =
      opts.akteur === 'assistant' || opts.akteur === 'llm'
        ? 'assistant_overwrite_forbidden'
        : opts.akteur === 'user' || opts.akteur === 'system'
          ? 'actor_source_forbidden'
          : 'missing_actor'
    return { ok: false, fehler: [{ code, path: 'akteur' }] }
  }

  const roh = quoteObjekt(opts.quote)
  if (!roh) {
    return { ok: false, fehler: [{ code: 'missing_source', path: '$' }] }
  }

  const sourceKind = typeof roh.sourceKind === 'string' ? roh.sourceKind.trim() : ''
  if (sourceKind === 'user_intake' || sourceKind === 'manual') {
    return { ok: false, fehler: [{ code: 'actor_source_forbidden', path: 'sourceKind' }] }
  }

  if (roh.domain != null && roh.domain !== domain) {
    return { ok: false, fehler: [{ code: 'bind_domain_mismatch', path: 'domain' }] }
  }

  const quotePruefung = commercialProviderQuotePruefen(
    {
      ...roh,
      domain,
      sourceKind: sourceKind === 'provider_snapshot' ? 'provider_snapshot' : 'live_api',
      persistenz: 'ephemeral',
    },
    { nowMs: opts.nowMs },
  )
  if (!quotePruefung.ok) return quotePruefung

  const snapshotPruefung = commercialPersistiertenSnapshotPruefen(
    {
      domain: quotePruefung.provenance.domain,
      providerId: quotePruefung.provenance.quelle.providerId,
      sourceKind: 'persisted_snapshot',
      sourceLabel: quotePruefung.provenance.quelle.sourceLabel,
      externalRef: quotePruefung.provenance.referenz.externalRef,
      providerOfferId: quotePruefung.provenance.referenz.providerOfferId,
      retrievedAt: quotePruefung.provenance.zeit.retrievedAt,
      observedAt: quotePruefung.provenance.zeit.observedAt,
      freshUntil: quotePruefung.provenance.zeit.freshUntil,
      requestedCurrency: quotePruefung.provenance.waehrung.requestedCurrency,
      quotedCurrency: quotePruefung.provenance.waehrung.quotedCurrency,
      amount: quotePruefung.provenance.preis.amount,
      amountStatus: quotePruefung.provenance.preis.amountStatus,
      persistenz: 'snapshot',
      availability: quotePruefung.provenance.availabilityStatus,
      affiliate: quotePruefung.provenance.affiliate,
      vergleichsschluessel: quotePruefung.provenance.vergleichsschluessel,
    },
    { nowMs: opts.nowMs },
  )
  if (!snapshotPruefung.ok) return snapshotPruefung

  if (opts.bestehend?.quelle.providerBelegt) {
    if (!providerIdentitaetGleich(opts.bestehend, snapshotPruefung.provenance)) {
      return { ok: false, fehler: [{ code: 'refresh_identity_mismatch', path: 'referenz' }] }
    }
  }

  return {
    ok: true,
    provenance: snapshotPruefung.provenance,
    projektion: commercialLegacyProjektionAusSnapshot(snapshotPruefung.provenance),
  }
}

/**
 * Eine kontrollierte Display-Projektion. booking_url wird nicht erfunden.
 * Ohne Provenance-Zeile gibt es keine Provider-Hard-Truth.
 */
export function commercialLegacyProjektionAusSnapshot(
  provenance: CommercialProvenance,
): CommercialLegacyProjektion {
  const quoted = provenance.waehrung.quotedCurrency
  const amount = provenance.preis.amount
  const preisVollstaendig = amount != null && Boolean(quoted)
  return {
    price_amount: preisVollstaendig ? amount : null,
    price_currency: preisVollstaendig ? quoted : null,
    provider: provenance.quelle.providerId,
    external_ref: provenance.referenz.externalRef,
  }
}

export function commercialLegacyOhneProvenanceIstUnknown(
  provenance: CommercialProvenance | null | undefined,
): true {
  void provenance
  return true
}

export function commercialIstProviderHardTruth(provenance: CommercialProvenance | null | undefined): boolean {
  return Boolean(
    provenance &&
      provenance.quelle.providerBelegt &&
      provenance.quelle.sourceKind === 'persisted_snapshot' &&
      provenance.persistenz === 'snapshot',
  )
}

export function commercialAkteurIstWriteActor(akteur: CommercialAkteur): akteur is 'provider_adapter' {
  return akteur === 'provider_adapter'
}
