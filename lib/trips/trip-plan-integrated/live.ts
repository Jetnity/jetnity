import type { Trip } from '@/types/trips'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import { lokalePlanzeit } from '@/lib/trips/trip-timeline-core-1'
import { scheduleGaps, bufferReview, usableWindows, type Interval } from './intervals'
import { nextReview } from './next'

function civil(date:string|null,time:string|null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !lokalePlanzeit(time)) return null
  const n=Date.parse(`${date}T${time}:00Z`)
  return Number.isFinite(n) && new Date(n).toISOString().slice(0,10)===date ? n/60000 : null
}
/** Adapter keeps each explicitly shared civil axis separate and includes all unassigned inventory. */
export function tripGapContext(reise:Trip,dayId:string) {
  const temporal=tripZeitpruefung(reise)
  const groups=new Map<string,{intervals:Interval[];days:Set<string|null>}>()
  let unassessed=0
  for (const e of temporal.events) {
    if (e.role==='availability_span') continue
    const start=e.start.resolution,end=e.end.resolution
    const a=civil(e.start.date,e.start.time),b=civil(e.end.date,e.end.time)
    if (e.role!=='occupied_interval' || start.kind!=='civil_only' || end.kind!=='civil_only' || start.contextRef!==end.contextRef ||
      a===null || b===null || b<=a || e.reasons.some(x=>x==='duplicate_identity'||x==='conflicting_evidence'||x==='incomplete_snapshot')) {unassessed++;continue}
    const group=groups.get(start.contextRef)??{intervals:[],days:new Set<string|null>()}
    group.intervals.push({id:e.id,start:a,end:b}); group.days.add(e.dayId);groups.set(start.contextRef,group)
  }
  return {groups:[...groups.entries()].filter(([,g])=>g.days.has(dayId)).map(([contextRef,g])=>({contextRef,
    ...scheduleGaps(g.intervals,{kind:'civil_only',contextRef},unassessed===0&&groups.size===1)})),unassessed,
    // No qualified clock path is installed. This cannot become a device-based countdown.
    margin:bufferReview({transitionId:JSON.stringify([reise.id,dayId]),available:null,phases:[],policy:null,at:null}),
    usable:usableWindows(null,[],{axis:null,scheduleComplete:false,movementResolved:false,phasesResolved:false,policyResolved:false,exactPlacement:false,flexibleObligation:unassessed>0,stale:false,estimate:false}),
    next:nextReview([],null,{at:0,generation:'unconfigured',complete:false})}
}
