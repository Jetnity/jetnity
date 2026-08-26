// lib/commercial-provenance/commercial-provenance.test.ts
//
// Adversarial Contract-Tests für S5-A. Grün darf keine Fake-Truth kodieren.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ActivityOption } from '@/lib/activities/domain'
import {
  COMMERCIAL_AFFILIATE_STATUS,
  COMMERCIAL_AKTEURE,
  COMMERCIAL_AKTEUR_QUELLEN,
  COMMERCIAL_AMOUNT_STATUS,
  COMMERCIAL_AVAILABILITY,
  COMMERCIAL_CURRENCY_STATUS,
  COMMERCIAL_FRESHNESS,
  COMMERCIAL_KONFLIKT_STATUS,
  COMMERCIAL_NUTZER_QUELLEN,
  COMMERCIAL_PERSISTENZ,
  COMMERCIAL_PROVENANCE_DOMAINS,
  COMMERCIAL_PROVENANCE_FEHLER,
  COMMERCIAL_PROVIDER_QUELLEN,
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  COMMERCIAL_SOURCE_KINDS,
  COMMERCIAL_STATUS,
  commercialAffiliateLesen,
  commercialAngeboteVergleichen,
  commercialBesteQuelleWaehlen,
  commercialFrischheitBewerten,
  commercialIdentitaetAusOption,
  commercialNutzerangabePruefen,
  commercialPersistiertenSnapshotPruefen,
  commercialProviderQuotePruefen,
  commercialProvenancePruefen,
  commercialQuellePruefen,
  commercialTruthUebernehmen,
  commercialWaehrungBewerten,
  darfCommercialAlsCurrentQuoteErscheinen,
  istCommercialLiveBehauptungErlaubt,
  optionMitCommercialProvenance,
} from '@/lib/commercial-provenance'
import { OPTION_DIREKT } from '@/lib/flights/fixtures/optionen'
import type { HotelOption } from '@/lib/hotels/domain'
import type { MobilityOption } from '@/lib/mobility/domain'
import type { RentalCarOption } from '@/lib/rental-cars/domain'
import type { TripItem } from '@/types/trips'

const NOW = Date.parse('2026-08-26T12:00:00.000Z')
const RETRIEVED = '2026-08-26T11:00:00.000Z'
const FRESH_UNTIL = '2026-08-26T13:00:00.000Z'
const OBSERVED = '2026-08-26T11:30:00.000Z'

function quote(teil: Record<string, unknown> = {}) {
  return {
    domain: 'flights',
    providerId: 'duffel',
    sourceKind: 'live_api',
    externalRef: 'off_1',
    retrievedAt: RETRIEVED,
    freshUntil: FRESH_UNTIL,
    requestedCurrency: 'CHF',
    quotedCurrency: 'CHF',
    amount: 892.5,
    persistenz: 'ephemeral',
    vergleichsschluessel: 'ZRH-BKK-2026-11-01',
    ...teil,
  }
}

function nutzerangabe(teil: Record<string, unknown> = {}) {
  return {
    domain: 'flights',
    sourceKind: 'user_intake',
    observedAt: OBSERVED,
    requestedCurrency: 'CHF',
    quotedCurrency: 'CHF',
    amount: 200,
    persistenz: 'snapshot',
    ...teil,
  }
}

function providerOk(teil: Record<string, unknown> = {}) {
  const pruefung = commercialProviderQuotePruefen(quote(teil), { nowMs: NOW })
  assert.equal(pruefung.ok, true)
  if (!pruefung.ok) throw new Error('erwartete gültige Provider-Provenance')
  return pruefung
}

function snapshotOk(teil: Record<string, unknown> = {}) {
  const pruefung = commercialPersistiertenSnapshotPruefen(
    quote({ sourceKind: 'persisted_snapshot', persistenz: 'snapshot', ...teil }),
    { nowMs: NOW },
  )
  assert.equal(pruefung.ok, true)
  if (!pruefung.ok) throw new Error('erwartete gültige Snapshot-Provenance')
  return pruefung
}

