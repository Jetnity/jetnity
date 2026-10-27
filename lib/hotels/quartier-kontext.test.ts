import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  checkInAus,
  checkOutAus,
  hotelSucheEingabeAusReise,
  naechteZwischen,
  quartierKontextAusReise,
  suchanfrageAusKontext,
} from '@/lib/hotels/quartier-kontext'
import { quartiereBewerten } from '@/lib/hotels/quartier-ranking'
import type { HotelSucheEingabe } from '@/lib/hotels/schema'
import type { Trip, TripStage } from '@/types/trips'

const EINGABE: HotelSucheEingabe = {
  stage: {
    id: 'stage-1',
    name: 'Barcelona',
    placeId: 'geonames:3128760',
    latitude: 41.3874,
    longitude: 2.1686,
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
  },
  trip: {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    interests: ['food'],
    pace: 'calm',
  },
  rooms: 1,
  children: 0,
  flights: [],
}

describe('Quartierkontext aus der Reise', () => {
  test('Nächte kommen aus An- und Abreise, nicht aus Schätzung', () => {
    assert.equal(naechteZwischen('2026-09-12', '2026-09-16'), 4)
    assert.equal(naechteZwischen('2026-09-12', '2026-09-12'), null)
    assert.equal(naechteZwischen(null, '2026-09-16'), null)
  })

  test('ohne Koordinaten entsteht kein Quartierkandidat und keine Wegezeit', () => {
    const ergebnis = quartierKontextAusReise({
      ...EINGABE,
      stage: { ...EINGABE.stage, latitude: null, longitude: null },
    })
    assert.equal(ergebnis.kandidaten.length, 0)
    assert.equal(ergebnis.evidenz.hatKoordinaten, false)
    assert.equal(ergebnis.evidenz.hatWegezeiten, false)
  })

  test('ein Planpunkt ohne Koordinaten wird nicht zum Anker erfunden', () => {
    const etappe: TripStage = {
      id: 'stage-1',
      position: 1,
      name: 'Barcelona',
      countryCode: 'ES',
      arrivalDate: '2026-09-12',
      departureDate: '2026-09-16',
      latitude: 41.3874,
      longitude: 2.1686,
      placeId: 'geonames:3128760',
    }
    const reise = {
      stages: [etappe],
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-13',
          title: null,
          items: [
            {
              id: 'item-1',
              dayId: 'day-1',
              stageId: 'stage-1',
              kind: 'activity',
              title: 'Sagrada Família',
              note: null,
              position: 1,
              startsOn: '2026-09-13',
              startsAt: '10:00',
              endsOn: null,
              endsAt: null,
              priceAmount: null,
              priceCurrency: null,
              provider: null,
              externalRef: null,
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
            },
          ],
        },
      ],
      ohneTag: [],
      travellers: 2,
      currency: 'CHF',
      budgetAmount: 3500,
      interests: ['food'],
      pace: 'calm',
      startDate: '2026-09-12',
      endDate: '2026-09-16',
    } as Pick<Trip, 'stages' | 'days' | 'ohneTag' | 'travellers' | 'currency' | 'budgetAmount' | 'interests' | 'pace' | 'startDate' | 'endDate'>

    const eingabe = hotelSucheEingabeAusReise(reise as Trip, etappe)
    const kontext = quartierKontextAusReise(eingabe)
    assert.equal(kontext.kontext?.reiseAnker.length, 1)
    assert.equal(kontext.kontext?.reiseAnker[0]?.name, 'Barcelona')
    assert.equal(kontext.kandidaten[0]?.taeglicheWegeMinuten, null)
    assert.equal(kontext.kandidaten[0]?.herkunft, 'etappenort')
  })

  test('ein früher Abflug erhöht die Abreise-Priorität, erfindet aber keine Transferzeit', () => {
    const ergebnis = quartierKontextAusReise({
      ...EINGABE,
      flights: [{ startsOn: '2026-09-16', startsAt: '06:40' }],
    })
    assert.equal(ergebnis.kontext?.transferPrioritaet.abreise, 1)
    assert.equal(ergebnis.kandidaten[0]?.abreiseTransferMinuten, null)
    assert.equal(ergebnis.evidenz.hatTransferzeiten, false)
  })

  test('Quartiergründe behaupten keine kurzen Wege ohne Wegezeitdaten', () => {
    const ergebnis = quartierKontextAusReise(EINGABE)
    const bewertet = quartiereBewerten(ergebnis.kandidaten, ergebnis.kontext!)
    const texte = bewertet[0]?.reasons.join(' ') ?? ''
    assert.match(texte, /fehlen noch Wegezeitdaten/)
    assert.equal(texte.includes('Kurze Wege'), false)
    assert.equal(texte.includes('öffentlichen Verkehrsmitteln'), false)
  })

  test('mehrere Orte ohne Etappenzeitraum erzeugen keine Reise-Suchdaten', () => {
    const etappe: TripStage = {
      ...EINGABE.stage,
      arrivalDate: null,
      departureDate: null,
    } as TripStage
    const reise = {
      stages: [etappe, { ...etappe, id: 'stage-2', name: 'Rom' }],
      days: [],
      ohneTag: [],
      travellers: 2,
      currency: 'CHF',
      budgetAmount: 3500,
      interests: ['food'],
      pace: 'calm',
      startDate: '2026-09-12',
      endDate: '2026-09-16',
    } as unknown as Trip
    const eingabe = hotelSucheEingabeAusReise(reise, etappe)
    assert.equal(eingabe.stage.arrivalDate, null)
    assert.equal(eingabe.stage.departureDate, null)
    assert.equal(eingabe.trip.startDate, '2026-09-12')
    assert.equal(checkInAus(eingabe), null)
    assert.equal(checkOutAus(eingabe), null)
    assert.equal(suchanfrageAusKontext(eingabe, null), null)
  })

  test('eine Etappe ohne Daten trägt den Reisezeitraum in die Suchanfrage', () => {
    const etappe = { ...EINGABE.stage, arrivalDate: null, departureDate: null } as TripStage
    const reise = {
      stages: [etappe],
      days: [],
      ohneTag: [],
      travellers: 2,
      currency: 'CHF',
      budgetAmount: null,
      interests: [],
      pace: null,
      startDate: '2026-09-12',
      endDate: '2026-09-16',
    } as unknown as Trip
    const eingabe = hotelSucheEingabeAusReise(reise, etappe)
    assert.equal(checkInAus(eingabe), '2026-09-12')
    assert.equal(checkOutAus(eingabe), '2026-09-16')
    assert.equal(suchanfrageAusKontext(eingabe, null)?.checkIn, '2026-09-12')
    assert.equal(suchanfrageAusKontext(eingabe, null)?.checkOut, '2026-09-16')
  })

  test('Nutzerinteressen erzeugen kein Quartierprofil', () => {
    const ergebnis = quartierKontextAusReise(EINGABE)
    assert.equal(ergebnis.evidenz.hatPraeferenzprofil, false)
    assert.equal(ergebnis.kandidaten[0]?.essenScore, null)
    assert.equal(ergebnis.kontext?.praeferenzen.essen, 0.8)
  })
})
