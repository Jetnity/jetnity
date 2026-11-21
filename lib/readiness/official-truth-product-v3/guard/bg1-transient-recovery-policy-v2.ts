// BG1 availability-v2 candidate POLICY, not the installed audit/owner gate.
// No state, database, identity, roles, keys or network actions are performed.
// Only trusted server-side full-proof code may provide the observations.
// The actual protected BG1 auditor still owns issuer/publisher decisions.
// Preflight: exact protected catalog SHA + full data/history/privilege proof.
// No legal fact can be recovered from a cron 'succeeded' return alone.
export type Bg1TransientCause='single_missed_cron'|'server_restart'|'db_connection_reset'|'deadline_timeout'|'deadlock_retry'
export type Bg1IntegrityCause='protected_catalog_changed'|'source_checksum_mismatch'|'history_or_certificate_invalid'|
 'role_or_grant_drift'|'original_record_tamper'|'clock_regression'|'unclassified_checker_error'
export const BG1_FULL_PROOF_NAMES=Object.freeze([
 'check_control_v1','assert_catalog_v1','check_hma_v1','check_s1_v1','check_jobs_v1',
 'check_hrs_v1','check_certificates_v1','check_retirements_v1','assert_catalog_v1_after'
] as const)
export type Bg1FullProof=Readonly<Record<typeof BG1_FULL_PROOF_NAMES[number],boolean>>
export type Bg1RecoveryObservation=Readonly<
 |{outcome:'transient';cause:Bg1TransientCause;at:string;slot:string}
 |{outcome:'integrity';cause:Bg1IntegrityCause;at:string;slot:string}
 |{outcome:'complete';at:string;slot:string;fullProof:Bg1FullProof}
>
export type Bg1PolicyStatus='current'|'temporarily_unavailable'|'integrity_locked'
export type Bg1RecoveryPolicyState=Readonly<{
 lastObservedSlot:string|null;lastFullProofAt:string|null;validUntil:string|null;
 integrityIncident:Readonly<{cause:Bg1IntegrityCause;slot:string}>|null;
 lastAlertId:string|null;alertCount:number;result:Bg1PolicyStatus
}>
export const BG1_SELF_HEAL_INITIAL:Bg1RecoveryPolicyState=Object.freeze({
 lastObservedSlot:null,lastFullProofAt:null,validUntil:null,
 integrityIncident:null,lastAlertId:null,alertCount:0,result:'temporarily_unavailable',
})
export const BG1_GRACE=Object.freeze({
 tickMinutes:5,leaseSecondsAfterSlot:330,
 missedTicksCanCauseStickyIntegrityIncident:false,
 oneFullProofAfterTransientRestoresAvailability:true,
 roleConfigurationChangesNeverAutoAccepted:true,
 hardIncidentRequiresAuthenticatedOwner:true,
 publicationOnStaleOrMissingEvidence:false,
})
export function checkEntireBg1FullProof(v:Bg1FullProof):boolean{
 return BG1_FULL_PROOF_NAMES.every(name=>v[name]===true)
}
const date=(s:string):number=>{
 const n=Date.parse(s)
 if(!Number.isFinite(n)||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(s))
  throw Error('BG1_NON_CANONICAL_TIMESTAMP')
 return n
}
/** This reducer is deliberately *not* a new issuer or a substitute for the
 * actual protected DB proof. It tests a release candidate's state machine.
 * Full success must cover every original check and valid current epoch. */
export function bg1RecoveryPolicyNext(s:Bg1RecoveryPolicyState,o:Bg1RecoveryObservation):Bg1RecoveryPolicyState{
 const at=date(o.at),slot=date(o.slot)
 if(at<slot||at>slot+30000 ||slot%(5*60000)!==0)throw Error('BG1_DUE_PROOF_WINDOW_REFUSED')
 if(s.lastObservedSlot!==null&&slot<=date(s.lastObservedSlot))
  return s // Replay and duplicate old due cannot extend proof freshness.
 let incident=s.integrityIncident,alertCount=s.alertCount,alertId=s.lastAlertId
 if(o.outcome==='integrity'){
  if(!incident){
   incident=Object.freeze({cause:o.cause,slot:o.slot})
   alertId=`BG1-INTEGRITY:${o.slot}:${o.cause}`
   alertCount+=1
  }
 }
 if(o.outcome==='complete'&&!checkEntireBg1FullProof(o.fullProof)){
  if(!incident){
   incident=Object.freeze({cause:'unclassified_checker_error',slot:o.slot})
   alertId=`BG1-INTEGRITY:${o.slot}:unclassified_checker_error`
   alertCount+=1
  }
 }
 let full=s.lastFullProofAt,until=s.validUntil
 if(o.outcome==='complete'&&checkEntireBg1FullProof(o.fullProof)){
  full=o.at
  until=new Date(slot+BG1_GRACE.leaseSecondsAfterSlot*1000).toISOString()
 }
 const locked=incident!==null
 const result:Bg1PolicyStatus=locked?'integrity_locked':
   until!==null&&at<date(until)?'current':'temporarily_unavailable'
 return Object.freeze({
  lastObservedSlot:o.slot,lastFullProofAt:full,validUntil:until,
  integrityIncident:incident,lastAlertId:alertId,alertCount,result,
 })
}
/** Owner re-enables ONLY an exact acknowledged hard incident, when the
 * protected catalog baseline is independently attested and a full new proof
 * exists. Never call this for timing/cadence recovery: those are automatic. */
export function bg1OwnerOnlyResolve(
 s:Bg1RecoveryPolicyState,expectedAlertId:string,ownerAal2AndSessionVerified:boolean,
 exactReviewedIntegritySuccessorVerified:boolean
):Bg1RecoveryPolicyState {
 if(!s.integrityIncident||s.lastAlertId!==expectedAlertId
    ||!ownerAal2AndSessionVerified||!exactReviewedIntegritySuccessorVerified
    ||!s.lastFullProofAt||!s.validUntil)throw Error('BG1_OWNER_INTEGRITY_REVIEW_REQUIRED')
 return Object.freeze({...s,integrityIncident:null,result:'temporarily_unavailable'})
}