function hotelOption(): HotelOption {
  return {
    id: 'h1',
    provider: 'hotelbeds',
    externalRef: 'htl-1',
    name: 'Test',
    punkt: { lat: 1, lon: 2 },
    quartierName: null,
    adresse: null,
    sterne: null,
    bewertung: null,
    bewertungenAnzahl: null,
    preisGesamt: 200,
    preisProNacht: 100,
    preisWaehrung: 'CHF',
    steuernEnthalten: null,
    stornierbar: null,
    stornierungBis: null,
    fruehstueckEnthalten: null,
    zimmerName: null,
  }
}

describe('S5-A Commercial Provenance Contract', () => {
  test('gültige Live-Quote bleibt current, aber niemals live', () => {
    const pruefung = providerOk()
    assert.equal(pruefung.bewertung.freshnessStatus, 'current')
    assert.equal(pruefung.bewertung.commercialStatus, 'current')
    assert.equal(pruefung.bewertung.currencyStatus, 'matched')
    assert.equal(pruefung.bewertung.affiliateStatus, 'unknown')
    assert.equal(pruefung.bewertung.conversionEvidence, 'absent')
    assert.equal(pruefung.bewertung.snapshotIstNieLive, true)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(pruefung.bewertung.darfRequestedWaehrungAlsVergleichbarGelten, true)
    assert.equal(pruefung.provenance.referenz.referenzIstKeinTrust, true)
    assert.equal(pruefung.provenance.quelle.providerBelegt, true)
    assert.equal(istCommercialLiveBehauptungErlaubt(pruefung.provenance), false)
    assert.equal(darfCommercialAlsCurrentQuoteErscheinen(pruefung), true)
    assert.equal('available' in pruefung.bewertung, false)
  })

  test('ungültiger retrievedAt wird abgewiesen', () => {
    for (const retrievedAt of [null, '', '2026-08-26', 'gestern', '2026-13-40T99:99:99Z']) {
      const pruefung = commercialProviderQuotePruefen(quote({ retrievedAt }), { nowMs: NOW })
      assert.equal(pruefung.ok, false)
      if (pruefung.ok) continue
      assert.equal(pruefung.fehler[0]?.code, 'invalid_retrieved_at')
    }
  })

  test('retrievedAt unplausibel in der Zukunft wird abgewiesen', () => {
    const zukunft = new Date(NOW + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS + 1).toISOString()
    const pruefung = commercialProviderQuotePruefen(quote({ retrievedAt: zukunft, freshUntil: null }), { nowMs: NOW })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'retrieved_at_in_future')
  })

  test('kleine Uhrenabweichung innerhalb 5 Minuten bleibt zulässig', () => {
    const leichtZukunft = new Date(NOW + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS).toISOString()
    const pruefung = commercialProviderQuotePruefen(
      quote({ retrievedAt: leichtZukunft, freshUntil: null }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, true)
    if (!pruefung.ok) return
    assert.equal(pruefung.bewertung.freshnessStatus, 'unknown')
  })

  test('freshUntil vor retrievedAt wird abgewiesen', () => {
    const pruefung = commercialProviderQuotePruefen(
      quote({ retrievedAt: '2026-08-26T11:00:00.000Z', freshUntil: '2026-08-26T10:59:59.000Z' }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'fresh_until_before_retrieved_at')
  })

  test('fehlende Source-Provenance wird abgewiesen', () => {
    const ohneKind = commercialProviderQuotePruefen(quote({ sourceKind: null }), { nowMs: NOW })
    assert.equal(ohneKind.ok, false)
    if (ohneKind.ok) return
    assert.equal(ohneKind.fehler[0]?.code, 'missing_source')
  })

  test('requestedCurrency != quotedCurrency bleibt mismatch ohne Conversion', () => {
    const pruefung = providerOk({ requestedCurrency: 'CHF', quotedCurrency: 'EUR' })
    assert.equal(pruefung.bewertung.currencyStatus, 'mismatch')
    assert.equal(pruefung.bewertung.conversionEvidence, 'absent')
    assert.equal(pruefung.bewertung.darfRequestedWaehrungAlsVergleichbarGelten, false)
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(commercialWaehrungBewerten({ requestedCurrency: 'CHF', quotedCurrency: 'EUR' }), 'mismatch')
  })

  test('keine automatische Währungsumrechnung ohne echte Conversion-Evidence', () => {
    const mitBetrag = commercialProviderQuotePruefen(quote({ convertedAmount: 800 }), { nowMs: NOW })
    const mitEvidence = commercialProviderQuotePruefen(quote({ conversionEvidence: { rate: 0.9 } }), { nowMs: NOW })
    assert.equal(mitBetrag.ok, false)
    assert.equal(mitEvidence.ok, false)
    if (mitBetrag.ok || mitEvidence.ok) return
    assert.equal(mitBetrag.fehler[0]?.code, 'conversion_without_evidence')
    assert.equal(mitEvidence.fehler[0]?.code, 'conversion_without_evidence')
  })

  test('stale Snapshot darf nicht als current/live erscheinen', () => {
    const pruefung = snapshotOk({ freshUntil: '2026-08-26T11:30:00.000Z' })
    assert.equal(pruefung.bewertung.freshnessStatus, 'stale')
    assert.equal(pruefung.bewertung.commercialStatus, 'stale')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.provenance.persistenz, 'snapshot')
    assert.equal(darfCommercialAlsCurrentQuoteErscheinen(pruefung), false)
  })

  test('fehlende Freshness bleibt unknown statt erfunden', () => {
    const pruefung = providerOk({ freshUntil: null })
    assert.equal(pruefung.bewertung.freshnessStatus, 'unknown')
    assert.equal(pruefung.bewertung.commercialStatus, 'unknown')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
    assert.equal(commercialFrischheitBewerten({ retrievedAt: RETRIEVED, freshUntil: null, nowMs: NOW }), 'unknown')
  })

  test('fehlende Affiliate-Provenance bleibt unknown, absent nur explizit', () => {
    const fehlend = providerOk()
    const unknown = providerOk({ affiliate: { status: 'unknown' } })
    const absent = providerOk({ affiliate: { status: 'absent' } })
    assert.equal(fehlend.bewertung.affiliateStatus, 'unknown')
    assert.equal(unknown.bewertung.affiliateStatus, 'unknown')
    assert.equal(absent.bewertung.affiliateStatus, 'absent')
    const leerPresent = commercialAffiliateLesen({ status: 'present' })
    assert.equal(leerPresent.ok, false)
  })

  test('Affiliate present nur mit Beleg', () => {
    const pruefung = providerOk({ affiliate: { partnerId: 'partner-1', clickId: 'clk-1' } })
    assert.equal(pruefung.bewertung.affiliateStatus, 'present')
    assert.equal(pruefung.provenance.affiliate.partnerId, 'partner-1')
  })

  test('persistierter Snapshot ist auch bei current Freshness nicht live', () => {
    const pruefung = snapshotOk()
    assert.equal(pruefung.bewertung.freshnessStatus, 'current')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.bewertung.snapshotIstNieLive, true)
  })

  test('fehlender Preis bleibt partial, unavailable bleibt eigener Status', () => {
    const partial = providerOk({ amount: null })
    const unavailable = providerOk({ availability: 'unavailable' })
    const erfundenAvailable = providerOk({ availability: 'available' })
    assert.equal(partial.bewertung.commercialStatus, 'partial')
    assert.equal(unavailable.bewertung.commercialStatus, 'unavailable')
    assert.equal(unavailable.bewertung.availabilityStatus, 'unavailable')
    assert.equal(erfundenAvailable.bewertung.availabilityStatus, 'unknown')
    assert.equal(erfundenAvailable.bewertung.commercialStatus, 'current')
  })

  test('observedAt darf retrievedAt nicht still ersetzen', () => {
    const pruefung = commercialProviderQuotePruefen(
      quote({ observedAt: '2026-08-26T10:00:00.000Z' }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'observed_at_mismatch')
  })

  test('persisted_snapshot ohne Snapshot-Persistenz wird abgewiesen', () => {
    const pruefung = commercialQuellePruefen({
      providerId: 'duffel',
      sourceKind: 'persisted_snapshot',
      sourceLabel: null,
      persistenz: 'ephemeral',
    })
    assert.equal(pruefung.ok, false)
  })

  test('Taxonomie bleibt getrennt und enthält kein available-boolean', () => {
    assert.deepEqual(COMMERCIAL_FRESHNESS, ['current', 'stale', 'unknown'])
    assert.deepEqual(COMMERCIAL_STATUS, ['current', 'stale', 'unknown', 'unavailable', 'error', 'partial'])
    assert.deepEqual(COMMERCIAL_AVAILABILITY, ['unavailable', 'unknown'])
    assert.ok(!COMMERCIAL_SOURCE_KINDS.includes('assistant' as never))
    assert.ok(COMMERCIAL_AKTEURE.includes('assistant'))
    assert.ok(COMMERCIAL_CURRENCY_STATUS.includes('mismatch'))
    assert.ok(COMMERCIAL_AFFILIATE_STATUS.includes('absent'))
    assert.ok(COMMERCIAL_PERSISTENZ.includes('snapshot'))
    assert.ok(COMMERCIAL_AMOUNT_STATUS.includes('quoted'))
    assert.ok(COMMERCIAL_KONFLIKT_STATUS.includes('conflict'))
    assert.ok(COMMERCIAL_PROVENANCE_DOMAINS.includes('rental_cars'))
    assert.ok(COMMERCIAL_PROVENANCE_FEHLER.includes('actor_source_forbidden'))
    assert.ok(COMMERCIAL_PROVENANCE_FEHLER.includes('bind_domain_mismatch'))
    assert.ok(COMMERCIAL_PROVENANCE_FEHLER.includes('provider_truth_overwrite_forbidden'))
    assert.ok(COMMERCIAL_PROVENANCE_FEHLER.includes('amount_status_widerspruch'))
    assert.deepEqual([...COMMERCIAL_AKTEUR_QUELLEN.user], [...COMMERCIAL_NUTZER_QUELLEN])
    assert.ok(COMMERCIAL_PROVIDER_QUELLEN.includes('live_api'))
  })
})

