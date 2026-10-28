import assert from 'node:assert/strict'
import test from 'node:test'

import { landDarstellung } from '@/lib/country/darstellung'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import {
  referenzReise,
  transferPunkt,
  wiederholteEtappenReise,
  wiederholterNameReise,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import {
  backToTopEntscheidung,
  geplanteTageText,
  kanteAufloesen,
  kanteDauerText,
  kantePlanText,
  routeModell,
  type RouteKanteZeile,
  type RouteLaufZeile,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/route'

function laeufe(reise = referenzReise()) {
  return routeModell(reise).zeilen.filter((zeile): zeile is RouteLaufZeile => zeile.art === 'lauf')
}

function kanten(reise = referenzReise()) {
  return routeModell(reise).zeilen.filter((zeile): zeile is RouteKanteZeile => zeile.art === 'kante')
}

test('die Referenzroute zeigt fünf Läufe und zwei interne Nachbarn', () => {
  const modell = routeModell(referenzReise())
  assert.equal(modell.gueltig, true)
  const namen = laeufe().map((zeile) => zeile.name)
  assert.deepEqual(namen, [
    'Noch keinem Ziel zugeordnet',
    'Bangkok',
    'Ko Chang',
    'Phuket',
    'Noch keinem Ziel zugeordnet',
  ])
  assert.deepEqual(kanten().map((zeile) => zeile.titel), ['Bangkok → Ko Chang', 'Ko Chang → Phuket'])
  assert.equal(kanten().every((zeile) => zeile.waehlbar && !zeile.mehrdeutig), true)
  assert.equal(JSON.stringify(modell).includes('Hinreise'), false)
  assert.equal(JSON.stringify(modell).includes('Rückreise'), false)
  assert.equal(JSON.stringify(modell).includes('outbound:'), false)
  const bangkok = laeufe()[1]
  assert.equal(bangkok?.land, landDarstellung('TH').name)
  assert.equal(bangkok?.land?.includes('🇹🇭'), false)
  assert.match(bangkok?.geplanteTage ?? '', /^Geplante Tage: /)
  assert.equal(bangkok?.geplanteTage?.includes('nicht durchgehend'), false)
  assert.equal(bangkok?.gespeicherterZeitraum, null)
  assert.match(laeufe()[0]?.untertitel ?? '', /ohne festgelegten Aufenthalt/)
  assert.match(laeufe()[0]?.geplanteTage ?? '', /^Kalenderdaten: /)
})

test('eine Lücke im Kalender wird nicht zu einer durchgehenden Spanne', () => {
  const reise = referenzReise()
  const tag = reise.days.find((eintrag) => eintrag.id === 'day-4')
  assert.ok(tag)
  tag.dayDate = '2026-11-20'
  const text = laeufe(reise)[1]?.geplanteTage ?? ''
  assert.match(text, /nicht durchgehend/)
  assert.equal(text.includes('16. Nov. – 22. Nov.') || text.includes('16.–22.'), false)
  const luecke = geplanteTageText([
    { dayDate: '2026-11-16' },
    { dayDate: '2026-11-17' },
    { dayDate: '2026-11-19' },
  ], 'aufenthalt')
  assert.match(luecke ?? '', /nicht durchgehend/)
  assert.equal((luecke ?? '').includes('16. Nov. 2026 – 19. Nov. 2026'), false)
})

test('fehlende, ungültige und doppelte Daten bleiben sichtbar', () => {
  const text = geplanteTageText([
    { dayDate: '2026-11-16' },
    { dayDate: '2026-11-16' },
    { dayDate: null },
    { dayDate: '2026-02-31' },
    { dayDate: 'kein-datum' },
  ], 'aufenthalt')
  assert.match(text ?? '', /Geplante Tage: /)
  assert.match(text ?? '', /3 Tage ohne gültiges Datum/)
  assert.match(text ?? '', /mehrfach/)
  assert.equal(geplanteTageText([{ dayDate: null }], 'aufenthalt'), 'Geplante Tage: Datum nicht festgelegt')
})

test('gespeicherte Etappendaten bleiben von den geplanten Tagen getrennt', () => {
  const reise = referenzReise()
  const stage = reise.stages[0]
  assert.ok(stage)
  stage.arrivalDate = '2026-11-16'
  stage.departureDate = '2026-11-22'
  const bangkok = laeufe(reise)[1]
  assert.equal(bangkok?.gespeicherterZeitraum, `Gespeicherter Etappenzeitraum: ${etappenZeitraumAnzeigen('2026-11-16', '2026-11-22')}`)
  assert.match(bangkok?.geplanteTage ?? '', /^Geplante Tage: /)
  assert.equal(bangkok?.geplanteTage?.includes('Übernacht'), false)
})

test('dieselbe Verbindungskennung an zwei Grenzen ist nicht wählbar', () => {
  const modell = routeModell(wiederholteEtappenReise())
  const verbindungen = modell.zeilen.filter((zeile): zeile is RouteKanteZeile => zeile.art === 'kante')
  assert.equal(verbindungen.length, 2)
  assert.equal(verbindungen.every((zeile) => zeile.kanteId === 'connection:stage-a:stage-b' && !zeile.waehlbar && zeile.mehrdeutig), true)
  assert.equal(kanteAufloesen(modell.zeilen, 'connection:stage-a:stage-b').art, 'mehrdeutig')
  const besuche = modell.zeilen.filter((zeile): zeile is RouteLaufZeile => zeile.art === 'lauf' && zeile.name === 'A')
  assert.equal(besuche.length, 2)
  assert.notEqual(besuche[0]?.schluessel, besuche[1]?.schluessel)
  assert.notEqual(besuche[0]?.tagIds[0], besuche[1]?.tagIds[0])
})

test('gleicher Ortsname mit eigener Etappenkennung bleibt einzeln wählbar', () => {
  const modell = routeModell(wiederholterNameReise())
  const bangkok = modell.zeilen.filter((zeile): zeile is RouteLaufZeile => zeile.art === 'lauf' && zeile.name === 'Bangkok')
  assert.equal(bangkok.length, 2)
  assert.notEqual(bangkok[0]?.stageId, bangkok[1]?.stageId)
  const verbindungen = modell.zeilen.filter((zeile): zeile is RouteKanteZeile => zeile.art === 'kante')
  assert.deepEqual(verbindungen.map((zeile) => zeile.kanteId), [
    'connection:stage-bkk-1:stage-cnx',
    'connection:stage-cnx:stage-bkk-2',
  ])
  assert.equal(verbindungen.every((zeile) => zeile.waehlbar), true)
  const erste = kanteAufloesen(modell.zeilen, verbindungen[0]?.kanteId)
  assert.equal(erste.art, 'eindeutig')
  if (erste.art !== 'eindeutig') return
  assert.equal(erste.zeile.tagIds.includes(bangkok[1]?.tagIds[0] ?? ''), false)
})

test('ein unzugeordneter Tag zwischen zwei Zielen verhindert die Abkürzung', () => {
  const reise = referenzReise()
  const mitte = reise.days.find((eintrag) => eintrag.id === 'day-8')
  assert.ok(mitte)
  mitte.stageId = null
  const titel = kanten(reise).map((zeile) => zeile.titel)
  assert.equal(titel.includes('Bangkok → Ko Chang'), false)
  assert.equal(titel.includes('Ko Chang → Phuket'), true)
})

test('unbekannte und leere Länder bleiben unbekannt', () => {
  const reise = referenzReise()
  const bangkok = reise.stages[0]
  const phuket = reise.stages[2]
  assert.ok(bangkok && phuket)
  bangkok.countryCode = null
  phuket.countryCode = 'ZZ'
  const ziele = laeufe(reise).filter((zeile) => zeile.lesart === 'ziel')
  assert.equal(ziele[0]?.land, 'Land noch nicht zugeordnet')
  assert.equal(ziele[2]?.land, landDarstellung('ZZ').label)
  assert.equal(ziele[2]?.land?.includes('🇹🇭'), false)
})

test('eine unbekannte oder entfernte Kante ersetzt keinen Aufenthalt', () => {
  const zeilen = routeModell(referenzReise()).zeilen
  assert.equal(kanteAufloesen(zeilen, null).art, 'keine')
  assert.equal(kanteAufloesen(zeilen, 'outbound:stage-bkk').art, 'nicht-verfuegbar')
  assert.equal(kanteAufloesen(zeilen, 'return:stage-hkt').art, 'nicht-verfuegbar')
  assert.equal(kanteAufloesen(zeilen, 'connection:weg:weg').art, 'nicht-verfuegbar')
})

test('Nutzerbuchung und Ortszeit werden nicht zur Anbieter- oder Reisedauer', () => {
  const reise = referenzReise()
  const koChang = reise.stages[1]
  const tag = reise.days.find((eintrag) => eintrag.id === 'day-9')
  assert.ok(koChang && tag)
  koChang.arrivalDate = '2026-11-23'
  tag.items = [transferPunkt({ id: 'ferry-1', dayId: tag.id, stageId: 'stage-kc' })]
  const kante = kanten(reise).find((zeile) => zeile.kanteId === 'connection:stage-bkk:stage-kc')
  assert.ok(kante)
  assert.match(kante.datumText, /kein nachgewiesenes Reisedatum/i)
  assert.match(kante.dauerText, /Ortszeitdifferenz/)
  assert.match(kante.dauerText, /Keine geprüfte Reisezeit/)
  assert.match(kante.planText, /als gebucht markiert/)
  assert.match(kante.planText, /Keine Anbieterbestätigung/)
  assert.equal(kanteDauerText({ durationMinutes: null }), 'Dauer nicht gespeichert.')
  assert.match(kantePlanText({ mobilityItem: null }), /Noch keine gespeicherte Verbindung/)
})

test('Back-to-top nutzt nur eine positive feste Navigationshöhe', () => {
  assert.equal(backToTopEntscheidung(false, null), 'standard')
  assert.equal(backToTopEntscheidung(false, 53), 'standard')
  assert.equal(backToTopEntscheidung(true, null), 'verborgen')
  assert.equal(backToTopEntscheidung(true, 0), 'verborgen')
  assert.equal(backToTopEntscheidung(true, 53), 'frei')
})
