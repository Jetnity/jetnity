/**
 * Inlined into the embed shell as a module script. This file must not import
 * other modules and must not contain provider URLs or artifact bytes.
 * Protocol revision 1. Production plans are supplied by the server and are
 * empty while every registry entry stays unselected.
 */

export const PROTOCOL_TYPE = 'jetnity-widget-host'
export const PROTOCOL_REVISION = 1
export const PARENT_ORIGIN = 'https://jetnity.com'
export const CHILD_ORIGIN = 'https://jetnity-widgets.vercel.app'
export const CHILD_HOST = 'jetnity-widgets.vercel.app'
export const PROVIDERS = Object.freeze(['discovercars', 'twelvego'])

const SCRIPT_CLOSE = '<'.concat('/script>')
const READY_KEYS = Object.freeze(['type', 'revision', 'kind', 'provider', 'challenge', 'frameGeneration'])
const GRANT_KEYS = Object.freeze([
  'type',
  'revision',
  'kind',
  'provider',
  'challenge',
  'frameGeneration',
  'parentGeneration',
  'policyId',
  'artifactSha256',
])
const REVOKE_KEYS = Object.freeze(['type', 'revision', 'kind', 'provider', 'frameGeneration'])
const KEYS = Object.freeze({ ready: READY_KEYS, grant: GRANT_KEYS, revoke: REVOKE_KEYS })
const MAX_MESSAGE = 2048

function fail(reason) {
  return { ok: false, reason }
}

function isProvider(value) {
  return value === 'discovercars' || value === 'twelvego'
}

function isHex(value, length) {
  return typeof value === 'string' && value.length === length && /^[a-f0-9]+$/.test(value)
}

function isGeneration(value) {
  return Number.isInteger(value) && value >= 0 && value <= 1000000
}

