// RESEARCH_ONLY: Austria (BMEIA + Austrian Federal Government) and EU official
// explanatory pages checked on 20.11.2026. No document, nationality, family
// relationship, residence or itinerary inferred from a passport code.
// These are legal CONDITIONS, not a positive visa decision or issuer.
export const AT_EU_FAMILY_ENTRY_SOURCES=Object.freeze({
 austrianVisa:'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
 austrianGovernment:'https://www.oesterreich.gv.at/de/lebenslagen/Ich-m%C3%B6chte-als-ausl%C3%A4ndischer-staatsb%C3%BCrger-in-%C3%B6sterreich-bleiben/EU-B%C3%BCrger_Angeh%C3%B6rige',
 euTravel:'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-family/',
 reviewedAt:'2026-11-20' as const,destination:'AT' as const,scope:'RESEARCH_ONLY' as const,
})
export const AT_EU_FAMILY_CONDITIONS=Object.freeze({
 // BMEIA: family members of EU/EEA/Swiss persons have a separate regime;
 // Austrian Government: third-country relatives MAY still need an entry visa.
 separateEuEeaSwissFamilyCase:true as const,
 // EU travel guidance distinguishes genuine Article 10/20 residence cards
 // from other national permits and the EU host/return-country context.
 actualEuEeaSwissSponsorAndLegalBasisVerified:false as const,
 actualFamilyRelationAndAccompanyOrJoinVerified:false as const,
 sponsorHomeCountryVsGenuineCrossBorderMovementVerified:false as const,
 actualValidResidenceCardOrPermitTypeIssuerAndValidityVerified:false as const,
 actualPassportIdentityDocumentAndHolderVerified:false as const,
 actualTravelRouteTransitDurationAndPurposeVerified:false as const,
 relevantAustriaAndSchengenBorderRulesVerified:false as const,
 euFeeWaiverAndAcceleratedProcedureIndividuallyApplicable:false as const,
})
export type AtEuFamilyEntryResearch=Readonly<{
 passportCode:string;group:'V'|'E';destination:'AT';scope:'RESEARCH_ONLY';
 sources:typeof AT_EU_FAMILY_ENTRY_SOURCES;terms:typeof AT_EU_FAMILY_CONDITIONS;
 individualFamilyDocumentLegalRuleVerified:false;
 ma1Bg1OwnerAal2Approved:false;
 personalVisaResult:'derzeit nicht verfügbar';
 personalEntryFormUrl:null;personalFeeAmountEur:null;
 publicationAllowed:false;
}>
export function atEuFamilyEntryResearch(code:string,group:'V'|'F'|'E'|'H'):AtEuFamilyEntryResearch|null{
 if(!/^[A-Z]{2}$/.test(code)||(group!=='V'&&group!=='E'))return null
 return Object.freeze({
  passportCode:code,group,destination:'AT',scope:'RESEARCH_ONLY',
  sources:AT_EU_FAMILY_ENTRY_SOURCES,terms:AT_EU_FAMILY_CONDITIONS,
  individualFamilyDocumentLegalRuleVerified:false,
  ma1Bg1OwnerAal2Approved:false,
  personalVisaResult:'derzeit nicht verfügbar',
  personalEntryFormUrl:null,personalFeeAmountEur:null,
  publicationAllowed:false,
 })
}
