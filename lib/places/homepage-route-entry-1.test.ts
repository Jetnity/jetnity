import { createElement } from 'react'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'

import RouteZielHandoffFehler from '@/components/places/RouteZielHandoffFehler'
import RouteZielListe from '@/components/places/RouteZielListe'
import { StartzielFormSicht } from '@/components/places/StartzielForm'
import { ortSucheAnzeigetextAbstimmen } from '@/components/places/OrtSuche'
import { zielHref } from '@/lib/places/auswahl'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import {
  ROUTE_EINSTIEG_MELDUNG,
  neuesRouteVorkommen,
  routeEinstiegAusParams,
  routeEinstiegHref,
  routeZieleBestaetigen,
} from '@/lib/places/route-einstieg'
import {
  genericCreateHrefFuerGast,
  gastCreateJetztPruefen,
  istGenerischerCreateHref,
  planenVorbelegung,
} from '@/lib/trips/create-entry'
import { createZieleGraph } from '@/lib/trips/create-stages'
import type { Ort } from '@/lib/places/domain'
import { planenRobots, PLANEN_INDEX_PARAMS } from '@/lib/seo/index-grenze'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function ort(id: string, name: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.replace(/^geonames:/, ''),
    name,
    typ: 'city',
    country: null,
    countryCode: 'FR',
    region: null,
    lat: 1,
    lon: 1,
    iata: null,
    keywords: null,
  }
}

const PARIS = { id: 'geonames:2988507', name: 'Paris' }
const ROM = { id: 'geonames:3169070', name: 'Rom' }
const leer = () => undefined

describe('homepage-route-entry-1 – Inspirations- und Einzelziel-Handoff', () => {
  test('Inspirationskarten bleiben einzelne zielId-Links', () => {
    for (const ziel of INSPIRATION_ZIELE) {
      assert.equal(zielHref({ id: ziel.placeId, name: ziel.name }), `/planen?zielId=${encodeURIComponent(ziel.placeId)}`)
    }
    const start = quelle('../../app/(public)/page.tsx')
    assert.match(start, /zielHref/)
    assert.equal(start.includes('zielIds'), false)
    assert.equal(start.includes('vorschlagErzeugen'), false)
  })

  test('ein bestätigtes Ziel bleibt der bestehende zielId-Vertrag', () => {
    assert.equal(routeEinstiegHref([PARIS]), '/planen?zielId=geonames%3A2988507')
    assert.equal(istGenerischerCreateHref('/planen?zielId=geonames%3A2988507'), false)
  })
})

