import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { SECURITY_LISTEN_MAX_ZEILEN } from '@/lib/admin/security/filter-ehrlichkeit'
import {
  LEERE_LESUNG,
  SECURITY_DETAIL_MAX,
  SECURITY_KURZFELD_MAX,
  leseAusgang,
  pruefeSecurityListenAntwort,
  sichereLeseFehler,
  wendeLesungAn,
  type SecurityListenAntwort,
} from '@/lib/admin/security/response-contract'

const ZEIT = '2026-10-26T12:00:00.000Z'

function ereignis(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    created_at: ZEIT,
    ip: '203.0.113.10',
    type: 'login_failed',
    user_id: null,
    detail: 'synthetic',
    ...extra,
  }
}

function antwort(events: unknown[], blocklist: unknown[] = []): unknown {
  return { events, blocklist }
}

function angenommen(daten: SecurityListenAntwort) {
  return wendeLesungAn(LEERE_LESUNG, { art: 'angenommen', daten })
}

describe('Admin-Security Antwortvertrag', () => {
  test('eine gültige Liste behält unbekannte Ereignistypen und optionale Nullen', () => {
    const geprueft = pruefeSecurityListenAntwort(
      antwort(
        [ereignis('evt-1', { type: 'totally_new_signal', user_id: null, detail: null, ip: null })],
        [{ ip: ' 203.0.113.20 ', reason: null, created_at: null }],
      ),
    )
    assert.equal(geprueft.ok, true)
    if (!geprueft.ok) return
    assert.equal(geprueft.daten.events[0]?.type, 'totally_new_signal')
    assert.equal(geprueft.daten.events[0]?.ip, null)
    assert.equal(geprueft.daten.blocklist[0]?.ip, '203.0.113.20')
    assert.equal(geprueft.daten.events[0]?.detail, null)
    assert.deepEqual(Object.keys(geprueft.daten.events[0] ?? {}).sort(), [
      'created_at',
      'detail',
      'id',
      'ip',
      'type',
      'user_id',
    ])
  })

  test('leere Listen sind eine gültige Lesung und keine Formstörung', () => {
    const geprueft = pruefeSecurityListenAntwort(antwort([], []))
    assert.equal(geprueft.ok, true)
    if (!geprueft.ok) return
    assert.equal(geprueft.daten.events.length, 0)
    assert.equal(geprueft.daten.blocklist.length, 0)
  })

  test('null, defekte Zeilen, doppelte Kennungen, ungültige Daten und übergroße Listen werden abgelehnt', () => {
    assert.equal(pruefeSecurityListenAntwort(null).ok, false)
    assert.equal(pruefeSecurityListenAntwort({ events: [null], blocklist: [] }).ok, false)
    assert.equal(pruefeSecurityListenAntwort(antwort([ereignis('evt-1', { id: '' })])).ok, false)
    assert.equal(pruefeSecurityListenAntwort(antwort([ereignis('evt-1', { created_at: 'gestern' })])).ok, false)
    assert.equal(pruefeSecurityListenAntwort(antwort([ereignis('evt-1'), ereignis('evt-1')])).ok, false)
    assert.equal(
      pruefeSecurityListenAntwort(antwort([], [{ ip: '203.0.113.1' }, { ip: '203.0.113.1' }])).ok,
      false,
    )
    const zuGross = Array.from({ length: SECURITY_LISTEN_MAX_ZEILEN + 1 }, (_, index) =>
      ereignis(`evt-${index}`),
    )
    const grenze = pruefeSecurityListenAntwort(antwort(zuGross))
    assert.deepEqual(grenze, { ok: false, problem: 'grenze' })
    const detail = pruefeSecurityListenAntwort(
      antwort([ereignis('evt-1', { detail: 'x'.repeat(SECURITY_DETAIL_MAX + 1), id: 'x'.repeat(SECURITY_KURZFELD_MAX + 1) })]),
    )
    assert.equal(detail.ok, false)
    const genau = pruefeSecurityListenAntwort(
      antwort(Array.from({ length: SECURITY_LISTEN_MAX_ZEILEN }, (_, index) => ereignis(`evt-${index}`))),
    )
    assert.equal(genau.ok, true)
  })

  test('Verweigerung löscht geschützte Zeilen und eine folgende Störung holt sie nicht zurück', () => {
    const daten: SecurityListenAntwort = {
      events: [
        {
          id: 'evt-1',
          created_at: ZEIT,
          ip: '203.0.113.10',
          type: 'note',
          user_id: null,
          detail: 'sichtbar',
        },
      ],
      blocklist: [],
    }
    const sichtbar = angenommen(daten)
    const verweigert = wendeLesungAn(sichtbar, { art: 'verweigert' })
    assert.equal(verweigert.art, 'verweigert')
    assert.equal(verweigert.daten, null)
    const stoerung = wendeLesungAn(verweigert, { art: 'stoerung' })
    assert.equal(stoerung.daten, null)
    assert.equal(stoerung.art, 'stoerung')
    const unlesbar = wendeLesungAn(verweigert, { art: 'unlesbar' })
    assert.equal(unlesbar.daten, null)
    const wieder = wendeLesungAn(stoerung, { art: 'angenommen', daten })
    assert.equal(wieder.art, 'angenommen')
    assert.equal(wieder.daten?.events[0]?.detail, 'sichtbar')
  })

  test('eine unlesbare 200 übernimmt weder die Nutzlast noch eine leere Liste', () => {
    const bisher = angenommen({
      events: [
        {
          id: 'evt-alt',
          created_at: ZEIT,
          ip: '203.0.113.4',
          type: 'note',
          user_id: null,
          detail: 'alte-lesung',
        },
      ],
      blocklist: [],
    })
    const behalten = wendeLesungAn(bisher, { art: 'unlesbar' })
    assert.equal(behalten.art, 'unlesbar')
    assert.equal(behalten.daten?.events[0]?.detail, 'alte-lesung')
    assert.equal(behalten.daten?.events.length, 1)
    const erste = wendeLesungAn(LEERE_LESUNG, { art: 'unlesbar' })
    assert.equal(erste.daten, null)
    assert.equal(erste.art, 'unlesbar')
  })

  test('eine Störung nach einer angenommenen Lesung lässt die alte Lesung als veraltet stehen', () => {
    const bisher = angenommen({
      events: [],
      blocklist: [{ ip: '203.0.113.8', reason: 'synthetic', created_at: ZEIT }],
    })
    const veraltet = wendeLesungAn(bisher, { art: 'stoerung' })
    assert.equal(veraltet.art, 'veraltet')
    assert.equal(veraltet.daten?.blocklist[0]?.ip, '203.0.113.8')
  })

  test('Status 401 und 403 sind Verweigerung, eine defekte 200 ist unlesbar, 503 ist eine Störung', () => {
    const leer = { daten: null, fehler: { meldung: 'sql stack', wiederholbar: false } }
    assert.equal(leseAusgang(401, leer).art, 'verweigert')
    assert.equal(leseAusgang(403, leer).art, 'verweigert')
    assert.equal(leseAusgang(200, leer).art, 'unlesbar')
    assert.equal(leseAusgang(503, { daten: null, fehler: { meldung: 'down', wiederholbar: true } }).art, 'stoerung')
    assert.equal(leseAusgang(0, { daten: null, fehler: { meldung: 'Failed to fetch', wiederholbar: true } }).art, 'stoerung')
    const daten: SecurityListenAntwort = { events: [], blocklist: [] }
    assert.deepEqual(leseAusgang(200, { daten, fehler: null }), { art: 'angenommen', daten })
  })

  test('Anzeigetext übernimmt keinen Serverkörper', () => {
    assert.equal(sichereLeseFehler(401).meldung, 'Nicht angemeldet.')
    assert.equal(sichereLeseFehler(403).wiederholbar, false)
    assert.equal(sichereLeseFehler(200).meldung, 'Die Antwort des Servers war nicht lesbar.')
    assert.equal(sichereLeseFehler(503).wiederholbar, true)
    assert.equal(sichereLeseFehler(500).meldung, 'Der Server antwortete mit Status 500.')
    assert.equal(sichereLeseFehler(500).meldung.includes('stack'), false)
  })
})
