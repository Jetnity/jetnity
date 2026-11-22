// Synthetic-only visitor presentation: no database fixtures or writes.
// The real Dev RPC readback is separately guarded by MA1/BG1/official sources.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'
import { istKatalogLand } from '@/lib/country/katalog'
import { einreisePrueferSicht } from '@/lib/readiness/einreise-laenderpruefer'
import { readAtVisaInput, readAtVisaView } from './at-visa-http'
import { presentAtVisaReadbacks, type AtVisaReadback } from './at-visitor-display'
import type { V3VisitorView } from '../official-truth-product-v3/visitor/presentation'

const BMI_ENTRY='https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'
const BMI_VISA='https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
const BERN='https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'
const SOURCE_AT='2026-11-17T10:00:00.000Z'
const VERIFIED_AT='2026-11-17T10:31:38.041Z'
const EXPIRES_AT='2026-11-17T11:31:38.041Z'
const NOW=new Date('2026-11-17T10:45:00.000Z')
const syntheticPassports='CH DE FR IT ES PT GB US CA AU NZ JP KR CN IN TR BR AR CL CO MX ZA EG MA TN DZ NG KE GH ET AE SA QA OM IL TH VN SG MY ID PH PK BD NP LK UA PL RO GR AT'.split(' ')

function sample(country:string){
 return {status:'accepted',citizenshipCountryCode:country,destinationCountryCode:'AT',
  documentType:'passport',visaEffect:'not_required',visaMode:'visa_exempt',
  ruleVersion:1,sourceCheckedAt:SOURCE_AT,verifiedAt:VERIFIED_AT,expiresAt:EXPIRES_AT,
  sourceUrls:country==='CH'?[BMI_ENTRY,BMI_VISA,BERN]:[BMI_ENTRY,BMI_VISA]}
}
function result(countryCodes:string[],readbacks:AtVisaReadback[],now=NOW){
 const input=readAtVisaInput({destinationCountryCode:'AT',citizenshipCountryCodes:countryCodes})
 assert.ok(input,'real visitor country contract')
 const view=presentAtVisaReadbacks(input,readbacks,now)
 const decoded=readAtVisaView(view)
 assert.ok(decoded,'strict HTTP visitor view contract')
 const shown=einreisePrueferSicht({phase:'ready',view:decoded,refresh:'off',message:null,focusResult:false})
 assert.ok(shown,'real customer presentation')
 return {view:decoded,shown}
}

test('Austrian Dev CH accepted reply shows official wording, actual source date and a green passport badge',()=>{
 const {view,shown}=result(['CH'],[{country:'CH',data:sample('CH')}])
 assert.equal(view.cells[0]?.results[0]?.status,'accepted')
 assert.equal(shown.anzeige.paare[0]?.ampel,'gruen')
 assert.equal(shown.anzeige.paare[0]?.ampelText,'Kein Visum nötig')
 assert.equal(shown.anzeige.paare[0]?.themen[0]?.quelle,'Österreichische Botschaft Bern')
 assert.equal(shown.anzeige.paare[0]?.themen[0]?.stand,'17.11.2026')
 assert.match(shown.anzeige.paare[0]?.themen[0]?.text??'',/Schweizer Staatsangehörige.*kein Visum/)
 assert.match(shown.anzeige.standSatz,/Stand 17\.11\.2026/)
 const html=renderToStaticMarkup(React.createElement(EinreiseKundenanzeige,{anzeige:shown.anzeige}))
 assert.match(html,/data-einreise-ampel="gruen"/)
 assert.match(html,/Kein Visum nötig/)
 assert.match(html,/Österreichische Botschaft Bern/)
 assert.match(html,/Stand 17\.11\.2026/)
 assert.match(html,/Schweizer Staatsangehörige/)
})

