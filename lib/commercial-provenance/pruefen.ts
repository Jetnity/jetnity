// lib/commercial-provenance/pruefen.ts
//
// Fail-closed Commercial-Provenance-Prüfung.
// Kein impliziter system-Default. LLM/Assistant erzeugt keine Hard Truth.

import {
  type CommercialAkteur,
  type CommercialAvailability,
  type CommercialBewertung,
  type CommercialPruefung,
  type CommercialProvenance,
  type CommercialProvenanceFehler,
  type CommercialStatus,
} from '@/lib/commercial-provenance/domain'
import { commercialAffiliateLesen, commercialQuellePruefen } from '@/lib/commercial-provenance/quelle'
import { commercialZeitPruefen } from '@/lib/commercial-provenance/frischheit'
import { commercialEingabeLesen, istBekannterAmountStatus } from '@/lib/commercial-provenance/lesen'
import { commercialAkteurQuellePruefen } from '@/lib/commercial-provenance/trust'
import { commercialWaehrungPruefen } from '@/lib/commercial-provenance/waehrung'

function availabilityLesen(
  wert: string | null | undefined,
  providerBelegt: boolean,
): CommercialAvailability {
  if (providerBelegt && wert === 'unavailable') return 'unavailable'
  return 'unknown'
}

function amountLesen(opts: {
  amount: number | null | undefined
  amountStatus: string | null | undefined
}):
  | { ok: true; amount: number | null; amountStatus: 'quoted' | 'missing' | 'error' }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  if (opts.amount != null && !Number.isFinite(opts.amount)) {
    return { ok: false, fehler: [{ code: 'invalid_amount', path: 'amount' }] }
  }
  if (opts.amount != null && opts.amount < 0) {
    return { ok: false, fehler: [{ code: 'invalid_amount', path: 'amount' }] }
  }
  if (opts.amountStatus && !istBekannterAmountStatus(opts.amountStatus)) {
    return { ok: false, fehler: [{ code: 'invalid_amount', path: 'amountStatus' }] }
  }
  if (opts.amountStatus === 'error') {
    return { ok: true, amount: opts.amount ?? null, amountStatus: 'error' }
  }
  if (opts.amount == null) {
    return { ok: true, amount: null, amountStatus: 'missing' }
  }
  return { ok: true, amount: opts.amount, amountStatus: 'quoted' }
}

function commercialStatusAbleiten(opts: {
  freshness: CommercialBewertung['freshnessStatus']
  amountStatus: CommercialProvenance['preis']['amountStatus']
  availability: CommercialAvailability
}): CommercialStatus {
  if (opts.amountStatus === 'error') return 'error'
  if (opts.availability === 'unavailable') return 'unavailable'
  if (opts.freshness === 'stale') return 'stale'
  if (opts.amountStatus === 'missing') return 'partial'
  if (opts.freshness === 'unknown') return 'unknown'
  return 'current'
}

function bewertungAus(
  provenance: CommercialProvenance,
  freshness: CommercialBewertung['freshnessStatus'],
  currency: CommercialBewertung['currencyStatus'],
): CommercialBewertung {
  const commercialStatus = commercialStatusAbleiten({
    freshness,
    amountStatus: provenance.preis.amountStatus,
    availability: provenance.availabilityStatus,
  })
  const darfAlsCurrentQuoteDargestelltWerden =
    provenance.quelle.providerBelegt &&
    commercialStatus === 'current' &&
    freshness === 'current' &&
    provenance.preis.amountStatus === 'quoted'
  return {
    freshnessStatus: freshness,
    currencyStatus: currency,
    affiliateStatus: provenance.affiliate.status,
    commercialStatus,
    availabilityStatus: provenance.availabilityStatus,
    conversionEvidence: 'absent',
    snapshotIstNieLive: true,
    darfAlsCurrentQuoteDargestelltWerden,
    darfAlsLiveDargestelltWerden: false,
    darfRequestedWaehrungAlsVergleichbarGelten: currency === 'matched' && darfAlsCurrentQuoteDargestelltWerden,
  }
}

