import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  WIDGET_EXPORT_ATTRIBUTE,
  WIDGET_EXPORT_DATEI,
  WIDGET_HERKUNFT_IM_EXPORT,
  WIDGET_HERKUNFT_INVENTAR_VOLLSTAENDIG,
  WIDGET_HERKUNFT_SPAETER_BEOBACHTET,
  WIDGET_KONFIGURIERT_ATTRIBUTE,
  WIDGET_KONFIGURIERT_BYTES,
  WIDGET_KONFIGURIERT_DATEI,
  WIDGET_KONFIGURIERT_EINFUEGUNG,
  WIDGET_KONFIGURIERT_SHA256,
  WIDGET_KONFIGURIERT_VARIANTE,
  widgetExportAusfuehren,
  widgetExportLesen,
  widgetKonfiguriertPruefen,
} from '@/lib/providers/discovercars/widget/export'
import {
  WIDGET_EXPORT_BYTES,
  WIDGET_EXPORT_SHA256,
  WIDGET_LAUFZEIT,
  widgetDarfAusfuehren,
} from '@/lib/providers/discovercars/widget/vertrag'

const datei = join(dirname(fileURLToPath(import.meta.url)), WIDGET_EXPORT_DATEI)

function lesen(): string {
  return readFileSync(datei)
    .toString('utf8')
}

describe('DiscoverCars allgemeiner Export', () => {
  test('die Datei ist das geprüfte 835-Byte-Original', () => {
    const roh = readFileSync(datei)
    assert.equal(roh.length, WIDGET_EXPORT_BYTES)
    assert.equal(createHash('sha256').update(roh).digest('hex'), WIDGET_EXPORT_SHA256)
    assert.equal(roh.at(-1), '>'.charCodeAt(0))
    const hashDatei = readFileSync(`${datei}.sha256`, 'utf8').trim()
    assert.equal(hashDatei, WIDGET_EXPORT_SHA256)
  })

  test('26 Attribute, leerer Abholort, jetnity, Deutsch und CHF', () => {
    const lesart = widgetExportLesen(lesen())
    assert.equal(lesart.art, 'attribute')
    if (lesart.art !== 'attribute') return
    assert.equal(lesart.attribute.length, 26)
    assert.equal(WIDGET_EXPORT_ATTRIBUTE.length, 26)
    assert.deepEqual(lesart.attribute, [...WIDGET_EXPORT_ATTRIBUTE])
    const satz = Object.fromEntries(lesart.attribute.map((eintrag) => [eintrag.name, eintrag.wert]))
    assert.equal(satz.id, 'dchwidget')
    assert.equal(satz['data-location'], '')
    assert.equal(satz['data-lang'], 'de')
    assert.equal(satz['data-currency'], 'chf')
    assert.equal(satz['data-utm-source'], 'jetnity')
    assert.equal(satz['data-aff-code'], 'a_aid')
    assert.equal(satz.src, `https://${WIDGET_HERKUNFT_IM_EXPORT}/widget.js?v1`)
    assert.equal(new Set(lesart.attribute.map((eintrag) => eintrag.name)).size, 26)
    assert.equal(WIDGET_HERKUNFT_INVENTAR_VOLLSTAENDIG, false)
    assert.equal(WIDGET_HERKUNFT_SPAETER_BEOBACHTET, 'widget.discovercars.com')
    assert.equal(lesen().includes('suvarnabhumi'), false)
    assert.equal(lesen().includes('bangkok'), false)
  })

  test('das gebundene Dokument lädt nicht, Abweichungen bleiben zu', () => {
    const original = lesen()
    assert.deepEqual(widgetExportAusfuehren(original), { ok: false, grund: 'einwilligung' })
    assert.deepEqual(
      widgetExportAusfuehren(original.replace('data-location=""', 'data-location="thailand/bangkok/suvarnabhumi-airport-bkk"')),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetExportAusfuehren(original.replace('widget.js?v1"', 'widget.js?v1" data-lang="de"')),
      { ok: false, grund: 'doppelt' },
    )
    assert.deepEqual(
      widgetExportAusfuehren(original.replace('www.discovercars.com', 'evil.example')),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetExportAusfuehren(`${original}<script src="https://evil.example/a.js"></script>`),
      { ok: false, grund: 'export' },
    )
    assert.deepEqual(widgetExportAusfuehren('<div></div>'), { ok: false, grund: 'export' })
  })
})

const konfiguriertPfad = join(dirname(fileURLToPath(import.meta.url)), WIDGET_KONFIGURIERT_DATEI)

