// lib/commercial-provenance/waehrung.ts
//
// Requested vs quoted. Keine automatische Conversion. Kein erfundener Kurs.

import type { CommercialCurrencyStatus, CommercialProvenanceFehler } from '@/lib/commercial-provenance/domain'
import { commercialWaehrungLesen } from '@/lib/commercial-provenance/lesen'

export function commercialWaehrungPruefen(opts: {
  requestedCurrency: string | null | undefined
  quotedCurrency: string | null | undefined
  convertedAmount: number | null | undefined
  convertedCurrency: string | null | undefined
  conversionEvidence: unknown
}):
  | {
      ok: true
      requestedCurrency: string | null
      quotedCurrency: string | null
      status: CommercialCurrencyStatus
    }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  const hatConversionVersuch =
    opts.convertedAmount != null ||
    (typeof opts.convertedCurrency === 'string' && opts.convertedCurrency.trim() !== '') ||
    opts.conversionEvidence !== undefined
  if (hatConversionVersuch) {
    return {
      ok: false,
      fehler: [{ code: 'conversion_without_evidence', path: 'conversionEvidence' }],
    }
  }

  const requested = commercialWaehrungLesen(opts.requestedCurrency)
  const quoted = commercialWaehrungLesen(opts.quotedCurrency)
  if (requested === 'invalid' || quoted === 'invalid') {
    return {
      ok: false,
      fehler: [{ code: 'invalid_currency', path: requested === 'invalid' ? 'requestedCurrency' : 'quotedCurrency' }],
    }
  }

  if (!requested || !quoted) {
    return { ok: true, requestedCurrency: requested, quotedCurrency: quoted, status: 'unknown' }
  }
  return {
    ok: true,
    requestedCurrency: requested,
    quotedCurrency: quoted,
    status: requested === quoted ? 'matched' : 'mismatch',
  }
}

export function commercialWaehrungBewerten(opts: {
  requestedCurrency: string | null
  quotedCurrency: string | null
}): CommercialCurrencyStatus {
  if (!opts.requestedCurrency || !opts.quotedCurrency) return 'unknown'
  return opts.requestedCurrency === opts.quotedCurrency ? 'matched' : 'mismatch'
}
