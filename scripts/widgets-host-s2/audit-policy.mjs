import { createHash } from 'node:crypto'

import nestedContract from './nested-static-url-derivation.json' with { type: 'json' }

export const BUDGET_MS = 15000
export const BUDGET_ATTEMPTS = 100
export const EVENT_WHITELIST = Object.freeze(['gtm.js', 'metaData', 'consent_changed'])

export const PUBLISHED_CAPTURES = Object.freeze({
  loader: Object.freeze({ sha256: '9198baa5b50ab50aaeee81b90764e1a1c3e621a30b5957d0d7ae88be05a6a186', bytes: 12299 }),
  nestedDocument: Object.freeze({ sha256: 'cb0cc414fbbdd32be15f0daa18b13d4b7df022417b6ab62e78564825dac27f3d', bytes: 146805 }),
  gateway: Object.freeze({ sha256: '14b5a4984fd3253f7e35a6a256d7b1c756ae3b1c14a836b4bb44263c902f6808', bytes: 701252 }),
})

export const TRANSPORT_CLASSES = Object.freeze([
  Object.freeze({ class: 'http', method: 'playwright-context-route-abort-before-continue' }),
  Object.freeze({ class: 'beacon', method: 'playwright-context-route-abort-before-continue' }),
  Object.freeze({ class: 'eventsource', method: 'playwright-context-route-abort-before-continue' }),
  Object.freeze({ class: 'websocket', method: 'playwright-routeWebSocket-without-connectToServer' }),
  Object.freeze({ class: 'webrtc', method: null }),
])

const NESTED_PAIRS = nestedContract.pairs.map((pair) => Object.freeze([...pair]))

function decodeForm(value) {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, ' '))
  } catch {
    return null
  }
}

function pairsEqual(left, right) {
  if (left.length !== right.length) return false
  return left.every((pair, index) => pair[0] === right[index][0] && Object.is(pair[1], right[index][1]))
}

function exactRule(role, resourceType, href, pairs, limit = null) {
  const url = new URL(href)
  const rule = Object.freeze({
    role,
    resourceType,
    protocol: url.protocol,
    hostname: url.hostname,
    pathname: url.pathname,
    pairs: Object.freeze(pairs.map((pair) => Object.freeze([...pair]))),
    limit,
  })
  if ([rule.hostname, rule.pathname, rule.protocol].some((field) => field.includes('*'))) {
    throw new Error('audit rule contains a wildcard')
  }
  return rule
}

function flag(name) {
  return Object.freeze([name, null])
}

function pair(name, value) {
  return Object.freeze([name, value])
}

const RULES = Object.freeze([
  exactRule('loader', 'script', 'https://www.discovercars.com/widget.js?v1', [flag('v1')]),
  exactRule('nested-document', 'document', nestedContract.href, NESTED_PAIRS),
  exactRule('vendor-bundle', 'script', 'https://widget.discovercars.com/assets/widget/js/vendor/bundle.min.js?v=1.0.4611', [pair('v', '1.0.4611')]),
  exactRule('typeahead', 'script', 'https://widget.discovercars.com/assets/vendor/js/typeahead.bundle.min.js?v=1.0.4611', [pair('v', '1.0.4611')]),
  exactRule('autocomplete', 'script', 'https://widget.discovercars.com/assets/widget/js/app/autocomplete.js?v=1.0.4611', [pair('v', '1.0.4611')]),
  exactRule('gateway', 'script', 'https://widget.discovercars.com/gtmgtg/', []),
  exactRule('health', 'script', 'https://www.googletagmanager.com/gtm.js?id=GTM-TRL7LT&gtg_health=1', [pair('id', 'GTM-TRL7LT'), pair('gtg_health', '1')], 1),
  ...[
    '/assets/common/img/svg/icons/widget-checkmark.svg',
    '/assets/common/img/logos/discovercars.svg',
    '/assets/common/img/svg/icons/widget-search.svg',
    '/assets/mobile/img/svg/checkbox.svg',
    '/assets/common/img/svg/icons/widget-pickup.svg',
    '/assets/common/img/svg/icons/widget-dropoff.svg',
    '/assets/common/img/svg/icons/widget-down-arrow.svg',
  ].map((pathname, index) => exactRule(`image-${index + 1}`, 'image', `https://widget.discovercars.com${pathname}`, [])),
  exactRule('font-roboto-400', 'font', 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2', []),
  exactRule('font-roboto-700', 'font', 'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfBBc4.woff2', []),
])

function parseTarget(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.username || url.password || url.hash) return null
  if (url.protocol !== 'https:') return null
  if (url.port !== '' && url.port !== '443') return null
  const pairs = []
  const search = url.search.startsWith('?') ? url.search.slice(1) : ''
  if (search !== '') {
    for (const part of search.split('&')) {
      if (part === '') return null
      const eq = part.indexOf('=')
      const rawKey = eq === -1 ? part : part.slice(0, eq)
      const key = decodeForm(rawKey)
      if (key === null || key === '') return null
      let decoded = null
      if (eq !== -1) {
        decoded = decodeForm(part.slice(eq + 1))
        if (decoded === null) return null
      }
      pairs.push([key, decoded])
    }
  }
  const keys = pairs.map((item) => item[0])
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    pathname: url.pathname,
    pairs,
    duplicate: new Set(keys).size !== keys.length,
  }
}