describe('S5A-TL-01 Actor/Source-Trust', () => {
  test('1 actor=user + sourceKind=live_api wird abgewiesen', () => {
    const pruefung = commercialProvenancePruefen(quote({ sourceKind: 'live_api' }), {
      nowMs: NOW,
      akteur: 'user',
    })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'actor_source_forbidden')
  })

  test('2 actor=user + sourceKind=provider_snapshot wird abgewiesen', () => {
    const pruefung = commercialProvenancePruefen(quote({ sourceKind: 'provider_snapshot' }), {
      nowMs: NOW,
      akteur: 'user',
    })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'actor_source_forbidden')
  })

  test('3 actor=user + sourceKind=persisted_snapshot wird abgewiesen', () => {
    const pruefung = commercialProvenancePruefen(
      quote({ sourceKind: 'persisted_snapshot', persistenz: 'snapshot' }),
      { nowMs: NOW, akteur: 'user' },
    )
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'actor_source_forbidden')
  })

  test('4 assistant/llm bleiben von Hard-Truth ausgeschlossen', () => {
    const bestehend = providerOk().provenance
    for (const akteur of ['assistant', 'llm'] as const) {
      const pruefung = commercialTruthUebernehmen({
        bestehend,
        vorschlag: quote({ amount: 1 }),
        akteur,
        nowMs: NOW,
      })
      assert.equal(pruefung.ok, false)
      if (pruefung.ok) continue
      assert.equal(pruefung.fehler[0]?.code, 'assistant_overwrite_forbidden')
    }
    const alsQuelle = commercialProviderQuotePruefen(quote({ sourceKind: 'assistant' }), { nowMs: NOW })
    assert.equal(alsQuelle.ok, false)
    if (alsQuelle.ok) return
    assert.equal(alsQuelle.fehler[0]?.code, 'assistant_source_forbidden')
  })

  test('5 untrusted Prüfen ohne explizite Trust-Herkunft erzeugt keine Provider-Hard-Truth', () => {
    const pruefung = commercialProvenancePruefen(quote())
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'missing_actor')
  })

  test('6 provider_adapter + zulässige Provider-Quelle ist der gültige Pfad', () => {
    const live = commercialProviderQuotePruefen(quote(), { nowMs: NOW })
    const snapshot = commercialProviderQuotePruefen(quote({ sourceKind: 'provider_snapshot' }), { nowMs: NOW })
    assert.equal(live.ok, true)
    assert.equal(snapshot.ok, true)
    if (!live.ok || !snapshot.ok) return
    assert.equal(live.provenance.quelle.providerBelegt, true)
    assert.equal(snapshot.provenance.quelle.sourceKind, 'provider_snapshot')
  })
})

