import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { naechsteRefreshIdentitaet, refreshIstAutoritaer } from './refresh-reihenfolge'

const widget = readFileSync(join(process.cwd(), 'components/admin/security/SecurityWidget.tsx'), 'utf8')

describe('Admin-Security Lesereihenfolge', () => {
  test('jede neue Lesung bekommt die nächste Identität', () => {
    assert.equal(naechsteRefreshIdentitaet(0), 1)
    assert.equal(naechsteRefreshIdentitaet(1), 2)
    assert.equal(naechsteRefreshIdentitaet(2), 3)
    assert.throws(() => naechsteRefreshIdentitaet(-1), /nichtnegative/)
    assert.throws(() => naechsteRefreshIdentitaet(1.5), /nichtnegative/)
  })

  test('nur die zuletzt gestartete Lesung ist maßgeblich', () => {
    assert.equal(refreshIstAutoritaer(1, 1), true)
    assert.equal(refreshIstAutoritaer(2, 2), true)
    assert.equal(refreshIstAutoritaer(1, 2), false)
    assert.equal(refreshIstAutoritaer(2, 1), false)
    assert.equal(refreshIstAutoritaer(0, 0), false)
    assert.equal(refreshIstAutoritaer(1.5, 1.5), false)
  })

  test('das Widget verwirft eine ältere Antwort vor dem Schreiben', () => {
    const refresh = widget.slice(widget.indexOf('const refresh'), widget.indexOf('React.useEffect'))
    const guard = refresh.indexOf('if (!refreshIstAutoritaer(diese, juengsteLesung.current)) return')
    const loadingAus = refresh.indexOf('setLoading(false)')
    const fehler = refresh.indexOf('setFehler(ergebnis.fehler)')
    const daten = refresh.indexOf('setData(ergebnis.daten)')
    assert.ok(guard > -1)
    assert.ok(guard < loadingAus)
    assert.ok(loadingAus < fehler)
    assert.ok(fehler < daten)
    assert.match(widget, /setInterval\(refresh, 15000\)/)
    assert.match(widget, /fetch\('\/api\/admin\/security\/list'/)
    assert.match(widget, /'\/api\/admin\/security\/block'/)
    assert.match(widget, /'\/api\/admin\/security\/unblock'/)
    assert.match(widget, /\{ ip, reason \}/)
    assert.match(widget, /\{ ip \}/)
    assert.doesNotMatch(refresh, /setData\(null\)/)
    assert.doesNotMatch(widget, /\.insert\(/)
    assert.doesNotMatch(widget, /from\('security_events'\)/)
  })
})
