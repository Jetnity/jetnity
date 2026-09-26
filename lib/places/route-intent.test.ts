import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { OrtOption } from '@/lib/places/domain'
import {
  ROUTE_INTENT_MELDUNG,
  ganzerOrtGlaubwuerdig,
  ganzerOrtSucheLesen,
  leererStartzielIntentStand,
  routeIntentEntscheiden,
  routeIntentPhrasenLesen,
  routeIntentStatusText,
  routeIntentTextNormalisieren,
  startzielIntentAbsendenPruefen,
  startzielIntentAuswahlUebernehmen,
  startzielIntentSchlangeAbbrechen,
  startzielIntentSchlangeOeffnen,
  startzielIntentStatus,
  startzielIntentTextVerwerfen,
} from '@/lib/places/route-intent'
import { neuesRouteVorkommen } from '@/lib/places/route-einstieg'
import { GRENZEN } from '@/lib/trips/schema'

function option(teil: Partial<OrtOption> & Pick<OrtOption, 'id' | 'label'>): OrtOption {
  return {
    typ: teil.typ ?? 'city',
    description: teil.description,
    landAliasMatch: teil.landAliasMatch,
    ...teil,
  }
}

const PERU = option({
  id: 'geonames:3932480',
  label: 'Peru',
  typ: 'country',
  description: 'Land',
  landAliasMatch: true,
})
const BOSNIEN = option({
  id: 'geonames:3277605',
  label: 'Bosnien und Herzegowina',
  typ: 'country',
  description: 'Land',
  landAliasMatch: true,
})
const TRINIDAD = option({
  id: 'geonames:3573591',
  label: 'Trinidad und Tobago',
  typ: 'country',
  description: 'Land',
  landAliasMatch: true,
})
const LIMA = option({
  id: 'geonames:3936456',
  label: 'Lima',
  description: 'Stadt · Lima, Peru',
})
const CUSCO = option({ id: 'geonames:3941584', label: 'Cusco', description: 'Stadt · Cusco, Peru' })
const PARIS = option({ id: 'geonames:2988507', label: 'Paris', description: 'Stadt · Frankreich' })
const ROM = option({ id: 'geonames:3169070', label: 'Rom', description: 'Stadt · Italien' })

describe('route-intent – Normalisierung und Syntax', () => {
  test('Whitespace wird zusammengezogen, ohne den Inhalt zu erfinden', () => {
    assert.equal(routeIntentTextNormalisieren('  Lima   und\tCusco  '), 'Lima und Cusco')
    assert.equal(routeIntentTextNormalisieren('\n\n'), '')
  })

  test('Lima und Cusco sowie Thailand, Kambodscha und Vietnam bleiben geordnet', () => {
    assert.deepEqual(routeIntentPhrasenLesen('Lima und Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Thailand, Kambodscha und Vietnam'), [
      'Thailand',
      'Kambodscha',
      'Vietnam',
    ])
    assert.deepEqual(routeIntentPhrasenLesen('Paris, Rom, Paris'), ['Paris', 'Rom', 'Paris'])
  })

  test('unterstützte Konjunktionen und sichere Satzzeichen segmentieren nur als Syntax', () => {
    assert.deepEqual(routeIntentPhrasenLesen('Lima and Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima et Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima e Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima y Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima i Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima sowie Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima & Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima -> Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima → Cusco'), ['Lima', 'Cusco'])
    assert.deepEqual(routeIntentPhrasenLesen('Lima;\nCusco'), ['Lima', 'Cusco'])
    assert.equal(routeIntentPhrasenLesen('Peru')?.length, 1)
    assert.deepEqual(routeIntentPhrasenLesen('Hundewiese'), ['Hundewiese'])
  })

  test('leere oder nur-Zeichensetzungsteile erzeugen keine Teilliste', () => {
    assert.equal(routeIntentPhrasenLesen('Lima und'), null)
    assert.equal(routeIntentPhrasenLesen('Lima, , Cusco'), null)
    assert.equal(routeIntentPhrasenLesen(', Lima'), null)
    assert.equal(routeIntentPhrasenLesen('   '), null)
    assert.equal(routeIntentPhrasenLesen('---'), null)
  })
})

