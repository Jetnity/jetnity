// lib/readiness/schema.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  enthaltSensitiveDaten,
  readinessEingabeSchema,
  readinessItemLesen,
  readinessItemsLesen,
} from '@/lib/readiness/schema'

const JETZT = '2026-08-22T08:00:00.000Z'

function item(teil: Record<string, unknown> = {}) {
  return {
    id: 'rdy-1',
    clientRef: 'entry_check:TH',
    kind: 'entry_check',
    userStatus: 'open',
    evidence: 'user',
    countryCode: 'TH',
    tripItemId: null,
    title: null,
    contextFingerprint: 'v1|kind=entry_check|cc=TH',
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

describe('Readiness-Schema', () => {
  test('gültiger Check kommt durch', () => {
    assert.notEqual(readinessItemLesen(item()), null)
  })

  test('ungültige Enums werden abgelehnt', () => {
    assert.equal(readinessItemLesen(item({ kind: 'visa_required' })), null)
    assert.equal(readinessItemLesen(item({ userStatus: 'verified' })), null)
    assert.equal(readinessItemLesen(item({ evidence: 'official' })), null)
  })

  test('freier Country-Label ist kein Code', () => {
    assert.equal(readinessItemLesen(item({ countryCode: 'Thailand' })), null)
    assert.equal(readinessItemLesen(item({ countryCode: 'T1' })), null)
    assert.equal(readinessItemLesen(item({ countryCode: 'th' }))?.countryCode, 'TH')
  })

  test('Custom Title Längenlimit', () => {
    assert.equal(
      readinessItemLesen(item({ kind: 'preparation', title: 'a'.repeat(81), clientRef: 'preparation:x' })),
      null,
    )
  })

  test('keine arbitrary URLs / HTML im Titel', () => {
    assert.equal(
      readinessItemLesen(item({ kind: 'preparation', clientRef: 'p1', title: 'Siehe https://evil.test' })),
      null,
    )
    assert.equal(
      readinessItemLesen(item({ kind: 'preparation', clientRef: 'p2', title: '<script>x</script>' })),
      null,
    )
  })

  test('keine sensiblen Dokumentfelder', () => {
    assert.equal(enthaltSensitiveDaten('Passnummer 1234567'), true)
    assert.equal(enthaltSensitiveDaten('Geburtsdatum 01.01.1990'), true)
    assert.equal(enthaltSensitiveDaten('Visa-Nr 998877'), true)
    assert.equal(enthaltSensitiveDaten('Impfpass gelb'), true)
    assert.equal(enthaltSensitiveDaten('Reiseadapter einpacken'), false)
    const geprueft = readinessEingabeSchema.safeParse({
      kind: 'preparation',
      userStatus: 'open',
      title: 'Passport X1234567',
    })
    assert.equal(geprueft.success, false)
    const label = readinessEingabeSchema.safeParse({
      kind: 'preparation',
      userStatus: 'open',
      title: 'Kreditkarte 411111',
    })
    assert.equal(label.success, false)
  })

  test('Browser darf official evidence nicht setzen', () => {
    const gelesen = readinessItemLesen(item({ evidence: 'timatic' }))
    assert.equal(gelesen, null)
    const user = readinessItemLesen(item({ evidence: 'user' }))
    assert.equal(user?.evidence, 'user')
  })

  test('Retry/Doppelklick über dieselbe clientRef verdoppelt nicht', () => {
    const items = readinessItemsLesen([item(), item(), item({ id: 'rdy-2' })])
    assert.equal(items.length, 1)
  })
})
