// Research-only, Austria 06.11.2026 BMI original: the UK nationality/passport
// category cannot be inferred from a GB country-code alone.
// Do not use these Austrian rows as a destination-specific issuer for EU4,
// or as an individual visa decision, especially for overseas statuses.
export const AT_GB_BMI_NATIONALITY_CATEGORIES=Object.freeze([
 'British citizen',
 'British National (Overseas)',
 'British Overseas Territories Citizen',
 'British Overseas Citizen',
 'British Protected Person',
 'British Subject',
] as const)

export const AT_GB_BMI_CATEGORY_REVIEW=Object.freeze({
 researchCode:'GB' as const,
 destination:'AT' as const,
 bmiSource:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 bmiEdition:'2026-11-06' as const,
 reviewedAt:'2026-11-20' as const,
 categories:AT_GB_BMI_NATIONALITY_CATEGORIES,
 // The BMI lists the categories for its conditional short-stay row.
 // The applicant's particular document/nationality is never established here.
 ordinaryTravelDocumentAndNationalityCategoryVerified:false as const,
 specificDocumentRecognitionVerified:false as const,
 visaAndResidenceExceptionsVerified:false as const,
 routePurposeAndStayVerified:false as const,
 exactDestinationOriginalForIndividualRuleSealed:false as const,
 eu4DestinationLegalityVerified:false as const,
 ma1OwnerAal2Approved:false as const,
 personalVisaDecision:'derzeit nicht verfügbar' as const,
})
export type AtGbBmiCategoryReview=typeof AT_GB_BMI_CATEGORY_REVIEW
export function atGbBmiCategoryReview(code:string):AtGbBmiCategoryReview|null{
 return code==='GB'?AT_GB_BMI_CATEGORY_REVIEW:null
}
