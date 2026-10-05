import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { Ort } from '@/lib/places/domain'
import {
  ROUTE_EINSTIEG_KEY,
  ROUTE_EINSTIEG_MELDUNG,
  ROUTE_EINTRAG_MAX,
  ROUTE_TRANSPORT_MAX,
  neuesRouteVorkommen,
  routeAbsendenPruefen,
  routeEinstiegAusParams,
  routeEinstiegHref,
  routePendingText,
  routeVorkommenEntfernen,
  routeVorkommenErsetzen,
  routeVorkommenHinzufuegen,
  routeVorkommenVerschieben,
  routeZieleBestaetigen,
  startzielAuswahlUebernehmen,
  startzielErsetzenStarten,
  startzielHatUnbestaetigtenEntwurf,
  startzielVorkommenEntfernen,
  tripPlannerPrimaerMitWeiteremTauschen,
  tripPlannerRouteVorbelegen,
  type StartzielStand,
} from '@/lib/places/route-einstieg'
import { GRENZEN } from '@/lib/trips/schema'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: teil.typ ?? 'city',
    country: teil.country ?? 'France',
    countryCode: teil.countryCode ?? 'FR',
    region: null,
    lat: teil.lat ?? 48.85,
    lon: teil.lon ?? 2.35,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const PARIS = ort({ id: 'geonames:2988507', name: 'Paris' })
const ROM = ort({ id: 'geonames:3169070', name: 'Rom', countryCode: 'IT' })
const CUSCO = ort({ id: 'geonames:3941584', name: 'Cusco', countryCode: 'PE' })

describe('Homepage-Route-Entry Transport', () => {
  test('ohne zielIds bleibt der bisherige Einzelziel-Pfad frei', () => {
    assert.deepEqual(routeEinstiegAusParams(undefined), { art: 'kein' })
    assert.deepEqual(routeEinstiegAusParams({}), { art: 'kein' })
    assert.deepEqual(routeEinstiegAusParams({ zielId: PARIS.id }), { art: 'kein' })
    assert.deepEqual(routeEinstiegAusParams({ ziel: 'Paris', idee: 'Stadt' }), { art: 'kein' })
  })

  test('zielIds plus zielId oder ziel ist Konflikt vor jeder Ortsabfrage', () => {
    const mitId = routeEinstiegAusParams({ zielIds: PARIS.id, zielId: ROM.id })
    const mitName = routeEinstiegAusParams({ zielIds: PARIS.id, ziel: 'Rom' })
    assert.equal(mitId.art, 'konflikt')
    assert.equal(mitName.art, 'konflikt')
    if (mitId.art === 'konflikt') assert.equal(mitId.meldung, ROUTE_EINSTIEG_MELDUNG.konflikt)
  })

  test('leere oder nur-Whitespace zielIds werden vor Lookup abgelehnt', () => {
    assert.equal(routeEinstiegAusParams({ zielIds: '' }).art, 'transport_ungueltig')
    assert.equal(routeEinstiegAusParams({ zielIds: '   ' }).art, 'transport_ungueltig')
    assert.equal(routeEinstiegAusParams({ zielIds: ['', ''] }).art, 'transport_ungueltig')
  })

  test('überlange Einträge und Transport werden vor Lookup abgelehnt', () => {
    const zuLang = `geonames:${'1'.repeat(ROUTE_EINTRAG_MAX)}`
    const lang = routeEinstiegAusParams({ zielIds: zuLang })
    assert.equal(lang.art, 'transport_ungueltig')
    if (lang.art === 'transport_ungueltig') assert.equal(lang.grund, 'zuGross')

    const roh = 'x'.repeat(ROUTE_TRANSPORT_MAX + 1)
    const gross = routeEinstiegAusParams({ zielIds: roh })
    assert.equal(gross.art, 'transport_ungueltig')
    if (gross.art === 'transport_ungueltig') assert.equal(gross.grund, 'zuGross')
  })

  test('mehr als 50 Ziele werden nicht auf eine gültige Teilliste gekürzt', () => {
    const ids = Array.from({ length: GRENZEN.etappenJeReise + 1 }, (_, index) => `geonames:${2000000 + index}`)
    const ergebnis = routeEinstiegAusParams({ zielIds: ids })
    assert.equal(ergebnis.art, 'transport_ungueltig')
    if (ergebnis.art === 'transport_ungueltig') {
      assert.equal(ergebnis.grund, 'zuViele')
      assert.equal(ergebnis.meldung, ROUTE_EINSTIEG_MELDUNG.zuViele)
    }
  })

  test('ungültige oder rollenfremde Transport-IDs bleiben fail-closed', () => {
    const text = routeEinstiegAusParams({ zielIds: ['Paris', ROM.id] })
    const airport = routeEinstiegAusParams({ zielIds: 'airport:ZRH' })
    const gemischt = routeEinstiegAusParams({ zielIds: [PARIS.id, 'geonames:abc'] })
    assert.equal(text.art, 'transport_ungueltig')
    assert.equal(airport.art, 'transport_ungueltig')
    assert.equal(gemischt.art, 'transport_ungueltig')
  })

  test('Paris → Rom → Paris bleibt drei IDs in derselben Reihenfolge', () => {
    const ergebnis = routeEinstiegAusParams({
      zielIds: [PARIS.id, ROM.id, PARIS.id],
    })
    assert.deepEqual(ergebnis, { art: 'ok', ids: [PARIS.id, ROM.id, PARIS.id] })
  })

  test('idee bleibt neben gültigem zielIds erlaubt', () => {
    const ergebnis = routeEinstiegAusParams({
      zielIds: [PARIS.id, CUSCO.id],
      idee: 'Anden',
    })
    assert.deepEqual(ergebnis, { art: 'ok', ids: [PARIS.id, CUSCO.id] })
  })
})

