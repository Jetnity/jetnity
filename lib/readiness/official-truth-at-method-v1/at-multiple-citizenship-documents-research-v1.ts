// AT50 RESEARCH_ONLY, official Austrian BMI, checked 20.11.2026.
// Actual presented border document and individual nationality control;
// Austrian dual nationals are a distinct domestic-law exception.
// No traveller PII, MRZ or biometrics, no approvals, no visitor positives.
import type {AtBmiGroup} from './at-bmi-visa-groups-v1'
export const AT_DUAL_BMI_SOURCES=Object.freeze({
 visaEntry:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/einreise/start.html',
 borderFaq:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/',
 checkedAt:'2026-11-20' as const,
})
export const AT_DUAL_BMI_TERMS=Object.freeze({
 nonAustrianMultipleNationalityDependsOnPresentedPassport:true as const,
 brazilEcuadorExampleIsNotAnIndividualIssuer:true as const,
 provedAustrianNationalityIsDistinctFromForeignVisaLaw:true as const,
 euSchengenDocumentPreferredByFaqNotAutomaticallySelected:true as const,
 sameEntryExitDocumentRecommendedNotCompulsory:true as const,
 actualIssuerIdentityDocumentAndPurposeMustBeChecked:true as const,
 euFreeMovementMustNotInheritThirdCountryPassportAgeRules:true as const,
})
export type AtDualDocumentResearch=Readonly<{
 passportResearchCode:string;destination:'AT';bmiCategory:AtBmiGroup;
 sourceVisa:string;sourceBorderFaq:string;checkedAt:'2026-11-20';
 researchOnly:true;terms:typeof AT_DUAL_BMI_TERMS;
 actualIssuedDocumentVerified:false;dualNationalAndAustrianIdentityVerified:false;
 chosenEntryExitDocumentVerified:false;routePurposeTransitVerified:false;
 residenceVisaAndFamilyExceptionVerified:false;passportValiditiesVerified:false;
 exactPrimaryOriginalSealedForPerson:false;individualLegalQualified:false;
 ma1Bg1OwnerAal2Authorized:false;publicationAllowed:false;
 individualVisaAnswer:'derzeit nicht verfügbar';
 individualEesAnswer:'derzeit nicht verfügbar';
 individualDocumentValidityAnswer:'derzeit nicht verfügbar';
 individualFormUrl:null;individualFeeEur:null;
}>
export function atDualDocumentResearch(code:string,group:AtBmiGroup):AtDualDocumentResearch{
 return Object.freeze({
  passportResearchCode:code,destination:'AT',bmiCategory:group,
  sourceVisa:AT_DUAL_BMI_SOURCES.visaEntry,
  sourceBorderFaq:AT_DUAL_BMI_SOURCES.borderFaq,
  checkedAt:AT_DUAL_BMI_SOURCES.checkedAt,researchOnly:true,
  terms:AT_DUAL_BMI_TERMS,actualIssuedDocumentVerified:false,
  dualNationalAndAustrianIdentityVerified:false,
  chosenEntryExitDocumentVerified:false,routePurposeTransitVerified:false,
  residenceVisaAndFamilyExceptionVerified:false,passportValiditiesVerified:false,
  exactPrimaryOriginalSealedForPerson:false,individualLegalQualified:false,
  ma1Bg1OwnerAal2Authorized:false,publicationAllowed:false,
  individualVisaAnswer:'derzeit nicht verfügbar',
  individualEesAnswer:'derzeit nicht verfügbar',
  individualDocumentValidityAnswer:'derzeit nicht verfügbar',
  individualFormUrl:null,individualFeeEur:null,
 })
}
