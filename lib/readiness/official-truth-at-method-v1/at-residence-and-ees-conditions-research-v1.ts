// RESEARCH_ONLY — BMI Austria border control and EES, read on 20.11.2026.
// A Gibraltar residence fact is not a British passport nationality; likewise
// an Austrian Withdrawal Agreement residence card is not an EU nationality.
// Never assert a visa/EES/document exemption from any passport code alone.
// No personal identity, address, document or biometric data is processed.
import {AT_BMI_GROUPS} from './at-bmi-visa-groups-v1'

export const AT_RESIDENCE_EES_BMI_SOURCE=Object.freeze({
 border:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/',
 ees:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/entry_exit_system/start_en.html',
 reviewedAt:'2026-11-20' as const,
 destination:'AT' as const,
 scope:'RESEARCH_ONLY' as const,
})

export const AT_RESIDENCE_EES_CONDITIONS=Object.freeze({
 gibraltarResidence:Object.freeze({
  // BMI reports a short-stay visa/EES exception for persons RESIDING in
  // Gibraltar under an EU–UK Gibraltar agreement signed 14.07.2026.
  // Signature or UK nationality alone is NOT proof of current applicability.
  agreementSignedOn:'2026-07-14' as const,
  describedShortStayDays:90,
  describedWindowDays:180,
  residenceNotNationalityIsTheKeyContext:true as const,
  applicableAgreementInForceAndLegalScopeVerified:false as const,
  actualGibraltarResidenceAndSupportingDocumentVerified:false as const,
  currentEntryConditionsAndBorderItineraryVerified:false as const,
 }),
 withdrawalAgreementAustriaResidence:Object.freeze({
  // Distinct BMI exception for a Withdrawal Agreement beneficiary residing
  // in Austria, with a valid Gibraltar/UK identity card subject to MRZ/ICAO.
  // This is NOT a blanket exemption for British or Gibraltar passports.
  austrianResidenceAndWithdrawalAgreementStatusVerified:false as const,
  actualIdIssuerValidityMrzAndIcaoVerified:false as const,
  austrianExternalBorderAndOtherRequirementsVerified:false as const,
  otherSchengenStatesRecognitionVerified:false as const,
 }),
 eesShortStayContext:Object.freeze({
  // EES is a border registration system, NOT an ETIAS authorisation/visa.
  // BMI describes short-stay external-border recording for applicable third-
  // country travellers; protected exceptions can depend on an actual
  // Schengen residence permit, residence card, long-stay visa or status.
  notEtiasNotVisa:true as const,
  actualExternalSchengenBorderCrossingVerified:false as const,
  actualPermitVisaDAndExceptionDocumentsVerified:false as const,
  airsideNoBorderCheckVsSchengenEntryVerified:false as const,
  individualEesRegistrationObligationVerified:false as const,
 }),
})
export type AtResidenceEesResearch=Readonly<{
 passportResearchCode:string;destination:'AT';sourceUrl:string;eesSourceUrl:string;
 scope:'RESEARCH_ONLY';terms:typeof AT_RESIDENCE_EES_CONDITIONS;
 identityNationalityAndResidenceChecked:false;documentRoutePurposeTransitVerified:false;
 originalLegallySealedForIndividual:false;hrs2Ma1Bg1OwnerAal2Authorized:false;
 personalEesRegistrationAnswer:'derzeit nicht verfügbar';
 personalVisaAnswer:'derzeit nicht verfügbar';
 personalTravelDocumentAnswer:'derzeit nicht verfügbar';
 personalOfficialFormUrl:null;personalFeeEur:null;publicationAllowed:false;
}>
const CODES=new Set(Object.values(AT_BMI_GROUPS).flat())
export function atResidenceEesResearch(code:string):AtResidenceEesResearch|null{
 if(!CODES.has(code))return null
 return Object.freeze({
  passportResearchCode:code,destination:'AT',
  sourceUrl:AT_RESIDENCE_EES_BMI_SOURCE.border,
  eesSourceUrl:AT_RESIDENCE_EES_BMI_SOURCE.ees,
  scope:'RESEARCH_ONLY',terms:AT_RESIDENCE_EES_CONDITIONS,
  identityNationalityAndResidenceChecked:false,
  documentRoutePurposeTransitVerified:false,
  originalLegallySealedForIndividual:false,hrs2Ma1Bg1OwnerAal2Authorized:false,
  personalEesRegistrationAnswer:'derzeit nicht verfügbar',
  personalVisaAnswer:'derzeit nicht verfügbar',
  personalTravelDocumentAnswer:'derzeit nicht verfügbar',
  personalOfficialFormUrl:null,personalFeeEur:null,publicationAllowed:false,
 })
}
