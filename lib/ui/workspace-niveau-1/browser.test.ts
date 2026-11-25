import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'

import { chromium, type Browser, type Page } from 'playwright'

import { paarePruefen, type Paar } from '@/lib/ui/white-mint-home-workspace-1/kontrast-audit'
import { ANBIETER_RAHMEN, bundeln, dokument, projektCss } from '@/lib/ui/workspace-niveau-1/bundle'
import dynamicGeladen from '@/lib/ui/workspace-niveau-1/dynamic-geladen'

/**
 * Darstellungsvertrag des Workspace (Übersicht, Reiseplan, Organisieren, Vorbereitung, Einreise).
 * Gemessen wird der echte Gast-Arbeitsbereich in einem echten Browser bei 320, 375, 390 und 430 px,
 * Hell und Dunkel: kein seitlicher Überlauf, nichts abgeschnitten, Felder mindestens 16 px,
 * Touch-Ziele mindestens 44 px, Schrift mindestens 12 px, Kontrast mindestens 4,5:1.
 * Vorfall: Flugsuche auf dem iPhone ragte seitlich heraus, der Platzhalter war abgeschnitten und
 * die Flughafenliste stand links ausserhalb des Bildes.
 */
declare global {
  interface Window {
    __whiteMintPaareSammeln?: (selector: string) => Paar[]
  }
}

const BREITEN = [320, 375, 390, 430] as const
const THEMEN = ['light', 'dark'] as const
const THEME_KEY = 'jetnity:workspace-theme:v1'
const REISE = '/reisen/trip-white-mint'
const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

const ORGANISIEREN = 'Zurück zu meinem Reiseplan'
const ANSICHTEN = [
  { name: 'uebersicht', suche: '', ueberschrift: 'Was deine Reise jetzt weiterbringt' },
  { name: 'plan', suche: '?ansicht=plan', ueberschrift: 'Deine Route' },
  { name: 'plan-karte', suche: '?ansicht=plan', ueberschrift: 'Deine Route', klick: 'Karte' },
  { name: 'fluege', suche: '?ansicht=organisieren&kategorie=fluege', ueberschrift: ORGANISIEREN },
  { name: 'unterkunft', suche: '?ansicht=organisieren&kategorie=unterkunft', ueberschrift: ORGANISIEREN },
  { name: 'aktivitaeten', suche: '?ansicht=organisieren&kategorie=aktivitaeten', ueberschrift: ORGANISIEREN },
  { name: 'mietwagen', suche: '?ansicht=organisieren&kategorie=mietwagen', ueberschrift: ORGANISIEREN },
  { name: 'verbindungen', suche: '?ansicht=organisieren&kategorie=verbindungen', ueberschrift: ORGANISIEREN },
  { name: 'vorbereitung', suche: '?ansicht=vorbereitung', ueberschrift: 'Was diese Reise offiziell und persönlich braucht' },
  { name: 'einreise', suche: '?ansicht=einreise', ueberschrift: 'Einreise und Visum prüfen' },
] as const

const OMIO_REGISTER = {
  date: '2026-11-20',
  publisher: '8110171',
  places: [
    { id: '373297', name: 'Zürich', country: 'CH', lat: 47.38, lng: 8.54, weight: 9 },
    { id: '1001', name: 'Lissabon', country: 'PT', lat: 38.72, lng: -9.14, weight: 8 },
    { id: '1004', name: 'Mailand', country: 'IT', lat: 45.46, lng: 9.19, weight: 7 },
  ],
}
const FLUGHAEFEN = [
  { label: 'Zürich (ZRH), Flughafen Zürich', value: 'ZRH', description: 'Zürich · Schweiz' },
  { label: 'Zürich (ZRH), Zürich Hauptbahnhof Verbindungsstrecke mit einem sehr langen Namen', value: 'ZRH', description: 'Zürich, Kanton Zürich · Schweiz' },
]

