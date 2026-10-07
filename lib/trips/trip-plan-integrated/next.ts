/** Qualified mathematical consumer. Production has no admitted clock and uses Core planned order. */
export type NextEvent = { id: string; start: [number, number] | null; end: [number, number] | null;
  role: 'occupied' | 'start_only' | 'milestone' | 'unresolved' }
export type QualifiedClock = { state: 'qualified' | 'device_estimate' | 'stale' | 'unavailable';
  instant: number; uncertainty: number; sourceRef: string; sampledAt: number; validUntil: number;
  policyId: string; policyVersion: string; generation: string }
const range = (x: [number,number] | null): x is [number,number] => !!x && x.every(Number.isFinite) && x[0] <= x[1]
export function nextReview(events: readonly NextEvent[], clock: QualifiedClock | null, context: { at: number; generation: string; complete: boolean }) {
  const fallback = { mode:'planned_order' as const, next:[] as string[], current:[] as string[], states:[] as {id:string;state:string}[], qualification:'unavailable' }
  if (!clock || clock.state !== 'qualified' || !clock.sourceRef || !clock.policyId || !clock.policyVersion ||
    !clock.generation || clock.generation !== context.generation || ![clock.instant,clock.uncertainty,clock.sampledAt,clock.validUntil,context.at].every(Number.isFinite) ||
    clock.uncertainty < 0 || context.at < clock.sampledAt || context.at >= clock.validUntil || clock.validUntil <= clock.sampledAt ||
    events.length > 1000 || new Set(events.map(e=>e.id)).size !== events.length) return fallback
  // Context.at is on the same admitted axis, not an ambient/device clock.
  const elapsed = context.at-clock.sampledAt
  const now:[number,number]=[clock.instant+elapsed-clock.uncertainty,clock.instant+elapsed+clock.uncertainty]
  const states=events.map(event=> {
    if (!range(event.start) || event.role === 'unresolved' ||
      (event.role === 'occupied' && (!range(event.end) || event.end[0] <= event.start[1]))) return {id:event.id,state:'indeterminate'}
    if (event.role === 'milestone') return {id:event.id,state:event.start[0]>now[1]?'future':event.start[1]<now[0]?'past_by_schedule':event.start[0]===now[0]&&event.start[1]===now[1]?'current_by_schedule':'indeterminate'}
    if (event.start[0]>now[1]) return {id:event.id,state:'future'}
    if (event.role==='start_only') return {id:event.id,state:event.start[1]<=now[0]?'started_end_unknown':'indeterminate'}
    if (event.end![1]<=now[0]) return {id:event.id,state:'past_by_schedule'}
    if (event.start[1]<=now[0] && event.end![0]>now[1]) return {id:event.id,state:'current_by_schedule'}
    return {id:event.id,state:'indeterminate'}
  })
  const futureIds=new Set(states.filter(x=>x.state==='future').map(x=>x.id))
  const future=events.filter(e=>futureIds.has(e.id))
  const upper=Math.min(...future.map(e=>e.start![1]))
  const earliest=future.filter(e=>e.start![0]<=upper).sort((a,b)=>a.id<b.id?-1:1)
  const tied=earliest.length>1 && earliest.every(e=>e.start![0]===e.start![1] && e.start![0]===earliest[0].start![0])
  const unresolved=!context.complete || states.some(x=>x.state==='indeterminate')
  return {mode:earliest.length>1 ? tied?'tie' as const:'ambiguous' as const : 'qualified' as const,
    next:earliest.map(e=>e.id),current:states.filter(x=>x.state==='current_by_schedule').map(x=>x.id),states,
    qualification:unresolved?'next_determinable':'whole_declared_scope'}
}
