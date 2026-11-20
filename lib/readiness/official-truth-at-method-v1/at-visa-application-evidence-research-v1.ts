// AT50 RESEARCH_ONLY: applicant requirements from Austria's BMEIA visa page,
// reviewed against the live destination-country authority on 20.11.2026.
// These apply to VISA APPLICATIONS in their proper categories; neither the
// 2-page requirement, fees, insurance nor the application form are blanket
// border-entry requirements for all 50 nationalities or all visa-free travellers.
// No individual original issuer, document or personal fee is certified here.
export const AT_VISA_APPLICATION_BMEIA_SOURCE=Object.freeze({
 url:'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
 checkedAt:'2026-11-20' as const,
 scope:'AUSTRIAN_VISA_APPLICATIONS_ONLY' as const,
})
export const AT_VISA_APPLICATION_BMEIA_TERMS=Object.freeze({
 passportApplication:Object.freeze({
  maxDocumentAgeYears:10,
  minimumMonthsValidBeyondVisaEnd:3,
  minimumBlankPagesForVisaApplication:2,
  notAnUnconditionalVisaFreeEntryRequirement:true as const,
 }),
 meansAndPurpose:Object.freeze({
  applicantMustShowPurpose:true as const,
  individualFundsOrElectronicDeclarationOfCommitment:true as const,
  fixedUniversalCashAmount:null,
 }),
 insurance:Object.freeze({
  minimumSchengenCoverEurForApplicableVisaApplication:30000,
  freeMovementFamilyExceptionNeedsIndividualProof:true as const,
 }),
 minor:Object.freeze({
  unaccompaniedByParentsParentalConsentMentioned:true as const,
  exactCustodyAndGuardianEvidenceNeedsCheck:true as const,
 }),
 transit:Object.freeze({
  connectingVisaIfRequiredAndTicketsMentioned:true as const,
  visaAEligibilityMustBeDecidedSeparately:true as const,
 }),
 // BMEIA published BASIC application fees; age, facilitation agreement,
 // family freedom of movement and exemption status are unresolved per person.
 // Do not output one of these numbers as an individual price.
 publishedBaseFeesEur:Object.freeze({
  schengenCAdult:90,schengenCAge6To12:45,
  nationalDOverAge6:195,nationalDUnderAge6:97,
  underAge6SchengenCExemptionMentioned:true as const,
  otherAgreementAndCategoryExemptionsMentioned:true as const,
 }),
 fraudNotice:Object.freeze({
  officialAuthorityWarnsAgainstExpensiveVisaAgencies:true as const,
  paidThirdPartyServiceIsNotTheOfficialVisaForm:true as const,
 }),
})
export type AtVisaApplicationEvidenceResearch=Readonly<{
 passportResearchCode:string;destination:'AT';
 sourceUrl:string;checkedAt:'2026-11-20';
 scope:'AUSTRIAN_VISA_APPLICATIONS_ONLY';
 terms:typeof AT_VISA_APPLICATION_BMEIA_TERMS;
 applicationRequiredForThisPersonVerified:false;
 actualPassportIssueExpiryAndBlankPagesVerified:false;
 financialPurposeAndReturnEvidenceVerified:false;
 actualInsuranceExceptionChecked:false;
 minorGuardianContextVerified:false;
 airportTransitVsEntryVerified:false;
 applicantAgeFeeExemptionsAndVisaCategoryChecked:false;
 destinationOriginalSealedForIndividual:false;
 hrs2Ma1Bg1OwnerAal2Authorized:false;
 personalPassportValidityAnswer:'derzeit nicht verfügbar';
 personalBlankPagesAnswer:'derzeit nicht verfügbar';
 personalFinancialMeansAnswer:'derzeit nicht verfügbar';
 personalMinorConsentAnswer:'derzeit nicht verfügbar';
 personalHealthInsuranceAnswer:'derzeit nicht verfügbar';
 personalFeeAmountEur:null;
 personalApplicationFormUrl:null;
 publicationAllowed:false;
}>
export function atVisaApplicationEvidenceResearch(passportResearchCode:string):AtVisaApplicationEvidenceResearch{
 return Object.freeze({
  passportResearchCode,destination:'AT',
  sourceUrl:AT_VISA_APPLICATION_BMEIA_SOURCE.url,
  checkedAt:AT_VISA_APPLICATION_BMEIA_SOURCE.checkedAt,
  scope:AT_VISA_APPLICATION_BMEIA_SOURCE.scope,
  terms:AT_VISA_APPLICATION_BMEIA_TERMS,
  applicationRequiredForThisPersonVerified:false,
  actualPassportIssueExpiryAndBlankPagesVerified:false,
  financialPurposeAndReturnEvidenceVerified:false,
  actualInsuranceExceptionChecked:false,
  minorGuardianContextVerified:false,
  airportTransitVsEntryVerified:false,
  applicantAgeFeeExemptionsAndVisaCategoryChecked:false,
  destinationOriginalSealedForIndividual:false,
  hrs2Ma1Bg1OwnerAal2Authorized:false,
  personalPassportValidityAnswer:'derzeit nicht verfügbar',
  personalBlankPagesAnswer:'derzeit nicht verfügbar',
  personalFinancialMeansAnswer:'derzeit nicht verfügbar',
  personalMinorConsentAnswer:'derzeit nicht verfügbar',
  personalHealthInsuranceAnswer:'derzeit nicht verfügbar',
  personalFeeAmountEur:null,personalApplicationFormUrl:null,
  publicationAllowed:false,
 })
}
