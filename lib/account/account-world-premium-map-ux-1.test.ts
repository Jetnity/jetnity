import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const karte = quelle('../../components/account/AccountWeltKarte.tsx')
const zustaende = quelle('../../components/account/WeltZustaende.tsx')
const besuche = quelle('../../components/account/AccountBesuche.tsx')

test('Ozean und neutrales Land sind zwei Flächen, nicht eine verwaschene Mintfläche', () => {
  assert.match(karte, /data-world-map-ozean="ein"/)
  assert.match(karte, /data-world-map-land="ein"/)
  assert.match(karte, /className="fill-brand-900"/)
  assert.match(karte, /fill-surface-75/)
  assert.equal(karte.includes('fill-brand-700/20'), false)
  assert.equal(karte.includes('fill-surface-100'), false)
})

test('das Gradnetz bleibt vorhanden und ist zurückgenommen', () => {
  assert.match(karte, /ansicht\.gitter\.map/)
  assert.match(karte, /stroke-surface-0\/20/)
  assert.equal(karte.includes('stroke-brand-800/[0.07]'), false)
})

test('Besucht, geplant und beides bleiben additiv und nicht deckend', () => {
  assert.match(zustaende, /besucht: 'fill-brand-800\/45'/)
  assert.match(zustaende, /beides: 'fill-brand-800\/45'/)
  assert.match(zustaende, /geplant: 'fill-brand-600\/10'/)
  assert.match(zustaende, /besucht: false/)
  assert.match(zustaende, /geplant: true/)
  assert.match(zustaende, /beides: true/)
  assert.match(zustaende, /besucht: 'ring'/)
  assert.match(zustaende, /geplant: 'ring-gestrichelt'/)
  assert.match(zustaende, /beides: 'doppelring'/)
  assert.equal(/fill-brand-\d00(?![/\d])/.test(zustaende), false)
})

test('die Auswahl sitzt in der Atlaskante und nicht nur in der Ortsliste', () => {
  assert.match(karte, /data-world-map-kontext=\{gewaehlterOrt \? 'ort' : 'ruhe'\}/)
  assert.match(karte, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(16rem,20rem\)\]/)
  assert.match(karte, /ring-2 ring-citrus-400/)
  assert.match(karte, /anker=\{false\}/)
  assert.match(karte, /min-h-11 min-w-11/)
})

test('weite Desktops nutzen die Breite, schmale nicht per Ausbruch', () => {
  assert.match(karte, /lg:left-1\/2/)
  assert.match(karte, /lg:w-\[min\(90rem,calc\(100cqw-4rem\)\)\]/)
  assert.match(karte, /lg:-translate-x-1\/2/)
  assert.match(karte, /html:has\(\[data-world-map-darstellung="atlas"\]\) \{ container-type: inline-size; \}/)
  assert.equal(karte.includes('100vw'), false)
  assert.equal(karte.includes('w-screen'), false)
  assert.equal(karte.includes('overflow-x-hidden'), false)
  assert.equal(karte.includes('overflow-x:hidden'), false)
})

test('Herkunft, Grenzvorbehalt und Besuchsatz bleiben sichtbar', () => {
  assert.match(karte, /data-world-map-herkunft="ein"/)
  assert.match(karte, /WORLD_MAP_GRUNDKARTE_HINWEIS/)
  assert.match(karte, /\{besucht\.text\}/)
  assert.match(karte, /<WeltLaenderListe flaechen=\{laender\.flaechen\} \/>/)
})

test('Projektion, Trefferflächen und lokale Karte bleiben unverändert im Vertrag', () => {
  assert.match(karte, /const LAND_PFAD = WORLD_MAP_LAND_PFADE\.join\(' '\)/)
  assert.match(karte, /viewBox=\{ansicht\.viewBox\}/)
  assert.equal(karte.includes('WORLD_MAP_LAND_PFADE.map('), false)
  assert.match(karte, /data-world-map-search="nein"/)
  assert.match(karte, /motion-reduce:transition-none/)
  assert.match(karte, /<WeltPunktMarken/)
  const punkte = karte.indexOf('<WeltPunktMarken')
  const orte = karte.indexOf('ansicht.gruppen.map')
  assert.equal(punkte > -1 && orte > punkte, true)
  for (const verboten of ['mapbox', 'openstreetmap', 'leaflet', 'https://', 'http://']) {
    assert.equal(karte.toLowerCase().includes(verboten), false, verboten)
  }
})

test('die Besuchsliste bleibt unter dem Atlas und ihre Aktionen bleiben', () => {
  assert.match(besuche, /mt-14 border-t border-line-200 pt-10/)
  assert.match(besuche, /besuchBestaetigen/)
  assert.match(besuche, /besuchAendern/)
  assert.match(besuche, /besuchWiderrufen/)
  assert.match(besuche, /<AccountWeltKarte welt=\{welt\} besucht=\{besucht\} laender=\{laender\} \/>/)
})
