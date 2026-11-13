import { atlasServerActions } from '@/scripts/trip-plan-browser/server-actions'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import { mountU1cWorkspace } from '@/lib/trips/ux-u1c-route-design-alignment-1/workspace-harness'

test('the workspace harness stays on the test import path', () => {
  assert.equal(typeof mountU1cWorkspace, 'function')
})

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

async function projektCss(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const from = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  return ergebnis.css.replaceAll('</style', '<\\/style')
}

async function bundeln(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/ux-u1c-route-design-alignment-1/workspace-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'u1c-workspace-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [atlasServerActions, {
      name: 'u1c-shims',
      setup(build) {
        build.onResolve({ filter: /\.css$/ }, () => ({ path: 'css', namespace: 'u1c-css' }))
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: join(process.cwd(), 'scripts/trip-personal-preparation-workflow-completion-1/shims/dynamic.tsx') }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'u1c-css' }, () => ({ contents: '', loader: 'js' }))
        build.onLoad({ filter: /.*/, namespace: 'u1c-leer' }, () => ({
          contents: [
            'export default function(){return null}',
            'export function cookies(){return {get(){return undefined},set(){},delete(){}}}',
            'export function headers(){return {get(){return null}}}',
            'export function draftMode(){return {isEnabled:false}}',
            'export function revalidatePath(){}',
            'export function revalidateTag(){}',
            'export function unstable_cache(fn){return fn}',
            'export function redirect(){}',
            'export function permanentRedirect(){}',
            'export function notFound(){}',
            'export function useRouter(){return {push(){},replace(){},refresh(){},back(){},forward(){}}}',
            'export function usePathname(){return "/"}',
            'export function useSearchParams(){return new URLSearchParams()}',
            'export function useParams(){return {}}',
            'export function useSelectedLayoutSegments(){return []}',
            'export function useFormStatus(){return {pending:false}}',
          ].join(';'),
          loader: 'js',
        }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('u1c workspace bundle was empty')
  return js
}

function weissMinzeCss(): { css: string, canvas: string, rgb: string } {
  const datei = join(process.cwd(), 'styles/white-mint.css')
  const css = readFileSync(datei, 'utf8')
  const token = css.match(/--white-mint-canvas:\s*(#[0-9a-fA-F]{6})/)
  const hex = token?.[1]
  if (!hex || !css.includes('.workspace-shell[data-workspace-theme="light"]')) {
    throw new Error('styles/white-mint.css is missing the light workspace canvas')
  }
  const kanal = (start: number) => Number.parseInt(hex.slice(start, start + 2), 16)
  return { css, canvas: hex.toLowerCase(), rgb: `rgb(${kanal(1)}, ${kanal(3)}, ${kanal(5)})` }
}

function html(css: string, js: string) {
  const mint = weissMinzeCss()
  const stil = `${css}\n${mint.css}\n${shellCss()}`.replaceAll('</style', '<\\/style')
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${stil}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function lichtePalette(page: Page) {
  const mint = weissMinzeCss()
  const gemessen = await page.evaluate(() => {
    const schale = document.querySelector('.workspace-shell')
    const eng = (farbe: string) => farbe.replace(/\s+/g, '')
    const blatt = [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n')
    return {
      thema: schale?.getAttribute('data-workspace-theme') ?? '',
      variable: getComputedStyle(document.documentElement).getPropertyValue('--white-mint-canvas').trim().toLowerCase(),
      dokument: eng(getComputedStyle(document.documentElement).backgroundColor),
      schale: schale instanceof HTMLElement ? eng(getComputedStyle(schale).backgroundColor) : '',
      geladen: blatt.includes('--white-mint-canvas') && blatt.includes('.workspace-shell[data-workspace-theme="light"]'),
    }
  })
  assert.equal(gemessen.geladen, true, JSON.stringify(gemessen))
  assert.equal(gemessen.thema, 'light', JSON.stringify(gemessen))
  assert.equal(gemessen.variable, mint.canvas, JSON.stringify(gemessen))
  assert.equal(gemessen.dokument, mint.rgb.replace(/\s+/g, ''), JSON.stringify(gemessen))
  assert.equal(gemessen.schale, mint.rgb.replace(/\s+/g, ''), JSON.stringify(gemessen))
}

async function browserStarten() {
  try {
    return await chromium.launch({ headless: true, args: BROWSER_ARGS })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
  }
}

async function plan(page: Page) {
  await page.waitForSelector('[data-workspace-theme]')
  await page.getByRole('button', { name: 'Reiseplan', exact: true }).first().click()
  const route = page.locator('[data-u1c-route]')
  if (!(await route.isVisible())) {
    const zurueck = page.locator('[data-u1b-zur-route]')
    if (await zurueck.isVisible()) await zurueck.click()
  }
  await route.waitFor({ state: 'visible' })
}

function shellCss(): string {
  return ['components/workspace/workspace.css', 'components/workspace/workspace-surfaces.css', 'components/trips/reiseplan/etappen.css', 'components/trips/organisieren/auswahl/suchauswahl.css']
    .map((datei) => readFileSync(join(process.cwd(), datei), 'utf8'))
    .join('\n')
}

async function textKontrast(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const gelesen = (farbe: string) => {
      const modern = farbe.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
      if (modern) {
        return {
          r: Math.round(Number(modern[1]) * 255),
          g: Math.round(Number(modern[2]) * 255),
          b: Math.round(Number(modern[3]) * 255),
          a: 1,
        }
      }
      const werte = farbe.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!werte) return null
      return { r: Number(werte[1]), g: Number(werte[2]), b: Number(werte[3]), a: werte[4] == null ? 1 : Number(werte[4]) }
    }
    const misch = (
      unten: { r: number, g: number, b: number, a: number },
      oben: { r: number, g: number, b: number, a: number },
    ) => {
      const a = oben.a + unten.a * (1 - oben.a)
      const kanal = (links: number, rechts: number) => Math.round((rechts * oben.a + links * unten.a * (1 - oben.a)) / (a || 1))
      return { r: kanal(unten.r, oben.r), g: kanal(unten.g, oben.g), b: kanal(unten.b, oben.b), a }
    }
    const grund = (start: Element) => {
      const schichten: { r: number, g: number, b: number, a: number }[] = []
      let knoten: Element | null = start
      while (knoten) {
        const farbe = gelesen(getComputedStyle(knoten).backgroundColor)
        if (farbe && farbe.a > 0) schichten.push(farbe)
        if (farbe && farbe.a >= 0.99) break
        knoten = knoten.parentElement
      }
      let bild = { r: 255, g: 255, b: 255, a: 1 }
      for (const schicht of schichten.reverse()) bild = misch(bild, schicht)
      return bild
    }
    const kanal = (wert: number) => {
      const v = wert / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    const helligkeit = (rgb: { r: number, g: number, b: number }) => 0.2126 * kanal(rgb.r) + 0.7152 * kanal(rgb.g) + 0.0722 * kanal(rgb.b)
    const text = gelesen(getComputedStyle(el).color)
    const hintergrund = grund(el)
    const wert = text ? (Math.max(helligkeit(text), helligkeit(hintergrund)) + 0.05) / (Math.min(helligkeit(text), helligkeit(hintergrund)) + 0.05) : 0
    return { wert, text: getComputedStyle(el).color, hintergrund: `rgb(${hintergrund.r}, ${hintergrund.g}, ${hintergrund.b})` }
  })
}

const EDITOR_PFLICHT = [
  'Ort oder Aktivität',
  'Notiz, optional',
  'Anfangsdatum, optional',
  'Anfangszeit, optional',
  'Enddatum, optional',
  'Endzeit, optional',
  'Ortszeiten laut deinem Plan',
  'Abbrechen',
  'Speichern',
] as const

function fehlendePflicht(sichtbar: readonly string[], pflicht: readonly string[]) {
  return pflicht.filter((name) => !sichtbar.some((text) => text.includes(name)))
}

type EditorMessung = {
  wert: number
  text: string
  hintergrund: string
  tag: string
  name: string
  disabled: boolean
  role: string | null
}

async function editorMessung(formular: ReturnType<Page['locator']>): Promise<EditorMessung[]> {
  return formular.evaluate((wurzel) => {
    const gelesen = (farbe: string) => {
      const modern = farbe.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
      if (modern) {
        return {
          r: Math.round(Number(modern[1]) * 255),
          g: Math.round(Number(modern[2]) * 255),
          b: Math.round(Number(modern[3]) * 255),
          a: 1,
        }
      }
      const werte = farbe.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!werte) return null
      return { r: Number(werte[1]), g: Number(werte[2]), b: Number(werte[3]), a: werte[4] == null ? 1 : Number(werte[4]) }
    }
    const misch = (
      unten: { r: number, g: number, b: number, a: number },
      oben: { r: number, g: number, b: number, a: number },
    ) => {
      const a = oben.a + unten.a * (1 - oben.a)
      const kanal = (links: number, rechts: number) => Math.round((rechts * oben.a + links * unten.a * (1 - oben.a)) / (a || 1))
      return { r: kanal(unten.r, oben.r), g: kanal(unten.g, oben.g), b: kanal(unten.b, oben.b), a }
    }
    const grund = (start: Element) => {
      const schichten: { r: number, g: number, b: number, a: number }[] = []
      let knoten: Element | null = start
      while (knoten) {
        const farbe = gelesen(getComputedStyle(knoten).backgroundColor)
        if (farbe && farbe.a > 0) schichten.push(farbe)
        if (farbe && farbe.a >= 0.99) break
        knoten = knoten.parentElement
      }
      let bild = { r: 255, g: 255, b: 255, a: 1 }
      for (const schicht of schichten.reverse()) bild = misch(bild, schicht)
      return bild
    }
    const kanal = (wert: number) => {
      const v = wert / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    const helligkeit = (rgb: { r: number, g: number, b: number }) => 0.2126 * kanal(rgb.r) + 0.7152 * kanal(rgb.g) + 0.0722 * kanal(rgb.b)
    return [...wurzel.querySelectorAll('h4, label, p, button, input, select, textarea')].flatMap((el) => {
      const stil = getComputedStyle(el)
      if (stil.display === 'none' || stil.visibility === 'hidden') return []
      const text = gelesen(stil.color)
      const hintergrund = grund(el)
      const wert = text ? (Math.max(helligkeit(text), helligkeit(hintergrund)) + 0.05) / (Math.min(helligkeit(text), helligkeit(hintergrund)) + 0.05) : 0
      const feld = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el instanceof HTMLButtonElement
      return [{
        wert,
        text: stil.color,
        hintergrund: `rgb(${hintergrund.r}, ${hintergrund.g}, ${hintergrund.b})`,
        tag: el.tagName,
        name: (el.textContent ?? el.getAttribute('aria-label') ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        disabled: feld ? el.disabled : false,
        role: el.getAttribute('role'),
      }]
    })
  })
}

async function editorPruefen(formular: ReturnType<Page['locator']>, hinweis: string, art: 'neu' | 'bestand') {
  const pflicht = art === 'neu'
    ? ['Neuer Punkt', 'Art', ...EDITOR_PFLICHT]
    : ['Punkt bearbeiten', 'Zuordnung im Tagesplan', ...EDITOR_PFLICHT]
  const messung = await editorMessung(formular)
  const fehlt = fehlendePflicht(messung.map((eintrag) => eintrag.name), pflicht)
  assert.deepEqual(fehlt, [], `${hinweis} fehlt ${fehlt.join(', ')}`)
  const daten = messung.filter((eintrag) => eintrag.tag === 'BUTTON' && /^(Anfangsdatum|Enddatum)/.test(eintrag.name))
  assert.equal(daten.length, 2, `${hinweis} Kalenderfelder ${daten.map((eintrag) => eintrag.name).join('|')}`)
  assert.equal(await formular.locator('button.reise-datum-trigger[aria-haspopup="dialog"]').count(), 2)
  const zeiten = messung.filter((eintrag) => eintrag.tag === 'LABEL' && /^(Anfangszeit|Endzeit)/.test(eintrag.name))
  assert.equal(zeiten.length, 2, `${hinweis} Zeitfelder ${zeiten.map((eintrag) => eintrag.name).join('|')}`)
  for (const eintrag of messung) {
    if (eintrag.role === 'alert' || eintrag.role === 'status') continue
    assert.ok(eintrag.wert >= 4.5, `${hinweis} ${eintrag.tag} ${eintrag.disabled ? 'deaktiviert' : 'aktiv'} ${eintrag.name} ${JSON.stringify(eintrag)}`)
  }
  return messung
}

describe('mounted workspace route contract', { timeout: 240_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = html(css, js)
    server = createServer((req, res) => {
      const file = ['/images/reiseatlas/laender.json','/images/reiseatlas/world.webp','/images/reiseatlas/asia.webp'].find(path => req.url === path)
      if (file) {
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'image/webp')
        res.end(readFileSync('public'+file))
        return
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    browser = await browserStarten()
  })

  after(async () => {
    await browser?.close()
    if (server) await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  test('Verbindungsdetail, direkter Link, Zurück und Vorwärts erhalten den Abschnitt; mehrdeutige Zuordnung bleibt gesperrt', async () => {
    const page = await browser.newPage({ viewport:{width:1440,height:900} })
    try {
      await page.goto(origin); await plan(page)
      const link=page.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]')
      await link.focus(); await page.keyboard.press('Enter')
      const detail=page.locator('[data-u1c-kante-detail]')
      await detail.waitFor()
      assert.match(await detail.innerText(),/Reisedatum nicht gespeichert/)
      assert.match(new URL(page.url()).searchParams.get('kante')||'',/stage-bkk:stage-kc/)
      await page.getByRole('button',{name:'Alle Etappen',exact:true}).click()
      assert.equal(new URL(page.url()).searchParams.has('kante'),false)
      await page.reload(); await link.waitFor()
      await page.goBack(); await detail.waitFor()
      await page.goForward(); await link.waitFor()
      await page.locator('[data-u1c-szene="namen"]').click()
      await page.locator('[data-u1c-lauf][data-u1c-tage~="day-5"]').click()
      assert.equal(new URL(page.url()).searchParams.get('tag'),'day-5')
      await page.getByRole('button',{name:'Alle Etappen'}).click()
      await page.locator('[data-u1c-lauf][data-u1c-tage~="day-1"]').click()
      assert.equal(new URL(page.url()).searchParams.get('tag'),'day-1')
      await page.getByRole('button',{name:'Alle Etappen'}).click()
      await page.locator('[data-u1c-szene="abab"]').click()
      const ambiguous=page.locator('[data-u1c-kante-gesperrt="mehrdeutig"]')
      assert.equal(await ambiguous.count(),2)
      assert(await ambiguous.first().isDisabled())
      assert.match(await ambiguous.first().innerText(),/mehrfach/)
      await page.evaluate(()=>{history.pushState(history.state,'','/?ansicht=plan&kante=connection%3Astage-a%3Astage-b&tag=day-1');dispatchEvent(new PopStateEvent('popstate'))})
      await page.locator('[data-u1c-kante-hinweis="mehrdeutig"]').waitFor()
      await page.getByRole('button',{name:'Alle Etappen'}).click()
      await page.locator('[data-u1c-szene="unklar"]').click()
      await link.click()
      assert.match(await detail.innerText(),/unklar/)
      await page.locator('[data-u1c-szene="namen"]').click()
      await page.locator('[data-u1c-kante-hinweis="nicht-verfuegbar"]').waitFor()
    } finally {await page.close()}
  })

  test('Jeder gespeicherte Tag bleibt bei Tastaturwahl im hellen und grünen Workspace auf Desktop und Telefon erreichbar', async () => {
    const page=await browser.newPage({viewport:{width:1440,height:900}})
    try {
      await page.goto(origin); await plan(page)
      const atlas=page.locator('[data-trip-atlas]')
      await lichtePalette(page)
      for(const [width,theme] of [[1440,'light'],[390,'green']] as const){
        await page.setViewportSize({width,height:900})
        if(theme==='green'){
          await page.getByRole('button',{name:'Grünes Design aktivieren'}).click()
          await page.locator('[data-workspace-theme="green"]').waitFor()
        }
        const visited=new Set<string>()
        const ranges=await atlas.locator('[data-u1c-lauf]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.getAttribute('data-u1c-tag-ids')||'[]') as string[]))
        for(const group of ranges){
          if(!group.length)continue
          await atlas.locator('[data-u1c-lauf][data-u1c-tage~="'+group[0]+'"]').click()
          await atlas.locator('.et-tabs').getByRole('button',{name:'Tagesplan'}).click()
          for(const id of group){
            const chip=atlas.locator('.et-days [data-timeline-tag="'+id+'"]')
            await chip.focus(); await page.keyboard.press('Enter')
            assert.equal(await chip.getAttribute('aria-current'),'date')
            assert.equal(new URL(page.url()).searchParams.get('tag'),id)
            assert.match(await chip.getAttribute('aria-label')||'',/^Tag [0-9]+/)
            await chip.scrollIntoViewIfNeeded()
            assert(await chip.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}))
            visited.add(id)
          }
          await atlas.getByRole('button',{name:'Alle Etappen',exact:true}).click()
        }
        assert.deepEqual([...visited].sort(),referenzReise().days.map(d=>d.id).sort())
      }
    } finally {await page.close()}
  })

  test('Die Tastatur kehrt zur gewählten Etappe, Verbindung und zum Übergang in die Organisationssuche zurück', async () => {
    const page = await browser.newPage({ viewport:{width:390,height:844} })
    try {
      const external: string[] = []
      const apiRequests: string[] = []
      await page.route('**/*', req => {
        const target = new URL(req.request().url())
        if (target.pathname.startsWith('/api/')) apiRequests.push(target.pathname)
        if (target.origin===origin) return req.continue()
        external.push(req.request().url())
        return req.abort()
      })
      await page.goto(origin); await plan(page)
      const atlas = page.locator('[data-trip-atlas]')
      await page.locator('[data-u1c-szene="leerzeichen"]').click()
      const visit=atlas.locator('[data-u1c-lauf]').filter({hasText:'Bangkok'}).first()
      const visitIds=JSON.parse(await visit.getAttribute('data-u1c-tag-ids')||'[]')
      await visit.focus(); await page.keyboard.press('Enter')
      await atlas.getByRole('button',{name:'Alle Etappen'}).focus(); await page.keyboard.press('Enter')
      await page.waitForFunction((ids:string[])=>JSON.parse(document.activeElement?.getAttribute('data-u1c-tag-ids')||'[]').some((id:string)=>ids.includes(id)),visitIds)
      const edge = atlas.locator('[data-u1c-kante-id]').first()
      const id = await edge.getAttribute('data-u1c-kante-id')
      const tag = await edge.getAttribute('data-u1c-rueck-tag')
      await edge.focus(); await page.keyboard.press('Enter')
      await atlas.getByRole('button',{name:'Alle Etappen'}).focus(); await page.keyboard.press('Enter')
      await page.waitForFunction(([id,tag])=>document.activeElement?.getAttribute('data-u1c-kante-id')===id && document.activeElement.getAttribute('data-u1c-rueck-tag')===tag,[id,tag])
      await page.keyboard.press('Enter')
      const organize = page.locator('[data-u1c-alle-verbindungen]')
      await organize.focus(); await page.keyboard.press('Enter')
      const active=page.getByRole('tab',{name:'Verbindungen',exact:true})
      await active.waitFor()
      assert.equal(await active.getAttribute('aria-selected'),'true')
      await page.goBack()
      await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-u1c-alle-verbindungen'))
      assert.equal(new URL(page.url()).searchParams.get('kante'),id)
      assert.deepEqual(external,[])
      assert.deepEqual(apiRequests,[])
    } finally {await page.close()}
  })

  test('guest discard and account deletion stay reachable in both headers', async () => {
    const gast = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
    await gast.addInitScript((reise) => {
      localStorage.setItem('jetnity:reise:v3', JSON.stringify(reise))
    }, referenzReise())
    const dialoge: string[] = []
    let antwort: 'dismiss' | 'accept' = 'dismiss'
    gast.on('dialog', async (dialog) => {
      dialoge.push(dialog.message())
      if (antwort === 'dismiss') await dialog.dismiss()
      else await dialog.accept()
    })
    await gast.goto(origin, { waitUntil: 'networkidle' })
    await gast.locator('[data-u1c-probe="gast"]').click()
    const summary = gast.locator('[data-reiseoptionen] summary')
    try {
      await summary.waitFor({ timeout: 15000 })
    } catch (fehler) {
      const text = await gast.locator('body').innerText()
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)}\n${text.slice(0, 1200)}`)
    }
    await summary.click()
    const verwerfen = gast.getByRole('button', { name: 'Entwurf verwerfen' })
    await verwerfen.waitFor()
    await verwerfen.focus()
    await gast.keyboard.press('Enter')
    assert.match(dialoge.at(-1) ?? '', /von diesem Gerät entfernt/)
    assert.equal(await gast.evaluate(() => localStorage.getItem('jetnity:reise:v3') != null), true)

    await gast.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await gast.waitForSelector('[data-workspace-theme="green"]')
    const kontrast = await gast.locator('.workspace-reiseoptionen > summary').evaluate((el) => {
      const kanal = (wert: number) => {
        const v = wert / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      const zahlen = (farbe: string) => farbe.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0]
      const text = zahlen(getComputedStyle(el).color)
      let hintergrund = [255, 255, 255]
      let hintergrundQuelle = 'fallback'
      let knoten: Element | null = el
      while (knoten) {
        const farbe = getComputedStyle(knoten).backgroundColor
        const werte = farbe.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/)
        if (werte && werte[4] !== '0') {
          hintergrund = [Number(werte[1]), Number(werte[2]), Number(werte[3])]
          hintergrundQuelle = `${knoten.tagName}.${String((knoten as HTMLElement).className).slice(0, 40)} ${farbe}`
          break
        }
        knoten = knoten.parentElement
      }
      const helligkeit = (rgb: number[]) => 0.2126 * kanal(rgb[0] ?? 0) + 0.7152 * kanal(rgb[1] ?? 0) + 0.0722 * kanal(rgb[2] ?? 0)
      const hell = Math.max(helligkeit(text), helligkeit(hintergrund))
      const dunkel = Math.min(helligkeit(text), helligkeit(hintergrund))
      return {
        wert: (hell + 0.05) / (dunkel + 0.05),
        text: getComputedStyle(el).color,
        hintergrundQuelle,
      }
    })
    assert.ok(kontrast.wert >= 3, JSON.stringify(kontrast))
    await verwerfen.tap()
    assert.equal(dialoge.length, 2)

    await gast.locator('[data-u1c-shell]').click()
    await gast.waitForSelector('[data-u1c-shell="aus"]')
    await gast.locator('[data-reiseoptionen] summary').click()
    await verwerfen.focus()
    await gast.keyboard.press('Enter')
    assert.equal(dialoge.length, 3)
    await gast.evaluate(() => {
      const original = Storage.prototype.removeItem
      let anzahl = 0
      Storage.prototype.removeItem = function (schluessel: string) {
        if (schluessel === 'jetnity:reise:v3') anzahl += 1
        return original.call(this, schluessel)
      }
      ;(window as unknown as { __u1cEntfernt?: () => number }).__u1cEntfernt = () => anzahl
    })
    antwort = 'accept'
    await verwerfen.click()
    await gast.waitForFunction(() => localStorage.getItem('jetnity:reise:v3') == null)
    assert.equal(await gast.evaluate(() => (window as unknown as { __u1cEntfernt: () => number }).__u1cEntfernt()), 1)
    assert.equal(dialoge.length, 4)
    await gast.close()

    const konto = await browser.newPage({ viewport: { width: 768, height: 900 }, hasTouch: true })
    const kontoDialoge: string[] = []
    let kontoAntwort: 'dismiss' | 'accept' = 'dismiss'
    konto.on('dialog', async (dialog) => {
      kontoDialoge.push(dialog.message())
      if (kontoAntwort === 'dismiss') await dialog.dismiss()
      else await dialog.accept()
    })
    const kontoNetz: string[] = []
    konto.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') kontoNetz.push(request.url())
    })
    await konto.goto(origin, { waitUntil: 'networkidle' })
    await konto.locator('[data-u1c-probe="konto"]').click()
    const kontoSummary = konto.locator('[data-reiseoptionen] summary')
    try {
      await kontoSummary.waitFor({ timeout: 15000 })
    } catch (fehler) {
      const text = await konto.locator('body').innerText()
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)}\n${text.slice(0, 1200)}`)
    }
    await kontoSummary.focus()
    await konto.keyboard.press('Enter')
    const loeschen = konto.getByRole('button', { name: 'Reise löschen' })
    await loeschen.waitFor()
    await loeschen.focus()
    await konto.keyboard.press('Enter')
    assert.match(kontoDialoge.at(-1) ?? '', /nicht rückgängig/)
    assert.equal(await konto.locator('[role="alert"]').count(), 0)
    await konto.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await loeschen.tap()
    assert.equal(kontoDialoge.length, 2)
    await konto.locator('[data-u1c-shell]').click()
    await konto.locator('[data-reiseoptionen] summary').click()
    kontoAntwort = 'accept'
    await loeschen.click()
    await konto.getByRole('alert').waitFor()
    const meldung = await konto.getByRole('alert').innerText()
    assert.match(meldung, /Diese Reise ist unbekannt/)
    assert.equal(kontoDialoge.length, 3)
    assert.deepEqual(kontoNetz, [])
    await konto.close()
  })

  test('green editor text and the selected day stay distinct', async () => {
    const context = await browser.newContext({ viewport: { width: 768, height: 900 } })
    const page = await context.newPage()
    const netz: string[] = []
    page.on('request', (request) => {
      if ((request.resourceType() === 'fetch' || request.resourceType() === 'xhr') && !request.url().startsWith(origin+'/images/reiseatlas/')) netz.push(request.url())
    })
    await page.addInitScript((reise) => {
      if (!localStorage.getItem('jetnity:reise:v3')) localStorage.setItem('jetnity:reise:v3', JSON.stringify(reise))
    }, referenzReise())
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('.et-tabs').getByRole('button',{name:'Tagesplan'}).click()
    await page.locator('.et-days [data-timeline-tag="day-11"]').click()
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    const formular = page.locator('form[aria-label="Punkt hinzufügen"]')
    await formular.waitFor()
    await formular.getByLabel('Art').selectOption({ label: 'Notiz' })
    await formular.locator('input[required]').fill('QA-Test Tag 11')
    await formular.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await page.waitForSelector('[data-workspace-theme="green"]')
    assert.equal(await formular.locator('input[required]').inputValue(), 'QA-Test Tag 11')
    assert.equal(await formular.locator('textarea').inputValue(), 'Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await formular.evaluate((el) => el.removeAttribute('data-planpunkt-editor'))
    const alt = await textKontrast(page, 'form[aria-label="Punkt hinzufügen"] h4')
    assert.ok(Number.isFinite(alt.wert))
    await formular.evaluate((el) => el.setAttribute('data-planpunkt-editor', ''))
    assert.deepEqual(
      fehlendePflicht(['Art', 'Ort oder Aktivität', 'Notiz, optional'], ['Enddatum, optional']),
      ['Enddatum, optional'],
    )

    const themaSetzen = async (name: 'light' | 'green') => {
      const aktuell = await page.locator('.workspace-shell').getAttribute('data-workspace-theme')
      if (aktuell === name) return
      await page.getByRole('button', { name: name === 'green' ? 'Grünes Design aktivieren' : 'Helle Darstellung aktivieren' }).click()
      await page.waitForSelector(`[data-workspace-theme="${name}"]`)
    }
    const breiten = [320, 390, 768, 1440]
    for (const name of ['green', 'light'] as const) {
      await themaSetzen(name)
      for (const breite of breiten) {
        await page.setViewportSize({ width: breite, height: 900 })
        await editorPruefen(formular, `${name} neu ${breite}`, 'neu')
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await editorPruefen(formular, `${name} neu Root-Schrift 32px, keine Browservergrösserung`, 'neu')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
      assert.equal(overflow, true, `${name} root text`)
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    }
    await page.setViewportSize({ width: 768, height: 900 })
    assert.equal(await formular.locator('textarea').inputValue(), 'Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await themaSetzen('green')
    await formular.locator('input[required]').fill(' ')
    await formular.locator('button[type="submit"]').click()
    const alarm = formular.locator('[role="alert"]')
    await alarm.waitFor()
    const fehler = await editorMessung(formular)
    const alarmText = fehler.filter((eintrag) => eintrag.role === 'alert')
    assert.equal(alarmText.length, 1)
    assert.ok(alarmText[0]?.wert >= 4.5, JSON.stringify(alarmText[0]))
    await formular.locator('input[required]').fill('QA-Test Tag 11')
    await formular.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')
    await formular.locator('input[required]').focus()
    const fokus = await formular.locator('input[required]').evaluate((el) => {
      const stil = getComputedStyle(el)
      return stil.outlineStyle !== 'none' || stil.boxShadow !== 'none'
    })
    assert.equal(fokus, true)
    await formular.locator('button[type="submit"]').click()
    await page.getByText('QA-Test Tag 11', { exact: true }).first().waitFor()

    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('.et-tabs').getByRole('button',{name:'Tagesplan'}).click()
    await page.locator('.et-days [data-timeline-tag="day-11"]').click()
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)
    await page.getByRole('button', { name: 'QA-Test Tag 11 bearbeiten' }).click()
    const bearbeiten = page.locator('form[aria-label="Punkt bearbeiten: QA-Test Tag 11"]')
    await bearbeiten.waitFor()
    await bearbeiten.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben und wurde bearbeitet')
    for (const name of ['green', 'light'] as const) {
      await themaSetzen(name)
      for (const breite of breiten) {
        await page.setViewportSize({ width: breite, height: 900 })
        await editorPruefen(bearbeiten, `${name} bestand ${breite}`, 'bestand')
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await editorPruefen(bearbeiten, `${name} bestand Root-Schrift 32px, keine Browservergrösserung`, 'bestand')
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    }
    await page.setViewportSize({ width: 768, height: 900 })
    await themaSetzen('green')
    await bearbeiten.getByRole('button', { name: /^Enddatum, optional:/ }).evaluate((el) => {
      el.style.color = getComputedStyle(el).backgroundColor
    })
    const beschaedigt = (await editorMessung(bearbeiten)).filter((eintrag) => eintrag.tag === 'BUTTON' && eintrag.name.includes('Enddatum'))
    assert.equal(beschaedigt.length, 1)
    assert.ok((beschaedigt[0]?.wert ?? 99) < 4.5, JSON.stringify(beschaedigt[0]))
    const erste = (await editorMessung(bearbeiten)).find((eintrag) => eintrag.tag === 'LABEL' && eintrag.name.includes('Ort oder Aktivität'))
    assert.ok((erste?.wert ?? 0) >= 4.5, JSON.stringify(erste))
    await bearbeiten.getByRole('button', { name: /^Enddatum, optional:/ }).evaluate((el) => { el.style.color = '' })
    await editorPruefen(bearbeiten, 'grün bestand nach Gegenprobe', 'bestand')
    await bearbeiten.locator('button[type="submit"]').click()
    await page.getByText('wurde bearbeitet', { exact: false }).first().waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('.et-tabs').getByRole('button',{name:'Tagesplan'}).click()
    await page.locator('.et-days [data-timeline-tag="day-11"]').click()
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)
    await page.getByText('wurde bearbeitet').waitFor()
    await page.locator('[data-timeline-tag="day-12"]').click()
    await page.waitForFunction(() => location.search.includes('tag=day-12'))
    await page.goBack()
    await page.waitForFunction(() => location.search.includes('tag=day-11'))
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)

    const zuGruen = page.getByRole('button', { name: 'Grünes Design aktivieren' })
    if (await zuGruen.isVisible()) await zuGruen.click()
    await page.waitForSelector('[data-workspace-theme="green"]')
    const gewaehlt = await page.locator('[data-timeline-tag="day-11"]').evaluate((el) => {
      const bevor = getComputedStyle(el, '::before')
      const stil = getComputedStyle(el)
      return {
        current: el.getAttribute('aria-current'),
        breite: bevor.width,
        schatten: stil.boxShadow,
        flaeche: stil.backgroundColor,
      }
    })
    assert.equal(gewaehlt.current, 'date')
    const nachbar = await page.locator('[data-timeline-tag="day-12"]').evaluate((el) => getComputedStyle(el).backgroundColor)
    assert.notEqual(gewaehlt.flaeche, nachbar)
    const tagText = await textKontrast(page, '.et-days [data-timeline-tag="day-11"]')
    assert.ok(tagText.wert >= 4.5, JSON.stringify(tagText))
    const lauf = page.locator('[data-u1c-lauf][aria-pressed="true"]')
    if (await lauf.count() > 0 && await lauf.first().isVisible()) {
      const laufText = await textKontrast(page, '[data-u1c-lauf][aria-pressed="true"] strong')
      assert.ok(laufText.wert >= 4.5, JSON.stringify(laufText))
    }
    assert.deepEqual(netz, [])
    await context.close()
  })

})
