#!/usr/bin/env node
// Actual headless Chromium, real Next /einreise user controls and real Supabase
// DEV read-only RPC; no Owner login, Production, synthetic result, external
// checkout, geolocation or data modification. Only PR #1254 exact branch.
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createRequire} from 'node:module'
import {mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {chromium} from 'playwright'
import {selectU1SystemBrowser} from '../official-truth-product-v3-ui/browser.mjs'

const branch='feat/official-truth-universal-source-registry-dev-20261119'
const devUrl='https://yfvbxvijcorffwxbxahl.supabase.co'
assert.equal(process.env.GITHUB_EVENT_NAME,'pull_request')
assert.equal(process.env.GITHUB_HEAD_REF,branch)
assert.equal(process.env.GITHUB_REPOSITORY,'Jetnity/jetnity')
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,devUrl)
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
assert.equal(process.env.VERCEL_ENV,'preview')
assert.equal(process.env.VERCEL_PROJECT_ID,'prj_wTTVawPItEO7a4HihEmaU3PsuaXM')
assert.equal(process.env.VERCEL_GIT_REPO_OWNER,'Jetnity')
assert.equal(process.env.VERCEL_GIT_REPO_SLUG,'jetnity')
assert.equal(process.env.VERCEL_GIT_COMMIT_REF,branch)
const require=createRequire(import.meta.url)
const port=31791
const origin='http://127.0.0.1:'+port
const out=join(process.cwd(),'test-results/official-truth-at-50-dev-browser')
await mkdir(out,{recursive:true})
const report={scope:'Actual Chromium UI and real Dev Supabase source-bound API; no personal or production grant',
 head:process.env.GITHUB_SHA,dev:'yfvbxvijcorffwxbxahl',passports:3,
 screenshotPaths:[],status:'not_started'}
let browser
const next=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port',String(port)],{
 cwd:process.cwd(),env:process.env,stdio:'ignore'})
try {
 let ready=false
 for(let t=0;t<120;t++) {
  if(next.exitCode!==null)throw Error('Next Dev process stopped before readiness')
  try {const r=await fetch(origin+'/einreise',{signal:AbortSignal.timeout(4000)})
   if(r.status===200){ready=true;break}
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,1000))
 }
 if(!ready)throw Error('Next Dev /einreise did not become ready')
 browser=await chromium.launch({headless:true,executablePath:selectU1SystemBrowser()})
 const context=await browser.newContext({locale:'de-DE',viewport:{width:390,height:844},reducedMotion:'reduce'})
 const page=await context.newPage()
 const errors=[]
 page.on('pageerror',err=>errors.push(err.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(url.origin===origin||url.origin===devUrl)await route.continue()
  else await route.abort()
 })
 await page.goto(origin+'/einreise',{waitUntil:'domcontentloaded'})
 await page.getByRole('combobox',{name:'Zielland'}).selectOption('AT')
 await page.getByRole('combobox',{name:'Pass 1'}).selectOption('DE')
 await page.getByRole('button',{name:'Weiteren Pass hinzufügen'}).click()
 await page.getByRole('combobox',{name:'Pass 2'}).selectOption('IN')
 await page.getByRole('button',{name:'Weiteren Pass hinzufügen'}).click()
 await page.getByRole('combobox',{name:'Pass 3'}).selectOption('UA')
 const answered=page.waitForResponse(r=>r.url()===origin+'/api/readiness/at-visa',{timeout:35000})
 await page.getByRole('button',{name:'Einreise anzeigen'}).click()
 const response=await answered
 assert.equal(response.status(),200,'actual Dev visitor endpoint must respond normally')
 const payload=await response.json()
 assert.equal(payload.input?.destinationCountryCode,'AT')
 assert.deepEqual(payload.input?.citizenshipCountryCodes,['DE','IN','UA'])
 assert.equal(payload.cells?.length,3)
 for(const cell of payload.cells)assert.ok(cell.results?.every(x=>x.status==='unavailable'),'49 not yet Owner-authorized')
 const heading=page.getByRole('heading',{name:/^Einreise nach .*Österreich$/})
 try { await heading.waitFor({timeout:12000}) }
 catch {
  // Never turn an HTTP-200 into a UI PASS: bound what the real browser actually
  // displayed, without recording credentials, headers, session or RPC payload.
  report.browserDiagnostic={
   alerts:(await page.getByRole('alert').allInnerTexts()).slice(0,2).map(x=>x.slice(0,180)),
   statuses:(await page.getByRole('status').allInnerTexts()).slice(0,2).map(x=>x.slice(0,180)),
   buttons:(await page.getByRole('button',{name:/Einreise anzeigen|Angaben werden geladen/}).allInnerTexts()).slice(0,2),
   resultPanels:await page.locator('[data-einreise-kundenanzeige]').count(),
   pageErrors:errors.slice(0,2).map(x=>x.slice(0,180)),
   responseContentType:response.headers()['content-type']?.slice(0,60)??null,
   cells:payload.cells.map(x=>({country:x.country,statuses:x.results?.map(y=>y.status)})),
  }
  const name='at-grouped-failure.png'
  await page.screenshot({path:join(out,name),fullPage:true,animations:'disabled'})
  report.screenshotPaths.push(name)
  throw Error('AT result heading absent after real Dev HTTP 200; bounded evidence in CI browser artifact')
 }
 const groups=page.locator('[data-at-bmi-source-groups="conditional-only"]')
 await groups.waitFor()
 assert.equal(await groups.locator('[data-at-bmi-passport]').count(),3)
 for(const [code,group] of [['DE','F'],['IN','V'],['UA','E']]){
  const card=groups.locator('[data-at-bmi-passport="'+code+'"]')
  assert.equal(await card.getAttribute('data-at-bmi-source-group'),group)
  assert.equal(await card.getAttribute('data-at-personal-visa-accepted'),'false')
  assert.equal(await card.isVisible(),true)
 }
 assert.match(await groups.locator('[data-at-bmi-passport="UA"]').innerText(),/biometrischen Reisepass/)
 const content=await page.locator('body').innerText()
 assert.match(content,/Österreichisches Sozialministerium/)
 assert.match(content,/ETIAS ist noch nicht in Betrieb/)
 assert.match(content,/derzeit nicht verfügbar/)
 const sizes=[[390,844],[1280,900]]
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height})
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
  assert.ok(horizontal<=1,'Horizontal overflow in actual Dev UI')
  const name='at-grouped-'+width+'.png'
  await page.screenshot({path:join(out,name),fullPage:true,animations:'disabled'})
  report.screenshotPaths.push(name)
 }
 assert.deepEqual(errors,[],'Browser JS runtime errors')
 report.status='pass';report.groups=['F','V','E'];report.newPositiveVisaFacts=0
} catch(error){
 report.status='fail';report.reason=String(error?.message??error).slice(0,250)
 process.exitCode=1
} finally {
 if(browser)await browser.close()
 next.kill('SIGTERM')
 await writeFile(join(out,'result.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600})
 console.log('AT_GROUPED_DEV_BROWSER '+JSON.stringify({status:report.status,groups:report.groups,passports:report.passports,reason:report.reason}))
}
if(process.exitCode)process.exit(process.exitCode)
