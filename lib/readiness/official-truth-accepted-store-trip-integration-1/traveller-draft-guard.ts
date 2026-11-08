import type { Trip } from '@/types/trips'
import { travellerSlots } from '../party'
import { fingerprintFelder,serialisieren,type TravellerDraft } from '../trip-traveller-snapshot-workflow-1'

export const officialTravellerDraftMessage='Die Angaben zu Reisenden oder Dokumenten sind noch nicht bestätigt. Speichere die Änderungen oder lade die gespeicherten Angaben, bevor du die Einreiseprüfung erneut startest.'

/** Read the actual controller's current render state. No effect-delayed copy,
 * new authority, request, or automatic recovery is created by this guard. */
export function travellerDraftBlocksOfficial(trip:Trip,controller:{entwurf:(clientRef:string)=>TravellerDraft|null;seam?:'account'|'guest'}|null|undefined):boolean {
  if(!controller||controller.seam==='guest')return false
  return travellerSlots(trip).some(slot=>{
    const draft=controller.entwurf(slot.clientRef)
    if(!draft)return !!slot.traveller
    if(draft.dirty||draft.conflict||draft.reentry)return true
    if(draft.membership!==(slot.traveller?'present':'absent'))return true
    if(!slot.traveller)return false
    const serialized=serialisieren(draft)
    return serialized.art!=='ok'||fingerprintFelder(serialized.payload)!==fingerprintFelder(slot.traveller)
      ||draft.baselineFingerprint!==fingerprintFelder(slot.traveller)
  })
}