describe('S5A-TL-03 User-Intake/Manual ohne Fake-Provider', () => {
  test('7 echtes user_intake ohne Provider-ID ist zulässig, aber keine Provider-Truth', () => {
    const pruefung = commercialNutzerangabePruefen(nutzerangabe(), { nowMs: NOW })
    assert.equal(pruefung.ok, true)
    if (!pruefung.ok) return
    assert.equal(pruefung.provenance.quelle.providerId, null)
    assert.equal(pruefung.provenance.quelle.providerBelegt, false)
    assert.equal(pruefung.provenance.quelle.sourceKind, 'user_intake')
    assert.equal(pruefung.provenance.zeit.retrievedAt, null)
    assert.equal(pruefung.provenance.zeit.observedAt, OBSERVED)
    assert.equal(pruefung.bewertung.freshnessStatus, 'unknown')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
  })

  test('8 manual ohne Provider-ID ist zulässig, aber keine Provider-Truth', () => {
    const pruefung = commercialNutzerangabePruefen(nutzerangabe({ sourceKind: 'manual' }), { nowMs: NOW })
    assert.equal(pruefung.ok, true)
    if (!pruefung.ok) return
    assert.equal(pruefung.provenance.quelle.providerBelegt, false)
    assert.equal(pruefung.provenance.quelle.sourceKind, 'manual')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
  })

  test('9 user_intake darf kein freshUntil / Provider-Live-Evidence / retrievedAt erfinden', () => {
    const fresh = commercialNutzerangabePruefen(nutzerangabe({ freshUntil: FRESH_UNTIL }), { nowMs: NOW })
    const retrieved = commercialNutzerangabePruefen(nutzerangabe({ retrievedAt: RETRIEVED }), { nowMs: NOW })
    const fakeProvider = commercialNutzerangabePruefen(nutzerangabe({ providerId: 'user' }), { nowMs: NOW })
    assert.equal(fresh.ok, false)
    assert.equal(retrieved.ok, false)
    assert.equal(fakeProvider.ok, false)
    if (fresh.ok || retrieved.ok || fakeProvider.ok) return
    assert.equal(fresh.fehler[0]?.code, 'fresh_until_ohne_quellenbeleg')
    assert.equal(retrieved.fehler[0]?.code, 'retrieved_at_ohne_abruf')
    assert.equal(fakeProvider.fehler[0]?.code, 'erfundene_provider_id')
  })

  test('providergebundene Quelle ohne Provider-ID bleibt fail-closed', () => {
    const pruefung = commercialProviderQuotePruefen(quote({ providerId: null }), { nowMs: NOW })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'missing_provider')
  })
})

