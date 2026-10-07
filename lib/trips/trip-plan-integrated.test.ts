import assert from 'node:assert/strict'
import { test } from 'node:test'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripItem } from '@/types/trips'
import { aenderungsAuswirkung, buchungstext, gespeicherteKosten, koordinaten, planSnapshot, tagesOrte } from './trip-plan-integrated/day'
import { punktAendern, manuellerInhaltSchema } from './trip-plan-integrated/manual'
import { intervalUnion, scheduleGaps, usableWindows, bufferReview, type PhasePolicy, type Phase } from './trip-plan-integrated/intervals'
import { movementCoverage, type MovementNeed, type MovementCandidate } from './trip-plan-integrated/movements'
import { nextReview, type QualifiedClock, type NextEvent } from './trip-plan-integrated/next'
import { contextConsumer, type ContextQuery, type ContextPolicy } from './trip-plan-integrated/external-admission'
import { externalDefault } from './trip-plan-integrated/external'

const item = (changes: Partial<TripItem> = {}): TripItem => ({...beispielreise().days[0].items[0], provider:null,externalRef:null,bookingUrl:null,...changes})
const graph = (...items:TripItem[]) => { const r=beispielreise(); return {...r,days:r.days.map((d,i)=>({...d,items:i===0?items:[]}))} }
const content = {kind:'activity' as const,title:'Geändert',note:null,startsOn:null,startsAt:'12:00',endsOn:null,endsAt:null}