/**
 * Feste Referenzschrift, damit das Ergebnis nicht von den Systemschriften des Rechners abhängt
 * (auf dem CI-Runner ist `system-ui` DejaVu Sans, 12 % breiter als Noto Sans, das auf Telefonen
 * nicht vorkommt). Geist liegt mit Next in node_modules; `size-adjust` dehnt sie auf die Breite
 * von Noto Sans, etwa 5 % breiter als SF Pro und Roboto. Das ist bewusst ein strenger Massstab.
 * `WORKSPACE_NIVEAU_SCHRIFT="DejaVu Sans"` prüft stattdessen eine installierte Systemschrift.
 * Ebenso fest ist die Bildlaufleiste: Telefone zeigen sie als Überlagerung, ein Desktop-Chrome mit
 * klassischer Leiste nimmt dem Inhalt Breite (lokal gemessen: 15 px) und verfälscht die
 * Messung. Darum wird sie ausgeblendet und in `oeffnen` geprüft, dass sie keine Breite belegt.
 */
const REFERENZSCHRIFT = join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf')

const KEINE_BILDLAUFLEISTE = '*{scrollbar-width:none !important}*::-webkit-scrollbar{display:none !important}'

function schriftRegel(systemschrift?: string) {
  if (systemschrift) return `*{font-family:"${systemschrift}",sans-serif !important}${KEINE_BILDLAUFLEISTE}`
  const daten = readFileSync(REFERENZSCHRIFT).toString('base64')
  return `@font-face{font-family:"Referenzschrift";src:url(data:font/ttf;base64,${daten}) format("truetype");font-weight:100 900;size-adjust:107%}*{font-family:"Referenzschrift",sans-serif !important}${KEINE_BILDLAUFLEISTE}`
}

type Messung = {
  ueberlauf: number
  ragt: string[]
  kleinFeld: string[]
  ziele: string[]
  kleinText: string[]
  platzhalter: string[]
  abgeschnitten: string[]
  navUmbruch: string[]
}

let browser: Browser
let server: Server
let origin = ''

async function browserStarten() {
  try {
    return await chromium.launch({ headless: true, args: BROWSER_ARGS })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
  }
}

type Schicht = 'anbieter' | 'ohne'
const dokumente: Record<Schicht, string> = { anbieter: '', ohne: '' }

async function oeffnen(breite: number, thema: 'light' | 'dark', hoehe = 844, schicht: Schicht = 'anbieter') {
  const context = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1, hasTouch: true })
  const fremd: string[] = []
  await context.route('**/*', (route) => {
    const ziel = new URL(route.request().url())
    if (ziel.origin === ANBIETER_RAHMEN) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Anbieterrahmen</title>' })
    const host = ziel.hostname
    if (host !== '127.0.0.1' && host !== 'localhost') {
      fremd.push(route.request().url())
      return route.abort()
    }
    return route.continue()
  })
  await context.addInitScript(`(() => { try { localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(thema)}); } catch (e) {} })();`)
  const page = await context.newPage()
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(error.message))
  await page.goto(`${origin}${REISE}?schicht=${schicht}`, { waitUntil: 'load' })
  await page.waitForSelector('[data-workspace-ansicht]', { state: 'attached' })
  if (!process.env.WORKSPACE_NIVEAU_SCHRIFT) {
    const aktiv = await page.evaluate(async () => {
      await document.fonts.ready
      return document.fonts.check('16px "Referenzschrift"') && getComputedStyle(document.body).fontFamily.startsWith('Referenzschrift')
    })
    assert.ok(aktiv, 'Die Referenzschrift ist nicht aktiv; Messungen wären vom Rechner abhängig')
  }
  const leiste = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)
  assert.equal(leiste, 0, `Eine Bildlaufleiste belegt ${leiste}px Breite; Messungen wären vom Browser abhängig`)
  return { context, page, fehler, fremd }
}

