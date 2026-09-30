import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  ARBEITSFELD_SPALTEN_KLASSE,
  abdeckungsKante,
  arbeitsflaecheAnteil,
  domainAnordnung,
  domainAnordnungFuerBreite,
  domainRasterKlasse,
} from '@/lib/trips/cross-device-interaction-1'

test('unter 1024 bleibt der Arbeitsbereich eine Spalte', () => {
  for (const breite of [360, 390, 768, 1023]) {
    assert.equal(domainAnordnungFuerBreite(breite, true), 'einspaltig')
    assert.equal(domainRasterKlasse('einspaltig', true), undefined)
  }
})

test('ab 1024 teilt sich die Fläche, Suche weitet die Arbeitsseite', () => {
  assert.equal(domainAnordnungFuerBreite(1024, true), 'geteilt-schmal')
  assert.equal(domainAnordnungFuerBreite(1279, true), 'geteilt-schmal')
  assert.equal(domainAnordnungFuerBreite(1280, true), 'geteilt-weit')
  assert.equal(domainAnordnungFuerBreite(1440, true), 'geteilt-weit')
  assert.equal(domainAnordnungFuerBreite(1920, true), 'geteilt-weit')

  const schmalRuhend = arbeitsflaecheAnteil(domainRasterKlasse('geteilt-schmal', false))
  const schmalSuche = arbeitsflaecheAnteil(domainRasterKlasse('geteilt-schmal', true))
  const weitRuhend = arbeitsflaecheAnteil(domainRasterKlasse('geteilt-weit', false))
  const weitSuche = arbeitsflaecheAnteil(domainRasterKlasse('geteilt-weit', true))

  assert.ok(schmalRuhend != null && schmalRuhend > 0.5)
  assert.ok(schmalSuche != null && schmalSuche > schmalRuhend)
  assert.ok(weitRuhend != null && weitRuhend > 0.5)
  assert.ok(weitSuche != null && weitSuche > weitRuhend)
  assert.equal(domainRasterKlasse('geteilt-weit', true)?.includes('grid-cols-2'), false)
})

test('geschlossenes Detail bleibt einspaltig, auch auf weiter Fläche', () => {
  assert.equal(domainAnordnung({ kompakt: false, detailOffen: false, weit: true }), 'einspaltig')
})

test('Formularfelder folgen der Spaltenbreite und nicht dem Viewport-sm', () => {
  assert.match(ARBEITSFELD_SPALTEN_KLASSE, /auto-fit/)
  assert.match(ARBEITSFELD_SPALTEN_KLASSE, /minmax\(min\(100%,16rem\),1fr\)/)
  assert.equal(ARBEITSFELD_SPALTEN_KLASSE.includes('sm:grid-cols-2'), false)
})

test('Gast und Konto hängen dieselbe Workspace-Hülle ein', () => {
  const gast = readFileSync('components/trips/GastArbeitsbereich.tsx', 'utf8')
  const konto = readFileSync('components/trips/KontoArbeitsbereich.tsx', 'utf8')
  for (const datei of [gast, konto]) {
    assert.match(datei, /<TripWorkspace/)
    assert.match(datei, /flugsuche=/)
    assert.match(datei, /hotelsuche=/)
    assert.match(datei, /aktivitaetensuche=/)
    assert.match(datei, /mobilitaetssuche=/)
  }
})

test('die obere Abdeckung folgt den gemessenen Leisten und nicht einer festen Kopfhöhe', () => {
  assert.equal(
    abdeckungsKante([
      { top: 0, bottom: 72, height: 72 },
      { top: 72, bottom: 134, height: 62 },
    ]),
    134,
  )
  assert.equal(abdeckungsKante([{ top: 0, bottom: 88, height: 88 }]), 88)
  assert.equal(
    abdeckungsKante([
      { top: 0, bottom: 72, height: 72 },
      { top: 420, bottom: 482, height: 62 },
    ]),
    72,
  )
  assert.equal(abdeckungsKante([]), 0)

  const quelle = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
  assert.match(quelle, /abdeckungsKante/)
  assert.match(quelle, /nav\[aria-label="Reise"\]/)
  assert.equal(quelle.includes('oben - 96'), false)
  assert.equal(quelle.includes('rand.bottom > 72'), false)
})

test('kompakt hat nur die sticky Rückkehr, die weite Fläche behält die Karten-Rückkehr', () => {
  const detail = readFileSync('components/trips/TripWorkspaceDetail.tsx', 'utf8')
  const workspace = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
  const navigation = readFileSync('components/trips/TripWorkspaceNavigation.tsx', 'utf8')
  assert.match(detail, /!kompakt \? \([\s\S]*Zurück zur Reise/)
  assert.match(workspace, /TripWorkspaceNavigation sichtbar=\{kompakt && detailOffen\}/)
  assert.match(workspace, /kompakt \? zurueckRef\.current : detailFokusRef\.current/)
  assert.match(navigation, /Zurück zur Reise/)
})

test('Suche sitzt im aktiven Bereich und startet nicht mit dem blossen Öffnen', () => {
  const quelle = readFileSync('components/trips/TripWorkspace.tsx', 'utf8')
  const split = quelle.indexOf('data-workspace-split')
  const aktiv = quelle.indexOf('data-workspace-active-domain')
  const suche = quelle.indexOf('name="flugsuche"')
  assert.ok(split > -1 && aktiv > split && suche > aktiv)
  assert.equal(quelle.includes('lg:grid-cols-2'), false)
  assert.match(quelle, /name="flugsuche"[\s\S]*!sucheSichtbar/)
  assert.match(quelle, /name="hotelsuche"[\s\S]*!sucheSichtbar/)
  assert.match(quelle, /name="aktivitaeten"[\s\S]*!sucheSichtbar/)
})