test('manual change uses explicit fields, preserves money/booking, and placement does not invent dates',()=>{
  const original=item({startsOn:null,bookingStatus:'booked',bookingSource:'user'})
  const r=graph(original)
  const next=punktAendern(r,original,{art:'inhalt',inhalt:content,dayId:'day-2'})
  const saved=next.days[1].items[0]
  assert.equal(saved.startsOn,null);assert.equal(saved.endsOn,null);assert.equal(saved.endsAt,null)
  assert.equal(saved.priceAmount,original.priceAmount);assert.equal(saved.bookingStatus,'booked');assert.equal(saved.stageId,original.stageId)
  assert.equal(next.days[0].items.length,0);assert.equal(r.days[0].items[0],original)
  assert.throws(()=>punktAendern(next,original,{art:'platzierung',dayId:null}),/inzwischen/)
  assert.throws(()=>punktAendern(r,original,{art:'platzierung',dayId:'foreign'}),/gehört/)
  assert.throws(()=>punktAendern(graph(original,original),original,{art:'platzierung',dayId:null}),/inzwischen/)
})
for(const protectedFields of [{kind:'flight' as const},{kind:'stay' as const},{kind:'transfer' as const},{provider:'source'},{externalRef:'provider-id'},{bookingUrl:'https://example.test'}]) {
  test(`protected ${JSON.stringify(protectedFields)} only placement`,()=>{
    const p=item(protectedFields), r=graph(p)
    assert.throws(()=>punktAendern(r,p,{art:'inhalt',inhalt:content,dayId:'day-1'}))
    const moved=punktAendern(r,p,{art:'platzierung',dayId:null}).ohneTag[0]
    assert.deepEqual(moved,{...p,dayId:null})
  })
}
test('closed input rejects authority and ambiguous rollover; missing endpoints remain missing',()=>{
  assert.equal(manuellerInhaltSchema.safeParse({...content,bookingStatus:'booked'}).success,false)
  assert.equal(manuellerInhaltSchema.safeParse({...content,startsOn:'2026-10-07',endsOn:'2026-10-07',startsAt:'23:00',endsAt:'01:00'}).success,false)
  assert.equal(manuellerInhaltSchema.safeParse({...content,startsOn:'2026-10-07',endsOn:'2026-10-08',startsAt:'23:00',endsAt:'01:00'}).success,true)
  assert.equal(manuellerInhaltSchema.parse(content).endsOn,null)
})
test('costs: original currency, explicit zero, missing/invalid, duplicate identity, unassigned and whole stay',()=>{
  const stay=item({id:'stay',kind:'stay',priceAmount:300,priceCurrency:'CHF',endsOn:'2026-10-10'})
  const r=graph(stay,stay,item({id:'eur',priceAmount:18,priceCurrency:'EUR'}),item({id:'zero',priceAmount:0,priceCurrency:'CHF'}),item({id:'missing',priceAmount:null,priceCurrency:null}),item({id:'invalid',priceAmount:NaN,priceCurrency:'CHF'}))
  r.ohneTag=[item({id:'outside',dayId:null,priceAmount:17,priceCurrency:'CHF'})]
  const c=gespeicherteKosten(r,'day-1')
  assert.deepEqual(c.totals.map(t=>[t.currency,t.amount]),[['CHF',300],['EUR',18]])
  assert.equal(c.missing,1);assert.equal(c.invalid,1);assert.equal(c.complete,false)
  assert.deepEqual(c.totals[0].itemIds,['stay','zero']);assert.equal(gespeicherteKosten(r,null).totals[0].amount,17)
  assert.equal(gespeicherteKosten(r,'day-2').totals.length,0)
  r.days[0].items.push({...stay,priceAmount:400})
  assert.deepEqual(gespeicherteKosten(r,'day-1').ambiguous,['stay'])
  assert.equal(gespeicherteKosten(r,'day-1').totals[0].amount,0)
})
test('invalid prices never inflate totals',()=>{
  for(const amount of [-1,Infinity,0.001,Number.MAX_SAFE_INTEGER]) assert.equal(gespeicherteKosten(graph(item({priceAmount:amount})),'day-1').invalid,1)
  assert.equal(gespeicherteKosten(graph(item({priceAmount:0.1}),item({id:'two',priceAmount:0.2})),'day-1').totals[0].amount,0.3)
})
test('booking user confirmation differs from selected and note is not a booking',()=>{
  assert.match(buchungstext(item({kind:'stay',bookingStatus:'booked',bookingSource:'user'})),/von dir/)
  assert.match(buchungstext(item({kind:'stay'})),/nicht bestätigt/)
  assert.equal(buchungstext(item({kind:'note',note:'Confirmed'})),'Geplant')
})
test('stage coordinates never become venue pins, zero valid, impossible/nonfinite rejected',()=>{
  const r=graph(item(),item({id:'same',title:item().title}));r.stages[0]={...r.stages[0],latitude:0,longitude:0}
  const locations=tagesOrte(r,'day-1',r.days[0].items)
  assert.deepEqual(locations.stage?.point,{latitude:0,longitude:0});assert.equal(locations.stage?.precision,'Etappenort')
  assert.equal(locations.stops.length,2);assert(locations.stops.every(s=>s.point===null))
  for(const [a,b] of [[91,0],[0,181],[NaN,0],[0,Infinity]])assert.equal(koordinaten(a,b),null)
})
test('impact exact snapshots, no revision shortcut, no history invented or cross-trip dependency',()=>{
  const r=graph(item()),before=planSnapshot(r)
  const changed={...r,days:r.days.map((d,i)=>({...d,items:i===0?d.items.map(p=>({...p,startsAt:'14:00',priceAmount:20})):d.items}))}
  assert.equal(changed.revision,r.revision)
  const after=planSnapshot(changed);after.tasks=[{id:'task',itemId:'item-1'},{id:'task',itemId:'item-1'},{id:'unlinked',itemId:null}]
  const result=aenderungsAuswirkung(before,after)!
  assert.equal(result.count,1);assert.deepEqual(result.changed,['item-1']);assert.deepEqual(result.targets[0].reasons,['item-1'])
  assert.equal(aenderungsAuswirkung(null,after),null);assert.equal(aenderungsAuswirkung(before,{...after,tripId:'foreign'}),null)
  assert.deepEqual(aenderungsAuswirkung(before,{...before,items:[]})?.changed,['item-1'])
})

