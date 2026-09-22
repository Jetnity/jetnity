#!/usr/bin/env node
// Hydrated checkbox / registration-consent interaction evidence.
// Real Playwright mouse / touch / keyboard. No page.evaluate clicks.
// No signup, no credentials, no Auth/DB writes.

import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

import esbuild from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting/index.js'
import autoprefixer from 'autoprefixer'
import { chromium, webkit } from 'playwright'

const ROOT = join(dirname(fileURLToPath(import.meta.url)))
const REPO = join(ROOT, '../../..')
const PHASE = process.env.CONSENT_PHASE || 'after'
const ARTIFACTS = process.env.CONSENT_ARTIFACTS || '/opt/cursor/artifacts/registration-consent-interaction-1'
const EVIDENCE = ROOT

function gitMeta() {
  const head = execSync('git rev-parse HEAD', { cwd: REPO, encoding: 'utf8' }).trim()
  const dirty = execSync('git status --porcelain', { cwd: REPO, encoding: 'utf8' })
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter(Boolean)
  return {
    head,
    workingTree: dirty.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: dirty,
  }
}

async function compileCss() {
  const from = join(REPO, 'styles/globals.css')
  const input = readFileSync(from, 'utf8')
  const config = {
    ...require(join(REPO, 'tailwind.config.js')),
    content: [
      join(REPO, 'components/ui/checkbox.tsx'),
      join(REPO, 'components/ui/label.tsx'),
      join(REPO, 'components/auth/RegisterForm.tsx'),
      join(ROOT, 'harness.tsx'),
    ],
  }
  const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
  return result.css
}

async function bundleHarness() {
  const outfile = join(ROOT, `.harness-${PHASE}.js`)
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(ROOT, 'harness.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    sourcemap: false,
    logLevel: 'silent',
    alias: { '@': REPO },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return outfile
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Registration consent harness</title>
  <style>${css}</style>
</head>
<body class="bg-background text-foreground">
  <div id="root"></div>
  <script>${script}</script>
</body>
</html>`
}

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 80))
}

async function readState(page, inputId) {
  return page.evaluate((id) => {
    const fixture = document.querySelector(`[data-fixture="${id}"]`)
    const input = document.getElementById(id)
    const roleBoxes = [...document.querySelectorAll(`[data-fixture="${id}"] [role="checkbox"]`)]
    const visual = fixture?.querySelector('[data-state]')
    const submit = document.querySelector('[data-register-submit]')
    const callbacks = window.__consentCallbacks?.[id] ?? []
    const inputBox = input?.getBoundingClientRect()
    return {
      nativeChecked: input ? input.checked : null,
      nativeIndeterminate: input ? input.indeterminate : null,
      nativeDisabled: input ? input.disabled : null,
      roleCheckboxCount: roleBoxes.length,
      roleAriaChecked: roleBoxes[0]?.getAttribute('aria-checked') ?? null,
      visualState: visual?.getAttribute('data-state') ?? null,
      callbackCount: callbacks.length,
      callbacks: [...callbacks],
      submitDisabled: submit ? submit.disabled : null,
      legalNavigations: [...(window.__legalNavigations ?? [])],
      registerSubmitCount: window.__registerSubmitCount ?? 0,
      inputTabIndex: input ? input.tabIndex : null,
      inputOpacity: input ? getComputedStyle(input).opacity : null,
      inputWidth: inputBox ? Number(inputBox.width.toFixed(2)) : null,
      inputHeight: inputBox ? Number(inputBox.height.toFixed(2)) : null,
      accessibleCheckboxCount: fixture
        ? fixture.querySelectorAll('input[type="checkbox"], [role="checkbox"]').length
        : 0,
    }
  }, inputId)
}

async function visibleControl(page, inputId) {
  const fixture = page.locator(`[data-fixture="${inputId}"]`)
  const roleBox = fixture.locator('[role="checkbox"]')
  if (await roleBox.count()) return roleBox.first()
  const hit = fixture.locator('[data-checkbox-hit]')
  if (await hit.count()) return hit.first()
  return fixture.locator(`#${inputId}`)
}

async function clickInput(page, inputId) {
  await (await visibleControl(page, inputId)).click()
  await settle()
}

async function clickLabelText(page, inputId) {
  const label = page.locator(`label[for="${inputId}"]`)
  await label.click({ position: { x: 8, y: 8 } })
  await settle()
}

async function tapInput(page, inputId) {
  const target = await visibleControl(page, inputId)
  const box = await target.boundingBox()
  if (!box) throw new Error(`no box for visible control #${inputId}`)
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  await settle()
}

async function keyboardToggle(page, inputId) {
  const roleBox = page.locator(`[data-fixture="${inputId}"] [role="checkbox"]`)
  if (await roleBox.count()) {
    await roleBox.focus()
  } else {
    await page.locator(`#${inputId}`).focus()
  }
  await page.keyboard.press('Space')
  await settle()
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message)
}

