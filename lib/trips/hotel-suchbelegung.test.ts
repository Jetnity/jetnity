import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { stay22Suche } from '@/lib/providers/stay22/suche'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'
import {
  HOTEL_BELEGUNG_FEHLT,
  HOTEL_BELEGUNG_UNGUELTIG,
  HOTEL_HINWEIS_ALTER,
  HOTEL_HINWEIS_BEIDES,
  HOTEL_HINWEIS_SUCHE,
  HOTEL_HINWEIS_ZIMMER,
  hotelAnbieterHinweis,
  hotelBelegungHinweis,
  hotelBelegungPruefen,
  hotelBelegungSetzen,
  hotelBelegungZurueck,
  hotelEtappenEntwurf,
  hotelEtappenMerken,
  hotelEtappenName,
  hotelGaesteText,
  hotelKopfzahl,
  hotelSuchtermine,
  hotelSuchvorlage,
} from './hotel-suchbelegung'

const heute = '2027-02-01'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: 'TH',
    arrivalDate: null,
    departureDate: null,
    latitude: 13.75,
    longitude: 100.52,
    placeId: 'geonames:1609350',
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  const basis = beispielreise()
  return {
    ...basis,
    id: 'gast-oder-konto',
    clientRef: 'gast-oder-konto',
    title: 'Thailand',
    origin: 'Zürich',
    startDate: '2027-03-01',
    endDate: '2027-03-20',
    travellers: 2,
    currency: 'CHF',
    party: undefined,
    ...teil,
  }
}

function person(id: string): TripTraveller {
  return {
    id,
    clientRef: id,
    label: id,
    residenceCountryCode: 'CH',
    citizenships: [],
    documents: [],
    createdAt: '2027-01-01T00:00:00.000Z',
    updatedAt: '2027-01-01T00:00:00.000Z',
  }
}

const bangkok = etappe({
  id: 'bkk-1',
  position: 1,
  name: 'Bangkok',
  arrivalDate: '2027-03-01',
  departureDate: '2027-03-06',
})
const bangkokWieder = etappe({
  id: 'bkk-2',
  position: 2,
  name: 'Bangkok',
  arrivalDate: '2027-03-12',
  departureDate: '2027-03-18',
})

