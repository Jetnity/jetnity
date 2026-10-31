import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

import { BUDGET_ATTEMPTS, BUDGET_MS, createAuditRunner, createMonotonicClock, createPassiveReaders, sanitizeStorage } from './audit-policy.mjs'

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

test('missing storage and blank cookie flags stay unknown', () => {
  const measuredZero = sanitizeStorage({ readable: true, storageEntries: 0, cookies: [] })
  assert.equal(measuredZero.cookieCount, 0)
  assert.equal(measuredZero.storageCount, 0)
  assert.equal(measuredZero.cookieFlags.secure, 0)
  assert.equal(measuredZero.cookieFlags.httpOnly, 0)
  assert.equal(measuredZero.cookieFlags.sameSite.absent, 0)
  assert.equal(measuredZero.gap, null)
  const storageGap = sanitizeStorage({ readable: true, cookies: [] })
  assert.equal(storageGap.cookieCount, 0)
  assert.equal(storageGap.storageCount, null)
  assert.equal(storageGap.gaps.storage, 'missing')
  assert.equal(storageGap.gap.includes('storage-unobserved'), true)
  const blank = sanitizeStorage({ readable: true, storageEntries: 2, cookies: [{}] })
  assert.equal(blank.cookieCount, 1)
  assert.equal(blank.storageCount, 2)
  assert.equal(blank.cookieFlags.secure, null)
  assert.equal(blank.cookieFlags.httpOnly, null)
  assert.equal(blank.cookieFlags.sameSite, null)
  assert.equal(blank.gaps.cookieFlags, 'unavailable')
  assert.equal(JSON.stringify(blank).includes('"secure":0'), false)
  assert.equal(JSON.stringify(blank).includes('"absent":1'), false)
  const { runner: audit } = runner()
  audit.recordStorage('parent', { readable: true, storageEntries: 0, cookies: [] }, 'before-start')
  audit.recordStorage('parent', { readable: true, storageEntries: 0, cookies: [] }, 'before-teardown')
  assert.deepEqual(audit.evidence().storage.parent.delta, { cookieCount: 0, storageCount: 0 })
  assert.equal(audit.evidence().storage.parent.gap, null)
})

test('finalization waits for headers, body cancellation, and cleanup', async () => {
  let resolveHeaders
  const hangingHeaders = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() { return new Promise((resolve) => { resolveHeaders = resolve }) },
  })
  hangingHeaders.start(0)
  const headers = hangingHeaders.boundedGet({ url: 'http://127.0.0.1/headers-hang', resourceType: 'document' })
  hangingHeaders.trip('navigation')
  assert.equal((await headers).reason, 'aborted')
  const headerSnap = await hangingHeaders.finalize(20)
  assert.equal(headerSnap.finalized, false)
  assert.equal(headerSnap.incomplete, true)
  assert.equal(headerSnap.ledger.find((row) => row.issued).terminal, 'hanging')
  resolveHeaders({ status: 204, async arrayBuffer() { return new Uint8Array() } })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(hangingHeaders.evidence(), headerSnap)
  assert.equal(headerSnap.finalized, false)
  assert.equal(headerSnap.ledger.find((row) => row.issued).reason, 'abort-requested')

  const hangingBody = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() {
      return { status: 200, arrayBuffer() { return new Promise(() => {}) } }
    },
  })
  hangingBody.start(0)
  const body = hangingBody.boundedGet({ url: 'http://127.0.0.1/body-hang', resourceType: 'document' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  hangingBody.trip('navigation')
  assert.equal((await body).reason, 'aborted')
  const bodySnap = await hangingBody.finalize(20)
  assert.equal(bodySnap.finalized, false)
  assert.equal(bodySnap.incomplete, true)
  assert.notEqual(bodySnap.ledger.find((row) => row.issued).terminal, 'complete')

  let cancelCalls = 0
  const hangingCancel = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() {
      return {
        status: 200,
        body: {
          getReader() {
            return {
              read() { return new Promise(() => {}) },
              cancel() { cancelCalls += 1; return new Promise(() => {}) },
            }
          },
        },
      }
    },
  })
  hangingCancel.start(0)
  const cancelPending = hangingCancel.boundedGet({ url: 'http://127.0.0.1/cancel-hang', resourceType: 'document' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  hangingCancel.trip('navigation')
  assert.equal((await cancelPending).reason, 'aborted')
  const cancelSnap = await hangingCancel.finalize(20)
  assert.equal(cancelCalls, 1)
  assert.equal(cancelSnap.finalized, false)
  assert.equal(cancelSnap.incomplete, true)

  const hangingCleanup = createAuditRunner({
    clock: createMonotonicClock(0),
    cleanup() { return new Promise(() => {}) },
  })
  hangingCleanup.start(0)
  hangingCleanup.trip('navigation')
  const cleanupSnap = await hangingCleanup.finalize(15)
  assert.equal(cleanupSnap.cleanupState, 'incomplete')
  assert.equal(cleanupSnap.incomplete, true)
  assert.equal(cleanupSnap.finalized, false)
})

