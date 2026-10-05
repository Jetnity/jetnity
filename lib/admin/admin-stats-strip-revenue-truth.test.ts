import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ADMIN_EHRLICHE_TEXTE } from './ehrliche-zustaende'

function ohneKommentare(quelle: string): string {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

const stripQuelle = readFileSync(
  join(process.cwd(), 'components/admin/home/AdminStatsStrip.tsx'),
  'utf8',
)
const strip = ohneKommentare(stripQuelle)

describe('Admin-Übersicht Revenue-Truth (Finding 6.3)', () => {
  test('unterdrückt unbelegte Umsatz-/Conversion-Kacheln und bleibt bei Reiseaggregaten', () => {
    assert.doesNotMatch(strip, /\.rpc\(\s*['"`]admin_payments_summary_30d['"`]/)
    assert.doesNotMatch(strip, /label:\s*['"]Gesamtumsatz/)
    assert.doesNotMatch(strip, /label:\s*['"]Bestellungen/)
    assert.doesNotMatch(strip, /label:\s*['"]Refunds/)
    assert.doesNotMatch(strip, /label:\s*['"]Payouts/)
    assert.doesNotMatch(strip, /Bestellungen je Reise/)
    assert.doesNotMatch(strip, /total_revenue_cents|refunds_cents|payouts_cents|orders_count/)
    assert.doesNotMatch(strip, /style:\s*['"]currency['"]/)
    assert.match(strip, /\.rpc\(\s*['"`]admin_reisen_kennzahlen['"`]/)
    assert.match(strip, /Reisen \(30T\)/)
    assert.match(strip, /Konten mit Reise \(30T\)/)
    assert.match(strip, /umsatzConversionHinweis/)
    assert.match(strip, /value:\s*['"]–['"]/)
    assert.doesNotMatch(strip, /value:\s*['"]0['"]/)
    assert.doesNotMatch(strip, /value:\s*['"]CHF/)
  })

  test('Hinweis behauptet keinen Umsatz, bis ein provider-backed Pfad existiert', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis, /nicht verfügbar/)
    assert.match(ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis, /provider-backed kommerzieller Pfad/)
    assert.match(ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis, /kein Umsatz/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis, /CHF 0|0,00|0\.00/)
    assert.match(stripQuelle, /ADMIN_EHRLICHE_TEXTE\.umsatzConversionHinweis/)
  })
})