describe('Hotel-Suchbelegung', () => {
  test('Solo, zwei Personen und eine Familie werden nicht zu Erwachsenen', () => {
    for (const travellers of [1, 2, 4, 12]) {
      const vorlage = hotelSuchvorlage(reise({ travellers, stages: [bangkok] }), bangkok)
      assert.equal(vorlage.reisende, travellers)
      assert.equal(vorlage.erwachsene, null)
      assert.equal(vorlage.kinder, null)
      assert.equal(vorlage.zimmer, null)
      assert.match(hotelGaesteText(vorlage.reisende, vorlage), /Belegung offen/)
      assert.doesNotMatch(hotelGaesteText(vorlage.reisende, vorlage), /Erwachsene/)
      const offen = hotelBelegungPruefen(vorlage)
      assert.equal(offen.ok, false)
      if (offen.ok) continue
      assert.equal(offen.fehler, HOTEL_BELEGUNG_FEHLT)
    }
    assert.equal(hotelKopfzahl(0), null)
    assert.equal(hotelKopfzahl(1.5), null)
  })

  test('eine gesetzte Belegung bleibt explizit und erfindet kein Kinderalter', () => {
    const zwei = hotelBelegungPruefen({ erwachsene: 2, kinder: 0, zimmer: 1 })
    assert.deepEqual(zwei, { ok: true, erwachsene: 2, kinder: 0, zimmer: 1, anbieterHinweis: null })
    assert.equal(hotelBelegungHinweis(2, { erwachsene: 2, kinder: 0, zimmer: 1 }), HOTEL_HINWEIS_SUCHE)
    const familie = hotelBelegungPruefen({ erwachsene: 2, kinder: 2, zimmer: 1 })
    assert.ok(familie.ok)
    if (!familie.ok) return
    assert.equal(familie.anbieterHinweis, HOTEL_HINWEIS_ALTER)
    const zimmer = hotelBelegungPruefen({ erwachsene: 2, kinder: 0, zimmer: 2 })
    assert.ok(zimmer.ok)
    if (!zimmer.ok) return
    assert.equal(zimmer.anbieterHinweis, HOTEL_HINWEIS_ZIMMER)
    const beides = hotelBelegungPruefen({ erwachsene: 2, kinder: 1, zimmer: 2 })
    assert.ok(beides.ok)
    if (!beides.ok) return
    assert.equal(beides.anbieterHinweis, HOTEL_HINWEIS_BEIDES)
    assert.equal(hotelAnbieterHinweis({ kinder: 0, zimmer: 1 }), null)
  })

  test('mehr Zimmer als Erwachsene werden begrenzt und ungültige Zahlen bleiben draussen', () => {
    assert.deepEqual(
      hotelBelegungSetzen({ erwachsene: 2, kinder: 1, zimmer: 2 }, { erwachsene: 1 }),
      { erwachsene: 1, kinder: 1, zimmer: 1 },
    )
    const zuVieleZimmer = hotelBelegungPruefen({ erwachsene: 2, kinder: 0, zimmer: 3 })
    assert.equal(zuVieleZimmer.ok, false)
    if (!zuVieleZimmer.ok) assert.equal(zuVieleZimmer.fehler, HOTEL_BELEGUNG_UNGUELTIG)
    assert.equal(hotelBelegungPruefen({ erwachsene: 2.2, kinder: 0, zimmer: 1 }).ok, false)
    assert.equal(hotelBelegungPruefen({ erwachsene: 10, kinder: 0, zimmer: 1 }).ok, false)
    assert.equal(hotelBelegungPruefen({ erwachsene: 2, kinder: 9, zimmer: 1 }).ok, false)
    assert.deepEqual(hotelBelegungZurueck(), { erwachsene: null, kinder: null, zimmer: null })
  })

  test('zwei Bangkok-Etappen behalten eigene Termine und keine ganze Reise', () => {
    const trip = reise({ stages: [bangkok, bangkokWieder], travellers: 4 })
    const erste = hotelSuchvorlage(trip, bangkok)
    const zweite = hotelSuchvorlage(trip, bangkokWieder)
    assert.deepEqual(
      { anreise: erste.anreise, abreise: erste.abreise, herkunft: erste.herkunft },
      { anreise: '2027-03-01', abreise: '2027-03-06', herkunft: 'etappe' },
    )
    assert.deepEqual(
      { anreise: zweite.anreise, abreise: zweite.abreise, herkunft: zweite.herkunft },
      { anreise: '2027-03-12', abreise: '2027-03-18', herkunft: 'etappe' },
    )
    assert.notEqual(`${erste.anreise}/${erste.abreise}`, `${trip.startDate}/${trip.endDate}`)
    assert.notEqual(`${zweite.anreise}/${zweite.abreise}`, `${trip.startDate}/${trip.endDate}`)
    assert.notEqual(erste.abreise, trip.endDate)
    assert.match(hotelEtappenName(trip, bangkok), /^1\. Bangkok · /)
    assert.match(hotelEtappenName(trip, bangkokWieder), /^2\. Bangkok · /)
    assert.notEqual(hotelEtappenName(trip, bangkok), hotelEtappenName(trip, bangkokWieder))
  })

  test('fehlende, halbe und verkehrte Etappendaten erfinden keinen Reisezeitraum', () => {
    const offen = etappe({ id: 'offen', position: 1, name: 'Phuket' })
    const halb = etappe({ id: 'halb', position: 2, name: 'Phuket', arrivalDate: '2027-03-08', departureDate: null })
    const verkehrt = etappe({
      id: 'verkehrt',
      position: 3,
      name: 'Chiang Mai',
      arrivalDate: '2027-03-18',
      departureDate: '2027-03-12',
    })
    const trip = reise({ stages: [offen, halb, verkehrt] })
    assert.deepEqual(hotelSuchtermine(trip, offen), { anreise: '', abreise: '', herkunft: 'offen' })
    assert.deepEqual(hotelSuchtermine(trip, halb), { anreise: '2027-03-08', abreise: '', herkunft: 'unvollstaendig' })
    assert.deepEqual(hotelSuchtermine(trip, verkehrt), { anreise: '', abreise: '', herkunft: 'ungueltig' })
    assert.equal(hotelSuchtermine(trip, undefined).herkunft, 'offen')
  })

  test('eine einzelne Etappe ohne eigene Daten darf die Reisedaten nennen', () => {
    const nur = etappe({ id: 'nur', position: 1, name: 'Bangkok', arrivalDate: null, departureDate: null })
    const trip = reise({ stages: [nur], startDate: '2027-04-02', endDate: '2027-04-09' })
    assert.deepEqual(hotelSuchtermine(trip, nur), {
      anreise: '2027-04-02',
      abreise: '2027-04-09',
      herkunft: 'einzelreise',
    })
    assert.equal(hotelEtappenName(trip, nur).startsWith('1. '), false)
  })

  test('Gast ohne Party und Konto mit Party ohne Geburtsdatum bleiben gleich', () => {
    const stages = [bangkok, bangkokWieder]
    const gast = hotelSuchvorlage(reise({ travellers: 3, stages, party: undefined }), bangkokWieder)
    const konto = hotelSuchvorlage(reise({
      travellers: 3,
      stages,
      party: [person('a'), person('b')],
    }), bangkokWieder)
    assert.deepEqual(gast, konto)
    assert.equal(gast.erwachsene, null)
    assert.equal(gast.anreise, '2027-03-12')
    assert.match(hotelBelegungHinweis(12, hotelBelegungZurueck()), /bis zu neun Erwachsene/)
  })

  test('Etappenwechsel behält eigene Eingaben und setzt nur den gewählten Teil zurück', () => {
    const trip = reise({ stages: [bangkok, bangkokWieder], travellers: 4 })
    const erste = hotelSuchvorlage(trip, bangkok)
    const zweite = hotelSuchvorlage(trip, bangkokWieder)
    let entwuerfe: Record<string, typeof erste> = {}
    entwuerfe = hotelEtappenMerken(entwuerfe, bangkok.id, erste, {
      anreise: '2027-03-02',
      abreise: '2027-03-05',
      ...hotelBelegungSetzen(erste, { erwachsene: 2, kinder: 2, zimmer: 2 }),
    })
    assert.equal(hotelEtappenEntwurf(entwuerfe, bangkokWieder.id, zweite).anreise, '2027-03-12')
    assert.equal(hotelEtappenEntwurf(entwuerfe, bangkokWieder.id, zweite).erwachsene, null)
    const bearbeitet = entwuerfe[bangkok.id]!
    entwuerfe = hotelEtappenMerken(entwuerfe, bangkok.id, erste, {
      anreise: erste.anreise,
      abreise: erste.abreise,
    })
    assert.equal(entwuerfe[bangkok.id]!.anreise, '2027-03-01')
    assert.equal(entwuerfe[bangkok.id]!.kinder, 2)
    entwuerfe = hotelEtappenMerken(entwuerfe, bangkok.id, erste, hotelBelegungZurueck())
    assert.equal(entwuerfe[bangkok.id]!.abreise, '2027-03-06')
    assert.deepEqual(
      { erwachsene: entwuerfe[bangkok.id]!.erwachsene, kinder: entwuerfe[bangkok.id]!.kinder, zimmer: entwuerfe[bangkok.id]!.zimmer },
      hotelBelegungZurueck(),
    )
    assert.equal(bearbeitet.anreise, '2027-03-02')
    assert.equal(hotelEtappenEntwurf(entwuerfe, 'fremd', zweite).abreise, zweite.abreise)
  })

  test('eine bestätigte Familienbelegung erreicht Stay22 nur als Anzahl, nie als Kinderalter', () => {
    const belegung = hotelBelegungPruefen({ erwachsene: 2, kinder: 2, zimmer: 2 })
    assert.ok(belegung.ok)
    if (!belegung.ok) return
    const result = stay22Suche({
      ort: { name: 'Bangkok', adresse: 'Bangkok, Thailand', latitude: 13.75, longitude: 100.52 },
      anreise: '2027-03-01',
      abreise: '2027-03-06',
      erwachsene: belegung.erwachsene,
      kinder: belegung.kinder,
      zimmer: belegung.zimmer,
      waehrung: 'CHF',
    }, heute)
    assert.ok('suche' in result)
    const parameter = new URL(result.suche.url).searchParams
    assert.equal(parameter.get('adults'), '2')
    assert.equal(parameter.get('children'), '2')
    assert.equal(parameter.get('rooms'), '2')
    assert.equal(parameter.get('checkin'), '2027-03-01')
    assert.equal(parameter.get('checkout'), '2027-03-06')
    for (const name of ['childage', 'childages', 'childrenages', 'age', 'ages', 'guestages', 'room1']) {
      assert.equal(parameter.has(name), false, name)
    }
    assert.equal(belegung.anbieterHinweis, HOTEL_HINWEIS_BEIDES)
    const ohne = hotelBelegungPruefen(hotelSuchvorlage(reise({ travellers: 4, stages: [bangkok] }), bangkok))
    assert.equal(ohne.ok, false)
  })
})
