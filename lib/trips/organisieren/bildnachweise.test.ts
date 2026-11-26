import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { describe, test } from 'node:test'

import {
  BILDNACHWEISE,
  KI_ILLUSTRATIONEN,
  KI_URHEBER,
  NEUTRALES_REISEBILD,
  ZURUECKGEHALTENE_ILLUSTRATIONEN,
  bildMitNachweis,
  bildnachweisFuerDatei,
  datumDeutsch,
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

describe('Herkunftsnachweise der KI-Illustrationen in Bildnachweise.txt', () => {
  const KI_TEXT = TEXT.slice(TEXT.indexOf('# KI-Illustrationen'))

  test('der Abschnitt nennt Medium, Eigentumsangabe, OpenAI-Bedingungen, Ersteintrag-Vorbehalt und fehlende Angaben', () => {
    assert.ok(TEXT.includes('# KI-Illustrationen (keine Fotos)'))
    assert.ok(KI_TEXT.includes(`Herkunft: ${KI_URHEBER}`))
    assert.ok(KI_TEXT.includes('https://openai.com/policies/dec-2024-eu-terms/'))
    assert.ok(KI_TEXT.includes('https://openai.com/policies/eu-terms-of-use/'))
    assert.ok(KI_TEXT.includes('Ownership of content'))
    assert.ok(KI_TEXT.includes('kein verifiziertes Erstellungsdatum'))
    assert.ok(KI_TEXT.includes('keine Creative-Commons-Lizenz'))
    assert.ok(KI_TEXT.includes('Prompts, Generierungs-Kennungen und Original-Adressen sind nicht erfasst'))
    assert.ok(KI_TEXT.includes('keine Garantie für exklusive Rechte'))
    assert.ok(KI_TEXT.includes('ersetzt weder die PO-Erklärung noch einen Rechtsnachweis'))
  })

  test('jede der fünf Dateien hat einen Datensatz mit Titel, Urheber, Ersteintrag, Commit und Prüfsumme wie im Katalog', () => {
    assert.equal(KI_ILLUSTRATIONEN.length, 5)
    const zeilen = TEXT.split('\n')
    for (const eintrag of KI_ILLUSTRATIONEN) {
      const index = zeilen.findIndex((zeile) => zeile.startsWith(`${basename(eintrag.datei)} –`))
      assert.ok(index >= 0, `${eintrag.datei} fehlt in Bildnachweise.txt`)
      const kopf = zeilen[index]!
      assert.ok(kopf.includes(eintrag.bildtitel), `${eintrag.datei}: Titel weicht ab`)
      assert.ok(kopf.endsWith(KI_URHEBER), `${eintrag.datei}: Urheber weicht ab`)
      assert.equal(
        zeilen[index + 1],
        `Ersteintrag: ${datumDeutsch(eintrag.herkunft.ersteintrag.datum)}, Commit ${eintrag.herkunft.ersteintrag.commit}`,
        `${eintrag.datei}: Ersteintrag weicht ab`,
      )
      assert.equal(zeilen[index + 2], `SHA-256: ${eintrag.herkunft.sha256}`, `${eintrag.datei}: Prüfsumme weicht ab`)
    }
  })

  test('der Einsatz stimmt: vier Dateien freigegeben, Zermatt belegt, aber nirgends gezeigt', () => {
    for (const eintrag of KI_ILLUSTRATIONEN) {
      const zeile = TEXT.split('\n').find((text, index, alle) => alle[index - 3]?.startsWith(`${basename(eintrag.datei)} –`))
      assert.ok(zeile?.startsWith('Einsatz: '), eintrag.datei)
      const einsatz = zeile ?? ''
      const zurueckgehalten = eintrag.datei in ZURUECKGEHALTENE_ILLUSTRATIONEN
      assert.equal(einsatz.includes('derzeit nirgends'), zurueckgehalten, eintrag.datei)
      assert.equal(einsatz.includes('(freigegeben)'), !zurueckgehalten, eintrag.datei)
    }
    assert.ok(KI_TEXT.includes('geonames:2657915'))
    assert.ok(KI_TEXT.includes('geonames:2657928'))
    assert.ok(KI_TEXT.includes('Die Kennungen werden nicht gleichgesetzt'))
  })

  test('Nachweise für KI-Illustrationen erfinden weder Quelle noch Lizenz', () => {
    for (const eintrag of KI_ILLUSTRATIONEN) {
      assert.equal(eintrag.quelleUrl, null, eintrag.datei)
      assert.match(eintrag.lizenz, /^Keine CC-Lizenz/, eintrag.datei)
    }
    assert.doesNotMatch(KI_TEXT, /Original: https?:/)
    assert.doesNotMatch(KI_TEXT, /CC BY|Public domain|Creative Commons Namensnennung/)
  })
})