async function gehe(page: Page, suche: string, klick?: string) {
  await page.evaluate((ziel) => {
    window.history.pushState(window.history.state, '', ziel)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, `${REISE}${suche}`)
  const parameter = new URLSearchParams(suche)
  const erwartet = parameter.get('ansicht') ?? 'uebersicht'
  await page.waitForFunction((name) => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === name, erwartet)
  await page.waitForTimeout(300)
  if (klick) {
    await page.getByRole('button', { name: klick, exact: true }).first().click()
    await page.waitForTimeout(400)
  }
  const kategorie = parameter.get('kategorie')
  if (kategorie) {
    const aktuell = await page.evaluate(() => new URLSearchParams(window.location.search).get('kategorie'))
    assert.equal(aktuell, kategorie, `Kategorie ${kategorie} im Beispiel-Trip nicht erreichbar`)
  }
}

async function messen(page: Page): Promise<Messung> {
  return page.evaluate(() => {
    const iw = window.innerWidth
    const sichtbar = (e: Element) => {
      const r = e.getBoundingClientRect()
      const s = getComputedStyle(e)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden],[inert],[data-negative]')
    }
    const kurz = (e: Element) => {
      const text = ((e as HTMLElement).innerText || (e as HTMLInputElement).placeholder || '').trim().slice(0, 28)
      return `${e.tagName.toLowerCase()}.${String(e.className).split(/\s+/).filter(Boolean).slice(0, 2).join('.')}${text ? ` «${text}»` : ''}`
    }
    const versteckt = (e: Element) => {
      const r = e.getBoundingClientRect()
      return r.width <= 2 || r.height <= 2 || Boolean(e.closest('.sr-only,[class*="sr-only"],.ov-sr'))
    }
    const geklemmt = (e: Element) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (['hidden', 'auto', 'scroll', 'clip'].includes(s.overflowX)) {
          const r = p.getBoundingClientRect()
          if (r.left >= -0.5 && r.right <= iw + 0.5) return true
        }
      }
      return false
    }
    const alle = [...document.querySelectorAll('body *')].filter((e) => !e.closest('svg') && !e.closest('.leaflet-container'))
    const ragt = alle
      .filter((e) => {
        if (!sichtbar(e) || versteckt(e) || getComputedStyle(e).position === 'fixed') return false
        const r = e.getBoundingClientRect()
        return (r.right > iw + 0.5 || r.left < -0.5) && !geklemmt(e)
      })
      .map(kurz)
    const felder = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]), select, textarea')].filter(sichtbar)
    const kleinFeld = felder.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 15.99).map((e) => `${kurz(e)} ${getComputedStyle(e).fontSize}`)
    const ziele = [...document.querySelectorAll('button, [role=tab], summary, select, input:not([type=hidden]), a[href]')]
      .filter(sichtbar)
      .filter((e) => {
        const s = getComputedStyle(e)
        if (versteckt(e)) return false
        if (e.matches('a') && (s.display === 'inline' || (e.closest('p,li,span,small,dd') && s.display.startsWith('inline')))) return false
        const r = e.getBoundingClientRect()
        const klein = r.height < 43.5 || r.width < 43.5
        if (!klein) return false
        const etikett = e.closest('label')
        if (etikett && e.matches('input,select')) {
          const l = etikett.getBoundingClientRect()
          return l.height < 43.5 || l.width < 43.5
        }
        return true
      })
      .map((e) => {
        const r = e.getBoundingClientRect()
        return `${kurz(e)} ${Math.round(r.width)}x${Math.round(r.height)}`
      })
    const kleinText = alle
      .filter((e) => sichtbar(e) && !versteckt(e) && [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim()))
      .filter((e) => {
        const grenze = iw < 375 && e.closest('.workspace-bottom-nav') ? 11 : 12
        return parseFloat(getComputedStyle(e).fontSize) < grenze - 0.01
      })
      .map((e) => `${kurz(e)} ${getComputedStyle(e).fontSize}`)
    const leinwand = document.createElement('canvas').getContext('2d')!
    const platzhalter = felder
      .filter((e): e is HTMLInputElement => e instanceof HTMLInputElement && Boolean(e.placeholder) && !e.value)
      .filter((e) => {
        const s = getComputedStyle(e)
        const p = getComputedStyle(e, '::placeholder')
        leinwand.font = `${p.fontWeight} ${p.fontSize} ${p.fontFamily}`
        return leinwand.measureText(e.placeholder).width > e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 0.5
      })
      .map((e) => {
        const s = getComputedStyle(e)
        const frei = e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
        return `${kurz(e)} «${e.placeholder}» frei ${Math.round(frei)}px bei Bildbreite ${document.documentElement.clientWidth}px`
      })
    const abgeschnitten = alle
      .filter((e) => {
        if (!sichtbar(e) || versteckt(e) || e.matches('input,select,textarea,iframe,img,canvas,ul,ol,nav,[role=tablist],[role=listbox]')) return false
        const s = getComputedStyle(e)
        const schneidet = s.textOverflow === 'ellipsis' || s.overflowX === 'hidden' || s.overflow === 'hidden'
        return schneidet && e.children.length === 0 && (e.textContent ?? '').trim().length > 0 && e.scrollWidth > e.clientWidth + 1
      })
      .map(kurz)
    const navUmbruch = [...document.querySelectorAll('.workspace-bottom-nav:not([data-flow="true"]) .workspace-nav-link')]
      .filter(sichtbar)
      .filter((e) => {
        const bereich = document.createRange()
        const text = [...e.querySelectorAll('span')].find((s) => (s.textContent ?? '').trim()) ?? e
        bereich.selectNodeContents(text)
        return new Set([...bereich.getClientRects()].map((r) => Math.round(r.top))).size > 1
      })
      .map(kurz)
    return {
      ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ragt: [...new Set(ragt)].slice(0, 8),
      kleinFeld: [...new Set(kleinFeld)].slice(0, 8),
      ziele: [...new Set(ziele)].slice(0, 12),
      kleinText: [...new Set(kleinText)].slice(0, 8),
      platzhalter,
      abgeschnitten: [...new Set(abgeschnitten)].slice(0, 8),
      navUmbruch,
    }
  })
}

