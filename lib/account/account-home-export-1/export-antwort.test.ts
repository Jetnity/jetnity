import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  EXPORT_ERFOLG_TEXT,
  EXPORT_SCHEMA_VERSION,
  EXPORT_TABELLEN,
  EXPORT_VOLLSTAENDIGKEIT,
  exportDateiName,
  exportDokumentGueltig,
  exportFehlertext,
} from '@/lib/account/account-home-export-1/export-antwort'
import {
  KONTO_DATENEXPORT_SCHEMA_VERSION,
  KONTO_DATENEXPORT_TABELLEN,
  KONTO_DATENEXPORT_VOLLSTAENDIGKEIT,
  kontoDatenexportDateiname,
  kontoDatenexportDokument,
} from '@/lib/account/datenexport'

function dokument() {
  const data = {} as Record<(typeof KONTO_DATENEXPORT_TABELLEN)[number], unknown[]>
  for (const tabelle of KONTO_DATENEXPORT_TABELLEN) data[tabelle] = []
  return kontoDatenexportDokument({ generatedAt: '2026-10-26T10:00:00.000Z', data })
}

describe('Export-Antwort vor dem Download', () => {
  test('der Client prüft denselben Vertrag wie der Server', () => {
    assert.equal(EXPORT_SCHEMA_VERSION, KONTO_DATENEXPORT_SCHEMA_VERSION)
    assert.equal(EXPORT_VOLLSTAENDIGKEIT, KONTO_DATENEXPORT_VOLLSTAENDIGKEIT)
    assert.deepEqual([...EXPORT_TABELLEN], [...KONTO_DATENEXPORT_TABELLEN])
    const erzeugt = dokument()
    assert.equal(exportDokumentGueltig(erzeugt), true)
    assert.equal(exportDateiName(erzeugt.generatedAt), kontoDatenexportDateiname(erzeugt.generatedAt))
  })

  test('401, 503, unlesbar und Abbruch laden nichts und bleiben erklärbar', () => {
    assert.equal(exportDokumentGueltig({ schemaVersion: EXPORT_SCHEMA_VERSION }), false)
    assert.equal(exportDokumentGueltig('{"ok":true}'), false)
    assert.equal(exportDokumentGueltig(null), false)
    const erzeugt = dokument()
    assert.equal(exportDokumentGueltig({ ...erzeugt, schemaVersion: 'jetnity.account-export.v2' }), false)
    assert.match(exportFehlertext(401), /nichts heruntergeladen/)
    assert.match(exportFehlertext(401), /Einstellungen/)
    assert.match(exportFehlertext(503), /nichts heruntergeladen/)
    assert.match(exportFehlertext(500), /nichts heruntergeladen/)
    assert.match(exportFehlertext('unlesbar'), /keine gültige Exportdatei/)
    assert.match(exportFehlertext('frist'), /ausdrücklich/)
    assert.match(exportFehlertext('abbruch'), /abgebrochen/)
    assert.match(EXPORT_ERFOLG_TEXT, /Browser/)
    assert.match(EXPORT_ERFOLG_TEXT, /Betriebssystem/)
    assert.match(EXPORT_ERFOLG_TEXT, /keine einzelne atomare Momentaufnahme/)
    assert.match(EXPORT_ERFOLG_TEXT, /keine Kontolöschung/)
  })
})
