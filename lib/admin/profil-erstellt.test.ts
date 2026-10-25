import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { profilErstellt } from './profil-erstellt'

const PAGE = new URL('../../app/(admin)/admin/users/page.tsx', import.meta.url)
const TABLE = new URL('../../components/admin/UsersTable.tsx', import.meta.url)

describe('Admin-Benutzer Erstellzeit', () => {
  test('null und undefined bleiben unbekannt', () => {
    assert.equal(profilErstellt(null), null)
    assert.equal(profilErstellt(undefined), null)
    assert.equal(profilErstellt(''), '')
  })

  test('ein vorhandener Zeitstempel bleibt unveraendert', () => {
    const wert = '2024-06-15T14:30:00.000Z'
    assert.equal(profilErstellt(wert), wert)
    assert.notEqual(profilErstellt(null), new Date().toISOString())
  })

  test('die Benutzerseite setzt fehlende Erstellzeit nicht auf die Renderuhr', () => {
    const quelle = readFileSync(PAGE, 'utf8')
    assert.equal(quelle.includes('new Date().toISOString()'), false)
    assert.match(quelle, /created_at:\s*profilErstellt\(r\?\.created_at\)/)
    assert.match(quelle, /last_seen_at:\s*r\?\.last_seen_at\s*\?\?\s*null/)
  })

  test('die Tabelle zeigt fuer null Nicht verfügbar und formatiert echte Zeiten weiter de-CH', () => {
    const quelle = readFileSync(TABLE, 'utf8')
    const format = readFileSync(new URL('./users-directory-presentation.ts', import.meta.url), 'utf8')
    assert.match(quelle, /created_at:\s*string\s*\|\s*null/)
    assert.match(quelle, /formatUsersDirectoryTimestamp\(u\.created_at\)/)
    assert.match(quelle, /formatUsersDirectoryTimestamp\(u\.last_seen_at\)/)
    assert.equal(/dtf\.format\(new Date\(u\.created_at\)\)/.test(quelle), false)
    assert.match(format, /new Intl\.DateTimeFormat\('de-CH', \{ dateStyle: 'medium', timeStyle: 'short' \}\)/)
    assert.match(format, /Nicht verfügbar/)
    assert.equal(format.includes('Date.now'), false)
    assert.equal(format.includes('new Date()'), false)
  })
})
