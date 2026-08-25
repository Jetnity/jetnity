// lib/trips/detail.test.ts
//
// TW-5 Detail-State darf nur Referenzen tragen und tote Refs verwerfen.
// Keine zweite Coverage-Wahrheit, kein Pflicht-Gap aus 0 Aktivitäten,
// kein stilles Herkunftsdefault, keine Device- oder Guest-Sonderlogik.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { attentionAbleiten } from '@/lib/trips/attention'
import { gewaehlterTagId } from '@/lib/trips/arbeitsbereich'
import {
  bestandSollMounten,
  detailAuswahlAusBereich,
  detailBereinigen,
  detailDomainFuerKind,
  gapAuswahl,
  gapDetailAbleiten,
  itemAuswahl,
  itemDetailAbleiten,
  itemInReise,
  itemTrust,
  leereDetailAuswahl,
  sucheOeffnen,
  sucheSollMounten,
  attentionAktionAlsDetail,
  type WorkspaceDetailAuswahl,
} from '@/lib/trips/detail'
import type { Trip, TripItem, TripItemKind, TripSource } from '@/types/trips'

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
        placeId: 'geonames:1650535',
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

function flugReise(lage: 'offen' | 'teilweise' | 'unbestimmt'): Trip {
  if (lage === 'unbestimmt') {
    return reise({
      origin: null,
      originPlaceId: null,
      startDate: null,
      endDate: null,
    })
  }

  const hin = punkt({
    id: 'flug-hin',
    kind: 'flight',
    title: 'Zürich → Ubud',
    dayId: null,
    startsOn: '2026-09-12',
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
  })

  return reise({
    ohneTag: lage === 'teilweise' ? [hin] : [],
  })
}

function hotelReise(lage: 'offen' | 'teilweise' | 'unbestimmt'): Trip {
  if (lage === 'unbestimmt') {
    return reise({
      startDate: null,
      endDate: null,
      stages: [
        {
          id: 'stage-1',
          position: 1,
          name: 'Ubud',
          countryCode: 'ID',
          arrivalDate: null,
          departureDate: null,
          latitude: null,
          longitude: null,
          placeId: 'geonames:1650535',
        },
      ],
    })
  }

  if (lage === 'offen') return reise()

  return reise({
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [
          punkt({
            id: 'stay-1',
            kind: 'stay',
            title: 'Ubud Inn',
            startsOn: '2026-09-12',
            endsOn: '2026-09-14',
          }),
        ],
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
  })
}

describe('Detail-Resolver', () => {
  test('leere Auswahl bleibt leer', () => {
    assert.deepEqual(detailBereinigen(leereDetailAuswahl(), reise()), { art: 'keine' })
  })

  test('ein vorhandenes Item bleibt ausgewählt', () => {
    const aktuell = reise({
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt({ id: 'item-1', kind: 'note', title: 'Frei' })],
        },
      ],
    })
    assert.deepEqual(detailBereinigen(itemAuswahl('item-1'), aktuell), itemAuswahl('item-1'))
  })

  test('ein entferntes Item verwirft die tote Referenz', () => {
    assert.deepEqual(detailBereinigen(itemAuswahl('weg'), reise()), { art: 'keine' })
  })

  test('ein verschobenes Item bleibt über die ID auffindbar', () => {
    const ohneTag = [punkt({ id: 'item-1', kind: 'activity', title: 'Markt', dayId: null, stageId: null })]
    const auswahl = itemAuswahl('item-1')
    assert.equal(itemInReise(reise(), ohneTag, 'item-1')?.id, 'item-1')
    assert.deepEqual(detailBereinigen(auswahl, reise(), ohneTag), auswahl)
  })

  test('Gap-Refs bleiben gültig und kopieren keine Fakten', () => {
    const auswahl = gapAuswahl('fluege', 'coverage:fluege')
    const bereinigt = detailBereinigen(auswahl, reise())
    assert.equal(bereinigt.art, 'gap')
    if (bereinigt.art !== 'gap') return
    assert.equal(bereinigt.domain, 'fluege')
    assert.equal(bereinigt.sucheOffen, false)
    assert.equal('text' in bereinigt, false)
    assert.equal('lage' in bereinigt, false)
  })

  test('historischer Domain-Start öffnet nur das Gap, nicht die Suche', () => {
    assert.deepEqual(detailAuswahlAusBereich('unterkunft'), gapAuswahl('unterkunft'))
    assert.deepEqual(detailAuswahlAusBereich('uebersicht'), { art: 'keine' })
    assert.deepEqual(detailAuswahlAusBereich('plan'), { art: 'keine' })
  })
})

