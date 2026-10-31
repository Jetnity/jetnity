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

function countedBoolean(cookies, field) {
  let count = 0
  for (const cookie of cookies) {
    if (typeof cookie?.[field] !== 'boolean') return null
    if (cookie[field] === true) count += 1
  }
  return count
}

function countedSameSite(cookies) {
  const sameSite = { Lax: 0, Strict: 0, None: 0, absent: 0 }
  for (const cookie of cookies) {
    const site = cookie && cookie.sameSite
    if (site !== 'Lax' && site !== 'Strict' && site !== 'None') return null
    sameSite[site] += 1
  }
  return sameSite
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
      gaps: { storage: 'unreadable', cookies: 'unreadable', cookieFlags: 'unavailable' },
      gap: 'unreadable',
    }
  }
  const cookiesKnown = Array.isArray(snapshot.cookies)
  const entriesKnown = Number.isInteger(snapshot.storageEntries)
  const cookieFlags = cookiesKnown
    ? {
        secure: countedBoolean(snapshot.cookies, 'secure'),
        httpOnly: countedBoolean(snapshot.cookies, 'httpOnly'),
        sameSite: countedSameSite(snapshot.cookies),
      }
    : null
  const flagsKnown = cookieFlags != null && cookieFlags.secure != null && cookieFlags.httpOnly != null && cookieFlags.sameSite != null
  const gaps = {
    storage: entriesKnown ? null : 'missing',
    cookies: cookiesKnown ? null : 'missing',
    cookieFlags: flagsKnown ? null : 'unavailable',
  }
  const gap = [
    gaps.storage ? 'storage-unobserved' : null,
    gaps.cookies ? 'cookies-unobserved' : null,
    gaps.cookieFlags ? 'cookie-flags-unavailable' : null,
  ].filter(Boolean).join('+') || null
  return {
    readable: true,
    blocked: false,
    observed: true,
    cookieCount: cookiesKnown ? snapshot.cookies.length : null,
    storageCount: entriesKnown ? snapshot.storageEntries : null,
    cookieFlags,
    gaps,
    gap,
  }
}

export function passiveStorageProbe() {
  const result = { readable: true, storageEntries: null, eventNames: [], eventsUnreadable: false }
  try {
    const localLength = globalThis.localStorage.length
    const sessionLength = globalThis.sessionStorage.length
    result.storageEntries = Number.isInteger(localLength) && Number.isInteger(sessionLength) ? localLength + sessionLength : null
  } catch {
    result.readable = false
  }
  try {
    const layer = globalThis.dataLayer
    if (Array.isArray(layer)) {
      result.eventNames = layer.map((item) => (item && typeof item.event === 'string' ? item.event : 'unnamed'))
    } else if (layer != null) result.eventsUnreadable = true
  } catch {
    result.eventsUnreadable = true
  }
  return result
}

function pruneCookie(cookie) {
  const pruned = {}
  if (!cookie || typeof cookie !== 'object') return pruned
  if (typeof cookie.secure === 'boolean') pruned.secure = cookie.secure
  if (typeof cookie.httpOnly === 'boolean') pruned.httpOnly = cookie.httpOnly
  if (cookie.sameSite === 'Lax' || cookie.sameSite === 'Strict' || cookie.sameSite === 'None') pruned.sameSite = cookie.sameSite
  return pruned
}

function verifiedSurfaceUrl(surface) {
  const found = []
  const readUrl = (target) => {
    if (!target) return
    try {
      const value = typeof target.url === 'function' ? target.url() : target.url
      if (typeof value !== 'string' || value.length === 0) return
      const parsed = new URL(value)
      if (!parsed.hostname) return
      found.push(parsed.href)
    } catch { /* unreadable or relative */ }
  }
  readUrl(surface)
  if (surface.frame) readUrl(surface.frame)
  if (surface.page) readUrl(surface.page)
  const unique = [...new Set(found)]
  return unique.length === 1 ? unique[0] : null
}