test('CH-only V4 source-bound visa_free is normalized into a verified green visa-exempt display',()=>{
 const actualDevV4={...sample('CH'),visaMode:'visa_free'}
 const {view,shown}=result(['CH'],[{country:'CH',data:actualDevV4}])
 assert.equal(view.cells[0]?.results[0]?.status,'accepted')
 assert.equal(shown.anzeige.paare[0]?.ampel,'gruen')
 assert.equal(shown.anzeige.paare[0]?.ampelText,'Kein Visum nötig')
 assert.equal(view.cells[0]?.results[0]?.status==='accepted'
   ? view.cells[0]?.results[0]?.visaAssessment.mode : null,'visa_exempt')
 const foreign={...sample('IN'),visaMode:'visa_free'}
 assert.equal(result(['IN'],[{country:'IN',data:foreign}]).shown.anzeige.paare[0]?.ampel,'neutral')
 const extra={...actualDevV4,sourceUrls:[BMI_ENTRY,BMI_VISA]}
 assert.equal(result(['CH'],[{country:'CH',data:extra}]).shown.anzeige.paare[0]?.ampel,'neutral')
})

test('all 50 distinct synthetic passport choices use the same accepted/unavailable presentation path',()=>{
 assert.equal(syntheticPassports.length,50)
 assert.equal(new Set(syntheticPassports).size,50)
 assert.equal(syntheticPassports.every(istKatalogLand),true)
 let confirmed=0,unavailable=0
 for(let start=0;start<syntheticPassports.length;start+=5){
  const countries=syntheticPassports.slice(start,start+5)
  // Only ONE country is presumed to have a positive upstream verified receipt.
  // Every other choice remains unavailable even when part of the same query.
  const acceptedCountry=countries[0]!
  const {view,shown}=result(countries,[{country:acceptedCountry,data:sample(acceptedCountry)}])
  assert.equal(view.cells.length,countries.length)
  assert.equal(shown.anzeige.paare.length,countries.length)
  for(const cell of view.cells){
   const pair=shown.anzeige.paare.find(p=>p.id===`${cell.country}:AT`)
   assert.ok(pair)
   if(cell.country===acceptedCountry){
    assert.equal(cell.results[0]?.status,'accepted')
    assert.equal(pair.ampel,'gruen')
    assert.equal(pair.themen[0]?.stand,'17.11.2026')
    assert.match(pair.themen[0]?.text??'',/kein Visum erforderlich|kein Visum/i)
    confirmed++
   }else{
    assert.equal(cell.results[0]?.status,'unavailable')
    assert.equal(pair.ampel,'neutral')
    assert.equal(pair.themen.length,0)
    assert.equal(pair.platzhalter,true)
    unavailable++
   }
  }
  assert.equal(shown.anzeige.satz,'Die Visumlage ist noch nicht bestätigt.')
 }
 assert.equal(confirmed,10)
 assert.equal(unavailable,40)
})

test('mismatched passport, source URL, flags, missing proof and expired/future dates never become green',()=>{
 const invalid:unknown[]=[
  {...sample('CH'),citizenshipCountryCode:'IN'},
  {...sample('CH'),destinationCountryCode:'DE'},
  {...sample('CH'),documentType:'diplomatic_passport'},
  {...sample('CH'),visaMode:'visa_on_arrival'},
  {...sample('CH'),visaEffect:'required'},
  {...sample('CH'),sourceUrls:[BMI_VISA]},
  {...sample('CH'),sourceUrls:[BMI_ENTRY,BMI_VISA,'https://untrusted.invalid/visa']},
  {...sample('CH'),expiresAt:'2026-11-17T10:40:00.000Z'},
  {...sample('CH'),verifiedAt:'2026-11-18T00:00:00.000Z'},
  {...sample('CH'),sourceCheckedAt:'2026-11-18T00:00:00.000Z'},
  {...sample('CH'),verifiedAt:'2026-11-16T19:40:00.000Z'},
  {...sample('CH'),extra:true},
  null,{},'accepted',
 ]
 for(const data of invalid){
  const {view,shown}=result(['CH'],[{country:'CH',data}])
  assert.equal(view.cells[0]?.results[0]?.status,'unavailable')
  assert.equal(shown.anzeige.paare[0]?.ampel,'neutral')
  assert.equal(shown.anzeige.paare[0]?.themen.length,0)
  assert.match(shown.anzeige.standSatz,/Stand derzeit nicht verfügbar/)
 }
 // The same source cannot be duplicated as multiple accepted replies.
 assert.equal(result(['CH'],[{country:'CH',data:sample('CH')},{country:'CH',data:sample('CH')}]).shown.anzeige.paare[0]?.ampel,'neutral')
 assert.equal(result(['CH'],[]).shown.anzeige.paare[0]?.ampel,'neutral')
 assert.equal(result(['CH'],[{country:'CH',data:sample('CH')}],new Date('2026-11-17T11:31:38.041Z')).shown.anzeige.paare[0]?.ampel,'neutral')
})