describe('Flight Gap', () => {
  test('offen bleibt eine bekannte Lücke, ohne Suche', () => {
    const gap = gapDetailAbleiten(flugReise('offen'), [], 'fluege')
    assert.equal(gap.lage, 'offen')
    assert.equal(gap.istPflichtLuecke, true)
    assert.equal(gap.sucheAnbietbar, true)
    assert.match(gap.naechsterSchritt, /ausdrücklich/)
  })

  test('teilweise bleibt von belegt getrennt', () => {
    const gap = gapDetailAbleiten(flugReise('teilweise'), flugReise('teilweise').ohneTag, 'fluege')
    assert.equal(gap.lage, 'teilweise')
    assert.equal(gap.istPflichtLuecke, true)
    assert.notEqual(gap.lage, 'belegt')
  })

  test('unbestimmt bleibt unbestimmt und nicht unavailable', () => {
    const gap = gapDetailAbleiten(flugReise('unbestimmt'), [], 'fluege')
    assert.equal(gap.lage, 'unbestimmt')
    assert.match(gap.naechsterSchritt, /nicht vollständig bestimmbar/)
    assert.equal(gap.text.includes('unavailable'), false)
  })
})

describe('Stay Gap', () => {
  test('offen beschreibt fehlende Nächte nur aus vorhandener Coverage', () => {
    const gap = gapDetailAbleiten(hotelReise('offen'), [], 'unterkunft')
    assert.equal(gap.lage, 'offen')
    assert.match(gap.text, /Unterkunft|Nacht|Nächte|ausgewählt/i)
  })

  test('teilweise bleibt teilweise', () => {
    const gap = gapDetailAbleiten(hotelReise('teilweise'), [], 'unterkunft')
    assert.equal(gap.lage, 'teilweise')
    assert.equal(gap.istPflichtLuecke, true)
  })

  test('unbestimmt bleibt unbestimmt', () => {
    const gap = gapDetailAbleiten(hotelReise('unbestimmt'), [], 'unterkunft')
    assert.equal(gap.lage, 'unbestimmt')
    assert.match(gap.naechsterSchritt, /nicht vollständig bestimmbar/)
  })
})

describe('Activities', () => {
  test('0 Aktivitäten sind kein Pflicht-Gap', () => {
    const gap = gapDetailAbleiten(reise(), [], 'aktivitaeten')
    assert.equal(gap.lage, 'offen')
    assert.equal(gap.istPflichtLuecke, false)
    assert.match(gap.naechsterSchritt, /optional/)
    assert.equal(gap.text.includes('unvollständig'), false)
  })

  test('vorhandene Aktivitäten bleiben Items, nicht Pflicht-Lücken', () => {
    const aktuell = reise({
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
    })
    const gap = gapDetailAbleiten(aktuell, [], 'aktivitaeten')
    const item = itemDetailAbleiten(aktuell, [], 'act-1')
    assert.equal(gap.lage, 'belegt')
    assert.equal(gap.istPflichtLuecke, false)
    assert.equal(item?.kind, 'activity')
    assert.equal(item?.sucheAnbietbar, true)
  })
})

describe('Mobility', () => {
  test('offene Bodenmobilität bleibt offen und täuscht keinen Adapter vor', () => {
    const gap = gapDetailAbleiten(reise(), [], 'mobilitaet')
    assert.equal(gap.lage, 'offen')
    assert.equal(gap.coveredByFlight, false)
    assert.match(gap.naechsterSchritt, /Live-Mobilitätsadapter/)
  })

  test('unbestimmte Mobilität bleibt unbestimmt', () => {
    const gap = gapDetailAbleiten(
      reise({ origin: null, originPlaceId: null, startDate: null, endDate: null }),
      [],
      'mobilitaet',
    )
    assert.equal(gap.lage, 'unbestimmt')
    assert.equal(gap.coveredByFlight, false)
  })

  test('ein gleichdatiger Flug ohne Routennachweis wird nicht zu covered-by-flight erfunden', () => {
    const aktuell = reise({
      ohneTag: [
        punkt({
          id: 'flug-hin',
          kind: 'flight',
          title: 'Zürich → Ubud',
          dayId: null,
          startsOn: '2026-09-12',
        }),
      ],
    })
    const gap = gapDetailAbleiten(aktuell, aktuell.ohneTag, 'mobilitaet')
    assert.equal(gap.coveredByFlight, false)
    assert.equal(gap.lage, 'unbestimmt')
    assert.notEqual(gap.lage, 'offen')
    assert.match(gap.naechsterSchritt, /nicht vollständig bestimmbar/)
  })
})

