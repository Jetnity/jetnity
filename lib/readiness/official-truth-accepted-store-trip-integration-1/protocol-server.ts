import 'server-only'
import { z } from 'zod'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '../official-truth-integrated-pilot-bundle'
import { reserveSchema, committedSchema, headSchema } from './wire'
import type { AcceptedStoreBinding } from './binding-server'
import { bindingCurrent } from './binding-server'
import type { AcceptedStoreLifetime } from './lifetime-server'
import type { AcceptedStoreDatabase } from './database-server'

export function requireCurrent(binding:AcceptedStoreBinding,life:AcceptedStoreLifetime,remaining=0) {
  life.assertCurrent(remaining);if(!bindingCurrent(binding))throw Error('store_binding_closed')
}
export function checkReservation(raw:unknown,binding:AcceptedStoreBinding,life:AcceptedStoreLifetime,started:number,userId:string) {
  const r=reserveSchema.parse(raw)
  if(r.authorityUid!==userId||!historicalValuesEqual(r.binding,{codeDigest:binding.codeDigest,keyId:binding.key.id,
    keyPolicyDigest:binding.key.policyDigest,witnessDomain:binding.witness.domain,sourceMaxAgeSeconds:binding.sourceMaxAgeSeconds,
    retentionSeconds:binding.retentionSeconds,displaySeconds:binding.displaySeconds}))throw Error('reservation_binding_invalid')
  life.pinWindow(started,r.now,r.expiresAt);requireCurrent(binding,life);return r
}
export async function requireWitness(binding:AcceptedStoreBinding,life:AcceptedStoreLifetime,head:unknown) {
  requireCurrent(binding,life)
  const current=await life.run(()=>binding.witness.read(life.signal));requireCurrent(binding,life)
  if(!current||!historicalValuesEqual(headSchema.parse(current),headSchema.parse(head)))throw Error('restore_witness_unavailable')
}

/** Only the exact committed successor of the independently witnessed prior
 * may advance the external witness. Neither DB reset nor republication is a
 * recovery operation. The immutable operation survives reservation cleanup. */
export async function witnessCommitted(binding:AcceptedStoreBinding,db:AcceptedStoreDatabase,life:AcceptedStoreLifetime,
  observed:unknown,expected?:{operationId:string;receipt:string;stageDigest:string;prior:unknown}) {
  const op=committedSchema.parse(observed)
  if(op.profile!==ACCEPTED_STORE_TRIP_CLOSURE_PROFILE||op.contractDigest!==binding.contract.digest
    ||op.head.sequence!==op.prior.sequence+1||expected&&(op.operationId!==expected.operationId||op.receipt!==expected.receipt
      ||op.stageDigest!==expected.stageDigest||!historicalValuesEqual(op.prior,expected.prior)))throw Error('commit_binding_invalid')
  requireCurrent(binding,life)
  const witness=await life.run(()=>binding.witness.read(life.signal));requireCurrent(binding,life)
  if(!witness)throw Error('restore_witness_unavailable')
  if(!historicalValuesEqual(witness,op.head)) {
    if(!historicalValuesEqual(witness,op.prior))throw Error('restore_witness_mismatch')
    const moved=await life.run(()=>binding.witness.compareAndSwap(op.prior,op.head,op.operationId,life.signal))
    requireCurrent(binding,life);if(!moved)throw Error('witness_commit_unconfirmed')
  }
  await requireWitness(binding,life,op.head)
  await db.confirm({cell:binding.contract.id,operationId:op.operationId,ack:op.head})
  requireCurrent(binding,life)
  // A second distinct request confirms the acknowledgement's actual COMMIT.
  const confirmed=committedSchema.parse(await db.confirm({cell:binding.contract.id,operationId:op.operationId,ack:null}))
  requireCurrent(binding,life)
  if(!confirmed.witnessed||!historicalValuesEqual({...confirmed,now:op.now,witnessed:op.witnessed},op))throw Error('witness_ack_unconfirmed')
  await requireWitness(binding,life,op.head)
  return confirmed
}
export async function reconcilePending(binding:AcceptedStoreBinding,db:AcceptedStoreDatabase,life:AcceptedStoreLifetime) {
  const value=await db.confirm({cell:binding.contract.id,operationId:null,ack:null});requireCurrent(binding,life)
  const none=z.object({kind:z.literal('none'),head:headSchema,now:z.string()}).strict().safeParse(value)
  if(none.success){await requireWitness(binding,life,none.data.head);return 'clear' as const}
  await witnessCommitted(binding,db,life,value);return 'reconciled' as const
}