describe('homepage-route-entry-1 – gerenderte Auswahl', () => {
  test('drei Ziele inklusive Rückkehr nach Paris behalten Reihenfolge und Vorkommen', () => {
    const vorkommen = [
      neuesRouteVorkommen('a', PARIS),
      neuesRouteVorkommen('b', ROM),
      neuesRouteVorkommen('c', PARIS),
    ]
    const html = renderToStaticMarkup(
      createElement(RouteZielListe, {
        vorkommen,
        onEntfernen: leer,
        onErsetzen: leer,
        onVerschieben: leer,
      }),
    )
    assert.match(html, /Gewählte Reiseziele/)
    assert.match(html, /Ziel 1: <\/span>Paris/)
    assert.match(html, /Ziel 2: <\/span>Rom/)
    assert.match(html, /Ziel 3: <\/span>Paris/)
    assert.match(html, /Paris, Ziel 1, nach oben/)
    assert.match(html, /Paris, Ziel 3, entfernen/)
    assert.equal(html.includes('geonames:'), false)
    assert.equal(html.includes('IATA'), false)
    assert.equal((html.match(/nach oben/g) ?? []).length, 3)
  })

  test('StartzielForm bleibt zunächst eine einfache Suche und zeigt Chips erst nach Auswahl', () => {
    const leerHtml = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        vorkommen: [],
        sucheText: '',
        sucheAuswahl: null,
        sucheOffen: true,
        sucheKey: 0,
        ersetzenKey: null,
        meldung: '',
        onSuche: leer,
        onAbsenden: leer,
        onWeiteresZiel: leer,
        onEntfernen: leer,
        onErsetzen: leer,
        onVerschieben: leer,
        onVerwerfen: leer,
      }),
    )
    assert.match(leerHtml, /Wohin möchtest du reisen\?/)
    assert.equal(leerHtml.includes('Weiteres Ziel'), false)
    assert.equal(leerHtml.includes('Gewählte Reiseziele'), false)

    const mitRoute = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        vorkommen: [neuesRouteVorkommen('1', PARIS), neuesRouteVorkommen('2', ROM)],
        sucheText: '',
        sucheAuswahl: null,
        sucheOffen: false,
        sucheKey: 1,
        ersetzenKey: null,
        meldung: '',
        onSuche: leer,
        onAbsenden: leer,
        onWeiteresZiel: leer,
        onEntfernen: leer,
        onErsetzen: leer,
        onVerschieben: leer,
        onVerwerfen: leer,
      }),
    )
    assert.match(mitRoute, /Weiteres Ziel/)
    assert.match(mitRoute, /Paris/)
    assert.match(mitRoute, /Rom/)
    assert.equal(mitRoute.includes('Ziel 1'), true)
    assert.equal(mitRoute.includes('Ziel1'), false)
  })

  test('unbestätigter Text und Handoff-Fehler bleiben sichtbar und nicht gekürzt', () => {
    const pending = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        vorkommen: [neuesRouteVorkommen('1', PARIS)],
        sucheText: 'Cusco',
        sucheAuswahl: null,
        sucheOffen: true,
        sucheKey: 2,
        ersetzenKey: null,
        meldung: ROUTE_EINSTIEG_MELDUNG.pending,
        onSuche: leer,
        onAbsenden: leer,
        onWeiteresZiel: leer,
        onEntfernen: leer,
        onErsetzen: leer,
        onVerschieben: leer,
        onVerwerfen: leer,
      }),
    )
    assert.match(pending, /Unbestätigten Text verwerfen/)
    assert.match(pending, /Bitte wähle das Ziel aus der Liste/)

    const fehler = renderToStaticMarkup(
      createElement(RouteZielHandoffFehler, {
        meldung: ROUTE_EINSTIEG_MELDUNG.unvollstaendig,
      }),
    )
    assert.match(fehler, /Diese Route konnte nicht übernommen werden/)
    assert.match(fehler, /keine Teilroute/)
    assert.match(fehler, /Zur Startseite/)
    assert.equal(fehler.includes('Reise erstellen'), false)
    assert.equal(fehler.includes('href="/planen"'), false)
  })
})

describe('homepage-route-entry-1 – Planner-Handoff und Create-Graph', () => {
  test('bestätigte Route füllt Primary plus weitere Destinationen ohne Auto-Create', () => {
    const vor = planenVorbelegung({
      zielId: PARIS.id,
      zielName: 'Paris',
      weitereZiele: [ROM, PARIS],
    })
    assert.equal(vor.destinationId, PARIS.id)
    assert.deepEqual(
      vor.weitereZiele.map((ziel) => ziel.id),
      [ROM.id, PARIS.id],
    )
    const graph = createZieleGraph(
      [ort(PARIS.id, 'Paris'), ort(ROM.id, 'Rom'), ort(PARIS.id, 'Paris')],
      { startDate: '2026-10-01', endDate: '2026-10-10' },
    )
    assert.equal(graph.einzelziel, false)
    assert.deepEqual(
      graph.stages.map((stage) => stage.placeId),
      [PARIS.id, ROM.id, PARIS.id],
    )

    const suche = quelle('../../components/places/OrtSuche.tsx')
    assert.match(suche, /ortSucheAnzeigetextAbstimmen/)
    assert.match(suche, /letzterSamen/)
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    assert.match(planner, /initialWeitereZiele/)
    assert.match(planner, /tripPlannerRouteVorbelegen/)
    assert.match(planner, /tripPlannerPrimaerMitWeiteremTauschen/)
    assert.match(planner, /primaerKey/)
    assert.match(planner, /key=\{primaerKey\}/)
    assert.match(planner, /key=\{ziel.key\}/)
    assert.match(planner, /gastreiseAnlegen/)
    assert.match(planner, /reiseAnlegen/)
    assert.equal(planner.includes('useEffect(() => {\n    void reiseAnlegen'), false)
    assert.equal(planner.includes('onDrag'), false)
  })

  test('fehlende Bestätigung liefert keinen Prefill', () => {
    const konflikt = routeEinstiegAusParams({ zielIds: PARIS.id, zielId: ROM.id })
    assert.equal(konflikt.art, 'konflikt')
    const fehlend = routeZieleBestaetigen([PARIS.id, 'geonames:1'], [ort(PARIS.id, 'Paris')])
    assert.equal(fehlend.art, 'unbestaetigt')
    const ausfall = routeZieleBestaetigen([PARIS.id], null)
    assert.equal(ausfall.art, 'ausfall')
  })
})

