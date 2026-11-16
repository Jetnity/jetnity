// Actual product UI/CSS and Auth operations with synthetic IO. No hosted Auth,
// database, cookies, tokens or saved-preference evidence. Runs in normal core CI.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { after, before, test, type TestContext } from 'node:test'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import type { UiSprache } from '@/lib/localization/ui-sprache'
import type { SecurityFixtureBoot, SecurityScenario } from '@/scripts/account-security-display-3/auth-fixture'
import { sicherheitText } from '../account-security-texte'

let browser: Browser
let script = ''
let style = ''

before(async () => {
  const root = process.cwd()
  const require = createRequire(import.meta.url)
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwind = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(root, 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: root, entryPoints: ['scripts/account-security-display-3/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
      plugins: [{
        name: 'security-synthetic-io',
        setup(build) {
          build.onResolve({ filter: /^@\/lib\/supabase\/(?:client|server)$/ }, () => ({ path: join(root, 'scripts/account-security-display-3/auth-fixture.ts') }))
          build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(root, args.path.slice(2)), { resolveDir: root, kind: args.kind }))
        },
      }],
      define: {
        'process.env.NODE_ENV': '"development"',
        'process.env.__NEXT_ROUTER_BASEPATH': '""',
        'process.env.__NEXT_I18N_SUPPORT': 'false',
        'process.env.__NEXT_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_TRAILING_SLASH': 'false',
        'process.env.__NEXT_MANUAL_CLIENT_BASE_PATH': 'false',
        'process.env.__NEXT_LINK_NO_TOUCH_START': 'false',
      },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    postcss([nesting(), tailwind(require(join(root, 'tailwind.config.js'))), autoprefixer()]).process(readFileSync(from, 'utf8'), { from }),
  ])
  assert.doesNotMatch(bundle.outputFiles[0].text, /\bprocess\s*\.\s*env\b/, 'No unbound runtime environment')
  script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
  style = css.css.replaceAll('</style', '<\\/style')
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  } catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })
after(async () => { await browser?.close() })

async function open(t: TestContext, sprache: UiSprache, scenario: SecurityScenario, width = 1280) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  page.setDefaultTimeout(7_000)
  const violations: string[] = []
  const errors: string[] = []
  const url = 'http://security-display.invalid/proof'
  let loaded = false
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const violations: string[] = []
    window.__securityIsolationViolations = violations
    for (const name of ['localStorage', 'sessionStorage'] as const) {
      Object.defineProperty(window, name, { configurable: true, get() { violations.push(name); throw new Error(`Synthetic proof forbids ${name}`) } })
    }
    Object.defineProperty(document, 'cookie', { configurable: true, get() { violations.push('cookie read'); return '' }, set() { violations.push('cookie write') } })
    window.fetch = (() => { violations.push('fetch'); return Promise.reject(new Error('Synthetic proof forbids fetch')) }) as typeof fetch
  })
  const boot: SecurityFixtureBoot = { sprache, scenario }
  const data = JSON.stringify(boot).replaceAll('<', '\\u003c')
  await page.route('**/*', async (route) => {
    if (!loaded && route.request().isNavigationRequest() && route.request().url() === url) {
      loaded = true
      await route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html lang="${sprache}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Synthetic security display proof</title><style>${style}</style></head><body><div id="root"></div><script>window.__securityFixtureBoot=${data};${script}</script></body></html>` })
      return
    }
    violations.push(route.request().url())
    await route.abort()
  })
  t.after(async () => {
    try {
      assert.deepEqual(errors, [])
      assert.deepEqual(violations, [])
      assert.deepEqual(await page.evaluate(() => window.__securityIsolationViolations), [])
      assert.deepEqual(await context.cookies(), [])
    } finally { await context.close() }
  })
  await page.goto(url)
  await page.locator('#account-passkeys').waitFor()
  await page.waitForFunction(() => document.querySelector('[data-security-lage]')?.getAttribute('data-security-lage') !== 'loading')
  return page
}

