#!/usr/bin/env node
/**
 * Sicht- und Höhenbelege für Deine Welt, Besuchverwaltung Premium 1.
 *
 * Gemessen wird der ausgelieferte Build (`next start`). Die Dichte von
 * vierzig Ereignissen liegt nur im Audit (`?dichte=40`) und ändert
 * AccountAuditClient nicht.
 *
 * Voraussetzung: `npm run build`.
 *
 * Aufruf:
 *   node scripts/account-world-visit-management-premium-1-audit.mjs
 *     [--marke vorher|nachher]
 *     [--erwartung alt|neu]
 *     [--profil hoehe|voll]
 *     [--verzeichnis <ordner>]
 *     [--port <nummer>]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const option = (name, standard) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? standard : argv[index + 1]
}

const PORT = option('port', '3491')
const MARKE = option('marke', 'nachher')
const ERWARTUNG = option('erwartung', 'neu')
const PROFIL = option('profil', 'voll')
const VERZEICHNIS = option(
  'verzeichnis',
  'docs/evidence/account-world-visit-management-premium-1',
)
const BASIS = `http://127.0.0.1:${PORT}`

const ALLE_BREITEN = [
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

const HOEHE_BREITEN = ['390x844', '768x1024', '1440x900', '1920x1080']
const BREITEN =
  PROFIL === 'hoehe'
    ? ALLE_BREITEN.filter((eintrag) => HOEHE_BREITEN.includes(eintrag.name))
    : ALLE_BREITEN

const BILD_BREITEN = new Set(
  PROFIL === 'hoehe' ? HOEHE_BREITEN : ['390x844', '768x1024', '1440x900', '1920x1080', '320x568', '844x390'],
)
const ZUSTAND_BILDER = new Set(['390x844', '1440x900'])

mkdirSync(VERZEICHNIS, { recursive: true })

async function serverStarten() {
  const kind = spawn('npx', ['next', 'start', '-p', PORT, '-H', '127.0.0.1'], {
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
  let bereit = false
  const ausgabe = []
  kind.stdout.on('data', (stueck) => {
    const text = String(stueck)
    ausgabe.push(text)
    if (text.includes('Ready') || text.includes('started')) bereit = true
  })
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))
  const start = Date.now()
  while (!bereit && Date.now() - start < 120_000) await new Promise((r) => setTimeout(r, 250))
  let antwortet = false
  while (!antwortet && Date.now() - start < 240_000) {
    try {
      const antwort = await fetch(`${BASIS}/ui-audit/account?zustand=leer&ansicht=besuche`)
      antwortet = antwort.ok
      await antwort.arrayBuffer()
    } catch {
      antwortet = false
    }
    if (!antwortet) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!antwortet) {
    serverStoppen(kind)
    throw new Error(`Next.js antwortete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

function serverStoppen(kind) {
  if (!kind.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

function assertNeu(bedingung, meldung, befunde) {
  if (ERWARTUNG !== 'neu') return
  if (!bedingung) befunde.push(meldung)
}

async function lesen(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const heading = document.getElementById('account-besuche-liste')
    const form = document.querySelector('[data-besuch-formular]')
    const button = document.querySelector('[data-besuch-hinzufuegen]')
    const section = heading?.closest('section') ?? null
    const karten = [...document.querySelectorAll('article[data-besuch]')]
    const absTop = (el) => Math.round(el.getBoundingClientRect().top + window.scrollY)
    const headingTop = heading ? absTop(heading) : null
    const formTop = form ? absTop(form) : null
    const buttonRect = button?.getBoundingClientRect() ?? null
    const verwaltung = document.querySelector('[data-besuch-verwaltung]')
    const ziele = [
      ...(verwaltung?.querySelectorAll('button, a, input, select, textarea') ?? []),
      ...(button ? [button] : []),
    ]
    const klein = []
    for (const el of ziele) {
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      if (rect.width >= 43.5 && rect.height >= 43.5) continue
      klein.push({
        tag: el.tagName,
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 48),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      })
    }
    const schriften = [...(verwaltung?.querySelectorAll('input, select, textarea') ?? [])].map((el) => ({
      tag: el.tagName,
      id: el.id,
      px: Number.parseFloat(getComputedStyle(el).fontSize),
    }))
    const limit = doc.clientWidth
    const laeuftUeber = (el) => {
      if (!el) return false
      const rahmen = el.getBoundingClientRect()
      return rahmen.left < -1 || rahmen.right > limit + 1
    }
    const nav = document.querySelector('nav')
    const h1 = document.querySelector('h1')
    const navBox = nav?.getBoundingClientRect()
    const h1Box = h1?.getBoundingClientRect()
    return {
      seiteHoehe: doc.scrollHeight,
      ueberlauf: doc.scrollWidth > doc.clientWidth + 1,
      scrollBreite: doc.scrollWidth,
      clientBreite: doc.clientWidth,
      headingBisFormular: headingTop != null && formTop != null ? formTop - headingTop : null,
      karten: karten.length,
      titel: karten.map((karte) => karte.querySelector('h3')?.textContent ?? ''),
      gesamt: document.querySelector('[data-besuch-gesamt]')?.getAttribute('data-besuch-gesamt'),
      verborgen: document.querySelector('[data-besuch-verborgen]')?.getAttribute('data-besuch-verborgen'),
      button: buttonRect
        ? {
            top: Math.round(buttonRect.top + window.scrollY),
            sichtTop: Math.round(buttonRect.top),
            width: Math.round(buttonRect.width),
            height: Math.round(buttonRect.height),
            imErstenBild: buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight,
          }
        : null,
      klein,
      schriften,
      h1UnterNav: Boolean(navBox && h1Box && h1Box.top < navBox.bottom - 1),
      verwaltungUeberlauf: laeuftUeber(section),
      kopfUeberlauf: laeuftUeber(h1) || laeuftUeber(button),
      fehlerText: document.body.innerText.includes('Deine Besuche konnten nicht gelesen werden.'),
      leerText: document.body.innerText.includes('Noch keine Besuche bestätigt'),
    }
  })
}

const server = await serverStarten()
const befunde = []
const messungen = []
const netz = []
const konsole = []

try {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const umwandler = await browser.newPage()
  const alsWebp = async (puffer) =>
    Buffer.from(
      await umwandler.evaluate(async (basis64) => {
        const bild = new Image()
        bild.src = `data:image/png;base64,${basis64}`
        await bild.decode()
        const flaeche = document.createElement('canvas')
        flaeche.width = bild.naturalWidth
        flaeche.height = bild.naturalHeight
        flaeche.getContext('2d')?.drawImage(bild, 0, 0)
        return flaeche.toDataURL('image/webp', 0.8).split(',')[1]
      }, puffer.toString('base64')),
      'base64',
    )

  async function bild(page, name) {
    const puffer = await page.screenshot({ fullPage: false, animations: 'disabled' })
    writeFileSync(join(VERZEICHNIS, `${MARKE}-${name}.webp`), await alsWebp(puffer))
  }

  async function ganz(page, name) {
    const puffer = await page.screenshot({ fullPage: true, animations: 'disabled' })
    writeFileSync(join(VERZEICHNIS, `${MARKE}-${name}-voll.webp`), await alsWebp(puffer))
  }

  const seite = await browser.newPage()
  await seite.emulateMedia({ reducedMotion: 'reduce' })
  seite.on('request', (anfrage) => {
    const url = anfrage.url()
    if (url.includes('/api/') || url.includes('/places')) netz.push(url)
  })
  seite.on('pageerror', (fehler) => konsole.push(String(fehler)))
  seite.on('console', (nachricht) => {
    if (nachricht.type() === 'error') konsole.push(nachricht.text())
  })

  async function oeffnen(seite) {
    const knopf = seite.locator('[data-besuch-hinzufuegen]')
    if ((await knopf.count()) === 0) return
    if ((await knopf.getAttribute('aria-expanded')) !== 'true') await knopf.click()
    await seite.locator('#account-besuch-anlegen').waitFor()
  }

  for (const breite of BREITEN) {
    await seite.setViewportSize({ width: breite.width, height: breite.height })

    await seite.goto(`${BASIS}/ui-audit/account?dichte=40`, { waitUntil: 'networkidle' })
    await seite.locator('#account-besuche-liste').waitFor()
    const ruhe = await lesen(seite)
    const vorNetz = netz.length
    messungen.push({ breite: breite.name, zustand: 'dichte-ruhe', ...ruhe, titel: undefined, lissabon: ruhe.titel.filter((t) => t === 'Lissabon').length })
    if (BILD_BREITEN.has(breite.name)) {
      await seite.locator('#account-besuche-liste').scrollIntoViewIfNeeded()
      await bild(seite, `${breite.name}-dichte-ruhe`)
    }
    if (breite.name === '390x844' || breite.name === '1440x900') await ganz(seite, `${breite.name}-dichte-ruhe`)

    if (ERWARTUNG === 'neu') {
      assertNeu(ruhe.karten === 12, `${breite.name}: sichtbar ${ruhe.karten}, erwartet 12`, befunde)
      assertNeu(ruhe.gesamt === '40', `${breite.name}: gesamt ${ruhe.gesamt}`, befunde)
      assertNeu(
        (ruhe.button?.sichtTop ?? 9999) >= 0 && (ruhe.button?.sichtTop ?? 9999) < breite.height,
        `${breite.name}: Hinzufügen nicht im ersten Bild (top ${ruhe.button?.sichtTop})`,
        befunde,
      )
      assertNeu((ruhe.button?.height ?? 0) >= 44, `${breite.name}: Hinzufügen zu niedrig`, befunde)
      assertNeu(!ruhe.ueberlauf, `${breite.name}: horizontaler Überlauf in Ruhe`, befunde)
      assertNeu(!ruhe.h1UnterNav, `${breite.name}: Überschrift unter der Navigation`, befunde)
      if (breite.width < 640) {
        const kleinSchrift = ruhe.schriften.filter((schrift) => schrift.px < 16)
        assertNeu(kleinSchrift.length === 0, `${breite.name}: Eingabe unter 16px ${JSON.stringify(kleinSchrift)}`, befunde)
      }
      assertNeu(ruhe.klein.length === 0, `${breite.name}: Ziele unter 44px ${JSON.stringify(ruhe.klein)}`, befunde)

      await oeffnen(seite)
      const offen = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'dichte-anlage',
        ...offen,
        titel: undefined,
      })
      assertNeu((offen.headingBisFormular ?? 9999) < 900, `${breite.name}: Formular ${offen.headingBisFormular}px unter der Überschrift`, befunde)
      assertNeu(netz.length === vorNetz, `${breite.name}: Netz beim Öffnen ${netz.slice(vorNetz).join(' ')}`, befunde)
      if (breite.width < 640) {
        const kleinSchrift = offen.schriften.filter((schrift) => schrift.px < 16)
        assertNeu(kleinSchrift.length === 0, `${breite.name}: Formularschrift unter 16px ${JSON.stringify(kleinSchrift)}`, befunde)
      }
      assertNeu(offen.klein.length === 0, `${breite.name}: Formularziele unter 44px ${JSON.stringify(offen.klein)}`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) {
        await seite.locator('#account-besuch-anlegen').scrollIntoViewIfNeeded()
        await bild(seite, `${breite.name}-anlage`)
      }

      await seite.locator('[data-besuch-hinzufuegen]').click()
      const erste = seite.locator('article[data-besuch]').first()
      await erste.getByRole('button', { name: 'Bearbeiten' }).click()
      await erste.getByRole('heading', { name: 'Besuch bearbeiten' }).waitFor()
      const edit = await lesen(seite)
      messungen.push({ breite: breite.name, zustand: 'dichte-edit', karten: edit.karten, ueberlauf: edit.ueberlauf, klein: edit.klein.length })
      assertNeu(edit.karten === 12, `${breite.name}: Edit verändert die Sichtbarkeit`, befunde)
      assertNeu(!edit.ueberlauf, `${breite.name}: Überlauf im Edit`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-edit`)
      await erste.getByRole('button', { name: 'Abbrechen' }).click()

      await erste.getByRole('button', { name: 'Besuch widerrufen' }).click()
      await erste.getByText('Diesen bestätigten Besuch widerrufen?').waitFor()
      const widerruf = await lesen(seite)
      messungen.push({ breite: breite.name, zustand: 'dichte-widerruf', ueberlauf: widerruf.ueberlauf, klein: widerruf.klein.length })
      assertNeu(!widerruf.ueberlauf, `${breite.name}: Überlauf in der Widerrufsfrage`, befunde)
      assertNeu(widerruf.klein.length === 0, `${breite.name}: Widerrufziele unter 44px`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-widerruf`)
      await erste.getByRole('button', { name: 'Abbrechen' }).click()

      const vorSuche = netz.length
      await seite.locator('[data-besuch-suche="ein"]').fill('Lissabon')
      await seite.locator('article[data-besuch]').first().waitFor()
      const treffer = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'dichte-suche',
        karten: treffer.karten,
        lissabon: treffer.titel.filter((titel) => titel === 'Lissabon').length,
        ueberlauf: treffer.ueberlauf,
      })
      assertNeu(treffer.karten >= 2, `${breite.name}: Suche zeigt ${treffer.karten}`, befunde)
      assertNeu(treffer.titel.every((titel) => titel === 'Lissabon'), `${breite.name}: Suche mischt fremde Titel`, befunde)
      assertNeu(netz.length === vorSuche, `${breite.name}: Suche hat angefragt`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-suche`)

      await seite.locator('[data-besuch-suche="ein"]').fill('zzzz-kein-treffer')
      await seite.locator('[data-besuch-suche="leer"]').waitFor()
      const kein = await lesen(seite)
      messungen.push({ breite: breite.name, zustand: 'dichte-suche-leer', karten: kein.karten, gesamt: kein.gesamt })
      assertNeu(kein.karten === 0, `${breite.name}: Leere Suche zeigt Karten`, befunde)
      assertNeu(kein.gesamt === '40', `${breite.name}: Leere Suche verliert die Historie`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-suche-leer`)

      await seite.locator('[data-besuch-suche="ein"]').fill('')
      await seite.locator('[data-besuch-alle]').click()
      await seite.locator('article[data-besuch]').nth(39).waitFor()
      const alle = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'dichte-alle',
        seiteHoehe: alle.seiteHoehe,
        karten: alle.karten,
        lissabon: alle.titel.filter((titel) => titel === 'Lissabon').length,
        ueberlauf: alle.ueberlauf,
        headingBisFormular: alle.headingBisFormular,
      })
      assertNeu(alle.karten === 40, `${breite.name}: Alle zeigt ${alle.karten}`, befunde)
      assertNeu(alle.titel.filter((titel) => titel === 'Lissabon').length === 4, `${breite.name}: Lissabon nicht vierfach`, befunde)
      assertNeu(!alle.ueberlauf, `${breite.name}: Überlauf bei allen Ereignissen`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) {
        await seite.locator('#account-besuche-liste').scrollIntoViewIfNeeded()
        await bild(seite, `${breite.name}-alle`)
      }
    } else {
      messungen.push({
        breite: breite.name,
        zustand: 'dichte-ruhe-alt',
        seiteHoehe: ruhe.seiteHoehe,
        karten: ruhe.karten,
        headingBisFormular: ruhe.headingBisFormular,
        ueberlauf: ruhe.ueberlauf,
      })
    }

    if (PROFIL === 'voll' || HOEHE_BREITEN.includes(breite.name)) {
      await seite.goto(`${BASIS}/ui-audit/account?zustand=welt&ansicht=besuche`, { waitUntil: 'networkidle' })
      const welt = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'welt',
        seiteHoehe: welt.seiteHoehe,
        karten: welt.karten,
        headingBisFormular: welt.headingBisFormular,
        ueberlauf: welt.ueberlauf,
        button: welt.button,
      })
      if (ERWARTUNG === 'neu' && (breite.name === '390x844' || breite.name === '1440x900')) {
        await oeffnen(seite)
        if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-welt-anlage`)
      }

      await seite.goto(`${BASIS}/ui-audit/account?zustand=leer&ansicht=besuche`, { waitUntil: 'networkidle' })
      const leer = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'leer',
        seiteHoehe: leer.seiteHoehe,
        leerText: leer.leerText,
        fehlerText: leer.fehlerText,
        headingBisFormular: leer.headingBisFormular,
        ueberlauf: leer.ueberlauf,
      })
      assertNeu(leer.leerText && !leer.fehlerText, `${breite.name}: Leerzustand undeutlich`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-leer`)

      await seite.goto(`${BASIS}/ui-audit/account?zustand=besuch-fehler&ansicht=besuche`, {
        waitUntil: 'networkidle',
      })
      const fehler = await lesen(seite)
      messungen.push({
        breite: breite.name,
        zustand: 'fehler',
        seiteHoehe: fehler.seiteHoehe,
        leerText: fehler.leerText,
        fehlerText: fehler.fehlerText,
        ueberlauf: fehler.ueberlauf,
        button: fehler.button,
      })
      assertNeu(fehler.fehlerText && !fehler.leerText, `${breite.name}: Fehlerzustand undeutlich`, befunde)
      assertNeu(fehler.button == null, `${breite.name}: Fehler bietet Hinzufügen`, befunde)
      if (ZUSTAND_BILDER.has(breite.name)) await bild(seite, `${breite.name}-fehler`)
    }
  }

  if (ERWARTUNG === 'neu' && PROFIL === 'voll') {
    await seite.setViewportSize({ width: 360, height: 800 })
    await seite.goto(`${BASIS}/ui-audit/account?dichte=40`, { waitUntil: 'networkidle' })
    await seite.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    const text = await lesen(seite)
    messungen.push({
      zustand: 'text200-360x800',
      seiteHoehe: text.seiteHoehe,
      ueberlauf: text.ueberlauf,
      verwaltungUeberlauf: text.verwaltungUeberlauf,
      kopfUeberlauf: text.kopfUeberlauf,
      scrollBreite: text.scrollBreite,
      clientBreite: text.clientBreite,
      karten: text.karten,
      button: text.button,
    })
    assertNeu(!text.ueberlauf, '200% Text: Dokument läuft horizontal über', befunde)
    assertNeu(!text.verwaltungUeberlauf && !text.kopfUeberlauf, '200% Text: Verwaltung läuft horizontal über', befunde)
    assertNeu(text.karten === 12, '200% Text verliert die Aufklappung', befunde)
    await seite.locator('#account-besuche-liste').scrollIntoViewIfNeeded()
    await bild(seite, 'text200-360x800-dichte')

    for (const zoom of ['1.25', '1.5']) {
      await seite.setViewportSize({ width: 1440, height: 900 })
      await seite.goto(`${BASIS}/ui-audit/account?dichte=40`, { waitUntil: 'networkidle' })
      await seite.evaluate((wert) => {
        document.documentElement.style.zoom = wert
      }, zoom)
      const gezoomt = await lesen(seite)
      messungen.push({
        zustand: `zoom${zoom}-1440x900`,
        seiteHoehe: gezoomt.seiteHoehe,
        ueberlauf: gezoomt.ueberlauf,
        verwaltungUeberlauf: gezoomt.verwaltungUeberlauf,
        kopfUeberlauf: gezoomt.kopfUeberlauf,
        scrollBreite: gezoomt.scrollBreite,
        clientBreite: gezoomt.clientBreite,
        karten: gezoomt.karten,
      })
      assertNeu(!gezoomt.ueberlauf, `Zoom ${zoom}: Dokument läuft horizontal über`, befunde)
      assertNeu(
        !gezoomt.verwaltungUeberlauf && !gezoomt.kopfUeberlauf,
        `Zoom ${zoom}: Verwaltung läuft horizontal über`,
        befunde,
      )
      await bild(seite, `zoom${zoom.replace('.', '')}-1440x900-dichte`)
    }

    for (const reflow of [
      { name: 'reflow125', width: 1152, height: 720 },
      { name: 'reflow150', width: 960, height: 600 },
    ]) {
      await seite.setViewportSize({ width: reflow.width, height: reflow.height })
      await seite.goto(`${BASIS}/ui-audit/account?dichte=40`, { waitUntil: 'networkidle' })
      const gemessen = await lesen(seite)
      messungen.push({
        zustand: `${reflow.name}-1440`,
        seiteHoehe: gemessen.seiteHoehe,
        ueberlauf: gemessen.ueberlauf,
        verwaltungUeberlauf: gemessen.verwaltungUeberlauf,
        kopfUeberlauf: gemessen.kopfUeberlauf,
        karten: gemessen.karten,
        button: gemessen.button,
      })
      assertNeu(!gemessen.ueberlauf, `${reflow.name}: horizontaler Überlauf`, befunde)
      assertNeu(gemessen.karten === 12, `${reflow.name}: Aufklappung fehlt`, befunde)
      await bild(seite, `${reflow.name}-dichte`)
    }

    await seite.setViewportSize({ width: 390, height: 844 })
    await seite.goto(`${BASIS}/ui-audit/account?dichte=40`, { waitUntil: 'networkidle' })
    await seite.locator('[data-besuch-hinzufuegen]').focus()
    await seite.keyboard.press('Enter')
    await seite.locator('#account-besuch-anlegen input').first().waitFor()
    const aktiv = await seite.evaluate(() => document.activeElement?.tagName ?? '')
    messungen.push({ zustand: 'tastatur-anlage', aktiv })
    await seite.keyboard.press('Tab')
    const nachTab = await seite.evaluate(() => document.activeElement?.tagName ?? '')
    messungen.push({ zustand: 'tastatur-tab', aktiv: nachTab })
    assertNeu(nachTab === 'INPUT' || nachTab === 'BUTTON' || aktiv === 'BUTTON', 'Tastatur erreicht das Formular nicht', befunde)
  }

  assertNeu(konsole.length === 0, `Konsole: ${konsole.slice(0, 8).join(' | ')}`, befunde)

  const bericht = {
    marke: MARKE,
    erwartung: ERWARTUNG,
    profil: PROFIL,
    befunde,
    konsole,
    netz: [...new Set(netz)],
    messungen,
  }
  writeFileSync(join(VERZEICHNIS, `${MARKE}-bericht.json`), JSON.stringify(bericht, null, 2))
  await browser.close()
  if (befunde.length > 0) {
    console.error(befunde.join('\n'))
    process.exitCode = 1
  } else {
    console.log(`${MARKE}: ${messungen.length} Messungen, keine Befunde`)
  }
} finally {
  serverStoppen(server)
}
