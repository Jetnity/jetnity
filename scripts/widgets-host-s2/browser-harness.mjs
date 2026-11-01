import { readFileSync } from 'node:fs'

import { chromium } from 'playwright'

import { buildShell } from '../../apps/widgets-host/lib/decide.mjs'
import { CHILD_ORIGIN, PARENT_ORIGIN } from '../../apps/widgets-host/lib/host-runtime.mjs'

const runtime = readFileSync(new URL('../../apps/widgets-host/lib/host-runtime.mjs', import.meta.url), 'utf8')
const sha = 'c'.repeat(64)
const seen = []

function canaryPlan(provider) {
  return {
    selected: true,
    provider,
    policyId: 'synthetic-canary',
    artifactSha256: sha,
    childOrigin: CHILD_ORIGIN,
    parentOrigin: PARENT_ORIGIN,
    protocolRevision: 1,
    sandbox: 'distinct-child-only',
    nodes: [{
      kind: 'script',
      tag: 'script',
      attributes: [['id', 'canary'], ['src', `${CHILD_ORIGIN}/canary/once.js`]],
      children: [],
    }],
  }
}

const onceJs = `const started = document.createElement('script');
started.src = '${CHILD_ORIGIN}/canary/started.js';
document.body.appendChild(started);
setTimeout(() => {
  const later = document.createElement('script');
  later.src = '${CHILD_ORIGIN}/canary/after.js';
  document.body.appendChild(later);
}, 600);
`

function parentHtml(provider) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>parent</title></head><body>
<p id="parent-status">parent</p>
<script type="module">
${runtime}
const params = new URLSearchParams(location.search)
const iframe = document.createElement('iframe')
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
let allows = params.get('mode') !== 'hold' && params.get('mode') !== 'timeout'
let decision = 7
const fixture = createParentFixture({
  provider: '${provider}',
  childOrigin: '${CHILD_ORIGIN}',
  iframe,
  parentGeneration: 7,
  currentDecision: () => decision,
  policyId: 'synthetic-canary',
  artifactSha256: '${sha}',
  allowsGrant: () => allows,
  timeoutMs: params.get('mode') === 'timeout' ? 200 : undefined,
  postToChild(grant) { iframe.contentWindow.postMessage(grant, '${CHILD_ORIGIN}') },
})
window.__jetnity = {
  release() { allows = true; decision = 8 },
  destroy() { fixture.destroy() },
  reload() { iframe.src = iframe.src },
}
window.addEventListener('message', (event) => {
  const result = fixture.onMessage(event)
  if (!result) return
  if (result.granted) document.body.dataset.grants = String(Number(document.body.dataset.grants || '0') + 1)
  if (result.reason) document.body.dataset.last = result.reason
  if (result.destroyed) document.body.dataset.destroyed = result.reason || '1'
})
iframe.src = params.get('src')
document.body.appendChild(iframe)
</script></body></html>`
}

function fulfill(route, { status = 200, headers = {}, body = '', contentType = 'text/html; charset=utf-8' }) {
  const merged = { 'content-type': contentType, 'cache-control': 'no-store', ...headers }
  return route.fulfill({ status, headers: merged, body })
}

const browser = await chromium.launch()
const context = await browser.newContext()
await context.route('**/*', async (route) => {
  seen.push(route.request().url())
  await route.abort('blockedbyclient')
})
await context.route(`${PARENT_ORIGIN}/**`, async (route) => {
  const url = route.request().url()
  seen.push(url)
  if (url.startsWith(`${PARENT_ORIGIN}/parent`)) {
    const provider = new URL(url).searchParams.get('provider') || 'discovercars'
    await fulfill(route, { body: parentHtml(provider) })
    return
  }
  await route.abort('blockedbyclient')
})
await context.route(`${CHILD_ORIGIN}/**`, async (route) => {
  const url = new URL(route.request().url())
  seen.push(url.href)
  if (url.pathname === '/embed/discovercars') {
    const shell = buildShell('discovercars', { plan: canaryPlan('discovercars') })
    await fulfill(route, { status: shell.status, headers: Object.fromEntries(shell.headers.entries()), body: shell.html })
    return
  }
  if (url.pathname === '/embed/twelvego') {
    const shell = buildShell('twelvego')
    await fulfill(route, { status: shell.status, headers: Object.fromEntries(shell.headers.entries()), body: shell.html })
    return
  }
  if (url.pathname === '/canary/once.js') {
    await fulfill(route, { body: onceJs, contentType: 'text/javascript; charset=utf-8' })
    return
  }
  if (url.pathname === '/canary/started.js') {
    await fulfill(route, { body: '/* started */', contentType: 'text/javascript; charset=utf-8' })
    return
  }
  if (url.pathname === '/same/a' || url.pathname === '/same/b') {
    const key = url.pathname.endsWith('/a') ? 'write' : 'read'
    const body = key === 'write'
      ? `<!DOCTYPE html><p id="marker">writer</p><script>localStorage.setItem('shared-provider','canary'); document.body.dataset.wrote='1'</script>`
      : `<!DOCTYPE html><p id="marker"></p><script>document.getElementById('marker').textContent = localStorage.getItem('shared-provider') || ''</script>`
    await fulfill(route, { body })
    return
  }
  await route.abort('blockedbyclient')
})

