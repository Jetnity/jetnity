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
  const cookies = Array.isArray(snapshot && snapshot.cookies) ? snapshot.cookies : []
  const entries = Number.isInteger(snapshot && snapshot.storageEntries) ? snapshot.storageEntries : 0
  const flags = { secure: 0, httpOnly: 0, sameSite: { Lax: 0, Strict: 0, None: 0, absent: 0 } }
  for (const cookie of cookies) {
    if (cookie && cookie.secure === true) flags.secure += 1
    if (cookie && cookie.httpOnly === true) flags.httpOnly += 1
    const site = cookie && cookie.sameSite
    if (site === 'Lax' || site === 'Strict' || site === 'None') flags.sameSite[site] += 1
    else flags.sameSite.absent += 1
  }
  return {
    readable: snapshot && snapshot.readable === true,
    blocked: !(snapshot && snapshot.readable === true),
    cookieCount: cookies.length,
    storageCount: entries,
    cookieFlags: flags,
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

function closedResult(reason) {
  return { transmitted: false, reason, retry: false, handedToBrowser: false, follow: null, status: null }
}

export function createAuditRunner(options = {}) {
  let startedAt = null
  let gate = null
  let tornDown = false
  let teardownReason = null
  const controllers = new Set()
  const eventRows = []
  const storage = {}
  const gaps = []
  const fetchImpl = typeof options.fetchImpl === 'function' ? options.fetchImpl : globalThis.fetch
  const providerTransmission = false

  function start(now) {
    if (tornDown) return { ok: false, reason: 'torn-down' }
    if (startedAt !== null) return { ok: false, reason: 'already-started' }
    if (!Number.isFinite(now)) return { ok: false, reason: 'clock' }
    startedAt = now
    gate = createAuditGate({ startedAt, mode: 'phase-a' })
    return { ok: true, startedAt }
  }

  function teardown(reason) {
    if (!tornDown) {
      tornDown = true
      teardownReason = reason
    }
    for (const controller of controllers) controller.abort()
    controllers.clear()
  }

  function trip(reason) {
    if (gate) gate.trip(reason)
    teardown(reason)
  }

  async function boundedGet(input) {
    if (tornDown) return closedResult(teardownReason || 'torn-down')
    if (!gate || startedAt === null) return closedResult('not-started')
    const decision = gate.observe({
      url: input.url,
      method: 'GET',
      resourceType: input.resourceType || 'document',
      now: input.now,
      phase: input.phase || 'initial-load',
      contextRole: input.contextRole || 'fixture',
    })
    const stopped = decision.late === true || ['DEADLINE', 'BUDGET_REACHED', 'clock', 'navigation', 'submission', 'popup'].includes(decision.reason)
    if (stopped || !loopbackHttp(input.url)) {
      const reason = stopped ? decision.reason : 'provider-closed'
      if (!stopped) gate.noteTerminal(decision.sequence, { reason: 'provider-closed', terminal: 'blocked' })
      return { ...closedResult(reason), sequence: decision.sequence }
    }
    const controller = new AbortController()
    controllers.add(controller)
    let response
    try {
      response = await fetchImpl(input.url, { method: 'GET', redirect: 'manual', signal: controller.signal })
    } catch {
      return closedResult(tornDown ? (teardownReason || 'aborted') : 'aborted')
    } finally {
      controllers.delete(controller)
    }
    if (response.status >= 300 && response.status < 400) {
      gate.noteTerminal(decision.sequence, { reason: 'BLOCKED_REDIRECT', terminal: 'blocked-redirect' })
      return { transmitted: true, reason: 'BLOCKED_REDIRECT', retry: false, handedToBrowser: false, follow: null, status: response.status, sequence: decision.sequence }
    }
    await response.arrayBuffer()
    return { transmitted: true, reason: 'local-response', retry: false, handedToBrowser: false, follow: null, status: response.status, sequence: decision.sequence }
  }

  function recordEvents(events, recordOptions = {}) {
    eventRows.push(sanitizeEvents(events, recordOptions))
  }

  function recordStorage(role, snapshot) {
    if (role !== 'parent' && role !== 'host' && role !== 'vendor') return false
    storage[role] = sanitizeStorage(snapshot)
    return true
  }

  function recordGap(name) {
    if (name === 'vendor-frame-absent' || name === 'unreadable-frame') gaps.push(name)
  }

  function evidence() {
    return {
      providerTransmission,
      started: startedAt !== null,
      tornDown,
      teardownReason,
      gaps: [...gaps],
      events: eventRows.map((row) => ({ gap: row.gap, events: row.events.map((item) => ({ ...item })) })),
      storage: { ...storage },
      gate: gate ? gate.evidence() : null,
    }
  }

  return {
    start,
    boundedGet,
    trip,
    recordEvents,
    recordStorage,
    recordGap,
    evidence,
    get startedAt() { return startedAt },
    get providerTransmission() { return providerTransmission },
  }
}

export function nestedContractHref() {
  return nestedContract.href
}

if (NESTED_PAIRS.length !== 31) throw new Error('nested contract does not contain 31 pairs')
const checked = parseTarget(nestedContract.href)
if (!checked || checked.pathname !== '/de/locations/' || !pairsEqual(checked.pairs, NESTED_PAIRS)) {
  throw new Error('nested contract href does not match its pairs')
}