test('late reader resolution cannot rewrite a published snapshot', async () => {
  const releases = []
  const hang = () => new Promise((resolve) => { releases.push(resolve) })
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: {
      parent: hang,
      host: hang,
      events: hang,
    },
  })
  assert.equal(audit.start(0).startedAt, 0)
  audit.trip('navigation')
  const snap = await audit.finalize(20)
  assert.equal(snap.finalized, false)
  assert.equal(snap.incomplete, true)
  assert.equal(snap.storage.parent.beforeStart.length, 0)
  assert.equal(snap.storage.host.beforeStart.length, 0)
  assert.equal(snap.events.length, 0)
  for (const release of releases) release({ readable: true, storageEntries: 3, cookies: [{ secure: true, httpOnly: true, sameSite: 'Lax' }] })
  releases.at(-1)?.({ name: 'gtm.js', payload: SECRET })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(audit.evidence(), snap)
  assert.equal(snap.storage.parent.beforeStart.length + snap.storage.parent.beforeTeardown.length, 0)
  assert.equal(snap.events.length, 0)
  assert.equal(snap.finalized, false)
  assert.equal(JSON.stringify(snap).includes(SECRET), false)
})

test('baseline capture does not move or extend the 15 second deadline', async () => {
  let release
  let fetches = 0
  const clock = createMonotonicClock(0)
  const audit = createAuditRunner({
    clock,
    readers: { parent: () => new Promise((resolve) => { release = resolve }) },
    fetchImpl() {
      fetches += 1
      return { status: 204, async arrayBuffer() { return new Uint8Array() } }
    },
  })
  assert.equal(audit.start(0).startedAt, 0)
  const pending = audit.boundedGet({ url: 'http://127.0.0.1/after-baseline', resourceType: 'document' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(fetches, 0)
  clock.advance(1000)
  assert.equal(audit.startedAt, 0)
  assert.equal(fetches, 0)
  release({ readable: true, storageEntries: 0, cookies: [] })
  const result = await pending
  assert.equal(fetches, 1)
  assert.equal(result.reason, 'local-response')
  assert.equal(audit.startedAt, 0)

  let lateFetches = 0
  const closed = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: { parent: () => new Promise(() => {}) },
    fetchImpl() { lateFetches += 1; return { status: 204, async arrayBuffer() { return new Uint8Array() } } },
  })
  closed.start(0)
  const blocked = closed.boundedGet({ url: 'http://127.0.0.1/baseline-closed', resourceType: 'document' })
  closed.advance(BUDGET_MS)
  const late = await blocked
  assert.equal(lateFetches, 0)
  assert.equal(late.issued, false)
  assert.equal(late.reason, 'DEADLINE')
  assert.equal(closed.startedAt, 0)
})

test('prepared frame readers capture fake surfaces and stay free of identifiers', async () => {
  const secret = 'frame-cookie-secret'
  const name = 'frame-cookie-name'
  let cookiesPromise
  const parent = {
    cookies() {
      if (!cookiesPromise) cookiesPromise = Promise.resolve([{ name, value: secret, domain: 'example.test', secure: true, httpOnly: false, sameSite: 'Lax' }])
      return cookiesPromise
    },
    evaluate(fn) {
      const previous = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, dataLayer: globalThis.dataLayer }
      const layer = [{ event: 'metaData', payload: secret }]
      const push = layer.push
      globalThis.localStorage = { length: 2 }
      globalThis.sessionStorage = { length: 0 }
      globalThis.dataLayer = layer
      return Promise.resolve().then(() => {
        const probe = fn()
        assert.equal(layer.push, push)
        return probe
      }).finally(() => {
        globalThis.localStorage = previous.localStorage
        globalThis.sessionStorage = previous.sessionStorage
        globalThis.dataLayer = previous.dataLayer
      })
    },
  }
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: createPassiveReaders({ parent, host: null, vendor: null }),
  })
  audit.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  const snap = await audit.finalize(30)
  const text = JSON.stringify(snap)
  assert.equal(text.includes(secret), false)
  assert.equal(text.includes(name), false)
  assert.equal(text.includes('example.test'), false)
  assert.equal(snap.finalized, true)
  assert.equal(snap.incomplete, false)
  assert.equal(snap.storage.parent.beforeStart[0].storageCount, 2)
  assert.equal(snap.storage.parent.beforeStart[0].cookieCount, 1)
  assert.equal(snap.storage.parent.beforeStart[0].cookieFlags.secure, 1)
  assert.equal(snap.storage.parent.beforeStart[0].cookieFlags.httpOnly, 0)
  assert.equal(snap.events.some((row) => row.events.some((item) => item.name === 'metaData' && !Object.hasOwn(item, 'payload'))), true)
  assert.equal(snap.storage.host.gap, 'unreadable')
  assert.equal(snap.storage.vendor.gap, 'vendor-frame-absent')
  assert.equal(snap.gaps.includes('vendor-frame-absent'), true)
})

