import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { buildShell, classify, decide, reviewedScriptSources } from '../lib/decide.mjs'
import { DISCOVERCARS_EXPORT, TWELVEGO_EXPORT } from '../lib/frozen-exports.mjs'
import {
  CHILD_ORIGIN,
  PARENT_ORIGIN,
  createController,
  createParentFixture,
  insertFromPlan,
  insertionValue,
  parseExport,
  parseMessage,
  selectionFromPlan,
  startProductionShell,
} from '../lib/host-runtime.mjs'
import { clientPlan, planFromFrozen, productionPlanForClient } from '../lib/production-wire.mjs'
import { PRODUCTION_REGISTRY, productionSelection } from '../lib/registry.mjs'

const DISCOVER_SHA = '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa'
const TWELVE_SHA = '3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e'
const CHALLENGE = 'a'.repeat(64)

function sha(text) {
  return createHash('sha256').update(text).digest('hex')
}

function independentAttributes(tagSource) {
  const found = []
  const pattern = /([A-Za-z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  for (const match of tagSource.matchAll(pattern)) {
    if (match[1] === 'script' || match[1] === 'div' || match[1] === 'a') continue
    found.push([match[1], match[2] ?? match[3] ?? match[4] ?? ''])
  }
  return found
}

function fakeDocument() {
  function node(tag) {
    return {
      tag,
      attrs: [],
      children: [],
      text: '',
      setAttribute(name, value) {
        this.attrs.push([name, value])
      },
      appendChild(child) {
        this.children.push(child)
        return child
      },
    }
  }
  const body = node('body')
  return {
    body,
    createElement: node,
    createTextNode(value) {
      return { kind: 'text', text: value }
    },
  }
}

function controllerDeps(overrides = {}) {
  const parent = { id: 'parent' }
  const sent = []
  const document = fakeDocument()
  const deps = {
    provider: 'discovercars',
    childOrigin: CHILD_ORIGIN,
    parentOrigin: PARENT_ORIGIN,
    document,
    mount: document.body,
    readLocationOrigin: () => CHILD_ORIGIN,
    readPathProvider: () => 'discovercars',
    isTopLevel: () => false,
    parentWindow: () => parent,
    postToParent(message) {
      sent.push(message)
    },
    randomChallenge: () => CHALLENGE,
    select: () => null,
    artifact: () => null,
    listen: null,
    ...overrides,
  }
  return { deps, parent, sent, document }
}

test('frozen exports match the published byte length and SHA-256', () => {
  for (const [provider, expected, raw] of [
    ['discovercars', { bytes: 835, sha256: DISCOVER_SHA }, DISCOVERCARS_EXPORT],
    ['twelvego', { bytes: 472, sha256: TWELVE_SHA }, TWELVEGO_EXPORT],
  ]) {
    const plan = planFromFrozen(provider)
    assert.equal(plan.ok, true)
    assert.equal(plan.bytes, expected.bytes)
    assert.equal(plan.sha256, expected.sha256)
    assert.equal(sha(raw), expected.sha256)
    assert.equal(Buffer.byteLength(raw), expected.bytes)
  }
})

test('parser preserves affiliate attributes and resolves only the 12Go protocol-relative source', () => {
  const discover = parseExport('discovercars', DISCOVERCARS_EXPORT)
  assert.equal(discover.ok, true)
  const script = discover.nodes[0].children[0]
  const discoverTag = DISCOVERCARS_EXPORT.match(/<script\s+([^>]+)>/)[1]
  assert.deepEqual(script.attributes, independentAttributes(discoverTag))
  assert.equal(script.attributes.find(([name]) => name === 'data-aff-code')[1], 'a_aid')
  assert.equal(script.attributes.find(([name]) => name === 'data-utm-source')[1], 'jetnity')
  assert.equal(script.attributes.find(([name]) => name === 'data-utm-medium')[1], 'widget')
  assert.equal(insertionValue('src', script.attributes.find(([name]) => name === 'src')[1]).startsWith('https://www.discovercars.com/'), true)

  const twelve = parseExport('twelvego', TWELVEGO_EXPORT)
  assert.equal(twelve.ok, true)
  const rawSrc = twelve.nodes[0].attributes.find(([name]) => name === 'src')[1]
  assert.equal(rawSrc.startsWith('//cdn0.trainbusferry.com/'), true)
  assert.equal(TWELVEGO_EXPORT.includes(rawSrc), true)
  assert.equal(insertionValue('src', rawSrc), `https:${rawSrc}`)
  const link = twelve.nodes[1].children[1]
  assert.equal(link.attributes.find(([name]) => name === 'href')[1].includes('sub_id=jetnity-mobility-search'), true)
  assert.equal(twelve.nodes[0].attributes.find(([name]) => name === 'data-sub_id')[1], 'jetnity-mobility-search')
})

test('insertion recreates elements without innerHTML and upgrades only protocol-relative src', () => {
  const parsed = parseExport('twelvego', TWELVEGO_EXPORT)
  const document = fakeDocument()
  const placed = insertFromPlan(document, { nodes: parsed.nodes }, document.body)
  assert.equal(placed.ok, true)
  const script = document.body.children[0]
  assert.equal(script.tag, 'script')
  assert.equal(script.attrs.find(([name]) => name === 'src')[1].startsWith('https://cdn0.trainbusferry.com/'), true)
  assert.equal(TWELVEGO_EXPORT.startsWith('<script src="//cdn0.trainbusferry.com/'), true)
  const anchor = document.body.children[1].children[1]
  assert.equal(anchor.attrs.find(([name]) => name === 'href')[1], 'https://12go.asia/?z=17323861&sub_id=jetnity-mobility-search')
})

test('production registry denies both providers and the client plan map stays empty', () => {
  assert.equal(PRODUCTION_REGISTRY.discovercars.selected, false)
  assert.equal(PRODUCTION_REGISTRY.twelvego.selected, false)
  assert.equal(productionSelection('discovercars'), null)
  assert.equal(productionSelection('twelvego'), null)
  assert.equal(productionPlanForClient('discovercars'), null)
  assert.equal(productionPlanForClient('twelvego'), null)
  const contract = readFileSync(new URL('../lib/origin-contract.ts', import.meta.url), 'utf8')
  assert.equal(contract.includes("childOrigin: 'https://jetnity-widgets.vercel.app'"), true)
  assert.equal(contract.includes('productionProvidersSelected: false'), true)
  assert.equal(contract.includes('brandedSubdomainSelected: false'), true)
  assert.equal(contract.includes('return false'), true)
})

test('handshake rejects bad parents, replays, stale generations and the production registry', () => {
  const { deps, parent, sent } = controllerDeps()
  const controller = createController(deps)
  assert.equal(controller.ready().ok, true)
  assert.equal(sent[0].kind, 'ready')
  const grant = {
    type: 'jetnity-widget-host',
    revision: 1,
    kind: 'grant',
    provider: 'discovercars',
    challenge: CHALLENGE,
    frameGeneration: 1,
    parentGeneration: 1,
    policyId: 'synthetic-canary',
    artifactSha256: 'b'.repeat(64),
  }
  assert.equal(controller.onMessage({ source: { id: 'other' }, origin: PARENT_ORIGIN, data: grant }).reason, 'source')
  assert.equal(controller.onMessage({ source: parent, origin: 'https://evil.example', data: grant }).reason, 'parent-origin')
  assert.equal(controller.onMessage({ source: parent, origin: PARENT_ORIGIN, data: { ...grant, extra: 1 } }).reason, 'fields')
  assert.equal(controller.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).reason, 'unselected')
  const canary = parseExport('discovercars', '<div><script id="canary" src="https://canary.test/once.js" data-canary="1"></script></div>')
  const allowed = createController({
    ...deps,
    select: () => ({ selected: true, policyId: 'synthetic-canary', artifactSha256: 'b'.repeat(64) }),
    artifact: () => ({ artifactSha256: 'b'.repeat(64), nodes: canary.nodes }),
  })
  allowed.ready()
  assert.equal(allowed.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).ok, true)
  assert.equal(deps.document.body.children.length, 1)
  assert.equal(allowed.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).reason, 'challenge')
  const stale = createController(deps)
  stale.ready()
  assert.equal(stale.onMessage({ source: parent, origin: PARENT_ORIGIN, data: { ...grant, frameGeneration: 2 } }).reason, 'generation')
  assert.equal(parseMessage(`{"kind":"ready","pad":"${'x'.repeat(3000)}"}`).reason, 'size')
})