describe('Homepage-Route-Entry Bestätigung', () => {
  test('Leseausfall ist kein erfolgreicher Nulltreffer und keine Teilroute', () => {
    const ausfall = routeZieleBestaetigen([PARIS.id, ROM.id], null)
    assert.deepEqual(ausfall, { art: 'ausfall', meldung: ROUTE_EINSTIEG_MELDUNG.ausfall })
  })

  test('fehlende oder rollenfremde IDs erzeugen keine Teilroute', () => {
    const fehlend = routeZieleBestaetigen([PARIS.id, 'geonames:1'], [PARIS])
    assert.equal(fehlend.art, 'unbestaetigt')
    if (fehlend.art === 'unbestaetigt') {
      assert.equal(fehlend.meldung, ROUTE_EINSTIEG_MELDUNG.unvollstaendig)
      assert.equal(fehlend.zielIndex, 1)
    }

    const flughafen = ort({ id: 'airport:ZRH', name: 'Zürich', typ: 'airport', countryCode: 'CH' })
    const rolle = routeZieleBestaetigen(['airport:ZRH'], [flughafen])
    assert.equal(rolle.art, 'unbestaetigt')
  })

  test('kanonische Servernamen gewinnen, Duplikate bleiben erhalten', () => {
    const clientParis = ort({ id: PARIS.id, name: 'Paris XY' })
    const bestaetigt = routeZieleBestaetigen([PARIS.id, ROM.id, PARIS.id], [PARIS, ROM, clientParis])
    assert.equal(bestaetigt.art, 'bestaetigt')
    if (bestaetigt.art !== 'bestaetigt') return
    assert.deepEqual(
      bestaetigt.ziele.map((ziel) => ziel.id),
      [PARIS.id, ROM.id, PARIS.id],
    )
    assert.equal(bestaetigt.ziele[0].name, 'Paris')
    assert.equal(bestaetigt.ziele[2].name, 'Paris')
  })
})

