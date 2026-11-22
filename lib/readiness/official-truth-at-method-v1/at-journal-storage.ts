// The existing MA1 journal contract always asks for the canonical key.
// Redirect BOTH reads and writes to the exact method-specific session key.
// Never mix the previous CH→DE pending operations with the AT Owner release.
import { HUMAN_METHOD_STORAGE_KEY } from '../official-truth-product-v3/method/human-contract'

export const AT_HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:at:v1'
export const AT50_HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:at50:v1'
/** Separate Owner journal prevents an AT Rev1 or AT50 pending write becoming
 * a CH-only Rev2 selection. Pending original journals remain intact. */
export const AT_CH_V2_HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:at:ch-v2'

export function scopedMethodJournalStorage(
 storage: Pick<Storage,'getItem'|'setItem'>,
 selectedKey: typeof AT_CH_V2_HUMAN_METHOD_STORAGE_KEY | typeof AT50_HUMAN_METHOD_STORAGE_KEY | typeof AT_HUMAN_METHOD_STORAGE_KEY | typeof HUMAN_METHOD_STORAGE_KEY,
): Pick<Storage,'getItem'|'setItem'> {
 return Object.freeze({
  getItem: (_canonicalKey:string)=>storage.getItem(selectedKey),
  setItem: (_canonicalKey:string,value:string)=>storage.setItem(selectedKey,value),
 })
}
