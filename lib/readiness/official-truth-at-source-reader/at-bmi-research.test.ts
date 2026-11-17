import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AT_PRIORITY_PREFIX, atResearchOnlyPassportInventory, inspectAtVisaMatrixIdentity,
  readAtOfficialOriginals, type AtOfficialRead } from './at-bmi-research'
import { V3_CUSTOMER_INFORMATION_TOPICS } from '../official-truth-product-v3/customer-information/topics'

const priority = [...AT_PRIORITY_PREFIX,'NL','GB','AT','ES','HU','SY','CZ','AF','CH','RU','HR','BE','IQ','PT','BG','BR','GR','IR','SK','PK','ER','TH','SO','VN','SE','NG','EG','XK','KR','LK','DK','PH','JP','LB','RS','LT','CA','CM','MA','IL']

test('independent TL review maps all real 50 passport priority rows, with zero accepted facts',()=>{
  assert.equal(new Set(priority).size,50)
  const read: AtOfficialRead = {
    visa:{ok:true,sha256:'x',edition:'2026-11-06'},shortStay:{ok:true,sha256:'x',edition:null},
    bern:{ok:true,sha256:'x',edition:null},priorityFile:'external_required',publicationAuthority:'none',
    rules:[{countryName:'Schweiz',citizenshipCountryCode:'CH',visa:'free_movement',
      identityCard:'accepted',stayFrame:'free_movement_up_to_three_months'}]
  }
  const result=atResearchOnlyPassportInventory(read,priority)
  assert.equal(result.status,'RESEARCH_ONLY')
  if(result.status!=='RESEARCH_ONLY')return
  assert.equal(result.rows.length,50)
  assert.equal(result.citizenships,50)
  assert.equal(result.acceptedFactCount,0)
  assert.equal(result.importable,false)
  assert.equal(result.rows.find(x=>x.citizenshipCountryCode==='CH')?.provisionalVisaReading,'free_movement')
  assert.ok(result.rows.every(x=>x.topics.length===V3_CUSTOMER_INFORMATION_TOPICS.length))
  assert.ok(result.rows.every(x=>x.topics.every(t=>t.status==='unavailable')))
  assert.ok(result.rows.every(x=>x.status==='derzeit nicht verfügbar'))
  assert.equal(result.rows[0]?.citizenshipCountryCode,'IN')
  assert.equal(result.rows[49]?.citizenshipCountryCode,'IL')
})

test('wrong/short/duplicated/forged priority or missing original data refuse the entire source package',()=>{
  const fake:AtOfficialRead={visa:{ok:true,sha256:'x',edition:null},shortStay:{ok:true,sha256:'x',edition:null},
    bern:{ok:true,sha256:'x',edition:null},priorityFile:'external_required',publicationAuthority:'none',rules:[]}
  for(const invalid of [[], priority.slice(0,49), [...priority.slice(0,49), 'CH'],
    [...priority.slice(1),'IN'], ['IN','TR','CN',...priority.slice(3)].reverse()]){
    assert.deepEqual(atResearchOnlyPassportInventory(fake,invalid),{status:'refused',reason:'priority_required'})
  }
  const unavailable:AtOfficialRead={...fake,visa:{ok:false,reason:'identity_mismatch'}}
  assert.deepEqual(atResearchOnlyPassportInventory(unavailable,priority),{status:'refused',reason:'source_unbound'})
  assert.equal(readAtOfficialOriginals({visa:'fake',shortStay:'fake',bern:'fake'}).rules.length,0)
  assert.equal(inspectAtVisaMatrixIdentity('this is not an original').ok,false)
})
