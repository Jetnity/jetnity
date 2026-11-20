// AT50 RESEARCH_ONLY — Austrian airport airside transit visa A, BMI 06.11.2026.
// Footnote 3 of the Austrian visa matrix. Do NOT derive an individualized visa
// requirement/exemption from the citizenship group, an unverified exception,
// or another Schengen country's transit rules. This source is AT-only.
export const AT_VISA_A_BMI_SOURCE=Object.freeze({
 url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 edition:'2026-11-06' as const,
 checkedAt:'2026-11-20' as const,
 footnote:'3' as const,
})
// Every exception needs the *actual* document, validity, applicability and
// precise itinerary checked. The list below is a research taxonomy, not a
// decision tree: e.g. travel to/from a visa-issuing third country is material.
export const AT_VISA_A_CONDITIONAL_EXCEPTIONS=Object.freeze([
 Object.freeze({id:'schengen_c_d_or_residence',proof:'Valid uniform Schengen visa C, national long-stay visa D or Schengen-member residence permit'}),
 Object.freeze({id:'ireland_cyprus_residence',proof:'Valid Irish or Cypriot residence permit; issuing state and document category checked'}),
 Object.freeze({id:'annex_v_residence',proof:'Valid Annex V-listed readmission-guaranteeing residence permit issued by Andorra, Canada, Japan, San Marino, United Kingdom or USA'}),
 Object.freeze({id:'dutch_overseas_residence',proof:'Valid residence permit for Aruba, Curaçao, Sint Maarten, Bonaire, St Eustatius or Saba'}),
 Object.freeze({id:'specified_third_country_visa_route',proof:'Specific valid visa for listed countries/territories, including legacy Bulgarian/Romanian/Croatian visas only before the BMI cut-off dates; travel to, from or returning from visa-issuing country and itinerary must match'}),
 Object.freeze({id:'covered_family_member',proof:'Covered EU/EEA/Swiss family member under free-movement law, or qualifying UK Withdrawal Agreement family member; including the special outside-EU origin/destination accompaniment condition'}),
 Object.freeze({id:'diplomatic_passport',proof:'Actual valid diplomatic passport category verified, not merely an ordinary passport from the same country'}),
 Object.freeze({id:'chicago_convention_aircrew',proof:'Qualifying aircraft crew member and Chicago Convention contracting-state nationality verified'}),
] as const)

// Read-only crosscheck of all 50 pinned Dev archive rows on 20.11.2026:
// 9 "Ja", 21 "Nein", 19 EU free movement, 1 Austrian home row.
// All nine "Ja" rows were also checked against the current official BMI HTML
// (same edition). These archive-only flags MUST NOT feed personal visa output.
export const AT_VISA_A_BMI_ARCHIVE_ROW_CHECK=Object.freeze({
 originalSha256:'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
 sourceEdition:'2026-11-06' as const,
 checkedAt:'2026-11-20' as const,
 sourceOnly:true as const,
 yesCodes:Object.freeze(['SY','AF','IQ','IR','PK','ER','SO','NG','LK'] as const),
})

export type AtAirportTransitVisaAResearch=Readonly<{
 passportResearchCode:string;destination:'AT';sourceUrl:string;sourceEdition:'2026-11-06';
 footnote:'3';austrianAirsideOnly:true;otherSchengenTransitRuleTransferAllowed:false;
 airportAndAirsideItineraryVerified:false;actualBmiPassportRowVisaAFlag:null;
 actualDocumentAndIssuerVerified:false;visaOrResidenceAndValidityVerified:false;
 travelPurposeAndVisaRouteVerified:false;familyOrCrewSpecialStatusVerified:false;
 exemptionLegallyQualified:false;sourceOriginalSealed:false;
 hrs2Ma1OwnerAal2Approved:false;personalTransitVisaAnswer:'derzeit nicht verfügbar';
 conditionalExceptionClasses:typeof AT_VISA_A_CONDITIONAL_EXCEPTIONS;
}>
export function atAirportTransitVisaAResearch(passportResearchCode:string):AtAirportTransitVisaAResearch{
 return Object.freeze({
  passportResearchCode,destination:'AT',sourceUrl:AT_VISA_A_BMI_SOURCE.url,
  sourceEdition:AT_VISA_A_BMI_SOURCE.edition,footnote:AT_VISA_A_BMI_SOURCE.footnote,
  austrianAirsideOnly:true,otherSchengenTransitRuleTransferAllowed:false,
  airportAndAirsideItineraryVerified:false,actualBmiPassportRowVisaAFlag:null,
  actualDocumentAndIssuerVerified:false,visaOrResidenceAndValidityVerified:false,
  travelPurposeAndVisaRouteVerified:false,familyOrCrewSpecialStatusVerified:false,
  exemptionLegallyQualified:false,sourceOriginalSealed:false,
  hrs2Ma1OwnerAal2Approved:false,personalTransitVisaAnswer:'derzeit nicht verfügbar',
  conditionalExceptionClasses:AT_VISA_A_CONDITIONAL_EXCEPTIONS,
 })
}