function failureReason(parsed, resourceType) {
  const samePath = RULES.filter((rule) => rule.protocol === parsed.protocol && rule.hostname === parsed.hostname && rule.pathname === parsed.pathname)
  if (samePath.length === 0) {
    return RULES.some((rule) => rule.hostname === parsed.hostname) ? 'route' : 'unmatched'
  }
  if (parsed.duplicate) return 'query'
  if (samePath.some((rule) => pairsEqual(rule.pairs, parsed.pairs) && rule.resourceType !== resourceType)) return 'resource-type'
  return 'query'
}

const PUBLIC_QUERY_NAMES = new Set(RULES.flatMap((rule) => rule.pairs.map((item) => item[0])))

export function exportQueryKeys(keys) {
  const queryKeys = []
  let unknownQueryKeys = 0
  for (const key of keys || []) {
    if (PUBLIC_QUERY_NAMES.has(key)) queryKeys.push(key)
    else unknownQueryKeys += 1
  }
  return { queryKeys, unknownQueryKeys }
}

export function inspectTarget(url, method, resourceType) {
  const parsed = parseTarget(url)
  if (!parsed) return { ok: false, reason: 'route', queryKeys: [], role: null }
  const queryKeys = parsed.pairs.map((item) => item[0])
  if (method !== 'GET') return { ok: false, reason: 'method', queryKeys, role: null }
  if (parsed.duplicate) return { ok: false, reason: 'query', queryKeys, role: null }
  const rule = RULES.find((item) => item.protocol === parsed.protocol
    && item.hostname === parsed.hostname
    && item.pathname === parsed.pathname
    && item.resourceType === resourceType
    && pairsEqual(item.pairs, parsed.pairs))
  if (!rule) return { ok: false, reason: failureReason(parsed, resourceType), queryKeys, role: null }
  return { ok: true, reason: 'match', queryKeys, role: rule.role, limit: rule.limit }
}

export function compareReference(bytes, reference) {
  const digest = createHash('sha256').update(bytes).digest('hex')
  const match = digest === reference.sha256 && bytes.length === reference.bytes
  if (!match) return { match: false, disposition: 'SOURCE_DRIFT', executed: false, referenceSha256: reference.sha256 }
  return { match: true, disposition: 'MATCH', executed: false, referenceSha256: reference.sha256 }
}

export function assessPublishedCapture(kind, bytes) {
  const reference = PUBLISHED_CAPTURES[kind]
  if (!reference) return { match: false, disposition: 'SOURCE_DRIFT', executed: false }
  return compareReference(bytes, reference)
}

