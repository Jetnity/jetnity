import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { decideUsersDirectoryRead } from './users-directory-query'
import {
  DIRECTORY_ADDRESS_UNREADABLE,
  DIRECTORY_CHECK_UNCONFIRMED,
  DIRECTORY_CHECKING,
  DIRECTORY_CURRENT,
  DIRECTORY_PREVIOUS,
  USERS_DIRECTORY_REFRESH_LEASE_MS,
  directoryBodyCopy,
  directoryCeilingCopy,
  directoryCountLabel,
  directoryInvalidReason,
  directoryPageLabel,
  directoryView,
  formatUsersDirectoryTimestamp,
  lastDirectoryPage,
  nextDirectoryPage,
  previousDirectoryPage,
  realDirectorySpan,
} from './users-directory-presentation'

function seite(value: number | null) {
  assert.equal(value === null || (Number.isInteger(value) && value >= 1 && value <= 5000), true)
}

describe('Admin-Benutzerverzeichnis Anzeige', () => {
  test('fehlende und ungueltige Zeiten sind Nicht verfügbar und werfen nicht', () => {
    assert.equal(formatUsersDirectoryTimestamp(null), 'Nicht verfügbar')
    assert.equal(formatUsersDirectoryTimestamp(undefined), 'Nicht verfügbar')
    assert.equal(formatUsersDirectoryTimestamp(''), 'Nicht verfügbar')
    assert.equal(formatUsersDirectoryTimestamp('kein-datum'), 'Nicht verfügbar')
    assert.notEqual(formatUsersDirectoryTimestamp(null), new Date().toISOString())
  })

  test('ein fester ISO-Zeitstempel folgt de-CH medium/short', () => {
    const wert = '2024-06-15T14:30:00.000Z'
    const erwartet = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(wert))
    assert.equal(formatUsersDirectoryTimestamp(wert), erwartet)
    assert.notEqual(formatUsersDirectoryTimestamp(wert), new Date().toISOString())
  })

  test('leere Liste, kein Treffer, ausserhalb und unbekannte Anzahl bleiben getrennt', () => {
    const leer = directoryView({ count: 0, page: 1, filtered: false })
    const keiner = directoryView({ count: 0, page: 1, filtered: true })
    const draussen = directoryView({ count: 20, page: 99, filtered: false })
    const unbekannt = directoryView({ count: null, page: 4, filtered: false })
    assert.equal(leer.kind, 'empty-directory')
    assert.equal(keiner.kind, 'no-match')
    assert.equal(draussen.kind, 'out-of-range')
    assert.equal(unbekannt.kind, 'unknown-count')
    assert.equal(directoryBodyCopy(leer), 'Keine Konten vorhanden.')
    assert.equal(directoryBodyCopy(keiner), 'Keine Treffer für diese Suche oder Filter.')
    assert.equal(directoryPageLabel({ page: 99, count: 20, view: draussen }), 'Seite 99 ist in dieser Abfrage nicht vorhanden.')
    assert.equal(directoryPageLabel({ page: 99, count: 20, view: draussen }).includes('/ 1'), false)
    assert.equal(directoryCountLabel(null, false), 'Anzahl nicht verfügbar')
    assert.equal(directoryCountLabel(0, false), '0 Nutzer')
    assert.equal(directoryCountLabel(0, true), '0 Treffer')
  })

  test('100001 bleibt 100001, die Spanne ist 5001, das letzte Ziel ist 5000', () => {
    assert.equal(realDirectorySpan(100001), 5001)
    assert.equal(directoryCountLabel(100001, false), '100001 Nutzer')
    assert.equal(directoryCeilingCopy(100001), 'Die vollständige Liste umfasst 5001 Seiten. Erreichbar sind die Seiten 1 bis 5000.')
    assert.equal(lastDirectoryPage(100001), 5000)
    seite(1)
    seite(lastDirectoryPage(100001))
    seite(previousDirectoryPage(5000))
    assert.equal(nextDirectoryPage({ page: 5000, count: 100001, rowCount: 20 }), null)
    assert.equal(nextDirectoryPage({ page: 4999, count: 100001, rowCount: 20 }), 5000)
    const sichtbar = directoryView({ count: 100001, page: 5000, filtered: false })
    assert.equal(sichtbar.kind, 'page')
    if (sichtbar.kind === 'page') assert.equal(sichtbar.realLast, 5001)
  })

  test('Seite 5000 ohne Anzahl und mit 20 Zeilen hat kein naechstes Ziel', () => {
    assert.equal(nextDirectoryPage({ page: 5000, count: null, rowCount: 20 }), null)
    assert.equal(previousDirectoryPage(5000), 4999)
    assert.equal(directoryCeilingCopy(20), null)
    seite(previousDirectoryPage(5000))
    seite(nextDirectoryPage({ page: 3, count: null, rowCount: 20 }))
    assert.equal(nextDirectoryPage({ page: 3, count: null, rowCount: 19 }), null)
  })

  test('jedes Ziel und die Wiederherstellung bleiben in 1 bis 5000 oder fehlen', () => {
    const recovery = decideUsersDirectoryRead({ page: '5001', role: 'admin', source: 'support' })
    assert.equal(recovery.kind, 'invalid')
    if (recovery.kind !== 'invalid') return
    const params = new URLSearchParams(recovery.recovery.split('?')[1])
    seite(Number(params.get('page')))
    assert.equal(params.get('page'), '1')
    assert.equal(recovery.recovery.includes('5001'), false)
    seite(previousDirectoryPage(2))
    assert.equal(previousDirectoryPage(1), null)
    seite(lastDirectoryPage(0))
    assert.equal(lastDirectoryPage(0), 1)
    assert.equal(USERS_DIRECTORY_REFRESH_LEASE_MS, 8000)
    assert.equal(DIRECTORY_CURRENT, 'Aktuelle Ergebnisse')
    assert.equal(DIRECTORY_PREVIOUS, 'Die angezeigten Konten gehören noch zur vorherigen Abfrage.')
    assert.equal(DIRECTORY_CHECKING, 'Die Abfrage wird erneut gelesen.')
    assert.equal(DIRECTORY_CHECK_UNCONFIRMED, 'Die erneute Abfrage wurde nicht bestätigt.')
    assert.equal(DIRECTORY_ADDRESS_UNREADABLE, 'Diese Adresse kann nicht gelesen werden.')
    assert.equal(directoryInvalidReason('page-above-max').includes('5000'), true)
    assert.equal(directoryInvalidReason('repeated').length > 0, true)
  })
})