test('top-level, wrong child origin and parent decision refusal do not insert', () => {
  const top = controllerDeps({ isTopLevel: () => true })
  assert.equal(createController(top.deps).ready().reason, 'top-level')
  const wrong = controllerDeps({ readLocationOrigin: () => 'http://127.0.0.1:41731' })
  assert.equal(createController(wrong.deps).ready().reason, 'child-origin')
  const iframe = { contentWindow: { id: 'child' }, removed: false, remove() { this.removed = true } }
  const posted = []
  const fixture = createParentFixture({
    provider: 'discovercars',
    childOrigin: CHILD_ORIGIN,
    iframe,
    parentGeneration: 4,
    policyId: 'synthetic-canary',
    artifactSha256: 'b'.repeat(64),
    allowsGrant: () => false,
    postToChild(message) { posted.push(message) },
  })
  const ready = {
    type: 'jetnity-widget-host',
    revision: 1,
    kind: 'ready',
    provider: 'discovercars',
    challenge: CHALLENGE,
    frameGeneration: 1,
  }
  assert.equal(fixture.onMessage({ origin: CHILD_ORIGIN, source: iframe.contentWindow, data: ready }).reason, 'decision')
  assert.equal(posted.length, 0)
  fixture.destroy()
  assert.equal(iframe.removed, true)
  assert.equal(fixture.onMessage({ origin: CHILD_ORIGIN, source: iframe.contentWindow, data: ready }).reason, 'destroyed')
})

