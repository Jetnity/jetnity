#!/usr/bin/env node
/**
 * Sichtmatrix für Account Settings + Security Premium UX 1.
 *
 * Der Harness liegt nur unter /ui-audit/account-settings-security und ist
 * ohne JETNITY_UI_AUDIT in Production 404. Auth-Antworten sind synthetisch
 * und verlassen den Browser nicht.
 *
 * Aufruf:
 *   node scripts/account-settings-security-premium-ux-1-audit.mjs
 *     [--marke vorher|nachher]
 *     [--verzeichnis <ordner>]
 *     [--port <nummer>]
 *     [--server dev|start]
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

const PORT = option('port', '3493')
const MARKE = option('marke', 'nachher')
const SERVER = option('server', 'dev')
const KERN = argv.includes('--kern')
const VERZEICHNIS = option(
  'verzeichnis',
  'docs/evidence/account-settings-security-premium-ux-1',
)
const BASIS = `http://127.0.0.1:${PORT}`
const SUPABASE_URL = `http://127.0.0.1:${PORT}`
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit'

const FLAECHEN = [
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

const NUTZER_ID = '11111111-1111-4111-8111-111111111111'
const FAKTOR_ID = '22222222-2222-4222-8222-222222222222'
const QR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

mkdirSync(VERZEICHNIS, { recursive: true })
mkdirSync('/opt/cursor/artifacts', { recursive: true })

function basis64Url(text) {
  return Buffer.from(text).toString('base64url')
}

function jwt(payload) {
  return `${basis64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${basis64Url(JSON.stringify(payload))}.${basis64Url('audit')}`
}

function sitzungBauen(faktoren) {
  const jetzt = Math.floor(Date.now() / 1000)
  const ablauf = jetzt + 3600
  const nutzer = {
    id: NUTZER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'audit@example.test',
    factors: faktoren,
    identities: [{ provider: 'email', identity_id: 'identity-audit-1' }],
  }
  const access = jwt({
    sub: NUTZER_ID,
    email: nutzer.email,
    role: 'authenticated',
    aal: faktoren.some((faktor) => faktor.status === 'verified') ? 'aal2' : 'aal1',
    exp: ablauf,
    iat: jetzt,
  })
  return {
    access_token: access,
    refresh_token: 'audit-refresh-token',
    expires_at: ablauf,
    expires_in: 3600,
    token_type: 'bearer',
    user: nutzer,
  }
}

function cookieWert(sitzung) {
  return `base64-${Buffer.from(JSON.stringify(sitzung)).toString('base64url')}`
}

function sitzungsSchluessel() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return 'supabase.auth.token'
  try {
    const host = new URL(url).hostname.split('.')[0]
    if (!host) return 'supabase.auth.token'
    return `sb-${host}-auth-token`
  } catch {
    return 'supabase.auth.token'
  }
}

function faktoren(modus) {
  if (modus !== 'totp') return []
  return [
    {
      id: FAKTOR_ID,
      factor_type: 'totp',
      status: 'verified',
      friendly_name: 'Reise-Authenticator',
      created_at: '2026-01-15T10:00:00.000Z',
    },
  ]
}

async function serverStarten() {
  const befehl = SERVER === 'start' ? ['next', 'start', '-p', PORT, '-H', '127.0.0.1'] : ['next', 'dev', '-p', PORT, '-H', '127.0.0.1']
  const kind = spawn('npx', befehl, {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
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
      const antwort = await fetch(`${BASIS}/ui-audit/account-settings-security?flaeche=einstellungen`)
      antwortet = antwort.status === 200
      await antwort.arrayBuffer()
    } catch {
      antwortet = false
    }
    if (!antwortet) await new Promise((warten) => setTimeout(warten, 500))
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

function routeInstallieren(page, modus, netz) {
  return page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const methode = route.request().method()
    netz.aufrufe.push(`${methode} ${new URL(url).pathname}`)
    if (methode === 'GET' && url.includes('/auth/v1/user')) {
      if (modus === 'fehler') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'audit-fehler' }) })
        return
      }
      const sitzung = sitzungBauen(faktoren(modus))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sitzung.user) })
      return
    }
    if (methode === 'POST' && url.includes('/factors')) {
      netz.enroll += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: FAKTOR_ID, totp: { qr_code: QR } }),
      })
      return
    }
    if (methode === 'POST' && url.includes('/token')) {
      netz.token += 1
      if (url.includes('grant_type=password')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'invalid_grant', error_description: 'audit', msg: 'Invalid login credentials' }),
        })
        return
      }
      const sitzung = sitzungBauen(faktoren(modus))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: sitzung.access_token,
          refresh_token: sitzung.refresh_token,
          expires_in: sitzung.expires_in,
          expires_at: sitzung.expires_at,
          token_type: 'bearer',
          user: sitzung.user,
        }),
      })
      return
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'audit-ungefragt' }) })
  })
}

async function messen(page) {
  return page.evaluate(() => {
    const fehler = []
    const breite = window.innerWidth
    if (document.documentElement.scrollWidth > breite + 1) {
      fehler.push(`horizontaler Overflow ${document.documentElement.scrollWidth}>${breite}`)
    }
    const nav = document.querySelector('nav[aria-label="Konto"]')
    const leiste = document.querySelector('header, nav.sticky, nav[class*="sticky"]')
    const h1 = document.querySelector('main h1')
    if (!h1) fehler.push('H1 fehlt')
    if (nav && h1) {
      const navBox = nav.getBoundingClientRect()
      const h1Box = h1.getBoundingClientRect()
      if (h1Box.top < navBox.bottom - 1 && h1Box.bottom > navBox.top + 1) {
        fehler.push('H1 überlappt die Konto-Navigation')
      }
    }
    const sticky = document.querySelector('nav.sticky, [class*="sticky"][class*="top-0"]')
    if (sticky && h1) {
      const oben = sticky.getBoundingClientRect().bottom
      const ziel = h1.getBoundingClientRect().top
      if (window.scrollY === 0 && ziel < oben - 1) fehler.push('H1 liegt beim ersten Anblick unter der fixierten Leiste')
    }
    const ziele = [
      ...document.querySelectorAll('main button, main a, nav[aria-label="Konto"] a, nav[aria-label="Sicherheitsbereiche"] a'),
    ]
    const zuKlein = []
    for (const ziel of ziele) {
      const box = ziel.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) continue
      if (box.height < 44 - 0.5 || (box.width < 44 - 0.5 && box.height < 44 - 0.5)) {
        const text = (ziel.getAttribute('aria-label') || ziel.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)
        zuKlein.push(`${text || ziel.tagName} ${Math.round(box.width)}x${Math.round(box.height)}`)
      }
    }
    if (zuKlein.length) fehler.push(`Ziele unter 44px: ${zuKlein.slice(0, 8).join(' | ')}`)
    const felder = [...document.querySelectorAll('main input, main textarea, main select')]
    const schriftKlein = []
    for (const feld of felder) {
      const groesse = Number.parseFloat(getComputedStyle(feld).fontSize)
      if (groesse < 16 - 0.1) schriftKlein.push(`${feld.id || feld.getAttribute('name') || 'feld'} ${groesse}px`)
    }
    if (schriftKlein.length) fehler.push(`Eingaben unter 16px: ${schriftKlein.join(' | ')}`)
    const fokus = document.activeElement
    return {
      fehler,
      dokumentHoehe: document.documentElement.scrollHeight,
      hauptHoehe: document.querySelector('main')?.scrollHeight ?? 0,
      loeschPasswort: document.querySelectorAll('#konto-loeschen-passwort').length,
      loeschBestaetigung: document.querySelectorAll('#konto-loeschen-bestaetigung').length,
      codeSenden: [...document.querySelectorAll('button')].some((knopf) => knopf.textContent?.includes('Bestätigungscode senden')),
      passwortNonce: document.querySelectorAll('#account-password-nonce').length,
      totpCode: document.querySelectorAll('#totp-code').length,
      passkeyLage: document.querySelector('[data-passkey-lage]')?.getAttribute('data-passkey-lage') ?? null,
      totpLage: document.querySelector('[data-security-lage]')?.getAttribute('data-security-lage') ?? null,
      sitzungLage: document.querySelector('[data-sitzung-lage]')?.getAttribute('data-sitzung-lage') ?? null,
      loeschPhase: document.querySelector('[data-kontoloeschung-phase]')?.getAttribute('data-kontoloeschung-phase') ?? null,
      fokus: fokus ? `${fokus.tagName}#${fokus.id || ''}` : null,
    }
  })
}

async function wartenAuf(page, text) {
  try {
    await page.getByText(text).first().waitFor({ state: 'visible', timeout: 20_000 })
  } catch (fehler) {
    const auszug = await page.locator('main').innerText().catch(() => '')
    const cookie = await page.evaluate(() => {
      const wert = document.cookie
      return `len=${wert.length}`
    })
    throw new Error(`${fehler.message}\n--- cookie ${cookie} ---\n--- main ---\n${auszug.slice(0, 400)}`)
  }
}

async function seiteOeffnen(browser, flaeche, modus, flaecheGroesse, zusatz) {
  const netz = { aufrufe: [], enroll: 0, token: 0 }
  const context = await browser.newContext({
    viewport: { width: flaecheGroesse.width, height: flaecheGroesse.height },
    deviceScaleFactor: 1,
  })
  const sitzung = sitzungBauen(faktoren(modus))
  await context.addInitScript(({ schluessel, wert }) => {
    document.cookie = `${schluessel}=${wert}; path=/`
  }, { schluessel: sitzungsSchluessel(), wert: cookieWert(sitzung) })
  if (zusatz?.schrift) {
    await context.addInitScript((px) => {
      const setzen = () => {
        document.documentElement.style.fontSize = px
      }
      setzen()
      document.addEventListener('DOMContentLoaded', setzen)
    }, zusatz.schrift)
  }
  const page = await context.newPage()
  const konsole = []
  page.on('console', (eintrag) => {
    if (eintrag.type() === 'error') konsole.push(eintrag.text())
  })
  page.on('pageerror', (fehler) => konsole.push(String(fehler)))
  await routeInstallieren(page, modus, netz)
  await page.goto(`${BASIS}/ui-audit/account-settings-security?flaeche=${flaeche}`, {
    waitUntil: 'load',
    timeout: 60_000,
  })
  if (zusatz?.zoom) {
    await page.evaluate((zoom) => {
      document.documentElement.style.zoom = String(zoom)
    }, zusatz.zoom)
  }
  return { page, context, netz, konsole }
}

const server = await serverStarten()
const befunde = []
const hoehen = {}

try {
  const browser = await chromium.launch()
  const bildSeite = await browser.newPage()
  const alsWebp = async (png) =>
    Buffer.from(
      await bildSeite.evaluate(async (basis64) => {
        const bild = new Image()
        bild.src = `data:image/png;base64,${basis64}`
        await bild.decode()
        const flaeche = document.createElement('canvas')
        const mass = Math.min(1, 1200 / bild.naturalWidth)
        flaeche.width = Math.round(bild.naturalWidth * mass)
        flaeche.height = Math.round(bild.naturalHeight * mass)
        flaeche.getContext('2d')?.drawImage(bild, 0, 0, flaeche.width, flaeche.height)
        return flaeche.toDataURL('image/webp', 0.8).split(',')[1]
      }, png.toString('base64')),
      'base64',
    )

  async function fall(name, flaecheName, vorbereiten) {
    const flaecheGroesse = FLAECHEN.find((eintrag) => eintrag.name === flaecheName)
    const geoeffnet = await vorbereiten(browser, flaecheGroesse)
    const messung = await messen(geoeffnet.page)
    const hydration = geoeffnet.konsole.filter((zeile) => /hydration|Hydration/i.test(zeile))
    if (hydration.length) messung.fehler.push(`Hydration: ${hydration[0].slice(0, 180)}`)
    const befund = {
      name,
      flaeche: flaecheName,
      ...messung,
      netz: geoeffnet.netz.aufrufe.length,
      enroll: geoeffnet.netz.enroll,
      token: geoeffnet.netz.token,
      konsole: geoeffnet.konsole.slice(0, 6),
    }
    befunde.push(befund)
    return { befund, ...geoeffnet }
  }

  async function standardOeffnen(browser, flaecheGroesse, flaeche, modus, text) {
    const geoeffnet = await seiteOeffnen(browser, flaeche, modus, flaecheGroesse)
    await wartenAuf(geoeffnet.page, text)
    return geoeffnet
  }

  const matrix = KERN ? FLAECHEN.filter((eintrag) => eintrag.name === '390x844' || eintrag.name === '1440x900') : FLAECHEN

  for (const flaecheGroesse of matrix) {
    const settings = await fall(`einstellungen-${flaecheGroesse.name}`, flaecheGroesse.name, (browser, groesse) =>
      standardOeffnen(browser, groesse, 'einstellungen', 'totp', 'Konto löschen'),
    )
    hoehen[`einstellungen-${flaecheGroesse.name}`] = {
      dokument: settings.befund.dokumentHoehe,
      haupt: settings.befund.hauptHoehe,
      passwort: settings.befund.loeschPasswort,
      bestaetigung: settings.befund.loeschBestaetigung,
    }
    if (flaecheGroesse.name === '390x844' || flaecheGroesse.name === '1440x900') {
      const png = await settings.page.screenshot({ fullPage: true })
      const webp = await alsWebp(png)
      const datei = join(VERZEICHNIS, `${MARKE}-einstellungen-${flaecheGroesse.name}.webp`)
      writeFileSync(datei, webp)
      writeFileSync(`/opt/cursor/artifacts/${MARKE}-einstellungen-${flaecheGroesse.name}.webp`, webp)
    }
    await settings.context.close()

    const security = await fall(`sicherheit-${flaecheGroesse.name}`, flaecheGroesse.name, (browser, groesse) =>
      standardOeffnen(browser, groesse, 'sicherheit', 'totp', 'Eingerichtete Authenticator-Apps'),
    )
    hoehen[`sicherheit-${flaecheGroesse.name}`] = {
      dokument: security.befund.dokumentHoehe,
      haupt: security.befund.hauptHoehe,
      nonce: security.befund.passwortNonce,
      codeSenden: security.befund.codeSenden,
      totp: security.befund.totpCode,
      passkey: security.befund.passkeyLage,
      sitzung: security.befund.sitzungLage,
      netz: security.befund.netz,
      enroll: security.befund.enroll,
    }
    if (flaecheGroesse.name === '390x844' || flaecheGroesse.name === '1440x900') {
      const png = await security.page.screenshot({ fullPage: true })
      const webp = await alsWebp(png)
      writeFileSync(join(VERZEICHNIS, `${MARKE}-sicherheit-${flaecheGroesse.name}.webp`), webp)
      writeFileSync(`/opt/cursor/artifacts/${MARKE}-sicherheit-${flaecheGroesse.name}.webp`, webp)
    }
    await security.context.close()
  }

  if (!KERN) {
  const textFall = await fall('text-200-einstellungen', '360x800', async (browser, groesse) => {
    const geoeffnet = await seiteOeffnen(browser, 'einstellungen', 'totp', groesse, { schrift: '32px' })
    await wartenAuf(geoeffnet.page, 'Konto löschen')
    return geoeffnet
  })
  await textFall.context.close()
  const textSicher = await fall('text-200-sicherheit', '360x800', async (browser, groesse) => {
    const geoeffnet = await seiteOeffnen(browser, 'sicherheit', 'totp', groesse, { schrift: '32px' })
    await wartenAuf(geoeffnet.page, 'Eingerichtete Authenticator-Apps')
    return geoeffnet
  })
  await textSicher.context.close()

  for (const zoom of [1.25, 1.5]) {
    const zoomFall = await fall(`zoom-${zoom}-sicherheit`, '1440x900', async (browser, groesse) => {
      const geoeffnet = await seiteOeffnen(browser, 'sicherheit', 'totp', groesse, { zoom })
      await wartenAuf(geoeffnet.page, 'Eingerichtete Authenticator-Apps')
      return geoeffnet
    })
    await zoomFall.context.close()
  }
  }

  const interaktion = await seiteOeffnen(browser, 'einstellungen', 'totp', FLAECHEN.find((e) => e.name === '390x844'))
  await wartenAuf(interaktion.page, 'Konto löschen')
  const vorKlick = await messen(interaktion.page)
  const vorbereiten = interaktion.page.getByRole('button', { name: 'Kontolöschung vorbereiten' })
  if (await vorbereiten.count()) {
    await vorbereiten.click()
    await interaktion.page.locator('#konto-loeschen-bestaetigung').waitFor()
  }
  const nachKlick = await messen(interaktion.page)
  const fokusNachOeffnen = await interaktion.page.evaluate(
    () => document.activeElement?.id || document.activeElement?.tagName || '',
  )
  befunde.push({
    name: 'loeschung-offen',
    flaeche: '390x844',
    vorherPasswort: vorKlick.loeschPasswort,
    nachherPasswort: nachKlick.loeschPasswort,
    nachherBestaetigung: nachKlick.loeschBestaetigung,
    fokus: fokusNachOeffnen,
    fehler: nachKlick.fehler,
  })
  const loeschPng = await interaktion.page.screenshot({ fullPage: true })
  const loeschWebp = await alsWebp(loeschPng)
  writeFileSync(join(VERZEICHNIS, `${MARKE}-loeschung-offen-390.webp`), loeschWebp)
  writeFileSync(`/opt/cursor/artifacts/${MARKE}-loeschung-offen-390.webp`, loeschWebp)
  await interaktion.context.close()

  const passwort = await seiteOeffnen(browser, 'sicherheit', 'totp', FLAECHEN.find((e) => e.name === '390x844'))
  await wartenAuf(passwort.page, 'Passwort')
  const passwortVorher = passwort.netz.aufrufe.filter((aufruf) => aufruf.startsWith('POST')).length
  const aendern = passwort.page.getByRole('button', { name: 'Passwort ändern' })
  if (await aendern.count()) await aendern.click()
  await passwort.page.getByRole('button', { name: /Bestätigungscode senden/ }).waitFor()
  const passwortNachher = passwort.netz.aufrufe.filter((aufruf) => aufruf.startsWith('POST')).length
  befunde.push({
    name: 'passwort-offen',
    flaeche: '390x844',
    netzVorher: passwortVorher,
    netzNachher: passwortNachher,
    enroll: passwort.netz.enroll,
    fehler: (await messen(passwort.page)).fehler,
  })
  await passwort.context.close()

  const leer = await standardOeffnen(
    browser,
    FLAECHEN.find((e) => e.name === '390x844'),
    'sicherheit',
    'leer',
    'Noch keine Authenticator-App',
  )
  const leerMessung = await messen(leer.page)
  befunde.push({ name: 'totp-leer', flaeche: '390x844', ...leerMessung, enroll: leer.netz.enroll })
  await leer.context.close()

  const einrichten = await standardOeffnen(
    browser,
    FLAECHEN.find((e) => e.name === '390x844'),
    'sicherheit',
    'leer',
    'Authenticator-App einrichten',
  )
  const enrollVorher = einrichten.netz.enroll
  await einrichten.page.getByRole('button', { name: 'Authenticator-App einrichten' }).click()
  await einrichten.page.locator('#totp-code').waitFor()
  befunde.push({
    name: 'totp-einrichtung',
    flaeche: '390x844',
    enrollVorher,
    enrollNachher: einrichten.netz.enroll,
    otpauth: (await einrichten.page.content()).includes('otpauth'),
    fehler: (await messen(einrichten.page)).fehler,
  })
  const enrollPng = await einrichten.page.screenshot({ fullPage: true })
  writeFileSync(`/opt/cursor/artifacts/${MARKE}-totp-einrichtung-390.webp`, await alsWebp(enrollPng))
  await einrichten.context.close()

  const fehlerSeite = await seiteOeffnen(browser, 'sicherheit', 'fehler', FLAECHEN.find((e) => e.name === '390x844'))
  await fehlerSeite.page.waitForTimeout(1500)
  const fehlerMessung = await messen(fehlerSeite.page)
  befunde.push({
    name: 'sicherheit-fehler',
    flaeche: '390x844',
    totpLage: fehlerMessung.totpLage,
    sitzungLage: fehlerMessung.sitzungLage,
    fehler: fehlerMessung.fehler.filter((eintrag) => !eintrag.startsWith('Ziele unter 44px')),
  })
  await fehlerSeite.context.close()

  await bildSeite.close()
  await browser.close()
} finally {
  serverStoppen(server)
}

const probleme = befunde.flatMap((befund) =>
  (befund.fehler || []).map((fehler) => `${befund.name}: ${fehler}`),
)
const bericht = {
  marke: MARKE,
  server: SERVER,
  gemessenAm: new Date().toISOString(),
  hoehen,
  befunde,
  probleme,
}
writeFileSync(join(VERZEICHNIS, `${MARKE}.json`), JSON.stringify(bericht, null, 2))
writeFileSync(`/opt/cursor/artifacts/account-settings-security-${MARKE}.json`, JSON.stringify(bericht, null, 2))

if (MARKE === 'nachher') {
  const telefon = hoehen['einstellungen-390x844']
  const breit = hoehen['sicherheit-1440x900']
  if (!telefon || telefon.passwort !== 0 || telefon.bestaetigung !== 0) {
    probleme.push('Einstellungen zeigen Lösch-Zugangsdaten vor der ausdrücklichen Vorbereitung')
  }
  if (breit && (breit.nonce !== 0 || breit.codeSenden)) {
    probleme.push('Passwortänderung ist ohne ausdrückliches Öffnen sichtbar')
  }
  if (breit && breit.enroll !== 0) probleme.push('Ungenutzte Darstellung hat eine TOTP-Einrichtung ausgelöst')
  const offen = befunde.find((befund) => befund.name === 'loeschung-offen')
  if (!offen || offen.nachherPasswort !== 1 || offen.fokus === 'konto-loeschen-passwort' || offen.fokus === 'konto-loeschen-bestaetigung') {
    probleme.push('Löschformular öffnet nicht kontrolliert oder fokussiert ein Zugangsdatenfeld')
  }
  const passwortOffen = befunde.find((befund) => befund.name === 'passwort-offen')
  if (!passwortOffen || passwortOffen.netzNachher !== passwortOffen.netzVorher || passwortOffen.enroll !== 0) {
    probleme.push('Passwort-Aufklappen hat einen Auth-Aufruf ausgelöst')
  }
}

if (probleme.length && MARKE === 'nachher') {
  console.error(probleme.join('\n'))
  process.exit(1)
}
console.log(JSON.stringify({ marke: MARKE, hoehen, probleme: probleme.length }, null, 2))
