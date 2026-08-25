// lib/trips/arbeitsbereich.test.ts
//
// Die Übersicht darf nur zählen, was im Reisegraphen liegt.
// Eine zweite Tageswahrheit oder ein gemutmasster Providerstatus wäre ein
// Produktdefekt, auch wenn die Seite nicht abstürzt.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { itineraryEinTransit } from '@/lib/route/fixtures'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { routeKompaktOhneCode } from '@/lib/route/anzeige'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import {
  ARBEITSBEREICHE,
  STANDARD_ARBEITSBEREICH,
  aenderungIstSichtbar,
  arbeitsbereichLesen,
  bereichDarstellungKlasse,
  bereichSollMounten,
  bereichSollSichtbar,
  bereichStatus,
  besuchteBereicheErweitern,
  gewaehlterTagId,
  istArbeitsbereich,
  planStatus,
  planpunkteSammeln,
  tagesplanIstSichtbar,
  ungeplantePunkteLesen,
} from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

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
      {
        id: 'day-2',
        stageId: 'stage-1',
        dayIndex: 2,
        dayDate: '2026-09-13',
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

describe('Arbeitsbereich-Kennungen', () => {
  test('der Default auf Mobile ist die Übersicht', () => {
    assert.equal(STANDARD_ARBEITSBEREICH, 'uebersicht')
    assert.deepEqual(ARBEITSBEREICHE, ['uebersicht', 'fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'])
  })

  test('die Mobile-Navigation enthält keinen separaten Plan-Bereich', () => {
    assert.equal((ARBEITSBEREICHE as readonly string[]).includes('plan'), false)
    assert.equal(istArbeitsbereich('plan'), false)
  })

  test('unbekannte Werte und historisches plan fallen auf die Übersicht', () => {
    assert.equal(arbeitsbereichLesen('plan'), 'uebersicht')
    assert.equal(arbeitsbereichLesen('fluege'), 'fluege')
    assert.equal(arbeitsbereichLesen('budget'), 'uebersicht')
    assert.equal(arbeitsbereichLesen(undefined), 'uebersicht')
  })
})

describe('Status der Übersicht', () => {
  test('leere Reise behauptet keinen Flug, kein Hotel, keine Aktivität', () => {
    const status = bereichStatus(reise())
    assert.deepEqual(
      status.map((eintrag) => eintrag.bereich),
      ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'],
    )
    assert.deepEqual(
      status.map((eintrag) => eintrag.text),
      [
        'Noch kein Flug ausgewählt',
        'Noch keine Unterkunft ausgewählt',
        'Noch keine Aktivität geplant',
        'Noch keine Verbindung geplant',
      ],
    )
  })

  test('Planstatus ist Einleitung, kein eigener Bereichswechsel', () => {
    assert.equal(planStatus(reise()).text, '0 Punkte geplant')
    assert.equal(
      bereichStatus(reise()).some((eintrag) => (eintrag.bereich as string) === 'plan'),
      false,
    )
  })

  test('zählt nur vorhandene Arten und nimmt ungeplante Punkte mit', () => {
    const ohneTag = [punkt({ id: 'item-offen', kind: 'flight', title: 'ZRH–DPS', dayId: null })]
    const status = bereichStatus(
      reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [
              punkt({ id: 'item-1', kind: 'stay', title: 'Ubud Inn' }),
              punkt({ id: 'item-2', kind: 'activity', title: 'Reisterrassen' }),
              punkt({ id: 'item-3', kind: 'note', title: 'Frei' }),
            ],
          },
        ],
      }),
      ohneTag,
    )

    assert.equal(planpunkteSammeln(reise(), ohneTag).length, 1)
    assert.equal(planStatus(reise(), ohneTag).text, '1 Punkt geplant, davon 1 noch nicht eingeplant')
    assert.equal(status[0]?.text, 'noch nicht vollständig bestimmbar')
    assert.equal(status[1]?.text, 'Abdeckung noch nicht vollständig bestimmbar')
    assert.equal(status[2]?.text, '1 Aktivität geplant')
    assert.equal(status[3]?.bereich, 'mobilitaet')
  })

  test('zeigt gebuchten Hinflug und offenen Rückflug ehrlich', () => {
    const status = bereichStatus(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        startDate: '2026-08-30',
        endDate: '2026-09-13',
        stages: [
          {
            id: 'stage-1',
            position: 1,
            name: 'Bali',
            countryCode: 'ID',
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
            latitude: null,
            longitude: null,
            placeId: 'geonames:1650535',
          },
        ],
        ohneTag: [
          punkt({
            id: 'flug-hin',
            kind: 'flight',
            title: 'ZRH → DPS',
            dayId: null,
            startsOn: '2026-08-30',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
            priceAmount: 890,
            priceCurrency: 'CHF',
            provider: 'duffel',
            externalRef: 'off_1',
          }),
        ],
      }),
    )
    assert.equal(status[0]?.text, 'Hinflug gebucht · Rückflug offen')
  })

  test('erfindet keinen Status aus fehlenden Providerdaten', () => {
    const texte = [...bereichStatus(reise()), planStatus(reise())].map((eintrag) => eintrag.text).join(' ')
    assert.equal(texte.includes('unavailable'), false)
    assert.equal(texte.includes('Duffel'), false)
    assert.equal(texte.includes('Booking'), false)
  })
})

