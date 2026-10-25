import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  SATZ_BEZIEHUNG,
  SATZ_DUPLIKAT_LAND,
  abschlussAktuell,
  belegungAufnehmen,
  belegungLoesen,
  eingabenBehalten,
  entwurfAusVorhanden,
  ergebnisKlasse,
  gastBasisUebernehmen,
  gastExplizitLesen,
  gastTravellerAbschliessen,
  legacyAufnahme,
  lieferungAnwenden,
  neuErfassen,
  readbackUrteil,
  serialisieren,
  speichernGesperrt,
  staatsbuergerschaftEntfernen,
  staatsbuergerschaftHinzufuegen,
  staatsbuergerschaftSetzen,
  wohnsitzSetzen,
  type TravellerDraft,
} from '@/lib/readiness/trip-traveller-snapshot-workflow-1'
import type { TripTraveller } from '@/types/trips'

const UUID = 'a1111111-1111-4111-8111-111111111111'
let n = 0
const zufall = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

function person(teil: Partial<TripTraveller> = {}): TripTraveller {
  return {
    id: 'traveller-row-1',
    clientRef: 'traveller:1',
    label: 'Reisende 1',
    residenceCountryCode: null,
    citizenships: [
      {
        id: 'citizenship-row-1',
        clientRef: UUID,
        countryCode: 'CH',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    documents: [
      {
        id: 'document-row-1',
        clientRef: 'document:pass-1',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: UUID,
        expiresOn: '2030-01-01',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
    ...teil,
  }
}

function payloadVon(entwurf: TravellerDraft) {
  const ergebnis = serialisieren(entwurf)
  assert.equal(ergebnis.art, 'ok')
  if (ergebnis.art !== 'ok') throw new Error('unerreichbar')
  return ergebnis.payload
}

describe('trip traveller snapshot serializer', () => {
  test('residence-only edit keeps the UUID and the passport relation', () => {
    const entwurf = wohnsitzSetzen(entwurfAusVorhanden(person()), 'IT')
    const payload = payloadVon(entwurf)
    assert.equal(payload.residenceCountryCode, 'IT')
    assert.equal(payload.citizenships[0]?.clientRef, UUID)
    assert.equal(payload.documents[0]?.citizenshipClientRef, UUID)
    assert.equal(payload.documents[0]?.clientRef, 'document:pass-1')
  })

  test('a blank created citizenship that a document still names is not sent and is not nulled', () => {
    let entwurf = entwurfAusVorhanden(person({ documents: [] }))
    entwurf = staatsbuergerschaftHinzufuegen(entwurf, zufall)
    const leer = entwurf.citizenships.find((zeile) => zeile.origin === 'created' && zeile.countryCode === '')
    assert.ok(leer)
    entwurf = {
      ...entwurf,
      documents: entwurf.documents.map((zeile, index) =>
        index === 0
          ? { ...zeile, documentType: 'passport', issuingCountryCode: 'CH', citizenshipClientRef: leer?.clientRef ?? null, touched: true }
          : zeile,
      ),
    }
    const ergebnis = serialisieren(entwurf)
    assert.equal(ergebnis.art, 'not_sent')
    if (ergebnis.art === 'not_sent') assert.equal(ergebnis.satz, SATZ_BEZIEHUNG)
    assert.equal(entwurf.documents[0]?.citizenshipClientRef, leer?.clientRef)
  })

  test('padded, overlength, blank and colliding refs are not repaired', () => {
    const basis = entwurfAusVorhanden(person())
    const gepolstert = serialisieren({
      ...basis,
      citizenships: [
        ...basis.citizenships,
        { clientRef: ' citizenship:CH', countryCode: 'DE', origin: 'loaded', touched: false },
      ],
    })
    assert.equal(gepolstert.art, 'not_sent')

    const lang = `${'x'.repeat(64)}y`
    const ueberlang = serialisieren({
      ...basis,
      citizenships: [
        { clientRef: `${lang}1`, countryCode: 'DE', origin: 'loaded', touched: false },
        { clientRef: `${lang}2`, countryCode: 'FR', origin: 'loaded', touched: false },
      ],
    })
    assert.equal(ueberlang.art, 'not_sent')

    const leer = serialisieren({
      ...basis,
      citizenships: [{ clientRef: '', countryCode: 'CH', origin: 'loaded', touched: false }],
    })
    assert.equal(leer.art, 'not_sent')

    const dokument = serialisieren({
      ...basis,
      documents: [{ ...basis.documents[0], clientRef: '', origin: 'loaded', touched: false }],
    })
    assert.equal(dokument.art, 'not_sent')

    const beziehung = serialisieren({
      ...basis,
      documents: [{ ...basis.documents[0], citizenshipClientRef: ` ${UUID}`, touched: true }],
    })
    assert.equal(beziehung.art, 'not_sent')
    const leerzeichen = serialisieren({
      ...basis,
      documents: [{ ...basis.documents[0], citizenshipClientRef: '   ', touched: true }],
    })
    assert.equal(leerzeichen.art, 'not_sent')
  })

  test('an untouched blank citizenship is omitted and a loaded blank country is not', () => {
    let entwurf = entwurfAusVorhanden(person())
    entwurf = staatsbuergerschaftHinzufuegen(entwurf, zufall)
    const payload = payloadVon(entwurf)
    assert.equal(payload.citizenships.length, 1)
    assert.equal(payload.citizenships[0]?.clientRef, UUID)

    const illegal = serialisieren({
      ...entwurfAusVorhanden(person()),
      citizenships: [{ clientRef: UUID, countryCode: '', origin: 'loaded', touched: false }],
    })
    assert.equal(illegal.art, 'not_sent')
  })

  test('removing one citizenship nulls only that relation', () => {
    const zweite = 'b2222222-2222-4222-8222-222222222222'
    let entwurf = entwurfAusVorhanden(
      person({
        citizenships: [
          person().citizenships[0],
          {
            id: 'citizenship-row-2',
            clientRef: zweite,
            countryCode: 'DE',
            createdAt: '2026-10-04T20:00:00.000Z',
            updatedAt: '2026-10-04T20:00:00.000Z',
          },
        ],
        documents: [
          person().documents[0],
          {
            id: 'document-row-2',
            clientRef: 'document:pass-2',
            documentType: 'national_id',
            issuingCountryCode: 'DE',
            citizenshipClientRef: zweite,
            expiresOn: null,
            createdAt: '2026-10-04T20:00:00.000Z',
            updatedAt: '2026-10-04T20:00:00.000Z',
          },
        ],
      }),
    )
    entwurf = staatsbuergerschaftEntfernen(entwurf, UUID)
    const payload = payloadVon(entwurf)
    assert.equal(payload.citizenships.some((zeile) => zeile.clientRef === UUID), false)
    assert.equal(payload.documents.find((zeile) => zeile.clientRef === 'document:pass-1')?.citizenshipClientRef, null)
    assert.equal(payload.documents.find((zeile) => zeile.clientRef === 'document:pass-2')?.citizenshipClientRef, zweite)
  })

  test('duplicate countries use the schema sentence', () => {
    const ergebnis = serialisieren({
      ...entwurfAusVorhanden(person()),
      citizenships: [
        { clientRef: UUID, countryCode: 'CH', origin: 'loaded', touched: false },
        { clientRef: 'citizenship:legacy', countryCode: 'CH', origin: 'loaded', touched: false },
      ],
    })
    assert.equal(ergebnis.art, 'not_sent')
    if (ergebnis.art === 'not_sent') assert.equal(ergebnis.satz, SATZ_DUPLIKAT_LAND)
  })

  test('exact legacy refs pass unchanged', () => {
    const entwurf = entwurfAusVorhanden(
      person({
        citizenships: [
          {
            id: 'c',
            clientRef: 'citizenship:RS',
            countryCode: 'RS',
            createdAt: '2026-10-04T20:00:00.000Z',
            updatedAt: '2026-10-04T20:00:00.000Z',
          },
        ],
        documents: [
          {
            ...person().documents[0],
            citizenshipClientRef: 'citizenship:RS',
          },
        ],
      }),
    )
    const payload = payloadVon(wohnsitzSetzen(entwurf, 'IT'))
    assert.equal(payload.citizenships[0]?.clientRef, 'citizenship:RS')
    assert.equal(payload.documents[0]?.citizenshipClientRef, 'citizenship:RS')
  })
})

describe('trip traveller snapshot observation and admission', () => {
  test('membership loss is not a fresh save until explicit re-entry', () => {
    const entwurf = lieferungAnwenden(entwurfAusVorhanden(person()), null, { clientRef: 'traveller:1', label: 'Reisende 1' })
    assert.equal(entwurf.membership, 'absent')
    assert.equal(speichernGesperrt(entwurf, false), true)
    assert.equal(speichernGesperrt(eingabenBehalten(entwurf, null), false), true)
    const neu = neuErfassen(entwurf, 'Reisende 1', zufall)
    assert.equal(neu.reentry, true)
    assert.equal(speichernGesperrt(neu, false), false)
    assert.notEqual(neu.generation, entwurf.generation)
  })

  test('a pre-settlement delivery is not consistent and a later match is', () => {
    const fingerprint = 'gleich'
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 2,
        draftDirty: false,
        delivery: 4,
        membership: 'present',
        fingerprint,
      }),
      'ignored',
    )
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 2,
        draftDirty: false,
        delivery: 5,
        membership: 'present',
        fingerprint,
      }),
      'consistent',
    )
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 3,
        draftDirty: true,
        delivery: 5,
        membership: 'present',
        fingerprint,
      }),
      'stale',
    )
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 2,
        draftDirty: true,
        delivery: 4,
        membership: 'present',
        fingerprint,
      }),
      'ignored',
    )
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 2,
        draftDirty: true,
        delivery: 5,
        membership: 'present',
        fingerprint,
      }),
      'consistent',
    )
    assert.equal(
      readbackUrteil({
        readbackAfterDelivery: 4,
        submittedFingerprint: fingerprint,
        intentGeneration: 2,
        draftGeneration: 2,
        draftDirty: true,
        delivery: 5,
        membership: 'present',
        fingerprint: 'anders',
      }),
      'differs',
    )
  })

  test('an acknowledged fingerprint adopts the dirty draft without minting child refs', () => {
    const platz = { clientRef: 'traveller:1', label: 'Reisende 1' }
    const basis = entwurfAusVorhanden(person())
    const frankreich = person({ residenceCountryCode: 'FR' })
    const anerkannt = entwurfAusVorhanden(frankreich).baselineFingerprint
    const entwurf = wohnsitzSetzen(basis, 'FR')
    const staatsbuergerschaften = entwurf.citizenships.map((zeile) => zeile.clientRef)
    const dokumente = entwurf.documents.map((zeile) => ({
      clientRef: zeile.clientRef,
      citizenshipClientRef: zeile.citizenshipClientRef,
    }))
    const ohne = lieferungAnwenden(entwurf, frankreich, platz)
    assert.equal(ohne.conflict, true)
    assert.equal(ohne.dirty, true)
    assert.equal(ohne.residenceCountryCode, 'FR')
    assert.deepEqual(ohne.citizenships.map((zeile) => zeile.clientRef), staatsbuergerschaften)

    const italien = wohnsitzSetzen(basis, 'IT')
    const abweichung = lieferungAnwenden(italien, frankreich, platz)
    assert.equal(abweichung.conflict, true)
    assert.equal(abweichung.residenceCountryCode, 'IT')
    assert.deepEqual(abweichung.citizenships.map((zeile) => zeile.clientRef), staatsbuergerschaften)
    assert.deepEqual(
      abweichung.documents.map((zeile) => ({
        clientRef: zeile.clientRef,
        citizenshipClientRef: zeile.citizenshipClientRef,
      })),
      dokumente,
    )

    const uebernommen = lieferungAnwenden(entwurf, frankreich, platz, undefined, anerkannt)
    assert.equal(uebernommen.conflict, false)
    assert.equal(uebernommen.dirty, false)
    assert.equal(uebernommen.baselineFingerprint, anerkannt)
    assert.equal(uebernommen.generation, entwurf.generation)
    assert.equal(uebernommen.residenceCountryCode, 'FR')
    assert.deepEqual(uebernommen.citizenships.map((zeile) => zeile.clientRef), staatsbuergerschaften)
    assert.deepEqual(
      uebernommen.documents.map((zeile) => ({
        clientRef: zeile.clientRef,
        citizenshipClientRef: zeile.citizenshipClientRef,
      })),
      dokumente,
    )
  })

  test('guest admission does not replay and only an explicit same-trip read re-arms', () => {
    const erste = belegungAufnehmen([], 'guest', 'trip-1', 'traveller:1', 1, false)
    assert.equal(erste.art, 'enter')
    if (erste.art !== 'enter') return
    const zweite = belegungAufnehmen(erste.belegt, 'guest', 'trip-1', 'traveller:2', 2, false)
    assert.equal(zweite.art, 'not_sent')
    const konto = belegungAufnehmen(erste.belegt, 'account', 'trip-1', 'traveller:2', 2, false)
    assert.equal(konto.art, 'enter')
    const nachher = belegungLoesen(erste.belegt, { tripId: 'trip-1', target: 'traveller:1', generation: 1 })
    assert.equal(abschlussAktuell(nachher, { tripId: 'trip-1', target: 'traveller:1', generation: 1 }), false)
    assert.equal(abschlussAktuell(erste.belegt, { tripId: 'trip-1', target: 'traveller:1', generation: 9 }), false)

    const g0 = { id: 'trip-1', punkt: 'alt' }
    const g1 = { id: 'trip-1', punkt: 'neu' }
    const g2 = { id: 'trip-1', punkt: 'fremd' }
    let basis = gastBasisUebernehmen({ unresolved: false, base: g0 }, g1, 'trip-1')
    assert.equal(basis.base, g1)
    basis = gastTravellerAbschliessen(basis, 'unproven', null, 'trip-1')
    assert.equal(basis.unresolved, true)
    assert.equal(basis.base, g1)
    basis = gastBasisUebernehmen(basis, g2, 'trip-1')
    assert.equal(basis.base, g1)
    const falsch = gastExplizitLesen(basis, 'wrong_trip', { id: 'andere', punkt: 'x' }, 'trip-1')
    assert.equal(falsch.rearm, false)
    assert.equal(falsch.zustand.base, g1)
    const richtig = gastExplizitLesen(basis, 'success', g1, 'trip-1')
    assert.equal(richtig.rearm, true)
    assert.equal(richtig.zustand.unresolved, false)
    assert.equal(richtig.zustand.base?.punkt, 'neu')
    assert.equal(ergebnisKlasse(false, 'throw'), 'not_sent')
    assert.equal(ergebnisKlasse(true, 'string'), 'unproven')
    assert.equal(ergebnisKlasse(true, 'null'), 'accepted')
    assert.equal(ergebnisKlasse(true, 'malformed'), 'unproven')
  })

  test('a legacy intake writer is invoked once and not replaced', async () => {
    let calls = 0
    const stub = async () => {
      calls += 1
      return null
    }
    const aufnahme = legacyAufnahme(stub)
    assert.equal(await aufnahme.invoke({ tripId: 'trip-1', registryTravellerId: 'reg-1' }), null)
    assert.equal(aufnahme.calls(), 1)
    assert.equal(calls, 1)
  })

  test('a cleared created citizenship is not treated as an untouched blank row', () => {
    let entwurf = entwurfAusVorhanden(person({ documents: [] }))
    entwurf = staatsbuergerschaftHinzufuegen(entwurf, zufall)
    const ref = entwurf.citizenships.find((zeile) => zeile.origin === 'created')?.clientRef ?? ''
    entwurf = staatsbuergerschaftSetzen(entwurf, ref, 'FR')
    entwurf = staatsbuergerschaftSetzen(entwurf, ref, '')
    const ergebnis = serialisieren(entwurf)
    assert.equal(ergebnis.art, 'not_sent')
  })
})