test('a final-reader timeout still cleans up once and the published report stays fixed', async () => {
  let releaseFinal
  let cleanupCalls = 0
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: {
      parent(phase) {
        if (phase === 'before-start') return { readable: true, storageEntries: 1, cookies: [] }
        return new Promise((resolve) => { releaseFinal = resolve })
      },
    },
    cleanup() { cleanupCalls += 1 },
  })
  audit.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  assert.equal(cleanupCalls, 0)
  const snap = await audit.finalize(20)
  assert.equal(cleanupCalls, 1)
  assert.equal(snap.finalState, 'unavailable')
  assert.equal(snap.finalized, false)
  assert.equal(snap.incomplete, true)
  assert.equal(snap.cleanupCount, 1)
  releaseFinal({ readable: true, storageEntries: 4, cookies: [] })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(cleanupCalls, 1)
  assert.equal(audit.evidence(), snap)
  assert.equal(snap.storage.parent.beforeTeardown.length, 0)
})

test('async cleanup started after the final reader stays inside the bounded chain', async () => {
  let releaseFinal
  let releaseCleanup
  let cleanupCalls = 0
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: {
      parent(phase) {
        if (phase === 'before-start') return { readable: true, storageEntries: 0, cookies: [] }
        return new Promise((resolve) => { releaseFinal = resolve })
      },
    },
    cleanup() {
      cleanupCalls += 1
      return new Promise((resolve) => { releaseCleanup = resolve })
    },
  })
  audit.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  const pending = audit.finalize(200)
  let finished = false
  pending.then(() => { finished = true })
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(cleanupCalls, 0)
  releaseFinal({ readable: true, storageEntries: 0, cookies: [] })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(cleanupCalls, 1)
  assert.equal(finished, false)
  assert.equal(audit.evidence().cleanupState, 'pending')
  releaseCleanup()
  const snap = await pending
  assert.equal(finished, true)
  assert.equal(snap.cleanupCount, 1)
  assert.equal(snap.cleanupState, 'complete')
  assert.equal(snap.finalized, true)
  assert.equal(snap.incomplete, false)
  assert.equal(cleanupCalls, 1)
})

test('a rejected locked-stream cancel does not hide a pending reader cancel', async () => {
  const stream = new ReadableStream({
    cancel() { return new Promise(() => {}) },
  })
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    fetchImpl() { return { status: 200, body: stream } },
  })
  audit.start(0)
  const pending = audit.boundedGet({ url: 'http://127.0.0.1/locked-stream', resourceType: 'document' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  assert.equal((await pending).reason, 'aborted')
  const snap = await audit.finalize(20)
  assert.equal(snap.finalized, false)
  assert.equal(snap.incomplete, true)
  assert.notEqual(snap.ledger.find((row) => row.issued).terminal, 'complete')
})