describe('P1-QS1-01 ungeplante Flug-Itinerary genau einmal', () => {
  function ungeplanterTransitFlug(id = 'flight-ungeplant'): TripItem {
    return punkt({
      id,
      kind: 'flight',
      title: 'Zürich → Bangkok',
      dayId: null,
      stageId: null,
      startsOn: '2026-11-01',
      startsAt: '09:15',
      endsOn: '2026-11-02',
      endsAt: '07:10',
      routeItinerary: itineraryEinTransit('DOH'),
    })
  }

  function transitReise(ohneTag: TripItem[]): Trip {
    return reise({
      origin: 'Zürich',
      originPlaceId: 'geonames:2657896',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      stages: [
        {
          id: 'stage-1',
          position: 1,
          name: 'Bangkok',
          countryCode: 'TH',
          arrivalDate: '2026-11-02',
          departureDate: '2026-11-10',
          latitude: null,
          longitude: null,
          placeId: 'geonames:1609350',
        },
      ],
      ohneTag,
    })
  }

  test('Produktpfad ohneTag === reise.ohneTag verdoppelt die Route nicht', () => {
    const aktuell = transitReise([ungeplanterTransitFlug()])
    const produkt = aktuell.ohneTag
    assert.equal(produkt, aktuell.ohneTag)
    assert.equal(ungeplantePunkteLesen(aktuell, produkt), produkt)

    const facts = routeFactsAusGraph({ days: aktuell.days, ohneTag: ungeplantePunkteLesen(aktuell, produkt) })
    const fluege = flugAbdeckung(aktuell, produkt)
    const status = bereichStatus(aktuell, produkt)
    const fluegeText = status.find((eintrag) => eintrag.bereich === 'fluege')?.text ?? ''

    assert.deepEqual(facts.sourceItemIds, ['flight-ungeplant'])
    assert.equal(facts.sourceItemIds.filter((id) => id === 'flight-ungeplant').length, 1)
    assert.equal(facts.segments.length, 2)
    assert.equal(facts.connections.length, 1)
    assert.equal(routeKompaktOhneCode(facts), 'Zürich → Doha → Bangkok')
    assert.equal(fluegeText.includes('Reihenfolge unbekannt'), false)
    assert.equal((fluegeText.match(/Zürich → Doha → Bangkok/g) ?? []).length, 1)
    assert.equal(fluegeText.includes(fluege.zusammenfassung), true)
    assert.equal(status[0]?.anzahl, 1)
    assert.equal(fluegeText.startsWith(`${routeKompaktOhneCode(facts)} · `) || fluegeText === fluege.zusammenfassung, true)
  })

  test('Guest-Fallback und Account-Prop sind dieselbe Presentation', () => {
    const aktuell = transitReise([ungeplanterTransitFlug()])
    const gast = bereichStatus(aktuell)
    const account = bereichStatus(aktuell, aktuell.ohneTag)
    assert.deepEqual(gast, account)
    assert.deepEqual(ungeplantePunkteLesen(aktuell), aktuell.ohneTag)
    assert.deepEqual(ungeplantePunkteLesen(aktuell, aktuell.ohneTag), aktuell.ohneTag)
  })

  test('explizites ohneTag, das nicht reise.ohneTag ist, geht genau einmal ein', () => {
    const imGraph = ungeplanterTransitFlug('flight-graph')
    const explizit = ungeplanterTransitFlug('flight-explizit')
    const aktuell = transitReise([imGraph])
    assert.notEqual(explizit, aktuell.ohneTag[0])
    const facts = routeFactsAusGraph({
      days: aktuell.days,
      ohneTag: ungeplantePunkteLesen(aktuell, [explizit]),
    })
    const status = bereichStatus(aktuell, [explizit])
    assert.deepEqual(facts.sourceItemIds, ['flight-explizit'])
    assert.equal(facts.segments.length, 2)
    assert.equal(facts.connections.length, 1)
    assert.equal(status[0]?.anzahl, 1)
    assert.equal((status[0]?.text.match(/Zürich → Doha → Bangkok/g) ?? []).length, 1)
    assert.equal(status[0]?.text.includes('Reihenfolge unbekannt'), false)
  })

  test('ohne explizites ohneTag liest reise.ohneTag genau einmal', () => {
    const aktuell = transitReise([ungeplanterTransitFlug()])
    const status = bereichStatus(aktuell)
    const facts = routeFactsAusGraph({ days: aktuell.days, ohneTag: ungeplantePunkteLesen(aktuell) })
    assert.deepEqual(facts.sourceItemIds, ['flight-ungeplant'])
    assert.equal(facts.segments.length, 2)
    assert.equal(facts.connections.length, 1)
    assert.equal((status[0]?.text.match(/Zürich → Doha → Bangkok/g) ?? []).length, 1)
  })

  test('ohne ungeplante Items bleibt leer und verdoppelt nichts', () => {
    const aktuell = transitReise([])
    assert.deepEqual(ungeplantePunkteLesen(aktuell), [])
    assert.deepEqual(ungeplantePunkteLesen(aktuell, aktuell.ohneTag), [])
    const facts = routeFactsAusGraph({ days: aktuell.days, ohneTag: ungeplantePunkteLesen(aktuell, aktuell.ohneTag) })
    const status = bereichStatus(aktuell, aktuell.ohneTag)
    assert.deepEqual(facts.sourceItemIds, [])
    assert.equal(facts.segments.length, 0)
    assert.equal(facts.connections.length, 0)
    assert.equal(status[0]?.text.includes('Reihenfolge unbekannt'), false)
    assert.equal(status[0]?.text.includes('Zürich → Doha → Bangkok'), false)
  })
})

