import 'server-only'
import { z } from 'zod'
import type { ExternalKind, ExternalResult } from './external'

const finite = z.number().finite()
const schema = z.object({
  version:z.literal('plan-context/v1'), kind:z.enum(['weather','hours','routing','reservation']),
  subject:z.string().min(1).max(200), location:z.string().min(1).max(200), precision:z.enum(['region','venue','directed_endpoints']),
  occurrence:z.string().min(1).max(200), region:z.string().min(1).max(80),
  source:z.string().min(1).max(200), sourceRef:z.string().url().startsWith('https://').max(2048),
  observedAt:finite, retrievedAt:finite, validFrom:finite, validUntil:finite,
  units:z.enum(['C_mm_mps','venue_interval','minutes','confirmation']),
  status:z.enum(['ok','empty','unavailable','error']), exceptionsComplete:z.boolean(),
  value:z.object({ temperatureC:finite.optional(),precipitationMm:finite.nonnegative().optional(),windMetersPerSecond:finite.nonnegative().optional(),
    open:z.boolean().optional(),durationMinutes:finite.nonnegative().optional(),confirmed:z.boolean().optional() }).strict().nullable(),
}).strict()
export type ContextQuery={kind:ExternalKind;subject:string;location:string;precision:'region'|'venue'|'directed_endpoints';occurrence:string;region:string;start:number;end:number}
export type ContextPolicy={id:string;version:string;source:string;sourceOrigin:string;kind:ExternalKind;maxAge:number}
/** These policy entries are software-test inputs until separately reviewed source activation. */
const LIVE_CONTEXT_POLICIES: readonly ContextPolicy[] = Object.freeze([])

/** Server-owned source selection, not an assertion supplied by a browser or response. No network I/O. */
export function contextConsumer(policies: readonly ContextPolicy[] = LIVE_CONTEXT_POLICIES) {
  const registered = policies.map(policy=>Object.freeze({...policy}))
  return (query:ContextQuery, payloads: readonly unknown[] | null, at:number | null):ExternalResult => {
    const output=(state:ExternalResult['state'],reason:string):ExternalResult=>({kind:query.kind,state,reason})
    const applicable=registered.filter(p=>p.kind===query.kind)
    if (!applicable.length) return output('unconfigured','Keine qualifizierte Quelle aktiviert.')
    if (!payloads) return output('unavailable','Quelle nicht verfügbar.')
    if (payloads.length===0) return output('unavailable','Ein leeres Transportarray ist kein bestätigtes leeres Quellergebnis.')
    if (payloads.length>16 || at===null || !Number.isFinite(at) || !Number.isFinite(query.start) || !Number.isFinite(query.end) || query.end<=query.start) return output('error','Zeitbezug oder Umfang ungültig.')
    const results:ExternalResult[]=[]
    for (const raw of payloads) {
      const parsed=schema.safeParse(raw)
      if (!parsed.success) return output('error','Quellformat ungültig.')
      const v=parsed.data
      const policy=applicable.filter(p=>p.source===v.source && p.sourceOrigin===new URL(v.sourceRef).origin)
      if (policy.length!==1 || !policy[0].id || !policy[0].version || !Number.isFinite(policy[0].maxAge) || policy[0].maxAge<0) return output('error','Quellenregel unbekannt.')
      if (v.kind!==query.kind || v.subject!==query.subject || v.location!==query.location || v.precision!==query.precision ||
        v.occurrence!==query.occurrence || v.region!==query.region || v.validFrom>query.start || v.validUntil<query.end) return output('error','Quelle passt nicht zu Ort und Zeitraum.')
      const unit={weather:'C_mm_mps',hours:'venue_interval',routing:'minutes',reservation:'confirmation'}[v.kind]
      if (v.units!==unit || (v.kind==='hours' && (v.precision!=='venue' || !v.exceptionsComplete)) ||
        (v.kind==='reservation' && v.precision!=='venue') || (v.kind==='routing' && v.precision!=='directed_endpoints')) return output('error','Einheiten, Genauigkeit oder Ausnahmen fehlen.')
      if (v.retrievedAt>at || v.observedAt>v.retrievedAt || v.validUntil<=v.validFrom) return output('error','Quellzeiten widersprüchlich.')
      if (at>=v.validUntil || at-v.retrievedAt>policy[0].maxAge || at-v.observedAt>policy[0].maxAge) return output('stale','Quellenstand veraltet.')
      if (v.status==='unavailable' || v.status==='error') return output(v.status,'Quelle konnte nicht ausgewertet werden.')
      if (v.status==='empty') {
        if (v.value!==null) return output('error','Leeres Ergebnis enthält einen Wert.')
        results.push(output('empty','Quelle hat ausdrücklich kein Ergebnis geliefert.')); continue
      }
      const expected=v.kind==='weather'?['temperatureC','precipitationMm','windMetersPerSecond']:v.kind==='hours'?['open']:v.kind==='routing'?['durationMinutes']:['confirmed']
      if (!v.value || expected.some(key=>!Object.hasOwn(v.value!,key)) || Object.keys(v.value).some(key=>!expected.includes(key))) return output('error','Quellwerte unvollständig oder fachfremd.')
      results.push({kind:query.kind,state:'current',reason:v.kind==='weather'?'Allgemeiner Wetterhinweis; keine Aktivitätsentscheidung.':'Ausschließlich für den benannten Quellenkontext.',
        sourceRef:v.sourceRef,observedAt:v.observedAt,retrievedAt:v.retrievedAt,validUntil:v.validUntil,value:v.value})
    }
    if (results.some(r=>r.state!==results[0].state || JSON.stringify(r.value)!==JSON.stringify(results[0].value))) return output('conflict','Quellen widersprechen sich.')
    return results[0]
  }
}
