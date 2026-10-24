import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const REPO = '/tmp/jetnity-r105-c-v3-review-be2c4932fc58'
const OUT = '/tmp/jetnity-r105-c-stay-focus-ahsghe'
const EXPECTED_HEAD = 'be2c4932fc58d0bdca78e91cc7837a666201715f'
const EXPECTED_TREE = '4c6315603edb46937eab1982e93748a4b6558614'
const execFileAsync = promisify(execFile)
const git = async (...args) => (await execFileAsync('git', args, {cwd: REPO, encoding: 'utf8'})).stdout.trim()
assert.equal(await git('rev-parse', 'HEAD'), EXPECTED_HEAD)
assert.equal(await git('rev-parse', 'HEAD^{tree}'), EXPECTED_TREE)
assert.equal(await git('status', '--short'), '', 'clean exact source checkout required')
const hash = data => createHash('sha256').update(data).digest('hex')
const sources = ['components/trips/UnterkunftBestand.tsx', 'lib/trips/naechte-abdeckung.ts',
  'lib/trips/unterkunft-manuell.ts', 'lib/trips/manual-journey-editor-completion-1.ts',
  'lib/trips/schema.ts', 'types/trips.ts']
const sourceSha256 = {}
for (const file of sources) {
  const actual = readFileSync(`${REPO}/${file}`)
  const committed = (await execFileAsync('git', ['show', `HEAD:${file}`], {cwd: REPO, encoding: 'buffer'})).stdout
  assert.deepEqual(actual, committed, `source bytes must match HEAD: ${file}`)
  sourceSha256[file] = hash(actual)
}
const require = createRequire(`${REPO}/package.json`)
const esbuild = require('esbuild')
const { chromium } = require('playwright')
const result = {
  createdAtUtc: new Date().toISOString(), head: EXPECTED_HEAD, tree: EXPECTED_TREE,
  command: `node ${OUT}/run.mjs`, output: OUT, node: process.version,
  react: require('react/package.json').version,
  sourceSha256, fixtureSha256: hash(readFileSync(`${OUT}/mount.tsx`)),
  runnerSha256: hash(readFileSync(`${OUT}/run.mjs`)),
  boundary: 'Real unchanged UnterkunftBestand, two synthetic stay rows, in-memory held callback. No graph/storage/account/provider/hosted access. Minimal CSS: focus behavior only, not layout acceptance.',
  cases: [], pageErrors: [], blockedRequests: [],
}
await esbuild.build({absWorkingDir: REPO, entryPoints: [`${OUT}/mount.tsx`],
  outfile: `${OUT}/bundle.js`, bundle: true, format: 'iife', platform: 'browser',
  jsx: 'automatic', alias: {'@': REPO}, nodePaths: [`${REPO}/node_modules`],
  define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'silent'})