const edge=(id:string)=>({namespace:'airport',id,precision:'facility' as const,sourceRef:`fixture:${id}`})
const need:MovementNeed={id:'need',tripId:'trip',from:edge('A'),to:edge('B'),occurrence:'leg1:transition1',ordered:true,surface:true,sourceItemId:'flight'}
const candidate:MovementCandidate={id:'transfer',tripId:'trip',from:edge('A'),to:edge('B'),occurrence:need.occurrence,completeChain:true}
test('movement: unique directed occurrence only; unknown candidates block missing',()=>{
  assert.equal(movementCoverage(need,[candidate],true).state,'present_in_plan')
  assert.equal(movementCoverage(need,[],true).state,'missing_in_plan')
  assert.equal(movementCoverage(need,[],false).state,'not_evaluable')
  for(const c of [{...candidate,occurrence:null},{...candidate,from:null},{...candidate,completeChain:false},{...candidate,from:{...edge('A'),precision:'terminal' as const}}])
    assert.equal(movementCoverage(need,[c],true).state,'not_evaluable')
  assert.equal(movementCoverage(need,[candidate,{...candidate,id:'duplicate'}],true).state,'not_evaluable')
  assert.equal(movementCoverage(need,[candidate,candidate],true).state,'not_evaluable')
  assert.equal(movementCoverage(need,[{...candidate,tripId:'foreign'}],true).state,'not_evaluable')
})
test('wrong direction/occurrence is not coverage; same facility is not zero travel',()=>{
  assert.equal(movementCoverage(need,[{...candidate,from:edge('B'),to:edge('A')}],true).state,'missing_in_plan')
  assert.equal(movementCoverage(need,[{...candidate,occurrence:'other'}],true).state,'missing_in_plan')
  assert.equal(movementCoverage({...need,to:need.from},[],true).state,'not_evaluable')
  assert.equal(movementCoverage({...need,ordered:false},[],true).state,'not_evaluable')
  assert.equal(movementCoverage({...need,from:{...edge('A'),precision:'city'}},[],true).state,'not_evaluable')
})
test('union prevents false gaps in nested, touching and midnight intervals',()=>{
  const intervals=[{id:'long',start:1380,end:1560},{id:'nested',start:1400,end:1420},{id:'touch',start:1560,end:1600},{id:'later',start:1700,end:1750}]
  assert.deepEqual(intervalUnion(intervals)?.map(x=>[x.start,x.end]),[[1380,1600],[1700,1750]])
  const gaps=scheduleGaps(intervals,{kind:'civil_only',contextRef:'same-clock'},false)
  assert.equal(gaps.gaps[0].start,1600);assert.equal(gaps.basis,'civil_only');assert.equal(gaps.complete,false)
  assert.deepEqual(scheduleGaps([],{kind:'instant',contextRef:'UTC'},true).gaps,[])
  assert.equal(intervalUnion([{id:'x',start:0,end:0}]),null)
})
const policy:PhasePolicy={id:'synthetic',version:'1',sourceRef:'fixture',validFrom:0,validUntil:100,transitionId:'edge',requiredPhases:['travel','boarding'],sequentialPhases:['travel','boarding']}
const phases:Phase[]=[{id:'travel',phase:'travel',min:10,max:20,sourceRef:'fixture',truth:'code_policy',includesRefs:[]},{id:'boarding',phase:'boarding',min:20,max:30,sourceRef:'fixture',truth:'code_policy',includesRefs:[]}]
test('phase composition: named policy, maxima per phase, inclusion dedup, unknown never zero',()=>{
  const base={transitionId:'edge',available:[40,50] as [number,number],phases,policy,at:10}
  assert.deepEqual(bufferReview(base).required,[30,50]);assert.equal(bufferReview(base).state,'uncertain')
  assert.deepEqual(bufferReview({...base,phases:[...phases,{...phases[0],id:'duplicate-phase',min:15,max:25}]}).required,[35,55])
  assert.equal(bufferReview({...base,policy:null}).state,'not_evaluable')
  assert.equal(bufferReview({...base,policy:{...policy,validUntil:NaN}}).state,'not_evaluable')
  assert.equal(bufferReview({...base,phases:phases.slice(0,1)}).state,'not_evaluable')
  assert.equal(bufferReview({...base,phases:phases.map(x=>({...x,truth:'estimate'}))}).state,'estimate_only')
  const inclusive=[{...phases[0],min:40,max:60,includesRefs:['boarding']},phases[1]]
  assert.deepEqual(bufferReview({...base,phases:inclusive}).required,[40,60])
  assert.equal(bufferReview({...base,phases:[{...phases[0],includesRefs:['boarding']},{...phases[1],includesRefs:['travel']}]}).state,'not_evaluable')
})
test('usable window requires all proof terms and never promotes civil or flexible time',()=>{
  const proof={axis:{kind:'instant' as const,contextRef:'UTC'},scheduleComplete:true,movementResolved:true,phasesResolved:true,policyResolved:true,exactPlacement:true,flexibleObligation:false,stale:false,estimate:false}
  const gap={id:'gap',start:0,end:100}
  assert.deepEqual(usableWindows(gap,[{id:'occupied',start:20,end:50}],proof).windows,[{start:0,end:20},{start:50,end:100}])
  for(const change of [{axis:{kind:'civil_only' as const,contextRef:'local'}},{scheduleComplete:false},{movementResolved:false},{phasesResolved:false},{policyResolved:false},{exactPlacement:false},{flexibleObligation:true},{stale:true}])
    assert.equal(usableWindows(gap,[],{...proof,...change}).state,'unknown')
  assert.equal(usableWindows(gap,[],{...proof,estimate:true}).state,'estimate_only')
})
const clock:QualifiedClock={state:'qualified',instant:10,uncertainty:0,sourceRef:'synthetic',sampledAt:10,validUntil:20,policyId:'synthetic',policyVersion:'1',generation:'g1'}
const ctx={at:10,generation:'g1',complete:true}
const event=(id:string,start:[number,number],end:[number,number]|null=null):NextEvent=>({id,start,end,role:end?'occupied':'start_only'})
test('qualified next: equality, occupied half-open, start-only and milestones',()=>{
  const r=nextReview([event('current',[10,10],[15,15]),event('past',[0,0],[10,10]),event('unknown-end',[5,5]),{...event('instant',[10,10]),role:'milestone'},event('next',[12,12])],clock,ctx)
  assert.deepEqual(r.current,['current','instant']);assert.deepEqual(r.next,['next'])
  assert.equal(r.states.find(x=>x.id==='past')?.state,'past_by_schedule');assert.equal(r.states.find(x=>x.id==='unknown-end')?.state,'started_end_unknown')
})
test('qualified next ties, overlapping uncertainty, unresolved competition and expired/resumed fallback',()=>{
  assert.equal(nextReview([event('a',[12,12]),event('b',[12,12])],clock,ctx).mode,'tie')
  assert.equal(nextReview([event('a',[12,15]),event('b',[14,17])],clock,ctx).mode,'ambiguous')
  assert.equal(nextReview([event('a',[12,12]),{...event('b',[1,1]),start:null}],clock,ctx).qualification,'next_determinable')
  for(const [c,context] of [[null,ctx],[{...clock,state:'device_estimate'},ctx],[clock,{...ctx,at:20}],[clock,{...ctx,generation:'resumed'}],[clock,{...ctx,at:9}]] as const)
    assert.equal(nextReview([],c as QualifiedClock|null,context).mode,'planned_order')
  assert.deepEqual(nextReview([],clock,ctx).next,[])
})

