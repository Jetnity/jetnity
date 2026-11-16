import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Uses installed lockfile dependencies and the runner's installed browser.
// Every request is intercepted: no Google/OpenWeather call, key or real journey.
test('real browser requires separate map/weather opt-in and stops on revocation', {timeout:90000}, async () => {
  const require=createRequire(import.meta.url)
  const esbuild=require('esbuild') as {build(options:Record<string,unknown>):Promise<{outputFiles:{text:string}[]}>}
  const root=fileURLToPath(new URL('../../',import.meta.url))
  const result=await esbuild.build({stdin:{contents:`
    import React,{useEffect} from 'react'; import {createRoot} from 'react-dom/client';
    import {WetterZustimmung,WetterSchutz} from './components/trips/wetter/WetterZustimmung';
    import ReisekartenRahmen,{Kartenknopf} from './components/trips/reisekarte/Reisekarte';
    import {referenzReise} from './lib/trips/ux-u1c-route-design-alignment-1/fixture';
    function Probe(){ useEffect(()=>{const c=new AbortController();
      const run=()=>fetch('/weather-probe',{signal:c.signal}).catch(()=>{}); run();
      const t=setInterval(run,100);return()=>{clearInterval(t);c.abort()};},[]);
      return <span data-testid="weather-mounted">Wetter geladen</span> }
    const trip={...referenzReise(),id:'paris-beispiel'};
    createRoot(document.getElementById('root')).render(<>
      <WetterZustimmung aktiv={true}><WetterSchutz><Probe/></WetterSchutz></WetterZustimmung>
      <ReisekartenRahmen enabled={true} expiresAt={null}><Kartenknopf reise={trip}>Karte öffnen</Kartenknopf></ReisekartenRahmen>
    </>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
    define:{'process.env.NODE_ENV':'"test"'},logLevel:'silent',
    plugins:[{name:'owned-place-fixture',setup(build:{onResolve(options:{filter:RegExp},handler:()=>unknown):void;
      onLoad(options:{filter:RegExp;namespace:string},handler:()=>unknown):void}) {
      build.onResolve({filter:/^@\/lib\/places\/aktionen$/},()=>({path:'places',namespace:'fixture'}))
      build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export async function ortBestaetigen(){return {ok:false}}',loader:'js'}))
    }}]})
  const executablePath=[chromium.executablePath(),'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync)
  assert.ok(executablePath,'an actual installed browser is required, never a skipped pass')
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']})
  try {
    const page=await browser.newPage()
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
    let weather=0,maps=0,unexpected=0
    await page.route('**/*',async route=>{
      const path=new URL(route.request().url()).pathname
      if(path==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div><script>'+result.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>'})
      if(path==='/favicon.ico')return route.fulfill({status:204,body:''})
      if(path==='/weather-probe'){weather++;return route.fulfill({contentType:'application/json',body:'{}'})}
      if(path==='/embed/trip-map'){maps++;return route.fulfill({contentType:'text/html',body:'<!doctype html><p>Owned inert map fixture</p>'})}
      unexpected++;await route.abort()
    })
    await page.goto('https://consent-fixture.invalid/')
    await page.getByRole('button',{name:'Zustimmen und Wetter laden'}).waitFor()
    await page.waitForTimeout(250)
    assert.equal(weather,0);assert.equal(maps,0)
    await page.getByRole('button',{name:'Karte öffnen',exact:true}).click()
    await page.getByRole('button',{name:'Zustimmen und Karte laden'}).waitFor()
    assert.equal(maps,0);assert.equal(weather,0)
    await page.getByRole('button',{name:'Zustimmen und Karte laden'}).click()
    await page.locator('iframe[title="Interaktive Google-Reisekarte"]').waitFor()
    await page.waitForTimeout(100);assert.equal(maps,1);assert.equal(weather,0)
    await page.getByRole('button',{name:'Kartenzustimmung widerrufen'}).click()
    assert.equal(await page.locator('iframe').count(),0)
    // Close the map dialog so the independent weather control is interactive.
    await page.keyboard.press('Escape')
    await page.getByRole('button',{name:'Zustimmen und Wetter laden'}).click()
    await page.getByTestId('weather-mounted').waitFor();await page.waitForTimeout(200)
    assert.ok(weather>0);assert.equal(maps,1)
    await page.getByRole('button',{name:'Wetterzustimmung widerrufen'}).click()
    await page.getByTestId('weather-mounted').waitFor({state:'detached'})
    await page.waitForTimeout(100);const after=weather;await page.waitForTimeout(300)
    assert.equal(weather,after)
    await page.getByRole('button',{name:'Zustimmen und Wetter laden'}).click()
    await page.getByTestId('weather-mounted').waitFor()
    await page.evaluate(()=>document.dispatchEvent(new Event('privacybee:consent-changed')))
    await page.getByTestId('weather-mounted').waitFor({state:'detached'})
    await page.waitForTimeout(100);const blocked=weather;await page.waitForTimeout(300)
    assert.equal(weather,blocked)
    assert.equal(await page.getByRole('button',{name:'Zustimmen und Wetter laden'}).count(),0)
    assert.equal(unexpected,0);assert.deepEqual(errors,[])
    const wired=readFileSync(new URL('../../components/trips/wetter/Tageswetter.tsx',import.meta.url),'utf8')
    assert.match(wired,/return <WetterSchutz><WetterFuerOrt/)
  } finally {await browser.close()}
})