describe('route-intent – Ganzort vor jeder Segmentierung', () => {
  test('Peru bleibt ein ausstehendes Ziel, keine Route', () => {
    const entscheidung = routeIntentEntscheiden('Peru', { art: 'ok', optionen: [PERU] })
    assert.deepEqual(entscheidung, { art: 'eine', phrase: 'Peru', grund: 'ganzer_ort' })
    assert.equal(ganzerOrtGlaubwuerdig('Peru', [PERU]), true)
  })

  test('Bosnien und Herzegowina wird nicht an und getrennt', () => {
    const entscheidung = routeIntentEntscheiden('Bosnien und Herzegowina', {
      art: 'ok',
      optionen: [BOSNIEN],
    })
    assert.equal(entscheidung.art, 'eine')
    if (entscheidung.art === 'eine') {
      assert.equal(entscheidung.phrase, 'Bosnien und Herzegowina')
      assert.equal(entscheidung.grund, 'ganzer_ort')
    }
    assert.equal(ganzerOrtGlaubwuerdig('Bosnien und Herzegowina', [BOSNIEN]), true)
  })

  test('Trinidad und Tobago wird nicht an und getrennt', () => {
    const entscheidung = routeIntentEntscheiden('Trinidad und Tobago', {
      art: 'ok',
      optionen: [TRINIDAD],
    })
    assert.equal(entscheidung.art, 'eine')
    if (entscheidung.art === 'eine') assert.equal(entscheidung.grund, 'ganzer_ort')
  })

  test('Lima, Peru bleibt ein Ortskontext und keine zweite Destination', () => {
    assert.equal(ganzerOrtGlaubwuerdig('Lima, Peru', [LIMA]), true)
    const entscheidung = routeIntentEntscheiden('Lima, Peru', { art: 'ok', optionen: [LIMA] })
    assert.deepEqual(entscheidung, { art: 'eine', phrase: 'Lima, Peru', grund: 'ganzer_ort' })
  })

  test('ohne Ganzort-Beweis darf Lima und Cusco zur geordneten Warteschlange werden', () => {
    const entscheidung = routeIntentEntscheiden('Lima und Cusco', { art: 'ok', optionen: [] })
    assert.deepEqual(entscheidung, { art: 'route', phrasen: ['Lima', 'Cusco'] })
  })

  test('Thailand, Kambodscha und Vietnam wird drei geordnete Phrasen', () => {
    const entscheidung = routeIntentEntscheiden('Thailand, Kambodscha und Vietnam', {
      art: 'ok',
      optionen: [LIMA],
    })
    assert.deepEqual(entscheidung, {
      art: 'route',
      phrasen: ['Thailand', 'Kambodscha', 'Vietnam'],
    })
  })

  test('Ganzort-Ausfall darf nicht in eine geratene Route kippen', () => {
    for (const suche of [
      ganzerOrtSucheLesen(503, []),
      ganzerOrtSucheLesen(500, [{ id: 'x', label: 'Lima', typ: 'city' }]),
      ganzerOrtSucheLesen(200, { treffer: [LIMA] }),
      ganzerOrtSucheLesen(200, [null]),
      { art: 'ausfall' as const },
    ]) {
      const entscheidung = routeIntentEntscheiden('Lima und Cusco', suche)
      assert.equal(entscheidung.art, 'eine')
      if (entscheidung.art === 'eine') {
        assert.equal(entscheidung.grund, 'ausfall')
        assert.equal(entscheidung.phrase, 'Lima und Cusco')
      }
    }
  })

  test('zu viele Ziele und unklare Segmente bleiben ehrlich ohne Teilliste', () => {
    const zuViele = Array.from({ length: GRENZEN.etappenJeReise + 1 }, (_, index) => `Ort${index + 1}`).join(', ')
    const entscheidung = routeIntentEntscheiden(zuViele, { art: 'ok', optionen: [] })
    assert.equal(entscheidung.art, 'zuViele')
    if (entscheidung.art === 'zuViele') {
      assert.equal(entscheidung.meldung, ROUTE_INTENT_MELDUNG.zuViele)
      assert.equal(entscheidung.anzahl, GRENZEN.etappenJeReise + 1)
    }

    const rest = routeIntentEntscheiden('Lima und Cusco', { art: 'ok', optionen: [] }, GRENZEN.etappenJeReise - 1)
    assert.equal(rest.art, 'zuViele')

    const leer = routeIntentEntscheiden('Lima und', { art: 'ok', optionen: [] })
    assert.deepEqual(leer, { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig })
  })

  test('die Entscheidung enthält niemals Place-IDs', () => {
    const entscheidung = routeIntentEntscheiden('Lima und Cusco', { art: 'ok', optionen: [LIMA, CUSCO] })
    assert.equal(JSON.stringify(entscheidung).includes('geonames:'), false)
    assert.equal(JSON.stringify(entscheidung).includes(LIMA.id), false)
  })
})