describe('S5A-TL-05 Replacement-Contract', () => {
  test('User-Intake darf bestehende Provider-Hard-Truth nicht ersetzen', () => {
    const bestehend = providerOk().provenance
    const pruefung = commercialTruthUebernehmen({
      bestehend,
      vorschlag: nutzerangabe(),
      akteur: 'user',
      nowMs: NOW,
    })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'provider_truth_overwrite_forbidden')
  })

  test('Manual darf bestehende Provider-Hard-Truth nicht ersetzen', () => {
    const bestehend = providerOk().provenance
    const pruefung = commercialTruthUebernehmen({
      bestehend,
      vorschlag: nutzerangabe({ sourceKind: 'manual' }),
      akteur: 'user',
      nowMs: NOW,
    })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'provider_truth_overwrite_forbidden')
  })

  test('Provider-Refresh bleibt nur identitätsgebunden zulässig', () => {
    const bestehend = providerOk().provenance
    const refresh = commercialTruthUebernehmen({
      bestehend,
      vorschlag: quote({ amount: 910 }),
      akteur: 'provider_adapter',
      nowMs: NOW,
    })
    const fremd = commercialTruthUebernehmen({
      bestehend,
      vorschlag: quote({ providerId: 'andere', externalRef: 'off_fremd' }),
      akteur: 'provider_adapter',
      nowMs: NOW,
    })
    assert.equal(refresh.ok, true)
    assert.equal(fremd.ok, false)
    if (fremd.ok) return
    assert.equal(fremd.fehler[0]?.code, 'refresh_identity_mismatch')
  })
})

