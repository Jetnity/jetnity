import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  WORKSPACE_ANSICHT_LABEL,
  modusAusAnfangsBereich,
  modusAusQuery,
  modusUrl,
  queryFuerModus,
} from '@/lib/trips/workspace-mode'

function lesen(search: string) {
  const params = new URLSearchParams(search)
  const modus = modusAusQuery(params)
  return { modus, search: queryFuerModus(params, modus).toString() }
}

test('Übersicht hat keine ansicht-Query', () => {
  const erg = lesen('')
  assert.equal(erg.modus.ansicht, 'uebersicht')
  assert.equal(erg.modus.bereich, null)
  assert.equal(erg.modus.urlAnpassen, false)
  assert.equal(erg.search, '')
  assert.equal(WORKSPACE_ANSICHT_LABEL.uebersicht, 'Übersicht')
})

test('Plan, Organisieren und Vorbereitung sind kanonisch', () => {
  assert.deepEqual(lesen('ansicht=plan').modus, {
    ansicht: 'plan',
    bereich: null,
    urlAnpassen: false,
  })
  assert.deepEqual(lesen('ansicht=vorbereitung').modus, {
    ansicht: 'vorbereitung',
    bereich: null,
    urlAnpassen: false,
  })
  assert.deepEqual(lesen('ansicht=organisieren').modus, {
    ansicht: 'organisieren',
    bereich: null,
    urlAnpassen: false,
  })
  for (const bereich of ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet']) {
    const erg = lesen(`ansicht=organisieren&bereich=${bereich}`)
    assert.equal(erg.modus.ansicht, 'organisieren')
    assert.equal(erg.modus.bereich, bereich)
    assert.equal(erg.modus.urlAnpassen, false)
  }
})

test('bereich ausserhalb von Organisieren wird entfernt, der Modus bleibt', () => {
  const plan = lesen('ansicht=plan&bereich=fluege')
  assert.equal(plan.modus.ansicht, 'plan')
  assert.equal(plan.modus.bereich, null)
  assert.equal(plan.modus.urlAnpassen, true)
  assert.equal(plan.search, 'ansicht=plan')

  const vorbereitung = lesen('foo=1&ansicht=vorbereitung&bereich=unterkunft')
  assert.equal(vorbereitung.modus.ansicht, 'vorbereitung')
  assert.equal(vorbereitung.search, 'foo=1&ansicht=vorbereitung')
})

test('ungültige Werte fallen auf Übersicht und bewahren fremde Parameter', () => {
  for (const search of [
    'ansicht=unbekannt',
    'ansicht=',
    'ansicht=uebersicht',
    'ansicht=Plan',
    'bereich=fluege',
    'ansicht=organisieren&bereich=plan',
    'ansicht=organisieren&bereich=',
    'ansicht=foo&ansicht=plan',
    'ansicht=organisieren&bereich=fluege&bereich=unterkunft',
  ]) {
    const erg = lesen(search)
    assert.equal(erg.modus.ansicht, 'uebersicht', search)
    assert.equal(erg.modus.bereich, null, search)
    assert.equal(erg.modus.urlAnpassen, true, search)
    assert.equal(erg.search.includes('ansicht'), false, search)
    assert.equal(erg.search.includes('bereich'), false, search)
  }

  const fremd = lesen('spur=bleibt&ansicht=unbekannt&bereich=fluege')
  assert.equal(fremd.modus.ansicht, 'uebersicht')
  assert.equal(fremd.search, 'spur=bleibt')
})

test('die Adresse übernimmt Hash und fremde Parameter und startet keine Suche', () => {
  const url = modusUrl('/reisen/trip-1?spur=bleibt#tag', {
    ansicht: 'organisieren',
    bereich: 'fluege',
  })
  assert.equal(url, '/reisen/trip-1?spur=bleibt&ansicht=organisieren&bereich=fluege#tag')
  assert.equal(url.includes('suche'), false)
  assert.equal(modusUrl('/reisen/trip-1?ansicht=plan', { ansicht: 'uebersicht', bereich: null }), '/reisen/trip-1')
})

test('ein Audit-Startbereich öffnet nur eine bekannte Domain', () => {
  assert.deepEqual(modusAusAnfangsBereich('fluege'), {
    ansicht: 'organisieren',
    bereich: 'fluege',
    urlAnpassen: false,
  })
  assert.equal(modusAusAnfangsBereich('uebersicht').ansicht, 'uebersicht')
  assert.equal(modusAusAnfangsBereich('plan').ansicht, 'uebersicht')
  assert.equal(modusAusAnfangsBereich(undefined).bereich, null)
})

test('der Workspace schreibt Modus in die History und mountet Suche nur ausdrücklich', () => {
  const quelle = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
  assert.match(quelle, /modusUrl/)
  assert.match(quelle, /pushState/)
  assert.match(quelle, /popstate/)
  assert.equal(quelle.includes('router.push'), false)
  assert.equal(quelle.includes('router.replace'), false)
  assert.match(quelle, /name="flugsuche"[\s\S]*!sucheSichtbar/)
  assert.match(quelle, /TripWorkspaceNavigation sichtbar=\{kompakt && detailOffen\}/)
  assert.match(quelle, /data-workspace-split/)
  const split = quelle.indexOf('data-workspace-split')
  const aktiv = quelle.indexOf('data-workspace-active-domain')
  const suche = quelle.indexOf('name="flugsuche"')
  assert.ok(split > -1 && aktiv > split && suche > aktiv)
})
