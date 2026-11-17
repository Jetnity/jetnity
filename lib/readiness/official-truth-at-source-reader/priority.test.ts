import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readAtPassportPriority} from './priority'
const codes = ['IN','TR','CN','DE','PL','IT','US','UA','RO','FR',
'NL','GB','AT','ES','HU','SY','CZ','AF','CH','RU','HR','BE','IQ','PT','BG',
'BR','GR','IR','SK','PK','ER','TH','SO','VN','SE','NG','EG','XK','KR','LK',
'DK','PH','JP','LB','RS','LT','CA','CM','MA','IL']
const csv=(x=codes)=>['rank,nationality_iso2,name,score_basis,sources,notes',...x.map((p,i)=>
  (i+1)+','+p+',"name, fixture","proof\nfixture",official,notes')].join('\n')+'\n'

test('the 50-pass CSV requires all actual ranks with quoted multi-line metadata',()=>{
 const parsed=readAtPassportPriority(csv())
 assert.equal(parsed.ok,true)
 if(parsed.ok)assert.deepEqual(parsed.codes,codes)
 assert.deepEqual(readAtPassportPriority('\uFEFF'+csv()),parsed)
})

test('truncations, duplicate/invalid/missing priority and malformed quotes refuse',()=>{
 const invalid=[
  csv(codes.slice(0,49)),csv([...codes.slice(0,49),codes[0]]),
  csv([...codes].reverse()), csv().replace('1,IN,','2,IN,'),
  csv().replace('1,IN,','1,in,'),csv().replace('50,IL,','50,??,'),
  csv().replace('rank,nationality_iso2','rank,wrong'),
  csv().replace('"name, fixture"','"name"trailing'),
  csv()+'\0', 'x'.repeat(262145),
 ]
 for(const source of invalid)assert.equal(readAtPassportPriority(source).ok,false)
})