export function sanitizeStorage(snapshot) {
  if (!snapshot || snapshot.readable !== true || snapshot.unreadable === true) {
    return {
      readable: false,
      blocked: true,
      observed: false,
      cookieCount: null,
      storageCount: null,
      cookieFlags: null,
      gap: 'unreadable',
    }
  }
  const cookiesKnown = Array.isArray(snapshot.cookies)
  const entriesKnown = Number.isInteger(snapshot.storageEntries)
  const flags = { secure: 0, httpOnly: 0, sameSite: { Lax: 0, Strict: 0, None: 0, absent: 0 } }
  if (cookiesKnown) {
    for (const cookie of snapshot.cookies) {
      if (cookie && cookie.secure === true) flags.secure += 1
      if (cookie && cookie.httpOnly === true) flags.httpOnly += 1
      const site = cookie && cookie.sameSite
      if (site === 'Lax' || site === 'Strict' || site === 'None') flags.sameSite[site] += 1
      else flags.sameSite.absent += 1
    }
  }
  return {
    readable: true,
    blocked: false,
    observed: true,
    cookieCount: cookiesKnown ? snapshot.cookies.length : null,
    storageCount: entriesKnown ? snapshot.storageEntries : null,
    cookieFlags: cookiesKnown ? flags : null,
    gap: cookiesKnown ? null : 'cookie-flags-unavailable',
  }
}

export function sanitizeEvents(events, options = {}) {
  if (options.unreadable === true) return { gap: 'unreadable-frame', events: [] }
  const known = []
  let other = 0
  for (const event of events || []) {
    const name = event && event.name
    if (EVENT_WHITELIST.includes(name)) known.push({ name })
    else other += 1
  }
  const rows = [...known]
  if (other > 0) rows.push({ name: 'other', count: other })
  return { gap: null, events: rows }
}

export function createAuditGate(options) {
  const startedAt = options.startedAt
  const deadlineAt = startedAt + BUDGET_MS
  const mode = options.mode === 'phase-a' ? 'phase-a' : 'closed'
  const ledger = []
  let closedReason = null
  let deadlineExceeded = false
  let budgetReached = false
  const roleGrants = new Map()
  let retryScheduled = 0

  function observe(input) {
    const sequence = ledger.length + 1
    const alreadyClosed = closedReason !== null
    const clockBad = !Number.isFinite(input.now) || input.now < startedAt
    const pastDeadline = !clockBad && input.now >= deadlineAt
    const budgetHit = sequence >= BUDGET_ATTEMPTS
    const inspection = input.localFulfill === true
      ? { ok: true, role: input.localRole || 'local-host', queryKeys: [] }
      : inspectTarget(input.url, input.method, input.resourceType)
    let reason = 'unmatched'
    let terminal = 'blocked'
    if (clockBad) reason = 'clock'
    else if (alreadyClosed) reason = closedReason
    else if (pastDeadline) {
      deadlineExceeded = true
      closedReason = 'DEADLINE'
      reason = 'DEADLINE'
    } else if (budgetHit) {
      budgetReached = true
      closedReason = 'BUDGET_REACHED'
      reason = 'BUDGET_REACHED'
    } else if (Number.isInteger(input.upstreamStatus) && input.upstreamStatus >= 300 && input.upstreamStatus < 400) {
      reason = 'BLOCKED_REDIRECT'
      terminal = 'blocked-redirect'
    } else if (input.localFulfill === true) {
      reason = 'local'
      terminal = 'local-fulfill'
    } else if (input.method !== 'GET') reason = 'method'
    else if (!inspection.ok) reason = inspection.reason || 'unmatched'
    else if (Number.isInteger(inspection.limit) && (roleGrants.get(inspection.role) || 0) >= inspection.limit) {
      reason = inspection.role === 'health' ? 'health-repeat' : 'repeat'
    } else if (mode !== 'phase-a') reason = 'mode'
    else {
      if (Number.isInteger(inspection.limit)) roleGrants.set(inspection.role, (roleGrants.get(inspection.role) || 0) + 1)
      reason = 'withheld'
      terminal = 'WITHHELD_NO_GET'
    }
    const exported = exportQueryKeys(inspection.queryKeys || [])
    const row = {
      sequence,
      offsetMs: clockBad ? null : input.now - startedAt,
      phase: typeof input.phase === 'string' ? input.phase : 'initial-load',
      contextRole: input.contextRole || 'fixture',
      method: input.method || '',
      resourceType: input.resourceType || '',
      endpoint: inspection.role || 'unlisted',
      queryKeys: exported.queryKeys,
      unknownQueryKeys: exported.unknownQueryKeys,
      reason,
      terminal,
      late: alreadyClosed,
    }
    ledger.push(row)
    return { terminal, reason, retry: false, follow: null, late: row.late, sequence }
  }

  function trip(reason) {
    if (closedReason === null) closedReason = reason
  }

  function markHanging(sequence) {
    const row = ledger.find((item) => item.sequence === sequence)
    if (!row) return false
    row.terminal = 'hanging'
    return true
  }

  function noteTerminal(sequence, patch) {
    const row = ledger.find((item) => item.sequence === sequence)
    if (!row || !patch) return false
    if (typeof patch.reason === 'string') row.reason = patch.reason
    if (typeof patch.terminal === 'string') row.terminal = patch.terminal
    return true
  }

  function evidence() {
    return {
      observed: ledger.length,
      lateAttempts: ledger.filter((row) => row.late).length,
      disposition: ledger.length > BUDGET_ATTEMPTS ? 'BUDGET_REACHED' : closedReason,
      deadlineExceeded,
      budgetReached: budgetReached || ledger.length > BUDGET_ATTEMPTS,
      trimmed: false,
      phaseBAuthorized: false,
      retryScheduled,
      ledger: ledger.map((row) => ({
        ...row,
        queryKeys: [...row.queryKeys],
        unknownQueryKeys: row.unknownQueryKeys,
      })),
    }
  }

  return { observe, trip, markHanging, noteTerminal, evidence, get startedAt() { return startedAt } }
}