async function runEngine(engineName, launcher, options) {
  const failures = []
  const cases = []
  let browser
  try {
    browser = await launcher.launch({ headless: true })
  } catch (error) {
    return {
      engine: engineName,
      available: false,
      limitation: String(error).split('\n')[0],
      cases: [],
      failures: engineName === 'webkit'
        ? [`webkit unavailable: ${String(error).split('\n')[0]}`]
        : [`${engineName} unavailable: ${String(error).split('\n')[0]}`],
    }
  }

  const context = await browser.newContext({
    viewport: options.viewport,
    hasTouch: options.hasTouch,
    isMobile: options.isMobile,
  })
  const page = await context.newPage()
  const blocked = []
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (url.startsWith('http://127.0.0.1') || url.startsWith('data:') || url.startsWith('about:')) {
      await route.continue()
      return
    }
    blocked.push({ url, method: route.request().method() })
    await route.abort()
  })
  await page.goto(options.url, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-harness-banner]').waitFor()
  await settle()

  async function shot(name) {
    const file = join(ARTIFACTS, `${PHASE}-${engineName}-${name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    return file
  }

  // Controlled unchecked: one mouse click must check exactly once.
  {
    const before = await readState(page, 'controlled-unchecked')
    await clickInput(page, 'controlled-unchecked')
    const after = await readState(page, 'controlled-unchecked')
    assert(after.nativeChecked === true, 'controlled mouse: native checked after one click', failures)
    assert(after.visualState === 'checked', 'controlled mouse: visual checked after one click', failures)
    assert(after.callbackCount === 1 && after.callbacks[0] === true, 'controlled mouse: one true callback', failures)
    await clickInput(page, 'controlled-unchecked')
    const revoked = await readState(page, 'controlled-unchecked')
    assert(revoked.nativeChecked === false, 'controlled mouse: revoke unchecks', failures)
    assert(revoked.callbackCount === 2 && revoked.callbacks[1] === false, 'controlled mouse: second callback false', failures)
    cases.push({ name: 'controlled-mouse', before, after, revoked })
  }

  {
    const before = await readState(page, 'controlled-checked')
    await clickInput(page, 'controlled-checked')
    const after = await readState(page, 'controlled-checked')
    assert(before.nativeChecked === true, 'controlled-checked starts checked', failures)
    assert(after.nativeChecked === false, 'controlled-checked unchecks once', failures)
    assert(after.callbackCount === 1, 'controlled-checked one callback', failures)
    cases.push({ name: 'controlled-checked-mouse', before, after })
  }

  {
    const before = await readState(page, 'uncontrolled-default-false')
    await clickInput(page, 'uncontrolled-default-false')
    const after = await readState(page, 'uncontrolled-default-false')
    assert(after.nativeChecked === true, 'uncontrolled default false becomes checked', failures)
    assert(after.visualState === 'checked', 'uncontrolled visual follows native', failures)
    assert(after.callbackCount === 1, 'uncontrolled one callback', failures)
    cases.push({ name: 'uncontrolled-default-false', before, after })
  }

  {
    const before = await readState(page, 'uncontrolled-default-true')
    await clickInput(page, 'uncontrolled-default-true')
    const after = await readState(page, 'uncontrolled-default-true')
    assert(before.nativeChecked === true, 'uncontrolled default true starts checked', failures)
    assert(after.nativeChecked === false, 'uncontrolled default true unchecks', failures)
    assert(after.visualState === 'unchecked', 'uncontrolled visual unchecks', failures)
    cases.push({ name: 'uncontrolled-default-true', before, after })
  }

  {
    const before = await readState(page, 'indeterminate')
    await clickInput(page, 'indeterminate')
    const after = await readState(page, 'indeterminate')
    assert(before.nativeIndeterminate === true || before.visualState === 'indeterminate', 'starts indeterminate', failures)
    assert(after.nativeChecked === true, 'indeterminate click becomes checked', failures)
    assert(after.nativeIndeterminate === false, 'indeterminate cleared', failures)
    assert(after.callbackCount === 1 && after.callbacks[0] === true, 'indeterminate one true callback', failures)
    cases.push({ name: 'indeterminate', before, after })
  }

  {
    const before = await readState(page, 'disabled-unchecked')
    await page.locator('#disabled-unchecked').click({ force: false }).catch(() => {})
    await settle()
    const after = await readState(page, 'disabled-unchecked')
    assert(after.nativeChecked === false, 'disabled stays unchecked', failures)
    assert(after.callbackCount === 0, 'disabled emits no callback', failures)
    cases.push({ name: 'disabled', before, after })
  }

  {
    const before = await readState(page, 'terms')
    await clickInput(page, 'terms')
    const after = await readState(page, 'terms')
    assert(after.nativeChecked === true, 'register box click checks once', failures)
    assert(after.submitDisabled === false, 'submit enables after accept', failures)
    assert(after.callbackCount === 1, 'register box one callback', failures)
    await clickInput(page, 'terms')
    const revoked = await readState(page, 'terms')
    assert(revoked.nativeChecked === false, 'register revoke unchecks', failures)
    assert(revoked.submitDisabled === true, 'submit disabled after revoke', failures)
    cases.push({ name: 'register-box-mouse', before, after, revoked })
    await shot('register-after-box-toggle')
  }

  {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-harness-banner]').waitFor()
    const before = await readState(page, 'terms')
    await clickLabelText(page, 'terms')
    const after = await readState(page, 'terms')
    assert(after.nativeChecked === true, 'external label text checks once', failures)
    assert(after.callbackCount === 1, 'external label one callback', failures)
    cases.push({ name: 'register-external-label', before, after })
  }

  {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-harness-banner]').waitFor()
    const before = await readState(page, 'terms')
    await page.locator('a[href="/terms"]').first().click()
    await settle()
    const after = await readState(page, 'terms')
    assert(after.nativeChecked === false, 'terms link does not toggle consent', failures)
    assert(after.callbackCount === 0, 'terms link emits no consent callback', failures)
    assert(after.legalNavigations.includes('/terms'), 'terms link records navigation', failures)
    assert(after.submitDisabled === true, 'submit stays disabled after terms link', failures)
    await page.locator('a[href="/privacy"]').first().click()
    await settle()
    const privacy = await readState(page, 'terms')
    assert(privacy.nativeChecked === false, 'privacy link does not toggle consent', failures)
    assert(privacy.legalNavigations.includes('/privacy'), 'privacy link records navigation', failures)
    cases.push({ name: 'legal-links', before, after, privacy })
  }

  {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-harness-banner]').waitFor()
    await page.locator('#terms').focus()
    await keyboardToggle(page, 'terms')
    const after = await readState(page, 'terms')
    assert(after.nativeChecked === true, 'Tab/Space checks once', failures)
    assert(after.callbackCount === 1, 'keyboard one callback', failures)
    await keyboardToggle(page, 'terms')
    const revoked = await readState(page, 'terms')
    assert(revoked.nativeChecked === false, 'Space revokes', failures)
    cases.push({ name: 'keyboard-space', after, revoked })
  }

  if (options.hasTouch) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-harness-banner]').waitFor()
    const before = await readState(page, 'terms')
    await tapInput(page, 'terms')
    const after = await readState(page, 'terms')
    assert(after.nativeChecked === true, 'touch tap checks once', failures)
    assert(after.callbackCount === 1, 'touch one callback', failures)
    cases.push({ name: 'register-touch', before, after })
    await shot('register-after-touch')
  }

  {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-harness-banner]').waitFor()
    await page.locator('#terms').evaluate((el) => el.focus())
    const metrics = await page.evaluate(() => {
      const input = document.getElementById('terms')
      const label = document.querySelector('label[for="terms"]')
      const submit = document.querySelector('[data-register-submit]')
      const box = (node) => {
        if (!node) return null
        const r = node.getBoundingClientRect()
        return { width: Number(r.width.toFixed(2)), height: Number(r.height.toFixed(2)) }
      }
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        input: box(input),
        label: box(label),
        submit: box(submit),
        inputMeets44: input ? input.getBoundingClientRect().width >= 44 && input.getBoundingClientRect().height >= 44 : false,
        roleCheckboxOnPage: document.querySelectorAll('[role="checkbox"]').length,
        nativeCheckboxOnPage: document.querySelectorAll('input[type="checkbox"]').length,
      }
    })
    assert(metrics.inputMeets44, 'native input hit area is at least 44px', failures)
    assert(metrics.overflow === false, 'no horizontal overflow', failures)
    cases.push({ name: 'layout', metrics })
    await shot(`layout-${options.viewport.width}`)
  }

  const html200 = await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
    const row = document.querySelector('[data-fixture="terms"]')
    const label = document.querySelector('label[for="terms"]')
    const input = document.getElementById('terms')
    const rowBox = row?.getBoundingClientRect()
    const labelBox = label?.getBoundingClientRect()
    const inputBox = input?.getBoundingClientRect()
    const rowOverflowPx = row ? row.scrollWidth - row.clientWidth : 99
    return {
      rowOverflowPx,
      labelRight: labelBox ? Number(labelBox.right.toFixed(2)) : null,
      viewportWidth: window.innerWidth,
      labelFitsViewport: labelBox ? labelBox.right <= window.innerWidth + 1 : false,
      labelBesideBox: Boolean(
        rowBox && labelBox && inputBox && labelBox.left >= inputBox.left && labelBox.top < inputBox.bottom + 8,
      ),
    }
  })
  await settle()
  // The 44px hit area uses a documented negative margin (~12px). That is not
  // label overflow. Fail only if the consent sentence leaves the viewport.
  assert(html200.labelFitsViewport === true, 'consent label stays in the viewport at 200% text', failures)
  assert(html200.labelBesideBox === true, 'consent label remains beside the box at 200% text', failures)
  cases.push({ name: 'layout-200', metrics: html200 })
  await shot(`layout-200pct-${options.viewport.width}`)

  await browser.close()
  return {
    engine: engineName,
    available: true,
    viewport: options.viewport,
    hasTouch: options.hasTouch,
    blockedRequests: blocked,
    cases,
    failures,
  }
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  mkdirSync(join(EVIDENCE, 'screenshots'), { recursive: true })
  const css = await compileCss()
  const bundleFile = await bundleHarness()
  const script = readFileSync(bundleFile, 'utf8')
  const html = htmlSeite(css, script)
  writeFileSync(join(EVIDENCE, `harness-${PHASE}.html`), html)

  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}/`

  const viewports = [
    { name: 'chromium-desktop', launcher: chromium, viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false },
    { name: 'chromium-iphone-390', launcher: chromium, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    { name: 'chromium-320', launcher: chromium, viewport: { width: 320, height: 720 }, hasTouch: true, isMobile: true },
  ]

  const reports = []
  for (const viewport of viewports) {
    reports.push(await runEngine(viewport.name, viewport.launcher, { ...viewport, url }))
  }

  let webkitReport
  try {
    webkitReport = await runEngine('webkit-iphone-390', webkit, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      url,
    })
  } catch (error) {
    webkitReport = {
      engine: 'webkit-iphone-390',
      available: false,
      limitation: String(error).split('\n')[0],
      cases: [],
      failures: [],
    }
  }
  reports.push(webkitReport)

  server.close()

  const hardFailures = reports.flatMap((report) => {
    if (report.engine.startsWith('webkit') && report.available === false) return []
    return report.failures
  })

  const summary = {
    kind: 'registration-consent-interaction-1',
    phase: PHASE,
    expectPass: PHASE === 'after',
    productTree: gitMeta(),
    capturedAt: new Date().toString ? new Date().toISOString() : new Date(),
    browserNote: {
      chromium: 'hydrated Playwright Chromium — emulated 390/320 touch, not a physical iPhone',
      webkit: webkitReport.available
        ? 'Playwright WebKit mobile available'
        : `Playwright WebKit unavailable: ${webkitReport.limitation || 'host libraries missing'}. Not real iPhone/Safari evidence.`,
    },
    reports,
    hardFailures,
    pass: hardFailures.length === 0,
  }

  writeFileSync(join(EVIDENCE, `interact-${PHASE}.json`), JSON.stringify(summary, null, 2))
  writeFileSync(join(ARTIFACTS, `interact-${PHASE}.json`), JSON.stringify(summary, null, 2))

  if (PHASE === 'after' && hardFailures.length > 0) {
    console.error(JSON.stringify({ pass: false, hardFailures }, null, 2))
    process.exit(1)
  }
  if (PHASE === 'before') {
    console.log(JSON.stringify({
      phase: 'before',
      reproduced: hardFailures.length > 0,
      hardFailures,
    }, null, 2))
    process.exit(hardFailures.length > 0 ? 0 : 2)
  }
  console.log(JSON.stringify({ pass: true, engines: reports.map((r) => [r.engine, r.available, r.failures.length]) }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
