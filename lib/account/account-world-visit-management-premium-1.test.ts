import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  BESUCH_VERWALTUNG_ANFANG,
  besuchVerwaltungAusschnitt,
  besucheLokalFiltern,
} from './account-world-visit-management-premium-1.ts'
import { besuchVerwaltungDichteFixture } from './account-world-visit-management-premium-1-fixture.ts'
import { besuchAnzeigen } from './besuche.ts'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const besucheQuelle = quelle('../../components/account/AccountBesuche.tsx')
const formularQuelle = quelle('../../components/account/AccountBesuchFormular.tsx')
const hilfeQuelle = quelle('./account-world-visit-management-premium-1.ts')
const dichte = besuchVerwaltungDichteFixture(40)
const anzeigen = besuchAnzeigen(dichte)

describe('Vierzig Ereignisse bleiben getrennt', () => {
  test('die Dichtefixture hat vierzig eigene Ids und wiederholte Orte', () => {
    assert.equal(dichte.length, 40)
    assert.equal(new Set(dichte.map((besuch) => besuch.id)).size, 40)
    const lissabon = dichte.filter((besuch) => besuch.placeId === 'geonames:2267057')
    assert.equal(lissabon.length, 4)
    assert.equal(new Set(lissabon.map((besuch) => besuch.id)).size, 4)
    assert.equal(anzeigen.length, 40)
    const zeilen = anzeigen.filter((zeile) => zeile.titel === 'Lissabon')
    assert.equal(zeilen.length, 4)
    assert.ok(zeilen.every((zeile) => zeile.wiederholungText))
  })

  test('der erste Ausschnitt entfernt keine Ereignisse aus der Quelle', () => {
    const vorher = anzeigen.map((zeile) => zeile.id)
    const ausschnitt = besuchVerwaltungAusschnitt(anzeigen, '', BESUCH_VERWALTUNG_ANFANG)
    assert.equal(ausschnitt.zeilen.length, 12)
    assert.equal(ausschnitt.verborgen, 28)
    assert.equal(ausschnitt.sucheAktiv, false)
    assert.deepEqual(
      anzeigen.map((zeile) => zeile.id),
      vorher,
    )
    assert.deepEqual(
      ausschnitt.zeilen.map((zeile) => zeile.id),
      vorher.slice(0, 12),
    )
  })

  test('weitere Schritte und alle zeigen die gleiche Ordnung', () => {
    const erste = besuchVerwaltungAusschnitt(anzeigen, '', 12)
    const weitere = besuchVerwaltungAusschnitt(anzeigen, '', 24)
    const alle = besuchVerwaltungAusschnitt(anzeigen, '', anzeigen.length)
    assert.equal(weitere.zeilen.length, 24)
    assert.deepEqual(
      weitere.zeilen.slice(0, 12).map((zeile) => zeile.id),
      erste.zeilen.map((zeile) => zeile.id),
    )
    assert.equal(alle.verborgen, 0)
    assert.deepEqual(
      alle.zeilen.map((zeile) => zeile.id),
      anzeigen.map((zeile) => zeile.id),
    )
  })

  test('die lokale Suche trifft Anzeigetext, ohne umzusortieren oder anzufragen', () => {
    const treffer = besucheLokalFiltern(anzeigen, '  Lissabon ')
    assert.ok(treffer.length >= 2)
    assert.ok(treffer.every((zeile) => zeile.titel === 'Lissabon'))
    const stellen = treffer.map((zeile) => anzeigen.findIndex((eintrag) => eintrag.id === zeile.id))
    assert.deepEqual(
      stellen,
      [...stellen].sort((links, rechts) => links - rechts),
    )
    const leer = besuchVerwaltungAusschnitt(anzeigen, 'zzzz-kein-treffer', 12)
    assert.equal(leer.sucheAktiv, true)
    assert.equal(leer.zeilen.length, 0)
    assert.equal(anzeigen.length, 40)
    const blank = besuchVerwaltungAusschnitt(anzeigen, '   ', 12)
    assert.equal(blank.sucheAktiv, false)
    assert.deepEqual(
      blank.zeilen.map((zeile) => zeile.id),
      anzeigen.slice(0, 12).map((zeile) => zeile.id),
    )
    assert.equal(hilfeQuelle.includes('fetch('), false)
    assert.equal(hilfeQuelle.includes('besuche-aktionen'), false)
    assert.equal(hilfeQuelle.includes('besuche-daten'), false)
  })
})

describe('Die Verwaltung bleibt am Eingang und die Karte bleibt die Karte', () => {
  test('Besuch hinzufügen steht vor der Karte, das Formular vor der Liste', () => {
    const knopf = besucheQuelle.indexOf('data-besuch-hinzufuegen="ein"')
    const karte = besucheQuelle.indexOf(
      '<AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />',
    )
    const formular = besucheQuelle.indexOf('id="account-besuch-anlegen"')
    const liste = besucheQuelle.indexOf('<ol')
    assert.equal(knopf > -1 && karte > knopf, true)
    assert.equal(formular > karte && liste > formular, true)
    assert.match(besucheQuelle, /mt-14 border-t border-line-200 pt-10/)
    assert.equal(besucheQuelle.includes('fetch('), false)
    assert.match(besucheQuelle, /besuchVerwaltungAusschnitt\(besucht\.eintraege, suche, sichtGrenze\)/)
  })

  test('Ändern und Widerrufen bleiben an der Ereignis-Id, Widerruf braucht Bestätigung', () => {
    assert.match(besucheQuelle, /besuchBestaetigen/)
    assert.match(besucheQuelle, /besuchAendern\(\{\s*id: bearbeitet\.id,/s)
    assert.match(besucheQuelle, /besuchWiderrufen\(\{ id \}\)/)
    assert.match(besucheQuelle, /onClick=\{\(\) => onWiderruf\(eintrag\.id\)\}/)
    assert.match(besucheQuelle, /onClick=\{\(\) => onWiderrufen\(eintrag\.id\)\}/)
    assert.match(besucheQuelle, /BESUCHE_COPY\.widerrufenFrage/)
    assert.match(besucheQuelle, /BESUCHE_COPY\.widerrufenBestaetigen/)
    const frage = besucheQuelle.indexOf('BESUCHE_COPY.widerrufenFrage')
    const bestaetigen = besucheQuelle.indexOf('onClick={() => onWiderrufen(eintrag.id)}')
    assert.equal(frage > -1 && bestaetigen > frage, true)
  })

  test('Leer und Fehler bleiben zwei Aussagen, die Ziele bleiben gross', () => {
    assert.match(besucheQuelle, /BESUCHE_COPY\.leerTitel/)
    assert.match(besucheQuelle, /BESUCHE_COPY\.fehlerTitel/)
    assert.match(besucheQuelle, /role="alert"/)
    assert.match(besucheQuelle, /data-besuch-suche="leer"/)
    assert.match(besucheQuelle, /min-h-11/)
    assert.match(besucheQuelle, /text-base/)
    assert.match(formularQuelle, /text-base/)
    assert.match(formularQuelle, /min-h-11/)
    assert.match(formularQuelle, /disabled=\{laeuft \|\| wert\.ort !== null\}/)
    assert.match(formularQuelle, /placeId: wert\.ort\?\.id \?\? null/)
    assert.equal(formularQuelle.includes('latitude'), false)
    assert.equal(formularQuelle.includes('longitude'), false)
  })
})