function unexpected() {
  return seen.filter((url) => {
    if (url.startsWith(`${PARENT_ORIGIN}/parent`)) return false
    if (url.startsWith(`${CHILD_ORIGIN}/embed/discovercars`)) return false
    if (url.startsWith(`${CHILD_ORIGIN}/embed/twelvego`)) return false
    if (url === `${CHILD_ORIGIN}/canary/once.js`) return false
    if (url === `${CHILD_ORIGIN}/canary/started.js`) return false
    if (url.startsWith(`${CHILD_ORIGIN}/same/`)) return false
    return true
  })
}

try {
  const insert = await context.newPage()
  const childEmbed = `${CHILD_ORIGIN}/embed/discovercars`
  await insert.goto(`${PARENT_ORIGIN}/parent?provider=discovercars&mode=hold&src=${encodeURIComponent(childEmbed)}`, { waitUntil: 'domcontentloaded' })
  await insert.waitForTimeout(400)
  if (await insert.locator('body').getAttribute('data-grants')) throw new Error('pending decision granted')
  await insert.evaluate(() => window.__jetnity.release())
  await insert.evaluate(() => window.__jetnity.reload())
  await insert.waitForFunction(() => document.body.dataset.grants === '1', null, { timeout: 10000 })
  const startedAt = Date.now()
  while (!seen.includes(`${CHILD_ORIGIN}/canary/started.js`) && Date.now() - startedAt < 5000) {
    await insert.waitForTimeout(50)
  }
  if (!seen.includes(`${CHILD_ORIGIN}/canary/started.js`)) throw new Error('local canary did not start')
  if (seen.filter((url) => url === `${CHILD_ORIGIN}/canary/once.js`).length !== 1) throw new Error('canary script was not exactly once')
  const insertedFrame = insert.frames().find((frame) => frame.url().startsWith(CHILD_ORIGIN))
  const insertedStatus = await insertedFrame.evaluate(() => document.getElementById('jetnity-widget-status').textContent)
  if (insertedStatus !== 'Ein Skript wurde eingefügt. Das belegt kein funktionierendes Anbieterformular.') {
    throw new Error(`status after insert: ${insertedStatus}`)
  }
  await insert.evaluate(() => window.__jetnity.destroy())
  await insert.waitForFunction(() => document.querySelector('iframe') === null)
  await insert.waitForTimeout(900)
  if (seen.includes(`${CHILD_ORIGIN}/canary/after.js`)) throw new Error('post-teardown canary ran')
  console.log('PASS real bootstrap inserted one local canary and teardown stopped the later script')

  const denied = await context.newPage()
  const deniedResponse = await denied.goto(`${CHILD_ORIGIN}/embed/twelvego`, { waitUntil: 'domcontentloaded' })
  const deniedCsp = deniedResponse.headers()['content-security-policy'] || ''
  if (!deniedCsp.includes("frame-ancestors https://jetnity.com")) throw new Error(`twelvego CSP ${deniedCsp}`)
  const deniedText = await denied.locator('#jetnity-widget-status').innerText()
  if (!deniedText.includes('Kein Anbieter ist geladen.')) throw new Error(deniedText)
  if (seen.filter((url) => url.includes('discovercars.com') || url.includes('12go.asia') || url.includes('trainbusferry')).length) {
    throw new Error('denied shell requested a vendor')
  }
  console.log('PASS denied twelvego shell kept its frame-ancestors header and loaded no vendor')

  const framed = await context.newPage()
  const beforeDenied = seen.length
  await framed.goto(`${PARENT_ORIGIN}/parent?provider=twelvego&mode=hold&src=${encodeURIComponent(`${CHILD_ORIGIN}/embed/twelvego`)}`, { waitUntil: 'domcontentloaded' })
  await framed.waitForTimeout(300)
  if (await framed.locator('body').getAttribute('data-grants')) throw new Error('pending decision granted')
  await framed.evaluate(() => window.__jetnity.release())
  await framed.evaluate(() => window.__jetnity.reload())
  await framed.waitForTimeout(500)
  const vendorAfter = seen.slice(beforeDenied).filter((url) => /discovercars\.com|12go\.asia|trainbusferry|canary\/once/.test(url))
  if (vendorAfter.length) throw new Error(`denied plan loaded ${vendorAfter.join(',')}`)
  console.log('PASS a fresh parent decision does not load a denied production plan')

  const timeout = await context.newPage()
  await timeout.goto(`${PARENT_ORIGIN}/parent?provider=discovercars&mode=timeout&src=${encodeURIComponent(childEmbed)}`, { waitUntil: 'domcontentloaded' })
  await timeout.waitForFunction(() => document.querySelector('iframe') === null, null, { timeout: 4000 })
  console.log('PASS parent intent timeout removes the iframe')

  const storage = await context.newPage()
  await storage.goto(`${CHILD_ORIGIN}/same/a`, { waitUntil: 'domcontentloaded' })
  const reader = await context.newPage()
  await reader.goto(`${CHILD_ORIGIN}/same/b`, { waitUntil: 'domcontentloaded' })
  const shared = await reader.locator('#marker').innerText()
  if (shared !== 'canary') throw new Error(`shared storage ${shared}`)
  console.log('PASS same-child-origin storage is shared and is not provider isolation')

  const cookieParent = await context.newPage()
  await cookieParent.goto(`${PARENT_ORIGIN}/parent?provider=discovercars&mode=hold&probe=cookie&src=${encodeURIComponent(`${CHILD_ORIGIN}/embed/discovercars`)}`, { waitUntil: 'domcontentloaded' })
  await cookieParent.waitForFunction(() => document.querySelector('iframe') !== null)
  await cookieParent.evaluate(() => { document.body.dataset.secret = 'parent-only' })
  const childFrame = cookieParent.frames().find((frame) => frame.url().startsWith(CHILD_ORIGIN))
  if (!childFrame) throw new Error(`missing child frame: ${cookieParent.frames().map((frame) => frame.url()).join(' | ')}`)
  const crossed = await childFrame.evaluate(() => {
    let dom = 'blocked'
    try { dom = window.parent.document.body.dataset.secret } catch { dom = 'blocked' }
    document.cookie = 'broad=1; Domain=jetnity.com; Path=/'
    return dom
  })
  if (crossed !== 'blocked') throw new Error('child read parent DOM')
  const parentCookies = await context.cookies(PARENT_ORIGIN)
  if (parentCookies.some((item) => item.name === 'broad' || item.domain === 'jetnity.com' || item.domain === '.jetnity.com')) {
    throw new Error(`parent cookies ${JSON.stringify(parentCookies)}`)
  }
  console.log('PASS child origin cannot read parent DOM or set a jetnity.com cookie')

  for (const width of [320, 390, 768, 1440]) {
    const layout = await context.newPage()
    await layout.setViewportSize({ width, height: 800 })
    await layout.goto(`${CHILD_ORIGIN}/embed/twelvego`, { waitUntil: 'domcontentloaded' })
    const overflow = await layout.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    const controls = await layout.locator('a,button,input,form').count()
    if (overflow || controls !== 0) throw new Error(`layout ${width} overflow=${overflow} controls=${controls}`)
    await layout.close()
  }
  console.log('PASS inactive shell layout under the served CSP')
  const font = await context.newPage()
  await font.setViewportSize({ width: 320, height: 900 })
  await font.goto(`${CHILD_ORIGIN}/embed/twelvego`, { waitUntil: 'domcontentloaded' })
  const fontResult = await font.evaluate(() => {
    const sheet = document.querySelector('style')?.sheet
    if (!sheet) return { ok: false, reason: 'no-sheet' }
    sheet.insertRule('html{font-size:200%}', sheet.cssRules.length)
    return {
      ok: true,
      font: getComputedStyle(document.documentElement).fontSize,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  })
  if (!fontResult.ok || fontResult.font !== '32px' || fontResult.overflow) {
    throw new Error(`200% font ${JSON.stringify(fontResult)}`)
  }
  await font.close()
  console.log('PASS 200% root font under the served stylesheet')

  const bad = unexpected()
  if (bad.length) throw new Error(`unexpected requests: ${[...new Set(bad)].join(', ')}`)
  console.log('browser-harness PASS')
} catch (error) {
  console.error(error)
  console.error([...new Set(seen)])
  process.exitCode = 1
} finally {
  await browser.close()
}
