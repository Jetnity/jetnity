#!/usr/bin/env node
// scripts/footer-official-logo-white-1-audit.mjs
//
// Sichtprüfung: offizielles Footer-Logo reinweiß, ohne weiße Fläche.
// AUDIT_BASE ist Pflicht.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '..')
const basis = process.env.AUDIT_BASE
const evidenz = join(wurzel, 'docs/evidence/footer-official-logo-white-1')

if (!basis) {
  console.error('AUDIT_BASE fehlt')
  process.exit(1)
}

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: 'text-200-360x800', width: 360, height: 800, text200: true },
  { name: 'text-200-1440x900', width: 1440, height: 900, text200: true },
]

function nahe(wert, ziel, toleranz) {
  return Math.abs(wert - ziel) <= toleranz
}

function transparent(farbe) {
  return farbe === 'rgba(0, 0, 0, 0)' || farbe === 'transparent'
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
  await page.locator('footer a[aria-label="Jetnity Startseite"]').waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
  })
  await page.waitForFunction(() => {
    const img = document.querySelector('footer img')
    return Boolean(img && img.complete && img.naturalWidth === 384)
  })
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
      }
    }
    function proben(img, mitFilter) {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.filter = mitFilter ? getComputedStyle(img).filter : 'none'
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let deckend = 0
      let weiss = 0
      let dunkel = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue
        deckend += 1
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
        if (r >= 248 && g >= 248 && b >= 248) weiss += 1
        if (r < 80 && g < 120 && b < 100) dunkel += 1
      }
      return { deckend, weiss, dunkel }
    }
    const footer = document.querySelector('footer')
    const header = document.querySelector('header')
    const footImg = footer?.querySelector('img') ?? null
    const navImg = header?.querySelector('img') ?? null
    const footLink = footImg?.closest('a') ?? null
    const navLink = navImg?.closest('a') ?? null
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      htmlFont: getComputedStyle(document.documentElement).fontSize,
      h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      footer: kasten(footer),
      footImg: footImg
        ? {
            ...kasten(footImg),
            alt: footImg.getAttribute('alt'),
            src: footImg.currentSrc || footImg.src,
            naturalWidth: footImg.naturalWidth,
            naturalHeight: footImg.naturalHeight,
            gefiltert: proben(footImg, true),
            ungefiltert: proben(footImg, false),
          }
        : null,
      footLink: footLink
        ? { ...kasten(footLink), label: footLink.getAttribute('aria-label'), href: footLink.getAttribute('href') }
        : null,
      navImg: navImg
        ? {
            ...kasten(navImg),
            alt: navImg.getAttribute('alt'),
            src: navImg.currentSrc || navImg.src,
            naturalWidth: navImg.naturalWidth,
            naturalHeight: navImg.naturalHeight,
            ungefiltert: proben(navImg, false),
          }
        : null,
      navLink: navLink ? { ...kasten(navLink), label: navLink.getAttribute('aria-label') } : null,
    }
  })

  await page.locator('footer').scrollIntoViewIfNeeded()
  await page.locator('footer').screenshot({ path: join(evidenz, `footer-${vp.name}.png`) })
  await page.locator('footer img').screenshot({ path: join(evidenz, `footer-logo-${vp.name}.png`) })
  await page.locator('header img').screenshot({ path: join(evidenz, `navbar-logo-${vp.name}.png`) })

  const fokus = await page.evaluate(() => {
    const link = document.querySelector('footer a[aria-label="Jetnity Startseite"]')
    link?.focus({ focusVisible: true })
    const stil = link ? getComputedStyle(link) : null
    return {
      aktiv: document.activeElement === link,
      sichtbar: link ? link.matches(':focus-visible') : false,
      boxShadow: stil?.boxShadow ?? '',
      outline: stil?.outlineStyle ?? '',
    }
  })
  await page.locator('footer').screenshot({ path: join(evidenz, `footer-focus-${vp.name}.png`) })

  const status = antwort?.status() ?? 0
  const fremd = [...herkuenfte].filter((origin) => origin !== herkunft)
  laeufe.push({ name: vp.name, text200: Boolean(vp.text200), status, messung, fokus, konsole, seitenfehler, fremd })

  if (status !== 200) fehler.push(`${vp.name}: Status ${status}`)
  if (messung.h1 !== 'Deine ganze Reise. Intelligent an einem Ort.') {
    fehler.push(`${vp.name}: Startseite (${messung.h1})`)
  }
  if (messung.scrollWidth > messung.clientWidth + 1) {
    fehler.push(`${vp.name}: horizontaler Overflow ${messung.scrollWidth} > ${messung.clientWidth}`)
  }
  if (vp.text200 && messung.htmlFont !== '32px') fehler.push(`${vp.name}: Schrift ${messung.htmlFont}`)
  if (messung.footer?.background !== 'rgb(15, 48, 42)') {
    fehler.push(`${vp.name}: Footer-Grund ${messung.footer?.background}`)
  }
  const bild = messung.footImg
  const link = messung.footLink
  if (!bild || !link) fehler.push(`${vp.name}: Footer-Logo fehlt`)
  else {
    if (bild.alt !== '') fehler.push(`${vp.name}: Footer-alt`)
    if (!bild.src.includes('/brand/jetnity-logo.png')) fehler.push(`${vp.name}: Footer-src ${bild.src}`)
    if (bild.naturalWidth !== 384 || bild.naturalHeight !== 128) {
      fehler.push(`${vp.name}: Footer-natural ${bild.naturalWidth}x${bild.naturalHeight}`)
    }
    if (!nahe(bild.height, 48, 1) || !nahe(bild.width, 144, 1.5)) {
      fehler.push(`${vp.name}: Footer-rendered ${bild.width.toFixed(2)}x${bild.height.toFixed(2)}`)
    }
    if (!/brightness\(0\)/.test(bild.filter) || !/invert\(1\)/.test(bild.filter)) {
      fehler.push(`${vp.name}: Footer-filter ${bild.filter}`)
    }
    if (!transparent(link.background)) fehler.push(`${vp.name}: Footer-Fläche ${link.background}`)
    if (link.label !== 'Jetnity Startseite' || link.href !== '/') {
      fehler.push(`${vp.name}: Footer-Link ${link.href} ${link.label}`)
    }
    if (link.height < 44) fehler.push(`${vp.name}: Footer-Treffer ${link.height}`)
    if (bild.right > vp.width + 1 || bild.left < -1) fehler.push(`${vp.name}: Footer-Logo ausserhalb`)
    if (bild.gefiltert.deckend < 1000 || bild.gefiltert.weiss < bild.gefiltert.deckend * 0.98) {
      fehler.push(`${vp.name}: Footer-Pixel ${bild.gefiltert.weiss}/${bild.gefiltert.deckend} nicht weiß`)
    }
    if (bild.gefiltert.dunkel > 0) fehler.push(`${vp.name}: Footer bleibt dunkel ${bild.gefiltert.dunkel}`)
    if (bild.ungefiltert.dunkel < 1000) fehler.push(`${vp.name}: Asset ohne dunkles Wortzeichen`)
  }
  const nav = messung.navImg
  if (!nav) fehler.push(`${vp.name}: Navbar-Logo fehlt`)
  else {
    if (nav.filter !== 'none') fehler.push(`${vp.name}: Navbar-filter ${nav.filter}`)
    if (!nav.src.includes('/brand/jetnity-logo.png')) fehler.push(`${vp.name}: Navbar-src ${nav.src}`)
    if (nav.ungefiltert.dunkel < 1000 || nav.ungefiltert.weiss > nav.ungefiltert.deckend * 0.05) {
      fehler.push(`${vp.name}: Navbar nicht vollfarbig ${JSON.stringify(nav.ungefiltert)}`)
    }
    if (messung.navLink && !transparent(messung.navLink.background)) {
      fehler.push(`${vp.name}: Navbar-Fläche ${messung.navLink.background}`)
    }
  }
  if (!fokus.aktiv || !fokus.sichtbar) fehler.push(`${vp.name}: Fokus ${JSON.stringify(fokus)}`)
  if (!fokus.boxShadow || fokus.boxShadow === 'none') fehler.push(`${vp.name}: Fokusring fehlt`)
  if (konsole.length) fehler.push(`${vp.name}: Konsole ${konsole.join(' | ')}`)
  if (seitenfehler.length) fehler.push(`${vp.name}: Seite ${seitenfehler.join(' | ')}`)
  if (fremd.length) fehler.push(`${vp.name}: fremde Herkunft ${fremd.join(',')}`)

  await page.close()
}

await browser.close()
const bericht = {
  stand: new Date().toISOString(),
  basis,
  main: process.env.AUDIT_MAIN || null,
  fehler,
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
  laeufe,
}
writeFileSync(join(evidenz, 'audit.json'), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(JSON.stringify({ ergebnis: bericht.ergebnis, fehler }, null, 2))
if (fehler.length) process.exit(1)