function loopbackHttp(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.username === '' && url.password === ''
  } catch {
    return false
  }
}

function closedResult(reason, extra = {}) {
  return {
    transmitted: false,
    issued: false,
    reason,
    retry: false,
    handedToBrowser: false,
    follow: null,
    status: null,
    late: false,
    ...extra,
  }
}

function createPlatformClock() {
  const origin = performance.now()
  return {
    now() { return performance.now() - origin },
    schedule(at, fn) {
      const delay = Math.max(0, at - (performance.now() - origin))
      const handle = setTimeout(fn, delay)
      return { handle }
    },
    cancel(timer) {
      if (timer && timer.handle) clearTimeout(timer.handle)
    },
  }
}

export function createMonotonicClock(start = 0) {
  let current = start
  const timers = []
  return {
    now() { return current },
    advance(to) {
      if (!Number.isFinite(to) || to < current) throw new Error('clock moved backwards')
      current = to
      const due = timers.filter((timer) => !timer.cancelled && !timer.fired && timer.at <= current)
      due.sort((left, right) => left.at - right.at)
      for (const timer of due) {
        timer.fired = true
        timer.fn()
      }
    },
    schedule(at, fn) {
      const timer = { at, fn, fired: false, cancelled: false }
      timers.push(timer)
      if (at <= current) {
        timer.fired = true
        fn()
      }
      return timer
    },
    cancel(timer) {
      if (timer) timer.cancelled = true
    },
  }
}

function abortWait(signal) {
  if (signal.aborted) return Promise.resolve('aborted')
  return new Promise((resolve) => {
    signal.addEventListener('abort', () => resolve('aborted'), { once: true })
  })
}

