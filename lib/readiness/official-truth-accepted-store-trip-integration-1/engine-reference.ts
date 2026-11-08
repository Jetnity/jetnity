/** Lossless presentation reference within the unchanged engine's 80-character
 * limit. Full provenance identities remain in the envelope/store/AAD/witness. */
export function acceptedStoreRuleReference(receipt:unknown):string {
  if(typeof receipt!=='string'||receipt.length!==81)throw Error('accepted_store_receipt_invalid')
  const match=/^ot-provenance-v1:([a-f0-9]{64})$/.exec(receipt)
  if(!match)throw Error('accepted_store_receipt_invalid')
  return `ot-accepted-v1:${match[1]!}`
}
