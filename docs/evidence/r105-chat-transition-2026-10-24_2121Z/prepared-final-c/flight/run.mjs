import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = process.argv[2]
const EXPECTED_HEAD = process.argv[3]
const EXPECTED_TREE = process.argv[4]
assert.match(REPO ?? '', /^\/tmp\/jetnity-[A-Za-z0-9._-]+$/)
assert.match(EXPECTED_HEAD ?? '', /^[0-9a-f]{40}$/)
assert.match(EXPECTED_TREE ?? '', /^[0-9a-f]{40}$/)
const INPUT = dirname(fileURLToPath(import.meta.url))
const execFileAsync = promisify(execFile)
const git = async (...args) => (await execFileAsync('git', args, {cwd:REPO,encoding:'utf8'})).stdout.trim()
const ACTUAL_HEAD = await git('rev-parse','HEAD')
assert.equal(ACTUAL_HEAD,EXPECTED_HEAD,'Exact review HEAD must match before any run')
assert.equal(await git('rev-parse','HEAD^{tree}'),EXPECTED_TREE,'Exact review tree must match before any run')
assert.equal(await git('status','--short'),'','Clean checkout required before test')
const OUT = mkdtempSync('/tmp/jetnity-r105-c-flight-final-proof-')
for(const name of ['run.mjs','mount.tsx']) writeFileSync(`${OUT}/${name}`,readFileSync(`${INPUT}/${name}`),{flag:'wx'})
console.log(JSON.stringify({starting:true,head:ACTUAL_HEAD,output:OUT}))
const require = createRequire(`${REPO}/package.json`)
const esbuild = require('esbuild')
const { chromium } = require('playwright')
const sourcePaths = [
  'components/trips/FlugBestand.tsx',
  'components/trips/UnterkunftBestand.tsx',
  'components/trips/MobilitaetBereich.tsx',
  'lib/trips/manual-journey-editor-completion-1.ts',
  'lib/route/schema.ts',
  'lib/trips/flug-abdeckung.ts',
  'lib/trips/schema.ts',
  'types/trips.ts',
]
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
for (const path of sourcePaths) {
  const committed = (await execFileAsync('git',['show',`HEAD:${path}`],{cwd:REPO,encoding:'buffer'})).stdout
  assert.deepEqual(readFileSync(`${REPO}/${path}`),committed,`Source bytes match HEAD: ${path}`)
}
const result = {
  head: ACTUAL_HEAD,
  tree: EXPECTED_TREE,
  command: `node ${INPUT}/run.mjs ${REPO} ${EXPECTED_HEAD} ${EXPECTED_TREE}`,
  expectedHead: EXPECTED_HEAD, expectedTree: EXPECTED_TREE, sourceVerifiedAgainstGit: true,
  output: OUT,
  createdAtUtc: new Date().toISOString(),
  node: process.version,
  sourceSha256: Object.fromEntries(sourcePaths.map(p => [p, sha(`${REPO}/${p}`)])),
  fixtureSha256: sha(`${OUT}/mount.tsx`),
  runnerSha256: sha(`${OUT}/run.mjs`),
  boundary: 'Independent local React mount of unchanged exact-head components. In-memory callback and delayed graph readback. No account, storage, provider or hosted access.',
  cases: [], pageErrors: [], blockedRequests: [],
}
await esbuild.build({absWorkingDir: REPO, entryPoints: [`${OUT}/mount.tsx`],
  outfile: `${OUT}/bundle.js`, bundle: true, format: 'iife', platform: 'browser',
  jsx: 'automatic', alias: {'@': REPO},
  nodePaths: [`${REPO}/node_modules`],
  define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'silent'})