describe('Homepage-Route-Entry Auswahl', () => {
  test('ein Ziel bleibt zielId, drei Ziele nutzen zielIds', () => {
    assert.equal(routeEinstiegHref([{ id: PARIS.id, name: 'Paris' }]), `/planen?zielId=${encodeURIComponent(PARIS.id)}`)
    assert.equal(
      routeEinstiegHref([
        { id: PARIS.id, name: 'Paris' },
        { id: ROM.id, name: 'Rom' },
        { id: PARIS.id, name: 'Paris' },
      ]),
      `/planen?${ROUTE_EINSTIEG_KEY}=${encodeURIComponent(PARIS.id)}&${ROUTE_EINSTIEG_KEY}=${encodeURIComponent(ROM.id)}&${ROUTE_EINSTIEG_KEY}=${encodeURIComponent(PARIS.id)}`,
    )
  })

  test('add/remove/replace/reorder behalten Vorkommen-Identität, nicht nur Place-IDs', () => {
    let liste = routeVorkommenHinzufuegen([], { id: PARIS.id, name: 'Paris' }, 'a')
    liste = routeVorkommenHinzufuegen(liste, { id: ROM.id, name: 'Rom' }, 'b')
    liste = routeVorkommenHinzufuegen(liste, { id: PARIS.id, name: 'Paris' }, 'c')
    assert.deepEqual(
      liste.map((eintrag) => eintrag.key),
      ['a', 'b', 'c'],
    )
    assert.equal(liste[0].ort?.id, liste[2].ort?.id)
    assert.notEqual(liste[0].key, liste[2].key)

    liste = routeVorkommenVerschieben(liste, 'c', 'hoch')
    assert.deepEqual(
      liste.map((eintrag) => eintrag.key),
      ['a', 'c', 'b'],
    )
    liste = routeVorkommenVerschieben(liste, 'a', 'runter')
    assert.deepEqual(
      liste.map((eintrag) => [eintrag.key, eintrag.ort?.id]),
      [
        ['c', PARIS.id],
        ['a', PARIS.id],
        ['b', ROM.id],
      ],
    )

    liste = routeVorkommenErsetzen(liste, 'c', { id: CUSCO.id, name: 'Cusco' })
    assert.equal(liste[0].key, 'c')
    assert.equal(liste[0].ort?.id, CUSCO.id)

    liste = routeVorkommenEntfernen(liste, 'a')
    assert.deepEqual(
      liste.map((eintrag) => eintrag.key),
      ['c', 'b'],
    )
  })

  test('unbestätigter Text blockiert das Absenden, Whitespace erzeugt kein Geisterziel', () => {
    const paris = [neuesRouteVorkommen('1', { id: PARIS.id, name: 'Paris' })]
    assert.equal(routePendingText('   '), false)
    assert.equal(routeAbsendenPruefen(paris, '   ').ok, true)
    const pending = routeAbsendenPruefen(paris, 'Rom')
    assert.equal(pending.ok, false)
    if (!pending.ok) assert.equal(pending.meldung, ROUTE_EINSTIEG_MELDUNG.pending)
    const ersetzen = routeAbsendenPruefen(paris, '', '1')
    assert.equal(ersetzen.ok, false)
    assert.equal(routeAbsendenPruefen([], '').ok, false)
    assert.equal(routeAbsendenPruefen([], '   ').ok, false)
  })

  test('Reihenfolgeänderung macht das erste Ziel zum Primary', () => {
    const handoff = tripPlannerRouteVorbelegen({
      destinationId: PARIS.id,
      destination: 'Paris',
      weitereZiele: [
        { id: ROM.id, name: 'Rom' },
        { id: PARIS.id, name: 'Paris' },
      ],
    })
    assert.equal(handoff.primaer?.id, PARIS.id)
    assert.equal(handoff.primaerKey, 'primary')
    assert.equal(handoff.weitere[0]?.ort?.id, ROM.id)
    const route = [
      neuesRouteVorkommen('p', handoff.primaer),
      ...handoff.weitere,
    ]
    const verschoben = routeVorkommenVerschieben(route, handoff.weitere[0].key, 'hoch')
    assert.equal(verschoben[0].ort?.id, ROM.id)
    assert.equal(verschoben[1].ort?.id, PARIS.id)
    assert.equal(verschoben[2].ort?.id, PARIS.id)
  })
})

function startzielStand(teil: Partial<StartzielStand> = {}): StartzielStand {
  return {
    vorkommen: [neuesRouteVorkommen('1', { id: PARIS.id, name: 'Paris' })],
    sucheText: '',
    sucheAuswahl: null,
    sucheOffen: true,
    ersetzenKey: null,
    meldung: '',
    naechsterKey: 2,
    ...teil,
  }
}