test('deferred insertion rechecks generation and revoke drops it', () => {
  const { deps, parent, document } = controllerDeps({
    deferInsert: 40,
    select: () => ({ selected: true, policyId: 'synthetic-canary', artifactSha256: 'b'.repeat(64) }),
    artifact: () => {
      const canary = parseExport('discovercars', '<div><script id="canary" src="https://canary.test/once.js" data-canary="1"></script></div>')
      return { artifactSha256: 'b'.repeat(64), nodes: canary.nodes }
    },
  })
  const controller = createController(deps)
  controller.ready()
  const grant = {
    type: 'jetnity-widget-host',
    revision: 1,
    kind: 'grant',
    provider: 'discovercars',
    challenge: CHALLENGE,
    frameGeneration: 1,
    parentGeneration: 1,
    policyId: 'synthetic-canary',
    artifactSha256: 'b'.repeat(64),
  }
  assert.equal(controller.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).pending, true)
  assert.equal(controller.onMessage({
    source: parent,
    origin: PARENT_ORIGIN,
    data: { type: 'jetnity-widget-host', revision: 1, kind: 'revoke', provider: 'discovercars', frameGeneration: 1 },
  }).revoked, true)
  return new Promise((resolve) => {
    setTimeout(() => {
      assert.equal(document.body.children.length, 0)
      resolve()
    }, 90)
  })
})

test('a selected plan contributes only its exact script origin', () => {
  assert.deepEqual(reviewedScriptSources({ selected: false, nodes: [] }), [])
  const selected = reviewedScriptSources({
    selected: true,
    nodes: [{ kind: 'script', attributes: [['src', '//cdn.example/widget.js']], children: [] }],
  })
  assert.deepEqual(selected, ['https://cdn.example'])
})

