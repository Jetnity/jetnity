// RESEARCH_ONLY — Austrian BMI primary and EU Regulation 2025/1208 Art. 5,
// crosschecked 20.11.2026. Only EU member-state national identity cards,
// not passports, Swiss/UK/Danish cards or third-country residence documents.
// No private MRZ/photo/age data collected. No visitor decision or grant.
export const AT_EU_ID_SOURCES=Object.freeze({
 bmi:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/',
 regulation:'https://eur-lex.europa.eu/eli/reg/2025/1208/oj/eng',
 reviewedAt:'2026-11-20' as const,
})
// Exactly the EU nationals in the official AT50 passport-priority archive.
// Swiss CH and British GB are not EU ID-card issuers; Denmark DK is not bound
// by Regulation 2025/1208 (Protocol 22). Never infer DK traveller status.
export const AT_EU_ID_PRIORITY_CODES=Object.freeze('AT DE PL IT RO FR NL ES HU CZ HR BE PT BG GR SK SE LT'.split(' '))
export const AT_EU_ID_ART5=Object.freeze({
 denmarkProtocol22NotBoundBy2025_1208:true as const,
 noFunctionalMrzOrIcaoMinimumCeasesBy:'2026-08-03' as const,
 otherNonConformingNationalIdCeasesBy:'2031-08-03' as const,
 earlierActualDocumentExpiryControls:true as const,
 grandfatherAgeOn:'2021-08-02' as const,
 grandfatherMinimumAge:70,
 grandfatherNeedsFunctionalMrzAndIcaoMinimum:true as const,
 grandfatherValidOnlyToActualDocumentExpiry:true as const,
 notApplicableToSwissBritishOrOtherThirdCountryId:true as const,
 notApplicableToPassport:true as const,
})
export type AtEuIdentityCardResearch=Readonly<{
 passportResearchCode:string;destination:'AT';sourceUrl:string;euLegalUrl:string;
 scope:'EU_MEMBER_STATE_NATIONAL_ID_CARD_ONLY';terms:typeof AT_EU_ID_ART5;
 actualCardIssuerAndTypeVerified:false;mrzIcaoAndExpiryVerified:false;
 actualAgeOn20210802Verified:false;grandfatherExceptionQualified:false;
 routeAndBorderContextVerified:false;destinationOriginalLegallySealed:false;
 hrs2Ma1Bg1OwnerAal2Authorized:false;
 personalIdentityCardTravelAnswer:'derzeit nicht verfügbar';personalVisaEffect:null;
 publicationAllowed:false;
}>
export function atEuIdentityCardResearch(code:string):AtEuIdentityCardResearch|null{
 if(!AT_EU_ID_PRIORITY_CODES.includes(code))return null
 return Object.freeze({
  passportResearchCode:code,destination:'AT',
  sourceUrl:AT_EU_ID_SOURCES.bmi,euLegalUrl:AT_EU_ID_SOURCES.regulation,
  scope:'EU_MEMBER_STATE_NATIONAL_ID_CARD_ONLY',terms:AT_EU_ID_ART5,
  actualCardIssuerAndTypeVerified:false,mrzIcaoAndExpiryVerified:false,
  actualAgeOn20210802Verified:false,grandfatherExceptionQualified:false,
  routeAndBorderContextVerified:false,destinationOriginalLegallySealed:false,
  hrs2Ma1Bg1OwnerAal2Authorized:false,
  personalIdentityCardTravelAnswer:'derzeit nicht verfügbar',
  personalVisaEffect:null,publicationAllowed:false,
 })
}
