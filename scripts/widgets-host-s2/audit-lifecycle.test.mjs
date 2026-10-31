import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BUDGET_ATTEMPTS, BUDGET_MS, createAuditRunner, createMonotonicClock } from './audit-policy.mjs'

const LOADER = 'https://www.discovercars.com/widget.js?v1'
const SECRET = 'visitor_abc123'

function runner(options = {}) {
  const clock = options.clock || createMonotonicClock(0)
  const cleanups = []
  const created = createAuditRunner({
    clock,
    fetchImpl: options.fetchImpl,
    cleanup(reason) { cleanups.push(reason) },
  })
  return { clock, cleanups, runner: created }
}

test('deadline expires without another request and aborts pending work once', async () => {
  let signal = null
  const { clock, cleanups, runner: audit } = runner({
    fetchImpl(_url, init) {
      signal = init.signal
      return new Promise(() => {})
    },
  })
  assert.equal(audit.start(0).ok, true)
  const pending = audit.boundedGet({ url: 'http://127.0.0.1/headers', resourceType: 'document' })
  clock.advance(BUDGET_MS)
  const result = await pending
  const evidence = audit.evidence()
  assert.equal(evidence.tornDown, true)
  assert.equal(evidence.teardownReason, 'DEADLINE')
  assert.equal(evidence.pendingAborted, true)
  assert.equal(evidence.cleanupCount, 1)
  assert.deepEqual(cleanups, ['DEADLINE'])
  assert.equal(signal.aborted, true)
  assert.equal(result.issued, true)
  assert.equal(result.reason, 'aborted')
  assert.notEqual(result.reason, 'local-response')
  clock.advance(BUDGET_MS + 1)
  assert.equal(audit.evidence().cleanupCount, 1)
})

test('body teardown aborts the signal and does not return a successful body', async () => {
  let signal = null
  let releaseHeaders
  const { runner: audit } = runner({
    fetchImpl(_url, init) {
      signal = init.signal
      return new Promise((resolve) => {
        releaseHeaders = () => resolve({
          status: 200,
          body: {
            getReader() {
              return {
                read() { return new Promise(() => {}) },
                cancel() { return Promise.resolve() },
              }
            },
          },
        })
      })
    },
  })
  audit.start(0)
  const pending = audit.boundedGet({ url: 'http://127.0.0.1/body', resourceType: 'document' })
  releaseHeaders()
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  const result = await pending
  assert.equal(signal.aborted, true)
  assert.equal(result.reason, 'aborted')
  assert.equal(result.issued, true)
  assert.notEqual(result.reason, 'local-response')
  assert.equal(audit.evidence().pendingAborted, true)
  assert.equal(audit.evidence().tornDown, true)
  assert.equal(audit.evidence().cleanupCount, 1)
})

test('a transport that ignores cancellation still cannot finish after closure', async () => {
  let signal = null
  const { runner: audit } = runner({
    fetchImpl(_url, init) {
      signal = init.signal
      return new Promise((resolve) => {
        audit.trip('submission')
        resolve({
          status: 200,
          async arrayBuffer() { return new Uint8Array([1]) },
        })
      })
    },
  })
  audit.start(0)
  const result = await audit.boundedGet({ url: 'http://127.0.0.1/ignore', resourceType: 'document' })
  assert.equal(signal.aborted, true)
  assert.equal(result.issued, true)
  assert.equal(result.reason, 'aborted')
  assert.notEqual(result.reason, 'local-response')
  const before = audit.evidence().observed
  const late = await audit.boundedGet({ url: 'http://127.0.0.1/after', resourceType: 'document' })
  assert.equal(late.late, true)
  assert.equal(late.issued, false)
  assert.equal(audit.evidence().observed, before + 1)
  assert.equal(audit.evidence().lateAttempts >= 1, true)
})