describe('S5A-TL-06 User-Intake ohne Provider-ID', () => {
  test('user_intake mit providerId duffel wird abgewiesen', () => {
    const pruefung = commercialNutzerangabePruefen(nutzerangabe({ providerId: 'duffel' }), { nowMs: NOW })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'provider_id_ohne_providerquelle')
    const quelle = commercialQuellePruefen({
      providerId: 'duffel',
      sourceKind: 'user_intake',
      sourceLabel: null,
      persistenz: 'snapshot',
    })
    assert.equal(quelle.ok, false)
  })
})

describe('S5A-TL-07 Affiliate Missing bleibt unknown', () => {
  test('fehlende Affiliate-Daten werden nicht zu absent', () => {
    const leer = commercialAffiliateLesen(undefined)
    const nullisch = commercialAffiliateLesen(null)
    const ohneFelder = commercialAffiliateLesen({})
    assert.equal(leer.ok, true)
    assert.equal(nullisch.ok, true)
    assert.equal(ohneFelder.ok, true)
    if (!leer.ok || !nullisch.ok || !ohneFelder.ok) return
    assert.equal(leer.affiliate.status, 'unknown')
    assert.equal(nullisch.affiliate.status, 'unknown')
    assert.equal(ohneFelder.affiliate.status, 'unknown')
  })
})

describe('S5A-TL-08 Amount/Status-Widerspruch', () => {
  test('widersprüchliche amount/amountStatus-Kombinationen werden abgewiesen', () => {
    const missingMitBetrag = commercialProviderQuotePruefen(
      quote({ amount: 120, amountStatus: 'missing' }),
      { nowMs: NOW },
    )
    const quotedOhneBetrag = commercialProviderQuotePruefen(
      quote({ amount: null, amountStatus: 'quoted' }),
      { nowMs: NOW },
    )
    const errorMitBetrag = commercialProviderQuotePruefen(
      quote({ amount: 120, amountStatus: 'error' }),
      { nowMs: NOW },
    )
    assert.equal(missingMitBetrag.ok, false)
    assert.equal(quotedOhneBetrag.ok, false)
    assert.equal(errorMitBetrag.ok, false)
    if (missingMitBetrag.ok || quotedOhneBetrag.ok || errorMitBetrag.ok) return
    assert.equal(missingMitBetrag.fehler[0]?.code, 'amount_status_widerspruch')
    assert.equal(quotedOhneBetrag.fehler[0]?.code, 'amount_status_widerspruch')
    assert.equal(errorMitBetrag.fehler[0]?.code, 'amount_status_widerspruch')
  })
})

describe('S5A-TL-02 Option/Provenance-Binding', () => {
  test('10 Flight-Option + Hotel-Provenance wird abgewiesen', () => {
    const hotelProvenance = commercialProviderQuotePruefen(
      quote({ domain: 'hotels', providerId: 'hotelbeds', externalRef: 'htl-1' }),
      { nowMs: NOW },
    )
    assert.equal(hotelProvenance.ok, true)
    if (!hotelProvenance.ok) return
    const bindung = optionMitCommercialProvenance(OPTION_DIREKT, hotelProvenance.provenance, 'flights')
    assert.equal(bindung.ok, false)
    if (bindung.ok) return
    assert.equal(bindung.fehler[0]?.code, 'bind_domain_mismatch')
  })

  test('11 Provider A Option + Provider B Provenance wird abgewiesen', () => {
    const andere = providerOk({ providerId: 'andere' })
    const bindung = optionMitCommercialProvenance(OPTION_DIREKT, andere.provenance, 'flights')
    assert.equal(bindung.ok, false)
    if (bindung.ok) return
    assert.equal(bindung.fehler[0]?.code, 'bind_provider_mismatch')
  })

  test('12 gleiche Provider-ID aber falsche externalRef wird abgewiesen', () => {
    const andereRef = providerOk({ externalRef: 'off_andere' })
    const bindung = optionMitCommercialProvenance(OPTION_DIREKT, andereRef.provenance, 'flights')
    assert.equal(bindung.ok, false)
    if (bindung.ok) return
    assert.equal(bindung.fehler[0]?.code, 'bind_ref_mismatch')
  })

  test('13 korrekt gebundene Option + Provenance ist zulässig', () => {
    const provenance = providerOk({
      providerId: OPTION_DIREKT.provider,
      externalRef: OPTION_DIREKT.externalRef,
    }).provenance
    const bindung = optionMitCommercialProvenance(OPTION_DIREKT, provenance, 'flights')
    assert.equal(bindung.ok, true)
    if (!bindung.ok) return
    assert.equal(bindung.option.commercialProvenance.quelle.providerId, 'duffel')
    assert.equal(bindung.option.priceAmount, OPTION_DIREKT.priceAmount)
  })
})

