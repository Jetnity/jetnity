import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

import { chromium } from 'playwright'

import { buildShell } from '../../apps/widgets-host/lib/decide.mjs'

const runtime = readFileSync(new URL('../../apps/widgets-host/lib/host-runtime.mjs', import.meta.url), 'utf8')
const sha = 'b'.repeat(64)
const blocked = []

function page(title, script) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><p>${title}</p><script type="module">${script}</script></body></html>`
}

function childScript(defer) {
  return `
import { createController } from './host-runtime.mjs'
const parentOrigin = new URLSearchParams(location.search).get('parent')
const plan = { sha256: '${sha}', nodes: [{ kind: 'element', tag: 'div', attributes: [], children: [
  { kind: 'script', tag: 'script', attributes: [['id','canary'],['src','https://canary.test/once.js'],['data-canary','1']], children: [] }
]}]}
createController({
  provider: 'discovercars',
  childOrigin: location.origin,
  parentOrigin,
  document,
  mount: document.body,
  readLocationOrigin: () => location.origin,
  readPathProvider: () => 'discovercars',
  isTopLevel: () => window.parent === window,
  parentWindow: () => window.parent,
  postToParent: (message) => window.parent.postMessage(message, parentOrigin),
  randomChallenge: () => '${'a'.repeat(64)}',
  select: () => ({ selected: true, policyId: 'synthetic-canary', artifactSha256: '${sha}' }),
  artifact: () => plan,
  deferInsert: ${defer ? 500 : 'undefined'},
  listen(handler) {
    window.addEventListener('message', (event) => {
      const result = handler(event)
      if (result && result.pending) window.parent.postMessage({ harness: 'pending' }, parentOrigin)
      if (result && result.inserted) window.parent.postMessage({ harness: 'inserted' }, parentOrigin)
    })
  },
}).ready()
`
}

function parentScript(mode) {
  return `
