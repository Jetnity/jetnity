// Real Settings/Localization components and production CSS, synthetic ports
// only. The existing lib/**/*.test.ts Core selection runs this suite normally.
// This is not a live signed-in persistence, Admin AAL2 or deployment proof.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { after, before, test, type TestContext } from 'node:test'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import type { LanguageFixtureBoot } from '@/scripts/account-language-settings-1/harness'
import type { UiEinstellungenLesen, UiEinstellungenSpeichernEingabe } from './vertrag'
import type { UiSprache } from '@/lib/localization/ui-sprache'

const ACCOUNT_A = 'synthetic-account-a'
const ACCOUNT_B = 'synthetic-account-b'
const CLOCK_START = new Date('2026-11-15T12:00:00.000Z')
type Ready = Extract<UiEinstellungenLesen, { status: 'bereit' }>
type Fixture = {
  activeUser: string
  accounts: Map<string, Ready>
  initialOverride?: UiEinstellungenLesen
  surface: LanguageFixtureBoot['surface']
  catalogLanguage: UiSprache
  appearance: 'light' | 'dark'
  commits: UiEinstellungenSpeichernEingabe[]
}
const fixtures = new Map<string, Fixture>()
let server: Server | undefined
let browser: Browser | undefined
let origin = ''

function ready(sprache: UiSprache = 'de', benutzerId = ACCOUNT_A, gespeichert = true): Ready {
  return { status: 'bereit', benutzerId, sprache, gespeichert }
}

function readFixture(fixture: Fixture): UiEinstellungenLesen {
  return structuredClone(fixture.accounts.get(fixture.activeUser) ?? { status: 'nicht_angemeldet' })
}

