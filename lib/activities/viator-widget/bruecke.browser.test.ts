import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import { chromium, type Browser, type Page } from 'playwright'

import { viatorEmbedAntwort, viatorEmbedDokument } from '@/lib/activities/viator-widget/dokument'

const FIXTURE = join(process.cwd(), 'scripts/activities-destination-first-1/fixtures')
const WIDGET_JS = readFileSync(join(FIXTURE, 'widget.js'))
const WIDGET_MAIN = readFileSync(join(FIXTURE, 'widget-main.js'))

test('the saved official loader is the exact downloaded script', () => {
  assert.equal(createHash('sha256').update(WIDGET_JS).digest('hex'), 'aeda2e30daff0bd54400a437a643673821f59eea2569646264c21a6092723a45')
  assert.equal(createHash('sha256').update(WIDGET_MAIN).digest('hex'), 'defb4b73526a793acca4bea3863a0d2da3c54fedafadb57c5de24b214429bca7')
  assert.match(WIDGET_MAIN.toString('utf8'), /e\.origin===i&&e\.data\.id===`vi-wm`/)
  assert.equal(WIDGET_MAIN.toString('utf8').includes('allow-same-origin'), false)
})

function seite(mitBruecke: boolean): string {
  const embed = mitBruecke ? '/embed/viator?name=Bangkok' : '/ohne'
  return `<!doctype html><html><body>
<iframe id="aussen" title="Viator" credentialless referrerpolicy="no-referrer" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="width:390px;height:800px;border:0" src="${embed}"></iframe>
</body></html>`
}

async function messen(page: Page) {
  const frame = page.frames().find((eintrag) => eintrag.url().includes('/embed/viator') || eintrag.url().includes('/ohne'))
  if (!frame) return null
  return frame.evaluate(() => {
    const wrapper = document.querySelector('[data-vi-partner-id]')
    if (!wrapper) return { bereit: false }
    const iframe = wrapper.querySelector('iframe')
    return {
      bereit: true,
      display: (wrapper as HTMLElement).style.display,
      height: (wrapper as HTMLElement).style.height,
      frameHeight: iframe ? (iframe as HTMLElement).style.height : '',
      box: iframe ? Math.round(iframe.getBoundingClientRect().height) : 0,
    }
  })
}

describe('Viator opaque resize bridge', { timeout: 60_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    const ohne = viatorEmbedDokument('Bangkok').replace(/<script>\(function\(\)\{var MAX=[\s\S]*<\/script>/, '')
    server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/embed/viator') {
        const kopf = new Headers()
        for (const [name, wert] of Object.entries(req.headers)) {
          if (typeof wert === 'string') kopf.set(name, wert)
        }
        const ergebnis = viatorEmbedAntwort(new Request(`https://jetnity.test${url.pathname}${url.search}`, { headers: kopf }))
        res.statusCode = ergebnis.status
        ergebnis.headers.forEach((wert, name) => res.setHeader(name, wert))
        res.end(Buffer.from(await ergebnis.arrayBuffer()))
        return
      }
      if (url.pathname === '/ohne') {
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.end(ohne)
        return
      }
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(seite(url.pathname !== '/kontrolle'))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    } catch (fehler) {
      const meldung = fehler instanceof Error ? fehler.message : String(fehler)
      if (!meldung.includes("Executable doesn't exist")) throw fehler
      browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    }
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  })

  async function oeffnen(pfad: string): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.route('https://www.viator.com/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/orion/partner/widget-main.js')) {
        await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: WIDGET_MAIN })
        return
      }
      if (url.includes('/orion/partner/widget.js')) {
        await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: WIDGET_JS })
        return
      }
      if (url.includes('/widget/partner/')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: '<!doctype html><meta charset="utf-8"><script>parent.postMessage({id:"vi-wm",h:480,u:location.href},"*")</script>',
        })
        return
      }
      await route.abort()
    })
    await page.goto(`${origin}${pfad}`)
    return page
  }

  test('the official loader keeps a null-origin resize hidden, the owned bridge applies only that height', async () => {
    const kontrolle = await oeffnen('/kontrolle')
    assert.equal((await kontrolle.locator('#aussen').getAttribute('sandbox'))?.includes('allow-same-origin'), false)
    let ohne: Awaited<ReturnType<typeof messen>> = null
    for (let i = 0; i < 40; i += 1) {
      ohne = await messen(kontrolle)
      if (ohne?.display === 'none') break
      await kontrolle.waitForTimeout(50)
    }
    assert.equal(ohne?.bereit, true)
    assert.equal(ohne?.display, 'none')
    assert.equal(ohne?.box, 0)
    await kontrolle.close()

    const page = await oeffnen('/')
    let mit: Awaited<ReturnType<typeof messen>> = null
    for (let i = 0; i < 40; i += 1) {
      mit = await messen(page)
      if (mit?.height === '480px') break
      await page.waitForTimeout(50)
    }
    assert.equal(mit?.display, '')
    assert.equal(mit?.height, '480px')
    assert.equal(mit?.frameHeight, '100%')
    assert.ok((mit?.box ?? 0) >= 470 && (mit?.box ?? 0) <= 490, JSON.stringify(mit))
    const frame = page.frames().find((eintrag) => eintrag.url().includes('/embed/viator'))
    assert.ok(frame)
    await frame.evaluate(() => {
      window.postMessage({ id: 'vi-wm', h: 9000, u: 'javascript:alert(1)' }, '*')
    })
    await page.waitForTimeout(50)
    const nachher = await messen(page)
    assert.equal(nachher?.height, '480px')
    assert.equal(nachher?.display, '')
    await frame.evaluate(() => {
      document.querySelector('iframe')?.remove()
    })
    await frame.evaluate(() => {
      window.postMessage({ id: 'vi-other', h: 200, u: 'wd=abc' }, '*')
    })
    const weg = await messen(page)
    assert.equal(weg?.height, '480px')
    await page.close()
  })
})
