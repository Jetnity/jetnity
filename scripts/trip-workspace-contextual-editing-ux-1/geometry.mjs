// Actual production Guest route; only synthetic fixture seeding, no mocked UI.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const base='http://127.0.0.1:3517',phase=process.argv[2]||'baseline'
assert(['baseline','after'].includes(phase))
const dir=`docs/evidence/trip-workspace-contextual-editing-ux-1/${phase}`
mkdirSync(dir,{recursive:true})
const bundle=await build({stdin:{contents:`import {fixture} from './scripts/direct-trip-editing-1/fixture';import {gastreiseSpeichern} from './lib/trips/gastspeicher';window.seed=()=>gastreiseSpeichern(fixture());`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false})
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[],errors=[],external=[]
try {
 for(const width of [360,390,768,1024,1440])for(const scale of [1,2]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){external.push(route.request().url());return route.abort()}return route.continue()})
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>window.seed());await page.goto(`${base}/reisen/trip-direct-fixture`)
  await page.getByRole('button',{name:'Reise ändern',exact:true}).waitFor()
  await page.evaluate(scale=>document.documentElement.style.fontSize=`${16*scale}px`,scale)
  await page.screenshot({path:`${dir}/${width}-${scale}-closed.png`})
  await page.getByRole('button',{name:'Reise ändern',exact:true}).click()
  await page.getByLabel('Reisetitel',{exact:true}).waitFor()
  await page.screenshot({path:`${dir}/${width}-${scale}-open.png`})
  const measure=()=>page.evaluate(()=>{
   const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width}}
   const form=document.querySelector('form[aria-label="Reise direkt bearbeiten"]'),nav=document.querySelector('[data-workspace-mode-nav]'),active=document.activeElement
   return {scrollY,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,form:box(form),nav:box(nav),focus:box(active),focusTag:active?.tagName,dialog:box(document.querySelector('dialog[open]')),overview:box(document.querySelector('[data-arbeitsbereich="uebersicht"]')),overflow:document.documentElement.scrollWidth>innerWidth+1}
  })
  const open=await measure()
  await page.getByLabel('Reisetitel',{exact:true}).fill('Geprüfter Entwurf')
  await page.getByRole('button',{name:'Auswirkungen ansehen',exact:true}).click()
  await page.getByRole('heading',{name:'Auswirkungen prüfen',exact:true}).waitFor()
  await page.waitForTimeout(100)
  const preview=await measure()
  await page.screenshot({path:`${dir}/${width}-${scale}-preview.png`})
  results.push({width,scale,open,preview})
  if(phase==='after'){assert(!open.overflow&&!preview.overflow);assert(open.dialog);assert.equal(open.scrollY,preview.scrollY)}
  await context.close()
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[])
}finally{await browser.close();writeFileSync(`${dir}/geometry.json`,JSON.stringify({phase,browser:browser.version(),results,errors,external,boundary:'Chromium emulation; no physical device or screen reader; safe-area rules inspected separately'},null,2)+'\n')}
