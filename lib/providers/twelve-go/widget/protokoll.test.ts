import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { MobilityWidgetScopeProvider, mobilityWidgetScopeKey, useMobilityWidgetScope } from '@/components/trips/MobilityWidgetScope'
import { TWELVE_GO_WIDGET_ALLGEMEIN_SHA256 } from '@/lib/providers/twelve-go/widget/kennungen'
import {
  TWELVE_GO_POLICY_ID,
  twelveGoGrantBauen,
  twelveGoReadyLesen,
  twelveGoRevokeLesen,
} from '@/lib/providers/twelve-go/widget/protokoll'

const CHALLENGE = 'a'.repeat(64)

function basis() {
  return {
    tripId: 'trip-1',
    source: 'guest' as const,
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    detail: 'mobilitaet:',
    dayId: 'day-1',
    stages: [
      { id: 'a', position: 1, name: 'Chiang Mai', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-01', departureDate: '2026-11-03' },
      { id: 'b', position: 2, name: 'Bangkok', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-03', departureDate: null },
    ],
    days: [{ id: 'day-1', dayIndex: 1, dayDate: '2026-11-01', stageId: 'a' }],
  }
}

function Probe() {
  const scope = useMobilityWidgetScope()
  return createElement('p', {
    'data-active': scope.workspaceActive ? 'ja' : 'nein',
    'data-area': scope.activeArea ?? 'keine',
  })
}

describe('12Go Sichtbarkeit und Rev1', () => {
  test('der Scope bleibt bei gleichem Kontext gleich und wechselt bei Reise, Etappe oder Datum', () => {
    const links = mobilityWidgetScopeKey(basis())
    const nochmal = mobilityWidgetScopeKey(basis())
    assert.equal(links, nochmal)
    assert.equal(mobilityWidgetScopeKey({ ...basis(), tripId: ' ' }), null)
    assert.notEqual(links, mobilityWidgetScopeKey({ ...basis(), tripId: 'trip-2' }))
    assert.notEqual(links, mobilityWidgetScopeKey({ ...basis(), source: 'account' }))
    assert.notEqual(links, mobilityWidgetScopeKey({ ...basis(), dayId: 'day-2' }))
    const etappen = basis()
    assert.notEqual(links, mobilityWidgetScopeKey({
      ...etappen,
      stages: [
        { id: 'b', position: 1, name: 'Bangkok', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-03', departureDate: null },
        { id: 'a', position: 2, name: 'Chiang Mai', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-01', departureDate: '2026-11-03' },
      ],
    }))
    assert.notEqual(links, mobilityWidgetScopeKey({
      ...basis(),
      stages: [
        { id: 'a', position: 1, name: 'Chiang Mai', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-02', departureDate: '2026-11-03' },
        { id: 'b', position: 2, name: 'Bangkok', countryCode: 'TH', placeId: 'bkk', arrivalDate: '2026-11-03', departureDate: null },
      ],
    }))
    const gleicherOrt = basis()
    gleicherOrt.stages[1] = { ...gleicherOrt.stages[1], name: 'Tokio', countryCode: 'JP', placeId: 'tyo' }
    assert.notEqual(links, mobilityWidgetScopeKey(gleicherOrt))
    assert.notEqual(links, mobilityWidgetScopeKey({ ...basis(), origin: 'Basel' }))
    assert.notEqual(links, mobilityWidgetScopeKey({ ...basis(), originPlaceId: 'geonames:2661604' }))
    assert.equal(links?.includes('traveller'), false)
    assert.equal(links?.includes('Tokio'), false)
  })

  test('der Schlüssel steht nicht im Markup und fehlt ohne Provider', () => {
    const key = mobilityWidgetScopeKey(basis())
    assert.ok(key)
    // React 19 types require children on the props object for this component.
    // eslint-disable-next-line react/no-children-prop
    const html = renderToStaticMarkup(createElement(
      MobilityWidgetScopeProvider,
      { workspaceActive: true, scopeKey: key, children: createElement(Probe) },
    ))
    assert.equal(html.includes(key), false)
    assert.equal(html.includes('data-active="ja"'), true)
    assert.equal(html.includes('data-area="keine"'), true)
    const zu = renderToStaticMarkup(createElement(Probe))
    assert.equal(zu.includes('data-active="nein"'), true)
  })

  test('Gast und Konto lesen die Seam nur über den bestehenden Mobilitätsknoten', () => {
    const workspace = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
    const bereich = readFileSync('components/trips/MobilitaetBereich.tsx', 'utf8')
    const gast = readFileSync('components/trips/GastArbeitsbereich.tsx', 'utf8')
    const konto = readFileSync('components/trips/KontoArbeitsbereich.tsx', 'utf8')
    assert.match(workspace, /workspaceActive=\{detailOffen && aktiveDomain === 'mobilitaet'\}/)
    assert.match(workspace, /<MobilityWidgetScopeProvider/)
    assert.match(bereich, /useMobilityWidgetArea\(mobilityScope\.workspaceActive \? unterbereich : null\)/)
    assert.equal(gast.includes('MobilityWidgetScope'), false)
    assert.equal(konto.includes('MobilityWidgetScope'), false)
    assert.match(gast, /mobilitaetssuche=\{[\s\S]*<MobilitaetBereich/)
    assert.match(konto, /mobilitaetssuche=\{[\s\S]*<MobilitaetBereich/)
  })

  test('Ready, Grant und Revoke nehmen nur die vereinbarten Felder', () => {
    const ready = {
      type: 'jetnity-widget-host',
      revision: 1,
      kind: 'ready',
      provider: 'twelvego',
      challenge: CHALLENGE,
      frameGeneration: 1,
    }
    assert.deepEqual(twelveGoReadyLesen(ready), { challenge: CHALLENGE, frameGeneration: 1 })
    assert.equal(twelveGoReadyLesen({ ...ready, scopeKey: 'trip-1' }), null)
    assert.equal(twelveGoReadyLesen({ ...ready, challenge: `//${'a'.repeat(62)}` }), null)
    assert.equal(twelveGoReadyLesen({ ...ready, challenge: CHALLENGE.toUpperCase() }), null)
    assert.equal(twelveGoReadyLesen({ ...ready, frameGeneration: 1_000_001 }), null)
    assert.equal(twelveGoReadyLesen({ ...ready, provider: 'discovercars' }), null)
    const grant = twelveGoGrantBauen({
      challenge: CHALLENGE,
      frameGeneration: 1,
      parentGeneration: 2,
      policyId: TWELVE_GO_POLICY_ID,
      artifactSha256: TWELVE_GO_WIDGET_ALLGEMEIN_SHA256,
    })
    assert.ok(grant)
    assert.deepEqual(Object.keys(grant).sort(), [
      'artifactSha256',
      'challenge',
      'frameGeneration',
      'kind',
      'parentGeneration',
      'policyId',
      'provider',
      'revision',
      'type',
    ])
    assert.equal(JSON.stringify(grant).includes('trip'), false)
    assert.equal(twelveGoGrantBauen({
      challenge: CHALLENGE,
      frameGeneration: 1,
      parentGeneration: 0,
      policyId: TWELVE_GO_POLICY_ID,
      artifactSha256: TWELVE_GO_WIDGET_ALLGEMEIN_SHA256,
    }), null)
    assert.deepEqual(twelveGoRevokeLesen({
      type: 'jetnity-widget-host',
      revision: 1,
      kind: 'revoke',
      provider: 'twelvego',
      frameGeneration: 4,
    }), { frameGeneration: 4 })
    assert.equal(twelveGoRevokeLesen({ ...ready, kind: 'canary', n: 1 }), null)
  })
})
