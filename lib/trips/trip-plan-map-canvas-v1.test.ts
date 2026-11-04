import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import { RouteListe } from '@/components/trips/TripWorkspaceRoute'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import { routeModell } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import { TRIP_MAP_PILOT_RELEASED } from '@/lib/maps/config'

test('Reiseplan bleibt ohne Google-Freigabe eine vollständig nutzbare Routen- und Tagesfläche', () => {
  assert.equal(TRIP_MAP_PILOT_RELEASED, false)
  const reise = referenzReise()
  for (const mapsActive of [true, false]) {
    const html = renderToStaticMarkup(createElement(TripWorkspacePlan, {
      reise,
      ohneTag: [],
      aktiverTag: reise.days[0]?.id ?? '',
      kompakt: false,
      mapsActive,
      steuerung: 'gemessen',
      anordnung: 'neben',
      onTagWechseln: () => assert.fail('SSR darf keinen Tag wechseln'),
      onPunktAnlegen: async () => null,
      onPunktEntfernen: async () => null,
    }))
    assert.match(html, /data-u1b-route/)
    assert.match(html, /data-u1b-day/)
    assert.match(html, /data-u1c-route/)
    assert.equal(html.includes('data-plan-map-canvas'), false)
    assert.equal(html.includes('data-trip-map'), false)
    assert.equal(html.includes('Google-Karte laden'), false)
    assert.equal(html.includes('maps.googleapis.com'), false)
  }
})

test('verbundene Reiseetappen behalten echte Schluessel, Auswahl und sichere Transportsperren', () => {
  const reise = referenzReise()
  const route = routeModell(reise)
  const bangkok = route.zeilen.find((row) => row.art === 'lauf' && row.name === 'Bangkok')
  assert.ok(bangkok?.art === 'lauf')
  const tagId = bangkok.tagIds[0] ?? ''
  const html = renderToStaticMarkup(createElement(RouteListe, {
    zeilen: route.zeilen,
    ausgewaehlterTagId: tagId,
    aufloesung: { art: 'keine' as const },
    onLauf: () => assert.fail('SSR darf keine Navigation ausloesen'),
    onKante: () => assert.fail('SSR darf keine Verbindung auswaehlen'),
  }))
  assert.match(html, /data-u1c-route/)
  assert.match(html, /data-u1c-lauf/)
  assert.match(html, /data-u1c-kante/)
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /Bangkok/)
  assert.match(html, /Ko Chang/)
  assert.equal(html.includes('Google-Karte laden'), false)
})

test('navigator recommendation labels describe guidance, not a direct action trigger', () => {
  const reise = referenzReise()
  const route = routeModell(reise)
  const bangkok = route.zeilen.find((row) => row.art === 'lauf' && row.name === 'Bangkok')
  assert.ok(bangkok?.art === 'lauf')
  const tagId = bangkok.tagIds[0] ?? ''
  const html = renderToStaticMarkup(createElement(RouteListe, {
    zeilen: route.zeilen,
    ausgewaehlterTagId: tagId,
    aufloesung: { art: 'keine' as const },
    insights: {
      [bangkok.schluessel]: {
        status: '1 Unterkunft',
        nextAction: 'Tagesdetails prüfen',
        transferHinweis: null,
      },
    },
    onLauf: () => assert.fail('SSR darf keine Navigation ausloesen'),
    onKante: () => assert.fail('SSR darf keine Verbindung auswaehlen'),
  }))
  assert.match(html, /Empfehlung:\s*Tagesdetails prüfen/)
  assert.match(html, /Öffnet diesen Aufenthalt mit den zugehörigen Details\./)
  assert.equal(html.includes('Nächster Schritt:'), false)
})
