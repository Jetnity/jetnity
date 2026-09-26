import { createElement } from 'react'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'

import { StartzielFormSicht } from '@/components/places/StartzielForm'
import { neuesRouteVorkommen, routeEinstiegHref } from '@/lib/places/route-einstieg'
import { ROUTE_INTENT_MELDUNG } from '@/lib/places/route-intent'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const PARIS = { id: 'geonames:2988507', name: 'Paris' }
const ROM = { id: 'geonames:3169070', name: 'Rom' }
const leer = () => undefined

const basis = {
  sucheAuswahl: null as null,
  sucheKey: 0,
  ersetzenKey: null as null,
  meldung: '',
  onSuche: leer,
  onAbsenden: leer,
  onWeiteresZiel: leer,
  onEntfernen: leer,
  onErsetzen: leer,
  onVerschieben: leer,
  onVerwerfen: leer,
}

describe('homepage-natural-route-intent-1 – gerenderte Schlange', () => {
  test('erkannte Route zeigt Status, nicht die Place-IDs, und kein Auto-Submit', () => {
    const html = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        ...basis,
        vorkommen: [],
        sucheText: 'Lima',
        sucheOffen: true,
        intentStatus: '3 Ziele erkannt – bitte Ziel 1 von 3 bestätigen',
        intentPlatzhalter: 'Ziel 1 von 3 aus der Liste wählen',
        onSchlangeAbbrechen: leer,
      }),
    )
    assert.match(html, /3 Ziele erkannt – bitte Ziel 1 von 3 bestätigen/)
    assert.match(html, /role="status"/)
    assert.match(html, /aria-live="polite"/)
    assert.match(html, /Erkannte Route verwerfen/)
    assert.match(html, /Reise planen/)
    assert.match(html, /Ziel 1 von 3 aus der Liste wählen/)
    assert.equal(html.includes('geonames:'), false)
    assert.equal(html.includes('vorschlagErzeugen'), false)
  })

  test('bestätigte Chips bleiben nach Queue-Status sichtbar', () => {
    const html = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        ...basis,
        vorkommen: [neuesRouteVorkommen('1', PARIS)],
        sucheText: 'Rom',
        sucheOffen: true,
        sucheKey: 2,
        intentStatus: '2 Ziele erkannt – bitte Ziel 2 von 2 bestätigen',
        onSchlangeAbbrechen: leer,
      }),
    )
    assert.match(html, /Paris/)
    assert.match(html, /Ziel 1/)
    assert.match(html, /Erkannte Route verwerfen/)
    assert.match(html, /Unbestätigten Text verwerfen/)
  })

  test('bestehende einfache Suche bleibt ohne Queue-Status', () => {
    const html = renderToStaticMarkup(
      createElement(StartzielFormSicht, {
        ...basis,
        vorkommen: [],
        sucheText: '',
        sucheOffen: true,
      }),
    )
    assert.match(html, /Wohin möchtest du reisen\?/)
    assert.equal(html.includes('Ziele erkannt'), false)
    assert.equal(html.includes('Erkannte Route verwerfen'), false)
  })
})

describe('homepage-natural-route-intent-1 – Handoff und Grenzen', () => {
  test('finaler Handoff trägt nur kanonische IDs in Reihenfolge inklusive Duplikat', () => {
    const href = routeEinstiegHref([PARIS, ROM, PARIS])
    assert.equal(
      href,
      '/planen?zielIds=geonames%3A2988507&zielIds=geonames%3A3169070&zielIds=geonames%3A2988507',
    )
    assert.match(href ?? '', /zielIds=/)
    assert.equal(href?.includes('Lima'), false)
    assert.equal(href?.includes('und'), false)
  })

  test('Guest-One-Trip und Create bleiben unangetastet', () => {
    const start = quelle('../../components/places/StartzielForm.tsx')
    const intent = quelle('route-intent.ts')
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const gast = quelle('../trips/gastspeicher.ts')
    assert.equal(start.includes('gastreiseAnlegen'), false)
    assert.equal(start.includes('localStorage'), false)
    assert.equal(intent.includes('gastreiseAnlegen'), false)
    assert.match(planner, /gastCreateJetztPruefen/)
    assert.match(gast, /Genau eine aktive Gastreise/)
  })
})

describe('homepage-natural-route-intent-1 – kein freier Text als Ort', () => {
  test('Parser lebt nur in route-intent und erzeugt keine IDs', () => {
    const intent = quelle('route-intent.ts')
    const start = quelle('../../components/places/StartzielForm.tsx')
    const einstieg = quelle('route-einstieg.ts')
    assert.match(intent, /ganzerOrtGlaubwuerdig/)
    assert.match(intent, /routeIntentPhrasenLesen/)
    assert.match(intent, /Keine Place-IDs|keine Place-IDs|keine Place-IDs, kein Modell/)
    assert.equal(intent.includes('fetch('), false)
    assert.equal(intent.includes('openai'), false)
    assert.equal(intent.includes('geonames.com'), false)
    assert.equal(start.includes(".split('und')"), false)
    assert.equal(start.includes('.split(",")'), false)
    assert.equal(einstieg.includes(".split('und')"), false)
    assert.match(start, /ganzerOrtSucheLesen/)
    assert.match(start, /startzielIntentAuswahlUebernehmen/)
    assert.match(start, /startzielIntentAbsendenPruefen/)
    assert.equal(start.includes('vorschlagErzeugen'), false)
  })

  test('OrtSuche bleibt die einzige Bestätigung und auto-select ist nicht eingebaut', () => {
    const suche = quelle('../../components/places/OrtSuche.tsx')
    const start = quelle('../../components/places/StartzielForm.tsx')
    assert.match(suche, /onChange\(\{ id: option.id, name: option.label \}/)
    assert.equal(suche.includes('optionen[0]'), false)
    assert.equal(start.includes('optionen[0]'), false)
    assert.equal(start.includes('autoSelect'), false)
    assert.equal(start.includes('router.push'), true)
    assert.match(start, /startzielIntentAbsendenPruefen/)
    assert.equal(ROUTE_INTENT_MELDUNG.pendingSchlange.includes('Liste'), true)
  })
})
