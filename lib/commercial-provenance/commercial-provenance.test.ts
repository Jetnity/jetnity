// lib/commercial-provenance/commercial-provenance.test.ts
//
// Adversarial Contract-Tests für S5-A. Grün darf keine Fake-Truth kodieren.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ActivityOption } from '@/lib/activities/domain'
import {
  COMMERCIAL_AFFILIATE_STATUS,
  COMMERCIAL_AKTEURE,
  COMMERCIAL_AMOUNT_STATUS,
  COMMERCIAL_AVAILABILITY,
  COMMERCIAL_CURRENCY_STATUS,
  COMMERCIAL_FRESHNESS,
  COMMERCIAL_KONFLIKT_STATUS,
  COMMERCIAL_PERSISTENZ,
  COMMERCIAL_PROVENANCE_DOMAINS,
  COMMERCIAL_PROVENANCE_FEHLER,
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  COMMERCIAL_SOURCE_KINDS,
  COMMERCIAL_STATUS,
  commercialAffiliateLesen,
  commercialAngeboteVergleichen,
  commercialBesteQuelleWaehlen,
  commercialFrischheitBewerten,
  commercialIdentitaetAusOption,
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

function ok(teil: Record<string, unknown> = {}) {
  const pruefung = commercialProvenancePruefen(quote(teil), { nowMs: NOW, akteur: 'system' })
  assert.equal(pruefung.ok, true)
  if (!pruefung.ok) throw new Error('erwartete gültige Provenance')
  return pruefung
}

describe('S5-A Commercial Provenance Contract', () => {
  test('gültige Live-Quote bleibt current, aber niemals live', () => {
    const pruefung = ok()
    assert.equal(pruefung.bewertung.freshnessStatus, 'current')
    assert.equal(pruefung.bewertung.commercialStatus, 'current')
    assert.equal(pruefung.bewertung.currencyStatus, 'matched')
    assert.equal(pruefung.bewertung.affiliateStatus, 'absent')
    assert.equal(pruefung.bewertung.conversionEvidence, 'absent')
    assert.equal(pruefung.bewertung.snapshotIstNieLive, true)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(pruefung.bewertung.darfRequestedWaehrungAlsVergleichbarGelten, true)
    assert.equal(pruefung.provenance.referenz.referenzIstKeinTrust, true)
    assert.equal(istCommercialLiveBehauptungErlaubt(pruefung.provenance), false)
    assert.equal(darfCommercialAlsCurrentQuoteErscheinen(pruefung), true)
    assert.equal('available' in pruefung.bewertung, false)
  })

  test('ungültiger retrievedAt wird abgewiesen', () => {
    for (const retrievedAt of [null, '', '2026-08-26', 'gestern', '2026-13-40T99:99:99Z']) {
      const pruefung = commercialProvenancePruefen(quote({ retrievedAt }), { nowMs: NOW })
      assert.equal(pruefung.ok, false)
      if (pruefung.ok) continue
      assert.equal(pruefung.fehler[0]?.code, 'invalid_retrieved_at')
    }
  })

  test('retrievedAt unplausibel in der Zukunft wird abgewiesen', () => {
    const zukunft = new Date(NOW + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS + 1).toISOString()
    const pruefung = commercialProvenancePruefen(quote({ retrievedAt: zukunft, freshUntil: null }), { nowMs: NOW })
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'retrieved_at_in_future')
  })

  test('kleine Uhrenabweichung innerhalb 5 Minuten bleibt zulässig', () => {
    const leichtZukunft = new Date(NOW + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS).toISOString()
    const pruefung = commercialProvenancePruefen(
      quote({ retrievedAt: leichtZukunft, freshUntil: null }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, true)
    if (!pruefung.ok) return
    assert.equal(pruefung.bewertung.freshnessStatus, 'unknown')
  })

  test('freshUntil vor retrievedAt wird abgewiesen', () => {
    const pruefung = commercialProvenancePruefen(
      quote({ retrievedAt: '2026-08-26T11:00:00.000Z', freshUntil: '2026-08-26T10:59:59.000Z' }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'fresh_until_before_retrieved_at')
  })

  test('fehlende Source-/Provider-Provenance wird abgewiesen', () => {
    const ohneProvider = commercialProvenancePruefen(quote({ providerId: '' }), { nowMs: NOW })
    const ohneKind = commercialProvenancePruefen(quote({ sourceKind: null }), { nowMs: NOW })
    assert.equal(ohneProvider.ok, false)
    assert.equal(ohneKind.ok, false)
    if (ohneProvider.ok || ohneKind.ok) return
    assert.equal(ohneProvider.fehler[0]?.code, 'missing_source')
    assert.equal(ohneKind.fehler[0]?.code, 'missing_source')
  })

  test('requestedCurrency != quotedCurrency bleibt mismatch ohne Conversion', () => {
    const pruefung = ok({ requestedCurrency: 'CHF', quotedCurrency: 'EUR' })
    assert.equal(pruefung.bewertung.currencyStatus, 'mismatch')
    assert.equal(pruefung.bewertung.conversionEvidence, 'absent')
    assert.equal(pruefung.bewertung.darfRequestedWaehrungAlsVergleichbarGelten, false)
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(commercialWaehrungBewerten({ requestedCurrency: 'CHF', quotedCurrency: 'EUR' }), 'mismatch')
  })

  test('keine automatische Währungsumrechnung ohne echte Conversion-Evidence', () => {
    const mitBetrag = commercialProvenancePruefen(quote({ convertedAmount: 800 }), { nowMs: NOW })
    const mitEvidence = commercialProvenancePruefen(quote({ conversionEvidence: { rate: 0.9 } }), { nowMs: NOW })
    assert.equal(mitBetrag.ok, false)
    assert.equal(mitEvidence.ok, false)
    if (mitBetrag.ok || mitEvidence.ok) return
    assert.equal(mitBetrag.fehler[0]?.code, 'conversion_without_evidence')
    assert.equal(mitEvidence.fehler[0]?.code, 'conversion_without_evidence')
  })

  test('stale Snapshot darf nicht als current/live erscheinen', () => {
    const pruefung = ok({
      persistenz: 'snapshot',
      sourceKind: 'persisted_snapshot',
      freshUntil: '2026-08-26T11:30:00.000Z',
    })
    assert.equal(pruefung.bewertung.freshnessStatus, 'stale')
    assert.equal(pruefung.bewertung.commercialStatus, 'stale')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.provenance.persistenz, 'snapshot')
    assert.equal(darfCommercialAlsCurrentQuoteErscheinen(pruefung), false)
  })

  test('fehlende Freshness bleibt unknown statt erfunden', () => {
    const pruefung = ok({ freshUntil: null })
    assert.equal(pruefung.bewertung.freshnessStatus, 'unknown')
    assert.equal(pruefung.bewertung.commercialStatus, 'unknown')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, false)
    assert.equal(commercialFrischheitBewerten({ retrievedAt: RETRIEVED, freshUntil: null, nowMs: NOW }), 'unknown')
  })

  test('User-Intake darf kein freshUntil erfinden', () => {
    const pruefung = commercialProvenancePruefen(
      quote({ sourceKind: 'user_intake', persistenz: 'snapshot', freshUntil: FRESH_UNTIL }),
      { nowMs: NOW },
    )
    assert.equal(pruefung.ok, false)
    if (pruefung.ok) return
    assert.equal(pruefung.fehler[0]?.code, 'fresh_until_ohne_quellenbeleg')
  })

  test('fehlende Affiliate-Provenance bleibt absent oder unknown', () => {
    const absent = ok()
    const unknown = ok({ affiliate: { status: 'unknown' } })
    assert.equal(absent.bewertung.affiliateStatus, 'absent')
    assert.equal(unknown.bewertung.affiliateStatus, 'unknown')
    const leerPresent = commercialAffiliateLesen({ status: 'present' })
    assert.equal(leerPresent.ok, false)
  })

  test('Affiliate present nur mit Beleg', () => {
    const pruefung = ok({ affiliate: { partnerId: 'partner-1', clickId: 'clk-1' } })
    assert.equal(pruefung.bewertung.affiliateStatus, 'present')
    assert.equal(pruefung.provenance.affiliate.partnerId, 'partner-1')
  })

  test('widersprüchliche Multi-Provider-Angebote bleiben Konflikt', () => {
    const duffel = ok({ providerId: 'duffel', amount: 900 }).provenance
    const anderer = ok({ providerId: 'andere', amount: 1100 }).provenance
    const konflikt = commercialAngeboteVergleichen([duffel, anderer])
    assert.equal(konflikt.status, 'conflict')
    assert.ok(konflikt.widersprueche.some((eintrag) => eintrag.feld === 'amount'))
    assert.equal(commercialBesteQuelleWaehlen([duffel, anderer]), null)
  })

  test('gleiche belegte Quotes bleiben consistent, verschiedene Identitäten insufficient', () => {
    const a = ok({ amount: 900 }).provenance
    const b = ok({ providerId: 'andere', amount: 900 }).provenance
    assert.equal(commercialAngeboteVergleichen([a, b]).status, 'consistent')
    const fremd = ok({ vergleichsschluessel: 'anders', externalRef: 'off_2', amount: 900 }).provenance
    assert.equal(commercialAngeboteVergleichen([a, fremd]).status, 'insufficient_evidence')
    assert.equal(commercialAngeboteVergleichen([a]).status, 'single')
  })

  test('LLM/Assistant darf den Hard-Truth-Vertrag nicht überschreiben', () => {
    const bestehend = ok().provenance
    for (const akteur of ['assistant', 'llm', 'unbekannt', null] as const) {
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
    const alsQuelle = commercialProvenancePruefen(quote({ sourceKind: 'assistant' }), { nowMs: NOW })
    assert.equal(alsQuelle.ok, false)
    if (alsQuelle.ok) return
    assert.equal(alsQuelle.fehler[0]?.code, 'assistant_source_forbidden')
  })

  test('persistierter Snapshot ist auch bei current Freshness nicht live', () => {
    const pruefung = ok({ persistenz: 'snapshot', sourceKind: 'persisted_snapshot' })
    assert.equal(pruefung.bewertung.freshnessStatus, 'current')
    assert.equal(pruefung.bewertung.darfAlsCurrentQuoteDargestelltWerden, true)
    assert.equal(pruefung.bewertung.darfAlsLiveDargestelltWerden, false)
    assert.equal(pruefung.bewertung.snapshotIstNieLive, true)
  })

  test('fehlender Preis bleibt partial, unavailable bleibt eigener Status', () => {
    const partial = ok({ amount: null })
    const unavailable = ok({ availability: 'unavailable' })
    const erfundenAvailable = ok({ availability: 'available' })
    assert.equal(partial.bewertung.commercialStatus, 'partial')
    assert.equal(unavailable.bewertung.commercialStatus, 'unavailable')
    assert.equal(unavailable.bewertung.availabilityStatus, 'unavailable')
    assert.equal(erfundenAvailable.bewertung.availabilityStatus, 'unknown')
    assert.equal(erfundenAvailable.bewertung.commercialStatus, 'current')
  })

  test('observedAt darf retrievedAt nicht still ersetzen', () => {
    const pruefung = commercialProvenancePruefen(
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
    assert.ok(COMMERCIAL_PROVENANCE_FEHLER.includes('assistant_overwrite_forbidden'))
  })
})

describe('S5-A Anbindung an bestehende Domänen ohne Schema-Mutation', () => {
  test('Flight-/Hotel-/Activity-/Transport-Optionen bleiben ohne retrievedAt gültig komponierbar', () => {
    const hotel: HotelOption = {
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

    const flugId = commercialIdentitaetAusOption(OPTION_DIREKT)
    assert.equal(flugId.providerId, 'duffel')
    assert.equal(flugId.externalRef, OPTION_DIREKT.externalRef)
    assert.equal('retrievedAt' in OPTION_DIREKT, false)
    assert.equal('freshUntil' in hotel, false)
    assert.equal('requestedCurrency' in activity, false)

    const provenance = ok({ providerId: flugId.providerId, externalRef: flugId.externalRef }).provenance
    const komponiert = optionMitCommercialProvenance(OPTION_DIREKT, provenance)
    assert.equal(komponiert.priceAmount, OPTION_DIREKT.priceAmount)
    assert.equal(komponiert.commercialProvenance.zeit.retrievedAt, RETRIEVED)
    assert.equal(commercialIdentitaetAusOption(hotel).providerId, 'hotelbeds')
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