test('shell and closed HTTP contracts', async () => {
  const shell = decide(new Request('https://jetnity-widgets.vercel.app/embed/discovercars'))
  assert.equal(shell.status, 200)
  const html = await shell.text()
  assert.equal(html.includes('Kein Anbieter ist geladen.'), true)
  assert.equal(html.includes('discovercars.com'), false)
  assert.equal(html.includes('12go.asia'), false)
  assert.equal(html.includes('trainbusferry'), false)
  assert.equal(html.includes('<iframe'), false)
  assert.equal(html.includes('startProductionShell'), true)
  assert.match(shell.headers.get('content-security-policy'), /frame-ancestors https:\/\/jetnity.com/)
  assert.match(shell.headers.get('content-security-policy'), /default-src 'none'/)
  assert.equal(shell.headers.get('x-frame-options'), null)
  assert.equal(shell.headers.get('set-cookie'), null)
  assert.equal(productionPlanForClient('discovercars'), null)
  assert.equal(html.includes('"plan":null'), true)

  const cases = [
    new Request('https://jetnity-widgets.vercel.app/'),
    new Request('https://jetnity-widgets.vercel.app/embed/discovercars?consent=1'),
    new Request('https://evil.example/embed/discovercars'),
    new Request('https://jetnity-widgets.vercel.app:444/embed/twelvego'),
    new Request('https://widgets.jetnity.com/embed/discovercars'),
    new Request('https://jetnity.com/embed/discovercars'),
    new Request('https://jetnity-widgets.vercel.app/embed/other'),
    new Request('https://jetnity-widgets.vercel.app/embed/discovercars', { method: 'POST' }),
    new Request('http://jetnity-widgets.vercel.app/embed/discovercars'),
    new Request('https://127.0.0.1/embed/discovercars'),
  ]
  for (const request of cases) {
    const closed = decide(request)
    assert.equal(closed.status, 404)
    assert.equal(closed.headers.get('x-frame-options'), 'DENY')
    assert.match(closed.headers.get('content-security-policy'), /frame-ancestors 'none'/)
    assert.equal(closed.headers.get('set-cookie'), null)
    const body = await closed.text()
    assert.equal(body.includes('SYNTHETIC'), false)
    assert.equal(body.includes(request.headers.get('host') || '___'), false)
  }
  const spoofed = classify({
    method: 'GET',
    url: 'http://127.0.0.1:41733/embed/discovercars',
    headers: { get: (name) => (name === 'host' ? 'jetnity-widgets.vercel.app' : null) },
  })
  assert.equal(spoofed.kind, 'closed')
})

test('malformed messages are denied without throwing', () => {
  for (const data of [
    { kind: 'constructor' },
    { kind: 'toString' },
    { kind: '__proto__' },
    Object.create(null),
    JSON.parse('{"__proto__":{"polluted":true},"kind":"ready"}'),
    'not-json',
    null,
    [],
  ]) {
    const result = parseMessage(data)
    assert.equal(result.ok, false)
    assert.equal(typeof result.reason, 'string')
  }
})

