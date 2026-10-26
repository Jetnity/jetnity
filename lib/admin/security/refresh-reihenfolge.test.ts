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
    const angewandt = refresh.indexOf('wendeLesungAn(leseZustand.current, ausgang)')
    const daten = refresh.indexOf('setData(naechster.daten)')
    assert.ok(guard > -1)
    assert.ok(guard < loadingAus)
    assert.ok(loadingAus < angewandt)
    assert.ok(angewandt < daten)
    assert.equal(refresh.slice(0, guard).includes('setData('), false)
    assert.equal(refresh.slice(0, guard).includes('setFehler('), false)
    assert.match(widget, /ursprung === 'takt' && laufende\.current > 0/)
    assert.match(widget, /laufende\.current >= 2/)
    assert.match(widget, /mounted\.current/)
    assert.match(widget, /void refresh\('takt'\)/)
    assert.match(widget, /15000/)
    assert.doesNotMatch(widget, /setInterval\(refresh, 15000\)/)
    assert.match(widget, /fetch\('\/api\/admin\/security\/list'/)
    assert.match(widget, /'\/api\/admin\/security\/block'/)
    assert.match(widget, /'\/api\/admin\/security\/unblock'/)
    assert.match(widget, /\{ ip, reason \}/)
    assert.match(widget, /\{ ip \}/)
    assert.doesNotMatch(refresh, /setData\(null\)/)
    assert.doesNotMatch(refresh, /setData\(ergebnis\.daten\)/)
    assert.match(refresh, /ausgang\.art === 'verweigert'/)
    assert.match(refresh, /blendeVorgaengeAus\(buchRef\.current\)/)
    assert.match(widget, /Der Server hat den Schreibvorgang abgewiesen/)
    assert.match(widget, /verweigerung\.current !== epoche/)
    assert.doesNotMatch(widget, /Schreibschutz aufheben/)
    assert.doesNotMatch(widget, /setSchreibenVerweigert/)
    assert.doesNotMatch(widget, /\.insert\(/)
    assert.doesNotMatch(widget, /from\('security_events'\)/)
    assert.doesNotMatch(widget, /toast\./)
  })
})