test('pre-start, non-GET, attempt 100 and late attempts stay in the ledger', async () => {
  const fetches = []
  const { runner: audit } = runner({
    fetchImpl(url) {
      fetches.push(String(url))
      throw new Error('should not fetch')
    },
  })
  const pre = await audit.boundedGet({ url: LOADER, method: 'POST', resourceType: 'script', phase: 'before-start' })
  assert.equal(pre.reason, 'not-started')
  assert.equal(audit.evidence().ledger[0].method, 'POST')
  assert.equal(audit.evidence().ledger[0].phase, 'before-start')
  audit.start(0)
  const posted = await audit.boundedGet({ url: LOADER, method: 'POST', resourceType: 'script' })
  assert.equal(posted.reason, 'method')
  assert.equal(posted.issued, false)
  for (let index = 0; index < 97; index += 1) {
    const row = await audit.boundedGet({ url: LOADER, resourceType: 'script' })
    assert.equal(row.reason, 'provider-closed')
  }
  const hundredth = await audit.boundedGet({ url: 'http://127.0.0.1/budget', resourceType: 'document' })
  assert.equal(hundredth.sequence, BUDGET_ATTEMPTS)
  assert.equal(hundredth.reason, 'BUDGET_REACHED')
  assert.equal(hundredth.late, false)
  assert.equal(hundredth.issued, false)
  const next = await audit.boundedGet({ url: 'http://127.0.0.1/late', resourceType: 'document' })
  assert.equal(next.sequence, BUDGET_ATTEMPTS + 1)
  assert.equal(next.late, true)
  assert.equal(next.reason, 'BUDGET_REACHED')
  const evidence = audit.evidence()
  assert.equal(evidence.observed, 101)
  assert.equal(evidence.lateAttempts, 1)
  assert.equal(evidence.trimmed, false)
  assert.equal(fetches.length, 0)
  assert.equal(JSON.stringify(evidence).includes('discovercars.com'), false)
})

test('storage samples keep the baseline and cookie flags without names or values', () => {
  const { runner: audit } = runner()
  audit.recordStorage('parent', {
    readable: true,
    storageEntries: 1,
    cookies: [{ name: SECRET, value: 'secret-value', secure: true, httpOnly: true, sameSite: 'Lax' }],
  }, 'before-start')
  audit.recordStorage('parent', {
    readable: true,
    storageEntries: 4,
    cookies: [
      { name: 'other-name', value: 'other-value', secure: true, httpOnly: false, sameSite: 'Strict' },
      { name: 'third', value: 'third-value', secure: false, sameSite: 'None' },
    ],
  }, 'before-teardown')
  audit.recordEvents([{ name: 'gtm.js', payload: SECRET }, { name: SECRET }], { phase: 'before-teardown' })
  audit.recordEvents([], { unreadable: true, phase: 'before-teardown' })
  const evidence = audit.evidence()
  const parent = evidence.storage.parent
  assert.equal(parent.beforeStart.length, 1)
  assert.equal(parent.beforeStart[0].cookieCount, 1)
  assert.equal(parent.beforeStart[0].storageCount, 1)
  assert.equal(parent.beforeStart[0].cookieFlags.secure, 1)
  assert.equal(parent.beforeStart[0].cookieFlags.httpOnly, 1)
  assert.equal(parent.beforeTeardown[0].cookieCount, 2)
  assert.equal(parent.beforeTeardown[0].storageCount, 4)
  assert.deepEqual(parent.delta, { cookieCount: 1, storageCount: 3 })
  assert.equal(evidence.storage.host.gap, 'not-observed')
  assert.equal(evidence.storage.vendor.gap, 'not-observed')
  assert.equal(evidence.events[0].events[0].name, 'gtm.js')
  assert.equal(evidence.events[0].events[1].name, 'other')
  assert.equal(evidence.events[1].gap, 'unreadable-frame')
  const text = JSON.stringify(evidence)
  assert.equal(text.includes(SECRET), false)
  assert.equal(text.includes('secret-value'), false)
  assert.equal(text.includes('other-name'), false)
  assert.equal(evidence.cleanupCount, 0)
  audit.trip('popup')
  const after = audit.evidence()
  assert.equal(after.tornDown, true)
  assert.equal(after.teardownReason, 'popup')
  assert.equal(after.cleanupCount, 1)
  assert.equal(after.storage.parent.beforeStart[0].cookieCount, 1)
})