function cookieScope(cookie, url) {
  if (!cookie || typeof cookie.domain !== 'string' || cookie.domain.length === 0) return 'unassignable'
  let parsed
  try { parsed = new URL(url) } catch { return 'unassignable' }
  const domain = cookie.domain.replace(/^\./, '').toLowerCase()
  const host = parsed.hostname.toLowerCase()
  if (!domain || domain.includes('*')) return 'unassignable'
  const hostMatch = host === domain || host.endsWith(`.${domain}`)
  if (!hostMatch) return 'other'
  const path = typeof cookie.path === 'string' && cookie.path.length > 0 ? cookie.path : '/'
  if (parsed.pathname !== path) {
    const prefix = path.endsWith('/') ? path : `${path}/`
    if (!parsed.pathname.startsWith(prefix)) return 'other'
  }
  return 'match'
}

function scopeCookieList(list, url) {
  const matched = []
  for (const cookie of list) {
    const scope = cookieScope(cookie, url)
    if (scope === 'unassignable') return { state: 'unscoped' }
    if (scope === 'match') matched.push(pruneCookie(cookie))
  }
  return { state: 'ready', cookies: matched }
}

async function readCookieList(source, url) {
  if (url) {
    try { return await source.cookies(url) } catch { /* retry without an argument */ }
  }
  return source.cookies()
}

async function readSurfaceCookies(surface) {
  const source = typeof surface.cookies === 'function' ? surface : surface.context
  if (!source || typeof source.cookies !== 'function') return { state: 'missing' }
  const url = verifiedSurfaceUrl(surface)
  if (!url) return { state: 'unscoped' }
  try {
    const list = await readCookieList(source, url)
    if (!Array.isArray(list)) return { state: 'unreadable' }
    return scopeCookieList(list, url)
  } catch {
    return { state: 'unreadable' }
  }
}

async function readSurfaceFrame(surface) {
  const frame = typeof surface.evaluate === 'function' ? surface : surface.frame || surface.page
  if (!frame || typeof frame.evaluate !== 'function') return { state: 'missing' }
  try {
    return { state: 'ready', probe: await frame.evaluate(passiveStorageProbe) }
  } catch {
    return { state: 'unreadable' }
  }
}

export async function readPassiveSurface(surface, role) {
  if (surface == null) {
    return role === 'vendor'
      ? { storage: { gap: 'vendor-frame-absent' }, events: null, eventsUnreadable: false, absent: true }
      : { storage: { readable: false }, events: null, eventsUnreadable: true, absent: false }
  }
  const [cookies, frame] = await Promise.all([readSurfaceCookies(surface), readSurfaceFrame(surface)])
  if (frame.state === 'unreadable' || frame.probe?.readable === false) {
    return { storage: { readable: false }, events: null, eventsUnreadable: true }
  }
  const storage = { readable: true }
  if (cookies.state === 'ready') storage.cookies = cookies.cookies
  if (frame.state === 'ready' && Number.isInteger(frame.probe?.storageEntries)) storage.storageEntries = frame.probe.storageEntries
  const events = frame.state === 'ready' && frame.probe?.eventsUnreadable !== true
    ? (frame.probe?.eventNames || []).map((name) => ({ name }))
    : null
  return { storage, events, eventsUnreadable: events == null }
}

