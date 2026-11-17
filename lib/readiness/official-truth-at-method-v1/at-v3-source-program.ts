// Complete, exact Austrian BMI/BMEIA originals -> conservatively scoped V3
// RESEARCH_ONLY candidates. No method approval, source issuer receipt, DB write
// or public accepted answer can be created by this program.
import 'server-only'
import { inspectAtWholeSourceV2 } from './whole-source-v2'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'
import { readAtOfficialOriginals, atResearchOnlyPassportInventory } from '../official-truth-at-source-reader/at-bmi-research'
import type { AtRetrievalInput } from '../official-truth-at-source-reader/bind'

type Candidate = Readonly<{
  destinationCountryCode: 'AT'; citizenshipCountryCode: string
  documentType: 'passport'; relatedCitizenshipCountryCode: string
  route: 'direct_entry'; factKind: 'requirement_effect'; requirementType: 'visa'
  provisionalEffect: 'not_required'; visaMode: 'visa_exempt'
  sourceIds: readonly ['bmi-visa-nationality-matrix', 'bmi-general-entry', 'bmeia-bern-how-to-apply']
  qualification: 'offline_semantic_candidate'; approved: false; importable: false
}>
type Row = Readonly<{rank:number; citizenshipCountryCode:string; status:'derzeit nicht verfügbar'
  reason:'v3_method_and_hrs2_not_yet_approved'; candidate:Candidate|null}>
export type AtVisaV3CandidateBatch =
  | Readonly<{status:'unavailable'; approved: false; importable: false; reason:'source_or_passport_identity_refused'}>
  | Readonly<{status:'RESEARCH_ONLY'; approved:false; importable:false; candidates:number;
    originalCount:3; methodId:'jetnity-destination-primary-at-visa'; rows:readonly Row[]}>

const missing = ():AtVisaV3CandidateBatch=>Object.freeze({
  status:'unavailable', approved:false, importable:false, reason:'source_or_passport_identity_refused'
})

/** A 50-passport proposal is NOT fifty published facts.
 * Visa required and special/biometric/conditional exemptions stay unavailable
 * because the public input contains no residence permit, travel dates, stay
 * length, document subtype or individual status.
 * Only the clearly documented EU/EWR/CH free-movement category can become a
 * candidate; an actual SourceIssuer/HRS2/Method/BG1 sequence must reprove it. */
export function inspectAtVisaV3Candidates(
  originals:readonly AtRetrievalInput[], priority:readonly string[],
):AtVisaV3CandidateBatch {
  const proof=inspectAtWholeSourceV2(originals)
  if (proof.status!=='quarantined'
    || priority.length!==50 || new Set(priority).size!==50
    || priority.some(country=>!/^([A-Z]{2})$/.test(country))
    || AT_V3_METHOD_PREPARATION.destinationCountryCode!=='AT'
    || AT_V3_METHOD_PREPARATION.method.method.methodId!=='jetnity-destination-primary-at-visa') return missing()
  const parsed=readAtOfficialOriginals({visa:originals[0]?.body,shortStay:originals[1]?.body,bern:originals[2]?.body})
  const inventory=atResearchOnlyPassportInventory(parsed,priority)
  if (inventory.status!=='RESEARCH_ONLY' || inventory.rows.length!==50) return missing()
  const count=new Map<string,number>()
  for(const row of parsed.rules){
    if(!row.citizenshipCountryCode)continue
    count.set(row.citizenshipCountryCode,(count.get(row.citizenshipCountryCode)??0)+1)
  }
  const rows:Row[]=inventory.rows.map(row=>{
    const match=parsed.rules.find(r=>r.citizenshipCountryCode===row.citizenshipCountryCode)
    // CH requires a separate exact Bern counter; other EEA codes do not turn
    // Swiss residence permits or unrelated travel documents into an exemption.
    const clearlyVisaFree=match?.visa==='free_movement'
      && count.get(row.citizenshipCountryCode)===1
      && row.citizenshipCountryCode!=='AT'
      && row.provisionalVisaReading==='free_movement'
    const candidate:Candidate|null=clearlyVisaFree?Object.freeze({
      destinationCountryCode:'AT', citizenshipCountryCode:row.citizenshipCountryCode,
      documentType:'passport',relatedCitizenshipCountryCode:row.citizenshipCountryCode,
      route:'direct_entry',factKind:'requirement_effect',requirementType:'visa',
      provisionalEffect:'not_required',visaMode:'visa_exempt',
      sourceIds:Object.freeze(['bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply'] as const),
      qualification:'offline_semantic_candidate',approved:false,importable:false,
    }):null
    return Object.freeze({rank:row.rank,citizenshipCountryCode:row.citizenshipCountryCode,
      status:'derzeit nicht verfügbar' as const,reason:'v3_method_and_hrs2_not_yet_approved' as const,candidate})
  })
  return Object.freeze({status:'RESEARCH_ONLY',approved:false,importable:false,
    methodId:'jetnity-destination-primary-at-visa',originalCount:3 as const,
    candidates:rows.filter(r=>r.candidate!==null).length,rows:Object.freeze(rows)})
}
