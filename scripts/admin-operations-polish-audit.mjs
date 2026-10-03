#!/usr/bin/env node
// Actual pages/components, synthetic local boundaries. No authenticated or production evidence.
import assert from 'node:assert/strict'
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
const temp = join(repo, 'node_modules/.cache/admin-operations-audit')
const out = resolve(process.env.ADMIN_OPS_EVIDENCE || '/tmp/admin-operations-evidence')
mkdirSync(temp, { recursive: true }); mkdirSync(out, { recursive: true })
function file(name, content) { const path = join(temp, name); writeFileSync(path, content); return path }
const empty = file('empty.ts', '')
const fixture = file('fixtures.ts', `
import {SYSTEM_HEALTH_AUDIT_BERICHT} from '${repo}/lib/admin/system-health/fixtures';
import {PROVIDER_OPS_BOARD_AUDIT_BERICHT} from '${repo}/lib/admin/provider-ops-board/fixtures';
import {projiziereSeoStatus} from '${repo}/lib/admin/seo-status';
export const scenario = new URLSearchParams(location.search).get('case') || 'empty';
export const health=structuredClone(SYSTEM_HEALTH_AUDIT_BERICHT);
export const ops=structuredClone(PROVIDER_OPS_BOARD_AUDIT_BERICHT);
for(const report of [health,ops]) {
 report.checkedAt='2026-10-03T00:00:00.000Z';
 for(const item of report.items){ item.checkedAt=report.checkedAt; item.freshness={state:scenario==='stale'?'stale':'fresh',ageMs:scenario==='stale'?900000:0,ttlMs:60000};
 for(const check of item.checks || []) check.freshness={...item.freshness}; }
}
health.items.find(x=>x.id==='infomaniak').status='not_configured';
const domains=['Flights','Hotels','Activities','Mobility','Rental Cars','Readiness','Safety','Seasonal'];
ops.items[0].checks=domains.map((name,i)=>({...ops.items[0].checks[0],id:'domain-'+i,name,status:'disabled',summary:'Production ist im S1-Vertrag hart aus. Das ist keine Live-Freigabe.'}));
if(scenario==='populated') { const usage=ops.items.find(x=>x.id==='model-usage'); usage.status='available'; usage.metadata={zeilen:'3',kostenMikroUsd:'21000'}; usage.summary='3 aufgezeichnete Modellzeilen.'; }
if(scenario==='unknown') {for(const item of [...health.items,...ops.items]){item.status='unknown';item.freshness.state='unknown'; for(const check of item.checks||[]){check.status='unknown';check.freshness.state='unknown';}}}
export async function ladeSystemHealthFuerSeite(){return health}
export async function ladeProviderOpsBoardFuerSeite(){return ops}
export function ladeSeoStatusFuerSeite(){return projiziereSeoStatus({NEXT_PUBLIC_SITE_URL:'https://jetnity.com',VERCEL_ENV:'preview',NEXT_PUBLIC_ALLOW_INDEXING:'false'})}
export async function requireAdminPage(){return {user:{id:'fixture-owner',email:'owner@example.test'},role:'owner'}}
const userRows=Array.from({length:4},(_,i)=>({user_id:'fixture-'+i,display_name:['Mira Keller','Alex Berger','Lina Beispiel','Noah Sommer'][i],email:i===2?'a-long-synthetic-address-for-layout-review@example.test':'person'+i+'@example.test',role:i===0?'admin':'member',status:i===2?'pending':'active',created_at:i===3?null:'2026-09-22T11:05:00Z',last_seen_at:null}));
export async function createServerComponentClient(){const query={select(){return this},order(){return this},range(){return this},or(){return this},then(resolve){return Promise.resolve({data:scenario==='users-empty'?[]:userRows,count:scenario==='users-empty'?0:4,error:scenario==='failed'?{message:'Synthetischer Lesefehler',code:'XX000'}:null,status:scenario==='failed'?503:200}).then(resolve)}};return {from(){return query}}}
export function unstable_noStore(){}
export async function setUserRole(){throw Error('Fixture: user mutation is not enabled')}
export async function setUserStatus(){throw Error('Fixture: user mutation is not enabled')}
window.__requests=[];
window.__failRefresh=false;
window.fetch=async(input,init={})=>{
 const url=new URL(input,location.origin);window.__requests.push({path:url.pathname,query:url.search,method:init.method||'GET',body:init.body});
 if(!url.pathname.startsWith('/api/admin/')) throw Error('Unexpected fixture request '+url.pathname);
 if(scenario==='loading') return new Promise(()=>{});
 if(window.__failRefresh || scenario==='failed' || scenario==='denied') return new Response(JSON.stringify({message:scenario==='denied'?'Für diese Ansicht fehlt die Berechtigung.':'Synthetischer Lesefehler'}),{status:scenario==='denied'?403:503});
 let data;
 if(init.method==='POST') data={ok:true};
 else if(url.pathname.endsWith('/breakdown'))data={days:Array.from({length:30},(_,i)=>({date:'2026-09-'+String(i+1).padStart(2,'0'),orders:scenario==='populated'&&i%5===0?1:0,revenue_chf:scenario==='populated'&&i%5===0?25+i:0}))};
 else if(url.pathname==='/api/admin/security/list')data={events:scenario==='populated'||scenario==='bounded'?Array.from({length:scenario==='bounded'?200:2},(_,i)=>({id:'fixture-event-'+i,ip:'203.0.113.'+(i+1),type:i%2?'suspicious':'login_failed',created_at:new Date().toISOString(),detail:'Synthetisches Testereignis',user_id:'fixture-user'})):[],blocklist:scenario==='bounded'?Array.from({length:200},(_,i)=>({ip:'192.0.2.'+(i+1),reason:'Fixture',created_at:new Date().toISOString()})):[]};
 else if(url.pathname==='/api/admin/system-health')data=health;
 else if(url.pathname==='/api/admin/provider-ops')data=ops;
 else if(url.pathname.includes('payments'))data={rows:scenario==='populated'?[{id:'fixture-payment',status:'paid',amount_chf:31,created_at:'2026-10-01T12:00:00Z',customer_email:'person@example.test',type:'fixture.event'}]:[],next_cursor:null};
 else throw Error('Unexpected fixture endpoint '+url.pathname);
 return new Response(JSON.stringify(data),{status:200});
};
`)
const stubs = join(repo, 'docs/evidence/admin-navigation-search-1/stubs')
const navigation = file('navigation.ts', readFileSync(join(stubs, 'next-navigation.ts'), 'utf8') + '\nexport function redirect(path){throw Error("Fixture redirect: "+path)}\n')
const entry = file('entry.tsx', `
import {createRoot} from 'react-dom/client';
import AdminLayout from '${repo}/app/(admin)/admin/layout';
import AdminSessionProvider from '${repo}/components/admin/AdminSessionProvider';
import Payments from '${repo}/app/(admin)/admin/payments/page';
import Security from '${repo}/app/(admin)/admin/security/page';
import Health from '${repo}/app/(admin)/admin/system-health/page';
import Providers from '${repo}/app/(admin)/admin/provider-ops/page';
import Users from '${repo}/app/(admin)/admin/users/page';
import {setHarnessPathname} from './navigation';
import './fixtures';
const route=location.pathname.split('/').pop()||'payments';
setHarnessPathname('/admin/'+route);
const pages={payments:Payments,security:Security,'system-health':Health,'provider-ops':Providers,users:Users};
(async()=>{const content=await pages[route]({searchParams:Promise.resolve({})});createRoot(document.getElementById('root')).render(<AdminSessionProvider role="owner" grant="role"><AdminLayout>{content}</AdminLayout></AdminSessionProvider>);})();
`)
await esbuild.build({entryPoints:[entry],outfile:join(temp,'ui.js'),bundle:true,platform:'browser',format:'iife',jsx:'automatic',alias:{
 '@':repo,'server-only':empty,'next/navigation':navigation,'next/cache':fixture,'next/link':join(stubs,'next-link.tsx'),'@/app/auth/sign-out':join(stubs,'sign-out.ts'),
 '@/lib/auth/admin-guard':fixture,'@/lib/supabase/server':fixture,'@/lib/admin/system-health/runtime':fixture,'@/lib/admin/provider-ops-board/runtime':fixture,'@/lib/admin/seo-status-server':fixture,'@/app/(admin)/admin/users/actions':fixture,
},define:{'process.env.NODE_ENV':'"development"'},logLevel:'silent'})
const from=join(repo,'styles/globals.css')
const {css}=await postcss([nesting(),tailwindcss(),autoprefixer()]).process(readFileSync(from,'utf8'),{from})
const js=readFileSync(join(temp,'ui.js'),'utf8')
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Jetnity · UI-Prüfung</title><style>${css}</style><body><p style="margin:0;padding:6px 16px;font-size:11px">UI-Prüfung · synthetische Testdaten · keine Live-Sitzung</p><div id="root"></div><script>${js}</script></body></html>`)})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const url=`http://127.0.0.1:${server.address().port}`
console.log(url)
if(process.argv.includes('--serve')){console.log('Synthetic preview ready');await new Promise(()=>{})}
const browser=await chromium.launch({channel:'chrome'})
const results=[]
async function open(route,width,scenario='empty'){
 const page=await browser.newPage({viewport:{width,height:width===768?1024:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/admin/'+route+'?case='+scenario);await page.locator('#admin-content').waitFor();
 if(route==='payments'&&scenario!=='loading')await page.getByRole('button',{name:'Aktualisieren',exact:true}).waitFor({state:'visible'});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return {page,errors};
}
async function noOverflow(page,label){
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow){await page.screenshot({path:join(out,'overflow-'+label+'.png'),fullPage:true});console.log(await page.evaluate(()=>[...document.querySelectorAll('#admin-content *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60)}))))}
 assert.equal(overflow,false,label);
}
try{
 for(const route of ['payments','security','system-health','provider-ops','users']){
  for(const width of [280,320,390,768,1024,1440]){
   const {page,errors}=await open(route,width);
   await noOverflow(page,route+'-'+width);
   const visible=await page.locator('#admin-content').innerText();
   assert.doesNotMatch(visible,/security_events|blocked_ips|public\.model_usage|lib\/provider-ops|VERCEL_\*/);
   if(route==='payments') {assert.match(visible,/Umsatz ist nicht verfügbar/);assert.match(visible,/Keine lokal als bezahlt/);assert.equal(await page.locator('.recharts-wrapper').count(),0)}
   if(route==='security'){assert.match(visible,/Erfassung unvollständig/);assert.match(visible,/keine technische Sperre/);assert.doesNotMatch(visible,/Gesperrte IPs|Gesperrt seit/)}
   if(route==='users') {assert.match(visible,/Nicht verfügbar/);await page.getByRole('button',{name:'Aktionen für Mira Keller'}).click();assert.equal(await page.getByRole('menu').isVisible(),true);await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'hidden'})}
   const summaries=page.locator('#admin-content summary');
   if(await summaries.count()){await summaries.first().focus();await page.keyboard.press('Enter');assert.equal(await summaries.first().evaluate(e=>e.parentElement.open),true);await noOverflow(page,route+'-details-'+width);await page.keyboard.press('Enter')}
   await page.locator('#admin-content h1, #admin-content h2').first().click();
   if([390,768,1440].includes(width))await page.screenshot({path:join(out,route+'-'+width+'.png'),fullPage:true});
   assert.deepEqual(errors,[]);results.push({route,width,case:'empty',overflow:false,errors});await page.close();
  }
 }
 for(const route of ['payments','security','system-health','provider-ops','users']){
  for(const scenario of route==='users'?['users-empty','failed']:route==='payments'||route==='security'?['loading','failed','denied','populated']:['stale','unknown','populated']){
   const {page,errors}=await open(route,390,scenario);await noOverflow(page,route+'-'+scenario);
   const visible=await page.locator('#admin-content').innerText();
   if(scenario==='failed'||scenario==='denied'){assert.match(visible,/Lesefehler|Berechtigung/);assert.doesNotMatch(visible,/Keine lokal als bezahlt|Keine aufgezeichneten Events in diesem Zeitraum|Keine Nutzer gefunden/)}
   if(scenario==='stale'){assert.match(visible,/veraltet/);assert.equal(await page.locator('[data-health-green="true"],[data-ops-green="true"]').count(),0)}
   if(scenario==='unknown')assert.equal(await page.locator('[data-health-green="true"],[data-ops-green="true"]').count(),0);
   if(route==='payments'&&scenario==='populated'){
    assert.equal(await page.locator('.recharts-wrapper').count(),1);
    await page.screenshot({path:join(out,'payments-chart-390.png'),fullPage:true});
    await page.getByText('Tageswerte anzeigen',{exact:true}).click();assert.equal(await page.locator('#admin-content tbody tr').count(),30);
    await page.getByRole('button',{name:'Transaktionen',exact:true}).click();await page.getByText('fixture-payment',{exact:true}).waitFor();
    await page.getByRole('textbox',{name:'Transaktionen nach ID oder E-Mail suchen'}).fill('person');await page.getByRole('button',{name:'Filtern',exact:true}).click();
    await page.getByRole('button',{name:'Erstattungsnotizen',exact:true}).click();assert.match(await page.locator('#admin-content').innerText(),/Es wird kein Geld erstattet/);
    await page.getByRole('textbox',{name:'Zahlungs-ID',exact:true}).fill('fixture-payment');await page.getByRole('textbox',{name:'Betrag in CHF'}).fill('5');await page.getByRole('button',{name:'Lokal vermerken'}).click();await page.getByText('Erstattungsnotiz gespeichert. Es wurde kein Geld erstattet.').waitFor();
    assert.equal(await page.evaluate(()=>window.__requests.some(r=>r.method==='POST'&&JSON.parse(r.body).amount_chf===5)),true);
    await page.getByRole('button',{name:'Webhooks',exact:true}).click();await page.getByText('fixture.event',{exact:true}).waitFor();await noOverflow(page,'payment-tabs');
   }
   if(route==='security'&&scenario==='populated'){
    await page.getByRole('textbox',{name:'Aufgezeichnete Ereignisse durchsuchen'}).fill('no-match');await page.getByText('Keine aufgezeichneten Events passen zu diesem Filter.').waitFor();
    assert.equal(await page.locator('[data-security-events-leer="filter"]').count(),1);
    await page.getByRole('textbox',{name:'IP-Adresse',exact:true}).fill('203.0.113.42');await page.getByRole('button',{name:'Eintrag hinzufügen',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__requests.some(r=>r.method==='POST'&&JSON.parse(r.body).ip==='203.0.113.42')),true);
   }
   await page.screenshot({path:join(out,route+'-'+scenario+'.png'),fullPage:true});assert.deepEqual(errors,[]);results.push({route,width:390,case:scenario,errors});await page.close();
  }
 }
 for(const route of ['payments','security','system-health','provider-ops','users']){
  for(const width of [280,768]){
   const {page,errors}=await open(route,width,'populated');await noOverflow(page,route+'-populated-'+width);assert.deepEqual(errors,[]);
   if(route==='payments')await page.screenshot({path:join(out,'payments-chart-'+width+'.png'),fullPage:true});
   results.push({route,width,case:'populated',overflow:false,errors});await page.close();
  }
 }
 for(const route of ['system-health','provider-ops']){
  const {page}=await open(route,1440);await page.evaluate(()=>{window.__failRefresh=true});await page.getByRole('button',{name:'Erneut prüfen'}).click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/vorherige Prüfstand/);results.push({route,case:'refresh-failure-retains-prior-report'});await page.close();
 }
 const {page}=await open('security',390,'bounded');assert.equal(await page.locator('[data-security-read-bound]').count(),2);await page.getByRole('textbox',{name:'Aufgezeichnete Ereignisse durchsuchen'}).fill('no-match');assert.equal(await page.locator('[data-security-read-bound]').count(),2);results.push({route:'security',case:'bounded-200-keeps-limit-after-filter'});await page.close();
 const dark=await open('provider-ops',1440);await dark.page.getByRole('button',{name:'Theme umschalten',exact:true}).click();await dark.page.screenshot({path:join(out,'provider-ops-dark.png'),fullPage:true});await dark.page.close();
 writeFileSync(join(out,'operations-audit.json'),JSON.stringify({kind:'actual-pages-with-synthetic-boundaries',authenticated:false,physicalDevice:false,results},null,2));console.log(JSON.stringify({passed:results.length,out}));
}finally{await browser.close();server.close()}