const bundle = readFileSync(`${OUT}/bundle.js`)
const html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><style>body{font:16px sans-serif;padding:20px}label{display:block}input,select,textarea,button{margin:5px;min-height:30px}li{margin:12px}*:focus{outline:3px solid blue}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
const server = createServer((req, res) => {
  if (req.url === '/bundle.js') {res.setHeader('Content-Type', 'text/javascript');res.end(bundle)}
  else if (req.url === '/stay-pair') {res.setHeader('Content-Type', 'text/html');res.end(html)}
  else {res.statusCode = 404;res.end()}
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
result.port = server.address().port
const browser = await chromium.launch({headless: true, executablePath: '/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome'})
result.browser = browser.version()
const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'})
await context.route('**/*', route => {
  const u = new URL(route.request().url())
  if (u.origin !== origin || route.request().method() !== 'GET' || !['/bundle.js', '/stay-pair'].includes(u.pathname)) {
    result.blockedRequests.push(route.request().url()); return route.abort()
  }
  return route.continue()
})
const paint = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
try {
  for (const outcome of ['success', 'domain', 'reject']) {
    for (const newer of ['open', 'closed']) {
      const page = await context.newPage()
      page.on('pageerror', error => result.pageErrors.push(String(error)))
      await page.goto(`${origin}/stay-pair`)
      const rowA = page.locator('li').filter({has: page.getByText('Stay A', {exact: true})})
      const rowB = page.locator('li').filter({has: page.getByText('Stay B', {exact: true})})
      assert.equal(await rowA.count(), 1)
      assert.equal(await rowB.count(), 1)
      await rowA.getByRole('button', {name: 'Zeitraum ändern', exact: true}).click()
      await rowA.getByLabel('Check-out', {exact: true}).fill('2026-11-07')
      await rowA.getByRole('button', {name: 'Zeitraum speichern', exact: true}).click()
      await page.waitForFunction(() => window.review.requests.length === 1)
      assert.equal(await rowA.locator('form').getAttribute('aria-busy'), 'true')
      await rowB.getByRole('button', {name: 'Zeitraum ändern', exact: true}).click()
      await rowB.getByLabel('Check-out', {exact: true}).fill('2026-11-11')
      if (newer === 'closed') await rowB.getByRole('button', {name: 'Abbrechen', exact: true}).click()
      await paint(page)
      const owner = await (newer === 'open' ? rowB.getByLabel('Check-out', {exact: true}) : rowB.getByRole('button', {name: 'Zeitraum ändern', exact: true})).elementHandle()
      assert.ok(owner)
      const observe = async () => ({
        focus: await page.evaluate(el => ({isExactOwner: document.activeElement === el,
          tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim(),
          label: document.activeElement?.labels?.[0]?.textContent?.trim(),
          rowText: document.activeElement?.closest('li')?.textContent?.trim()}), owner),
        bOpen: await rowB.locator('form').count(),
        bDraft: newer === 'open' ? await rowB.getByLabel('Check-out', {exact: true}).inputValue() : null,
      })
      const before = await observe()
      assert.equal(before.focus.isExactOwner, true)
      const callsBefore = await page.evaluate(() => window.review.requests.map(r => r.payload))
      assert.deepEqual(callsBefore, [{itemId: 'stay-a', startsOn: '2026-11-02', endsOn: '2026-11-07'}])
      await page.evaluate(next => window.review.release(next), outcome)
      if (outcome === 'success') await rowA.getByText('Zeitraum gespeichert.', {exact: true}).waitFor()
      else await rowA.getByRole('alert').waitFor()
      await paint(page)
      const after = await observe()
      const aForms = await rowA.locator('form').count()
      const aTruth = {
        forms: aForms,
        busy: aForms ? await rowA.locator('form').getAttribute('aria-busy') : null,
        draft: aForms ? await rowA.getByLabel('Check-out', {exact: true}).inputValue() : null,
        alerts: await rowA.getByRole('alert').allTextContents(),
        savedStatus: await rowA.getByText('Zeitraum gespeichert.', {exact: true}).count(),
        calls: await page.evaluate(() => window.review.requests.length),
      }
      const bStatePreserved = newer === 'open' ? after.bOpen === 1 && after.bDraft === '2026-11-11' : after.bOpen === 0
      const expectedError = outcome === 'domain' ? 'Synthetischer Speicherfehler A.' : 'Der Zeitraum konnte nicht gespeichert werden. Bitte versuche es erneut.'
      const aTruthCorrect = outcome === 'success' ? aTruth.forms === 0 && aTruth.savedStatus === 1 :
        aTruth.forms === 1 && aTruth.busy === 'false' && aTruth.draft === '2026-11-07' && aTruth.alerts.includes(expectedError) && aTruth.savedStatus === 0
      result.cases.push({name: `pending-stay-A-${outcome}-newer-B-${newer}`, outcome, newer, before, after, aTruth,
        bStatePreserved, aTruthCorrect, focusPreserved: after.focus.isExactOwner,
        passed: after.focus.isExactOwner && bStatePreserved && aTruthCorrect && aTruth.calls === 1})
      await page.screenshot({path: `${OUT}/${outcome}-B-${newer}.png`, fullPage: true})
      await page.close()
    }
  }
  result.status = result.cases.length === 6 && result.cases.every(c => c.passed) && result.pageErrors.length === 0 && result.blockedRequests.length === 0 ? 'PASS' : 'REPRODUCED_FAILURE'
  if (result.status !== 'PASS') process.exitCode = 1
} catch (error) {
  result.status = 'HARNESS_ERROR'
  result.error = String(error.stack ?? error)
  process.exitCode = 2
} finally {
  await browser.close()
  await new Promise(resolve => server.close(resolve))
  result.finalHead = await git('rev-parse', 'HEAD')
  result.finalTree = await git('rev-parse', 'HEAD^{tree}')
  result.productGitStatus = await git('status', '--short')
  result.finalSourceSha256 = Object.fromEntries(sources.map(file => [file, hash(readFileSync(`${REPO}/${file}`))]))
  result.cleanExactSource = result.finalHead === EXPECTED_HEAD && result.finalTree === EXPECTED_TREE && result.productGitStatus === '' && JSON.stringify(result.finalSourceSha256) === JSON.stringify(sourceSha256)
  if (!result.cleanExactSource) process.exitCode = 2
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'})
  const artifacts = ['mount.tsx', 'run.mjs', 'result.json', ...result.cases.map(c => `${c.outcome}-B-${c.newer}.png`)]
  writeFileSync(`${OUT}/manifest.json`, `${JSON.stringify({head: EXPECTED_HEAD, tree: EXPECTED_TREE, sha256: Object.fromEntries(artifacts.map(p => [p, hash(readFileSync(`${OUT}/${p}`))]))}, null, 2)}\n`, {flag: 'wx'})
  console.log(JSON.stringify({status: result.status, cases: result.cases.map(c => ({name: c.name, focusPreserved: c.focusPreserved, bStatePreserved: c.bStatePreserved, aTruthCorrect: c.aTruthCorrect, passed: c.passed, afterTag: c.after.focus.tag})), pageErrors: result.pageErrors, blockedRequests: result.blockedRequests, cleanExactSource: result.cleanExactSource, output: OUT, resultSha256: hash(readFileSync(`${OUT}/result.json`)), manifestSha256: hash(readFileSync(`${OUT}/manifest.json`))}, null, 2))
}
