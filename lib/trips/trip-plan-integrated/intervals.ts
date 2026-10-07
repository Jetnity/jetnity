/** Pure qualified-input math. Values are minutes on an explicitly shared axis, not device time. */
export type Interval = { id: string; start: number; end: number }
export type Axis = { kind: 'instant' | 'civil_only'; contextRef: string }
const valid = (x: Interval) => !!x.id && Number.isFinite(x.start) && Number.isFinite(x.end) && x.end > x.start
export function intervalUnion(values: readonly Interval[]) {
  if (values.length > 1000 || values.some(v => !valid(v)) || new Set(values.map(v => v.id)).size !== values.length) return null
  const union: { start: number; end: number; ids: string[] }[] = []
  for (const v of [...values].sort((a,b) => a.start-b.start || a.end-b.end || (a.id < b.id ? -1 : 1))) {
    const previous = union.at(-1)
    if (previous && v.start <= previous.end) { previous.end = Math.max(previous.end,v.end); previous.ids.push(v.id) }
    else union.push({ start:v.start,end:v.end,ids:[v.id] })
  }
  return union
}
export function scheduleGaps(intervals: readonly Interval[], axis: Axis | null, complete: boolean) {
  const union = intervalUnion(intervals)
  if (!axis?.contextRef || !union) return { state:'not_evaluable' as const, gaps:[], complete:false, basis:axis?.kind ?? 'none' }
  const gaps = union.slice(1).map((next,i) => ({ start:union[i].end,end:next.start, before:union[i].ids,after:next.ids }))
  return { state: gaps.length ? 'observed_gap' as const : 'no_gap' as const, gaps, complete, basis:axis.kind }
}
export type Phase = { id: string; phase: string; min: number; max: number; sourceRef: string;
  truth: 'saved_schedule' | 'code_policy' | 'verified_operational' | 'estimate'; includesRefs: string[] }
export type PhasePolicy = { id: string; version: string; sourceRef: string; validFrom: number; validUntil: number;
  transitionId: string; requiredPhases: string[]; sequentialPhases: string[] }

export function bufferReview(input: { transitionId: string; available: [number,number] | null; phases: readonly Phase[];
  policy: PhasePolicy | null; at: number | null }) {
  const no = (reason: string) => ({ state:'not_evaluable' as const, reason, required:null, residual:null })
  const p = input.policy
  if (!p?.id || !p.version || !p.sourceRef || p.transitionId !== input.transitionId || input.at === null ||
    ![input.at,p.validFrom,p.validUntil].every(Number.isFinite) || p.validUntil <= p.validFrom ||
    !p.requiredPhases.length || new Set(p.requiredPhases).size !== p.requiredPhases.length ||
    new Set(p.sequentialPhases).size !== p.sequentialPhases.length || input.at < p.validFrom || input.at >= p.validUntil) return no('policy_unknown_or_stale')
  const available = input.available
  if (!available || !available.every(Number.isFinite) || available[0] > available[1] || input.phases.length > 1000) return no('window_unknown')
  if (new Set(input.phases.map(x=>x.id)).size !== input.phases.length) return no('duplicate_phase')
  const byId = new Map(input.phases.map(x=>[x.id,x])); const included = new Set<string>()
  for (const x of input.phases) {
    if (!x.sourceRef || !Number.isFinite(x.min) || !Number.isFinite(x.max) || x.min < 0 || x.max < x.min) return no('phase_unknown')
    for (const id of x.includesRefs) {
      const sub = byId.get(id)
      if (!sub || id === x.id || included.has(id) || sub.includesRefs.length || sub.max > x.max || sub.min > x.min) return no('inclusion_ambiguous')
      included.add(id)
    }
  }
  // Inclusion cycles cannot become a zero total.
  if (input.phases.some(x => included.has(x.id) && x.includesRefs.length)) return no('inclusion_cycle')
  if (p.requiredPhases.some(phase => !input.phases.some(x=>x.phase === phase))) return no('required_phase_unknown')
  const groups = new Map<string,[number,number]>()
  for (const x of input.phases.filter(x=>!included.has(x.id))) {
    if (!p.sequentialPhases.includes(x.phase)) return no('phase_composition_unknown')
    const old = groups.get(x.phase) ?? [0,0]; groups.set(x.phase,[Math.max(old[0],x.min),Math.max(old[1],x.max)])
  }
  const required = [...groups.values()].reduce<[number,number]>((sum,x)=>[sum[0]+x[0],sum[1]+x[1]],[0,0])
  const estimate = input.phases.some(x=>x.truth === 'estimate')
  return { state:estimate ? 'estimate_only' as const : available[1] < required[0] ? 'below_policy' as const
    : available[0] >= required[1] ? 'meets_policy' as const : 'uncertain' as const,
    reason:'named_policy_only', required, residual:[available[0]-required[1],available[1]-required[0]] as [number,number] }
}
export function usableWindows(gap: Interval | null, occupied: readonly Interval[], proof: {
  axis: Axis | null; scheduleComplete: boolean; movementResolved: boolean; phasesResolved: boolean;
  policyResolved: boolean; exactPlacement: boolean; flexibleObligation: boolean; stale: boolean; estimate: boolean;
}) {
  if (!gap || !valid(gap) || proof.axis?.kind !== 'instant' || !proof.axis.contextRef || !proof.scheduleComplete || !proof.movementResolved ||
    !proof.phasesResolved || !proof.policyResolved || !proof.exactPlacement || proof.flexibleObligation || proof.stale) return { state:'unknown' as const, windows:[] }
  const union = intervalUnion(occupied)
  if (!union) return { state:'unknown' as const,windows:[] }
  let cursor=gap.start; const windows: {start:number;end:number}[]=[]
  for (const interval of union) {
    if (interval.end <= cursor || interval.start >= gap.end) continue
    if (interval.start > cursor) windows.push({start:cursor,end:Math.min(interval.start,gap.end)})
    cursor=Math.max(cursor,interval.end)
  }
  if (cursor<gap.end) windows.push({start:cursor,end:gap.end})
  return {state:proof.estimate ? 'estimate_only' as const : windows.length ? 'usable_in_plan' as const : 'zero_usable' as const,windows}
}