describe('Item Details', () => {
  const arten: TripItemKind[] = ['flight', 'stay', 'activity', 'transfer', 'rental_car', 'note']

  for (const kind of arten) {
    test(`${kind} öffnet vorhandene Item-Fakten`, () => {
      const aktuell = reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [
              punkt({
                id: `item-${kind}`,
                kind,
                title: `Punkt ${kind}`,
                note: kind === 'note' ? 'Nur merken' : null,
                priceAmount: kind === 'note' ? null : 120,
                priceCurrency: kind === 'note' ? null : 'CHF',
              }),
            ],
          },
        ],
      })
      const detail = itemDetailAbleiten(aktuell, [], `item-${kind}`)
      assert.equal(detail?.kind, kind)
      assert.equal(detail?.title, `Punkt ${kind}`)
      assert.equal(detail?.ungeplant, false)
      assert.equal(detail?.dayId, 'day-1')
      if (kind === 'note') {
        assert.equal(detail?.domain, null)
        assert.equal(detail?.sucheAnbietbar, false)
        assert.equal(detail?.trust, 'notiz')
        assert.equal(detail?.priceAmount, null)
      } else {
        assert.equal(detail?.domain, detailDomainFuerKind(kind))
        assert.equal(detail?.priceAmount, 120)
        assert.equal(detail?.priceCurrency, 'CHF')
      }
    })
  }

  test('note bleibt ohne Commercial-Fiktion', () => {
    const aktuell = reise({
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt({ id: 'note-1', kind: 'note', title: 'Frei', provider: 'duffel' })],
        },
      ],
    })
    const detail = itemDetailAbleiten(aktuell, [], 'note-1')
    assert.equal(detail?.trust, 'notiz')
    assert.equal(detail?.sucheAnbietbar, false)
    assert.match(detail?.trustText ?? '', /Kein Buchungs/)
  })

  test('Preis erscheint nur bei vorhandenem Betrag und Währung', () => {
    const aktuell = reise({
      days: [
        {
          id: 'day-1',
          stageId: 'stage-1',
          dayIndex: 1,
          dayDate: '2026-09-12',
          title: null,
          items: [punkt({ id: 'flug-1', kind: 'flight', title: 'Flug', priceAmount: 80, priceCurrency: null })],
        },
      ],
    })
    const detail = itemDetailAbleiten(aktuell, [], 'flug-1')
    assert.equal(detail?.priceAmount, 80)
    assert.equal(detail?.priceCurrency, null)
  })

  test('Herkunftsfelder machen kein verifiziertes Angebot', () => {
    assert.equal(
      itemTrust({
        kind: 'flight',
        provider: 'duffel',
        externalRef: 'off_1',
        bookingUrl: null,
        bookingStatus: 'unconfirmed',
      }),
      'herkunft-vorhanden',
    )
  })
})

describe('Ungeplante Items', () => {
  test('ohneTag öffnet ohne erfundenen Tag oder Stage', () => {
    const ohneTag = [punkt({ id: 'offen-1', kind: 'note', title: 'Offener Punkt', dayId: null, stageId: null })]
    const detail = itemDetailAbleiten(reise(), ohneTag, 'offen-1')
    assert.equal(detail?.ungeplant, true)
    assert.equal(detail?.dayId, null)
    assert.equal(detail?.stageId, null)
  })

  test('ein Item mit totem Tag wird ungeplant, ohne Fake-Tag', () => {
    const ohneTag = [punkt({ id: 'alt-1', kind: 'stay', title: 'Hotel', dayId: 'day-weg', stageId: 'stage-weg' })]
    const detail = itemDetailAbleiten(reise(), ohneTag, 'alt-1')
    assert.equal(detail?.ungeplant, true)
    assert.equal(detail?.dayId, null)
    assert.equal(detail?.stageId, null)
  })
})

describe('Auswahlstabilität', () => {
  test('Detail-State ändert den gewählten Tag nicht', () => {
    const aktuell = reise()
    const vorher = gewaehlterTagId(aktuell, 'day-2')
    detailBereinigen(itemAuswahl('gibt-es-nicht'), aktuell)
    gapDetailAbleiten(aktuell, [], 'fluege')
    assert.equal(gewaehlterTagId(aktuell, vorher), 'day-2')
    assert.equal(vorher, 'day-2')
  })
})

