// The existing MA1 journal contract always asks for the canonical key.
// Redirect BOTH reads and writes to the exact method-specific session key.
// Never mix the previous CH→DE pending operations with the AT Owner release.
import { HUMAN_METHOD_STORAGE_KEY } from '../official-truth-product-v3/method/human-contract'

export const AT_HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:at:v1'
export const AT50_HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:at50:v1'

export function scopedMethodJournalStorage(
 storage: Pick<Storage,'getItem'|'setItem'>,
 selectedKey: typeof AT50_HUMAN_METHOD_STORAGE_KEY | typeof AT_HUMAN_METHOD_STORAGE_KEY | typeof HUMAN_METHOD_STORAGE_KEY,
): Pick<Storage,'getItem'|'setItem'> {
 return Object.freeze({
  getItem: (_canonicalKey:string)=>storage.getItem(selectedKey),
  setItem: (_canonicalKey:string,value:string)=>storage.setItem(selectedKey,value),
 })
}