describe('route-intent – Bestätigungswarteschlange', () => {
  test('Auswahl rückt genau eine Position vor und erzeugt keine Auto-Absendung', () => {
    const start = startzielIntentSchlangeOeffnen(leererStartzielIntentStand(), ['Paris', 'Rom', 'Paris'])
    assert.equal(startzielIntentStatus(start), '3 Ziele erkannt – bitte Ziel 1 von 3 bestätigen')
    assert.equal(start.sucheText, 'Paris')
    assert.equal(startzielIntentAbsendenPruefen(start).ok, false)

    const nachParis = startzielIntentAuswahlUebernehmen(start, { id: PARIS.id, name: 'Paris' })
    assert.equal(nachParis.vorkommen.length, 1)
    assert.equal(nachParis.intentIndex, 1)
    assert.equal(nachParis.sucheText, 'Rom')
    assert.equal(startzielIntentStatus(nachParis), '3 Ziele erkannt – bitte Ziel 2 von 3 bestätigen')
    assert.equal(startzielIntentAbsendenPruefen(nachParis).ok, false)

    const nachRom = startzielIntentAuswahlUebernehmen(nachParis, { id: ROM.id, name: 'Rom' })
    assert.equal(nachRom.intentIndex, 2)
    assert.equal(nachRom.sucheText, 'Paris')

    const fertig = startzielIntentAuswahlUebernehmen(nachRom, { id: PARIS.id, name: 'Paris' })
    assert.deepEqual(
      fertig.vorkommen.map((eintrag) => eintrag.ort?.id),
      [PARIS.id, ROM.id, PARIS.id],
    )
    assert.deepEqual(fertig.intentPhrasen, [])
    assert.equal(fertig.sucheText, '')
    const pruefung = startzielIntentAbsendenPruefen(fertig)
    assert.equal(pruefung.ok, true)
    if (pruefung.ok) {
      assert.deepEqual(
        pruefung.ziele.map((ziel) => ziel.id),
        [PARIS.id, ROM.id, PARIS.id],
      )
    }
  })

  test('Abbrechen der Restschlange behält bestätigte Ziele', () => {
    const start = startzielIntentSchlangeOeffnen(leererStartzielIntentStand(), ['Lima', 'Cusco'])
    const nachLima = startzielIntentAuswahlUebernehmen(start, { id: LIMA.id, name: 'Lima' })
    const abbruch = startzielIntentSchlangeAbbrechen(nachLima)
    assert.equal(abbruch.vorkommen.length, 1)
    assert.equal(abbruch.vorkommen[0]?.ort?.id, LIMA.id)
    assert.deepEqual(abbruch.intentPhrasen, [])
    assert.equal(abbruch.sucheText, '')
    const pruefung = startzielIntentAbsendenPruefen(abbruch)
    assert.equal(pruefung.ok, true)
  })

  test('aktuellen Text verwerfen überspringt kein erkanntes Ziel', () => {
    const start = startzielIntentSchlangeOeffnen(leererStartzielIntentStand(), ['Lima', 'Cusco'])
    const bearbeitet = { ...start, sucheText: 'Lisboa' }
    const verworfen = startzielIntentTextVerwerfen(bearbeitet)
    assert.equal(verworfen.sucheText, '')
    assert.deepEqual(verworfen.intentPhrasen, ['Lima', 'Cusco'])
    assert.equal(verworfen.intentIndex, 0)
    assert.equal(startzielIntentAbsendenPruefen(verworfen).ok, false)
  })

  test('bereits bestätigte Chips plus neue Route bleiben additiv und begrenzt', () => {
    const mitParis = {
      ...leererStartzielIntentStand(),
      vorkommen: [neuesRouteVorkommen('1', { id: PARIS.id, name: 'Paris' })],
      naechsterKey: 2,
      sucheOffen: true,
    }
    const queue = startzielIntentSchlangeOeffnen(mitParis, ['Lima', 'Cusco'])
    const nachLima = startzielIntentAuswahlUebernehmen(queue, { id: LIMA.id, name: 'Lima' })
    const fertig = startzielIntentAuswahlUebernehmen(nachLima, { id: CUSCO.id, name: 'Cusco' })
    assert.deepEqual(
      fertig.vorkommen.map((eintrag) => eintrag.ort?.id),
      [PARIS.id, LIMA.id, CUSCO.id],
    )
  })

  test('Statuszählung ist 1-basiert und ändert sich nur mit der Schlange', () => {
    assert.equal(routeIntentStatusText(3, 1), '3 Ziele erkannt – bitte Ziel 1 von 3 bestätigen')
    assert.equal(startzielIntentStatus(leererStartzielIntentStand()), '')
  })
})
