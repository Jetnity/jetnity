#!/usr/bin/env node
// scripts/official-jetnity-logo-1-audit.mjs
//
// Produktionsnahe Sichtprüfung der offiziellen Marke in Leiste und Footer.
// AUDIT_BASE ist Pflicht. AUDIT_PHASE=before|after wählt das Evidenzverzeichnis.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '..')
const basis = process.env.AUDIT_BASE
const phase = process.env.AUDIT_PHASE === 'before' ? 'before' : 'after'
const evidenz = join(wurzel, 'docs/evidence/official-jetnity-logo-1', phase)

if (!basis) {
  console.error('AUDIT_BASE fehlt')
  process.exit(1)
}

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: 'text-200-360x800', width: 360, height: 800, text200: true },
  { name: 'text-200-1024x768', width: 1024, height: 768, text200: true },
]

function nahe(wert, ziel, toleranz) {
  return Math.abs(wert - ziel) <= toleranz
}

const { chromium } = await import('playwright')
mkdirSync(evidenz, { recursive: true })
const browser = await chromium.launch({ headless: true })
const herkunft = new URL(basis).origin
const laeufe = []
const fehler = []

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  const konsole = []
  const seitenfehler = []
  const herkuenfte = new Set()
  page.on('console', (msg) => {
    if (msg.type() === 'error') konsole.push(msg.text())
  })
  page.on('pageerror', (err) => seitenfehler.push(err.message))
  page.on('request', (req) => {
    try {
      herkuenfte.add(new URL(req.url()).origin)
    } catch {
      /* ungültige URL */
    }
  })
  const antwort = await page.goto(`${basis}/`, { waitUntil: 'load', timeout: 60000 })
  await page.locator('header a[aria-label="Jetnity Startseite"]').waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
  })
  if (phase === 'after') {
    await page.waitForFunction(() => {
      const img = document.querySelector('header img')
      return Boolean(img && img.complete && img.naturalWidth === 384)
    })
    await page.waitForTimeout(300)
  }
  if (vp.text200) {
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
        }),
    )
  }

  const messung = await page.evaluate(() => {
    function kasten(el) {
      if (!el) return null
      const box = el.getBoundingClientRect()
      const stil = getComputedStyle(el)
      return {
        width: box.width,
        height: box.height,
        top: box.top,
        left: box.left,
        right: box.right,
        bottom: box.bottom,
        background: stil.backgroundColor,
        filter: stil.filter,
        overflowX: stil.overflowX,
      }
    }
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    const navImg = header?.querySelector('img') ?? null
    const footImg = footer?.querySelector('img') ?? null
    const navLink = navImg?.closest('a') ?? null
    const footLink = footImg?.closest('a') ?? null
    const menu = document.querySelector('button[aria-controls="oeffentliche-mobile-navigation"]')
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      header: kasten(header),
      navImg: navImg
        ? {
            ...kasten(navImg),
            alt: navImg.getAttribute('alt'),
            src: navImg.currentSrc || navImg.src,
            naturalWidth: navImg.naturalWidth,
            naturalHeight: navImg.naturalHeight,
          }
        : null,
      navLink: navLink
        ? { ...kasten(navLink), label: navLink.getAttribute('aria-label'), href: navLink.getAttribute('href') }
        : null,
      footImg: footImg
        ? {
            ...kasten(footImg),
            alt: footImg.getAttribute('alt'),
            src: footImg.currentSrc || footImg.src,
            naturalWidth: footImg.naturalWidth,
            naturalHeight: footImg.naturalHeight,
          }
        : null,
      footLink: footLink
        ? { ...kasten(footLink), label: footLink.getAttribute('aria-label'), href: footLink.getAttribute('href') }
        : null,
      menu:
        menu && getComputedStyle(menu).display !== 'none'
          ? {
              ...kasten(menu),
              expanded: menu.getAttribute('aria-expanded'),
              label: menu.getAttribute('aria-label'),
            }
          : null,
      htmlFont: getComputedStyle(document.documentElement).fontSize,
      h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    }
  })

  await page.screenshot({ path: join(evidenz, `page-top-${vp.name}.png`) })
  await page.locator('header').screenshot({ path: join(evidenz, `navbar-${vp.name}.png`) })
  if (await page.locator('header img').count()) {
    await page.locator('header img').screenshot({ path: join(evidenz, `navbar-logo-${vp.name}.png`) })
  }
  await page.locator('footer').scrollIntoViewIfNeeded()
  await page.locator('footer').screenshot({ path: join(evidenz, `footer-${vp.name}.png`) })
  if (await page.locator('footer img').count()) {
    await page.locator('footer img').screenshot({ path: join(evidenz, `footer-logo-${vp.name}.png`) })
  }

  let menuOffen = null
  if (vp.width < 768) {
    await page.locator('button[aria-controls="oeffentliche-mobile-navigation"]').click()
    await page.waitForFunction(() => {
      const nav = document.querySelector('#oeffentliche-mobile-navigation')
      return Boolean(nav) && !nav.hasAttribute('hidden')
    })
    menuOffen = await page.evaluate(() => {
      const nav = document.querySelector('#oeffentliche-mobile-navigation')
      const box = nav?.getBoundingClientRect()
      return {
        hidden: nav?.hasAttribute('hidden') ?? true,
        width: box?.width ?? 0,
        height: box?.height ?? 0,
        right: box?.right ?? 0,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })
    await page.locator('header').screenshot({ path: join(evidenz, `menu-${vp.name}.png`) })
    await page.keyboard.press('Escape')
  }

  await page.locator('header a[aria-label="Jetnity Startseite"]').focus()
  await page.locator('header').screenshot({ path: join(evidenz, `navbar-focus-${vp.name}.png`) })

  const status = antwort?.status() ?? 0
  const fremd = [...herkuenfte].filter((origin) => origin !== herkunft)
  const lauf = { name: vp.name, text200: Boolean(vp.text200), status, messung, menuOffen, konsole, seitenfehler, fremd }
  laeufe.push(lauf)

  if (phase === 'after') {
    if (status !== 200) fehler.push(`${vp.name}: Status ${status}`)
    if (messung.h1 !== 'Deine ganze Reise. Intelligent an einem Ort.') {
      fehler.push(`${vp.name}: Startseite ist nicht die integrierte Homepage (${messung.h1})`)
    }
    if (messung.scrollWidth > messung.clientWidth + 1) {
      fehler.push(`${vp.name}: horizontaler Overflow ${messung.scrollWidth} > ${messung.clientWidth}`)
    }
    for (const [ort, bild, link] of [
      ['Navbar', messung.navImg, messung.navLink],
      ['Footer', messung.footImg, messung.footLink],
    ]) {
      if (!bild || !link) {
        fehler.push(`${vp.name}: ${ort}-Logo fehlt`)
        continue
      }
      if (bild.alt !== '') fehler.push(`${vp.name}: ${ort}-alt ist nicht leer`)
      if (!bild.src.includes('/brand/jetnity-logo.png')) fehler.push(`${vp.name}: ${ort}-src ${bild.src}`)
      if (bild.naturalWidth !== 384 || bild.naturalHeight !== 128) {
        fehler.push(`${vp.name}: ${ort}-natural ${bild.naturalWidth}x${bild.naturalHeight}`)
      }
      const tablet = ort === 'Navbar' && vp.width >= 768 && vp.width < 1024
      const zielHoehe = tablet ? 32 : 48
      const zielBreite = tablet ? 96 : 144
      if (!nahe(bild.height, zielHoehe, 1) || !nahe(bild.width, zielBreite, 1.5)) {
        fehler.push(`${vp.name}: ${ort}-rendered ${bild.width.toFixed(2)}x${bild.height.toFixed(2)}`)
      }
      if (bild.filter !== 'none') fehler.push(`${vp.name}: ${ort}-filter ${bild.filter}`)
      if (bild.right > vp.width + 1 || bild.left < -1) fehler.push(`${vp.name}: ${ort}-Logo ausserhalb`)
      if (link.label !== 'Jetnity Startseite' || link.href !== '/') {
        fehler.push(`${vp.name}: ${ort}-Link ${link.href} ${link.label}`)
      }
      if (link.height < 44) fehler.push(`${vp.name}: ${ort}-Treffer ${link.height}`)
    }
    if (messung.footLink && messung.footLink.background !== 'rgb(255, 255, 255)') {
      fehler.push(`${vp.name}: Footer-Fläche ${messung.footLink.background}`)
    }
    if (messung.navLink && messung.navLink.background !== 'rgba(0, 0, 0, 0)') {
      fehler.push(`${vp.name}: Navbar-Fläche ${messung.navLink.background}`)
    }
    if (messung.header && messung.header.height < 72) {
      fehler.push(`${vp.name}: Header ${messung.header.height} unter 72`)
    }
    if (!vp.text200 && messung.header && messung.header.height > 80) {
      fehler.push(`${vp.name}: Header ${messung.header.height} verlässt die 72px-Zeile`)
    }
    if (vp.width < 768) {
      if (!messung.menu) fehler.push(`${vp.name}: Menüknopf fehlt`)
      else if (messung.menu.height < 44 || messung.menu.width < 44) {
        fehler.push(`${vp.name}: Menüknopf ${messung.menu.width}x${messung.menu.height}`)
      }
      if (!menuOffen || menuOffen.hidden) fehler.push(`${vp.name}: Menü öffnet nicht`)
      if (menuOffen && menuOffen.scrollWidth > menuOffen.clientWidth + 1) {
        fehler.push(`${vp.name}: Menü-Overflow ${menuOffen.scrollWidth}`)
      }
    } else if (messung.menu) {
      fehler.push(`${vp.name}: Menüknopf auf Desktop sichtbar gemessen`)
    }
    if (vp.text200 && messung.htmlFont !== '32px') fehler.push(`${vp.name}: Schrift ${messung.htmlFont}`)
    if (konsole.length) fehler.push(`${vp.name}: Konsole ${konsole.join(' | ')}`)
    if (seitenfehler.length) fehler.push(`${vp.name}: Seite ${seitenfehler.join(' | ')}`)
    if (fremd.length) fehler.push(`${vp.name}: fremde Herkunft ${fremd.join(',')}`)
  }
  await page.close()
}

await browser.close()
const bericht = {
  stand: new Date().toISOString(),
  phase,
  basis,
  main: process.env.AUDIT_MAIN || null,
  fehler,
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
  laeufe,
}
writeFileSync(join(evidenz, 'audit.json'), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(JSON.stringify({ phase, ergebnis: bericht.ergebnis, fehler }, null, 2))
if (fehler.length) process.exit(1)
