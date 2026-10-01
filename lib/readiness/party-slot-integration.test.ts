// lib/readiness/party-slot-integration.test.ts
//
// Registry-Snapshots belegen leere Kopfzahl-Plätze und bleiben für
// Requirements, Vorbereitung und Safety sichtbar. Synthetische Daten.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { readinessChecksAbleiten } from '@/lib/readiness/ableitung'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import {
  PARTY_GRENZEN,
  fehlendeFaktenFuerReise,
  gruppenUnterschiede,
  travellerSlots,
} from '@/lib/readiness/party'
import { safetyAusFacts } from '@/lib/safety/engine'
import { safetyContextFingerprint } from '@/lib/safety/fingerprint'
import { SAFETY_NOW_MS, mehrzielreise, safetyFact } from '@/lib/safety/fixtures'
import {
  registryTripKopfzahlErreicht,
  registryTripLimitErreicht,
  registryTripUebernahmeGesperrt,
} from '@/lib/traveller/account-registry-trip'
import type { TripTraveller } from '@/types/trips'

const REF_A = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001'
const REF_B = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002'
const REF_C = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003'
const REF_EXTRA = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099'

function person(
  teil: Partial<TripTraveller> & Pick<TripTraveller, 'clientRef' | 'createdAt'> & {
    countryCode?: string
  },
): TripTraveller {
  const land = teil.countryCode ?? 'CH'
  const citRef = `${teil.clientRef}:cit`
  const docRef = `${teil.clientRef}:doc`
  return {
    id: teil.id ?? teil.clientRef,
    clientRef: teil.clientRef,
    label: teil.label === undefined ? 'Sasa' : teil.label,
    residenceCountryCode: teil.residenceCountryCode ?? land,
    citizenships: teil.citizenships ?? [
      {
        id: citRef,
        clientRef: citRef,
        countryCode: land,
        createdAt: teil.createdAt,
        updatedAt: teil.createdAt,
      },
    ],
    documents: teil.documents ?? [
      {
        id: docRef,
        clientRef: docRef,
        documentType: 'passport',
        issuingCountryCode: land,
        citizenshipClientRef: citRef,
        expiresOn: '2030-01-01',
        createdAt: teil.createdAt,
        updatedAt: teil.createdAt,
      },
    ],
    createdAt: teil.createdAt,
    updatedAt: teil.updatedAt ?? teil.createdAt,
  }
}

function anwendbar(reise: { travellers: number; party: TripTraveller[] }) {
  return travellerSlots(reise).filter((slot) => slot.applicable)
}