describe('Guest und Account', () => {
  test('dieselbe Presentation-Logik ohne zweite State Machine', () => {
    const aktuell = flugReise('offen')
    const guest = gapDetailAbleiten(aktuell, [], 'fluege')
    const account = gapDetailAbleiten(aktuell, [], 'fluege')
    assert.deepEqual(guest, account)
    const item = punkt({ id: 'note-1', kind: 'note', title: 'Frei' })
    const mitItem = reise({
      days: [{ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-09-12', title: null, items: [item] }],
    })
    assert.deepEqual(itemDetailAbleiten(mitItem, [], 'note-1'), itemDetailAbleiten(mitItem, [], 'note-1'))
    const quellen: TripSource[] = ['guest', 'account']
    assert.equal(quellen.length, 2)
    assert.equal('quelle' in guest, false)
  })
})

describe('Geräteparität', () => {
  test('Ableitungen haben keinen Device-Parameter', () => {
    const gap = gapDetailAbleiten(reise(), [], 'unterkunft')
    const item = itemDetailAbleiten(
      reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [punkt({ id: 'item-1', kind: 'transfer', title: 'Zug' })],
          },
        ],
      }),
      [],
      'item-1',
    )
    assert.equal(Object.hasOwn(gap, 'kompakt'), false)
    assert.equal(Object.hasOwn(item ?? {}, 'desktop'), false)
    assert.deepEqual(gap, gapDetailAbleiten(reise(), [], 'unterkunft'))
  })
})

describe('Lazy Mount', () => {
  test('Initialreise mountet keine Commercial-Suche', () => {
    const leer = new Set<never>()
    const keine = leereDetailAuswahl()
    for (const domain of ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const) {
      assert.equal(sucheSollMounten(domain, keine, leer), false)
      assert.equal(bestandSollMounten(domain, keine, leer), false)
    }
  })

  test('Gap ohne Suche mountet Bestand, aber nicht die Suche', () => {
    const auswahl = gapAuswahl('unterkunft')
    const leer = new Set<never>()
    assert.equal(bestandSollMounten('unterkunft', auswahl, leer), true)
    assert.equal(sucheSollMounten('unterkunft', auswahl, leer), false)
    assert.equal(sucheSollMounten('fluege', auswahl, leer), false)
  })

  test('explizites Öffnen mountet nur die angeforderte Suche und behält sie', () => {
    const offen = sucheOeffnen(gapAuswahl('aktivitaeten'))
    const leer = new Set<never>()
    assert.equal(sucheSollMounten('aktivitaeten', offen, leer), true)
    assert.equal(sucheSollMounten('fluege', offen, leer), false)
    const besucht = new Set(['aktivitaeten'] as const)
    assert.equal(sucheSollMounten('aktivitaeten', leereDetailAuswahl(), besucht), true)
    assert.equal(sucheSollMounten('unterkunft', leereDetailAuswahl(), besucht), false)
  })
})

describe('Attention bleibt workspace-lokal', () => {
  test('Coverage-Flight/Stay öffnen Gaps, Official bleibt auf der Reise', () => {
    const sicht = attentionAbleiten({
      reise: reise(),
      ohneTag: [],
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    const fluege = sicht.punkte.find((eintrag) => eintrag.signal === 'coverage.fluege')
    const hotel = sicht.punkte.find((eintrag) => eintrag.signal === 'coverage.unterkunft')
    const official = sicht.punkte.find((eintrag) => eintrag.signal.startsWith('official.'))
    assert.deepEqual(attentionAktionAlsDetail(fluege?.aktion ?? null), gapAuswahl('fluege'))
    assert.deepEqual(attentionAktionAlsDetail(hotel?.aktion ?? null), gapAuswahl('unterkunft'))
    assert.equal(attentionAktionAlsDetail(official?.aktion ?? null), 'reise')
    assert.equal(
      sicht.punkte.some((eintrag) => eintrag.signal === 'coverage.aktivitaeten'),
      false,
    )
  })
})

describe('State trägt keine Hard Facts', () => {
  test('Auswahl enthält nur Intent und IDs', () => {
    const auswahl: WorkspaceDetailAuswahl = sucheOeffnen(itemAuswahl('item-1'))
    assert.equal(JSON.stringify(auswahl).includes('CHF'), false)
    assert.equal(JSON.stringify(auswahl).includes('unavailable'), false)
    assert.equal(JSON.stringify(auswahl).includes('ZRH'), false)
  })
})
