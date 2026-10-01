import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const uebersicht = quelle('../../components/account/AccountUebersicht.tsx')
const karte = quelle('../../components/account/AccountWeltKarte.tsx')
const besuche = quelle('../../components/account/AccountBesuche.tsx')

test('die Kontoübersicht benutzt die Vorschau, die Weltseite den vollen Atlas', () => {
  assert.match(uebersicht, /darstellung="uebersicht"/)
  assert.match(karte, /darstellung = 'atlas'/)
  assert.match(karte, /data-world-map-darstellung=\{darstellung\}/)
  assert.match(besuche, /<AccountWeltKarte welt=\{welt\} besucht=\{besucht\} laender=\{laender\} \/>/)
  assert.equal(besuche.includes('darstellung="uebersicht"'), false)
  assert.equal(uebersicht.includes('darstellung="atlas"'), false)
})

test('die Übersicht lässt Länderchips und die volle Ortsliste weg, der Atlas nicht', () => {
  const chips = karte.indexOf('<WeltLaenderListe flaechen={laender.flaechen} />')
  const chipsDavor = karte.slice(Math.max(0, chips - 40), chips)
  assert.match(chipsDavor, /istAtlas \?/)

  const liste = karte.indexOf('data-world-map-orte="liste"')
  const listeDavor = karte.slice(Math.max(0, liste - 180), liste)
  assert.match(listeDavor, /istAtlas && welt\.lage !== 'leer' && welt\.lage !== 'fehler'/)

  assert.equal(uebersicht.includes('WeltLaenderListe'), false)
  assert.equal(uebersicht.includes('data-world-map-orte'), false)
})

test('der Atlasausbruch gilt nur für die volle Darstellung', () => {
  const breite = karte.indexOf('lg:w-[min(90rem,calc(100vw-4rem))]')
  const davor = karte.slice(Math.max(0, breite - 80), breite)
  assert.match(davor, /istAtlas/)
  assert.match(karte, /lg:left-1\/2/)
  assert.match(karte, /lg:-translate-x-1\/2/)
  assert.equal(uebersicht.includes('100vw'), false)
  assert.equal(uebersicht.includes('w-screen'), false)
})

test('Kennzahlen, Marker, Auswahl und Herkunft bleiben in beiden Darstellungen', () => {
  assert.match(karte, /data-welt-kennzahl=\{zustand\}/)
  assert.match(karte, /data-world-map-marker=\{gruppe\.schluessel\}/)
  assert.match(karte, /data-world-map-kontext=\{gewaehlterOrt \? 'ort' : 'ruhe'\}/)
  assert.match(karte, /data-world-map-herkunft="ein"/)
  assert.match(karte, /WORLD_MAP_GRUNDKARTE_HINWEIS/)
  assert.match(karte, /\{besucht\.text\}/)
  assert.match(karte, /min-h-11 min-w-11/)
  assert.match(karte, /<WeltPunktMarken/)
  assert.match(karte, /motion-reduce:transition-none/)
  const legende = karte.indexOf('<AtlasLegende kompakt={!istAtlas} />')
  assert.equal(legende > -1, true)
})

test('nächste Reise und Buchungseinstieg bleiben, ohne erfundene Zahlen', () => {
  assert.match(uebersicht, /aria-label="Nächste Reise"/)
  assert.match(uebersicht, /Reise fortsetzen/)
  assert.match(uebersicht, /href=\{`\/reisen\/\$\{naechste\.reise\.id\}` as Route\}/)
  assert.match(uebersicht, /href="\/account\/bookings"/)
  assert.match(uebersicht, /BUCHUNGEN_COPY\.einstieg/)
  assert.match(uebersicht, /BUCHUNGEN_COPY\.einstiegHinweis/)
  assert.match(uebersicht, /Deine Welt öffnen/)
  assert.match(uebersicht, /href: '\/account\/welt'/)
  for (const verboten of [
    'priceAmount',
    'price_amount',
    'bookingUrl',
    'booking_url',
    '0 Buchungen',
    'Buchungen:',
    'AccountBuchungen',
  ]) {
    assert.equal(uebersicht.includes(verboten), false, verboten)
  }
})

test('lange Herkunfts- und Buchungswörter brechen, statt das Dokument zu weiten', () => {
  const herkunft = karte.indexOf('data-world-map-herkunft="ein"')
  const herkunftZeile = karte.slice(herkunft, karte.indexOf('>', herkunft))
  assert.match(herkunftZeile, /min-w-0/)
  assert.match(herkunftZeile, /break-words/)
  const besuchtAbsatz = karte.slice(karte.lastIndexOf('{besucht.text}') - 200, karte.lastIndexOf('{besucht.text}'))
  assert.match(besuchtAbsatz, /break-words/)
  const hinweis = uebersicht.indexOf('BUCHUNGEN_COPY.einstiegHinweis')
  assert.match(uebersicht.slice(Math.max(0, hinweis - 180), hinweis), /break-words/)
})

test('leer und Fehler bleiben getrennte Aussagen', () => {
  assert.match(uebersicht, /role="alert"/)
  assert.match(uebersicht, /data-account-naechste="fehler"/)
  assert.match(uebersicht, /data-account-naechste="leer"/)
  assert.match(uebersicht, /data-account-naechste=\{naechste\.lage\}/)
  assert.match(
    uebersicht,
    /Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu\./,
  )
  assert.match(uebersicht, /Noch keine Reise in deinem Konto\./)
  assert.match(uebersicht, /Keine offene Reise zum Fortsetzen\./)
  assert.match(karte, /role="alert"/)
  assert.match(karte, /besucht\.fehlerText/)
  assert.match(karte, /welt\.fehlerText/)
  const problem = uebersicht.indexOf('problem ?')
  const naechste = uebersicht.indexOf(': naechste ?')
  const leer = uebersicht.indexOf('data-account-naechste="leer"')
  assert.equal(problem > -1 && naechste > problem && leer > naechste, true)
})

test('die Übersicht startet keine Provider-, Such- oder Karten-Netzwerkanfrage', () => {
  for (const text of [uebersicht, karte]) {
    for (const verboten of [
      'mapbox',
      'openstreetmap',
      'leaflet',
      'https://',
      'http://',
      'fetch(',
      'FlugSuche',
      'HotelBereich',
      'AktivitaetenBereich',
      'data-destination-search="ein"',
    ]) {
      assert.equal(text.toLowerCase().includes(verboten.toLowerCase()), false, verboten)
    }
  }
  assert.match(karte, /data-world-map-search="nein"/)
})