export function createPassiveReaders(surfaces = {}) {
  const phases = new Map()
  function load(phase) {
    if (!phases.has(phase)) {
      phases.set(phase, Promise.all([
        readPassiveSurface(surfaces.parent, 'parent'),
        readPassiveSurface(surfaces.host, 'host'),
        readPassiveSurface(surfaces.vendor, 'vendor'),
      ]).then(([parent, host, vendor]) => ({ parent, host, vendor })))
    }
    return phases.get(phase)
  }
  return {
    parent: (phase) => load(phase).then((row) => row.parent.storage),
    host: (phase) => load(phase).then((row) => row.host.storage),
    vendor: (phase) => load(phase).then((row) => row.vendor.storage),
    events: (phase) => load(phase).then((row) => {
      const roles = {}
      const events = []
      for (const role of ['parent', 'host', 'vendor']) {
        const item = row[role]
        if (item.absent) roles[role] = { gap: 'absent', count: null }
        else if (item.eventsUnreadable) roles[role] = { gap: 'unreadable', count: null }
        else {
          const names = item.events || []
          roles[role] = { gap: null, count: names.length }
          events.push(...names)
        }
      }
      return { roles, events }
    }),
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
  const settlements = new Set()
  let baselineState = 'absent'
  let baselinePromise = Promise.resolve('absent')
  let releaseBaseline = () => {}
  let baselineGate = Promise.resolve('absent')
  let finalState = 'absent'
  let finalPromise = Promise.resolve('absent')
  let cleanupStarted = false
  let published = null

  function frozen() {
    return published !== null
  }

  function close(reason) {
    if (tornDown) return
    tornDown = true
    teardownReason = reason
    if (deadlineTimer) clock.cancel(deadlineTimer)
    if (baselineState === 'pending') baselineState = 'unavailable'
    releaseBaseline()
    for (const job of jobs.values()) {
      if (job.settled) continue
      pendingAborted = true
      job.aborted = true
      try { job.controller.abort() } catch { /* already aborted */ }
      if (job.response) job.cancel = cancelResponse(job, job.response)
    }
    const observation = sample('before-teardown')
    if (observation.pending) {
      finalState = 'pending'
      finalPromise = observation.promise.then((status) => {
        if (finalState === 'pending') finalState = status
        return startCleanup(reason)
      })
      remember(finalPromise)
    } else {
      finalState = observation.status
      finalPromise = Promise.resolve(observation.status)
      startCleanup(reason)
    }
  }

  function startCleanup(reason) {
    if (cleanupStarted) return cleanupPromise || Promise.resolve()
    cleanupStarted = true
    cleanupPromise = runCleanup(reason)
    remember(cleanupPromise)
    return cleanupPromise
  }

  function runCleanup(reason) {
    try {
      const result = onCleanup(reason)
      if (result && typeof result.then === 'function') {
        cleanupState = 'pending'
        return result.then(
          () => { if (!frozen()) { cleanupState = 'complete'; cleanupCount = 1 } },
          () => { if (!frozen()) { cleanupState = 'error'; cleanupCount = 0 } },
        )
      }
      cleanupState = 'complete'
      cleanupCount = 1
      return Promise.resolve()
    } catch {
      cleanupState = 'error'
      cleanupCount = 0
      return Promise.resolve()
    }
  }

  function applySample(role, phase, snapshot) {
    if (frozen() || snapshot == null) return
    if (phase === 'before-start' && baselineState === 'unavailable') return
    if (phase === 'before-teardown' && finalState === 'unavailable') return
    if (snapshot.gap === 'vendor-frame-absent') {
      recordGap('vendor-frame-absent')
      storageLog.push({
        role,
        phase,
        readable: false,
        blocked: true,
        observed: false,
        cookieCount: null,
        storageCount: null,
        cookieFlags: null,
        gaps: { storage: 'missing', cookies: 'missing', cookieFlags: 'unavailable' },
        gap: 'vendor-frame-absent',
      })
      return
    }
    recordStorage(role, snapshot, phase)
  }

  function remember(promise) {
    const tracked = Promise.resolve(promise).then((value) => value, () => undefined)
    settlements.add(tracked)
    tracked.finally(() => settlements.delete(tracked))
    return tracked
  }

  function sample(phase) {
    const readers = options.readers
    if (!readers) return { pending: false, status: 'absent', promise: Promise.resolve('absent') }
    const tasks = []
    for (const role of ['parent', 'host', 'vendor']) {
      const read = readers[role]
      if (typeof read !== 'function') continue
      try {
        const snapshot = read(phase)
        if (snapshot && typeof snapshot.then === 'function') {
          tasks.push(remember(snapshot).then((value) => {
            applySample(role, phase, value == null ? null : value)
          }))
        } else applySample(role, phase, snapshot === undefined ? null : snapshot)
      } catch {
        applySample(role, phase, { readable: false })
      }
    }
    if (typeof readers.events === 'function') {
      try {
        const events = readers.events(phase)
        if (events && typeof events.then === 'function') {
          tasks.push(remember(events).then((value) => {
            if (frozen() || (phase === 'before-start' && baselineState === 'unavailable') || (phase === 'before-teardown' && finalState === 'unavailable')) return
            recordEventValue(value, phase)
          }))
        } else recordEventValue(events, phase)
      } catch {
        recordEvents([], { phase, unreadable: true })
      }
    }
    if (tasks.length === 0) return { pending: false, status: 'ready', promise: Promise.resolve('ready') }
    return { pending: true, status: 'pending', promise: Promise.all(tasks).then(() => 'ready') }
  }

  function start(now) {
    if (tornDown) return { ok: false, reason: 'torn-down' }
    if (startedAt !== null) return { ok: false, reason: 'already-started' }
    if (Number.isFinite(now) && typeof clock.advance === 'function' && now > clock.now()) clock.advance(now)
    if (Number.isFinite(now) && now < clock.now()) return { ok: false, reason: 'clock' }
    startedAt = clock.now()
    deadlineTimer = clock.schedule(startedAt + BUDGET_MS, () => close('DEADLINE'))
    const observation = sample('before-start')
    if (observation.pending) {
      baselineState = 'pending'
      baselineGate = new Promise((resolve) => { releaseBaseline = resolve })
      baselinePromise = observation.promise.then((status) => {
        if (baselineState === 'pending') baselineState = status
        releaseBaseline()
      })
      remember(baselinePromise)
    } else {
      baselineState = observation.status
      baselinePromise = Promise.resolve(observation.status)
      baselineGate = Promise.resolve(observation.status)
    }
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

  function trackSettlement(promise) {
    const tracked = Promise.resolve(promise).then(() => undefined, () => undefined)
    remember(tracked)
    return tracked
  }

  function cancelResponse(job, response) {
    if (!job.cancelParts) job.cancelParts = []
    const body = (response && response.body) || job.body
    if (body && typeof body.cancel === 'function' && job.bodyCancelStarted !== true) {
      job.bodyCancelStarted = true
      job.cancelCalls += 1
      let started
      try { started = body.cancel() } catch (error) { started = Promise.reject(error) }
      job.cancelParts.push(trackSettlement(started))
    }
    if (job.reader && typeof job.reader.cancel === 'function' && job.readerCancelStarted !== true) {
      job.readerCancelStarted = true
      let started
      try { started = job.reader.cancel() } catch (error) { started = Promise.reject(error) }
      job.cancelParts.push(trackSettlement(started))
    }
    job.cancel = Promise.all(job.cancelParts).then(() => undefined)
    return job.cancel
  }

  function settle(job, row, reason, terminal, status) {
    if (frozen()) return
    row.reason = reason
    row.terminal = terminal
    if (status != null) job.status = status
    job.settled = true
  }

  async function finishIssued(job, row, controller, url) {
    let response
    try {
      response = await fetchImpl(url, { method: 'GET', redirect: 'manual', signal: controller.signal })
    } catch {
      settle(job, row, job.aborted || controller.signal.aborted ? 'aborted' : 'error', job.aborted || controller.signal.aborted ? 'aborted' : 'error', null)
      return
    }
    job.response = response
    job.body = response && response.body ? response.body : null
    job.requestCancel = () => cancelResponse(job, job.response)
    if (job.aborted || tornDown || controller.signal.aborted) {
      await cancelResponse(job, response)
      settle(job, row, 'aborted', 'aborted', response ? response.status : null)
      return
    }
    if (response && response.status >= 300 && response.status < 400) {
      await cancelResponse(job, response)
      settle(job, row, 'BLOCKED_REDIRECT', 'blocked-redirect', response.status)
      return
    }
    try {
      if (response && response.body && typeof response.body.getReader === 'function') await readStream(response.body, controller, job)
      else if (response && typeof response.arrayBuffer === 'function') await response.arrayBuffer()
    } catch {
      if (job.aborted || tornDown || controller.signal.aborted) {
        await cancelResponse(job, response)
        settle(job, row, 'aborted', 'aborted', response ? response.status : null)
      } else settle(job, row, 'error', 'error', response ? response.status : null)
      return
    }
    if (job.aborted || tornDown || controller.signal.aborted) {
      await cancelResponse(job, response)
      settle(job, row, 'aborted', 'aborted', response ? response.status : null)
      return
    }
    settle(job, row, 'local-response', 'complete', response ? response.status : null)
  }

  async function boundedGet(input) {
    const fields = classified(input)
    const blocked = (reason, terminal) => resultFrom(pushAttempt(input, { ...fields, reason, terminal, issued: false }))
    if (startedAt === null) return blocked('not-started', 'blocked')
    if (tornDown) return blocked(teardownReason || 'torn-down', 'blocked')
    if (clock.now() >= startedAt + BUDGET_MS) {
      close('DEADLINE')
      return blocked('DEADLINE', 'blocked')
    }
    if (ledger.length + 1 >= BUDGET_ATTEMPTS) return blocked('BUDGET_REACHED', 'blocked')
    if (fields.method !== 'GET') return blocked('method', 'blocked')
    if (!loopbackHttp(input.url)) return blocked('provider-closed', 'blocked')
    if (baselineState === 'pending') await baselineGate
    if (tornDown) return blocked(teardownReason || 'torn-down', 'blocked')
    if (clock.now() >= startedAt + BUDGET_MS) {
      close('DEADLINE')
      return blocked('DEADLINE', 'blocked')
    }
    if (ledger.length + 1 >= BUDGET_ATTEMPTS) return blocked('BUDGET_REACHED', 'blocked')
    if (baselineState === 'unavailable') return blocked('baseline-unavailable', 'blocked')
    const row = pushAttempt(input, { ...fields, reason: 'pending', terminal: 'active', issued: true })
    const controller = new AbortController()
    const job = { controller, body: null, reader: null, response: null, settled: false, aborted: false, cancelCalls: 0, done: null, cancel: null }
    jobs.set(row.sequence, job)
    job.done = finishIssued(job, row, controller, input.url)
    remember(job.done)
    const raced = await Promise.race([
      job.done.then(() => 'settled'),
      abortWait(controller.signal).then(() => 'aborted'),
    ])
    if (!job.settled && (raced === 'aborted' || tornDown || controller.signal.aborted)) {
      if (!frozen()) {
        row.reason = 'abort-requested'
        row.terminal = 'hanging'
      }
      return { ...resultFrom(row, { transmitted: true, status: job.status ?? null }), reason: 'aborted', terminal: 'abort-requested' }
    }
    return resultFrom(row, { transmitted: true, status: job.status ?? null })
  }

  function recordEvents(events, recordOptions = {}) {
    eventRows.push({ phase: recordOptions.phase || 'unspecified', ...sanitizeEvents(events, recordOptions) })
  }

  function recordEventValue(value, phase) {
    if (value == null) {
      recordEvents([], { phase, unreadable: true })
      return
    }
    if (Array.isArray(value)) {
      recordEvents(value, { phase })
      return
    }
    if (!value.roles) {
      recordEvents([], { phase, unreadable: true })
      return
    }
    const sanitized = sanitizeEvents(value.events || [])
    const roles = {}
    for (const role of ['parent', 'host', 'vendor']) {
      const item = value.roles[role]
      roles[role] = {
        gap: item && typeof item.gap === 'string' ? item.gap : null,
        count: item && Number.isInteger(item.count) ? item.count : null,
      }
    }
    let pruning = null
    if (phase === 'before-teardown') {
      const prior = [...eventRows].reverse().find((row) => row.phase === 'before-start' && row.roles)
      if (prior) {
        const lost = {}
        for (const role of ['parent', 'host', 'vendor']) {
          const before = prior.roles[role]
          const after = roles[role]
          if (!before || !after || before.gap || after.gap) continue
          if (Number.isInteger(before.count) && Number.isInteger(after.count) && after.count < before.count) lost[role] = before.count - after.count
        }
        if (Object.keys(lost).length > 0) pruning = { lost }
      }
    }
    const roleGap = Object.values(roles).some((item) => item.gap)
    const gap = [roleGap ? 'partial-unreadable' : null, pruning ? 'pruned' : null].filter(Boolean).join('+') || sanitized.gap
    eventRows.push({ phase, gap, events: sanitized.events, roles, pruning })
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

  function flagsReady(sample) {
    return Boolean(sample && sample.cookieFlags && sample.cookieFlags.secure != null && sample.cookieFlags.httpOnly != null && sample.cookieFlags.sameSite != null)
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
      const storageGap = [baseline, latest].some((sample) => sample && sample.gaps && sample.gaps.storage === 'missing')
      let gap = null
      if (samples.length === 0) gap = baselineState === 'unavailable' || finalState === 'unavailable' ? 'unavailable' : 'not-observed'
      else if (!baseline) gap = 'missing-baseline'
      else if (!latest) gap = 'missing-final'
      else if (baseline.gap === 'unreadable' || latest.gap === 'unreadable') gap = 'unreadable'
      else if (baseline.gap === 'vendor-frame-absent' || latest.gap === 'vendor-frame-absent') gap = 'vendor-frame-absent'
      else if (storageGap) gap = 'storage-unobserved'
      else if (!flagsReady(baseline) || !flagsReady(latest)) gap = 'cookie-flags-unavailable'
      report[role] = {
        beforeStart,
        beforeTeardown,
        samples,
        delta: cookieCount === null && storageCount === null ? null : { cookieCount, storageCount },
        gap,
        phaseGaps: {
          baseline: baseline ? baseline.gap : (baselineState === 'unavailable' ? 'unavailable' : 'missing'),
          final: latest ? latest.gap : (finalState === 'unavailable' ? 'unavailable' : 'missing'),
          storage: storageGap ? 'missing' : (baseline && latest ? null : 'missing'),
          cookieFlags: flagsReady(baseline) && flagsReady(latest) ? null : 'unavailable',
        },
      }
    }
    return report
  }

  function captureIncomplete() {
    if (cleanupState === 'pending' || cleanupState === 'incomplete' || cleanupState === 'error') return true
    if (baselineState === 'pending' || finalState === 'pending') return true
    if (baselineState === 'unavailable' || finalState === 'unavailable') return true
    return [...jobs.values()].some((job) => !job.settled)
  }

  function evidence() {
    if (published) return published
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
      events: eventRows.map((row) => ({
        phase: row.phase,
        gap: row.gap,
        events: row.events.map((item) => ({ ...item })),
        ...(row.roles ? { roles: structuredClone(row.roles) } : {}),
        ...(row.pruning ? { pruning: structuredClone(row.pruning) } : {}),
      })),
      storage: storageEvidence(),
      cleanupState,
      baselineState,
      finalState,
      finalized,
      incomplete: captureIncomplete(),
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
    if (published) return published
    const deadlineAt = Date.now() + boundMs
    let timedOut = false
    while (settlements.size > 0) {
      const remaining = deadlineAt - Date.now()
      if (remaining <= 0) { timedOut = true; break }
      const pending = [...settlements]
      let sliceTimedOut = false
      let timer
      await Promise.race([
        Promise.all(pending).then(() => {}),
        new Promise((resolve) => { timer = setTimeout(() => { sliceTimedOut = true; resolve() }, remaining) }),
      ])
      if (timer) clearTimeout(timer)
      if (sliceTimedOut) { timedOut = true; break }
    }
    if (timedOut) {
      if (baselineState === 'pending') baselineState = 'unavailable'
      if (finalState === 'pending') finalState = 'unavailable'
      if (tornDown) startCleanup(teardownReason)
      if (cleanupState === 'pending') cleanupState = 'incomplete'
      for (const [sequence, job] of jobs) {
        if (job.settled) continue
        const row = ledger.find((item) => item.sequence === sequence)
        if (!row) continue
        row.terminal = 'hanging'
        if (row.issued && row.reason !== 'error') row.reason = 'abort-requested'
      }
    }
    const snap = evidence()
    snap.incomplete = timedOut || snap.incomplete
    snap.finalized = snap.incomplete !== true
    finalized = snap.finalized
    published = structuredClone(snap)
    return published
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
    if (raced.kind === 'aborted' || controller.signal.aborted) break
    if (raced.chunk.done) return
  }
  if (typeof job.requestCancel === 'function') return job.requestCancel()
  if (job.readerCancelStarted === true) return job.cancel
  job.readerCancelStarted = true
  return reader.cancel()
}

export function nestedContractHref() {
  return nestedContract.href
}

if (NESTED_PAIRS.length !== 31) throw new Error('nested contract does not contain 31 pairs')
const checked = parseTarget(nestedContract.href)
if (!checked || checked.pathname !== '/de/locations/' || !pairsEqual(checked.pairs, NESTED_PAIRS)) {
  throw new Error('nested contract href does not match its pairs')
}