import { createParentFixture } from './host-runtime.mjs'
const params = new URLSearchParams(location.search)
const childOrigin = params.get('child')
const iframe = document.createElement('iframe')
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
const fixture = createParentFixture({
  provider: 'discovercars',
  childOrigin,
  iframe,
  parentGeneration: 1,
  policyId: 'synthetic-canary',
  artifactSha256: '${sha}',
  allowsGrant: () => true,
  postToChild(grant) {
    iframe.contentWindow.postMessage(grant, childOrigin)
    if (${mode === 'replay' ? 'true' : 'false'}) iframe.contentWindow.postMessage(grant, childOrigin)
  },
})
window.addEventListener('message', (event) => {
  if (event.origin !== childOrigin) return
  if (event.data && event.data.harness === 'pending') {
    fixture.destroy()
    document.body.dataset.destroyed = '1'
    return
  }
  if (event.data && event.data.harness === 'inserted') {
    document.body.dataset.inserted = String(Number(document.body.dataset.inserted || '0') + 1)
    return
  }
  fixture.onMessage(event)
})
iframe.src = params.get('src')
document.body.appendChild(iframe)
`
}

function listen(routes) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    const hit = routes[url.pathname]
    if (!hit) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('missing')
      return
    }
    res.writeHead(200, { 'content-type': hit.type, 'cache-control': 'no-store' })
    res.end(hit.body)
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function overflow(page, width, height) {
  await page.setViewportSize({ width, height })
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    controls: document.querySelectorAll('a,button,input,iframe,form').length,
  }))
}

const parent = await listen({
  '/host-runtime.mjs': { type: 'text/javascript; charset=utf-8', body: runtime },
  '/replay': { type: 'text/html; charset=utf-8', body: page('replay', parentScript('replay')) },
  '/teardown': { type: 'text/html; charset=utf-8', body: page('teardown', parentScript('teardown')) },
})
const child = await listen({
  '/host-runtime.mjs': { type: 'text/javascript; charset=utf-8', body: runtime },
  '/insert': { type: 'text/html; charset=utf-8', body: page('insert', childScript(false)) },
  '/defer': { type: 'text/html; charset=utf-8', body: page('defer', childScript(true)) },
})

const browser = await chromium.launch({
  args: ['--host-resolver-rules=MAP jetnity.test 127.0.0.1, MAP widgets.test 127.0.0.1'],
})
const context = await browser.newContext()
await context.route('**/*', async (route) => {
  const url = route.request().url()
  let hostname = ''
  try { hostname = new URL(url).hostname } catch { hostname = '' }
  const allowed = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === 'jetnity.test' || hostname === 'widgets.test'
  if (!allowed) {
    blocked.push(url)
    await route.abort('blockedbyclient')
    return
  }
  await route.continue()
})

try {
  const parentOrigin = `http://jetnity.test:${parent.port}`
  const childOrigin = `http://widgets.test:${child.port}`
  const replay = await context.newPage()
  const replayUrl = `${parentOrigin}/replay?child=${encodeURIComponent(childOrigin)}&src=${encodeURIComponent(`${childOrigin}/insert?parent=${encodeURIComponent(parentOrigin)}`)}`
  await replay.goto(replayUrl, { waitUntil: 'domcontentloaded' })
  await replay.waitForFunction(() => document.body.dataset.inserted === '1', null, { timeout: 10000 })
  await replay.waitForTimeout(400)
  const inserted = await replay.locator('body').getAttribute('data-inserted')
  const canaryHits = blocked.filter((url) => url.includes('canary.test'))
  if (inserted !== '1' || canaryHits.length !== 1) {
    throw new Error(`replay insert failed inserted=${inserted} canary=${canaryHits.length}`)
  }
  console.log('PASS one canary insert and replay did not duplicate it')

  const before = blocked.length
  const teardown = await context.newPage()
  const teardownUrl = `${parentOrigin}/teardown?child=${encodeURIComponent(childOrigin)}&src=${encodeURIComponent(`${childOrigin}/defer?parent=${encodeURIComponent(parentOrigin)}`)}`
  await teardown.goto(teardownUrl, { waitUntil: 'domcontentloaded' })
  await teardown.waitForFunction(() => document.body.dataset.destroyed === '1', null, { timeout: 10000 })
  const frameCount = await teardown.locator('iframe').count()
  if (frameCount !== 0) throw new Error('iframe was not removed')
  await teardown.waitForTimeout(700)
  const late = blocked.slice(before).filter((url) => url.includes('canary.test'))
  if (late.length !== 0) throw new Error(`pending canary survived teardown: ${late.length}`)
  console.log('PASS real iframe teardown stopped the pending canary')

  const storageA = await context.newPage()
  await storageA.goto(`${childOrigin}/insert?parent=${encodeURIComponent(parentOrigin)}`)
  await storageA.evaluate(() => localStorage.setItem('shared-provider', 'canary'))
  const storageB = await context.newPage()
  await storageB.goto(`${childOrigin}/defer?parent=${encodeURIComponent(parentOrigin)}`)
  const shared = await storageB.evaluate(() => localStorage.getItem('shared-provider'))
  if (shared !== 'canary') throw new Error('same-child-origin storage capability was not observable')
  console.log('PASS same-child-origin storage capability recorded by the harness canary')

  const cookiePage = await context.newPage()
  await cookiePage.goto(`${childOrigin}/insert?parent=${encodeURIComponent(parentOrigin)}`)
  await cookiePage.evaluate(() => {
    document.cookie = 'cross=1; Domain=jetnity.test; Path=/'
    document.cookie = 'broad=1; Domain=jetnity.com; Path=/'
  })
  const parentCookies = await context.cookies(parentOrigin)
  if (parentCookies.some((item) => item.name === 'cross' || item.name === 'broad')) {
    throw new Error('child wrote a parent-site cookie')
  }
  console.log('PASS child origin did not set a jetnity.test or jetnity.com cookie')

  const shell = buildShell('discovercars')
  const layout = await context.newPage()
  await layout.setContent(shell.html, { waitUntil: 'domcontentloaded' })
  for (const width of [320, 390, 768, 1440]) {
    const result = await overflow(layout, width, 800)
    if (result.overflow || result.controls !== 0) throw new Error(`layout ${width} overflow=${result.overflow} controls=${result.controls}`)
  }
  const zoomed = await browser.newContext({ bypassCSP: true })
  const zoomPage = await zoomed.newPage()
  await zoomPage.setContent(shell.html, { waitUntil: 'domcontentloaded' })
  await zoomPage.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  for (const width of [320, 390, 768, 1440]) {
    const result = await overflow(zoomPage, width, 900)
    if (result.overflow) throw new Error(`200% font overflow at ${width}`)
  }
  await zoomed.close()
  await layout.focus('body')
  await layout.keyboard.press('Tab')
  const active = await layout.evaluate(() => document.activeElement && document.activeElement.tagName)
  if (active === 'BUTTON' || active === 'A' || active === 'INPUT') throw new Error(`unexpected focus ${active}`)
  console.log('PASS shell layout at 320/390/768/1440 and 200% root font')
  console.log('browser-harness PASS')
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
  parent.server.close()
  child.server.close()
}