export function commercialProvenancePruefen(
  wert: unknown,
  opts?: { nowMs?: number; akteur?: CommercialAkteur },
): CommercialPruefung {
  const eingabe = commercialEingabeLesen(wert)
  if (!eingabe) {
    return { ok: false, fehler: [{ code: 'missing_source', path: '$' }] }
  }

  const quelle = commercialQuellePruefen({
    providerId: eingabe.providerId,
    sourceKind: eingabe.sourceKind,
    sourceLabel: eingabe.sourceLabel,
    persistenz: eingabe.persistenz,
  })
  if (!quelle.ok) return quelle

  const trust = commercialAkteurQuellePruefen({
    akteur: opts?.akteur,
    sourceKind: quelle.sourceKind,
  })
  if (!trust.ok) return trust

  const zeit = commercialZeitPruefen({
    retrievedAt: eingabe.retrievedAt,
    observedAt: eingabe.observedAt,
    freshUntil: eingabe.freshUntil,
    sourceKind: quelle.sourceKind,
    nowMs: opts?.nowMs ?? Date.now(),
  })
  if (!zeit.ok) return zeit

  const waehrung = commercialWaehrungPruefen({
    requestedCurrency: eingabe.requestedCurrency,
    quotedCurrency: eingabe.quotedCurrency,
    convertedAmount: eingabe.convertedAmount,
    convertedCurrency: eingabe.convertedCurrency,
    conversionEvidence: eingabe.conversionEvidence,
  })
  if (!waehrung.ok) return waehrung

  const preis = amountLesen({ amount: eingabe.amount, amountStatus: eingabe.amountStatus })
  if (!preis.ok) return preis

  const affiliate = commercialAffiliateLesen(eingabe.affiliate)
  if (!affiliate.ok) return affiliate

  const provenance: CommercialProvenance = {
    domain: eingabe.domain,
    quelle: {
      providerId: quelle.providerId,
      providerBelegt: quelle.providerBelegt,
      sourceKind: quelle.sourceKind,
      sourceLabel: quelle.sourceLabel,
    },
    referenz: {
      externalRef: eingabe.externalRef ?? null,
      providerOfferId: eingabe.providerOfferId ?? null,
      referenzIstKeinTrust: true,
    },
    zeit: {
      retrievedAt: zeit.retrievedAt,
      observedAt: zeit.observedAt,
      freshUntil: zeit.freshUntil,
    },
    waehrung: {
      requestedCurrency: waehrung.requestedCurrency,
      quotedCurrency: waehrung.quotedCurrency,
    },
    preis: {
      amount: preis.amount,
      amountStatus: preis.amountStatus,
    },
    persistenz: quelle.persistenz,
    affiliate: affiliate.affiliate,
    availabilityStatus: availabilityLesen(eingabe.availability, quelle.providerBelegt),
    vergleichsschluessel: eingabe.vergleichsschluessel ?? null,
  }

  return {
    ok: true,
    provenance,
    bewertung: bewertungAus(provenance, zeit.freshness, waehrung.status),
  }
}

export function commercialProviderQuotePruefen(
  wert: unknown,
  opts?: { nowMs?: number },
): CommercialPruefung {
  return commercialProvenancePruefen(wert, { nowMs: opts?.nowMs, akteur: 'provider_adapter' })
}

export function commercialNutzerangabePruefen(
  wert: unknown,
  opts?: { nowMs?: number },
): CommercialPruefung {
  return commercialProvenancePruefen(wert, { nowMs: opts?.nowMs, akteur: 'user' })
}

export function commercialPersistiertenSnapshotPruefen(
  wert: unknown,
  opts?: { nowMs?: number },
): CommercialPruefung {
  return commercialProvenancePruefen(wert, { nowMs: opts?.nowMs, akteur: 'system' })
}

export function commercialTruthUebernehmen(opts: {
  bestehend: CommercialProvenance | null
  vorschlag: unknown
  akteur: unknown
  nowMs?: number
}): CommercialPruefung {
  if (opts.akteur === 'assistant' || opts.akteur === 'llm') {
    return { ok: false, fehler: [{ code: 'assistant_overwrite_forbidden', path: 'akteur' }] }
  }
  if (typeof opts.akteur !== 'string') {
    return { ok: false, fehler: [{ code: 'missing_actor', path: 'akteur' }] }
  }
  return commercialProvenancePruefen(opts.vorschlag, {
    nowMs: opts.nowMs,
    akteur: opts.akteur as CommercialAkteur,
  })
}

export function istCommercialLiveBehauptungErlaubt(_provenance: CommercialProvenance): false {
  return false
}

export function darfCommercialAlsCurrentQuoteErscheinen(pruefung: CommercialPruefung): boolean {
  return pruefung.ok && pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden
}
