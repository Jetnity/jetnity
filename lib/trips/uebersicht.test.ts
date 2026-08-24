// lib/trips/uebersicht.test.ts
//
// TW-2 verdichtet vorhandene Wahrheit. Ein zweiter Lifecycle oder eine
// Citizenship-Annahme wäre ein Produktdefekt.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { reiseGruppe } from '@/lib/account/reise-lage'
import {
  abdeckungLageAusText,
  uebersichtAbleiten,
  uebersichtLage,
  uebersichtPersonen,
} from '@/lib/trips/uebersicht'
import type { Trip, TripItem, TripTraveller } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'
const HEUTE = '2026-08-24'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
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
    ...teil,
  }
}

function reisender(teil: Partial<TripTraveller> & Pick<TripTraveller, 'id' | 'clientRef'>): TripTraveller {
  return {
    label: null,
    residenceCountryCode: null,
    citizenships: [],
    documents: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Ubud',
        countryCode: 'ID',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: null,
      },
    ],
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [],
      },
    ],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Reiseidentität', () => {
  test('datierte Reise zeigt Titel, Orte, Zeitraum und kommende Lage', () => {
    const sicht = uebersichtAbleiten(reise(), [], HEUTE)
    assert.equal(sicht.titel, 'Bali')
    assert.equal(sicht.orte, 'Ubud · ab Zürich')
    assert.match(sicht.zeitraum, /12\. Sept/)
    assert.equal(sicht.lage, 'kommend')
    assert.equal(sicht.lageText, 'Bevorstehende Reise')
  })

  test('undatierte Reise ist niemals vergangen oder abgeschlossen', () => {
    const sicht = uebersichtAbleiten(
      reise({ startDate: null, endDate: null, stages: [{ ...reise().stages[0]!, arrivalDate: null, departureDate: null }] }),
      [],
      HEUTE,
    )
    assert.equal(sicht.lage, 'ohne-datum')
    assert.equal(sicht.lageText, 'Zeitraum noch offen')
    assert.equal(sicht.zeitraum, 'Zeitraum noch offen')
    assert.equal(sicht.lageText.includes('vergangen'), false)
    assert.equal(sicht.fortschrittText.includes('abgeschlossen'), false)
  })

  test('ohne Geräte-Kalendertag wird keine zeitliche Lage behauptet', () => {
    assert.equal(uebersichtLage(reise(), null), null)
    assert.equal(uebersichtAbleiten(reise(), [], null).lageText, 'Zeitliche Lage noch nicht bestimmbar')
  })
})

describe('AP-3-Date-only', () => {
  test('Workspace-Lage entspricht reiseGruppe derselben Daten', () => {
    const kommend = reise({ startDate: '2026-09-01', endDate: '2026-09-08' })
    const aktiv = reise({ startDate: '2026-08-20', endDate: '2026-08-30' })
    const vergangen = reise({ startDate: '2026-07-01', endDate: '2026-07-05' })
    const offen = reise({ startDate: null, endDate: null })

    assert.equal(uebersichtLage(kommend, HEUTE), reiseGruppe(kommend, HEUTE))
    assert.equal(uebersichtLage(aktiv, HEUTE), reiseGruppe(aktiv, HEUTE))
    assert.equal(uebersichtLage(vergangen, HEUTE), reiseGruppe(vergangen, HEUTE))
    assert.equal(uebersichtLage(offen, HEUTE), reiseGruppe(offen, HEUTE))
    assert.equal(uebersichtLage(vergangen, HEUTE), 'vergangen')
    assert.equal(uebersichtAbleiten(vergangen, [], HEUTE).lageText, 'Vergangene Reise')
  })
})