export function createAuditRunner(options = {}) {
  const clock = options.clock || createPlatformClock()
  const fetchImpl = typeof options.fetchImpl === 'function' ? options.fetchImpl : globalThis.fetch
  const onCleanup = typeof options.cleanup === 'function' ? options.cleanup : () => {}
  let startedAt = null
  let deadlineTimer = null
  let tornDown = false
  let teardownReason = null
  let cleanupCount = 0
  let cleanupState = 'idle'
  let cleanupPromise = null
  let finalized = false
  let pendingAborted = false
  const providerTransmission = false
  const jobs = new Map()
  const ledger = []
  const eventRows = []
  const storageLog = []
  const gaps = []

  function close(reason) {
    if (tornDown) return
    tornDown = true
    teardownReason = reason
    if (deadlineTimer) clock.cancel(deadlineTimer)
    for (const job of jobs.values()) {
      if (job.settled) continue
      pendingAborted = true
      job.aborted = true
      try { job.controller.abort() } catch { /* already aborted */ }
      if (job.body && typeof job.body.cancel === 'function') {
        job.body.cancel().catch(() => {})
      }
      if (job.reader && typeof job.reader.cancel === 'function') {
        job.reader.cancel().catch(() => {})
      }
    }
    sample('before-teardown')
    if (cleanupState === 'idle') {
      try {
        const result = onCleanup(reason)
        if (result && typeof result.then === 'function') {
          cleanupState = 'pending'
          cleanupPromise = result.then(
            () => { cleanupState = 'complete'; cleanupCount = 1 },
            () => { cleanupState = 'error'; cleanupCount = 0 },
          )
        } else {
          cleanupState = 'complete'
          cleanupCount = 1
          cleanupPromise = Promise.resolve()
        }
      } catch {
        cleanupState = 'error'
        cleanupCount = 0
        cleanupPromise = Promise.resolve()
      }
    }
  }

  function applySample(role, phase, snapshot) {
    if (snapshot == null) return
    if (snapshot.gap === 'vendor-frame-absent') {
      recordGap('vendor-frame-absent')
      return
    }
    recordStorage(role, snapshot, phase)
  }

  function sample(phase) {
    const readers = options.readers
    if (!readers) return
    for (const role of ['parent', 'host', 'vendor']) {
      const read = readers[role]
      if (typeof read !== 'function') continue
      try {
        const snapshot = read(phase)
        if (snapshot && typeof snapshot.then === 'function') {
          snapshot.then((value) => applySample(role, phase, value)).catch(() => applySample(role, phase, { readable: false }))
        } else {
          applySample(role, phase, snapshot === undefined ? null : snapshot)
        }
      } catch {
        applySample(role, phase, { readable: false })
      }
    }
    if (typeof readers.events !== 'function') return
    try {
      const events = readers.events(phase)
      if (events && typeof events.then === 'function') {
        events.then((value) => recordEvents(value == null ? [] : value, { phase, unreadable: value == null })).catch(() => recordEvents([], { phase, unreadable: true }))
      } else if (events == null) recordEvents([], { phase, unreadable: true })
      else recordEvents(events, { phase })
    } catch {
      recordEvents([], { phase, unreadable: true })
    }
  }

  function start(now) {
    if (tornDown) return { ok: false, reason: 'torn-down' }
    if (startedAt !== null) return { ok: false, reason: 'already-started' }
    if (Number.isFinite(now) && typeof clock.advance === 'function' && now > clock.now()) clock.advance(now)
    if (Number.isFinite(now) && now < clock.now()) return { ok: false, reason: 'clock' }
    sample('before-start')
    startedAt = clock.now()
    deadlineTimer = clock.schedule(startedAt + BUDGET_MS, () => close('DEADLINE'))
    return { ok: true, startedAt }
  }

  function pushAttempt(input, fields) {
    const sequence = ledger.length + 1
    const closedBefore = tornDown
    let reason = fields.reason
    let terminal = fields.terminal
    let late = closedBefore
    if (!closedBefore && startedAt !== null && sequence >= BUDGET_ATTEMPTS) {
      reason = 'BUDGET_REACHED'
      terminal = 'blocked'
      late = false
    }
    const mark = clock.now()
    const row = {
      sequence,
      phase: input.phase || (startedAt === null ? 'before-start' : 'initial-load'),
      contextRole: input.contextRole || 'fixture',
      method: input.method || 'GET',
      resourceType: input.resourceType || '',
      endpoint: fields.endpoint || 'unlisted',
      queryKeys: fields.queryKeys || [],
      unknownQueryKeys: fields.unknownQueryKeys || 0,
      offsetMs: startedAt === null ? null : mark - startedAt,
      mark,
      reason,
      terminal,
      late,
      issued: fields.issued === true,
    }
    ledger.push(row)
    if (!closedBefore && reason === 'BUDGET_REACHED') close('BUDGET_REACHED')
    return row
  }

  function resultFrom(row, extra = {}) {
    return {
      transmitted: extra.transmitted === true,
      issued: row.issued === true,
      reason: row.reason,
      terminal: row.terminal,
      retry: false,
      handedToBrowser: false,
      follow: null,
      status: extra.status ?? null,
      late: row.late === true,
      sequence: row.sequence,
    }
  }

  function classified(input) {
    const method = input.method || 'GET'
    const inspection = inspectTarget(input.url || '', method, input.resourceType || 'document')
    const exported = exportQueryKeys(inspection.queryKeys || [])
    return {
      method,
      endpoint: inspection.role || 'unlisted',
      queryKeys: exported.queryKeys,
      unknownQueryKeys: exported.unknownQueryKeys,
    }
  }

  function disposeResponse(job, response) {
    if (!response || !response.body || typeof response.body.cancel !== 'function') return
    job.cancelCalls += 1
    response.body.cancel().catch(() => {})
  }

  async function boundedGet(input) {
    const fields = classified(input)
    if (startedAt === null) {
      return resultFrom(pushAttempt(input, { ...fields, reason: 'not-started', terminal: 'blocked', issued: false }))
    }
    if (tornDown) {
      return resultFrom(pushAttempt(input, { ...fields, reason: teardownReason || 'torn-down', terminal: 'blocked', issued: false }))
    }
    if (clock.now() >= startedAt + BUDGET_MS) {
      close('DEADLINE')
      return resultFrom(pushAttempt(input, { ...fields, reason: 'DEADLINE', terminal: 'blocked', issued: false }))
    }
    if (ledger.length + 1 >= BUDGET_ATTEMPTS) {
      return resultFrom(pushAttempt(input, { ...fields, reason: 'BUDGET_REACHED', terminal: 'blocked', issued: false }))
    }
    if (fields.method !== 'GET') {
      return resultFrom(pushAttempt(input, { ...fields, reason: 'method', terminal: 'blocked', issued: false }))
    }
    if (!loopbackHttp(input.url)) {
      return resultFrom(pushAttempt(input, { ...fields, reason: 'provider-closed', terminal: 'blocked', issued: false }))
    }
    const row = pushAttempt(input, { ...fields, reason: 'pending', terminal: 'active', issued: true })
    const controller = new AbortController()
    const job = { controller, body: null, reader: null, settled: false, aborted: false, cancelCalls: 0 }
    jobs.set(row.sequence, job)
    let issued
    try {
      issued = Promise.resolve(fetchImpl(input.url, { method: 'GET', redirect: 'manual', signal: controller.signal }))
    } catch {
      row.reason = 'error'
      row.terminal = 'error'
      job.settled = true
      return resultFrom(row, { transmitted: true })
    }
    issued.catch(() => {})
    issued.then((response) => {
      if (!job.aborted && !tornDown) return
      disposeResponse(job, response)
    }).catch(() => {})
    let response
    try {
      const raced = await Promise.race([
        issued.then((value) => ({ kind: 'response', value })),
        abortWait(controller.signal).then(() => ({ kind: 'aborted' })),
      ])
      if (raced.kind === 'aborted' || tornDown || controller.signal.aborted) {
        row.reason = 'aborted'
        row.terminal = 'aborted'
        job.settled = true
        return resultFrom(row, { transmitted: true })
      }
      response = raced.value
    } catch {
      row.reason = tornDown || controller.signal.aborted ? 'aborted' : 'error'
      row.terminal = row.reason
      job.settled = true
      return resultFrom(row, { transmitted: true })
    }
    if (tornDown || controller.signal.aborted) {
      if (response && response.body && typeof response.body.cancel === 'function') response.body.cancel().catch(() => {})
      row.reason = 'aborted'
      row.terminal = 'aborted'
      job.settled = true
      return resultFrom(row, { transmitted: true, status: response ? response.status : null })
    }
    if (response.status >= 300 && response.status < 400) {
      if (response.body && typeof response.body.cancel === 'function') response.body.cancel().catch(() => {})
      row.reason = 'BLOCKED_REDIRECT'
      row.terminal = 'blocked-redirect'
      job.settled = true
      return resultFrom(row, { transmitted: true, status: response.status })
    }
    job.body = response.body || null
    let bodyRead
    try {
      bodyRead = response.body && typeof response.body.getReader === 'function'
        ? readStream(response.body, controller, job)
        : response.arrayBuffer()
      bodyRead = Promise.resolve(bodyRead)
    } catch {
      row.reason = 'error'
      row.terminal = 'error'
      job.settled = true
      return resultFrom(row, { transmitted: true, status: response.status })
    }
    bodyRead.catch(() => {})
    try {
      const bodyOutcome = await Promise.race([
        Promise.resolve(bodyRead).then(() => 'complete'),
        abortWait(controller.signal).then(() => 'aborted'),
      ])
      if (bodyOutcome === 'aborted' || tornDown || controller.signal.aborted) {
        row.reason = 'aborted'
        row.terminal = 'aborted'
        job.settled = true
        return resultFrom(row, { transmitted: true, status: response.status })
      }
    } catch {
      row.reason = tornDown || controller.signal.aborted ? 'aborted' : 'error'
      row.terminal = row.reason
      job.settled = true
      return resultFrom(row, { transmitted: true, status: response.status })
    }
    if (tornDown || controller.signal.aborted) {
      row.reason = 'aborted'
      row.terminal = 'aborted'
      job.settled = true
      return resultFrom(row, { transmitted: true, status: response.status })
    }
    row.reason = 'local-response'
    row.terminal = 'complete'
    job.settled = true
    return resultFrom(row, { transmitted: true, status: response.status })
  }

  function recordEvents(events, recordOptions = {}) {
    eventRows.push({ phase: recordOptions.phase || 'unspecified', ...sanitizeEvents(events, recordOptions) })
  }

  function recordStorage(role, snapshot, phase = 'unspecified') {
    if (role !== 'parent' && role !== 'host' && role !== 'vendor') return false
    storageLog.push({ role, phase, ...sanitizeStorage(snapshot) })
    return true
  }

  function recordGap(name) {
    if (name === 'vendor-frame-absent' || name === 'unreadable-frame' || name === 'not-observed') gaps.push(name)
  }

  function numericDelta(baseline, latest, field) {
    if (!baseline || !latest) return null
    if (baseline.observed === false || latest.observed === false) return null
    if (typeof baseline[field] !== 'number' || typeof latest[field] !== 'number') return null
    return latest[field] - baseline[field]
  }

  function storageEvidence() {
    const report = {}
    for (const role of ['parent', 'host', 'vendor']) {
      const samples = storageLog.filter((sample) => sample.role === role)
      const beforeStart = samples.filter((sample) => sample.phase === 'before-start')
      const beforeTeardown = samples.filter((sample) => sample.phase === 'before-teardown')
      const baseline = beforeStart[0] || null
      const latest = beforeTeardown[beforeTeardown.length - 1] || null
      const cookieCount = numericDelta(baseline, latest, 'cookieCount')
      const storageCount = numericDelta(baseline, latest, 'storageCount')
      let gap = null
      if (samples.length === 0) gap = 'not-observed'
      else if (!baseline) gap = 'missing-baseline'
      else if (!latest) gap = 'missing-final'
      else if (baseline.gap === 'unreadable' || latest.gap === 'unreadable') gap = 'unreadable'
      else if (baseline.cookieFlags == null || latest.cookieFlags == null) gap = 'cookie-flags-unavailable'
      report[role] = {
        beforeStart,
        beforeTeardown,
        samples,
        delta: cookieCount === null && storageCount === null ? null : { cookieCount, storageCount },
        gap,
        phaseGaps: {
          baseline: baseline ? baseline.gap : 'missing',
          final: latest ? latest.gap : 'missing',
          cookieFlags: !baseline || !latest || baseline.cookieFlags == null || latest.cookieFlags == null ? 'unavailable' : null,
        },
      }
    }
    return report
  }

  function evidence() {
    for (const [sequence, job] of jobs) {
      if (job.settled) continue
      const row = ledger.find((item) => item.sequence === sequence)
      if (!row || row.terminal !== 'active') continue
      row.terminal = 'hanging'
      if (tornDown) row.reason = 'abort-requested'
    }
    const lateAttempts = ledger.filter((row) => row.late).length
    return {
      providerTransmission,
      started: startedAt !== null,
      tornDown,
      teardownReason,
      pendingAborted,
      cleanupCount,
      observed: ledger.length,
      lateAttempts,
      trimmed: false,
      phaseBAuthorized: false,
      gaps: [...gaps],
      events: eventRows.map((row) => ({ phase: row.phase, gap: row.gap, events: row.events.map((item) => ({ ...item })) })),
      storage: storageEvidence(),
      cleanupState,
      finalized,
      incomplete: cleanupState === 'pending' || [...jobs.values()].some((job) => !job.settled),
      ledger: ledger.map((row) => ({
        sequence: row.sequence,
        phase: row.phase,
        contextRole: row.contextRole,
        method: row.method,
        resourceType: row.resourceType,
        endpoint: row.endpoint,
        queryKeys: [...row.queryKeys],
        unknownQueryKeys: row.unknownQueryKeys,
        offsetMs: startedAt === null || row.mark == null ? row.offsetMs : row.mark - startedAt,
        reason: row.reason,
        terminal: row.terminal,
        late: row.late,
        issued: row.issued,
      })),
      gate: {
        observed: ledger.length,
        lateAttempts,
        trimmed: false,
        disposition: teardownReason,
        ledger: ledger.map((row) => ({
          sequence: row.sequence,
          offsetMs: startedAt === null || row.mark == null ? row.offsetMs : row.mark - startedAt,
          reason: row.reason,
          terminal: row.terminal,
          late: row.late,
          issued: row.issued,
        })),
      },
    }
  }

  async function finalize(boundMs = 30) {
    const tasks = [cleanupPromise, ...[...jobs.values()].map((job) => job.done).filter(Boolean)]
    let incomplete = false
    let timer
    await Promise.race([
      Promise.all(tasks).then(() => {}),
      new Promise((resolve) => { timer = setTimeout(() => { incomplete = true; resolve() }, boundMs) }),
    ])
    if (timer) clearTimeout(timer)
    if (incomplete && cleanupState === 'pending') cleanupState = 'incomplete'
    finalized = !incomplete && cleanupState !== 'pending'
    return evidence()
  }

  return {
    start,
    advance(to) { if (typeof clock.advance === 'function') clock.advance(to) },
    boundedGet,
    trip(reason) { close(reason) },
    finalize,
    recordEvents,
    recordStorage,
    recordGap,
    evidence,
    get startedAt() { return startedAt },
    get providerTransmission() { return providerTransmission },
  }
}

async function readStream(body, controller, job) {
  const reader = body.getReader()
  job.reader = reader
  while (!controller.signal.aborted) {
    const raced = await Promise.race([
      reader.read().then((chunk) => ({ kind: 'chunk', chunk })),
      abortWait(controller.signal).then(() => ({ kind: 'aborted' })),
    ])
    if (raced.kind === 'aborted' || controller.signal.aborted) {
      await reader.cancel().catch(() => {})
      return
    }
    if (raced.chunk.done) return
  }
  await reader.cancel().catch(() => {})
}

export function nestedContractHref() {
  return nestedContract.href
}

if (NESTED_PAIRS.length !== 31) throw new Error('nested contract does not contain 31 pairs')
const checked = parseTarget(nestedContract.href)
if (!checked || checked.pathname !== '/de/locations/' || !pairsEqual(checked.pairs, NESTED_PAIRS)) {
  throw new Error('nested contract href does not match its pairs')
}