test('serialized production plan uses artifactSha256 and inserts once', () => {
  const selection = {
    selected: true,
    provider: 'discovercars',
    artifactSha256: DISCOVER_SHA,
    childOrigin: CHILD_ORIGIN,
    parentOrigin: PARENT_ORIGIN,
    protocolRevision: 1,
    policyId: 'reviewed-synthetic',
    sandbox: 'distinct-child-only',
  }
  const plan = clientPlan('discovercars', selection)
  assert.equal(plan.artifactSha256, DISCOVER_SHA)
  assert.equal(clientPlan('twelvego', selection), null)
  const shell = buildShell('discovercars', { plan })
  const config = JSON.parse(shell.html.match(/startProductionShell\((\{.*\})\);/s)[1])
  const wired = selectionFromPlan(config)
  assert.equal(wired.artifactSha256, DISCOVER_SHA)
  assert.equal(shell.html.includes('12go.asia'), false)
  const { deps, parent, document } = controllerDeps({
    select: () => wired,
    artifact: () => wired,
  })
  const controller = createController(deps)
  controller.ready()
  const grant = {
    type: 'jetnity-widget-host',
    revision: 1,
    kind: 'grant',
    provider: 'discovercars',
    challenge: CHALLENGE,
    frameGeneration: 1,
    parentGeneration: 1,
    policyId: wired.policyId,
    artifactSha256: wired.artifactSha256,
  }
  assert.equal(controller.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).inserted, true)
  assert.equal(document.body.children.length, 1)
  assert.equal(controller.onMessage({ source: parent, origin: PARENT_ORIGIN, data: grant }).reason, 'challenge')
})

test('one parent decision grants once and a new challenge retires the frame', () => {
  const iframe = { contentWindow: { id: 'child' }, removed: false, remove() { this.removed = true } }
  const posted = []
  let decision = 7
  const fixture = createParentFixture({
    provider: 'discovercars',
    childOrigin: CHILD_ORIGIN,
    iframe,
    parentGeneration: decision,
    currentDecision: () => decision,
    policyId: 'reviewed-synthetic',
    artifactSha256: DISCOVER_SHA,
    allowsGrant: () => true,
    postToChild(message) { posted.push(message) },
  })
  const ready = (challenge, frameGeneration) => ({
    origin: CHILD_ORIGIN,
    source: iframe.contentWindow,
    data: {
      type: 'jetnity-widget-host',
      revision: 1,
      kind: 'ready',
      provider: 'discovercars',
      challenge,
      frameGeneration,
    },
  })
  assert.equal(fixture.onMessage(ready(CHALLENGE, 1)).granted, true)
  assert.equal(posted[0].parentGeneration, 7)
  assert.equal(fixture.onMessage(ready(CHALLENGE, 1)).reason, 'duplicate')
  assert.equal(posted.length, 1)
  decision = 8
  assert.equal(fixture.onMessage(ready('d'.repeat(64), 3)).granted, true)
  assert.equal(posted[1].parentGeneration, 8)
  assert.equal(fixture.onMessage(ready('c'.repeat(64), 4)).reason, 'lifecycle')
  assert.equal(iframe.removed, true)
  assert.equal(posted.length, 2)
})

test('a recycled decision or a spent challenge is not granted again', () => {
  const iframe = { contentWindow: { id: 'child' }, removed: false, remove() { this.removed = true } }
  const posted = []
  let decision = 7
  const fixture = createParentFixture({
    provider: 'discovercars',
    childOrigin: CHILD_ORIGIN,
    iframe,
    parentGeneration: 7,
    currentDecision: () => decision,
    policyId: 'reviewed-synthetic',
    artifactSha256: DISCOVER_SHA,
    allowsGrant: () => true,
    postToChild(message) { posted.push(message) },
  })
  const ready = (challenge, frameGeneration) => ({
    origin: CHILD_ORIGIN,
    source: iframe.contentWindow,
    data: {
      type: 'jetnity-widget-host',
      revision: 1,
      kind: 'ready',
      provider: 'discovercars',
      challenge,
      frameGeneration,
    },
  })
  assert.equal(fixture.onMessage(ready(CHALLENGE, 1)).grant.parentGeneration, 7)
  decision = 8
  assert.equal(fixture.onMessage(ready(CHALLENGE, 1)).reason, 'challenge')
  assert.equal(fixture.onMessage(ready('e'.repeat(64), 2)).grant.parentGeneration, 8)
  decision = 7
  assert.equal(fixture.onMessage(ready('f'.repeat(64), 3)).reason, 'decision')
  assert.deepEqual(posted.map((message) => message.parentGeneration), [7, 8])
  assert.equal(iframe.removed, false)
})

