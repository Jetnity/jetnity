import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {test} from 'node:test'
import NextEightOfficialGuidance from '@/components/readiness/NextEightOfficialGuidance'
import {NEXT_EIGHT_OFFICIAL_RESEARCH} from './official-truth-next-eight-sources-v1'

test('All eight next priority destinations show both official source pointers without positive legal visa, ETA, vaccine or cost claims',()=>{
 for(const entry of NEXT_EIGHT_OFFICIAL_RESEARCH){
  const markup=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:entry.country}))
  assert.match(markup,new RegExp('data-official-next-eight-country="'+entry.country+'"'))
  assert.match(markup,/data-official-status="RESEARCH_ONLY"/)
  assert.ok(markup.includes(entry.governmentPrimary.replaceAll('&','&amp;')))
  assert.ok(markup.includes(entry.governmentCountercheck.replaceAll('&','&amp;')))
  assert.match(markup,/Derzeit nicht verfügbar/)
  assert.match(markup,/keine individuell genehmigte Einreise- oder Visumregel/)
  assert.match(markup,/derzeit nicht verfügbar/)
  assert.match(markup,/Fake- oder Vermittlerseiten/)
  assert.match(markup,/rel="noopener noreferrer"/)
  assert.doesNotMatch(markup,/data-official-status="accepted"|data-personal-visa="accepted"/)
  assert.doesNotMatch(markup,/\bVisa erforderlich für diesen Pass\b|\bKeine Visumpflicht für deinen Pass\b/)
 }
 for(const country of ['FR','IT','ES','PT','AT','DE','JP','CN-HK','QQ'])
  assert.equal(renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country})),'')
})
test('Thailand 2026 law reversal, UK ETA and US ESTA restrictions have explicit visible fail-closed warnings',()=>{
 const th=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:'TH'}))
 assert.match(th,/15\.09\.2026/)
 assert.match(th,/60-Tage-Visumbefreiung wurde aufgehoben/)
 const tr=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:'TR'}))
 assert.match(tr,/02\.01\.2026/)
 const gb=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:'GB'}))
 assert.match(gb,/ETA/)
 const us=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:'US'}))
 assert.match(us,/ESTA ist kein Visum/)
 const ae=renderToStaticMarkup(React.createElement(NextEightOfficialGuidance,{country:'AE'}))
 assert.match(ae,/ausländischen Aufenthaltstitel/)
 const page=readFileSync(new URL('../../components/readiness/EinreiseLaenderpruefer.tsx',import.meta.url),'utf8')
 assert.match(page,/NextEightOfficialGuidance country={sicht.zielCode}/)
 assert.match(page,/\['GR','HR','NL','GB','US','TR','TH','AE'\]/)
})