before(async () => {
  const require = createRequire(import.meta.url)
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwind = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/account-language-settings-1/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
      alias: { '@': process.cwd() },
      plugins: [{
        name: 'drop-auth-admin-secret-comment',
        setup(build) {
          build.onLoad({ filter: /GoTrueAdminApi\.js$/ }, (args) => {
            const text = readFileSync(args.path, 'utf8')
            return {
              contents: text.replaceAll('process.env.SUPABASE_SECRET_KEY', '""'),
              loader: 'js',
            }
          })
        },
      }],
      define: {
        'process.env.NODE_ENV': '"development"',
        // Next normally replaces these next/link build constants. This bare
        // component bundle has no Node `process` global. The values match the
        // current next.config.js: no base path, locale router or trailing slash.
        'process.env.__NEXT_ROUTER_BASEPATH': '""',
        'process.env.__NEXT_I18N_SUPPORT': 'false',
        'process.env.__NEXT_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_CLIENT_BASE_PATH': 'false',
        'process.env.__NEXT_LINK_NO_TOUCH_START': 'false',
        // The existing deletion presentation accepts this local-only target.
        // No real Supabase URL, token or browser Auth session enters the proof.
        'process.env.NEXT_PUBLIC_SUPABASE_URL': '"http://127.0.0.1:54321"',
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"synthetic-not-a-credential"',
        // supabase-js 2.119 documents the secret only inside a comment in the
        // admin client. The browser bundle must not keep a live process.env.
        'process.env.SUPABASE_SECRET_KEY': '""',
      },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    postcss([nesting(), tailwind(require(join(process.cwd(), 'tailwind.config.js'))), autoprefixer()]).process(readFileSync(from, 'utf8'), { from }),
  ])
  assert.doesNotMatch(bundle.outputFiles[0].text, /\bprocess\s*\.\s*env\b/,
    'Every browser environment expression must be replaced explicitly; do not hide missing Next build constants behind a process shim')
  const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
  const style = css.css.replaceAll('</style', '<\\/style')
  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://fixture.invalid')
    const fixture = fixtures.get(url.searchParams.get('fixture') ?? '')
    if (!fixture || request.method !== 'GET' || !['/account/settings', '/admin/settings', '/admin/localization'].includes(url.pathname)) {
      response.writeHead(404).end('Unknown synthetic fixture')
      return
    }
    const boot: LanguageFixtureBoot = {
      initial: fixture.initialOverride ?? readFixture(fixture), surface: fixture.surface,
      catalogLanguage: fixture.catalogLanguage, deletionOffered: fixture.surface === 'konto', appearance: fixture.appearance,
    }
    const json = JSON.stringify(boot).replaceAll('<', '\\u003c')
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic Settings component proof</title><style>${style}</style></head><body><div id="root"></div><script>window.__languageFixtureBoot=${json};${script}</script></body></html>`)
  })
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve) })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  } catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })

after(async () => {
  await browser?.close()
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()))
})

async function open(t: TestContext, options: {
  initial?: UiEinstellungenLesen; surface?: LanguageFixtureBoot['surface']; language?: UiSprache; width?: number; clock?: boolean; appearance?: 'light' | 'dark'
} = {}) {
  const initial = options.initial ?? ready(options.language ?? 'de')
  const fixture: Fixture = {
    activeUser: initial.status === 'bereit' ? initial.benutzerId : ACCOUNT_A,
    accounts: new Map([[ACCOUNT_A, ready()], [ACCOUNT_B, ready('de', ACCOUNT_B)]]),
    surface: options.surface ?? 'konto', catalogLanguage: options.language ?? 'de', appearance: options.appearance ?? 'light', commits: [],
  }
  if (initial.status === 'bereit') fixture.accounts.set(initial.benutzerId, structuredClone(initial))
  else fixture.initialOverride = initial
  const id = randomUUID()
  fixtures.set(id, fixture)
  const page = await browser!.newPage({ viewport: { width: options.width ?? 1280, height: 900 } })
  page.setDefaultTimeout(7_000)
  const violations: string[] = []
  const consoleErrors: string[] = []
  let navigation: { status: number; contentType: string | null; contentSecurityPolicy: string | null } | null = null
  let diagnosed = false
  const diagnose = async (stage: string) => {
    diagnosed = true
    let documentState: unknown
    try {
      documentState = page.isClosed() ? { closed: true } : await page.evaluate(() => ({
        readyState: document.readyState, title: document.title, path: location.pathname,
        bootPresent: Boolean(window.__languageFixtureBoot), completionPresent: Boolean(window.__settingsCompletion),
        bindings: {
          commit: typeof window.__commitLanguageFixture, read: typeof window.__readLanguageFixture,
          requestViolation: typeof window.__recordSettingsRequestViolation,
        },
        harness: window.__settingsCompletion?.diagnostics() ?? null,
        rootPresent: Boolean(document.getElementById('root')), mainCount: document.querySelectorAll('main').length,
        headings: [...document.querySelectorAll('h1')].map((heading) => heading.textContent?.slice(0, 200)).slice(0, 6),
        bodyText: document.body?.innerText.slice(0, 1500) ?? null,
        rootHtml: document.getElementById('root')?.innerHTML.slice(0, 3500) ?? null,
      }))
    } catch (error) {
      documentState = { unavailable: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000) }
    }
    t.diagnostic('SETTINGS_FIXTURE_DIAGNOSTIC ' + JSON.stringify({
      stage, surface: fixture.surface, navigation, violations: violations.slice(0, 12),
      consoleErrors, document: documentState,
    }))
  }
  page.on('pageerror', (error) => {
    const detail = (error.stack ?? error.message).slice(0, 3000)
    violations.push(`Runtime: ${detail}`)
    // A failed test can mask its after-hook assertion. Emit the actual browser
    // error directly as well, so a heading timeout never hides its root cause.
    t.diagnostic('SETTINGS_PAGE_ERROR ' + detail)
  })
  page.on('console', (message) => {
    if (message.type() === 'error' && consoleErrors.length < 12) consoleErrors.push(message.text().slice(0, 2000))
  })
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === origin && ['/account/settings', '/admin/settings', '/admin/localization'].includes(url.pathname)) await route.continue()
    else {
      violations.push(`Unexpected network request: ${route.request().method()} ${url.origin}${url.pathname}`)
      await route.abort()
    }
  })
  await page.exposeFunction('__commitLanguageFixture', (input: UiEinstellungenSpeichernEingabe) => {
    assert.deepEqual(Object.keys(input).sort(), ['erwarteteBenutzerId', 'sprache'])
    assert.ok(fixture.accounts.has(input.erwarteteBenutzerId), 'Only synthetic fixture accounts exist')
    assert.ok(input.sprache === 'de' || input.sprache === 'en')
    fixture.accounts.set(input.erwarteteBenutzerId, ready(input.sprache, input.erwarteteBenutzerId))
    fixture.commits.push(structuredClone(input))
  })
  await page.exposeFunction('__readLanguageFixture', () => readFixture(fixture))
  await page.exposeFunction('__recordSettingsRequestViolation', (message: string) => { violations.push(`Blocked fetch: ${message}`) })
  t.after(async () => {
    try {
      if (!page.isClosed()) violations.push(...await page.evaluate(() => window.__settingsCompletion?.unexpectedRequests() ?? []))
      if (violations.length && !diagnosed) await diagnose('teardown')
    } finally {
      await page.close()
      fixtures.delete(id)
    }
    assert.deepEqual(violations, [], 'Synthetic component proof must not reach Auth, providers or another route')
  })
  if (options.clock) await page.clock.install({ time: CLOCK_START })
  const path = fixture.surface === 'catalog' ? '/admin/localization' : fixture.surface === 'admin' ? '/admin/settings' : '/account/settings'
  try {
    const response = await page.goto(`${origin}${path}?fixture=${id}`)
    navigation = response ? {
      status: response.status(), contentType: response.headers()['content-type'] ?? null,
      contentSecurityPolicy: response.headers()['content-security-policy'] ?? null,
    } : null
    assert.equal(navigation?.status, 200, 'The actual synthetic document must load successfully')
    await page.locator('main h1').waitFor()
    if (initial.status === 'bereit' && fixture.surface !== 'catalog') {
      await page.waitForFunction(() => window.__settingsCompletion.observers().some((observer) => observer.active))
    }
  } catch (error) {
    await diagnose('open')
    throw error
  }
  return { page, fixture }
}

async function pending(page: Page, kind: 'save' | 'read', from = 0) {
  await page.waitForFunction(({ kind, from }) => window.__settingsCompletion.calls().some((call, index) => index >= from && call.kind === kind && !call.settled), { kind, from })
  return page.evaluate(({ kind, from }) => window.__settingsCompletion.calls().findIndex((call, index) => index >= from && call.kind === kind && !call.settled), { kind, from })
}
async function reply(page: Page, index: number, body: unknown) {
  await page.evaluate(({ index, body }) => window.__settingsCompletion.reply(index, body), { index, body })
}
async function confirm(page: Page, index: number, sprache: UiSprache, benutzerId = ACCOUNT_A) {
  await page.evaluate((id) => window.__settingsCompletion.commitSave(id), index)
  await reply(page, index, { ok: true, benutzerId, sprache })
  await page.locator('[data-kontosprache-phase="gespeichert"]').waitFor()
}
async function choose(page: Page, language: UiSprache) {
  await page.getByRole('combobox').selectOption(language)
  await page.locator(`[data-einstellungen-hub][lang="${language}"]`).waitFor()
}
async function startSave(page: Page) {
  await page.getByRole('button', { name: /^(Save language|Sprache speichern)$/ }).click()
  return pending(page, 'save')
}
async function calls(page: Page) { return page.evaluate(() => window.__settingsCompletion.calls()) }
async function stableFrame(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}
async function textScale(page: Page, factor: number) {
  await page.evaluate(async (scale) => {
    document.documentElement.style.fontSize = `${16 * scale}px`
    let timeout: number | undefined
    try {
      await Promise.race([
        (async () => {
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
          await Promise.allSettled(document.getAnimations().filter((animation) => {
            const end = animation.effect?.getComputedTiming().endTime
            return animation.playState === 'running' && typeof end === 'number' && Number.isFinite(end)
          }).map((animation) => animation.finished))
        })(),
        new Promise<never>((_resolve, reject) => { timeout = window.setTimeout(() => reject(new Error(`Settings text scale ${scale}: layout did not settle within 3000ms`)), 3000) }),
      ])
    } finally { if (timeout !== undefined) window.clearTimeout(timeout) }
  }, factor)
}

async function layoutGeometry(page: Page, width: number, scale: number) {
  return page.evaluate(({ width, scale }) => {
    const controls = [...document.querySelectorAll<HTMLElement>('main button, main a[href], main input:not([type="hidden"]), main select')]
      .filter((element) => element.getClientRects().length > 0)
    const problems: unknown[] = []
    if (document.documentElement.scrollWidth > innerWidth + 1) problems.push({ reason: 'page-overflow', width: document.documentElement.scrollWidth, viewport: innerWidth })
    for (const element of controls) {
      const rect = element.getBoundingClientRect()
      const name = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 100) ?? element.id
      const bounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      if (rect.width < 44 || rect.height < 44 || rect.left < -1 || rect.right > innerWidth + 1) problems.push({ reason: 'control-bounds', name, bounds })
      // All text ranges are read in the same frame as their containing
      // control, avoiding transition/scroll races between protocol calls.
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        let node: Node | null
        while ((node = walker.nextNode())) {
          if (!node.textContent?.trim() || node.parentElement?.closest('[aria-hidden="true"]')) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const text of range.getClientRects()) if (text.left < rect.left - 1 || text.right > rect.right + 1 || text.top < rect.top - 1 || text.bottom > rect.bottom + 1) {
            problems.push({ reason: 'label-outside-control', name, bounds, text: { x: text.x, y: text.y, width: text.width, height: text.height }, font: getComputedStyle(element).fontSize })
          }
        }
      }
      if (element instanceof HTMLSelectElement) {
        const style = getComputedStyle(element)
        const context = document.createElement('canvas').getContext('2d')!
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        const text = element.selectedOptions[0]?.textContent ?? ''
        // Conservative lower bound: even without reserving room for the
        // native arrow, the non-wrapping selected label must fit its field.
        const needed = context.measureText(text).width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        if (needed > element.clientWidth + 1) problems.push({ reason: 'select-label-clipped', name: text, needed, available: element.clientWidth, bounds })
      }
    }
    return { width, scale, controlCount: controls.length, problems }
  }, { width, scale })
}

type Rgba = [number, number, number, number]
function rgba(value: string): Rgba {
  const match = /^rgba?\(([^)]+)\)$/.exec(value)
  assert.ok(match, `Unsupported computed color ${value}`)
  const parts = match[1].split(',').map((part) => Number(part.trim()))
  assert.ok((parts.length === 3 || parts.length === 4) && parts.every(Number.isFinite), `Invalid computed color ${value}`)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}
function over(foreground: Rgba, background: Rgba): Rgba {
  const alpha = foreground[3] + background[3] * (1 - foreground[3])
  if (!alpha) return [0, 0, 0, 0]
  const channel = (index: 0 | 1 | 2) => (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha
  return [channel(0), channel(1), channel(2), alpha]
}
function luminance(color: Rgba): number {
  const linear = color.slice(0, 3).map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

async function settingsContrast(page: Page) {
  const rows = await page.evaluate(() => {
    const selectors = ['[data-einstellungen-hub] header h1', '[data-einstellungen-hub] header p', '#konto-sprache-titel', '[data-kontosprache-phase] p', '[data-kontosprache-phase] label', '[data-kontosprache-phase] select:not(:disabled)', '[data-kontosprache-phase] button:not(:disabled)']
    return [...document.querySelectorAll<HTMLElement>(selectors.join(','))].filter((element) => element.getClientRects().length > 0).map((element) => {
      const style = getComputedStyle(element)
      const backgrounds: string[] = []
      const unsupported: string[] = []
      let ancestor: HTMLElement | null = element
      while (ancestor) {
        const inherited = getComputedStyle(ancestor)
        backgrounds.unshift(inherited.backgroundColor)
        if (inherited.backgroundImage !== 'none' || Number(inherited.opacity) !== 1) unsupported.push(`${ancestor.tagName}: ${inherited.backgroundImage}; opacity=${inherited.opacity}`)
        ancestor = ancestor.parentElement
      }
      return {
        name: element.id || element.textContent?.trim().slice(0, 90), color: style.color, backgrounds,
        fontSize: parseFloat(style.fontSize), fontWeight: Number(style.fontWeight), unsupported,
      }
    })
  })
  assert.ok(rows.length >= 9, 'Heading, introduction and real language-card text must all be measured')
  return rows.map((row) => {
    assert.deepEqual(row.unsupported, [], `Unsupported contrast layer for ${row.name}`)
    const background = row.backgrounds.reduce((result, color) => over(rgba(color), result), [0, 0, 0, 0] as Rgba)
    assert.equal(background[3], 1, `No measured opaque background for ${row.name}`)
    const foreground = over(rgba(row.color), background)
    const light = luminance(foreground)
    const dark = luminance(background)
    const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)
    const minimum = row.fontSize >= 24 || (row.fontSize >= 18.6667 && row.fontWeight >= 700) ? 3 : 4.5
    return { name: row.name, ratio, minimum, foreground, background }
  })
}

const words = {
  de: {
    title: 'Einstellungen', language: 'Sprache der Einstellungen', save: 'Sprache speichern', reload: 'Gespeicherte Sprache erneut laden',
    prepare: 'Kontolöschung vorbereiten', close: 'Vorbereitung schließen', password: 'Aktuelles Passwort', show: 'Passwort anzeigen', hide: 'Passwort verbergen',
    confirmation: 'Gib KONTO LÖSCHEN ein, um fortzufahren', remove: 'Konto endgültig löschen',
    export: 'Konto- und Reisedaten als JSON herunterladen', cancel: 'Export abbrechen',
    catalog: 'Sprachkatalog', search: 'Übersetzungen durchsuchen', empty: 'Keine passenden Übersetzungen gefunden.',
  },
  en: {
    title: 'Settings', language: 'Language for settings', save: 'Save language', reload: 'Reload saved language',
    prepare: 'Prepare account deletion', close: 'Close preparation', password: 'Current password', show: 'Show password', hide: 'Hide password',
    confirmation: 'Type KONTO LÖSCHEN (German for DELETE ACCOUNT) to continue', remove: 'Permanently delete account',
    export: 'Download account and travel data as JSON', cancel: 'Cancel export',
    catalog: 'Translation catalog', search: 'Search translations', empty: 'No matching translations found.',
  },
} as const

for (const language of ['de', 'en'] as const) {
  test(`Settings ${language}: real deletion preparation stays local, translated and requires the unchanged exact phrase`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { language })
    const text = words[language]
    await page.getByRole('heading', { name: text.title, exact: true }).waitFor()
    assert.equal(await page.locator('[data-einstellungen-hub]').getAttribute('lang'), language)
    assert.equal(await page.locator('a[href="/account/security"]').count(), 1)
    assert.equal(await page.getByRole('button', { name: text.export, exact: true }).count(), 1)
    await page.getByRole('button', { name: text.prepare, exact: true }).click()
    await page.getByLabel(text.confirmation, { exact: true }).fill('DELETE ACCOUNT')
    await page.getByLabel(text.password, { exact: true }).fill('synthetic-never-submitted')
    assert.equal(await page.getByRole('button', { name: text.remove, exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: text.show, exact: true }).click()
    assert.equal(await page.getByLabel(text.password, { exact: true }).getAttribute('type'), 'text')
    await page.getByRole('button', { name: text.hide, exact: true }).click()
    assert.equal(await page.getByLabel(text.password, { exact: true }).getAttribute('type'), 'password')
    await page.getByRole('button', { name: text.close, exact: true }).click()
    assert.equal(await page.getByLabel(text.confirmation, { exact: true }).count(), 0)
    await page.getByRole('button', { name: text.prepare, exact: true }).click()
    assert.equal(await page.getByLabel(text.password, { exact: true }).inputValue(), '')
    assert.equal(await page.getByLabel(text.confirmation, { exact: true }).inputValue(), '')
    assert.deepEqual(await calls(page), [])
    assert.deepEqual(await page.evaluate(() => window.__settingsCompletion.exports()), [])
  })
}

test('Settings selection is unsaved until explicit submit, rejects duplicate submits and survives a real document reload through the fixture store', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t, { initial: ready('de', ACCOUNT_A, false) })
  await page.getByText('Deutsch ist die Voreinstellung. Du hast noch keine unterstützte Sprache gespeichert.', { exact: true }).waitFor()
  await choose(page, 'en')
  await page.getByText('Your selection has not been saved yet.', { exact: true }).waitFor()
  assert.deepEqual(await calls(page), [])
  assert.equal(fixture.commits.length, 0)
  await page.getByRole('button', { name: 'Discard selection', exact: true }).click()
  assert.equal(await page.getByRole('combobox').inputValue(), 'de')
  await choose(page, 'en')
  await page.getByRole('button', { name: 'Save language', exact: true }).evaluate((button) => {
    const form = button.closest('form')!
    form.requestSubmit()
    form.requestSubmit()
    form.requestSubmit()
  })
  const save = await pending(page, 'save')
  assert.equal((await calls(page)).length, 1)
  assert.deepEqual((await calls(page))[save].input, { sprache: 'en', erwarteteBenutzerId: ACCOUNT_A })
  assert.equal(await page.getByRole('combobox').isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: 'Saving language …', exact: true }).isDisabled(), true)
  assert.equal(fixture.accounts.get(ACCOUNT_A)?.sprache, 'de')
  await confirm(page, save, 'en')
  await page.getByText('Language saved and read back from your account.', { exact: true }).waitFor()
  assert.equal(fixture.commits.length, 1)
  const oldDocument = await page.evaluate(() => window.__settingsCompletion.documentId)
  await page.reload()
  await page.waitForFunction((old) => window.__settingsCompletion?.documentId !== old, oldDocument)
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').inputValue(), 'en')
  await page.getByText('This language is saved in your account.', { exact: true }).waitFor()
  assert.equal(fixture.commits.length, 1)
  assert.deepEqual(await calls(page), [])
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0)
})

test('Personal Admin settings save the same account preference without global settings or export/deletion controls', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t, { surface: 'admin' })
  await page.getByRole('heading', { name: 'Persönliche Einstellungen', exact: true }).waitFor()
  await choose(page, 'en')
  await page.getByText('System configuration, provider credentials and secrets are not changed here.', { exact: true }).waitFor()
  assert.equal(await page.locator('[data-export-phase], [data-kontoloeschung-phase]').count(), 0)
  await confirm(page, await startSave(page), 'en')
  assert.deepEqual(fixture.commits, [{ sprache: 'en', erwarteteBenutzerId: ACCOUNT_A }])
  await page.reload()
  await page.getByRole('heading', { name: 'Personal settings', exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').inputValue(), 'en')
})

for (const status of ['nicht_verfuegbar', 'nicht_angemeldet'] as const) {
  test(`Settings ${status}: no automatic read/write; explicit read can restore verified fixture state`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { initial: { status } })
    assert.equal(await page.getByRole('combobox').isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Sprache speichern', exact: true }).isDisabled(), true)
    assert.deepEqual(await calls(page), [])
    await page.getByRole('button', { name: 'Gespeicherte Sprache erneut laden', exact: true }).click()
    const read = await pending(page, 'read')
    await page.evaluate((index) => window.__settingsCompletion.replyFromStore(index), read)
    await page.locator('[data-kontosprache-phase="bereit"]').waitFor()
    assert.equal(await page.getByRole('combobox').isEnabled(), true)
    assert.equal(fixture.commits.length, 0)
    assert.equal((await calls(page)).length, 1)
  })
}

for (const outcome of ['abgelehnt', 'nicht_verfuegbar', 'nicht_bestaetigt', 'throw'] as const) {
  test(`Settings write ${outcome}: retry needs an explicit read and a new explicit save`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { clock: true })
    await choose(page, 'en')
    const save = await startSave(page)
    if (outcome === 'throw') await page.evaluate((index) => window.__settingsCompletion.reject(index), save)
    else await reply(page, save, { ok: false, code: outcome })
    await page.locator('#konto-sprache-status[role="alert"]').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Save language', exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('combobox').isDisabled(), true)
    await page.clock.fastForward(60_000)
    assert.equal((await calls(page)).length, 1)
    assert.equal(fixture.commits.length, 0)
    await page.getByRole('button', { name: 'Reload saved language', exact: true }).click()
    const read = await pending(page, 'read')
    await page.evaluate((index) => window.__settingsCompletion.replyFromStore(index), read)
    await page.locator('[data-einstellungen-hub][lang="de"]').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Sprache speichern', exact: true }).isDisabled(), true)
    assert.equal((await calls(page)).filter((call) => call.kind === 'save').length, 1)
    await choose(page, 'en')
    await confirm(page, await startSave(page), 'en')
    assert.equal((await calls(page)).filter((call) => call.kind === 'save').length, 2)
    assert.equal(fixture.commits.length, 1)
  })
}

for (const code of ['nicht_angemeldet', 'konto_gewechselt'] as const) {
  test(`Settings ${code} save response keeps editing blocked until a fresh page`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { clock: true })
    await choose(page, 'en')
    await reply(page, await startSave(page), { ok: false, code })
    await page.locator('#konto-sprache-status[role="alert"]').waitFor()
    assert.equal(await page.getByRole('combobox').isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: words.en.save, exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Reload page', exact: true }).count(), 1)
    assert.equal(await page.getByRole('button', { name: words.en.reload, exact: true }).count(), 0)
    await page.clock.fastForward(60_000)
    assert.equal((await calls(page)).length, 1)
  })
}

test('Settings rejected input permits correction but never repeats the write automatically', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t, { clock: true })
  await choose(page, 'en')
  await reply(page, await startSave(page), { ok: false, code: 'eingabe' })
  await page.getByText('Please choose German or English. Nothing was changed.', { exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').isEnabled(), true)
  await page.clock.fastForward(60_000)
  assert.equal((await calls(page)).length, 1)
  assert.equal(fixture.commits.length, 0)
  await confirm(page, await startSave(page), 'en')
  assert.equal(fixture.commits.length, 1)
})

test('Settings thrown read stays unavailable and retries only after another explicit read', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t, { clock: true })
  await page.getByRole('button', { name: words.de.reload, exact: true }).click()
  await page.evaluate((index) => window.__settingsCompletion.reject(index), await pending(page, 'read'))
  await page.locator('#konto-sprache-status[role="alert"]').waitFor()
  assert.equal(await page.getByRole('combobox').isDisabled(), true)
  await page.clock.fastForward(60_000)
  assert.equal((await calls(page)).length, 1)
  await page.getByRole('button', { name: words.de.reload, exact: true }).click()
  await page.evaluate((index) => window.__settingsCompletion.replyFromStore(index), await pending(page, 'read'))
  await page.locator('[data-kontosprache-phase="bereit"]').waitFor()
  assert.equal(await page.getByRole('combobox').isEnabled(), true)
  assert.equal((await calls(page)).length, 2)
})

const invalidWrites: [string, unknown][] = [
  ['foreign account', { ok: true, benutzerId: ACCOUNT_B, sprache: 'en' }],
  ['different language', { ok: true, benutzerId: ACCOUNT_A, sprache: 'de' }],
  ['unsupported language', { ok: true, benutzerId: ACCOUNT_A, sprache: 'fr' }],
  ['null reply', null],
  ['non-boolean success', { ok: 'true', benutzerId: ACCOUNT_A, sprache: 'en' }],
  ['unknown rejection', { ok: false, code: 'synthetic_unknown' }],
]
for (const [name, body] of invalidWrites) {
  test(`Settings rejects ${name} save receipt without claiming persistence`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t)
    await choose(page, 'en')
    await reply(page, await startSave(page), body)
    await page.getByText('Saving could not be confirmed. The language may already have been saved. Reload the stored value; nothing is retried automatically.', { exact: true }).waitFor()
    assert.equal(await page.locator('[data-kontosprache-phase="gespeichert"]').count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Save language', exact: true }).isDisabled(), true)
    assert.equal(fixture.commits.length, 0)
    assert.equal((await calls(page)).length, 1)
  })
}

const invalidReads: [string, unknown][] = [
  ['null', null],
  ['unsupported language', { status: 'bereit', benutzerId: ACCOUNT_A, sprache: 'fr', gespeichert: true }],
  ['missing persisted flag', { status: 'bereit', benutzerId: ACCOUNT_A, sprache: 'en' }],
  ['invalid identity', { status: 'bereit', benutzerId: '', sprache: 'en', gespeichert: true }],
]
for (const [name, body] of invalidReads) {
  test(`Settings rejects malformed ${name} read and retains a disabled unconfirmed selection`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t)
    await page.getByRole('button', { name: words.de.reload, exact: true }).click()
    await reply(page, await pending(page, 'read'), body)
    await page.getByText('Die gespeicherte Sprache ist derzeit nicht verfügbar. Bitte lade sie erneut, bevor du Änderungen speicherst.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('combobox').inputValue(), 'de')
    assert.equal(await page.getByRole('combobox').isDisabled(), true)
    assert.equal((await calls(page)).filter((call) => call.kind === 'save').length, 0)
  })
}

test('Settings foreign-account read hard-stops editing and never adopts its language', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t)
  await page.getByRole('button', { name: words.de.reload, exact: true }).click()
  await reply(page, await pending(page, 'read'), ready('en', ACCOUNT_B))
  await page.getByText('Das angemeldete Konto hat sich geändert. Lade diese Seite neu, bevor du Einstellungen änderst.', { exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').inputValue(), 'de')
  assert.equal(await page.getByRole('combobox').isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: 'Seite neu laden', exact: true }).count(), 1)
  assert.equal(await page.getByRole('button', { name: words.de.reload, exact: true }).count(), 0)
})

test('Settings identity observer invalidates an in-flight write; late commit cannot restore confirmation', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t)
  await choose(page, 'en')
  const save = await startSave(page)
  fixture.activeUser = ACCOUNT_B
  await page.evaluate((userId) => window.__settingsCompletion.notifyAccountChanged(userId), ACCOUNT_A)
  await page.getByText('The signed-in account has changed. Reload this page before changing settings.', { exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').isDisabled(), true)
  await page.evaluate((index) => window.__settingsCompletion.commitSave(index), save)
  await reply(page, save, { ok: true, benutzerId: ACCOUNT_A, sprache: 'en' })
  await stableFrame(page)
  assert.equal(await page.locator('[data-kontosprache-phase="gespeichert"]').count(), 0)
  const previous = await page.evaluate(() => window.__settingsCompletion.documentId)
  await page.getByRole('button', { name: 'Reload page', exact: true }).click()
  await page.waitForFunction((old) => Boolean(window.__settingsCompletion?.documentId && window.__settingsCompletion.documentId !== old), previous)
  await page.getByRole('heading', { name: 'Einstellungen', exact: true }).waitFor()
  assert.equal(await page.getByRole('combobox').inputValue(), 'de')
  assert.equal(fixture.accounts.get(ACCOUNT_B)?.sprache, 'de')
})

for (const kind of ['save', 'read'] as const) {
  test(`Settings replaced account ignores a late ${kind} and disposed identity observer`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t)
    if (kind === 'save') await choose(page, 'en')
    if (kind === 'save') await startSave(page)
    else await page.getByRole('button', { name: words.de.reload, exact: true }).click()
    const old = await pending(page, kind)
    const observer = await page.evaluate(() => window.__settingsCompletion.observers().findIndex((item) => item.active))
    fixture.activeUser = ACCOUNT_B
    await page.evaluate((replacement) => window.__settingsCompletion.replaceAccount(replacement), ready('de', ACCOUNT_B))
    await page.waitForFunction((id) => window.__settingsCompletion.observers().some((item) => item.userId === id && item.active), ACCOUNT_B)
    if (kind === 'save') await page.evaluate((index) => window.__settingsCompletion.commitSave(index), old)
    await reply(page, old, kind === 'save' ? { ok: true, benutzerId: ACCOUNT_A, sprache: 'en' } : ready('en'))
    await page.evaluate((index) => window.__settingsCompletion.deliverOldObserver(index), observer)
    await stableFrame(page)
    assert.equal(await page.getByRole('combobox').inputValue(), 'de')
    assert.equal(await page.getByRole('combobox').isEnabled(), true)
    assert.equal(await page.locator('#konto-sprache-status[role="alert"]').count(), 0)
    assert.equal(await page.locator('[data-kontosprache-phase="gespeichert"]').count(), 0)
    await choose(page, 'en')
    const current = await startSave(page)
    assert.deepEqual((await calls(page))[current].input, { sprache: 'en', erwarteteBenutzerId: ACCOUNT_B })
    await confirm(page, current, 'en', ACCOUNT_B)
  })
}

test('Settings unmount disposes the observer; a late server write remains possible without reviving the screen', { timeout: 30_000 }, async (t) => {
  const { page, fixture } = await open(t)
  await choose(page, 'en')
  const save = await startSave(page)
  await page.evaluate(() => window.__settingsCompletion.unmount())
  await page.getByText('Settings fixture unmounted', { exact: true }).waitFor()
  await page.waitForFunction(() => window.__settingsCompletion.observers().every((observer) => !observer.active))
  await page.evaluate((index) => window.__settingsCompletion.commitSave(index), save)
  await reply(page, save, { ok: true, benutzerId: ACCOUNT_A, sprache: 'en' })
  await stableFrame(page)
  assert.equal(await page.locator('[data-einstellungen-hub]').count(), 0)
  assert.equal(fixture.accounts.get(ACCOUNT_A)?.sprache, 'en')
  assert.equal(fixture.commits.length, 1)
})

for (const kind of ['save', 'read'] as const) {
  test(`Settings ${kind} reaches its exact 30s UI deadline without automatic retry or a false server-abort claim`, { timeout: 30_000 }, async (t) => {
    const { page, fixture } = await open(t, { clock: true })
    await page.clock.pauseAt(new Date(CLOCK_START.getTime() + 60_000))
    if (kind === 'save') { await choose(page, 'en'); await startSave(page) }
    else await page.getByRole('button', { name: words.de.reload, exact: true }).click()
    const old = await pending(page, kind)
    const remaining = await page.evaluate((index) => window.__settingsCompletion.calls()[index].startedAt + 30_000 - Date.now(), old)
    assert.ok(remaining > 1 && remaining <= 30_000)
    await page.clock.runFor(remaining - 1)
    assert.equal(await page.locator('[data-kontosprache-phase]').getAttribute('data-kontosprache-phase'), kind === 'save' ? 'speichern' : 'laden')
    await page.clock.runFor(1)
    await page.locator('#konto-sprache-status[role="alert"]').waitFor()
    assert.equal(await page.getByRole('combobox').isDisabled(), true)
    if (kind === 'save') {
      assert.match(await page.locator('#konto-sprache-status').innerText(), /may already have been saved/)
      await page.evaluate((index) => window.__settingsCompletion.commitSave(index), old)
      assert.equal(fixture.accounts.get(ACCOUNT_A)?.sprache, 'en')
    }
    await page.getByRole('button', { name: kind === 'save' ? words.en.reload : words.de.reload, exact: true }).click()
    const newer = await pending(page, 'read', old + 1)
    await page.locator('[data-kontosprache-phase="laden"]').waitFor()
    // Deliver the superseded response only after the new read owns its own
    // timeout. An old finally must neither finish nor clear that new request.
    await reply(page, old, kind === 'save' ? { ok: true, benutzerId: ACCOUNT_A, sprache: 'en' } : ready('en'))
    await page.clock.runFor(1)
    assert.equal(await page.locator('[data-kontosprache-phase]').getAttribute('data-kontosprache-phase'), 'laden')
    const newerRemaining = await page.evaluate((index) => window.__settingsCompletion.calls()[index].startedAt + 30_000 - Date.now(), newer)
    assert.ok(newerRemaining > 1 && newerRemaining <= 30_000)
    await page.clock.runFor(newerRemaining - 1)
    assert.equal(await page.locator('[data-kontosprache-phase]').getAttribute('data-kontosprache-phase'), 'laden')
    await page.clock.runFor(1)
    await page.locator('#konto-sprache-status[role="alert"]').waitFor()
    await reply(page, newer, ready(kind === 'save' ? 'de' : 'en'))
    await page.clock.fastForward(60_000)
    assert.equal((await calls(page)).length, 2)
    assert.equal(await page.locator('[data-kontosprache-phase="gespeichert"]').count(), 0)
    assert.equal(await page.getByRole('combobox').inputValue(), kind === 'save' ? 'en' : 'de')
    await page.getByRole('button', { name: kind === 'save' ? words.en.reload : words.de.reload, exact: true }).click()
    const finalRead = await pending(page, 'read', newer + 1)
    await page.evaluate((index) => window.__settingsCompletion.replyFromStore(index), finalRead)
    await page.locator('[data-kontosprache-phase="bereit"]').waitFor()
    assert.equal(await page.getByRole('combobox').inputValue(), kind === 'save' ? 'en' : 'de')
    assert.equal((await calls(page)).filter((call) => call.kind === 'save').length, kind === 'save' ? 1 : 0)
  })
}

const exportTables = ['profiles', 'account_travellers', 'account_traveller_citizenships', 'account_traveller_documents', 'account_visits', 'trips', 'trip_stages', 'trip_days', 'trip_items', 'trip_travellers', 'trip_traveller_citizenships', 'trip_traveller_documents', 'trip_readiness_items']
const exportDocument = {
  schemaVersion: 'jetnity.account-export.v1', generatedAt: '2026-11-15T12:00:00.000Z',
  scope: { owner: 'authenticated-session', completeness: 'jetnity-owned-account-travel-rows', tables: exportTables },
  data: Object.fromEntries(exportTables.map((table) => [table, []])),
}
for (const language of ['de', 'en'] as const) for (const outcome of ['unauthenticated', 'unavailable', 'malformed', 'cancelled', 'success'] as const) {
  test(`Settings ${language} export ${outcome}: production status is translated and never leaves Settings`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { language })
    const downloads: string[] = []
    page.on('download', (download) => downloads.push(download.suggestedFilename()))
    await page.getByRole('button', { name: words[language].export, exact: true }).click()
    await page.locator('[data-export-phase="laeuft"]').waitFor()
    assert.equal(await page.getByRole('button', { name: words[language].export, exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: words[language].cancel, exact: true }).waitFor()
    if (outcome === 'cancelled') await page.getByRole('button', { name: words[language].cancel, exact: true }).click()
    const status = outcome === 'unauthenticated' ? 401 : outcome === 'unavailable' ? 503 : 200
    const body = outcome === 'malformed' ? { schemaVersion: 'untrusted' } : exportDocument
    const download = outcome === 'success' ? page.waitForEvent('download') : null
    await page.evaluate(({ status, body }) => window.__settingsCompletion.replyExport(0, status, body), { status, body })
    if (download) assert.equal((await download).suggestedFilename(), 'jetnity-account-export-2026-11-15.json')
    const phase = outcome === 'success' ? 'uebergeben' : outcome === 'cancelled' ? 'abgebrochen' : 'fehler'
    await page.locator(`[data-export-phase="${phase}"]`).waitFor()
    const message = await page.locator('[data-export-phase] p').innerText()
    if (language === 'en') {
      assert.match(message, outcome === 'success' ? /handed to your browser.*does not check whether your operating system saved it/ : outcome === 'unauthenticated' ? /not signed in.*Nothing was downloaded/ : outcome === 'unavailable' ? /currently unavailable.*Nothing was downloaded/ : outcome === 'cancelled' ? /cancelled.*Nothing was downloaded/ : /not a valid export file.*Nothing was downloaded/)
    } else {
      assert.match(message, outcome === 'success' ? /Browser zum Speichern übergeben.*prüft nicht, ob das Betriebssystem/ : outcome === 'unauthenticated' ? /nicht angemeldet.*nichts heruntergeladen/ : outcome === 'unavailable' ? /nicht erreichbar.*nichts heruntergeladen/ : outcome === 'cancelled' ? /abgebrochen.*nichts heruntergeladen/ : /keine gültige Exportdatei.*nichts heruntergeladen/)
    }
    assert.equal(new URL(page.url()).pathname, '/account/settings')
    assert.deepEqual(await calls(page), [])
    assert.equal((await page.evaluate(() => window.__settingsCompletion.exports())).length, 1)
    if (outcome !== 'success') { await stableFrame(page); assert.deepEqual(downloads, []) }
    if (outcome === 'cancelled') assert.equal((await page.evaluate(() => window.__settingsCompletion.exports()))[0].aborted, true)
  })
}

test('Existing export error and deletion preparation update when the unsaved language changes', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t)
  await page.getByRole('button', { name: words.de.export, exact: true }).click()
  await page.evaluate(() => window.__settingsCompletion.replyExport(0, 503, {}))
  await page.getByText('Der Export ist gerade nicht erreichbar. Es wurde nichts heruntergeladen.', { exact: true }).waitFor()
  await page.getByRole('button', { name: words.de.prepare, exact: true }).click()
  await choose(page, 'en')
  await page.getByText('The export is currently unavailable. Nothing was downloaded.', { exact: true }).waitFor()
  assert.equal(await page.getByLabel(words.en.confirmation, { exact: true }).count(), 1)
  assert.equal(await page.getByRole('button', { name: words.en.close, exact: true }).count(), 1)
  assert.deepEqual(await calls(page), [])
})

for (const language of ['de', 'en'] as const) {
  test(`Translation catalog ${language}: key/text search, bilingual values and explicit empty state`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { surface: 'catalog', language })
    await page.getByRole('heading', { name: words[language].catalog, exact: true }).waitFor()
    const search = page.getByRole('searchbox', { name: words[language].search, exact: true })
    const initialCount = await page.locator('tbody tr').count()
    assert.ok(initialCount > 0)
    assert.equal(Number(await page.locator('dd').first().innerText()), initialCount)
    await search.fill('language.confirmed')
    assert.equal(await page.locator('tbody tr').count(), 1)
    assert.equal(await page.getByRole('cell', { name: 'Sprache gespeichert und erneut aus deinem Konto gelesen.', exact: true }).count(), 1)
    assert.equal(await page.getByRole('cell', { name: 'Language saved and read back from your account.', exact: true }).count(), 1)
    await search.fill('YOUR SAVED ACCOUNT LANGUAGE')
    assert.equal(await page.getByRole('rowheader', { name: 'export.exclusion', exact: true }).count(), 1)
    await search.fill('synthetic-no-such-translation-5172')
    await page.getByRole('status').filter({ hasText: words[language].empty }).waitFor()
    assert.equal(await page.locator('tbody tr').count(), 0)
    await search.fill('')
    assert.equal(await page.locator('tbody tr').count(), initialCount)
    assert.deepEqual(await calls(page), [])
    assert.equal(await page.getByRole('button', { name: /Publish|Veröffentlichen|Speichern|Save/ }).count(), 0)
  })
}

for (const surface of ['konto', 'admin', 'catalog'] as const) for (const language of ['de', 'en'] as const) for (const width of [320, 390, 1280]) {
  test(`Settings ${surface}/${language} at ${width}px: 100/200% text, contained labels and 44px controls`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { surface, language, width })
    const measurements: (Awaited<ReturnType<typeof layoutGeometry>> & { state: string })[] = []
    const other = language === 'de' ? 'en' : 'de'
    for (const scale of [1, 2]) {
      await textScale(page, scale)
      measurements.push({ state: 'saved, closed', ...await layoutGeometry(page, width, scale) })
      if (surface !== 'catalog') {
        await choose(page, other)
        measurements.push({ state: 'unsaved, closed', ...await layoutGeometry(page, width, scale) })
        if (surface === 'konto') {
          await page.getByRole('button', { name: words[other].prepare, exact: true }).click()
          await page.getByLabel(words[other].confirmation, { exact: true }).waitFor()
          measurements.push({ state: 'unsaved, deletion preparation open', ...await layoutGeometry(page, width, scale) })
          await page.getByRole('button', { name: words[other].close, exact: true }).click()
        }
        await page.getByRole('button', { name: other === 'en' ? 'Discard selection' : 'Auswahl verwerfen', exact: true }).click()
        await page.locator(`[data-einstellungen-hub][lang="${language}"]`).waitFor()
      }
    }
    // Collect both scales and every visible-control state before asserting;
    // one narrow-layout failure must not hide the remaining measurements.
    assert.ok(measurements.every((measurement) => measurement.controlCount >= (surface === 'konto' ? 7 : surface === 'admin' ? 3 : 2)))
    const failures = measurements.filter((measurement) => measurement.problems.length)
    assert.deepEqual(failures, [], JSON.stringify({ surface, language, measurements }))
    assert.deepEqual(await calls(page), [])
  })
}

for (const appearance of ['light', 'dark'] as const) for (const language of ['de', 'en'] as const) {
  test(`Personal Admin ${appearance}/${language}: real text contrast and 320px reflow in saved and error states`, { timeout: 30_000 }, async (t) => {
    const { page } = await open(t, { surface: 'admin', language, appearance, width: 320 })
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), appearance === 'dark')
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), appearance)
    const measurements: { state: string; scale: number; contrast: Awaited<ReturnType<typeof settingsContrast>>; layout: Awaited<ReturnType<typeof layoutGeometry>> }[] = []
    const other = language === 'de' ? 'en' : 'de'
    for (const scale of [1, 2]) {
      await textScale(page, scale)
      measurements.push({ state: 'saved', scale, contrast: await settingsContrast(page), layout: await layoutGeometry(page, 320, scale) })
      await choose(page, other)
      await reply(page, await startSave(page), { ok: false, code: 'abgelehnt' })
      await page.locator('#konto-sprache-status[role="alert"]').waitFor()
      measurements.push({ state: 'rejected', scale, contrast: await settingsContrast(page), layout: await layoutGeometry(page, 320, scale) })
      await page.getByRole('button', { name: words[other].reload, exact: true }).click()
      await page.evaluate((index) => window.__settingsCompletion.replyFromStore(index), await pending(page, 'read'))
      await page.locator(`[data-einstellungen-hub][lang="${language}"]`).waitFor()
    }
    const failures = measurements.map((measurement) => ({ state: measurement.state, scale: measurement.scale, contrast: measurement.contrast.filter((row) => row.ratio < row.minimum), layout: measurement.layout.problems }))
      .filter((measurement) => measurement.contrast.length || measurement.layout.length)
    assert.deepEqual(failures, [], JSON.stringify({ appearance, language, measurements }))
  })
}

test('Settings keyboard at 320px/200% can select, focus the explicit save and receive confirmation', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t, { width: 320 })
  await textScale(page, 2)
  await page.getByRole('combobox').focus()
  await page.keyboard.press('End')
  assert.equal(await page.getByRole('combobox').inputValue(), 'en')
  await page.locator('[data-einstellungen-hub][lang="en"]').waitFor()
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), shadow: document.activeElement instanceof HTMLElement ? getComputedStyle(document.activeElement).boxShadow : null }))
  assert.equal(focused.text, 'Save language')
  assert.ok(focused.shadow && focused.shadow !== 'none', 'Keyboard save target needs a visible focus indicator')
  assert.deepEqual(await calls(page), [])
  await page.keyboard.press('Enter')
  await confirm(page, await pending(page, 'save'), 'en')
  await page.getByText('Language saved and read back from your account.', { exact: true }).waitFor()
})

test('Translation catalog keyboard at 320px/200% reaches search and its empty-state announcement', { timeout: 30_000 }, async (t) => {
  const { page } = await open(t, { surface: 'catalog', language: 'en', width: 320 })
  await textScale(page, 2)
  await page.getByRole('link', { name: 'Open personal language settings', exact: true }).focus()
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'sprachkatalog-suche')
  await page.keyboard.type('synthetic-no-translation')
  await page.getByRole('status').filter({ hasText: words.en.empty }).waitFor()
  assert.equal(await page.locator('tbody tr').count(), 0)
})