describe('S5A-TL-04 provider-scoped externalRef', () => {
  test('14 gleiche Ref zweier Provider ohne vergleichsschluessel ist insufficient_evidence', () => {
    const a = providerOk({
      providerId: 'duffel',
      externalRef: '123',
      vergleichsschluessel: null,
    }).provenance
    const b = providerOk({
      providerId: 'andere',
      externalRef: '123',
      vergleichsschluessel: null,
    }).provenance
    const konflikt = commercialAngeboteVergleichen([a, b])
    assert.equal(konflikt.status, 'insufficient_evidence')
    assert.equal(commercialBesteQuelleWaehlen([a, b]), null)
  })

  test('15 echter gemeinsamer vergleichsschluessel zwischen zwei Providerquellen ist vergleichbar', () => {
    const a = providerOk({ providerId: 'duffel', amount: 900, vergleichsschluessel: 'ZRH-BKK-2026-11-01' }).provenance
    const b = providerOk({ providerId: 'andere', amount: 1100, vergleichsschluessel: 'ZRH-BKK-2026-11-01' }).provenance
    const konflikt = commercialAngeboteVergleichen([a, b])
    assert.equal(konflikt.status, 'conflict')
    assert.ok(konflikt.widersprueche.some((eintrag) => eintrag.feld === 'amount'))
  })

  test('providerinterner Vergleich über Provider + externalRef bleibt möglich', () => {
    const a = providerOk({
      providerId: 'duffel',
      externalRef: 'off_1',
      amount: 900,
      vergleichsschluessel: null,
    }).provenance
    const b = providerOk({
      providerId: 'duffel',
      externalRef: 'off_1',
      amount: 900,
      vergleichsschluessel: null,
    }).provenance
    assert.equal(commercialAngeboteVergleichen([a, b]).status, 'consistent')
  })
})