describe('Tagesauswahl', () => {
  test('hält den gewählten Tag, wenn er noch existiert', () => {
    assert.equal(gewaehlterTagId(reise(), 'day-2'), 'day-2')
  })

  test('fällt auf den ersten Tag zurück, wenn der bisherige fehlt', () => {
    assert.equal(gewaehlterTagId(reise(), 'day-weg'), 'day-1')
    assert.equal(gewaehlterTagId(reise({ days: [] }), 'day-1'), '')
  })

  test('derselbe aktive Tag gilt für Übersicht/Tagesplan und Aktivitäten', () => {
    const aktiv = gewaehlterTagId(reise(), 'day-2')
    assert.equal(aktiv, 'day-2')
    assert.equal(tagesplanIstSichtbar('uebersicht'), true)
    assert.equal(tagesplanIstSichtbar('aktivitaeten'), false)
  })
})

describe('Sichtbarkeit und Mount', () => {
  test('auf allen Geräten ist nur der aktive Bereich sichtbar', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht'), true)
    assert.equal(bereichSollSichtbar('fluege', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('aktivitaeten', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('mobilitaet', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('mobilitaet', 'mobilitaet'), true)
  })

  test('der Tagesplan liegt in der Übersicht, nicht in einem eigenen Tab', () => {
    assert.equal(tagesplanIstSichtbar('uebersicht'), true)
    assert.equal(tagesplanIstSichtbar('fluege'), false)
    assert.equal(tagesplanIstSichtbar('unterkunft'), false)
    assert.equal(tagesplanIstSichtbar('aktivitaeten'), false)
    assert.equal(tagesplanIstSichtbar('mobilitaet'), false)
  })

  test('Desktop behält die Reise-Ebene und zeigt nicht alle Domains parallel', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht'), true)
    assert.equal(bereichSollSichtbar('fluege', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('unterkunft', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('aktivitaeten', 'uebersicht'), false)
    assert.equal(bereichSollSichtbar('mobilitaet', 'uebersicht'), false)
    assert.equal(tagesplanIstSichtbar('uebersicht'), true)
    assert.equal(tagesplanIstSichtbar('fluege'), false)
  })

  test('Hotel und Aktivitäten hängen erst beim Besuch ein', () => {
    const leer = new Set<'uebersicht'>()
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', leer), false)
    assert.equal(bereichSollMounten('aktivitaeten', 'uebersicht', leer), false)
    assert.equal(bereichSollMounten('fluege', 'fluege', leer), true)
    assert.equal(bereichSollMounten('uebersicht', 'fluege', leer), true)
  })

  test('ein einmal besuchter Suchbereich bleibt eingehängt', () => {
    const besucht = besuchteBereicheErweitern(new Set(), 'unterkunft')
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', besucht), true)
    assert.equal(besuchteBereicheErweitern(besucht, 'unterkunft'), besucht)
  })

  test('Desktop mountet die Übersicht und hängt Domains erst bei Besuch ein', () => {
    const leer = new Set<never>()
    assert.equal(bereichSollMounten('uebersicht', 'uebersicht', leer), true)
    assert.equal(bereichSollMounten('uebersicht', 'fluege', leer), true)
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', leer), false)
    assert.equal(bereichSollMounten('aktivitaeten', 'fluege', leer), false)
    assert.equal(bereichSollMounten('fluege', 'fluege', leer), true)
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht'), true)
    assert.equal(bereichSollSichtbar('fluege', 'fluege'), true)
  })

  test('Domain-Bereiche bleiben nach Besuch erreichbar und gemountet', () => {
    let besucht: ReadonlySet<(typeof ARBEITSBEREICHE)[number]> = new Set([STANDARD_ARBEITSBEREICH])
    for (const bereich of ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const) {
      assert.equal(bereichSollMounten(bereich, 'uebersicht', besucht), false)
      besucht = besuchteBereicheErweitern(besucht, bereich)
      assert.equal(bereichSollMounten(bereich, 'uebersicht', besucht), true)
      assert.equal(bereichSollSichtbar(bereich, bereich), true)
      assert.equal(bereichSollSichtbar(bereich, 'uebersicht'), false)
    }
  })

  test('Reise ändern ist nur sichtbar, wenn es geöffnet ist', () => {
    assert.equal(aenderungIstSichtbar(false), false)
    assert.equal(aenderungIstSichtbar(true), true)
  })

  test('ein verborgener Bereich trägt keine Display-Utility neben hidden', () => {
    assert.equal(bereichDarstellungKlasse(true, 'mt-6 grid gap-6'), 'hidden')
    assert.equal(bereichDarstellungKlasse(true, 'mt-6 grid gap-6').includes('grid'), false)
    assert.equal(bereichDarstellungKlasse(false, 'mt-6 grid gap-6'), 'mt-6 grid gap-6')
    assert.equal(bereichDarstellungKlasse(false, 'mt-6'), 'mt-6')
    assert.equal(bereichDarstellungKlasse(true), 'hidden')
  })
})