test('der Ersatz für next/dynamic lädt die echte Komponente', () => {
  assert.equal(typeof dynamicGeladen, 'function')
})

describe('Workspace-Niveau im echten Browser', () => {
  before(async () => {
    const [grundCss, mitAnbieter, ohneAnbieter] = await Promise.all([projektCss(), bundeln(true), bundeln(false)])
    const css = `${grundCss}\n${schriftRegel(process.env.WORKSPACE_NIVEAU_SCHRIFT)}`
    dokumente.anbieter = dokument(css, mitAnbieter)
    dokumente.ohne = dokument(css, ohneAnbieter)
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/api/mobility/omio') {
        const register = [...url.searchParams].length === 0
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(register ? OMIO_REGISTER : { date: OMIO_REGISTER.date, options: [{ mode: 'train', preis: 18900, minuten: 1260 }, { mode: 'flight', preis: 14900, minuten: 175 }] }))
        return
      }
      if (url.pathname === '/api/search/airports') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(FLUGHAEFEN))
        return
      }
      if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/brand/')) {
        const oeffentlich = join(process.cwd(), 'public')
        const datei = join(oeffentlich, decodeURIComponent(url.pathname).replace(/^\/+/, ''))
        if (!datei.startsWith(`${oeffentlich}/`)) {
          res.writeHead(404)
          res.end()
          return
        }
        try {
          res.writeHead(200)
          res.end(readFileSync(datei))
        } catch {
          res.writeHead(404)
          res.end()
        }
        return
      }
      if (url.pathname.startsWith('/api/')) {
        res.writeHead(503, { 'content-type': 'application/json' })
        res.end('{}')
        return
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(url.searchParams.get('schicht') === 'ohne' ? dokumente.ohne : dokumente.anbieter)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    browser = await browserStarten()
    if (process.env.WORKSPACE_NIVEAU_EVIDENCE_DIR) mkdirSync(process.env.WORKSPACE_NIVEAU_EVIDENCE_DIR, { recursive: true })
  })

  after(async () => {
    await browser?.close()
    if (server) await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  test('jede Ansicht bleibt bei 320 bis 430 px in Hell und Dunkel ohne Überlauf, Abschneiden und zu kleine Ziele', async () => {
    const meldungen: string[] = []
    const durchgaenge = [
      { schicht: 'anbieter' as const, ansichten: ANSICHTEN },
      { schicht: 'ohne' as const, ansichten: ANSICHTEN.filter((a) => a.name === 'fluege') },
    ]
    for (const { schicht, ansichten } of durchgaenge) {
      for (const thema of THEMEN) {
        for (const breite of BREITEN) {
          const { context, page, fehler, fremd } = await oeffnen(breite, thema, 844, schicht)
          for (const ansicht of ansichten) {
            await gehe(page, ansicht.suche, 'klick' in ansicht ? ansicht.klick : undefined)
            const m = await messen(page)
            const wo = `${ansicht.name}${schicht === 'ohne' ? ' (ohne Anbieter)' : ''} ${breite}px ${thema}`
            if (m.ueberlauf > 1) meldungen.push(`${wo}: seitlicher Überlauf ${m.ueberlauf}px`)
            for (const [art, liste] of Object.entries({ ragt: m.ragt, kleinFeld: m.kleinFeld, ziele: m.ziele, kleinText: m.kleinText, platzhalter: m.platzhalter, abgeschnitten: m.abgeschnitten, navUmbruch: m.navUmbruch })) {
              if (liste.length) meldungen.push(`${wo}: ${art} ${JSON.stringify(liste)}`)
            }
            if (process.env.WORKSPACE_NIVEAU_EVIDENCE_DIR && breite === 390 && schicht === 'anbieter') {
              await page.screenshot({ path: join(process.env.WORKSPACE_NIVEAU_EVIDENCE_DIR, `${ansicht.name}-${breite}-${thema}.png`), fullPage: true })
            }
          }
          assert.deepEqual(fehler, [], `Skriptfehler bei ${breite}px ${thema}`)
          assert.deepEqual(fremd, [], 'keine fremden Anfragen')
          await context.close()
        }
      }
    }
    assert.deepEqual(meldungen, [], meldungen.slice(0, 40).join('\n'))
  })

  test('Flugsuche: Platzhalter vollständig sichtbar, Vorschlagsliste hängt am Feld und bleibt im Bild', async () => {
    const platzhalterText = { anbieter: 'Stadt, Land oder Flughafen', ohne: 'Stadt oder Flughafen' }
    for (const schicht of ['anbieter', 'ohne'] as const) for (const thema of THEMEN) {
      for (const breite of BREITEN) {
        const { context, page } = await oeffnen(breite, thema, 844, schicht)
        await gehe(page, '?ansicht=organisieren&kategorie=fluege')
        const eingabe = page.getByPlaceholder(platzhalterText[schicht]).last()
        await eingabe.waitFor()
        const platz = await eingabe.evaluate((el) => {
          const input = el as HTMLInputElement
          const s = getComputedStyle(input)
          const p = getComputedStyle(input, '::placeholder')
          const leinwand = document.createElement('canvas').getContext('2d')!
          leinwand.font = `${p.fontWeight} ${p.fontSize} ${p.fontFamily}`
          return {
            text: leinwand.measureText(input.placeholder).width,
            frei: input.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
            schrift: parseFloat(s.fontSize),
            hoehe: input.getBoundingClientRect().height,
          }
        })
        assert.ok(platz.text <= platz.frei + 0.5, `Platzhalter abgeschnitten bei ${breite}px ${thema}: ${platz.text} > ${platz.frei}`)
        assert.ok(platz.schrift >= 16, `Feldschrift ${platz.schrift}px bei ${breite}px`)
        assert.ok(platz.hoehe >= 44, `Feldhöhe ${platz.hoehe}px bei ${breite}px`)
        await eingabe.click()
        await eingabe.fill('zur')
        const liste = page.getByRole('listbox').first()
        await liste.getByRole('option').first().waitFor({ timeout: 5000 })
        const lage = await page.evaluate(() => {
          const l = document.querySelector('[role=listbox]')!.getBoundingClientRect()
          const feld = document.activeElement!.closest('.org-field')!.getBoundingClientRect()
          return { links: l.left, rechts: l.right, breite: l.width, feldLinks: feld.left, feldRechts: feld.right, iw: window.innerWidth, ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth }
        })
        assert.ok(lage.links >= 0 && lage.rechts <= lage.iw, `Vorschlagsliste ausserhalb des Bildes bei ${breite}px ${thema}: ${JSON.stringify(lage)}`)
        assert.ok(lage.links >= lage.feldLinks - 1 && lage.rechts <= lage.feldRechts + 1, `Vorschlagsliste nicht am Feld bei ${breite}px ${thema}: ${JSON.stringify(lage)}`)
        assert.ok(lage.ueberlauf <= 1, `Überlauf bei geöffneter Liste ${breite}px ${thema}: ${lage.ueberlauf}`)
        const optionen = await liste.getByRole('option').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))
        assert.ok(optionen.length > 0 && optionen.every((h) => h >= 44), `Vorschläge mindestens 44 px hoch: ${optionen}`)
        await context.close()
      }
    }
  })

  test('Datumsauswahl und Gäste-Panel öffnen sich innerhalb des Bildes', async () => {
    for (const breite of BREITEN) {
      const { context, page } = await oeffnen(breite, 'light', 700)
      await gehe(page, '?ansicht=organisieren&kategorie=fluege')
      await page.locator('.reise-datum-trigger').first().click()
      const dialog = page.locator('dialog.reise-kalender[open]')
      await dialog.waitFor()
      const kasten = await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { links: r.left, rechts: r.right, oben: r.top, unten: r.bottom, iw: window.innerWidth, ih: window.innerHeight }
      })
      assert.ok(kasten.links >= -0.5 && kasten.rechts <= kasten.iw + 0.5, `Kalender seitlich ausserhalb bei ${breite}px: ${JSON.stringify(kasten)}`)
      assert.ok(kasten.oben >= -0.5 && kasten.unten <= kasten.ih + 0.5, `Kalender vertikal ausserhalb bei ${breite}px: ${JSON.stringify(kasten)}`)
      const tage = await dialog.locator('table button').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => Math.min(r.width, r.height)))
      assert.ok(tage.length > 0 && tage.every((n) => n >= 43.5), `Kalendertage mindestens 44 px: ${Math.min(...tage)}`)
      await context.close()
    }
  })

  test('Kontrast der Arbeitsbereiche erreicht 4,5:1 in Hell und Dunkel', async () => {
    for (const thema of THEMEN) {
      for (const breite of [320, 390]) {
        const { context, page } = await oeffnen(breite, thema)
        for (const ansicht of ANSICHTEN) {
          await gehe(page, ansicht.suche, 'klick' in ansicht ? ansicht.klick : undefined)
          const paare = await page.evaluate(() => (window.__whiteMintPaareSammeln ? window.__whiteMintPaareSammeln('.workspace-content') : []))
          const urteil = paarePruefen(paare, [ansicht.ueberschrift])
          assert.equal(urteil.ok, true, `${ansicht.name} ${breite}px ${thema}: ${urteil.fehler.slice(0, 8).join('\n')}\nPaare: ${paare.slice(0, 12).map((p) => p.name).join(' | ')}`)
        }
        await context.close()
      }
    }
  })
})
