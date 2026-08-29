// lib/commercial-provenance/persistenz.test.ts
//
// S5-B Write-Authority und Legacy-Projektion. Grün darf keine Fake-Truth kodieren.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  COMMERCIAL_LEGACY_GUARD,
  TRIP_ITEM_COMMERCIAL_KINDS,
  TRIP_ITEM_KIND_TO_COMMERCIAL_DOMAIN,
  commercialAkteurIstWriteActor,
  commercialDomainFuerTripItemKind,
  commercialIstProviderHardTruth,
  commercialLegacyGuardFuerKind,
  commercialLegacyOhneProvenanceIstUnknown,
  commercialLegacyProjektionAusSnapshot,
  commercialPersistenzNutzlastBauen,
  commercialPersistenzNutzlastFuerTripItem,
  commercialPersistenzNutzlastIstRohclient,
  commercialSnapshotFuerPersistenzMinten,
  COMMERCIAL_PERSISTENCE_MINT,
  COMMERCIAL_PERSISTENCE_VERTRAG,
} from '@/lib/commercial-provenance'

const NOW = Date.parse('2026-08-29T12:00:00.000Z')
const RETRIEVED = '2026-08-29T11:00:00.000Z'
const FRESH_UNTIL = '2026-08-29T13:00:00.000Z'

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

describe('S5-B Kind/Domain und Guard-Matrix', () => {
  test('mappt genau die fünf kommerziellen Kinds und lehnt note ab', () => {
    assert.equal(commercialDomainFuerTripItemKind('flight'), 'flights')
    assert.equal(commercialDomainFuerTripItemKind('stay'), 'hotels')
    assert.equal(commercialDomainFuerTripItemKind('activity'), 'activities')
    assert.equal(commercialDomainFuerTripItemKind('transfer'), 'mobility')
    assert.equal(commercialDomainFuerTripItemKind('rental_car'), 'rental_cars')
    assert.equal(commercialDomainFuerTripItemKind('note'), null)
    assert.deepEqual([...TRIP_ITEM_COMMERCIAL_KINDS].sort(), [
      'activity',
      'flight',
      'rental_car',
      'stay',
      'transfer',
    ])
    assert.equal(commercialLegacyGuardFuerKind('note')?.price, 'forbidden')
    assert.equal(commercialAkteurIstWriteActor('provider_adapter'), true)
    assert.equal(commercialAkteurIstWriteActor('user'), false)
    assert.deepEqual(Object.keys(TRIP_ITEM_KIND_TO_COMMERCIAL_DOMAIN).sort(), [
      'activity',
      'flight',
      'rental_car',
      'stay',
      'transfer',
    ])
  })

  test('Stay/Activity schützen Preis und Provider; Transfer/Rental nur Provider; Note verbietet beides', () => {
    assert.equal(COMMERCIAL_LEGACY_GUARD.flight.price, 'trusted_only')
    assert.equal(COMMERCIAL_LEGACY_GUARD.stay.price, 'trusted_only')
    assert.equal(COMMERCIAL_LEGACY_GUARD.activity.provider, 'trusted_only')
    assert.equal(COMMERCIAL_LEGACY_GUARD.transfer.price, 'user_intake')
    assert.equal(COMMERCIAL_LEGACY_GUARD.transfer.provider, 'trusted_only')
    assert.equal(COMMERCIAL_LEGACY_GUARD.rental_car.price, 'user_intake')
    assert.equal(COMMERCIAL_LEGACY_GUARD.note.price, 'forbidden')
    assert.equal(COMMERCIAL_LEGACY_GUARD.note.provider, 'forbidden')
  })
})