describe('Personenkontext', () => {
  test('ohne party bleibt nur die Anzahl ohne Angaben', () => {
    const person = uebersichtPersonen(reise({ travellers: 2, party: [] }))
    assert.equal(person.quelle, 'travellers')
    assert.equal(person.anzahl, 2)
    assert.equal(person.text, '2 Reisende · Angaben noch offen')
  })

  test('party zählt Reisende und liest keine Citizenship', () => {
    const person = uebersichtPersonen(
      reise({
        travellers: 1,
        party: [
          reisender({
            id: 't1',
            clientRef: 'traveller:1',
            label: 'Alex',
            citizenships: [
              {
                id: 'c1',
                clientRef: 'cit:1',
                countryCode: 'CH',
                createdAt: JETZT,
                updatedAt: JETZT,
              },
              {
                id: 'c2',
                clientRef: 'cit:2',
                countryCode: 'IT',
                createdAt: JETZT,
                updatedAt: JETZT,
              },
            ],
          }),
          reisender({
            id: 't2',
            clientRef: 'traveller:2',
            label: 'Sam',
            citizenships: [
              {
                id: 'c3',
                clientRef: 'cit:3',
                countryCode: 'DE',
                createdAt: JETZT,
                updatedAt: JETZT,
              },
            ],
          }),
        ],
      }),
    )
    assert.equal(person.quelle, 'party')
    assert.equal(person.anzahl, 2)
    assert.equal(person.text, '2 Reisende')
    assert.equal(person.text.includes('CH'), false)
    assert.equal(person.text.includes('IT'), false)
    assert.equal(person.text.includes('DE'), false)
    assert.equal(person.text.includes('Alex'), false)
  })
})

describe('Coverage-Verdichtung', () => {
  test('leere Reise zählt nichts als erledigt', () => {
    const sicht = uebersichtAbleiten(reise(), [], HEUTE)
    assert.equal(sicht.fortschrittText, 'Noch nichts ausgewählt')
    assert.deepEqual(
      sicht.abdeckungen.map((eintrag) => eintrag.lage),
      ['offen', 'offen', 'offen', 'offen'],
    )
    assert.equal(sicht.planText, '0 Punkte geplant')
  })

  test('teilweise belegte Bereiche bleiben teilweise', () => {
    const sicht = uebersichtAbleiten(
      reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [punkt({ id: 'act-1', kind: 'activity', title: 'Reisterrassen' })],
          },
        ],
      }),
      [],
      HEUTE,
    )
    assert.equal(sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'aktivitaeten')?.lage, 'belegt')
    assert.equal(sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'fluege')?.lage, 'offen')
    assert.match(sicht.fortschrittText, /1 von 4 Bereichen belegt/)
    assert.equal(sicht.fortschrittText.includes('vollständig'), false)
  })

  test('unbestimmte Coverage zählt nicht als erledigt', () => {
    const sicht = uebersichtAbleiten(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        ohneTag: [punkt({ id: 'flug-1', kind: 'flight', title: 'ZRH–DPS', dayId: null })],
      }),
      [punkt({ id: 'flug-1', kind: 'flight', title: 'ZRH–DPS', dayId: null })],
      HEUTE,
    )
    const fluege = sicht.abdeckungen.find((eintrag) => eintrag.bereich === 'fluege')
    assert.equal(fluege?.lage, 'unbestimmt')
    assert.match(sicht.fortschrittText, /noch nicht vollständig bestimmbar/)
    assert.equal(sicht.fortschrittText.includes('Wesentliche Bereiche sind belegt'), false)
  })

  test('Unknown-Text wird nicht als offen oder belegt gelesen', () => {
    assert.equal(abdeckungLageAusText('noch nicht vollständig bestimmbar'), 'unbestimmt')
    assert.equal(abdeckungLageAusText('Abdeckung noch nicht vollständig bestimmbar'), 'unbestimmt')
    assert.equal(abdeckungLageAusText('Noch kein Flug ausgewählt'), 'offen')
    assert.equal(abdeckungLageAusText('Hinflug gebucht · Rückflug offen'), 'belegt')
  })
})

describe('Guest und Account', () => {
  test('derselbe Graph liefert denselben fachlichen Overview-Text', () => {
    const graph = reise({
      party: [reisender({ id: 't1', clientRef: 'traveller:1' })],
    })
    const gast = uebersichtAbleiten(graph, [], HEUTE)
    const konto = uebersichtAbleiten(graph, [], HEUTE)
    assert.deepEqual(gast, konto)
    assert.equal(JSON.stringify(gast).includes('Gerät'), false)
    assert.equal(JSON.stringify(konto).includes('Konto'), false)
  })
})