const script = readFileSync(`${OUT}/bundle.js`)
const html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><style>body{font:16px sans-serif;padding:20px}label{display:block}input,select,textarea,button{margin:5px;min-height:30px}fieldset{margin:12px}*:focus{outline:3px solid blue}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
const server = createServer((req, res) => {
  if (req.url === '/bundle.js') {res.setHeader('Content-Type', 'text/javascript');res.end(script)}
  else if (['/flight','/flight-pair','/stay','/connection'].includes(req.url)) {res.setHeader('Content-Type', 'text/html');res.end(html)}
  else {res.statusCode = 404;res.end()}
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
result.port = server.address().port
const browser = await chromium.launch({headless: true, executablePath: '/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome'})
result.browser = browser.version()
result.react = require('react/package.json').version
const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'})
await context.route('**/*', route => {
  const u = new URL(route.request().url())
  if (u.origin !== origin || route.request().method() !== 'GET' || !['/bundle.js','/flight','/flight-pair','/stay','/connection'].includes(u.pathname)) {
    result.blockedRequests.push(route.request().url()); return route.abort()
  }
  return route.continue()
})
async function paint(page) {await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))}
async function focus(page) {return page.evaluate(() => ({tag: document.activeElement?.tagName, label: document.activeElement?.labels?.[0]?.textContent?.trim(), text: document.activeElement?.textContent?.trim()}))}
try {
  const flight = await context.newPage()
  flight.on('pageerror', e => result.pageErrors.push(String(e)))
  await flight.goto(`${origin}/flight`)
  const scope = flight.getByRole('region', {name: 'Deine Flüge'})
  await scope.getByRole('button', {name: 'Flugroute ändern'}).click()
  await scope.getByLabel('Abflugzeit (optional)').fill('11:30')
  await scope.getByRole('button', {name: 'Speichern', exact: true}).click()
  await flight.waitForFunction(() => window.review.requests.length === 1)
  await flight.evaluate(() => window.review.release(0))
  await scope.getByText('Flugroute gespeichert.', {exact: true}).waitFor()
  assert.equal(await scope.locator('form').count(), 0)
  await scope.getByRole('button', {name: 'Flugroute ändern'}).click()
  await scope.getByLabel('Abflugzeit (optional)').fill('12:00')
  const before = await focus(flight)
  assert.equal(before.label, 'Abflugzeit (optional)')
  await flight.evaluate(() => window.review.readback(0))
  await paint(flight)
  const after = await focus(flight)
  const draft = await scope.getByLabel('Abflugzeit (optional)').inputValue()
  const selectedStatus = await scope.getByText('Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.', {exact: true}).count()
  result.cases.push({name:'flight-late-readback-focuses-after-new-editor-open', before, after, draft,
    selectedStatus, formCount: await scope.locator('form').count(),
    passed: after.tag === 'INPUT' && after.label === 'Abflugzeit (optional)' && draft === '12:00' && selectedStatus === 0})
  await flight.screenshot({path: `${OUT}/flight-readback-new-draft.png`, fullPage: true})

  const pair = await context.newPage()
  pair.on('pageerror', e => result.pageErrors.push(String(e)))
  await pair.goto(`${origin}/flight-pair`)
  const rowA = pair.locator('[data-flug-punkt="flight-a"]')
  const rowB = pair.locator('[data-flug-punkt="flight-b"]')
  assert.equal(await rowA.count(), 1)
  assert.equal(await rowB.count(), 1)
  await rowA.getByRole('button', {name:'Flugroute ändern'}).click()
  await rowA.getByLabel('Abflugzeit (optional)').fill('11:30')
  await rowA.getByRole('button', {name:'Speichern', exact:true}).click()
  await pair.waitForFunction(() => window.review.requests.length === 1)
  await pair.evaluate(() => window.review.release(0))
  await rowA.getByText('Flugroute gespeichert.', {exact:true}).waitFor()
  await rowB.getByRole('button', {name:'Flugroute ändern'}).click()
  await rowB.getByLabel('Abflugzeit (optional)').fill('12:00')
  const pairBefore = await pair.evaluate(() => ({tag:document.activeElement?.tagName,label:document.activeElement?.labels?.[0]?.textContent?.trim(),row:document.activeElement?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt')}))
  await pair.evaluate(() => window.review.readback(0))
  await paint(pair)
  const pairAfter = await pair.evaluate(() => ({tag:document.activeElement?.tagName,label:document.activeElement?.labels?.[0]?.textContent?.trim(),row:document.activeElement?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt'),text:document.activeElement?.textContent?.trim()}))
  const pairDraft = await rowB.getByLabel('Abflugzeit (optional)').inputValue()
  const pairStatus=await pair.getByText('Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.',{exact:true}).count()
  const pairForms=await rowB.locator('form').count()
  result.cases.push({name:'flight-A-late-readback-after-B-draft-open',before:pairBefore,after:pairAfter,draftB:pairDraft,formCountB:pairForms,selectedStatus:pairStatus,passed:pairAfter.row==='flight-b'&&pairAfter.tag==='INPUT'&&pairDraft==='12:00'&&pairForms===1&&pairStatus===0})
  await pair.screenshot({path:`${OUT}/flight-A-readback-after-B-draft.png`,fullPage:true})

  const current = await context.newPage()
  current.on('pageerror', e => result.pageErrors.push(String(e)))
  await current.goto(`${origin}/flight`)
  const currentRow = current.locator('[data-flug-punkt="flight-a"]')
  await currentRow.getByRole('button',{name:'Flugroute ändern'}).click()
  await currentRow.getByLabel('Abflugzeit (optional)').fill('11:30')
  await currentRow.getByRole('button',{name:'Speichern',exact:true}).click()
  await current.waitForFunction(()=>window.review.requests.length===1)
  await current.evaluate(()=>window.review.release(0))
  await currentRow.getByText('Flugroute gespeichert.',{exact:true}).waitFor()
  await current.evaluate(()=>window.review.readback(0))
  await paint(current)
  const currentAfter = await current.evaluate(()=>({tag:document.activeElement?.tagName,row:document.activeElement?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt'),text:document.activeElement?.textContent?.trim()}))
  const currentStatus = await current.getByText('Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.',{exact:true}).count()
  const shownGraph = await currentRow.textContent()
  const currentForms=await currentRow.locator('form').count()
  result.cases.push({name:'current-flight-normal-matching-readback',after:currentAfter,selectedStatus:currentStatus,forms:currentForms,shownSavedTime:shownGraph.includes('11:30'),passed:currentAfter.tag==='BUTTON'&&currentAfter.row==='flight-a'&&currentStatus===1&&shownGraph.includes('11:30')&&currentForms===0})
  await current.screenshot({path:`${OUT}/flight-current-normal-readback.png`,fullPage:true})
  for (const outcome of ['success','domain','reject']) {
    for (const newer of ['open','closed']) {
      const late = await context.newPage()
      late.on('pageerror', e => result.pageErrors.push(String(e)))
      await late.goto(`${origin}/flight-pair`)
      const lateA = late.locator('[data-flug-punkt="flight-a"]')
      const lateB = late.locator('[data-flug-punkt="flight-b"]')
      await lateA.getByRole('button',{name:'Flugroute ändern'}).click()
      await lateA.getByLabel('Abflugzeit (optional)').fill('11:30')
      await lateA.getByRole('button',{name:'Speichern',exact:true}).click()
      await late.waitForFunction(()=>window.review.requests.length===1)
      await lateB.getByRole('button',{name:'Flugroute ändern'}).click()
      await lateB.getByLabel('Abflugzeit (optional)').fill('12:00')
      if(newer==='closed') await lateB.getByRole('button',{name:'Abbrechen',exact:true}).click()
      const owner = await (newer==='open' ? lateB.getByLabel('Abflugzeit (optional)') : lateB.getByRole('button',{name:'Flugroute ändern'})).elementHandle()
      const observation = async () => ({
        focus:await late.evaluate(el=>({isExactOwner:document.activeElement===el,tag:document.activeElement?.tagName,row:document.activeElement?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt'),label:document.activeElement?.labels?.[0]?.textContent?.trim(),text:document.activeElement?.textContent?.trim()}),owner),
        bOpen:await lateB.locator('form').count(),
        bDraft:newer==='open' ? await lateB.getByLabel('Abflugzeit (optional)').inputValue() : null,
        selectedStatus:await late.getByText('Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.',{exact:true}).count(),
      })
      const before=await observation()
      assert.equal(before.focus.isExactOwner,true)
      await late.evaluate(outcome=>window.review.release(0,outcome),outcome)
      if(outcome==='success') await lateA.getByText('Flugroute gespeichert.',{exact:true}).waitFor()
      else await lateA.getByRole('alert').waitFor()
      await paint(late)
      const afterCallback=await observation()
      const aFormCount=await lateA.locator('form').count()
      const callbackTruth={
        aFormCount,
        aBusy:aFormCount ? await lateA.locator('form').getAttribute('aria-busy') : null,
        aDraft:aFormCount ? await lateA.getByLabel('Abflugzeit (optional)').inputValue() : null,
        aDisabled:await lateA.locator('input:disabled,select:disabled,textarea:disabled').count(),
        aAlerts:await lateA.getByRole('alert').allTextContents(),
        aSavedStatus:await lateA.getByText('Flugroute gespeichert.',{exact:true}).count(),
        calls:await late.evaluate(()=>window.review.requests.length),
      }
      let afterGraph=null
      if(outcome==='success') {
        await late.evaluate(()=>window.review.readback(0))
        await paint(late)
        afterGraph={...await observation(),aGraphShowsSavedTime:(await lateA.textContent()).includes('11:30')}
      }
      const expectedError=outcome==='domain' ? 'Synthetischer Fehler.' : 'Die Flugroute konnte nicht gespeichert werden. Bitte versuche es erneut.'
      const truthCorrect=outcome==='success' ? callbackTruth.aFormCount===0 && callbackTruth.aSavedStatus===1 && afterGraph.aGraphShowsSavedTime : callbackTruth.aFormCount===1 && callbackTruth.aBusy==='false' && callbackTruth.aDraft==='11:30' && callbackTruth.aDisabled===0 && callbackTruth.aAlerts.includes(expectedError) && callbackTruth.aSavedStatus===0
      const owns=o=>o.focus.isExactOwner && o.focus.row==='flight-b' && o.selectedStatus===0 && (newer==='open' ? o.bOpen===1 && o.bDraft==='12:00' : o.bOpen===0)
      const passed=owns(afterCallback) && (!afterGraph || owns(afterGraph)) && truthCorrect && callbackTruth.calls===1
      result.cases.push({name:`pending-A-${outcome}-newer-B-${newer}`,outcome,newer,before,afterCallback,callbackTruth,afterGraph,truthCorrect,passed})
      await late.screenshot({path:`${OUT}/pending-A-${outcome}-B-${newer}.png`,fullPage:true})
      await late.close()
    }
  }
  result.status=result.cases.length===9 && result.cases.every(c=>c.passed===true) && result.pageErrors.length===0 && result.blockedRequests.length===0 ? 'THREE_CONTROLS_AND_SIX_OWNERSHIP_CASES_PASS' : 'SEE_CASES'
  if(result.status!=='THREE_CONTROLS_AND_SIX_OWNERSHIP_CASES_PASS') process.exitCode=1
} catch (error) {
  result.status = 'REPRO_HARNESS_FAILURE'
  result.failure = String(error.stack ?? error)
  process.exitCode = 1
} finally {
  await browser.close()
  await new Promise(resolve => server.close(resolve))
  result.productGitStatus = await git('status','--short')
  result.finalHead = await git('rev-parse','HEAD')
  result.finalTree = await git('rev-parse','HEAD^{tree}')
  result.finalSourceSha256 = Object.fromEntries(sourcePaths.map(p => [p, sha(`${REPO}/${p}`)]))
  result.cleanExactSource = result.productGitStatus==='' && result.finalHead===EXPECTED_HEAD && result.finalTree===EXPECTED_TREE && JSON.stringify(result.finalSourceSha256)===JSON.stringify(result.sourceSha256)
  if(!result.cleanExactSource) { result.status='SOURCE_CHANGED';process.exitCode=2 }
  writeFileSync(`${OUT}/result.json`, JSON.stringify(result, null, 2)+'\n',{flag:'wx'})
  const artifactNames = ['run.mjs','mount.tsx','result.json',...readdirSync(OUT).filter(name=>name.endsWith('.png'))].sort()
  writeFileSync(`${OUT}/manifest.json`,JSON.stringify({head:EXPECTED_HEAD,tree:EXPECTED_TREE,sha256:Object.fromEntries(artifactNames.map(name=>[name,sha(`${OUT}/${name}`)]))},null,2)+'\n',{flag:'wx'})
  console.log(JSON.stringify({status:result.status,cases:result.cases.map(c=>({name:c.name,passed:c.passed})),pageErrors:result.pageErrors,blockedRequests:result.blockedRequests,cleanExactSource:result.cleanExactSource,output:OUT,resultSha256:sha(`${OUT}/result.json`),manifestSha256:sha(`${OUT}/manifest.json`)}, null, 2))
}