describe('homepage-route-entry-1 – Guest-Schutz, noindex, kein NLP-Fake', () => {
  test('zielIds bleibt zielgerichteter Handoff und noindex per Key', () => {
    assert.ok(PLANEN_INDEX_PARAMS.includes('zielIds'))
    assert.ok(planenRobots({ zielIds: '' }))
    assert.equal(istGenerischerCreateHref('/planen?zielIds='), false)
    const href = routeEinstiegHref([PARIS, ROM])
    assert.ok(href)
    const gast = genericCreateHrefFuerGast(href!, { id: 'trip-aktiv' }, 'gast')
    assert.equal(gast.href, href)
    assert.equal(gast.labelErsetzen, false)
  })

  test('Account-Create inspectet den Gastspeicher nicht; Guest-Gate bleibt action-time', () => {
    const konto = gastCreateJetztPruefen(true)
    assert.equal(konto.erlaubt, true)
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const absenden = planner.slice(planner.indexOf('const absenden'))
    assert.match(absenden, /gastCreateJetztPruefen/)
    assert.equal(quelle('../../app/(public)/planen/page.tsx').includes('localStorage'), false)
    assert.equal(quelle('../../components/places/StartzielForm.tsx').includes('localStorage'), false)
  })

  test('kein Parser, kein Modell, kein Issue-110-Close', () => {
    const start = quelle('../../components/places/StartzielForm.tsx')
    const route = quelle('route-einstieg.ts')
    const page = quelle('../../app/(public)/planen/page.tsx')
    for (const datei of [start, route, page]) {
      assert.equal(datei.includes(".split(',')"), false)
      assert.equal(datei.includes('.split(",")'), false)
      assert.equal(datei.includes("split('und')"), false)
      assert.equal(datei.includes('vorschlagErzeugen'), false)
    }
    assert.equal(start.includes('reisevorschlag'), false)
    assert.equal(route.includes('reisevorschlag'), false)
    assert.match(page, /ortBestaetigen/)
    assert.match(page, /routeZieleBestaetigen/)
    assert.match(page, /RouteZielHandoffFehler/)
    assert.match(page, /VORSCHLAG_GRENZEN/)
    assert.equal(page.includes('closes #110'), false)
  })
})

describe('homepage-route-entry-1 – OrtSuche-Samen', () => {
  test('bestätigte Auswahl gewinnt, fehlender Samen nach Invalidierung leert nicht', () => {
    const bestaetigt = ortSucheAnzeigetextAbstimmen({
      valueName: 'Paris',
      initialText: undefined,
      letzterSamen: undefined,
    })
    assert.equal(bestaetigt.uebernehmen, 'Paris')
    const nachEdit = ortSucheAnzeigetextAbstimmen({
      valueName: undefined,
      initialText: undefined,
      letzterSamen: undefined,
    })
    assert.equal(nachEdit.uebernehmen, null)
  })

  test('Parent-Samenwechsel und bewusstes Leeren bleiben möglich', () => {
    const ersetzen = ortSucheAnzeigetextAbstimmen({
      valueName: undefined,
      initialText: 'Cusco',
      letzterSamen: 'Paris',
    })
    assert.equal(ersetzen.uebernehmen, 'Cusco')
    const leer = ortSucheAnzeigetextAbstimmen({
      valueName: undefined,
      initialText: '',
      letzterSamen: 'Paris',
    })
    assert.equal(leer.uebernehmen, '')
    const unveraendert = ortSucheAnzeigetextAbstimmen({
      valueName: undefined,
      initialText: 'Paris',
      letzterSamen: 'Paris',
    })
    assert.equal(unveraendert.uebernehmen, null)
  })
})