test('shared context cookies stay on the verified role url', async () => {
  const jar = [
    { domain: 'parent.example', path: '/', secure: true, httpOnly: true, sameSite: 'Lax', name: 'parent-id', value: 'parent-secret' },
    { domain: 'host.example', path: '/', secure: false, httpOnly: false, sameSite: 'Lax', name: 'host-id', value: 'host-secret' },
    { domain: 'vendor.example', path: '/', secure: true, httpOnly: true, sameSite: 'Strict', name: 'vendor-id', value: 'vendor-secret' },
  ]
  const context = { cookies() { return Promise.resolve(jar.map((cookie) => ({ ...cookie }))) } }
  const surface = (origin) => ({
    context,
    url: () => origin,
    evaluate(fn) {
      const previous = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, dataLayer: globalThis.dataLayer }
      globalThis.localStorage = { length: 0 }
      globalThis.sessionStorage = { length: 0 }
      globalThis.dataLayer = []
      return Promise.resolve().then(() => fn()).finally(() => {
        globalThis.localStorage = previous.localStorage
        globalThis.sessionStorage = previous.sessionStorage
        globalThis.dataLayer = previous.dataLayer
      })
    },
  })
  const scoped = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: createPassiveReaders({
      parent: surface('https://parent.example/home'),
      host: surface('https://host.example/embed'),
      vendor: surface('https://vendor.example/widget'),
    }),
  })
  scoped.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  scoped.trip('navigation')
  const snap = await scoped.finalize(30)
  assert.equal(snap.storage.parent.beforeStart[0].cookieCount, 1)
  assert.equal(snap.storage.host.beforeStart[0].cookieCount, 1)
  assert.equal(snap.storage.vendor.beforeStart[0].cookieCount, 1)
  assert.equal(snap.storage.parent.beforeStart[0].gap, null)
  const text = JSON.stringify(snap)
  assert.equal(text.includes('parent-secret'), false)
  assert.equal(text.includes('parent.example'), false)
  assert.equal(text.includes('parent-id'), false)

  const unscoped = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: createPassiveReaders({
      parent: { context, evaluate: surface('https://parent.example/').evaluate },
      host: null,
      vendor: null,
    }),
  })
  unscoped.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  unscoped.trip('navigation')
  const unknown = await unscoped.finalize(30)
  assert.equal(unknown.storage.parent.beforeStart[0].cookieCount, null)
  assert.equal(unknown.storage.parent.beforeStart[0].gaps.cookies, 'missing')
  assert.notEqual(unknown.storage.parent.beforeStart[0].cookieCount, 0)
  assert.notEqual(unknown.storage.parent.beforeStart[0].cookieCount, 3)
})

test('partial event gaps and observed dataLayer loss stay visible', async () => {
  let reads = 0
  const push = function push() {}
  const parent = {
    url: () => 'https://parent.example/',
    cookies: () => Promise.resolve([]),
    evaluate(fn) {
      reads += 1
      const previous = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, dataLayer: globalThis.dataLayer }
      const layer = reads === 1
        ? [{ event: 'gtm.js', payload: 'secret-payload' }, { event: 'private-event', payload: 'secret-payload' }]
        : [{ event: 'gtm.js', payload: 'secret-payload' }]
      layer.push = push
      globalThis.localStorage = { length: 0 }
      globalThis.sessionStorage = { length: 0 }
      globalThis.dataLayer = layer
      try {
        const probe = fn()
        assert.equal(layer.push, push)
        return Promise.resolve(probe)
      } finally {
        globalThis.localStorage = previous.localStorage
        globalThis.sessionStorage = previous.sessionStorage
        globalThis.dataLayer = previous.dataLayer
      }
    },
  }
  const empty = {
    url: () => 'https://host.example/',
    cookies: () => Promise.resolve([]),
    evaluate(fn) {
      const previous = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, dataLayer: globalThis.dataLayer }
      globalThis.localStorage = { length: 0 }
      globalThis.sessionStorage = { length: 0 }
      globalThis.dataLayer = []
      try { return Promise.resolve(fn()) } finally {
        globalThis.localStorage = previous.localStorage
        globalThis.sessionStorage = previous.sessionStorage
        globalThis.dataLayer = previous.dataLayer
      }
    },
  }
  const vendor = {
    url: () => 'https://vendor.example/',
    cookies: () => Promise.resolve([]),
    evaluate() { return Promise.reject(new Error('vendor frame unreadable')) },
  }
  const audit = createAuditRunner({
    clock: createMonotonicClock(0),
    readers: createPassiveReaders({ parent, host: empty, vendor }),
  })
  audit.start(0)
  await new Promise((resolve) => setTimeout(resolve, 0))
  audit.trip('navigation')
  const snap = await audit.finalize(30)
  const baseline = snap.events.find((row) => row.phase === 'before-start')
  const finalRow = snap.events.find((row) => row.phase === 'before-teardown')
  assert.equal(baseline.roles.vendor.gap, 'unreadable')
  assert.equal(baseline.roles.parent.gap, null)
  assert.equal(baseline.roles.host.count, 0)
  assert.equal(baseline.gap, 'partial-unreadable')
  assert.notEqual(baseline.gap, null)
  assert.equal(finalRow.pruning.lost.parent, 1)
  assert.equal(finalRow.gap.includes('pruned'), true)
  assert.equal(baseline.events.some((item) => item.name === 'gtm.js'), true)
  assert.equal(baseline.events.some((item) => item.name === 'other'), true)
  assert.equal(finalRow.events.some((item) => item.name === 'gtm.js'), true)
  assert.equal(finalRow.events.some((item) => item.name === 'other'), false)
  assert.equal(JSON.stringify(snap).includes('secret-payload'), false)
  assert.equal(JSON.stringify(snap).includes('private-event'), false)
})
