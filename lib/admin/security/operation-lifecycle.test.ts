import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  beginnVorgang,
  istAusstehend,
  leeresBuch,
  schliesseVorgang,
  schreibAusgang,
  subjectSchluessel,
  vorgaengeNachBeginn,
  vorgangFuer,
} from '@/lib/admin/security/operation-lifecycle'

function erfasst(ip: string, aktion: 'eintragen' | 'entfernen', grund: string | null = 'grund') {
  return beginnVorgang(leeresBuch(), { ip, aktion, grund })
}

describe('Admin-Security Vorgangslebenszyklus', () => {
  test('ein Vorgang speichert die erfasste IP und den Grund', () => {
    const beginn = beginnVorgang(leeresBuch(), {
      ip: ' 203.0.113.10 ',
      aktion: 'eintragen',
      grund: ' aus Ereignis note ',
    })
    assert.equal(beginn.ok, true)
    if (!beginn.ok) return
    assert.equal(subjectSchluessel(' 203.0.113.10 '), '203.0.113.10')
    assert.equal(beginn.vorgang.ip, '203.0.113.10')
    assert.equal(vorgangFuer(beginn.buch, '203.0.113.10')?.id, beginn.vorgang.id)
    assert.equal(beginn.vorgang.grund, 'aus Ereignis note')
    assert.equal(beginn.vorgang.lage, 'ausstehend')
    assert.equal(istAusstehend(beginn.buch, '203.0.113.10'), true)
  })

  test('derselbe Betreff kann nicht doppelt oder gegenläufig gestartet werden', () => {
    const erster = erfasst('203.0.113.10', 'eintragen', 'erster')
    assert.equal(erster.ok, true)
    if (!erster.ok) return
    const doppelt = beginnVorgang(erster.buch, { ip: '203.0.113.10', aktion: 'eintragen', grund: 'zweiter' })
    assert.equal(doppelt.ok, false)
    if (doppelt.ok) return
    assert.equal(doppelt.grund, 'doppelt')
    assert.equal(doppelt.buch, erster.buch)
    const konflikt = beginnVorgang(erster.buch, { ip: '203.0.113.10', aktion: 'entfernen', grund: null })
    assert.equal(konflikt.ok, false)
    if (konflikt.ok) return
    assert.equal(konflikt.grund, 'konflikt')
    assert.equal(erster.buch.nachIp['203.0.113.10']?.grund, 'erster')
  })

  test('ein fremder Betreff bleibt ausstehend, wenn ein anderer abgeschlossen wird', () => {
    const a = erfasst('203.0.113.1', 'eintragen', 'A')
    assert.equal(a.ok, true)
    if (!a.ok) return
    const b = beginnVorgang(a.buch, { ip: '203.0.113.2', aktion: 'entfernen', grund: null })
    assert.equal(b.ok, true)
    if (!b.ok) return
    const nachA = schliesseVorgang(b.buch, a.vorgang.id, a.vorgang.ip, 'rueckgemeldet')
    assert.equal(nachA.nachIp['203.0.113.1']?.lage, 'rueckgemeldet')
    assert.equal(nachA.nachIp['203.0.113.2']?.lage, 'ausstehend')
    assert.equal(nachA.nachIp['203.0.113.2']?.id, b.vorgang.id)
    assert.deepEqual(
      vorgaengeNachBeginn(nachA).map((vorgang) => vorgang.ip),
      ['203.0.113.1', '203.0.113.2'],
    )
  })

  test('ein alter Abschluss löscht keinen neueren ausstehenden Vorgang', () => {
    const erster = erfasst('203.0.113.10', 'eintragen', 'alt')
    assert.equal(erster.ok, true)
    if (!erster.ok) return
    const offen = schliesseVorgang(erster.buch, erster.vorgang.id, erster.vorgang.ip, 'unbestaetigt')
    const zweiter = beginnVorgang(offen, { ip: '203.0.113.10', aktion: 'eintragen', grund: 'neu' })
    assert.equal(zweiter.ok, true)
    if (!zweiter.ok) return
    const ignoriert = schliesseVorgang(zweiter.buch, erster.vorgang.id, '203.0.113.10', 'rueckgemeldet')
    assert.equal(ignoriert.nachIp['203.0.113.10']?.id, zweiter.vorgang.id)
    assert.equal(ignoriert.nachIp['203.0.113.10']?.lage, 'ausstehend')
    assert.equal(ignoriert.nachIp['203.0.113.10']?.grund, 'neu')
  })

  test('eine Rückmeldung ist kein Schreibbeleg und ein Transportfehler kein Gegenbeleg', () => {
    assert.equal(schreibAusgang(200, { ok: true, message: 'raw stack' }, true), 'rueckgemeldet')
    assert.equal(schreibAusgang(200, { ok: false, message: 'raw' }, true), 'unbestaetigt')
    assert.equal(schreibAusgang(500, { ok: false, message: 'duplicate key stack' }, true), 'unbestaetigt')
    assert.equal(schreibAusgang(200, null, false), 'unbestaetigt')
    assert.equal(schreibAusgang(403, { error: 'raw policy' }, true), 'verweigert')
    assert.equal(schreibAusgang(401, null, false), 'verweigert')
    const beginn = erfasst('203.0.113.9', 'entfernen', null)
    assert.equal(beginn.ok, true)
    if (!beginn.ok) return
    const zu = schliesseVorgang(beginn.buch, beginn.vorgang.id, beginn.vorgang.ip, 'unbestaetigt')
    assert.equal(zu.nachIp['203.0.113.9']?.lage, 'unbestaetigt')
    assert.equal(zu.naechsteId, beginn.buch.naechsteId)
  })

  test('eine leere IP startet keinen Vorgang', () => {
    const leer = beginnVorgang(leeresBuch(), { ip: '   ', aktion: 'eintragen', grund: 'x' })
    assert.deepEqual(leer, { ok: false, buch: leeresBuch(), grund: 'leer' })
  })
})
