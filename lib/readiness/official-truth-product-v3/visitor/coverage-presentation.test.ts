import assert from 'node:assert/strict'
import { test } from 'node:test'
import { V3_CUSTOMER_INFORMATION_TOPIC_IDS } from '../customer-information/topics'
import { v3CustomerInformationCoverage } from './coverage-presentation'
import { createV3VisitorController, type V3VisitorTimers, type V3VisitorUiState } from './controller'
import type { V3VisitorView, V3VisitorViewResult } from './presentation'
import type { V3VisitorInput } from '../contract'

const generatedAt = '2026-11-15T08:00:00.000Z'
const visa = (): Extract<V3VisitorViewResult, { status: 'accepted' }> => ({
  status: 'accepted', informationTopic: 'visa', title: 'Visum',
  conditions: ['Synthetische Direktreise mit Reisepass; mehrere Staatsangehörigkeiten'],
  statements: [{ text: 'Synthetische Visumaussage', when: null, href: null }],
  source: { label: 'Fiktive Testbehörde', href: 'https://destination.example/' },
  checkedAtText: 'Synthetischer Stand', validityText: 'Synthetische Gültigkeit',
  ruleVersion: 9, expiresAt: '2026-11-15T08:00:01.000Z',
})

test('complete coverage keeps every customer topic visible without creating a positive finding', () => {
  const coverage = v3CustomerInformationCoverage([])
  const topics = coverage.groups.flatMap(group => group.topics)
  assert.deepEqual(topics.map(topic => topic.id), [...V3_CUSTOMER_INFORMATION_TOPIC_IDS])
  assert.equal(new Set(topics.map(topic => topic.id)).size, 26)
  assert.ok(topics.every(topic => topic.results.length === 0))
  assert.equal(coverage.hasConfirmedSource, false)
  assert.deepEqual(coverage.unassigned, [])
})

test('visa does not prove ETA, passport, ID substitution, transit, dual-national rules or changes', () => {
  const result = visa(), coverage = v3CustomerInformationCoverage([result])
  const topics = coverage.groups.flatMap(group => group.topics)
  assert.deepEqual(topics.filter(topic => topic.results.length > 0).map(topic => topic.id), ['visa'])
  assert.equal(topics.find(topic => topic.id === 'visa')?.results[0], result)
  assert.equal(coverage.hasConfirmedSource, true)
  assert.deepEqual(coverage.unassigned, [])
  assert.deepEqual(result.conditions, ['Synthetische Direktreise mit Reisepass; mehrere Staatsangehörigkeiten'])
  assert.equal(result.ruleVersion, 9)
})

test('pending, conflict, unavailable and error keep their exact message while every topic stays unavailable', () => {
  for (const status of ['pending', 'conflict', 'unavailable', 'error'] as const) {
    const negative = { status, title: `Synthetisch: ${status}`, message: 'Synthetische Meldung' }
    const coverage = v3CustomerInformationCoverage([negative])
    assert.deepEqual(coverage.unassigned, [negative])
    assert.ok(coverage.groups.flatMap(group => group.topics).every(topic => topic.results.length === 0))
    assert.equal(coverage.hasConfirmedSource, false)
  }
})

test('no classification is inferred from a legacy DTO title or statement text', () => {
  const original = visa()
  const { informationTopic: _topic, ...legacy } = original
  assert.equal(_topic, 'visa')
  const coverage = v3CustomerInformationCoverage([legacy])
  assert.deepEqual(coverage.unassigned, [legacy])
  assert.ok(coverage.groups.flatMap(group => group.topics).every(topic => topic.results.length === 0))
})

test('actual controller expiry removes the only positive topic and its source without a second cached copy', async () => {
  let now = 0, sequence = 0
  const tasks = new Map<number, { due: number; callback: () => void }>()
  const timers: V3VisitorTimers = { now: () => now, after(milliseconds, callback) {
    const id = ++sequence
    tasks.set(id, { due: now + milliseconds, callback })
    return () => { tasks.delete(id) }
  } }
  const input: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
  const view: V3VisitorView = { input, generatedAt, synthetic: true,
    cells: [{ country: 'CH', label: 'Schweiz', results: [{ ...visa(), informationTopic: 'entry_forms', relatedInformationTopics: ['form_costs', 'official_actions'] }] }] }
  const changes: V3VisitorUiState[] = []
  const controller = createV3VisitorController(async () => ({ daten: view, fehler: null }), state => changes.push(state), timers)
  try {
    await controller.submit(input)
    const ready = changes.at(-1)
    if (ready?.phase !== 'ready') assert.fail('Expected an actual ready state')
    const before = v3CustomerInformationCoverage(ready.view.cells[0].results).groups.flatMap(group => group.topics)
    assert.equal(before.find(topic => topic.id === 'entry_forms')?.results.length, 1)
    assert.deepEqual(before.find(topic => topic.id === 'form_costs')?.related, [{ resultIndex: 0, label: 'Einreiseformulare und Formularnamen' }])
    assert.equal(before.find(topic => topic.id === 'official_actions')?.related.length, 1)
    now = 1_000
    for (const [id, task] of [...tasks]) {
      if (task.due <= now) { tasks.delete(id); task.callback() }
    }
    const expired = changes.at(-1)
    if (expired?.phase !== 'ready') assert.fail('Expected the expiry state')
    assert.equal(expired.view.cells[0].results[0].status, 'unavailable')
    const coverage = v3CustomerInformationCoverage(expired.view.cells[0].results)
    assert.ok(coverage.groups.flatMap(group => group.topics).every(topic => topic.results.length === 0))
    assert.ok(coverage.groups.flatMap(group => group.topics).every(topic => topic.related.length === 0))
    assert.equal(coverage.hasConfirmedSource, false)
    assert.match(coverage.unassigned[0].title, /nicht mehr angezeigt/)
  } finally { controller.dispose() }
  assert.equal(tasks.size, 0)
})