test('generic Austrian HTTP view cannot accept unverified symbols or foreign passport cells',()=>{
 const input=readAtVisaInput({destinationCountryCode:'AT',citizenshipCountryCodes:['CH','IN']})
 assert.ok(input)
 const good=presentAtVisaReadbacks(input,[{country:'CH',data:sample('CH')}],NOW)
 assert.ok(readAtVisaView(good))
 const changed={...good,cells:good.cells.map((cell,i)=>i===1?{...cell,country:'CH'}:cell)}
 assert.equal(readAtVisaView(changed),null)
 const forced={...good,cells:good.cells.map((cell,i)=>i===1?{...cell,results:[{
  status:'accepted',title:'Visum',informationTopic:'visa',visaAssessment:{effect:'not_required',mode:'visa_exempt'},
  conditions:['Direkte Einreise'],statements:[{text:'Frei',when:null,href:'https://fraud.invalid'}],
  source:{label:'Angebliche Behörde',href:'https://fraud.invalid'},checkedAtText:'Stand vom 17.11.2026',
  validityText:'Test',ruleVersion:1,expiresAt:EXPIRES_AT,
 }]}:cell)}
 assert.equal(readAtVisaView(forced),null)
})

test('the real AT route queries the exact country of every selected passport and has no CH-only shortcut',()=>{
 const route=readFileSync(new URL('../../../app/api/readiness/at-visa/route.ts',import.meta.url),'utf8')
 assert.match(route,/input\.citizenshipCountryCodes\.map\(async country/)
 assert.match(route,/p_citizenship_country_code:country/)
 assert.match(route,/Promise\.allSettled/)
 assert.doesNotMatch(route,/p_citizenship_country_code:'CH'/)
 assert.doesNotMatch(route,/includes\('CH'\)/)
})

test('future passport evidence cannot inherit the Swiss-only Bern source or omit the verified assessment',()=>{
 const invalid=sample('IN')
 assert.equal(result(['IN'],[{country:'IN',data:{...invalid,sourceUrls:[BMI_ENTRY,BMI_VISA,BERN]}}]).shown.anzeige.paare[0]?.ampel,'neutral')
 const good=presentAtVisaReadbacks(readAtVisaInput({destinationCountryCode:'AT',citizenshipCountryCodes:['CH']})!,
  [{country:'CH',data:sample('CH')}],NOW)
 const without={...good,cells:good.cells.map(cell=>({...cell,results:cell.results.map(item=>
  item.status==='accepted'?{...item,visaAssessment:undefined}:item)}))}
 assert.equal(readAtVisaView(without),null)
})

test('AT held visitor reply expires at the 70-minute source-watch boundary before the fact lease',()=>{
 const officialDeadline='2026-11-17T11:10:00.000Z'
 const nearExpiry={...sample('CH'),verifiedAt:'2026-11-17T10:55:00.000Z',
  expiresAt:'2026-11-17T11:55:00.000Z'}
 const before=result(['CH'],[{country:'CH',data:nearExpiry}],new Date('2026-11-17T11:05:00.000Z'))
 assert.equal(before.shown.anzeige.paare[0]?.ampel,'gruen')
 const cell=before.view.cells[0]?.results[0]
 assert.equal(cell?.status,'accepted')
 if(cell?.status==='accepted')assert.equal(cell.expiresAt,officialDeadline)
 const after=result(['CH'],[{country:'CH',data:nearExpiry}],new Date(officialDeadline))
 assert.equal(after.view.cells[0]?.results[0]?.status,'unavailable')
 assert.equal(after.shown.anzeige.paare[0]?.ampel,'neutral')
})
