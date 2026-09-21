import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  istAufgezeichneterLoginFehler,
  istAufgezeichneteAuffaelligkeit,
} from '@/lib/admin/security-event-taxonomy'

const widget = readFileSync(
  join(process.cwd(), 'components/admin/security/SecurityWidget.tsx'),
  'utf8',
)
const kennzahlen = readFileSync(
  join(process.cwd(), 'lib/admin/kennzahlen.ts'),
  'utf8',
)

describe('Sicherheits-KPI-Taxonomie', () => {
  test('Login-Fehler sind nur die dokumentierten exakten Typen', () => {
    assert.equal(istAufgezeichneterLoginFehler('auth_failed'), true)
    assert.equal(istAufgezeichneterLoginFehler('login_failed'), true)
  })

  test('Login-Fehler werden nicht über Substring failed erkannt', () => {
    assert.equal(istAufgezeichneterLoginFehler('something_failed'), false)
    assert.equal(istAufgezeichneterLoginFehler('failed'), false)
    assert.equal(istAufgezeichneterLoginFehler('auth_failed_extra'), false)
    assert.equal(istAufgezeichneterLoginFehler('AUTH_FAILED'), false)
  })

  test('Auffälligkeiten sind anomaly* und die historischen exakten Typen', () => {
    assert.equal(istAufgezeichneteAuffaelligkeit('anomaly'), true)
    assert.equal(istAufgezeichneteAuffaelligkeit('anomaly_rate_limit'), true)
    assert.equal(istAufgezeichneteAuffaelligkeit('bot'), true)
    assert.equal(istAufgezeichneteAuffaelligkeit('suspicious'), true)
    assert.equal(istAufgezeichneteAuffaelligkeit('ddos'), true)
  })

  test('Auffälligkeiten werden nicht über lose Substrings erkannt', () => {
    assert.equal(istAufgezeichneteAuffaelligkeit('mybot'), false)
    assert.equal(istAufgezeichneteAuffaelligkeit('bot_detected'), false)
    assert.equal(istAufgezeichneteAuffaelligkeit('ddos_attack'), false)
    assert.equal(istAufgezeichneteAuffaelligkeit('Suspicious'), false)
  })

  test('leere oder fehlende Typen sind keine Kennzahl', () => {
    assert.equal(istAufgezeichneterLoginFehler(null), false)
    assert.equal(istAufgezeichneterLoginFehler(undefined), false)
    assert.equal(istAufgezeichneterLoginFehler(''), false)
    assert.equal(istAufgezeichneteAuffaelligkeit(null), false)
    assert.equal(istAufgezeichneteAuffaelligkeit(undefined), false)
    assert.equal(istAufgezeichneteAuffaelligkeit(''), false)
  })

  test('Widget und Aggregator importieren dieselbe Taxonomie und keine alte Stringregel', () => {
    assert.match(widget, /from '@\/lib\/admin\/security-event-taxonomy'/)
    assert.match(kennzahlen, /from '@\/lib\/admin\/security-event-taxonomy'/)
    assert.match(widget, /istAufgezeichneterLoginFehler/)
    assert.match(widget, /istAufgezeichneteAuffaelligkeit/)
    assert.match(kennzahlen, /istAufgezeichneterLoginFehler/)
    assert.match(kennzahlen, /istAufgezeichneteAuffaelligkeit/)
    assert.doesNotMatch(widget, /includes\('failed'\)/)
    assert.doesNotMatch(widget, /bot\|suspicious\|ddos/)
    assert.doesNotMatch(kennzahlen, /e\.type === 'auth_failed'/)
    assert.doesNotMatch(kennzahlen, /e\.type\.startsWith\('anomaly'\)/)
  })

  test('die zwei Kennzahlen überlappen sich nicht', () => {
    const loginTypen = ['auth_failed', 'login_failed']
    const auffaelligkeiten = ['anomaly_rate_limit', 'bot', 'suspicious', 'ddos']

    for (const typ of loginTypen) {
      assert.equal(istAufgezeichneteAuffaelligkeit(typ), false)
    }
    for (const typ of auffaelligkeiten) {
      assert.equal(istAufgezeichneterLoginFehler(typ), false)
    }
  })
})