export function randomChallenge() {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function parseMessage(data) {
  let value = data
  if (typeof value === 'string') {
    if (value.length > MAX_MESSAGE) return fail('size')
    try {
      value = JSON.parse(value)
    } catch {
      return fail('malformed')
    }
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail('malformed')
  let encoded = ''
  try {
    encoded = JSON.stringify(value)
  } catch {
    return fail('malformed')
  }
  if (encoded.length > MAX_MESSAGE) return fail('size')
  const kind = value.kind
  const allowed = KEYS[kind]
  if (!allowed) return fail('kind')
  const keys = Object.keys(value)
  if (keys.length !== allowed.length || allowed.some((key) => !keys.includes(key))) return fail('fields')
  if (value.type !== PROTOCOL_TYPE || value.revision !== PROTOCOL_REVISION) return fail('revision')
  if (!isProvider(value.provider)) return fail('provider')
  if (!isGeneration(value.frameGeneration)) return fail('generation')
  if (kind === 'ready' || kind === 'grant') {
    if (!isHex(value.challenge, 64)) return fail('challenge')
  }
  if (kind === 'grant') {
    if (!isGeneration(value.parentGeneration)) return fail('generation')
    if (typeof value.policyId !== 'string' || !/^[a-z0-9-]{1,64}$/.test(value.policyId)) return fail('policy')
    if (!isHex(value.artifactSha256, 64)) return fail('artifact')
  }
  for (const key of keys) {
    const item = value[key]
    if (typeof item === 'string' && (item.includes('<') || item.includes('://') || item.includes('//'))) {
      return fail('payload')
    }
  }
  return { ok: true, message: value }
}

function skipSpace(source, index) {
  let cursor = index
  while (source[cursor] === ' ' || source[cursor] === '\n' || source[cursor] === '\t') cursor += 1
  return cursor
}

function parseAttributes(source, index) {
  const attributes = []
  let cursor = index
  while (cursor < source.length) {
    cursor = skipSpace(source, cursor)
    if (source[cursor] === '>' || source.startsWith('/>', cursor)) break
    const nameStart = cursor
    while (cursor < source.length && /[A-Za-z0-9_:-]/.test(source[cursor])) cursor += 1
    if (cursor === nameStart) return fail('attribute')
    const name = source.slice(nameStart, cursor)
    if (name.toLowerCase().startsWith('on')) return fail('handler')
    cursor = skipSpace(source, cursor)
    if (source[cursor] !== '=') return fail('attribute')
    cursor += 1
    cursor = skipSpace(source, cursor)
    let value = ''
    const quote = source[cursor]
    if (quote === '"' || quote === "'") {
      cursor += 1
      const end = source.indexOf(quote, cursor)
      if (end < 0) return fail('attribute')
      value = source.slice(cursor, end)
      cursor = end + 1
    } else {
      const valueStart = cursor
      while (cursor < source.length && source[cursor] !== ' ' && source[cursor] !== '>') cursor += 1
      value = source.slice(valueStart, cursor)
    }
    if (value.includes('\\') || value.toLowerCase().includes('javascript:')) return fail('attribute')
    attributes.push([name, value])
  }
  return { ok: true, attributes, cursor }
}

function validatePlan(provider, nodes) {
  if (provider === 'discovercars') {
    if (nodes.length !== 1 || nodes[0].kind !== 'element' || nodes[0].tag !== 'div') return fail('shape')
    if (nodes[0].attributes.length !== 0 || nodes[0].children.length !== 1) return fail('shape')
    const script = nodes[0].children[0]
    if (!script || script.kind !== 'script') return fail('shape')
    if (!script.attributes.some(([name]) => name === 'src')) return fail('shape')
    return { ok: true }
  }
  if (provider === 'twelvego') {
    if (nodes.length !== 2 || nodes[0].kind !== 'script' || nodes[1].kind !== 'element') return fail('shape')
    const panel = nodes[1]
    if (panel.tag !== 'div' || panel.attributes.length !== 1 || panel.attributes[0][0] !== 'id' || panel.attributes[0][1] !== 'powered') {
      return fail('shape')
    }
    if (panel.children.length !== 2) return fail('shape')
    const [text, link] = panel.children
    if (!text || text.kind !== 'text' || text.value !== 'Powered by ') return fail('shape')
    if (!link || link.kind !== 'element' || link.tag !== 'a' || link.children.length !== 1) return fail('shape')
    if (link.children[0].kind !== 'text' || link.children[0].value !== '12Go system') return fail('shape')
    if (!nodes[0].attributes.some(([name]) => name === 'src')) return fail('shape')
    if (!link.attributes.some(([name]) => name === 'href')) return fail('shape')
    return { ok: true }
  }
  return fail('provider')
}

export function parseExport(provider, source) {
  if (!isProvider(provider) || typeof source !== 'string' || source.length > 4096) return fail('provider')
  const nodes = []
  const stack = []
  let cursor = 0
  function append(node) {
    if (stack.length === 0) nodes.push(node)
    else stack[stack.length - 1].children.push(node)
  }
  while (cursor < source.length) {
    if (source[cursor] !== '<') {
      const end = source.indexOf('<', cursor)
      const text = source.slice(cursor, end < 0 ? source.length : end)
      if (text.length === 0) break
      append({ kind: 'text', value: text })
      cursor = end < 0 ? source.length : end
      continue
    }
    if (source.startsWith('</', cursor)) {
      const closeEnd = source.indexOf('>', cursor)
      if (closeEnd < 0) return fail('markup')
      const tag = source.slice(cursor + 2, closeEnd)
      const current = stack.pop()
      if (!current || current.tag !== tag) return fail('markup')
      cursor = closeEnd + 1
      continue
    }
    const nameStart = cursor + 1
    let nameEnd = nameStart
    while (nameEnd < source.length && /[A-Za-z0-9]/.test(source[nameEnd])) nameEnd += 1
    const tag = source.slice(nameStart, nameEnd)
    if (tag !== 'div' && tag !== 'script' && tag !== 'a') return fail('tag')
    const parsed = parseAttributes(source, nameEnd)
    if (!parsed.ok) return parsed
    if (source[parsed.cursor] !== '>') return fail('markup')
    cursor = parsed.cursor + 1
    if (tag === 'script') {
      if (!source.startsWith(SCRIPT_CLOSE, cursor)) return fail('script')
      append({ kind: 'script', tag: 'script', attributes: parsed.attributes, children: [] })
      cursor += SCRIPT_CLOSE.length
      continue
    }
    const element = { kind: 'element', tag, attributes: parsed.attributes, children: [] }
    append(element)
    stack.push(element)
  }
  if (stack.length !== 0) return fail('markup')
  const shape = validatePlan(provider, nodes)
  if (!shape.ok) return shape
  return { ok: true, provider, nodes }
}

export function insertionValue(name, value) {
  if (name === 'src' && typeof value === 'string' && value.startsWith('//')) return `https:${value}`
  return value
}

export function insertFromPlan(document, plan, mount) {
  if (!plan || !Array.isArray(plan.nodes) || plan.nodes.length === 0) return fail('plan')
  const created = []
  function build(node) {
    if (node.kind === 'text') return document.createTextNode(node.value)
    const element = document.createElement(node.tag)
    for (const [name, value] of node.attributes) {
      element.setAttribute(name, insertionValue(name, value))
    }
    for (const child of node.children || []) element.appendChild(build(child))
    return element
  }
  for (const node of plan.nodes) {
    const element = build(node)
    mount.appendChild(element)
    created.push(element)
  }
  return { ok: true, created }
}

export function createController(deps) {
  let challenge = null
  let spent = false
  let generation = 1
  let inserted = false
  let disposed = false
  let pending = null

  function still(expected) {
    return !disposed && generation === expected && !inserted
  }

  function cancel() {
    if (typeof deps.cancelPending === 'function') deps.cancelPending()
    if (pending) {
      clearTimeout(pending)
      pending = null
    }
  }

  const controller = {
    get generation() {
      return generation
    },
    still,
    ready() {
      if (disposed) return fail('disposed')
      if (inserted) return fail('inserted')
      if (deps.readLocationOrigin() !== deps.childOrigin) return fail('child-origin')
      if (deps.isTopLevel()) return fail('top-level')
      if (deps.readPathProvider() !== deps.provider) return fail('path')
      challenge = deps.randomChallenge()
      spent = false
      const message = {
        type: PROTOCOL_TYPE,
        revision: PROTOCOL_REVISION,
        kind: 'ready',
        provider: deps.provider,
        challenge,
        frameGeneration: generation,
      }
      deps.postToParent(message)
      return { ok: true, message }
    },
    onMessage(event) {
      if (disposed) return fail('disposed')
      if (!event || event.source !== deps.parentWindow()) return fail('source')
      if (event.origin !== deps.parentOrigin) return fail('parent-origin')
      const parsed = parseMessage(event.data)
      if (!parsed.ok) return parsed
      const message = parsed.message
      if (message.provider !== deps.provider) return fail('provider')
      if (message.kind === 'revoke') {
        if (message.frameGeneration !== generation) return fail('generation')
        generation += 1
        spent = true
        challenge = null
        cancel()
        return { ok: true, revoked: true }
      }
      if (message.kind !== 'grant') return fail('kind')
      if (message.frameGeneration !== generation) return fail('generation')
      if (spent || message.challenge !== challenge) return fail('challenge')
      const selection = deps.select(deps.provider)
      if (!selection || selection.selected !== true) return fail('unselected')
      if (selection.policyId !== message.policyId || selection.artifactSha256 !== message.artifactSha256) {
        return fail('selection')
      }
      const plan = deps.artifact(deps.provider)
      if (!plan || plan.sha256 !== message.artifactSha256) return fail('artifact')
      spent = true
      const accepted = challenge
      challenge = null
      if (inserted) return fail('duplicate')
      const expected = generation
      const commit = () => {
        if (!still(expected) || inserted) return fail('stale')
        const placed = insertFromPlan(deps.document, plan, deps.mount)
        if (!placed.ok) return placed
        inserted = true
        return { ok: true, inserted: true }
      }
      if (deps.deferInsert) {
        pending = setTimeout(() => {
          pending = null
          commit()
        }, deps.deferInsert)
        return { ok: true, pending: true, challenge: accepted }
      }
      return commit()
    },
    dispose() {
      disposed = true
      generation += 1
      spent = true
      challenge = null
      cancel()
    },
  }

  if (typeof deps.listen === 'function') deps.listen((event) => controller.onMessage(event))
  return controller
}

export function createParentFixture(deps) {
  let destroyed = false
  function onMessage(event) {
    if (destroyed) return fail('destroyed')
    if (!event || event.origin !== deps.childOrigin) return fail('origin')
    if (!deps.iframe || event.source !== deps.iframe.contentWindow) return fail('source')
    const parsed = parseMessage(event.data)
    if (!parsed.ok) return parsed
    if (parsed.message.kind !== 'ready') return fail('not-ready')
    if (parsed.message.provider !== deps.provider || parsed.message.revision !== PROTOCOL_REVISION) {
      return fail('provider')
    }
    if (deps.allowsGrant() !== true) return fail('decision')
    const grant = {
      type: PROTOCOL_TYPE,
      revision: PROTOCOL_REVISION,
      kind: 'grant',
      provider: deps.provider,
      challenge: parsed.message.challenge,
      frameGeneration: parsed.message.frameGeneration,
      parentGeneration: deps.parentGeneration,
      policyId: deps.policyId,
      artifactSha256: deps.artifactSha256,
    }
    deps.postToChild(grant)
    return { ok: true, granted: true }
  }
  function destroy() {
    destroyed = true
    deps.parentGeneration += 1
    deps.iframe.remove()
  }
  return { onMessage, destroy, get destroyed() { return destroyed } }
}

export function startProductionShell(config) {
  const view = globalThis.window
  const document = globalThis.document
  if (!view || !document) return fail('environment')
  const plans = config && config.plans && typeof config.plans === 'object' ? config.plans : {}
  const plan = plans[config.provider] || null
  const controller = createController({
    provider: config.provider,
    childOrigin: config.childOrigin,
    parentOrigin: config.parentOrigin,
    document,
    mount: document.body,
    readLocationOrigin: () => view.location.origin,
    readPathProvider: () => {
      if (view.location.pathname === '/embed/discovercars') return 'discovercars'
      if (view.location.pathname === '/embed/twelvego') return 'twelvego'
      return null
    },
    isTopLevel: () => view.parent === view,
    parentWindow: () => view.parent,
    postToParent(message) {
      view.parent.postMessage(message, config.parentOrigin)
    },
    randomChallenge,
    select() {
      if (!plan || plan.selected !== true) return null
      return plan
    },
    artifact() {
      if (!plan || plan.selected !== true) return null
      return plan
    },
    listen(handler) {
      view.addEventListener('message', handler)
    },
  })
  const status = document.getElementById('jetnity-widget-status')
  const ready = controller.ready()
  if (status && !ready.ok) {
    status.textContent = 'Kein Anbieter ist geladen. Dieser Host bleibt inaktiv.'
  }
  return controller
}