function konfiguriert(): Buffer {
  return readFileSync(konfiguriertPfad)
}

describe('DiscoverCars Jetnity-konfigurierte Variante', () => {
  test('860 Bytes sind nur die eine Einfügung im unveränderten Original', () => {
    const roh = konfiguriert()
    const original = readFileSync(datei)
    const einfuegung = Buffer.from(WIDGET_KONFIGURIERT_EINFUEGUNG)
    const anker = Buffer.from('data-aff-code="a_aid"')
    const stelle = roh.indexOf(einfuegung)
    assert.equal(einfuegung.length, 25)
    assert.equal(roh.length, WIDGET_KONFIGURIERT_BYTES)
    assert.equal(roh.length, 860)
    assert.equal(createHash('sha256').update(roh).digest('hex'), WIDGET_KONFIGURIERT_SHA256)
    assert.equal(readFileSync(`${konfiguriertPfad}.sha256`, 'utf8').trim(), WIDGET_KONFIGURIERT_SHA256)
    assert.equal(roh.at(-1), '>'.charCodeAt(0))
    assert.equal(roh.indexOf(einfuegung), roh.lastIndexOf(einfuegung))
    assert.equal(roh.indexOf(anker) + anker.length, stelle)
    const zurueck = Buffer.concat([roh.subarray(0, stelle), roh.subarray(stelle + einfuegung.length)])
    assert.deepEqual(zurueck, original)
    assert.equal(createHash('sha256').update(zurueck).digest('hex'), WIDGET_EXPORT_SHA256)
    assert.equal(WIDGET_KONFIGURIERT_VARIANTE, 'jetnity-konfiguriert')
  })

  test('27 Attribute tragen den öffentlichen Wert jetnity und sonst das Original', () => {
    const lesart = widgetExportLesen(konfiguriert().toString('utf8'))
    assert.equal(lesart.art, 'attribute')
    if (lesart.art !== 'attribute') return
    assert.equal(lesart.attribute.length, 27)
    assert.equal(WIDGET_KONFIGURIERT_ATTRIBUTE.length, 27)
    assert.deepEqual(lesart.attribute, [...WIDGET_KONFIGURIERT_ATTRIBUTE])
    const satz = Object.fromEntries(lesart.attribute.map((eintrag) => [eintrag.name, eintrag.wert]))
    assert.equal(satz['data-aff-code'], 'a_aid')
    assert.equal(satz['data-aff-value'], 'jetnity')
    assert.equal(satz['data-location'], '')
    assert.equal(satz.src, `https://${WIDGET_HERKUNFT_IM_EXPORT}/widget.js?v1`)
    const affCode = lesart.attribute.findIndex((eintrag) => eintrag.name === 'data-aff-code')
    assert.equal(lesart.attribute[affCode + 1]?.name, 'data-aff-value')
  })

  test('die konfigurierte Variante startet nichts und ersetzt das Original nicht', () => {
    const text = konfiguriert().toString('utf8')
    const original = lesen()
    assert.equal(widgetDarfAusfuehren(), false)
    assert.equal(WIDGET_LAUFZEIT, 'CONSENT_BLOCKED')
    assert.deepEqual(widgetKonfiguriertPruefen(text), { ok: false, grund: 'einwilligung' })
    assert.deepEqual(widgetExportAusfuehren(text), { ok: false, grund: 'attribut' })
    assert.deepEqual(widgetKonfiguriertPruefen(original), { ok: false, grund: 'attribut' })
    assert.deepEqual(
      widgetKonfiguriertPruefen(text.replace('data-aff-value="jetnity"', 'data-aff-value="andere"')),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetKonfiguriertPruefen(text.replace('data-aff-value="jetnity"', 'data-aff-value="jetnity" data-aff-value="jetnity"')),
      { ok: false, grund: 'doppelt' },
    )
    assert.deepEqual(
      widgetKonfiguriertPruefen(text.replace('data-aff-value="jetnity"', 'data-aff-value="jetnity" data-extra="x"')),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetKonfiguriertPruefen(text.replace('www.discovercars.com', 'evil.example')),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetKonfiguriertPruefen(`${text}<script src="https://evil.example/a.js"></script>`),
      { ok: false, grund: 'export' },
    )
    assert.deepEqual(
      widgetKonfiguriertPruefen(text.replace('<div>', '<div><iframe src="https://evil.example"></iframe>')),
      { ok: false, grund: 'export' },
    )
    assert.deepEqual(widgetKonfiguriertPruefen('<div></div>'), { ok: false, grund: 'export' })
  })
})
