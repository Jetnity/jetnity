import assert from 'node:assert/strict'
import {test} from 'node:test'
import {BG1_FULL_PROOF_NAMES,BG1_GRACE,BG1_SELF_HEAL_INITIAL,
 bg1RecoveryPolicyNext,bg1OwnerOnlyResolve,checkEntireBg1FullProof,
 type Bg1FullProof,type Bg1RecoveryPolicyState} from './bg1-transient-recovery-policy-v2'
const proof=Object.freeze(Object.fromEntries(BG1_FULL_PROOF_NAMES.map(x=>[x,true]))) as Bg1FullProof
const at=(hour:number,minute:number,seconds=4)=>`2026-11-20T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(seconds).padStart(2,'0')}Z`
const slot=(hour:number,minute:number)=>at(hour,minute,0)
const good=(s:Bg1RecoveryPolicyState,h:number,m:number)=>bg1RecoveryPolicyNext(s,{outcome:'complete',fullProof:proof,at:at(h,m),slot:slot(h,m)})
test('Native full protected evidence checks all 9 original BG1 invariant groups, not a cron succeeded flag',()=>{
 assert.equal(BG1_FULL_PROOF_NAMES.length,9)
 assert.equal(checkEntireBg1FullProof(proof),true)
 for(const name of BG1_FULL_PROOF_NAMES)assert.equal(checkEntireBg1FullProof({...proof,[name]:false}),false)
 assert.equal(BG1_GRACE.leaseSecondsAfterSlot,330)
})
test('One missed five-minute cron, network reset or restart does not latch; next FULL genuine audit restores current',()=>{
 const initial=good(BG1_SELF_HEAL_INITIAL,13,0)
 assert.equal(initial.result,'current')
 // At 13:05 there is no run at all (missed cron during server restart).
 const restored=good(initial,13,10)
 assert.equal(restored.result,'current')
 assert.equal(restored.integrityIncident,null)
 assert.equal(restored.alertCount,0)
 assert.notEqual(initial.validUntil,restored.validUntil)
 const timeout=bg1RecoveryPolicyNext(restored,{outcome:'transient',cause:'deadline_timeout',at:at(13,15),slot:slot(13,15)})
 assert.equal(timeout.integrityIncident,null)
 assert.equal(timeout.alertCount,0)
 const next=good(timeout,13,20)
 assert.equal(next.result,'current')
 const nextReplay=bg1RecoveryPolicyNext(next,{outcome:'complete',fullProof:proof,at:at(13,20,5),slot:slot(13,20)})
 assert.equal(nextReplay,next)
})
test('Security catalog change P7905 is NOT classified as outage, remains sticky after a new proof, and emits one deduplicated alert',()=>{
 const initial=good(BG1_SELF_HEAL_INITIAL,13,0)
 const tampered=bg1RecoveryPolicyNext(initial,{outcome:'integrity',cause:'protected_catalog_changed',at:at(13,5),slot:slot(13,5)})
 assert.equal(tampered.result,'integrity_locked')
 assert.equal(tampered.alertCount,1)
 assert.match(tampered.lastAlertId??'',/BG1-INTEGRITY.*protected_catalog_changed/)
 const checked=good(tampered,13,10)
 assert.equal(checked.result,'integrity_locked')
 assert.equal(checked.alertCount,1)
 const repeated=bg1RecoveryPolicyNext(checked,{outcome:'integrity',cause:'role_or_grant_drift',at:at(13,15),slot:slot(13,15)})
 assert.equal(repeated.alertCount,1)
 assert.equal(repeated.integrityIncident?.cause,'protected_catalog_changed')
})
test('A synthetic succeeded without the complete checked source, method and certificate proof becomes an integrity incident',()=>{
 const proofMissing={...proof,check_hrs_v1:false}
 const x=bg1RecoveryPolicyNext(BG1_SELF_HEAL_INITIAL,{outcome:'complete',fullProof:proofMissing,at:at(13,0),slot:slot(13,0)})
 assert.equal(x.result,'integrity_locked')
 assert.equal(x.integrityIncident?.cause,'unclassified_checker_error')
 assert.equal(x.lastFullProofAt,null)
 assert.equal(x.alertCount,1)
})
test('Only validated Owner and exact protected successor may clear a hard incident; no accidental automatic recovery or outdated retry',()=>{
 const incident=bg1RecoveryPolicyNext(good(BG1_SELF_HEAL_INITIAL,13,0),{
  outcome:'integrity',cause:'source_checksum_mismatch',at:at(13,5),slot:slot(13,5)})
 const later=good(incident,13,10)
 assert.throws(()=>bg1OwnerOnlyResolve(later,'wrong',true,true),/BG1_OWNER/)
 assert.throws(()=>bg1OwnerOnlyResolve(later,later.lastAlertId!,false,true),/BG1_OWNER/)
 assert.throws(()=>bg1OwnerOnlyResolve(later,later.lastAlertId!,true,false),/BG1_OWNER/)
 const reviewed=bg1OwnerOnlyResolve(later,later.lastAlertId!,true,true)
 assert.equal(reviewed.result,'temporarily_unavailable')
 assert.equal(reviewed.integrityIncident,null)
 assert.equal(good(reviewed,13,15).result,'current')
})
test('Clock regression and unverified new role preload are security controls, never automatic transient passes',()=>{
 const x=bg1RecoveryPolicyNext(BG1_SELF_HEAL_INITIAL,{
  outcome:'integrity',cause:'clock_regression',at:at(13,0),slot:slot(13,0)})
 assert.equal(x.result,'integrity_locked')
 assert.throws(()=>bg1RecoveryPolicyNext(BG1_SELF_HEAL_INITIAL,{
  outcome:'transient',cause:'server_restart',at:at(13,0,31),slot:slot(13,0)}),/WINDOW_REFUSED/)
})