test('bootstrap status names inactive, requested, denied and inserted states', () => {
  const status = { textContent: '' }
  const body = { children: [], appendChild(child) { this.children.push(child) } }
  const parent = { id: 'parent' }
  const listeners = []
  let readyMessage = null
  parent.postMessage = (message) => { readyMessage = message }
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  globalThis.document = {
    body,
    getElementById: () => status,
    createElement(tag) { return { tag, attrs: [], children: [], setAttribute(name, value) { this.attrs.push([name, value]) }, appendChild(child) { this.children.push(child) } } },
    createTextNode(value) { return { text: value } },
  }
  globalThis.window = {
    location: { origin: CHILD_ORIGIN, pathname: '/embed/discovercars' },
    parent,
    addEventListener(_type, handler) { listeners.push(handler) },
  }
  try {
    const canary = parseExport('discovercars', '<div><script id="canary" src="https://canary.test/once.js" data-canary="1"></script></div>')
    const plan = {
      selected: true,
      provider: 'discovercars',
      policyId: 'synthetic-canary',
      artifactSha256: 'b'.repeat(64),
      childOrigin: CHILD_ORIGIN,
      parentOrigin: PARENT_ORIGIN,
      protocolRevision: 1,
      nodes: canary.nodes,
    }
    startProductionShell({ provider: 'discovercars', childOrigin: CHILD_ORIGIN, parentOrigin: PARENT_ORIGIN, plan })
    assert.equal(status.textContent, 'Eine Freigabe wurde angefragt. Es ist noch kein Anbieter geladen.')
    listeners[0]({
      source: parent,
      origin: PARENT_ORIGIN,
      data: {
        type: 'jetnity-widget-host',
        revision: 1,
        kind: 'grant',
        provider: 'discovercars',
        challenge: readyMessage.challenge,
        frameGeneration: 1,
        parentGeneration: 1,
        policyId: 'synthetic-canary',
        artifactSha256: 'b'.repeat(64),
      },
    })
    assert.equal(status.textContent, 'Ein Skript wurde eingefügt. Das belegt kein funktionierendes Anbieterformular.')
    assert.equal(body.children.length, 1)
    listeners.length = 0
    body.children.length = 0
    startProductionShell({ provider: 'discovercars', childOrigin: CHILD_ORIGIN, parentOrigin: PARENT_ORIGIN, plan: null })
    listeners[0]({
      source: parent,
      origin: PARENT_ORIGIN,
      data: {
        type: 'jetnity-widget-host',
        revision: 1,
        kind: 'grant',
        provider: 'discovercars',
        challenge: readyMessage.challenge,
        frameGeneration: 1,
        parentGeneration: 1,
        policyId: 'synthetic-canary',
        artifactSha256: 'b'.repeat(64),
      },
    })
    assert.equal(status.textContent, 'Die Freigabe wurde abgelehnt. Es ist kein Anbieter geladen.')
  } finally {
    globalThis.window = previousWindow
    globalThis.document = previousDocument
  }
})

test('a pending parent intent times out by removing the frame', () => {
  const iframe = { contentWindow: { id: 'child' }, removed: false, remove() { this.removed = true } }
  const fixture = createParentFixture({
    provider: 'twelvego',
    childOrigin: CHILD_ORIGIN,
    iframe,
    parentGeneration: 3,
    policyId: 'reviewed-synthetic',
    artifactSha256: TWELVE_SHA,
    allowsGrant: () => false,
    postToChild() {},
    timeoutMs: 30,
  })
  return new Promise((resolve) => {
    setTimeout(() => {
      assert.equal(iframe.removed, true)
      assert.equal(fixture.destroyed, true)
      resolve()
    }, 60)
  })
})
