import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

import { BUDGET_ATTEMPTS, BUDGET_MS, createAuditRunner, createMonotonicClock } from './audit-policy.mjs'

const LOADER = 'https://www.discovercars.com/widget.js?v1'
const SECRET = 'visitor_abc123'

function runner(options = {}) {
  const clock = options.clock || createMonotonicClock(0)
  const cleanups = []
  const created = createAuditRunner({
    clock,
    fetchImpl: options.fetchImpl,
    readers: options.readers,
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
  audit.start(1000)
  assert.equal(audit.evidence().ledger[0].offsetMs, -1000)
  const posted = await audit.boundedGet({ url: LOADER, method: 'POST', resourceType: 'script' })
  assert.equal(posted.reason, 'method')
  assert.equal(posted.issued, false)
  assert.equal(audit.evidence().ledger.find((row) => row.sequence === posted.sequence).offsetMs, 0)
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

test('the default platform timer expires without advance or another request', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  try {
    let signal = null
    const audit = createAuditRunner({
      fetchImpl(_url, init) {
        signal = init.signal
        return new Promise(() => {})
      },
    })
    assert.equal(audit.start().ok, true)
    const pending = audit.boundedGet({ url: 'http://127.0.0.1/platform', resourceType: 'document' })
    assert.equal(audit.evidence().tornDown, false)
    mock.timers.tick(15001)
    const result = await pending
    const evidence = audit.evidence()
    assert.equal(evidence.tornDown, true)
    assert.equal(evidence.teardownReason, 'DEADLINE')
    assert.equal(evidence.pendingAborted, true)
    assert.equal(evidence.cleanupCount, 1)
    assert.equal(signal.aborted, true)
    assert.equal(result.reason, 'aborted')
    assert.equal(result.issued, true)
  } finally {
    mock.timers.reset()
  }
})

test('unreadable and missing storage samples do not become zero deletions', () => {
  const { runner: audit } = runner({
    readers: {
      parent(phase) {
        if (phase === 'before-start') {
          return { readable: true, storageEntries: 4, cookies: [{ secure: true, httpOnly: true, sameSite: 'Lax' }] }
        }
        return { readable: false }
      },
      host(phase) {
        if (phase === 'before-start') return { readable: true, storageEntries: 2, cookies: [{ secure: false, sameSite: 'None' }] }
        return null
      },
      vendor() { return { readable: false } },
      events(phase) {
        if (phase === 'before-start') return [{ name: 'consent_changed', payload: SECRET }]
        return null
      },
    },
  })
  audit.start(0)
  audit.trip('navigation')
  const evidence = audit.evidence()
  const parent = evidence.storage.parent
  assert.equal(parent.beforeStart[0].cookieCount, 1)
  assert.equal(parent.beforeStart[0].storageCount, 4)
  assert.equal(parent.beforeTeardown[0].cookieCount, null)
  assert.equal(parent.beforeTeardown[0].cookieFlags, null)
  assert.equal(parent.beforeTeardown[0].gap, 'unreadable')
  assert.equal(parent.delta, null)
  assert.equal(parent.gap, 'unreadable')
  assert.equal(evidence.storage.host.gap, 'missing-final')
  assert.equal(evidence.storage.host.delta, null)
  assert.equal(evidence.storage.host.phaseGaps.final, 'missing')
  assert.equal(evidence.storage.vendor.gap, 'unreadable')
  assert.equal(evidence.events.some((row) => row.phase === 'before-start' && row.events[0].name === 'consent_changed'), true)
  assert.equal(evidence.events.some((row) => row.phase === 'before-teardown' && row.gap === 'unreadable-frame'), true)
  assert.equal(JSON.stringify(evidence).includes(SECRET), false)
})

test('deferred cleanup and a late body stay incomplete until finalization', async () => {
  let releaseCleanup
  let resolveFetch
  let cancelCount = 0
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    cleanup() { return new Promise((resolve) => { releaseCleanup = resolve }) },
    fetchImpl() {
      return new Promise((resolve) => { resolveFetch = resolve })
    },
  })
  audit.start(0)
  const pending = audit.boundedGet({ url: 'http://127.0.0.1/late-body', resourceType: 'document' })
  audit.trip('navigation')
  const early = audit.evidence()
  assert.equal(early.tornDown, true)
  assert.equal(early.cleanupState, 'pending')
  assert.equal(early.cleanupCount, 0)
  assert.equal(early.finalized, false)
  const result = await pending
  assert.equal(result.reason, 'aborted')
  resolveFetch({
    status: 200,
    body: { cancel() { cancelCount += 1; return Promise.resolve() } },
    async arrayBuffer() { return new Uint8Array() },
  })
  await Promise.resolve()
  assert.equal(cancelCount, 1)
  releaseCleanup()
  const finalEvidence = await audit.finalize(20)
  assert.equal(finalEvidence.cleanupState, 'complete')
  assert.equal(finalEvidence.cleanupCount, 1)
  assert.equal(finalEvidence.finalized, true)
  assert.notEqual(result.reason, 'local-response')
})

test('synchronous transport and body failures are recorded instead of escaping', async () => {
  const syncFetch = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() { throw new Error('sync-fetch') },
  })
  syncFetch.start(0)
  const fetchFailure = await syncFetch.boundedGet({ url: 'http://127.0.0.1/sync', resourceType: 'document' })
  assert.equal(fetchFailure.reason, 'error')
  assert.equal(fetchFailure.terminal, 'error')
  assert.equal(syncFetch.evidence().ledger.find((row) => row.sequence === fetchFailure.sequence).terminal, 'error')

  const syncBody = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() {
      return {
        status: 200,
        arrayBuffer() { throw new Error('sync-body') },
      }
    },
  })
  syncBody.start(0)
  const bodyFailure = await syncBody.boundedGet({ url: 'http://127.0.0.1/sync-body', resourceType: 'document' })
  assert.equal(bodyFailure.reason, 'error')
  assert.equal(bodyFailure.terminal, 'error')
})