describe('anwendbare Traveller-Plätze', () => {
  test('kanonisches traveller:1 bleibt Platz 1, auch wenn ein Snapshot früher entstand', () => {
    const kanon = person({
      clientRef: 'traveller:1',
      label: 'Kanon',
      createdAt: '2026-08-09T00:00:00.000Z',
      countryCode: 'DE',
    })
    const frueh = person({ clientRef: REF_B, createdAt: '2026-08-01T00:00:00.000Z', countryCode: 'CH' })
    const slots = travellerSlots({ travellers: 3, party: [frueh, kanon] })
    assert.equal(slots[0]?.clientRef, 'traveller:1')
    assert.equal(slots[0]?.traveller?.label, 'Kanon')
    assert.equal(slots[0]?.applicable, true)
    assert.equal(slots[1]?.clientRef, REF_B)
    assert.equal(slots[1]?.applicable, true)
    assert.equal(slots[2]?.clientRef, 'traveller:3')
    assert.equal(slots[2]?.persisted, false)
    assert.equal(slots[2]?.label, 'Reisende 3')
  })

  test('ein frischer Snapshot füllt einen leeren Platz und behält seine clientRef', () => {
    const snapshot = person({ clientRef: REF_A, createdAt: '2026-08-02T00:00:00.000Z' })
    const slots = anwendbar({ travellers: 3, party: [snapshot] })
    assert.equal(slots.length, 3)
    assert.equal(slots[0]?.clientRef, REF_A)
    assert.notEqual(slots[0]?.clientRef, 'traveller:1')
    assert.equal(slots[0]?.traveller?.clientRef, REF_A)
    assert.equal(slots[0]?.label, 'Sasa')
    assert.equal(slots[0]?.traveller?.citizenships[0]?.countryCode, 'CH')
    assert.equal(slots[0]?.traveller?.documents[0]?.documentType, 'passport')
    assert.equal(slots[0]?.missingFacts.includes('nationality'), false)
    assert.equal(slots[1]?.clientRef, 'traveller:2')
    assert.equal(slots[1]?.missingFacts.includes('nationality'), true)
  })

  test('mehrere Snapshots füllen leere Plätze unabhängig von der Party-Reihenfolge', () => {
    const a = person({ clientRef: REF_A, createdAt: '2026-08-03T00:00:00.000Z', countryCode: 'DE' })
    const b = person({ clientRef: REF_B, createdAt: '2026-08-01T00:00:00.000Z', countryCode: 'CH' })
    const c = person({ clientRef: REF_C, createdAt: '2026-08-02T00:00:00.000Z', countryCode: 'RS' })
    const vorwaerts = anwendbar({ travellers: 3, party: [a, b, c] }).map((slot) => slot.clientRef)
    const rueckwaerts = anwendbar({ travellers: 3, party: [c, a, b] }).map((slot) => slot.clientRef)
    assert.deepEqual(vorwaerts, [REF_B, REF_C, REF_A])
    assert.deepEqual(rueckwaerts, vorwaerts)
  })

  test('gleiches createdAt entscheidet per clientRef, nicht per Label', () => {
    const spaeterName = person({
      clientRef: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000009',
      createdAt: '2026-08-01T00:00:00.000Z',
      label: 'Aaa',
      countryCode: 'DE',
    })
    const frueherRef = person({
      clientRef: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',
      createdAt: '2026-08-01T00:00:00.000Z',
      label: 'Zzz',
      countryCode: 'CH',
    })
    const refs = anwendbar({ travellers: 2, party: [spaeterName, frueherRef] }).map((slot) => slot.clientRef)
    assert.deepEqual(refs, [frueherRef.clientRef, spaeterName.clientRef])
    assert.equal(refs.includes('traveller:1'), false)
  })

  test('Kopfzahl N ergibt genau N anwendbare Plätze, Überzählige bleiben aussen vor', () => {
    const party = [REF_A, REF_B, REF_C, REF_EXTRA].map((clientRef, index) =>
      person({
        clientRef,
        createdAt: `2026-08-0${index + 1}T00:00:00.000Z`,
        countryCode: index % 2 === 0 ? 'CH' : 'RS',
      }),
    )
    const slots = travellerSlots({ travellers: 3, party })
    const anwendbare = slots.filter((slot) => slot.applicable)
    const extra = slots.filter((slot) => !slot.applicable)
    assert.equal(anwendbare.length, 3)
    assert.equal(extra.length, 1)
    assert.equal(extra[0]?.clientRef, REF_EXTRA)
    assert.deepEqual(extra[0]?.missingFacts, [])
    assert.equal(anwendbare.some((slot) => slot.clientRef === REF_EXTRA), false)
  })

  test('kanonisches traveller:4 ausserhalb der Kopfzahl bleibt nicht anwendbar', () => {
    const ausserhalb = person({
      clientRef: 'traveller:4',
      createdAt: '2026-08-01T00:00:00.000Z',
      label: null,
      countryCode: 'DE',
    })
    const snapshot = person({ clientRef: REF_B, createdAt: '2026-08-03T00:00:00.000Z', countryCode: 'CH' })
    const slots = travellerSlots({ travellers: 3, party: [ausserhalb, snapshot] })
    assert.equal(slots.filter((slot) => slot.applicable).length, 3)
    assert.equal(slots[0]?.clientRef, REF_B)
    assert.equal(slots[0]?.applicable, true)
    assert.equal(slots[1]?.clientRef, 'traveller:2')
    assert.equal(slots[1]?.persisted, false)
    assert.equal(slots[1]?.label, 'Reisende 2')
    assert.equal(slots[2]?.clientRef, 'traveller:3')
    assert.equal(slots[2]?.persisted, false)
    assert.equal(slots[3]?.clientRef, 'traveller:4')
    assert.equal(slots[3]?.applicable, false)
    assert.equal(slots[3]?.label, 'traveller:4')
    assert.equal(registryTripKopfzahlErreicht({ travellers: 3, party: [ausserhalb] }), false)
    assert.equal(registryTripUebernahmeGesperrt({ travellers: 3, party: [ausserhalb] }), false)
    assert.equal(
      registryTripKopfzahlErreicht({
        travellers: 3,
        party: [ausserhalb, person({ clientRef: 'traveller:5', createdAt: '2026-08-02T00:00:00.000Z' }), person({ clientRef: 'traveller:6', createdAt: '2026-08-02T00:00:00.000Z' })],
      }),
      false,
    )
  })

  test('gleiches Label führt nicht zusammen und überschreibt niemanden', () => {
    const erste = person({ clientRef: REF_B, createdAt: '2026-08-01T00:00:00.000Z', label: 'Sasa', countryCode: 'CH' })
    const zweite = person({ clientRef: REF_A, createdAt: '2026-08-02T00:00:00.000Z', label: 'Sasa', countryCode: 'RS' })
    const slots = anwendbar({ travellers: 2, party: [zweite, erste] })
    assert.deepEqual(
      slots.map((slot) => slot.clientRef),
      [REF_B, REF_A],
    )
    assert.deepEqual(
      slots.map((slot) => slot.traveller?.citizenships[0]?.countryCode),
      ['CH', 'RS'],
    )
    assert.equal(gruppenUnterschiede({ travellers: 2, party: [zweite, erste] }).unterschiedlicheCitizenships, true)
  })

  test('die absolute 20er-Grenze bleibt der Slot-Deckel', () => {
    const party = Array.from({ length: 21 }, (_, index) =>
      person({
        clientRef: `aaaaaaaa-bbbb-4ccc-8ddd-${String(index + 1).padStart(12, '0')}`,
        createdAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
      }),
    )
    const slots = travellerSlots({ travellers: 25, party })
    assert.equal(slots.filter((slot) => slot.applicable).length, PARTY_GRENZEN.slots)
    assert.equal(slots.filter((slot) => !slot.applicable).length, 1)
    assert.equal(registryTripLimitErreicht(19), false)
    assert.equal(registryTripLimitErreicht(20), true)
    assert.equal(registryTripKopfzahlErreicht({ travellers: 3, party: party.slice(0, 3) }), true)
    assert.equal(registryTripKopfzahlErreicht({ travellers: 3, party: party.slice(0, 2) }), false)
    assert.equal(registryTripUebernahmeGesperrt({ travellers: 3, party: party.slice(0, 3) }), true)
    assert.equal(registryTripUebernahmeGesperrt({ travellers: 20, party: party.slice(0, 19) }), false)
    assert.equal(registryTripUebernahmeGesperrt({ travellers: 20, party: party.slice(0, 20) }), true)
  })
})

