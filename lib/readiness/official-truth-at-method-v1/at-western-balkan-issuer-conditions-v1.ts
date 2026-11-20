// Austria AT50 / EU4 RESEARCH_ONLY: issuer-specific Western Balkan document conditions.
// Crosschecked on 20.11.2026 against Austrian DESTINATION primary and the
// directly applicable EU acts. These are legal source descriptions, NOT proof
// of an applicant's passport, itinerary, transit or eligibility. No new issuer.
export const AT_WESTERN_BALKAN_ISSUER_CONDITIONS=Object.freeze({
 XK:Object.freeze({
  citizenshipResearchCode:'XK' as const,
  documentIssuer:'Kosovo' as const,
  visitorCountryCodeSupported:false as const,
  euLegalSource:'https://eur-lex.europa.eu/eli/reg/2023/850/oj/eng',
  austriaDestinationPrimary:'https://www.bmeia.gv.at/oeb-pristina/reisen-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
  euLegalEffectiveFrom:'2024-01-01',
  ordinaryPassportMustBeBiometricIcao:true as const,
  ordinaryPassportIssuerMustMatch:'Kosovo' as const,
  schengenMaxStayDays:90 as const,schengenWindowDays:180 as const,
  employmentInternshipOrScholarshipRequiresIndependentVisaCheck:true as const,
  documentIssuerAndCategoryVerified:false as const,
  routePurposeStayAndResidenceVerified:false as const,
  destinationSpecificOriginalSealed:false as const,
  legalDecisionApproved:false as const,ma1OwnerAal2Approved:false as const,
  personalVisaDecision:'derzeit nicht verfügbar' as const,
 }),
 RS:Object.freeze({
  citizenshipResearchCode:'RS' as const,
  documentIssuer:'Serbia, including Koordinaciona uprava' as const,
  visitorCountryCodeSupported:true as const,
  euLegalSource:'https://eur-lex.europa.eu/eli/reg/2024/2495/oj/eng',
  austriaDestinationPrimary:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
  euLegalEffectiveFrom:'2024-10-13',
  ordinaryPassportMustBeBiometricIcao:true as const,
  ordinaryPassportIssuerMustMatch:'Serbia including Koordinaciona uprava if applicable' as const,
  schengenMaxStayDays:90 as const,schengenWindowDays:180 as const,
  employmentInternshipOrScholarshipRequiresIndependentVisaCheck:true as const,
  documentIssuerAndCategoryVerified:false as const,
  routePurposeStayAndResidenceVerified:false as const,
  destinationSpecificOriginalSealed:false as const,
  legalDecisionApproved:false as const,ma1OwnerAal2Approved:false as const,
  personalVisaDecision:'derzeit nicht verfügbar' as const,
 }),
})
export type AtWesternBalkanIssuerReview=
 typeof AT_WESTERN_BALKAN_ISSUER_CONDITIONS[keyof typeof AT_WESTERN_BALKAN_ISSUER_CONDITIONS]
export function atWesternBalkanIssuerReview(code:string):AtWesternBalkanIssuerReview|null{
 if(code==='XK')return AT_WESTERN_BALKAN_ISSUER_CONDITIONS.XK
 if(code==='RS')return AT_WESTERN_BALKAN_ISSUER_CONDITIONS.RS
 return null
}
