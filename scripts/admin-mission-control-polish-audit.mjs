#!/usr/bin/env node
// Actual /admin page components + interactive shell, isolated synthetic sources.
// Does not start Next, bypass auth, connect to a database or call a provider.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import esbuild from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting/index.js'
import autoprefixer from 'autoprefixer'
import { chromium } from 'playwright'

const repo = process.cwd()
const temp = join(repo, 'node_modules/.cache/admin-polish-audit')
const out = resolve(process.env.ADMIN_POLISH_EVIDENCE || '/tmp/admin-polish-evidence')
const require = createRequire(import.meta.url)
mkdirSync(temp, { recursive: true })
mkdirSync(out, { recursive: true })
function file(name, content) { const path = join(temp, name); writeFileSync(path, content); return path }
const fixtures = file('fixtures.ts', `
export const kind = process.env.ADMIN_POLISH_CASE || 'fresh';
const date = '2026-10-03T00:00:00.000Z';
const stale = kind === 'stale';
const denied = kind === 'denied';
const failed = kind === 'failed';
const unknown = kind === 'unknown';
const coverage = { evidenced: ['app-prozess', 'supabase-app-datenzugriff'], notConfigured: ['vercel', 'github', 'infomaniak', 'supabase-management'], unknown: ['app-deployment'], failed: [], notAttributed: [] };
const freshness = { state: stale ? 'stale' : unknown || denied ? 'unknown' : 'fresh', ageMs: unknown || denied ? null : stale ? 90000 : 12000, ttlMs: 60000 };
const observed = denied ? 'access_denied' : failed ? 'source_failed' : unknown ? 'unknown' : stale ? 'degraded' : 'healthy';
export const analyst = {
 generatedAt: date, sourceCheckedAt: denied || unknown ? null : date, source: 'system-health', observationScope: 'process-recent',
 access: denied ? { status: 'denied', denial: 'forbidden' } : { status: 'allowed', grant: 'role' }, coverage, writeActions: [], modelExplanation: { enabled: false },
 insights: [{ id: 'fixture-system-health', kind: 'deterministic-source', category: 'system-health', sourceItemId: 'supabase', sourceCheckId: 'supabase-app-datenzugriff', sourceRef: 'system-health', observed, freshness, checkedAt: denied || unknown ? null : date,
 materiality: denied || failed || stale || unknown ? 'attention' : 'none', attribution: denied ? 'none' : 'process-recent',
 title: denied ? 'System Health nicht gelesen' : failed ? 'System-Health-Sammlung fehlgeschlagen' : stale ? 'Datenzugriff veraltet' : unknown ? 'Datenzugriff unbekannt' : 'Keine priorisierte Untersuchung',
 explanation: 'Die Beobachtung stammt aus dem letzten Prozessstand. Das belegt nicht die aktuelle Sitzung.',
 proves: 'Ein Prozess hat public.airports in einem Sammellauf beantwortet.', doesNotProve: 'Nicht, dass alle Systeme gesund sind oder diese Sitzung den Read ausgeführt hat.', limitations: [],
 next: denied ? null : { href: '/admin/system-health', label: 'System Health öffnen', kind: 'investigate' } }]
};
export const model = { ...analyst, source: 'model-usage', coverage: { ...coverage, evidenced: [] }, insights: [{ ...analyst.insights[0], id: 'fixture-model-usage', category: 'model-usage', sourceItemId: 'model-usage', sourceRef: 'model-usage',
 observed: denied ? 'access_denied' : failed ? 'source_failed' : unknown ? 'unknown' : 'empty', materiality: denied || failed || stale || unknown ? 'attention' : 'none',
 title: denied ? 'Modellnutzung nicht gelesen' : failed ? 'Modellnutzungsquelle fehlgeschlagen' : unknown ? 'Modellnutzung unbekannt' : 'Keine aufgezeichneten Einträge',
 explanation: 'Im begrenzten Read wurden keine Modellnutzungszeilen gefunden. Das ist kein Beleg für null Ausgaben.', proves: 'Nur der begrenzte Read von model_usage.', doesNotProve: 'Kein vollständiges Ausgabenbild und kein Beleg für null Ausgaben.',
 next: denied ? null : { href: '/admin/provider-ops', label: 'Provider & Kosten öffnen', kind: 'investigate' } }] };
export async function createServerComponentClient() { return { rpc: async (name) => {
 if (failed) return { data: null, error: { message: 'fixture failure', code: 'XX000' }, status: 500 };
 if (denied || unknown) return { data: [], error: null };
 if (name === 'admin_reisen_kennzahlen') return { data: [{ reisen_30d: kind === 'zero' ? 0 : 3, konten_mit_reise_30d: kind === 'zero' ? 0 : 2 }], error: null };
 if (name === 'admin_security_overview') return { data: Array.from({length:22},(_,i) => ({ table_name: 'fixture_'+i, rls_enabled: kind !== 'rls-gap' || i !== 0, policy_count: i < 19 ? 3 : 2 })), error: null };
 if (name === 'admin_reisen_zeitreihe') return { data: Array.from({length:14},(_,i) => ({tag:'2026-09-'+String(17+i).padStart(2,'0'),anzahl:kind === 'zero' ? 0 : i === 3 ? 2 : i === 11 ? 1 : 0})), error:null };
 throw new Error('Unexpected RPC '+name);
 } } }
`)
const analystStub = file('analyst.ts', `export * from '${repo}/lib/admin/analyst/typen'; import {analyst} from './fixtures'; export async function ladeAnalystBericht(){return analyst}`)
const modelStub = file('model.ts', `import {model} from './fixtures'; export async function ladeModelUsageBericht(){return model}`)
const activation = file('activation.ts', 'export function isAdminAccountCountsRuntimeEnabled(){return false}')
const empty = file('empty.ts', '')
const serverEntry = file('server.tsx', `
import { cloneElement, isValidElement } from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Page from '${repo}/app/(admin)/admin/page';
async function materialize(node) {
 if(Array.isArray(node)) return Promise.all(node.map(async (child,index) => { const result=await materialize(child); return isValidElement(result) && result.key == null ? cloneElement(result,{key:index}) : result; }));
 if(!isValidElement(node)) return node;
 if(typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') return materialize(await node.type(node.props));
 return cloneElement(node, {}, await materialize(node.props.children));
}
export async function render(){return renderToStaticMarkup(await materialize(await Page()))}
`)
await esbuild.build({ entryPoints: [serverEntry], outfile: join(temp, 'server.cjs'), bundle: true, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', alias: {
 '@': repo, '@/lib/supabase/server': fixtures, '@/lib/admin/analyst/model-usage-laden': modelStub, '@/lib/admin/account-counts-delivery/activation': activation, 'server-only': empty,
}, plugins: [{name:'exact-analyst',setup(build){build.onResolve({filter:/^@\/lib\/admin\/analyst$/},()=>({path:analystStub}))}}], logLevel: 'silent' })
const markups = {}
for(const name of ['fresh','zero','stale','unknown','denied','failed','rls-gap']) {
 process.env.ADMIN_POLISH_CASE = name
 delete require.cache[require.resolve(join(temp, 'server.cjs'))]
 markups[name] = await require(join(temp, 'server.cjs')).render()
}
delete process.env.ADMIN_POLISH_CASE
const shellEntry = file('shell.tsx', `
import {createRoot} from 'react-dom/client';
import AdminLayout from '${repo}/app/(admin)/admin/layout';
import AdminSessionProvider from '${repo}/components/admin/AdminSessionProvider';
const markup = document.getElementById('page-content').innerHTML;
createRoot(document.getElementById('root')).render(<AdminSessionProvider role="operator" grant="role"><AdminLayout><div dangerouslySetInnerHTML={{__html:markup}} /></AdminLayout></AdminSessionProvider>);
`)
const stubs = join(repo, 'docs/evidence/admin-navigation-search-1/stubs')
await esbuild.build({ entryPoints: [shellEntry], outfile: join(temp, 'shell.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', alias: {
 '@': repo, 'next/navigation': join(stubs,'next-navigation.ts'), 'next/link': join(stubs,'next-link.tsx'), '@/app/auth/sign-out': join(stubs,'sign-out.ts'), 'server-only': empty,
}, define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'silent' })
const from = join(repo, 'styles/globals.css')
const {css} = await postcss([nesting(),tailwindcss(),autoprefixer()]).process(readFileSync(from,'utf8'),{from})
const js = readFileSync(join(temp,'shell.js'),'utf8')
const server = createServer((req,res)=>{
 const name = new URL(req.url,'http://localhost').searchParams.get('case') || 'fresh'
 res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'})
 res.end(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Jetnity Admin · UI-Prüfung</title><style>${css}</style><body><p style="margin:0;padding:6px 16px;font-size:11px">UI-Prüfung · synthetische Testdaten · keine Live-Sitzung</p><template id="page-content">${markups[name] || markups.fresh}</template><div id="root"></div><script>${js}</script></body></html>`)
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const url = `http://127.0.0.1:${server.address().port}`
console.log(url)
if(process.argv.includes('--serve')) { console.log('Fixture preview server ready'); await new Promise(()=>{}); }
const browser = await chromium.launch({channel:'chrome'})
const results = []
try {
 for(const [width,height] of [[280,800],[320,800],[360,800],[375,812],[390,844],[430,932],[768,1024],[1024,900],[1280,900],[1440,1000],[844,390],[667,375]]) {
  const page=await browser.newPage({viewport:{width,height},colorScheme:'light'})
  const errors=[]; page.on('pageerror',error=>errors.push(error.message))
  await page.goto(url); await page.locator('#admin-operative-lage').waitFor()
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  assert.equal(await page.locator('figure li').count(),14)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
  if(overflow){
   await page.screenshot({path:join(out,`overflow-${width}.png`),fullPage:true})
   console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && r.right>innerWidth+1}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,70),width:e.getBoundingClientRect().width})).slice(0,20)))
  }
  assert.equal(overflow,false,`overflow @ ${width}x${height}`)
  const text=await page.locator('#admin-content').innerText()
  assert.match(text,/Keine Maßnahmen erforderlich/)
  assert.doesNotMatch(text,/public\.airports|model_usage|security_events|Kein Ziel in diesem Slice/)
  const summary=page.locator('summary').first()
  await summary.focus(); await page.keyboard.press('Enter')
  assert.equal(await summary.evaluate(el=>el.parentElement.open),true)
  await page.keyboard.press('Enter')
  assert.equal(await summary.evaluate(el=>el.parentElement.open),false)
  if(width<1024){
   await page.getByRole('button',{name:'Navigationsmenü öffnen',exact:true}).click()
   assert.equal(await page.getByRole('dialog',{name:'Admin Navigation',exact:true}).isVisible(),true)
   await page.keyboard.press('Escape')
   assert.equal(await page.getByRole('dialog',{name:'Admin Navigation',exact:true}).count(),0)
  } else {
   await page.getByRole('button',{name:'Sidebar umschalten',exact:true}).click()
   assert.equal(await page.locator('aside').getAttribute('data-collapsed'),'true')
   await page.getByRole('button',{name:'Sidebar umschalten',exact:true}).click()
  }
  if([390,768,1440].includes(width)) await page.screenshot({path:join(out,`admin-${width}.png`),fullPage:true})
  if(width===1440){
   await page.getByRole('button',{name:'Theme umschalten',exact:true}).click()
   assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('dark')),true)
   await page.screenshot({path:join(out,'admin-dark.png'),fullPage:true})
  }
  assert.deepEqual(errors,[])
  results.push({width,height,overflow,keyboardDisclosure:true,shellInteraction:true,errors})
  await page.close()
 }
 for(const name of ['zero','stale','unknown','denied','failed','rls-gap']) {
  const page=await browser.newPage({viewport:{width:390,height:844}})
  await page.goto(`${url}?case=${name}`); await page.locator('#admin-operative-lage').waitFor()
  const text=await page.locator('#admin-content').innerText()
  if(['stale','unknown','denied','failed'].includes(name)) assert.doesNotMatch(text,/Keine Maßnahmen erforderlich/)
  if(name==='zero') assert.match(text,/Keine neuen Reisen/)
  if(name==='rls-gap') assert.match(text,/1 Tabellen ohne RLS/)
  if(name==='stale') assert.match(text,/veraltet/)
  if(name==='denied') assert.match(text,/Zugang verweigert/)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${name} overflow`)
  await page.screenshot({path:join(out,`admin-${name}.png`),fullPage:true})
  results.push({state:name,noFalseAllClear:true,overflow:false})
  await page.close()
 }
 writeFileSync(join(out,'audit.json'),JSON.stringify({kind:'actual-components-with-synthetic-data',authenticated:false,physicalDevice:false,results},null,2))
 console.log(JSON.stringify({passed:results.length,out}))
} finally { await browser.close(); server.close(); }