const calls = (page: Page) => page.evaluate(() => window.__securityDisplay.calls)
const count = async (page: Page, operation: string) => (await calls(page)).filter((call) => call.operation === operation).length
const visible = async (page: Page, selector: string, value: string) => assert.ok((await page.locator(selector).innerText()).includes(value), value)

for (const sprache of ['de', 'en'] as const) {
  test(`Real security cards render ${sprache}, preserve user names and disabled Passkeys at mobile width`, async (t) => {
    const page = await open(t, sprache, 'ready', 390)
    await page.locator('[data-sitzung-lage="current"]').waitFor()
    for (const [selector, key] of [['#account-passwort', 'password.title'], ['#account-sitzung', 'session.title'], ['#account-abmelden', 'logout.title'], ['#account-totp', 'totp.title']] as const) {
      await visible(page, selector, sicherheitText(sprache, key))
    }
    await visible(page, '#account-sitzung', sicherheitText(sprache, 'session.aal1'))
    await visible(page, '#account-passkeys', sicherheitText(sprache, 'passkey.status.unsupported'))
    assert.equal(await page.locator('#account-passkeys').getAttribute('data-passkey-lage'), 'unsupported')
    assert.equal(await page.locator('#account-passkeys button').count(), 0)
    await page.getByRole('button', { name: sicherheitText(sprache, 'totp.remove', { name: 'Authenticator-App' }), exact: true }).waitFor()
    assert.doesNotMatch(await page.locator('main').innerText(), /fixture-factor|fixture-user|fixture-challenge|FIXTURE-DIAGNOSTIC/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    assert.equal(await count(page, 'enroll'), 0)
    assert.equal(await count(page, 'signOut'), 0)
  })

  test(`Password ${sprache} validates before unchanged nonce/password request and clears fields after success`, async (t) => {
    const page = await open(t, sprache, 'ready')
    await page.getByRole('button', { name: sicherheitText(sprache, 'password.open'), exact: true }).click()
    await page.getByRole('button', { name: sicherheitText(sprache, 'password.send'), exact: true }).click()
    await page.locator('#account-password-nonce').waitFor()
    assert.equal(await page.locator('#account-password-nonce').evaluate((element) => element === document.activeElement), true)
    assert.equal(await count(page, 'reauthenticate'), 1)
    await page.locator('#account-password-nonce').fill('  abc123  ')
    await page.locator('#account-password-new').fill('FixturePassw0rd!')
    await page.locator('#account-password-confirm').fill('DifferentPassw0rd!')
    await page.getByRole('button', { name: sicherheitText(sprache, 'password.save'), exact: true }).click()
    await page.locator('[data-password-lage="error"]').waitFor()
    await visible(page, '#account-passwort', sicherheitText(sprache, 'password.error.password_mismatch'))
    assert.equal(await count(page, 'updateUser'), 0)
    await page.locator('#account-password-confirm').fill('FixturePassw0rd!')
    await page.getByRole('button', { name: sicherheitText(sprache, 'password.save'), exact: true }).click()
    await page.locator('[data-password-lage="success"]').waitFor()
    assert.deepEqual((await calls(page)).filter((call) => call.operation === 'updateUser'), [{ operation: 'updateUser', input: { password: 'FixturePassw0rd!', nonce: 'abc123' } }])
    await visible(page, '#account-passwort', sicherheitText(sprache, 'password.status.success'))
    assert.equal(await page.locator('input[autocomplete="current-password"]').count(), 0)
    assert.equal(await page.locator('#account-password-new').count(), 0)
  })

  test(`Logout ${sprache} confirms global first and keeps this session after native others action`, async (t) => {
    const page = await open(t, sprache, 'ready')
    await page.getByRole('button', { name: sicherheitText(sprache, 'logout.options'), exact: true }).click()
    for (const scope of ['local', 'others', 'global'] as const) {
      assert.equal(await page.locator(`[data-logout-action="${scope}"]`).innerText(), sicherheitText(sprache, `logout.action.${scope}.label`))
    }
    await page.locator('[data-logout-action="global"]').click()
    await page.getByRole('group', { name: sicherheitText(sprache, 'logout.confirmTitle') }).waitFor()
    assert.equal(await count(page, 'signOut'), 0)
    await page.getByRole('button', { name: sicherheitText(sprache, 'common.cancel'), exact: true }).click()
    assert.equal(await count(page, 'signOut'), 0)
    await page.locator('[data-logout-action="others"]').click()
    await page.locator('[data-logout-lage="success"]').waitFor()
    assert.deepEqual((await calls(page)).filter((call) => call.operation === 'signOut'), [{ operation: 'signOut', input: { scope: 'others' } }])
    await visible(page, '#account-abmelden', sicherheitText(sprache, 'logout.success.others'))
    await visible(page, '#account-abmelden', sicherheitText(sprache, 'logout.jwtHint'))
    assert.equal(page.url(), 'http://security-display.invalid/proof')
  })
}

test('Signed-out and unsupported states remain unavailable and never invent empty session/factor lists', async (t) => {
  const page = await open(t, 'en', 'signedOut')
  await page.locator('[data-sitzung-lage="unavailable"]').waitFor()
  await visible(page, '#account-sitzung', 'Please sign in again.')
  assert.equal(await page.locator('#account-sitzung dl').count(), 0)
  await page.locator('[data-password-lage="error"]').waitFor()
  await visible(page, '#account-passwort', 'Please sign in again.')
  assert.equal(await page.locator('[data-security-lage="error"]').count(), 1)
  assert.doesNotMatch(await page.locator('#account-totp').innerText(), /No authenticator app has been set up/)
  const unsupported = await open(t, 'en', 'unsupported')
  await unsupported.locator('[data-security-lage="unsupported"]').waitFor()
  await visible(unsupported, '#account-totp', 'This does not mean that no factors exist.')
  assert.equal(await unsupported.getByRole('button', { name: 'Set up authenticator app', exact: true }).count(), 0)
})

test('List error is not empty; changing display language retains the error, then explicit retry reads empty', async (t) => {
  const page = await open(t, 'en', 'retry')
  await page.locator('[data-security-lage="error"]').waitFor()
  await visible(page, '#account-totp', 'Whether any have been set up is therefore unknown.')
  const reads = await count(page, 'listFactors')
  await page.locator('[data-fixture-language]').click()
  await visible(page, '#account-totp', sicherheitText('de', 'totp.status.error'))
  await visible(page, 'main', sicherheitText('de', 'security.error.network'))
  assert.equal(await count(page, 'listFactors'), reads, 'Locale changes cause no Auth reads or mutations')
  await page.getByRole('button', { name: 'Erneut laden', exact: true }).click()
  await page.locator('[data-security-lage="empty"]').waitFor()
  await visible(page, '#account-totp', sicherheitText('de', 'totp.status.empty'))
  assert.equal(await count(page, 'listFactors'), reads + 1)
  assert.doesNotMatch(await page.locator('main').innerText(), /FIXTURE-DIAGNOSTIC|secret=/)
})

test('Local and confirmed global labels preserve exact server scopes on an uncertain response', async (t) => {
  const page = await open(t, 'en', 'logoutFailure')
  await page.getByRole('button', { name: 'Sign-out options', exact: true }).click()
  await page.locator('[data-logout-action="local"]').click()
  await page.locator('[data-logout-lage="error"]').waitFor()
  await visible(page, '#account-abmelden', sicherheitText('en', 'logout.error.network'))
  await page.locator('[data-logout-action="global"]').click()
  await page.getByRole('button', { name: 'Yes, sign out everywhere', exact: true }).click()
  await page.locator('[data-logout-lage="error"]').waitFor()
  assert.deepEqual((await calls(page)).filter((call) => call.operation === 'signOut'), [
    { operation: 'signOut', input: { scope: 'local' } }, { operation: 'signOut', input: { scope: 'global' } },
  ])
  assert.equal(page.url(), 'http://security-display.invalid/proof')
})

test('Enrollment shows QR only after user action and uses the native challenge/verify flow', async (t) => {
  const page = await open(t, 'en', 'empty')
  assert.equal(await page.locator('#account-totp img').count(), 0)
  await page.getByRole('button', { name: 'Set up authenticator app', exact: true }).click()
  await page.getByRole('img', { name: 'QR code for setting up two-factor authentication' }).waitFor()
  assert.deepEqual((await calls(page)).filter((call) => call.operation === 'enroll'), [{ operation: 'enroll', input: { factorType: 'totp' } }])
  assert.equal(await page.getByRole('dialog').count(), 0, 'Enrollment is not an Unenroll step-up')
  await page.locator('#totp-code').fill('123456')
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await page.locator('[data-security-lage="ready"]').waitFor()
  await visible(page, '#account-totp', 'Configured authenticator apps')
  await visible(page, '#account-totp', 'verified')
  assert.deepEqual((await calls(page)).filter((call) => call.operation === 'verify'), [{ operation: 'verify', input: { factorId: 'fixture-enrolled', challengeId: 'fixture-challenge', code: '123456' } }])
  assert.equal(await page.locator('#totp-code').count(), 0)
  assert.equal(await page.locator('#account-totp img').count(), 0)
  assert.equal(await count(page, 'unenroll'), 0)
})

test('Verified removal keeps native step-up, focus, busy controls, invalid-code error and post-removal confirmation', async (t) => {
  const page = await open(t, 'en', 'stepUp', 390)
  const remove = page.getByRole('button', { name: 'Remove Authenticator-App', exact: true })
  await remove.click()
  const dialog = page.getByRole('dialog', { name: 'Confirm authenticator app' })
  await dialog.waitFor()
  const code = page.locator('#account-mfa-step-up-code')
  await page.waitForFunction(() => document.activeElement?.id === 'account-mfa-step-up-code')
  await code.press('Escape')
  await dialog.waitFor({ state: 'detached' })
  assert.equal(await remove.evaluate((element) => document.activeElement === element), true)
  assert.equal(await count(page, 'challenge'), 0)
  assert.equal(await count(page, 'unenroll'), 0)
  await remove.click()
  await dialog.waitFor()
  await code.fill('000000')
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
  await page.locator('[role="dialog"][data-mfa-step-up-lage="error"]').waitFor()
  await visible(page, '[role="dialog"]', 'The code is invalid.')
  assert.equal(await count(page, 'unenroll'), 0)
  assert.equal(await code.inputValue(), '')
  await page.evaluate(() => { window.__securityDisplay.holdVerify = true })
  await code.fill('123456')
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
  await page.waitForFunction(() => window.__securityDisplay.releaseVerify !== null)
  assert.equal(await code.isDisabled(), true)
  assert.equal(await dialog.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true)
  await page.evaluate(() => window.__securityDisplay.releaseVerify?.())
  await dialog.waitFor({ state: 'detached' })
  await page.locator('[data-security-lage="empty"]').waitFor()
  await visible(page, 'main', 'Authenticator app removed.')
  const history = await calls(page)
  assert.deepEqual(history.filter((call) => call.operation === 'unenroll'), [{ operation: 'unenroll', input: { factorId: 'fixture-factor' } }])
  assert.deepEqual(history.filter((call) => call.operation === 'verify').map((call) => call.input), [
    { factorId: 'fixture-factor', challengeId: 'fixture-challenge', code: '000000' },
    { factorId: 'fixture-factor', challengeId: 'fixture-challenge', code: '123456' },
  ])
  const unenroll = history.findIndex((call) => call.operation === 'unenroll')
  assert.ok(history.slice(unenroll + 1).some((call) => call.operation === 'refreshSession'))
  assert.ok(history.slice(unenroll + 1).some((call) => call.operation === 'getAuthenticatorAssuranceLevel'))
  assert.equal(await count(page, 'signOut'), 0)
  assert.doesNotMatch(await page.locator('main').innerText(), /fixture-factor|fixture-challenge|FIXTURE-DIAGNOSTIC|secret=/)
})
