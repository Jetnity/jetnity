// Dev Research-only: 4 Schengen destinations x same canonical 50 passport priorities.
// Sources verified online 20.11.2026. A country's official general instructions
// and EU Annex I/II are NOT an individual destination/passport legal approval.
// Never publish travel permission from an Austrian bilateral exception.
import {AT_BMI_GROUPS,atBmiSourceReview,type AtBmiGroup} from './official-truth-at-method-v1/at-bmi-visa-groups-v1'
export const EU4_COUNTRIES=['IT','FR','ES','PT'] as const
export type Eu4Country=typeof EU4_COUNTRIES[number]
const SCHENGEN_VISA='https://home-affairs.ec.europa.eu/policies/schengen/schengen-visas/eu-visa-policy_en'
const RULE_2018_1806='https://eur-lex.europa.eu/eli/reg/2018/1806/2025-12-30/eng'
export const EU4_OFFICIAL_PRIMARIES=Object.freeze({
 IT:Object.freeze({
  government:'Italian Ministry of Foreign Affairs',
  visa:'https://www.esteri.it/en/ministero/sportello_info/domandefrequenti/sezione_visti_entrare_in_italia/',
  conditions:'https://www.esteri.it/en/servizi-opportunita/ingressosoggiornoinitalia/condizioni_ingresso/',
  application:'https://vistoperitalia.esteri.it/',
  distinction:'Citizenship, actual habitual residence, ordinary versus diplomatic passport, travel purpose and stay length; a visa does not guarantee entry.',
 }),
 FR:Object.freeze({
  government:'French government France-Visas',
  visa:'https://www.france-visas.gouv.fr/en/faq',
  conditions:'https://www.france-visas.gouv.fr/en/visa-de-court-sejour',
  application:'https://france-visas.gouv.fr/en/assistant-visa',
  distinction:'French European versus overseas territories have separate visa regimes. Real passport type, nationality, residence permit, travel purpose and time are necessary.',
 }),
 ES:Object.freeze({
  government:'Spanish Ministry of Interior and Foreign Affairs',
  visa:'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/',
  conditions:'https://www.exteriores.gob.es/Consulados/zurich/es/ServiciosConsulares/Paginas/index.aspx?scca=Visados&scco=Suiza&scd=294&scs=Condiciones+de+entrada+en+Espa%25u00f1a',
  application:null,
  distinction:'Passport validity, nationality-specific visa, residence, onward travel and exact financial-means requirement. Original financial amount conflicts must stay quarantined only for their affected rows.',
 }),
 PT:Object.freeze({
  government:'Portugal gov.pt, Direção-Geral dos Assuntos Consulares',
  visa:'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
  conditions:'https://www.gov.pt/guias/viajar-para-portugal',
  application:'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
  distinction:'Visa C is nationality-dependent, valid stay maximum 90 days in Schengen; documentation, resident status, travel purpose and children without parental accompaniment checked separately.',
 }),
} satisfies Record<Eu4Country,{government:string;visa:string;conditions:string;application:string|null;distinction:string}>)
export const EU4_CROSSCHECKS=Object.freeze({visa:SCHENGEN_VISA,annexes:RULE_2018_1806,consolidatedAsOf:'2025-12-30',reviewedAt:'2026-11-20'})

const rankCodes='IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split(' ')
type Group=AtBmiGroup
const countryKinds=new Map<string,Group>()
for(const k of (['V','F','E','H'] as const))for(const passport of AT_BMI_GROUPS[k]){
 if(countryKinds.has(passport))throw Error('EU4_AT_PRIORITY_NONUNIQUE')
 countryKinds.set(passport,k)
}
if(countryKinds.size!==50||rankCodes.length!==50||new Set(rankCodes).size!==50
 ||rankCodes.some(code=>!countryKinds.has(code)))throw Error('EU4_AT_PRIORITY_SET_MISMATCH')

export type Eu4PassportCase=Readonly<{
 destination:Eu4Country;passport:string;rank:number;comparativeBmiGroup:Group;
 // Group is only a research baseline until the destination issuer is bound.
 destinationCandidateGroup:Group;
 sourceUrls:Readonly<{primary:string;otherGovernment:string;euVisaPolicy:string;euAnnexes:string}>
 contextConditions:string;
 austrianNationalWaiverNonportable:boolean;euDiplomaticExceptionNeedsSeparateCheck:boolean;needsBiometricCheck:boolean;
 frenchTerritoryScopeNeedsCheck:boolean;spanishFinancialConflictLookupRequired:boolean;
 sourceLinksChecked:true;destinationSpecificSourceOriginalSealed:false;
 legalApplicabilityVerified:false;documentsVerified:false;
 routeAndDurationVerified:false;ownerMa1Aal2Authorized:false;
 publicationAllowed:false;entryVisaAnswer:'derzeit nicht verfügbar';
 entryVaccineAnswer:'derzeit nicht verfügbar';validFrom:null;feeAmount:null;
}>
export function eu4PassportCase(destination:Eu4Country,passport:string):Eu4PassportCase|null{
 if(!EU4_COUNTRIES.includes(destination)||!/^[A-Z]{2}$/.test(passport))return null
 const rank=rankCodes.indexOf(passport)
 const prior=countryKinds.get(passport)
 if(rank<0||!prior)return null
 // Austrian national/diplomatic waivers are nonportable. CN is a conditional EU
 // diplomatic-passport exception, RU a suspended EU concession; neither may
 // be incorrectly labelled an Austrian bilateral agreement or a positive waiver.
 // Every destination is its own national home case. Crucially the original
 // Austrian H row means EU free movement in IT/FR/ES/PT; NEVER AT home.
 const group:Group=passport===destination?'H':prior==='H'?'F':prior
 const reviewed=atBmiSourceReview(passport)
 if(!reviewed)return null
 const links=EU4_OFFICIAL_PRIMARIES[destination]
 return Object.freeze({
  destination,passport,rank:rank+1,comparativeBmiGroup:prior,
  destinationCandidateGroup:group,
  sourceUrls:Object.freeze({primary:links.visa,otherGovernment:links.conditions,
   euVisaPolicy:SCHENGEN_VISA,euAnnexes:RULE_2018_1806}),
  contextConditions:links.distinction,
  austrianNationalWaiverNonportable:reviewed.group==='E'&&reviewed.special?.includes('bilaterale')===true
   ||reviewed.group==='V'&&['IN','TR','PK','TH','EG','PH','MA'].includes(passport),
  euDiplomaticExceptionNeedsSeparateCheck:['CN','RU'].includes(passport),
  needsBiometricCheck:['UA','XK','RS'].includes(passport),
  frenchTerritoryScopeNeedsCheck:destination==='FR',
  spanishFinancialConflictLookupRequired:destination==='ES',
  sourceLinksChecked:true,destinationSpecificSourceOriginalSealed:false,
  legalApplicabilityVerified:false,documentsVerified:false,routeAndDurationVerified:false,
  ownerMa1Aal2Authorized:false,publicationAllowed:false,
  entryVisaAnswer:'derzeit nicht verfügbar',entryVaccineAnswer:'derzeit nicht verfügbar',
  validFrom:null,feeAmount:null,
 })
}
export const EU4_200_VISA_RESEARCH_CASES=Object.freeze(
 EU4_COUNTRIES.flatMap(destination=>rankCodes.map(passport=>{
  const rec=eu4PassportCase(destination,passport)
  if(!rec)throw Error('EU4_PASSPORT_SCOPE_MISSING')
  return rec
 }))
)
