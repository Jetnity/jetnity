import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { artAusStatus } from '@/lib/rollout/ziel-art'

describe('Ziel-Art aus Management-API-Status', () => {
  test('eigenständiges Projekt ist Production-fähig', () => {
    assert.equal(artAusStatus(200, 404), 'projekt')
    assert.equal(artAusStatus(200, 400), 'projekt')
  })

  test('Branch ist Development und kein Production-Ziel', () => {
    assert.equal(artAusStatus(404, 200), 'branch')
  })

  test('unklarer Zustand bricht ab', () => {
    assert.equal(artAusStatus(200, 200), 'unbekannt')
    assert.equal(artAusStatus(404, 404), 'unbekannt')
    assert.equal(artAusStatus(401, 401), 'unbekannt')
    assert.equal(artAusStatus(500, 200), 'unbekannt')
  })
})