describe('S5-A Wahrheitszustände bleiben getrennt', () => {
  test('16 current/stale/unknown/unavailable/error/partial bleiben getrennt', () => {
    assert.equal(providerOk().bewertung.commercialStatus, 'current')
    assert.equal(snapshotOk({ freshUntil: '2026-08-26T11:30:00.000Z' }).bewertung.commercialStatus, 'stale')
    assert.equal(providerOk({ freshUntil: null }).bewertung.commercialStatus, 'unknown')
    assert.equal(providerOk({ availability: 'unavailable' }).bewertung.commercialStatus, 'unavailable')
    assert.equal(providerOk({ amountStatus: 'error', amount: null }).bewertung.commercialStatus, 'error')
    assert.equal(providerOk({ amount: null }).bewertung.commercialStatus, 'partial')
  })

  test('17 keine erfundene Live-Verfügbarkeit', () => {
    const live = providerOk({ availability: 'available' })
    const nutzer = commercialNutzerangabePruefen(nutzerangabe({ availability: 'unavailable' }), { nowMs: NOW })
    assert.equal(live.bewertung.availabilityStatus, 'unknown')
    assert.equal(live.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(nutzer.ok, true)
    if (!nutzer.ok) return
    assert.equal(nutzer.bewertung.availabilityStatus, 'unknown')
  })

  test('18 Währungs-Mismatch bleibt sauber getrennt', () => {
    const pruefung = providerOk({ requestedCurrency: 'CHF', quotedCurrency: 'EUR' })
    assert.equal(pruefung.bewertung.currencyStatus, 'mismatch')
    assert.equal(pruefung.bewertung.conversionEvidence, 'absent')
    assert.equal(pruefung.bewertung.darfRequestedWaehrungAlsVergleichbarGelten, false)
  })

  test('19 Snapshot bleibt niemals live', () => {
    const current = snapshotOk()
    const stale = snapshotOk({ freshUntil: '2026-08-26T11:30:00.000Z' })
    assert.equal(current.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(stale.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(current.bewertung.snapshotIstNieLive, true)
  })
})

describe('S5-A Anbindung an bestehende Domänen ohne Schema-Mutation', () => {
  test('20 Flight-/Hotel-/Activity-/Transport-Optionen bleiben ohne retrievedAt gültig komponierbar', () => {
    const hotel = hotelOption()
    const activity: ActivityOption = {
      id: 'a1',
      provider: 'viator',
      externalRef: 'act-1',
      title: 'Tour',
      description: null,
      locationName: null,
      punkt: null,
      dauerMinuten: null,
      timeslot: null,
      preis: 40,
      preisWaehrung: 'CHF',
      bewertung: null,
      bewertungenAnzahl: null,
      stornierbar: null,
      kategorien: [],
      tags: [],
    }
    const mobility: MobilityOption = {
      id: 'm1',
      provider: 'sbb',
      externalRef: 'sbb-1',
      mode: 'rail',
      title: 'IC',
      originName: 'Zürich',
      destinationName: 'Bern',
      originPlaceId: null,
      destinationPlaceId: null,
      startsOn: null,
      startsAt: null,
      endsOn: null,
      endsAt: null,
      durationMinutes: null,
      changes: null,
      preis: 20,
      preisWaehrung: 'CHF',
      stornierbar: null,
      connectionRef: null,
      operatorName: null,
    }
    const rental: RentalCarOption = {
      id: 'r1',
      provider: 'europcar',
      externalRef: 'car-1',
      title: 'Compact',
      pickupName: 'ZRH',
      dropoffName: 'ZRH',
      pickupPlaceId: null,
      dropoffPlaceId: null,
      pickupOn: null,
      pickupAt: null,
      dropoffOn: null,
      dropoffAt: null,
      vehicleClass: 'compact',
      transmission: 'automatic',
      supplierName: null,
      preis: 240,
      preisIstGesamt: true,
      preisWaehrung: 'CHF',
      kilometerRegel: null,
      tankRegel: null,
      storno: null,
      kaution: null,
      kautionWaehrung: null,
    }

    assert.equal('retrievedAt' in OPTION_DIREKT, false)
    assert.equal('freshUntil' in hotel, false)
    assert.equal(commercialIdentitaetAusOption(OPTION_DIREKT).providerId, 'duffel')
    const flug = optionMitCommercialProvenance(
      OPTION_DIREKT,
      providerOk({ providerId: 'duffel', externalRef: OPTION_DIREKT.externalRef }).provenance,
      'flights',
    )
    const hotelProvenance = commercialProviderQuotePruefen(
      quote({ domain: 'hotels', providerId: 'hotelbeds', externalRef: 'htl-1' }),
      { nowMs: NOW },
    )
    assert.equal(hotelProvenance.ok, true)
    if (!hotelProvenance.ok) return
    const hotelBindung = optionMitCommercialProvenance(hotel, hotelProvenance.provenance, 'hotels')
    assert.equal(flug.ok, true)
    assert.equal(hotelBindung.ok, true)
    assert.equal(commercialIdentitaetAusOption(activity).providerId, 'viator')
    assert.equal(commercialIdentitaetAusOption(mobility).providerId, 'sbb')
    assert.equal(commercialIdentitaetAusOption(rental).providerId, 'europcar')
  })

  test('persistierte trip_items haben weiterhin keine Commercial-Provenance-Felder', () => {
    const item: TripItem = {
      id: 'item-1',
      dayId: null,
      stageId: null,
      kind: 'flight',
      title: 'Flug',
      note: null,
      position: 1,
      startsOn: null,
      startsAt: null,
      endsOn: null,
      endsAt: null,
      priceAmount: 120,
      priceCurrency: 'CHF',
      provider: 'duffel',
      externalRef: 'off_1',
      bookingUrl: null,
      bookingStatus: 'unconfirmed',
      bookingSource: null,
      bookingConfirmedAt: null,
      mobilityMode: null,
      originPlaceId: null,
      destinationPlaceId: null,
      originName: null,
      destinationName: null,
      connectionRef: null,
      mobilityChanges: null,
      mobilityEvidence: null,
      rentalSupplier: null,
      vehicleClass: null,
      transmission: null,
      rentalEvidence: null,
    }
    assert.equal('retrievedAt' in item, false)
    assert.equal('freshUntil' in item, false)
    assert.equal('quotedCurrency' in item, false)
    assert.equal('requestedCurrency' in item, false)
    assert.equal(item.priceAmount, 120)
  })
})
