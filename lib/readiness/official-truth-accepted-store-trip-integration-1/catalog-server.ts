import 'server-only'
import { quellenKatalogLesen, type OfficialTruthSourceCatalogTransport } from '../official-truth-source-catalog-server'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import type { AcceptedStoreBinding } from './binding-server'
import { bindingCurrent } from './binding-server'
import type { AcceptedStoreLifetime } from './lifetime-server'

/** Frozen, bounded catalog value from an actual package DB transaction. It is
 * not an externally supplied registry and cannot make another DB/source call. */
export function storeCatalogTransport(raw: unknown, binding: AcceptedStoreBinding, life: AcceptedStoreLifetime): OfficialTruthSourceCatalogTransport {
  if (!raw || typeof raw!=='object' || Array.isArray(raw) || Buffer.byteLength(JSON.stringify(raw),'utf8')>1_048_576) throw Error('catalog_invalid')
  const {acceptedStoreProfilePins,...canonical}=raw as Record<string,unknown>
  if (!Array.isArray(acceptedStoreProfilePins)) throw Error('profile_pin_missing')
  const p=binding.contract.source.binding
  if (acceptedStoreProfilePins.filter(row=>historicalValuesEqual(row,{identity_profile_id:p.identityProfileId,identity_profile_version:p.identityProfileVersion,current:true})).length!==1) throw Error('profile_pin_missing')
  return {aufrufen:async payload=>{
    life.assertCurrent()
    if (!bindingCurrent(binding)||!historicalValuesEqual(payload,{operation:'read_registry'})) throw Error('catalog_unavailable')
    return {ok:true,antwort:structuredClone(canonical)}
  }}
}
export async function readStoreCatalog(raw: unknown, binding: AcceptedStoreBinding, life: AcceptedStoreLifetime) {
  const result=await life.run(()=>quellenKatalogLesen({transport:storeCatalogTransport(raw,binding,life)}))
  life.assertCurrent()
  if (!bindingCurrent(binding)||!result.ok) throw Error('catalog_unavailable')
  return result.registry
}
