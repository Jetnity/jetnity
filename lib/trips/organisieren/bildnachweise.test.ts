import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { describe, test } from 'node:test'

import {
  BILDNACHWEISE,
  NEUTRALES_REISEBILD,
  bildMitNachweis,
  bildnachweisFuerDatei,
} from '@/lib/trips/organisieren/bildnachweise'
import { reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'

const WURZEL = process.cwd()
const TEXT = readFileSync(join(WURZEL, 'public/images/organisieren/Bildnachweise.txt'), 'utf8')

function bildzeile(datei: string) {
  return TEXT.split('\n').find((zeile) => zeile.startsWith(`${basename(datei)} –`)) ?? null
}

describe('Bildnachweise', () => {
  test('jedes Bild, das ein Reiseziel zeigen kann, hat einen Nachweis', () => {
    const quelltext = readFileSync(join(WURZEL, 'lib/trips/organisieren/reisebilder.ts'), 'utf8')
    const lokal = [...quelltext.matchAll(/lokal\('([\w-]+)'\)/g)].map((treffer) => `/images/organisieren/${treffer[1]}.webp`)
    const direkt = [...quelltext.matchAll(/'(\/images\/organisieren\/[^']+\.(?:jpg|webp))'/g)].map((treffer) => treffer[1]!)
    const verwendet = new Set([...lokal, ...direkt])
    assert.ok(verwendet.size >= 9)
    for (const datei of verwendet) {
      assert.ok(bildnachweisFuerDatei(datei), `Nachweis fehlt für ${datei}`)
    }
  })

  test('unbekannte oder widersprüchliche Orte zeigen nur das neutrale, nachgewiesene Kartenmotiv', () => {
    for (const etappe of [
      undefined,
      { name: 'Irgendwo', countryCode: 'TH', placeId: null },
      { name: 'Bangkok', countryCode: 'FR', placeId: 'geonames:1609350' },
    ]) {
      const bild = bildMitNachweis(reisebildAusEtappe(etappe), null)
      assert.equal(bild.src, NEUTRALES_REISEBILD)
      assert.match(bild.nachweis.bildtitel, /Natural Earth/)
    }
  })

  test('ein Bild ohne Nachweis wird nie gezeigt', () => {
    const bild = bildMitNachweis('/images/organisieren/gibt-es-nicht.webp', null)
    assert.equal(bild.src, NEUTRALES_REISEBILD)
    assert.equal(bildMitNachweis('/images/amsterdam.jpg', null).src, NEUTRALES_REISEBILD)
  })

  test('ein geprüftes Laufzeitfoto behält seinen eigenen Nachweis', () => {
    const foto = {
      title: 'Beispielbild.jpg',
      author: 'Beispiel Urheberin',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Beispielbild.jpg',
    }
    const bild = bildMitNachweis('https://upload.wikimedia.org/wikipedia/commons/a/ab/Beispielbild.jpg', foto)
    assert.equal(bild.src, 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Beispielbild.jpg')
    assert.equal(bild.nachweis.urheber, 'Beispiel Urheberin')
    assert.equal(bild.nachweis.lizenz, 'CC BY 4.0')
    assert.equal(bild.nachweis.quelleUrl, foto.sourceUrl)
  })

  test('jede ausgelieferte Bilddatei ist nachgewiesen und jeder Nachweis hat eine Datei', () => {
    const ordner = join(WURZEL, 'public/images/organisieren')
    const dateien = readdirSync(ordner).filter((name) => /\.(jpg|webp)$/.test(name))
    for (const name of dateien) {
      assert.ok(bildnachweisFuerDatei(`/images/organisieren/${name}`), `Bild ohne Nachweis: ${name}`)
    }
    for (const eintrag of BILDNACHWEISE) {
      assert.ok(existsSync(join(WURZEL, 'public', eintrag.datei)), `Nachweis ohne Datei: ${eintrag.datei}`)
    }
  })

  test('der Katalog stimmt mit Bildnachweise.txt überein', () => {
    for (const eintrag of BILDNACHWEISE) {
      if (eintrag.datei.endsWith('reiseatlas.webp')) {
        assert.match(TEXT, /reiseatlas\.webp – Kartengrundlage Natural Earth, gemeinfrei/)
        continue
      }
      const zeile = bildzeile(eintrag.datei)
      assert.ok(zeile, `${eintrag.datei} fehlt in Bildnachweise.txt`)
      if (eintrag.urheber) assert.ok(zeile.includes(eintrag.urheber), `${eintrag.datei}: Urheber weicht ab`)
      const lizenz = eintrag.lizenz === 'Gemeinfrei' ? 'Public domain' : eintrag.lizenz
      assert.ok(zeile.endsWith(lizenz), `${eintrag.datei}: Lizenz weicht ab`)
    }
  })

  test('Lizenzen mit Namensnennung nennen Urheber und Lizenztext', () => {
    for (const eintrag of BILDNACHWEISE) {
      assert.match(eintrag.quelleUrl, /^https:\/\//)
      assert.ok(eintrag.bearbeitung.length > 0)
      if (/^CC BY/.test(eintrag.lizenz)) {
        assert.ok(eintrag.urheber, `${eintrag.datei}: Namensnennung braucht den Urheber`)
        assert.match(eintrag.lizenzUrl ?? '', /^https:\/\/creativecommons\.org\/licenses\//)
      }
    }
  })
})
