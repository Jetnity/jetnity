// Research-only: official PT national short-stay visa fee page disagrees with EU law.
// Source comparison never supplies a passport-specific fee or a positive entry rule.
export const PT_VISA_C_FEE_CONFLICT_V1=Object.freeze({
 destination:'PT' as const,
 visaApplication:'SCHENGEN_C_SHORT_STAY' as const,
 checkedAt:'2026-11-20' as const,
 portuguesePrimary:Object.freeze({
  url:'https://www2.gov.pt/pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
  pageVersionDate:'2024-12-03' as const,
  displayedOrdinaryAdultEur:80,
  displayedAge6ToUnder12Eur:40,
  visaFacilitationAgreementNeedsIndependentReview:true as const,
 }),
 directlyApplicableEuLaw:Object.freeze({
  url:'https://eur-lex.europa.eu/eli/reg_del/2024/1415/oj/eng',
  commissionSummary:'https://home-affairs.ec.europa.eu/news/schengen-visa-fee-increased-11-june-2024-2024-06-13_en',
  inForceFrom:'2024-06-11' as const,
  ordinaryAdultEur:90,
  ordinaryAge6ToUnder12Eur:45,
 }),
 sourceConflict:'PT_OFFICIAL_SERVICE_PAGE_VS_EU_2024_1415' as const,
 researchOnly:true as const,
 isolatedToPtVisaCFee:true as const,
 personalDocumentAndNationalityChecked:false as const,
 ageAgreementExemptionConsularAndServiceFeeChecked:false as const,
 destinationLegalOriginalSealed:false as const,
 hrs2Ma1Bg1OwnerAal2Approved:false as const,
 personalFeeAmountEur:null,
 personalOfficialPaymentUrl:null,
 personalFeeAnswer:'derzeit nicht verfügbar' as const,
 publicationAllowed:false as const,
})