const q:ContextQuery={kind:'hours',subject:'venue-1',location:'venue-1',precision:'venue',occurrence:'visit-1',region:'CH',start:100,end:110}
const source:ContextPolicy={id:'synthetic',version:'1',source:'fixture',sourceOrigin:'https://fixture.invalid',kind:'hours',maxAge:20}
const payload={version:'plan-context/v1',...q,source:'fixture',sourceRef:'https://fixture.invalid/hours',observedAt:95,retrievedAt:98,validFrom:90,validUntil:120,units:'venue_interval',status:'ok',exceptionsComplete:true,value:{open:true}}
const {start:_start,end:_end,...data}=payload
const consume=contextConsumer([source])
test('external: closed software consumer and zero-I/O default are separate from live activation',()=>{
  assert.equal(contextConsumer()(q,[data],100).state,'unconfigured');assert.equal(externalDefault('weather').state,'unconfigured')
  assert.equal(consume(q,[data],100).state,'current');assert.equal(consume(q,null,100).state,'unavailable')
  assert.equal(consume(q,[{...data,status:'empty',value:null}],100).state,'empty')
  assert.equal(consume(q,[],100).state,'unavailable')
  assert.equal(consume(q,[{...data,status:'error',value:null}],100).state,'error')
  assert.equal(consume(q,[data,{...data,value:{open:false}}],100).state,'conflict')
})
for(const change of [{verified:true},{currency:'CHF'},{subject:'other'},{location:'other'},{occurrence:'other'},{region:'IT'},{units:'minutes'},{precision:'region'},{exceptionsComplete:false},{sourceRef:'https://untrusted.invalid/hours'},{value:{confirmed:true}},{retrievedAt:101}]) {
  test(`external rejects ${JSON.stringify(change)}`,()=>assert.equal(consume(q,[{...data,...change}],100).state,'error'))
}
test('external stale and unknown policy remain unavailable for conclusions',()=>{
  assert.equal(consume(q,[{...data,observedAt:20}],100).state,'stale')
  assert.equal(contextConsumer([{...source,version:''}])(q,[data],100).state,'error')
})
