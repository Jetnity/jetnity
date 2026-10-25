import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  archivHinweis,
  archivKlasse,
  beobachtungAnwenden,
  rueckmeldungAnwenden,
  sperreLoesen,
  sperreSetzen,
  type ArchivVorgang,
} from '@/lib/trips/trip-archive-workflow'

function vorgang(teil: Partial<ArchivVorgang> = {}): ArchivVorgang {
  return {
    operationId: 'op-1',
    tripId: 'trip-1',
    collectionId: 'sammlung',
    aktion: 'archivieren',
    status: 'planned',
    updatedAt: '2026-10-25T00:00:00.000000Z',
    archivePreviousStatus: 'planned',
    write: 'pending',
    meldung: '',
    observation: 'unread',
    observedStatus: null,
    ...teil,
  }
}

describe('Archiv-Klassifikation', () => {
  test('erkennt nur den genauen Erfolg und eine negative Meldung', () => {
    assert.equal(archivKlasse({ ok: true, wert: null }), 'acknowledged')
    assert.equal(archivKlasse({ ok: false, meldung: 'Konflikt' }), 'returned-negative')
    assert.equal(archivKlasse({ ok: true }), 'unknown')
    assert.equal(archivKlasse({ ok: true, wert: null, extra: 1 }), 'unknown')
    assert.equal(archivKlasse({ ok: false }), 'unknown')
    assert.equal(archivKlasse({ ok: false, meldung: '' }), 'unknown')
    assert.equal(archivKlasse(null), 'unknown')
    assert.equal(archivKlasse([{ ok: true, wert: null }]), 'unknown')
  })

  test('die Sperre gilt nur für denselben Vorgang', () => {
    const erste = sperreSetzen(null, { operationId: 'a', tripId: 't', collectionId: 'c' })
    assert.notEqual(erste, 'belegt')
    assert.equal(sperreSetzen(erste === 'belegt' ? null : erste, { operationId: 'b', tripId: 't', collectionId: 'c' }), 'belegt')
    assert.equal(sperreLoesen(erste === 'belegt' ? null : erste, 'b'), erste)
    assert.equal(sperreLoesen(erste === 'belegt' ? null : erste, 'a'), null)
  })

  test('Rückmeldung und Beobachtung bleiben getrennt', () => {
    const ausgang = [vorgang(), vorgang({ operationId: 'op-2', write: 'pending' })]
    const veraltet = rueckmeldungAnwenden(ausgang, {
      mounted: true,
      collectionId: 'sammlung',
      operationId: 'op-1',
      klasse: 'acknowledged',
      meldung: '',
    })
    assert.equal(veraltet[0]?.write, 'acknowledged')
    assert.equal(veraltet[1]?.write, 'pending')
    const weg = rueckmeldungAnwenden(ausgang, {
      mounted: false,
      collectionId: 'sammlung',
      operationId: 'op-1',
      klasse: 'unknown',
      meldung: '',
    })
    assert.equal(weg[0]?.write, 'pending')
    const negativ = rueckmeldungAnwenden([vorgang()], {
      mounted: true,
      collectionId: 'sammlung',
      operationId: 'op-1',
      klasse: 'returned-negative',
      meldung: 'Konflikt',
    })
    assert.equal(negativ[0]?.write, 'returned-negative')
    assert.equal(negativ[0]?.meldung, 'Konflikt')
    const gesehen = beobachtungAnwenden(veraltet, [{ id: 'trip-1', status: 'archived' }], null)
    assert.equal(gesehen[0]?.observation, 'row-status')
    assert.equal(gesehen[0]?.observedStatus, 'archived')
    assert.equal(gesehen[0]?.write, 'acknowledged')
    const wegZeile = beobachtungAnwenden(veraltet, [], null)
    assert.equal(wegZeile[0]?.observation, 'row-absent')
    assert.equal(wegZeile[0]?.write, 'acknowledged')
    const fehler = beobachtungAnwenden(veraltet, [], { status: 503 })
    assert.equal(fehler[0]?.observation, 'unread')
    assert.equal(fehler[0]?.write, 'acknowledged')
    assert.match(archivHinweis(negativ[0]).schreiben, /Konflikt/)
    assert.match(archivHinweis(gesehen[0]).sehen, /unabhängig|Status/)
  })
})
