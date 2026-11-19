import assert from 'node:assert/strict'
import { test } from 'node:test'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { providerZurReiseplanUrl } from './provider-rueckkehr'

test('Rückkehr öffnet exakt den gespeicherten Trip und einen belegten Tag', () => {
  const reise = beispielreise()
  reise.id = 'trip-42'
  const tagId = reise.days[0]?.id
  assert.ok(tagId)
  const result = providerZurReiseplanUrl(reise, tagId)
  assert.equal(result, `/reisen/trip-42?ansicht=plan&tag=${encodeURIComponent(tagId)}`)
  assert.doesNotMatch(result, /booking|provider|price|external|session|token/)
})

test('ungültige oder entfernte Tage bleiben eine sichere reine Plan-Navigation', () => {
  const reise = beispielreise()
  reise.id = 'trip-abc'
  assert.equal(providerZurReiseplanUrl(reise, 'fremder-tag'), '/reisen/trip-abc?ansicht=plan')
  assert.equal(providerZurReiseplanUrl(reise, undefined), '/reisen/trip-abc?ansicht=plan')
  assert.equal(providerZurReiseplanUrl(reise, 'x?ansicht=einreise'), '/reisen/trip-abc?ansicht=plan')
})

test('Trip-Kennung kann keine URL- oder Query-Parameter einschleusen', () => {
  const reise = beispielreise()
  reise.id = 'trip/test?x=1'
  assert.equal(providerZurReiseplanUrl(reise), '/reisen/trip%2Ftest%3Fx%3D1?ansicht=plan')
})