describe('S5-B kontrollierter Snapshot-Mint', () => {
  test('mintet persisted_snapshot/snapshot und ignoriert Client-sourceKind/persistenz', () => {
    const mint = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote({ sourceKind: 'live_api', persistenz: 'ephemeral' }),
      akteur: 'provider_adapter',
      nowMs: NOW,
    })
    assert.equal(mint.ok, true)
    if (!mint.ok) return
    assert.equal(mint.provenance.quelle.sourceKind, 'persisted_snapshot')
    assert.equal(mint.provenance.persistenz, 'snapshot')
    assert.equal(mint.provenance.quelle.providerBelegt, true)
    assert.equal(mint.provenance.quelle.providerId, 'duffel')
    assert.equal(mint.projektion.provider, 'duffel')
    assert.equal(mint.projektion.external_ref, 'off_1')
    assert.equal(mint.projektion.price_amount, 892.5)
    assert.equal(mint.projektion.price_currency, 'CHF')
    assert.equal(commercialIstProviderHardTruth(mint.provenance), true)
  })

  test('lehnt note und unbekanntes Kind ab', () => {
    const note = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'note',
      quote: quote({ domain: 'flights' }),
      nowMs: NOW,
    })
    assert.equal(note.ok, false)
    if (note.ok) return
    assert.equal(note.fehler[0]?.code, 'bind_domain_mismatch')

    const falsch = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'unknown_kind',
      quote: quote(),
      nowMs: NOW,
    })
    assert.equal(falsch.ok, false)
  })

  test('lehnt Domain/Kind-Widerspruch ab', () => {
    const mint = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'stay',
      quote: quote({ domain: 'flights' }),
      nowMs: NOW,
    })
    assert.equal(mint.ok, false)
    if (mint.ok) return
    assert.equal(mint.fehler[0]?.code, 'bind_domain_mismatch')
  })

  test('lehnt forged Actor und User-Intake als Provider-Truth ab', () => {
    const user = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote(),
      akteur: 'user',
      nowMs: NOW,
    })
    assert.equal(user.ok, false)
    if (!user.ok) assert.equal(user.fehler[0]?.code, 'actor_source_forbidden')

    const llm = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote(),
      akteur: 'llm',
      nowMs: NOW,
    })
    assert.equal(llm.ok, false)
    if (!llm.ok) assert.equal(llm.fehler[0]?.code, 'assistant_overwrite_forbidden')

    const intake = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'transfer',
      quote: quote({
        domain: 'mobility',
        sourceKind: 'user_intake',
        providerId: null,
        retrievedAt: null,
        observedAt: RETRIEVED,
      }),
      nowMs: NOW,
    })
    assert.equal(intake.ok, false)
    if (!intake.ok) assert.equal(intake.fehler[0]?.code, 'actor_source_forbidden')
  })

  test('Refresh braucht Domain + Provider + belegte Ref am selben Item', () => {
    const erst = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'activity',
      quote: quote({ domain: 'activities', providerId: 'gyg', externalRef: 'act-1' }),
      nowMs: NOW,
    })
    assert.equal(erst.ok, true)
    if (!erst.ok) return

    const falsch = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'activity',
      quote: quote({ domain: 'activities', providerId: 'gyg', externalRef: 'act-2' }),
      bestehend: erst.provenance,
      nowMs: NOW,
    })
    assert.equal(falsch.ok, false)
    if (!falsch.ok) assert.equal(falsch.fehler[0]?.code, 'refresh_identity_mismatch')

    const ok = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'activity',
      quote: quote({ domain: 'activities', providerId: 'gyg', externalRef: 'act-1', amount: 50 }),
      bestehend: erst.provenance,
      nowMs: NOW,
    })
    assert.equal(ok.ok, true)
  })

  test('validierte Persistenz-Nutzlast ist vom rohen Client-Quote unterscheidbar', () => {
    const tripItemId = 'aaaaaaaa-0000-4000-8000-000000000004'
    const gebaut = commercialPersistenzNutzlastFuerTripItem({
      tripItemId,
      tripItemKind: 'flight',
      quote: quote(),
      akteur: 'provider_adapter',
      nowMs: NOW,
    })
    assert.equal(gebaut.ok, true)
    if (!gebaut.ok) return
    assert.equal(gebaut.nutzlast.vertrag, COMMERCIAL_PERSISTENCE_VERTRAG)
    assert.equal(gebaut.nutzlast.mint, COMMERCIAL_PERSISTENCE_MINT)
    assert.equal(gebaut.nutzlast.source_kind, 'persisted_snapshot')
    assert.equal(gebaut.nutzlast.persistenz, 'snapshot')
    assert.equal(gebaut.nutzlast.trip_item_id, tripItemId)
    assert.equal(commercialPersistenzNutzlastIstRohclient(gebaut.nutzlast), false)
    assert.equal(commercialPersistenzNutzlastIstRohclient(quote()), true)
    assert.equal(
      commercialPersistenzNutzlastIstRohclient({
        ...gebaut.nutzlast,
        sourceKind: 'live_api',
        akteur: 'user',
      }),
      true,
    )
    const mint = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote(),
      nowMs: NOW,
    })
    assert.equal(mint.ok, true)
    if (!mint.ok) return
    const direkt = commercialPersistenzNutzlastBauen({ tripItemId, mint })
    assert.equal(direkt.vertrag, COMMERCIAL_PERSISTENCE_VERTRAG)
    assert.equal('sourceKind' in direkt, false)
    assert.equal('akteur' in direkt, false)
  })

  test('gleiche Provider+Ref darf auf mehreren Items vorkommen', () => {
    const a = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote({ externalRef: 'shared-ref' }),
      nowMs: NOW,
    })
    const b = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'flight',
      quote: quote({ externalRef: 'shared-ref' }),
      nowMs: NOW,
    })
    assert.equal(a.ok, true)
    assert.equal(b.ok, true)
    if (!a.ok || !b.ok) return
    assert.equal(a.provenance.referenz.externalRef, b.provenance.referenz.externalRef)
    assert.equal(a.provenance.quelle.providerId, b.provenance.quelle.providerId)
  })
})

describe('S5-B Legacy-Projektion', () => {
  test('Legacy ohne Provenance-Zeile bleibt unknown und ist keine Hard-Truth', () => {
    assert.equal(commercialLegacyOhneProvenanceIstUnknown(null), true)
    assert.equal(commercialIstProviderHardTruth(null), false)
  })

  test('Projektion schreibt keine booking_url und keinen Preis ohne quotedCurrency', () => {
    const mint = commercialSnapshotFuerPersistenzMinten({
      tripItemKind: 'stay',
      quote: quote({ domain: 'hotels', quotedCurrency: null, requestedCurrency: 'CHF' }),
      nowMs: NOW,
    })
    assert.equal(mint.ok, true)
    if (!mint.ok) return
    const projektion = commercialLegacyProjektionAusSnapshot(mint.provenance)
    assert.equal(projektion.price_amount, null)
    assert.equal(projektion.price_currency, null)
    assert.equal(projektion.provider, 'duffel')
    assert.equal('booking_url' in projektion, false)
  })
})