describe('importierter Snapshot in Requirements, Vorbereitung und Safety', () => {
  test('Citizenship und Dokument des Snapshots sind anwendbar, leere Plätze nicht', () => {
    const snapshot = person({ clientRef: REF_B, createdAt: '2026-08-01T00:00:00.000Z', countryCode: 'CH' })
    const extra = person({ clientRef: REF_EXTRA, createdAt: '2026-08-04T00:00:00.000Z', countryCode: 'RS' })
    const reise = beispielreise({ travellers: 2, party: [snapshot] })
    const slots = travellerSlots(reise)
    assert.equal(slots.filter((slot) => slot.applicable).length, 2)
    assert.equal(slots[0]?.clientRef, REF_B)
    assert.equal(slots[0]?.missingFacts.includes('nationality'), false)
    assert.equal(slots[1]?.clientRef, 'traveller:2')
    assert.equal(slots[1]?.persisted, false)
    assert.equal(slots[1]?.missingFacts.includes('nationality'), true)

    const fehlen = fehlendeFaktenFuerReise(reise)
    assert.equal(fehlen.includes('nationality'), true)

    const voll = beispielreise({ travellers: 1, party: [snapshot, extra] })
    assert.equal(travellerSlots(voll).some((slot) => !slot.applicable && slot.clientRef === REF_EXTRA), true)
    assert.equal(fehlendeFaktenFuerReise(voll).includes('nationality'), false)
    assert.equal(travellerSlots(voll).some((slot) => slot.applicable && slot.clientRef === REF_EXTRA), false)

    const checks = readinessChecksAbleiten(voll)
    const personen = new Set(checks.map((check) => check.travellerClientRef))
    assert.equal(personen.has(REF_B), true)
    assert.equal(personen.has(REF_EXTRA), false)
    assert.equal(personen.has('traveller:1'), false)

    const evaluations = requirementsLokalFuerReise(voll)
    const fuerSnapshot = evaluations.filter((eintrag) => eintrag.travellerClientRef === REF_B)
    assert.ok(fuerSnapshot.length > 0)
    assert.equal(
      fuerSnapshot.every((eintrag) => eintrag.missingFacts.includes('nationality')),
      false,
    )
    assert.equal(
      fuerSnapshot.some((eintrag) => eintrag.credentialOptionRef === `${REF_B}:${REF_B}:doc`),
      true,
    )
    assert.equal(
      evaluations.some((eintrag) => eintrag.travellerClientRef === REF_EXTRA),
      false,
    )

    const offen = requirementsLokalFuerReise(reise)
    const leererPlatz = offen.filter((eintrag) => eintrag.travellerClientRef === 'traveller:2')
    assert.ok(leererPlatz.length > 0)
    assert.equal(
      leererPlatz.every((eintrag) => eintrag.missingFacts.includes('nationality')),
      true,
    )
  })

  test('Safety sieht die Citizenship des anwendbaren Snapshots und ignoriert Überzählige', () => {
    const snapshot = person({ clientRef: REF_B, createdAt: '2026-08-01T00:00:00.000Z', countryCode: 'CH' })
    const extra = person({ clientRef: REF_EXTRA, createdAt: '2026-08-04T00:00:00.000Z', countryCode: 'CH' })
    const kanonRs = person({
      clientRef: 'traveller:1',
      createdAt: '2026-08-09T00:00:00.000Z',
      countryCode: 'RS',
      label: 'Kanon',
    })
    const fakt = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      travellerDependent: true,
      travellerCitizenshipCodes: ['CH'],
    })

    const sichtbar = mehrzielreise({ travellers: 1, party: [snapshot] })
    const sichtbarAuswertung = safetyAusFacts(sichtbar, [fakt], 'audit-safety', { nowMs: SAFETY_NOW_MS })
    assert.equal(sichtbarAuswertung[0]?.relevance, 'affected')
    assert.match(safetyContextFingerprint(sichtbar), new RegExp(`${REF_B}:CH:ok`))
    assert.equal(safetyContextFingerprint(sichtbar).includes(REF_EXTRA), false)

    const ueberzaehlig = mehrzielreise({ travellers: 1, party: [kanonRs, extra] })
    const ueberzaehligAuswertung = safetyAusFacts(ueberzaehlig, [fakt], 'audit-safety', { nowMs: SAFETY_NOW_MS })
    assert.equal(ueberzaehligAuswertung[0]?.relevance, 'not_affected')
    assert.equal(safetyContextFingerprint(ueberzaehlig).includes(REF_EXTRA), false)

    const leer = mehrzielreise({ travellers: 1, party: [] })
    const leerAuswertung = safetyAusFacts(leer, [fakt], 'audit-safety', { nowMs: SAFETY_NOW_MS })
    assert.equal(leerAuswertung[0]?.relevance, 'insufficient_context')
  })
})
