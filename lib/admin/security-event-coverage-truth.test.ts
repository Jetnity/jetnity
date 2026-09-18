import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ADMIN_EHRLICHE_TEXTE } from './ehrliche-zustaende'

function ohneKommentare(quelle: string): string {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

const widgetQuelle = readFileSync(
  join(process.cwd(), 'components/admin/security/SecurityWidget.tsx'),
  'utf8',
)
const widget = ohneKommentare(widgetQuelle)

describe('Admin-Security Coverage-Truth (Finding 5.2 presentation)', () => {
  test('KPI- und Tabellenworte nutzen aufgezeichnet-Semantik', () => {
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityAbdeckungHinweis/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityKpiEvents24h/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityKpiLoginFehler24h/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityKpiAuffaelligkeiten24h/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityTabelleTitel/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.securityTabelleLeer/)
    assert.match(widget, /ADMIN_EHRLICHE_TEXTE\.ipBlockHinweis/)
    assert.doesNotMatch(widget, /label=["']Events \(24h\)["']/)
    assert.doesNotMatch(widget, /label=["']Login-Fehler \(24h\)["']/)
    assert.doesNotMatch(widget, /label=["']Verdächtig \(24h\)["']/)
    assert.doesNotMatch(widget, /Letzte Security-Events/)
    assert.doesNotMatch(widget, /Keine Events gefunden/)
  })

  test('24h-KPIs kommen aus ungefilterten aufgezeichneten Events', () => {
    assert.match(widget, /aufgezeichneteEvents = data\?\.events/)
    assert.match(widget, /const last24 = aufgezeichneteEvents\.filter/)
    assert.doesNotMatch(widget, /const last24 = \(events/)
    assert.doesNotMatch(widget, /last24 = \(events \?\? \[\]\)\.filter/)
    assert.match(widget, /events === null \? '—' : `\$\{events\.length\} Einträge`/)
    assert.match(widget, /value=\{data \? last24\.length : null\}/)
    assert.match(widget, /value=\{data \? failed : null\}/)
    assert.match(widget, /value=\{data \? suspicious : null\}/)
  })

  test('zentrale Texte behaupten keine vollständige Überwachung', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /keine vollständige Event-Ingestion/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /0 aufgezeichnete Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /belegen nicht/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /nicht enforced/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis, /aufgezeichnete Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis, /unvollständig/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiEvents24h, /^Aufgezeichnete /)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiLoginFehler24h, /^Aufgezeichnete /)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiAuffaelligkeiten24h, /^Aufgezeichnete /)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleTitel, /^Aufgezeichnete /)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleLeer, /aufgezeichneten Events/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityTabelleLeer, /^Keine Events[.]?$/)
    assert.match(widgetQuelle, /ADMIN_EHRLICHE_TEXTE\.securityAbdeckungHinweis/)
  })
})
