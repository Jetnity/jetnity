#!/usr/bin/env node
/**
 * Sicht- und Interaktionsmatrix für Account Reisende, Premium Registry UX 1.
 *
 * Misst den ausgelieferten Server (`next start` oder `next dev`).
 * Fixtures nur über /ui-audit/account-travellers.
 *
 * Aufruf:
 *   node scripts/account-travellers-premium-registry-ux-1-audit.mjs
 *     [--marke vorher|nachher]
 *     [--modus dev|start]
 *     [--port <nummer>]
 *     [--verzeichnis <ordner>]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const option = (name, standard) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? standard : argv[index + 1]
}

const PORT = option('port', '3497')
const MARKE = option('marke', 'nachher')
const MODUS = option('modus', 'start')
const VERZEICHNIS = option('verzeichnis', 'docs/evidence/account-travellers-premium-registry-ux-1')
const BASIS = option('basis', `http://127.0.0.1:${PORT}`)
const PFAD = '/ui-audit/account-travellers'

const BREITEN = [
  { name: '320x568', width: 320, height: 568 },
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1728x1117', width: 1728, height: 1117 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '844x390', width: 844, height: 390 },
]

const SCHIRME = join(VERZEICHNIS, 'screens')
mkdirSync(SCHIRME, { recursive: true })

function serverBefehl() {
  if (MODUS === 'dev') return ['npx', ['next', 'dev', '-p', PORT, '-H', '127.0.0.1']]
  return ['npx', ['next', 'start', '-p', PORT, '-H', '127.0.0.1']]
}

async function serverStarten() {
  const [befehl, args] = serverBefehl()
  const kind = spawn(befehl, args, {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  const ausgabe = []
  kind.stdout.on('data', (stueck) => ausgabe.push(String(stueck)))
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))
  const start = Date.now()
  let antwortet = false
  while (!antwortet && Date.now() - start < 180_000) {
    try {
      const antwort = await fetch(`${BASIS}${PFAD}?zustand=zwei`)
      antwortet = antwort.ok
      await antwort.arrayBuffer()
    } catch {
      antwortet = false
    }
    if (!antwortet) await new Promise((r) => setTimeout(r, 500))
  }
  if (!antwortet) {
    serverStoppen(kind)
    throw new Error(`Next.js antwortete nicht:\n${ausgabe.join('').slice(-4000)}`)
  }
  return kind
}

function serverStoppen(kind) {
  if (!kind?.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

async function messung(page) {
  return page.evaluate(() => {
    const fehler = []
    const flaeche = document.querySelector('#registry-messflaeche')
    const nav = document.querySelector('header')
    const navUnten = nav ? nav.getBoundingClientRect().bottom : 0
    const dokumentUeberlauf = document.documentElement.scrollWidth > window.innerWidth + 1
    const registryUeberlauf = flaeche
      ? flaeche.scrollWidth > flaeche.clientWidth + 1 || flaeche.getBoundingClientRect().right > window.innerWidth + 1
      : false
    const ueberlauf = registryUeberlauf
    if (registryUeberlauf) {
      fehler.push(`Registry-Overflow ${flaeche.scrollWidth}>${flaeche.clientWidth}`)
    }
    const ziele = [...document.querySelectorAll('#registry-messflaeche button, #registry-messflaeche a, #registry-messflaeche input, #registry-messflaeche select')]
    let kleinsteTaste = null
    for (const ziel of ziele) {
      const box = ziel.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) continue
      const taste = ziel.tagName === 'BUTTON' || ziel.tagName === 'A'
      if (taste && box.height < 44) {
        fehler.push(`Trefferfläche ${Math.round(box.height)}px: ${(ziel.textContent || '').trim().slice(0, 40)}`)
      }
      if (taste && (kleinsteTaste == null || box.height < kleinsteTaste)) kleinsteTaste = box.height
      if ((ziel.tagName === 'INPUT' || ziel.tagName === 'SELECT') && box.width > 0) {
        const schrift = parseFloat(getComputedStyle(ziel).fontSize)
        if (schrift < 16) fehler.push(`Eingabe ${schrift}px: ${ziel.getAttribute('aria-label') || ziel.id || ziel.tagName}`)
      }
    }
    const titel = document.querySelector('#registry-messflaeche h1')
    if (titel && titel.getBoundingClientRect().top < navUnten - 1 && window.scrollY < 2) {
      fehler.push('Titel liegt beim ersten Bild unter der Navigation')
    }
    const formulare = document.querySelectorAll('#registry-messflaeche form').length
    const hinzufuegen = [...document.querySelectorAll('#registry-messflaeche button')].find((knopf) =>
      (knopf.textContent || '').includes('Reisenden hinzufügen'),
    )
    const anlegen = [...document.querySelectorAll('#registry-messflaeche h2, #registry-messflaeche button')].find((knoten) =>
      (knoten.textContent || '').includes('Person hinzufügen') || (knoten.textContent || '').includes('Reisenden anlegen'),
    )
    const karten = document.querySelectorAll('#registry-messflaeche article').length
    return {
      ok: fehler.length === 0,
      fehler,
      seitenhoehe: document.documentElement.scrollHeight,
      registryHoehe: flaeche ? Math.round(flaeche.getBoundingClientRect().height) : null,
      formulare,
      karten,
      hinzufuegenY: hinzufuegen ? Math.round(hinzufuegen.getBoundingClientRect().top + window.scrollY) : null,
      anlegenY: anlegen ? Math.round(anlegen.getBoundingClientRect().top + window.scrollY) : null,
      ersteKarteY: (() => {
        const karte = document.querySelector('#registry-messflaeche article')
        return karte ? Math.round(karte.getBoundingClientRect().top + window.scrollY) : null
      })(),
      kleinsteTaste: kleinsteTaste == null ? null : Math.round(kleinsteTaste),
      ueberlauf,
      dokumentUeberlauf,
      text: (document.querySelector('#registry-messflaeche')?.innerText || '').slice(0, 500),
    }
  })
}

async function alsWebp(page, png) {
  const basis64 = png.toString('base64')
  const daten = await page.evaluate(async (quelle) => {
    const bild = new Image()
    bild.src = `data:image/png;base64,${quelle}`
    await bild.decode()
    const flaeche = document.createElement('canvas')
    const breite = Math.min(bild.naturalWidth, 1600)
    const faktor = breite / bild.naturalWidth
    flaeche.width = breite
    flaeche.height = Math.round(bild.naturalHeight * faktor)
    flaeche.getContext('2d')?.drawImage(bild, 0, 0, flaeche.width, flaeche.height)
    return flaeche.toDataURL('image/webp', 0.8).split(',')[1]
  }, basis64)
  return Buffer.from(daten, 'base64')
}

async function schuss(page, name, vollbild = false) {
  const png = await page.screenshot({ fullPage: vollbild, type: 'png' })
  const webp = await alsWebp(page, png)
  writeFileSync(join(SCHIRME, `${MARKE}_${name}.webp`), webp)
}

async function konsoleSammeln(page, sammlung) {
  page.on('console', (eintrag) => {
    if (eintrag.type() === 'error') sammlung.push(eintrag.text())
  })
  page.on('pageerror', (fehler) => sammlung.push(String(fehler)))
}

async function textSkalieren(page, prozent) {
  await page.evaluate((wert) => {
    document.documentElement.style.fontSize = `${(16 * wert) / 100}px`
  }, prozent)
}

async function seitenzoom(page, faktor) {
  await page.evaluate((wert) => {
    document.documentElement.style.zoom = String(wert)
  }, faktor)
}

const server = argv.includes('--basis') ? null : await serverStarten()
const bericht = {
  marke: MARKE,
  modus: MODUS,
  ansichten: [],
  interaktion: [],
  konsolenfehler: [],
}

try {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const fehler = []
  await konsoleSammeln(page, fehler)

  for (const breite of BREITEN) {
    await page.setViewportSize({ width: breite.width, height: breite.height })
    await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#registry-messflaeche h1')
    const wert = await messung(page)
    bericht.ansichten.push({ name: breite.name, zustand: 'zwei', ...wert })
    if (['360x800', '390x844', '768x1024', '1280x800', '1440x900', '1920x1080', '844x390'].includes(breite.name)) {
      await schuss(page, `${breite.name}_zwei`, breite.name === '390x844' || breite.name === '1280x800')
    }
  }

  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
  await textSkalieren(page, 200)
  await page.waitForTimeout(100)
  const text200 = await messung(page)
  bericht.ansichten.push({ name: '360x800-text-200', zustand: 'zwei', ...text200 })
  await schuss(page, '360x800_text-200_zwei', true)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
  await seitenzoom(page, 1.25)
  bericht.ansichten.push({ name: '1440x900-zoom-125', zustand: 'zwei', ...(await messung(page)) })
  await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
  await seitenzoom(page, 1.5)
  const zoom150 = await messung(page)
  bericht.ansichten.push({ name: '1440x900-zoom-150', zustand: 'zwei', ...zoom150 })
  await schuss(page, '1440x900_zoom-150_zwei')

  await page.setViewportSize({ width: 390, height: 844 })
  for (const zustand of ['leer', 'fehler']) {
    await page.goto(`${BASIS}${PFAD}?zustand=${zustand}`, { waitUntil: 'networkidle' })
    const wert = await messung(page)
    const text = await page.locator('#registry-messflaeche').innerText()
    bericht.ansichten.push({
      name: `390x844-${zustand}`,
      zustand,
      ...wert,
      leerGetrennt: zustand !== 'leer' || text.includes('Noch keine Reisenden'),
      fehlerGetrennt: zustand !== 'fehler' || text.includes('konnten nicht geladen werden'),
    })
    await schuss(page, `390x844_${zustand}`)
  }

  if (MARKE === 'nachher') {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
    const hinzufuegen = page.getByRole('button', { name: 'Reisenden hinzufügen' })
    const vorFokus = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? null)
    await hinzufuegen.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('textbox', { name: 'Bezeichnung' }).waitFor()
    const formularOben = await page.evaluate(() => {
      const form = document.querySelector('#registry-messflaeche form')
      const karte = document.querySelector('#registry-messflaeche article')
      if (!form) return false
      const formY = form.getBoundingClientRect().top
      const kartenY = karte ? karte.getBoundingClientRect().top : Number.POSITIVE_INFINITY
      return formY < kartenY
    })
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    const fokusZurueck = await hinzufuegen.evaluate((knoten) => document.activeElement === knoten)

    const verwalten = page.getByRole('button', { name: 'Verwalten' }).first()
    await verwalten.click()
    await page.getByRole('button', { name: 'Schließen' }).waitFor()
    const verwaltung = await page.evaluate(() => ({
      formulare: document.querySelectorAll('#registry-messflaeche form').length,
      gleichrangig: document.body.innerText.includes('gleichrangig'),
      ablauf: document.body.innerText.includes('vor dem heutigen Kalendertag abgelaufen'),
      loeschenText: document.body.innerText.includes('nicht umgeschrieben oder gelöscht'),
      verwaltet: document.querySelectorAll('[data-registry-verwaltung="offen"]').length,
    }))
    await page.getByRole('button', { name: 'Angaben ändern' }).click()
    await page.getByRole('textbox', { name: 'Bezeichnung' }).waitFor()
    await schuss(page, '390x844_identitaet', true)
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await page.getByRole('button', { name: 'Staatsbürgerschaft hinzufügen' }).click()
    await page.getByRole('searchbox').first().waitFor()
    const citizenshipLeer = await page.evaluate(() => {
      const auswahl = document.querySelector('#registry-messflaeche select')
      return auswahl ? auswahl.value === '' : false
    })
    await schuss(page, '390x844_staatsbuergerschaft')

    await page.getByRole('button', { name: 'Dokument hinzufügen' }).click()
    const dokumentLeer = await page.evaluate(() => {
      const typ = [...document.querySelectorAll('#registry-messflaeche select')].find((feld) =>
        (feld.closest('label')?.textContent || '').includes('Dokumenttyp'),
      )
      const zuordnung = [...document.querySelectorAll('#registry-messflaeche select')].find((feld) =>
        (feld.closest('label')?.textContent || '').includes('Zugeordnete Staatsbürgerschaft'),
      )
      return { typ: typ?.value ?? null, zuordnung: zuordnung?.value ?? null }
    })
    await schuss(page, '390x844_dokument')
    await page.getByRole('button', { name: 'Dokument ändern' }).first().click()
    const editId = await page.getAttribute('[data-registry-dokument-edit]', 'data-registry-dokument-edit')

    const schriften = await page.evaluate(() =>
      [...document.querySelectorAll('#registry-messflaeche input, #registry-messflaeche select')].map((feld) =>
        parseFloat(getComputedStyle(feld).fontSize),
      ),
    )
    const tasten = await page.evaluate(() =>
      [...document.querySelectorAll('#registry-messflaeche button')]
        .map((feld) => Math.round(feld.getBoundingClientRect().height))
        .filter((hoehe) => hoehe > 0),
    )
    await page.getByRole('button', { name: 'Löschen' }).click()
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('alertdialog').scrollIntoViewIfNeeded()
    const dialog = await page.getByRole('alertdialog').innerText()
    await schuss(page, '390x844_loeschen', true)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Abbrechen' }).click()
    await page.getByRole('button', { name: 'Schließen' }).click()
    const wiederKompakt = await page.locator('[data-registry-verwaltung="offen"]').count()
    const fokusKarte = await verwalten.evaluate((knoten) => document.activeElement === knoten)

    await page.getByRole('button', { name: 'Verwalten' }).nth(1).click()
    await page.getByRole('button', { name: 'Verwalten' }).first().click()
    const nurEine = await page.locator('[data-registry-verwaltung="offen"]').count()

    bericht.interaktion.push({
      vorFokus,
      formularOben,
      fokusZurueck,
      verwaltung,
      citizenshipLeer,
      dokumentLeer,
      editId,
      schriften,
      tasten,
      dialogEnthaeltTrips: dialog.includes('nicht umgeschrieben oder gelöscht'),
      wiederKompakt,
      fokusKarte,
      nurEine,
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASIS}${PFAD}?zustand=zwei`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Verwalten' }).first().click()
    await schuss(page, '1280x800_verwalten', true)
    const spalten = await page.evaluate(() => {
      const karten = [...document.querySelectorAll('#registry-messflaeche article')]
      if (karten.length < 2) return null
      const a = karten[0].getBoundingClientRect()
      const b = karten[1].getBoundingClientRect()
      return { nebeneinander: Math.abs(a.top - b.top) < 8, aBreite: Math.round(a.width), bBreite: Math.round(b.width) }
    })
    await page.getByRole('button', { name: 'Schließen' }).click()
    const raster = await page.evaluate(() => {
      const karten = [...document.querySelectorAll('#registry-messflaeche article')]
      if (karten.length < 2) return null
      const a = karten[0].getBoundingClientRect()
      const b = karten[1].getBoundingClientRect()
      return { nebeneinander: Math.abs(a.top - b.top) < 8 }
    })
    bericht.interaktion.push({ spalten, raster })
    await schuss(page, '1280x800_raster')
  }

  bericht.konsolenfehler = fehler.filter((eintrag) => !eintrag.includes('favicon'))
  await browser.close()
} finally {
  serverStoppen(server)
}

const datei = join(VERZEICHNIS, `${MARKE}.json`)
writeFileSync(datei, JSON.stringify(bericht, null, 2))

const hart = []
if (MARKE === 'nachher') {
  const zwei = bericht.ansichten.filter((eintrag) => eintrag.zustand === 'zwei' && eintrag.formulare != null)
  for (const eintrag of zwei) {
    if (eintrag.formulare !== 0) hart.push(`${eintrag.name}: ${eintrag.formulare} Formulare auf dem ersten Bild`)
    if (eintrag.hinzufuegenY == null) hart.push(`${eintrag.name}: Aktion fehlt`)
    if (eintrag.ersteKarteY != null && eintrag.hinzufuegenY != null && eintrag.hinzufuegenY > eintrag.ersteKarteY) {
      hart.push(`${eintrag.name}: Aktion liegt unter der ersten Karte`)
    }
    if (eintrag.ueberlauf) hart.push(`${eintrag.name}: horizontaler Overflow`)
    if (eintrag.fehler?.length) hart.push(`${eintrag.name}: ${eintrag.fehler.join('; ')}`)
  }
  const lauf = bericht.interaktion[0]
  if (!lauf?.formularOben) hart.push('Anlegeformular liegt nicht über den Karten')
  if (!lauf?.fokusZurueck) hart.push('Fokus kehrt nicht zur Hinzufügen-Aktion zurück')
  if (!lauf?.fokusKarte) hart.push('Fokus kehrt nicht zu Verwalten zurück')
  if (lauf?.verwaltung?.verwaltet !== 1) hart.push('Verwaltung nicht genau einmal offen')
  if (lauf?.nurEine !== 1) hart.push('Mehr als eine Verwaltung offen')
  if (lauf?.wiederKompakt !== 0) hart.push('Nach Schliessen bleibt eine Verwaltung offen')
  if (!lauf?.verwaltung?.gleichrangig) hart.push('Gleichrangigkeits-Text fehlt')
  if (!lauf?.verwaltung?.ablauf) hart.push('Ablauftext fehlt')
  if (!lauf?.dialogEnthaeltTrips) hart.push('Löschbestätigung unvollständig')
  if (lauf?.citizenshipLeer !== true) hart.push('Staatsbürgerschaft ist vorausgewählt')
  if (lauf?.dokumentLeer?.typ !== '') hart.push('Dokumenttyp ist vorausgewählt')
  if (lauf?.dokumentLeer?.zuordnung !== '') hart.push('Dokumentzuordnung ist vorausgewählt')
  if (!lauf?.editId) hart.push('Dokumentbearbeitung ohne genaue Id')
  if (!lauf?.schriften?.length || lauf.schriften.some((wert) => wert < 16)) {
    hart.push(`Eingaben unter 16px: ${(lauf?.schriften || []).join(',')}`)
  }
  if (!lauf?.tasten?.length || lauf.tasten.some((wert) => wert < 44)) {
    hart.push(`Tasten unter 44px: ${(lauf?.tasten || []).join(',')}`)
  }
  if (!bericht.interaktion[1]?.raster?.nebeneinander) hart.push('Zusammenfassungen stehen auf 1280 nicht nebeneinander')
  if (bericht.konsolenfehler.length) hart.push(`Konsole: ${bericht.konsolenfehler.join(' | ')}`)
}

if (hart.length) {
  console.error(hart.join('\n'))
  process.exit(1)
}

console.log(`geschrieben: ${datei}`)
const probe = bericht.ansichten.find((eintrag) => eintrag.name === '390x844')
console.log(JSON.stringify({ hoehe: probe?.seitenhoehe, registry: probe?.registryHoehe, formulare: probe?.formulare }))