describe('Homepage-Route-Entry Startziel-Controller', () => {
  test('Ersetzen mit fremdem Pending-Text bleibt blockiert und behält Cusco', () => {
    const stand = startzielStand({ sucheText: 'Cusco' })
    const naechste = startzielErsetzenStarten(stand, '1')
    assert.equal(naechste.sucheText, 'Cusco')
    assert.equal(naechste.ersetzenKey, null)
    assert.equal(naechste.meldung, ROUTE_EINSTIEG_MELDUNG.pending)
    assert.equal(startzielHatUnbestaetigtenEntwurf(stand), true)
  })

  test('Letztes Chip entfernen löscht den Pending-Text nicht', () => {
    const stand = startzielStand({ sucheText: 'Cusco' })
    const naechste = startzielVorkommenEntfernen(stand, '1')
    assert.deepEqual(naechste.vorkommen, [])
    assert.equal(naechste.sucheText, 'Cusco')
    assert.equal(naechste.ersetzenKey, null)
  })

  test('Ersetzen-Zielwechsel und Löschen des ersetzten Vorkommens behalten den Entwurf', () => {
    const zwei = startzielStand({
      vorkommen: [
        neuesRouteVorkommen('1', { id: PARIS.id, name: 'Paris' }),
        neuesRouteVorkommen('2', { id: ROM.id, name: 'Rom' }),
      ],
    })
    const ersetzenParis = startzielErsetzenStarten(zwei, '1')
    assert.equal(ersetzenParis.ersetzenKey, '1')
    assert.equal(ersetzenParis.sucheText, 'Paris')

    const mitCusco = { ...ersetzenParis, sucheText: 'Cusco' }
    const wechsel = startzielErsetzenStarten(mitCusco, '2')
    assert.equal(wechsel.ersetzenKey, '1')
    assert.equal(wechsel.sucheText, 'Cusco')
    assert.equal(wechsel.meldung, ROUTE_EINSTIEG_MELDUNG.pending)

    const gleicheTaste = startzielErsetzenStarten(mitCusco, '1')
    assert.equal(gleicheTaste.sucheText, 'Cusco')
    assert.equal(gleicheTaste.ersetzenKey, '1')

    const entfernt = startzielVorkommenEntfernen(mitCusco, '1')
    assert.equal(entfernt.vorkommen.length, 1)
    assert.equal(entfernt.vorkommen[0]?.key, '2')
    assert.equal(entfernt.ersetzenKey, null)
    assert.equal(entfernt.sucheText, 'Cusco')
  })

  test('Bestätigte Auswahl hängt an und leert den Entwurf erst nach Bestätigung', () => {
    const stand = startzielStand({ sucheText: 'Cusco' })
    const naechste = startzielAuswahlUebernehmen(stand, { id: CUSCO.id, name: 'Cusco' })
    assert.equal(naechste.vorkommen.length, 2)
    assert.equal(naechste.vorkommen[1]?.ort?.id, CUSCO.id)
    assert.equal(naechste.sucheText, '')
    assert.equal(naechste.ersetzenKey, null)
  })
})

describe('Homepage-Route-Entry TripPlanner-Tausch', () => {
  test('Primary und Extra tauschen Identität inklusive Pending-Text', () => {
    const nachOben = tripPlannerPrimaerMitWeiteremTauschen(
      {
        primaerKey: 'primary',
        primaerOrt: { id: PARIS.id, name: 'Paris' },
        primaerText: 'Paris',
        weitere: [{ key: 'extra-1', ort: null, text: 'Cusco' }],
      },
      0,
    )
    assert.equal(nachOben.primaerKey, 'extra-1')
    assert.equal(nachOben.primaerOrt, null)
    assert.equal(nachOben.primaerText, 'Cusco')
    assert.equal(nachOben.weitere[0]?.key, 'primary')
    assert.equal(nachOben.weitere[0]?.ort?.id, PARIS.id)
    assert.equal(nachOben.weitere[0]?.text, 'Paris')

    const zurueck = tripPlannerPrimaerMitWeiteremTauschen(nachOben, 0)
    assert.equal(zurueck.primaerKey, 'primary')
    assert.equal(zurueck.primaerOrt?.id, PARIS.id)
    assert.equal(zurueck.primaerText, 'Paris')
    assert.equal(zurueck.weitere[0]?.key, 'extra-1')
    assert.equal(zurueck.weitere[0]?.text, 'Cusco')
    assert.equal(zurueck.weitere[0]?.ort, null)
  })

  test('Leeres Extra und Duplikat bleiben beim Tausch erhalten', () => {
    const leer = tripPlannerPrimaerMitWeiteremTauschen(
      {
        primaerKey: 'primary',
        primaerOrt: { id: PARIS.id, name: 'Paris' },
        primaerText: 'Paris',
        weitere: [{ key: 'extra-1', ort: null, text: '' }],
      },
      0,
    )
    assert.equal(leer.primaerOrt, null)
    assert.equal(leer.primaerText, '')
    assert.equal(leer.weitere[0]?.ort?.name, 'Paris')

    const duplikat = tripPlannerPrimaerMitWeiteremTauschen(
      {
        primaerKey: 'primary',
        primaerOrt: { id: PARIS.id, name: 'Paris' },
        primaerText: 'Paris',
        weitere: [{ key: 'extra-1', ort: { id: PARIS.id, name: 'Paris' }, text: 'Paris' }],
      },
      0,
    )
    assert.equal(duplikat.primaerOrt?.id, PARIS.id)
    assert.equal(duplikat.weitere[0]?.ort?.id, PARIS.id)
    assert.equal(duplikat.primaerKey, 'extra-1')
  })
})
