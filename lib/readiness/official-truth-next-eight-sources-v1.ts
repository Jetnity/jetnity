// Jetnity Official Truth: next eight after AT/IT/FR/ES/PT, 20.11.2026.
// Each link is a destination-government source. This is a source REVIEW QUEUE,
// not an automated HTTP caller, accepted rule, published tourist permission,
// passport-number collector, visa fee or payment link.
// The 206x50 original archive lives outside the repo; these destinations are
// selected by the established canonical destination-batch ordering.
export const NEXT_EIGHT_SOURCE_REVIEW_ORDER = Object.freeze([
  'GR','HR','NL','GB','US','TR','TH','AE'
] as const)

export type NextEightCountry=typeof NEXT_EIGHT_SOURCE_REVIEW_ORDER[number]
type SourcePlan=Readonly<{
 country:NextEightCountry
 governmentPrimary:string
 governmentCountercheck:string
 directAuthorityName:string
 revisedLawWarning:string
 missingDocumentFacts:string
 archiveOriginalLoaded:false
 nationalPrimaryOriginalDigestSealed:false
 documentAndRouteLawQualified:false
 ownerAal2Authorized:false
 visitorPositiveApproved:false
 entryVisaResult:'derzeit nicht verfügbar'
 vaccinationResult:'derzeit nicht verfügbar'
 feeResult:'derzeit nicht verfügbar'
}>
const UNAVAILABLE='derzeit nicht verfügbar' as const
const OFFICIAL=Object.freeze({
 GR:Object.freeze({
  governmentPrimary:'https://www.mfa.gr/en/services/visas-for-foreigners-traveling-to-greece/',
  governmentCountercheck:'https://www.mfa.gr/en/services/schengen-visas/',
  directAuthorityName:'Greece Ministry of Foreign Affairs (Embassy in Switzerland)',
  revisedLawWarning:'Schengen 90/180 and actual Swiss residence versus citizenship; embassy information for Swiss residents does not prove every national passport.',
  missingDocumentFacts:'Citizenship, actual residence permit, passport, Schengen days, purpose, airside transit and special documents.',
 }),
 HR:Object.freeze({
  governmentPrimary:'https://mvep.gov.hr/en/consular-information/visas/22879',
  governmentCountercheck:'https://gov.hr/en/vize/1216',
  directAuthorityName:'Croatia Ministry of Foreign and European Affairs',
  revisedLawWarning:'Croatia entered Schengen 01.01.2023. Earlier Croatian-only visa rules are NOT a 2026 Schengen waiver.',
  missingDocumentFacts:'Passport status, Schengen days, visas A/C, special-purpose permit, route and nationality-specific MVEP list.',
 }),
 NL:Object.freeze({
  governmentPrimary:'https://www.government.nl/themes/migration-and-travel/immigration-to-the-netherlands/question-and-answer/which-visa-do-i-need-to-travel-to-the-netherlands',
  governmentCountercheck:'https://ind.nl/en/short-stay/short-stay-holiday-or-business-visa',
  directAuthorityName:'Netherlands Government and IND',
  revisedLawWarning:'Short-stay Schengen rules do not independently cover the Dutch Caribbean; an airport transit visa is separate.',
  missingDocumentFacts:'Actual passport/residence permit, passport validity, Schengen 90/180, destination territory and airport transit.',
 }),
 GB:Object.freeze({
  governmentPrimary:'https://www.gov.uk/check-uk-visa',
  governmentCountercheck:'https://www.gov.uk/guidance/check-when-you-can-get-an-electronic-travel-authorisation-eta',
  directAuthorityName:'United Kingdom Home Office',
  revisedLawWarning:'A visa or ETA may be required depending on nationality; an existing UK immigration status changes ETA requirements.',
  missingDocumentFacts:'Nationality/passport class, settled/pre-settled status, entry or eligible transit route, purpose, ETA/visa validity.',
 }),
 US:Object.freeze({
  governmentPrimary:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html',
  governmentCountercheck:'https://www.help.cbp.gov/s/article/Article-1437?language=en_US',
  directAuthorityName:'United States Department of State and CBP',
  revisedLawWarning:'Visa Waiver Program is only for eligible nationals meeting strict passport and travel-history conditions; ESTA is NOT a visa.',
  missingDocumentFacts:'VWP nationality, biometric/electronic passport, dual citizenship, prior travel, purpose, valid ESTA, transit.',
 }),
 TR:Object.freeze({
  governmentPrimary:'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa',
  governmentCountercheck:'https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa',
  directAuthorityName:'Türkiye Ministry of Foreign Affairs',
  revisedLawWarning:'Visa, e-Visa, ordinary versus diplomatic passport and residence exceptions differ by citizenship. Government notes a Chinese ordinary passport change effective 02.01.2026.',
  missingDocumentFacts:'Nationality-specific row, ordinary/service/diplomatic passport, valid visa/residence permits, reason and duration.',
 }),
 TH:Object.freeze({
  governmentPrimary:'https://www.mfa.go.th/en/content/pb-summary-03092026-en',
  governmentCountercheck:'https://thailand.prd.go.th/en/content/category/detail/id/48/iid/538547',
  directAuthorityName:'Thailand MFA and Government Public Relations Department',
  revisedLawWarning:'HIGH PRIORITY: 2026 change published 31.08 and effective 15.09.2026 revoked the OLD blanket 60-day visa-exemption scheme; new 30-/15-day lists and a restricted visa-on-arrival list need exact nationality matching.',
  missingDocumentFacts:'Exact updated 30-/15-day destination-government list per passport, dates, tourist purpose, visa/eVisa/VoA type and transport route.',
 }),
 AE:Object.freeze({
  governmentPrimary:'https://u.ae/en/information-and-services/visa-and-emirates-id/Visa-information/do-you-need-an-entry-permit-or-a-visa-to-enter-the-uae',
  governmentCountercheck:'https://icp.gov.ae/en/services-details/?serviceid=68f5bcdb8c587a0011cb16d5',
  directAuthorityName:'UAE Government Portal and ICP',
  revisedLawWarning:'ICP expanded select entry-visa eligibility in June 2026 based on nationality AND eligible third-country residence. Visa-on-arrival lists can change.',
  missingDocumentFacts:'Nationality, exact passport validity, eligible residence/visa proof, arrival emirate, visa category and permitted stay.',
 }),
} satisfies Record<NextEightCountry,Omit<SourcePlan,'country'|'archiveOriginalLoaded'|'nationalPrimaryOriginalDigestSealed'|'documentAndRouteLawQualified'|'ownerAal2Authorized'|'visitorPositiveApproved'|'entryVisaResult'|'vaccinationResult'|'feeResult'>>)
export function nextEightOfficialReview(country:string):SourcePlan|null {
 if(!NEXT_EIGHT_SOURCE_REVIEW_ORDER.some(x=>x===country))return null
 const key=country as NextEightCountry
 const source=OFFICIAL[key]
 if(!source.governmentPrimary.startsWith('https://')
  ||!source.governmentCountercheck.startsWith('https://'))throw Error('OFFICIAL_SOURCE_URL_UNVERIFIED')
 return Object.freeze({
  country:key,...source,archiveOriginalLoaded:false,nationalPrimaryOriginalDigestSealed:false,
  documentAndRouteLawQualified:false,ownerAal2Authorized:false,
  visitorPositiveApproved:false,entryVisaResult:UNAVAILABLE,
  vaccinationResult:UNAVAILABLE,feeResult:UNAVAILABLE,
 })
}
export const NEXT_EIGHT_OFFICIAL_RESEARCH = Object.freeze(NEXT_EIGHT_SOURCE_REVIEW_ORDER.map(key=>{
 const source=nextEightOfficialReview(key)
 if(!source)throw Error('DESTINATION_SOURCE_REVIEW_REQUIRED')
 return source
}))
