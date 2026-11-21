// Source-backed PRODUCT SCOPING, not personal Visa or passport validity.
// 20.11.2026: official AT BMI November 6 nationality original + Austrian BMI
// border-conditions + BMEIA visa application page and EU ID Regulation.
// Only ordinary national passports for a short tourist trip to Austria.
// A different nationality/document, valid Schengen residence permit, family
// rights, work, long stay, border/airside route or minor requires NEW review.
// No personal MRZ, passport number, photos, identity or payment information.
export const AT_PRIORITY10_PASSPORTS=Object.freeze('IN TR CN DE PL IT US UA RO FR'.split(' '))
export type AtPriority10Passport='IN'|'TR'|'CN'|'DE'|'PL'|'IT'|'US'|'UA'|'RO'|'FR'
export type AtPriority10VisaBase='SCHENGEN_C_VISA_NORMALLY_REQUIRED'|'EU_FREEDOM_OF_MOVEMENT_NO_VISA'|'SHORT_STAY_VISA_WAIVER_WITH_CONDITIONS'
export const AT_PRIORITY10_SOURCES=Object.freeze({
 originalEdition:'2026-11-06',
 bmiOriginalSha256:'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
 bmiVisa:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 bmiEntry:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
 bmiDual:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/einreise/start.html',
 bmeiaApplication:'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
 euIdentityCard:'https://eur-lex.europa.eu/eli/reg/2025/1208/oj/deu',
 euVisaAnnex:'https://eur-lex.europa.eu/eli/reg/2018/1806/2025-12-30/deu',
 checkedAt:'2026-11-20',
})
const classes=Object.freeze({
 IN:['SCHENGEN_C_VISA_NORMALLY_REQUIRED','Diplomatenpass (österreichische Sonderregel) ist NICHT der gewöhnliche Reisepass.'],
 TR:['SCHENGEN_C_VISA_NORMALLY_REQUIRED','Diplomaten-, Dienst- und Spezialpässe separat; gewöhnlicher türkischer Pass grundsätzlich visumpflichtig.'],
 CN:['SCHENGEN_C_VISA_NORMALLY_REQUIRED','EU-Ausnahme nur für Diplomatenpässe; normale chinesische Reisepässe grundsätzlich visumpflichtig.'],
 DE:['EU_FREEDOM_OF_MOVEMENT_NO_VISA','Gültiger deutscher Reisepass oder gültiger den 2026-Sicherheitsregeln entsprechender Personalausweis.'],
 PL:['EU_FREEDOM_OF_MOVEMENT_NO_VISA','Gültiger polnischer Reisepass oder gültiger den 2026-Sicherheitsregeln entsprechender Personalausweis.'],
 IT:['EU_FREEDOM_OF_MOVEMENT_NO_VISA','Gültiger italienischer Reisepass oder gültiger den 2026-Sicherheitsregeln entsprechender Personalausweis.'],
 US:['SHORT_STAY_VISA_WAIVER_WITH_CONDITIONS','US-amerikanischer gewöhnlicher Reisepass: Tourismus ohne Erwerbstätigkeit, Schengen maximal 90/180 Tage, übrige Grenzbedingungen.'],
 UA:['SHORT_STAY_VISA_WAIVER_WITH_CONDITIONS','Ukrainischer gewöhnlicher Pass nur BIOMETRISCH visumfrei; nichtbiometrischer Diplomatenpass ist ein gesonderter Fall.'],
 RO:['EU_FREEDOM_OF_MOVEMENT_NO_VISA','Gültiger rumänischer Reisepass oder gültiger den 2026-Sicherheitsregeln entsprechender Personalausweis.'],
 FR:['EU_FREEDOM_OF_MOVEMENT_NO_VISA','Gültiger französischer Reisepass oder gültiger den 2026-Sicherheitsregeln entsprechender Personalausweis.'],
} as const satisfies Record<AtPriority10Passport,readonly [AtPriority10VisaBase,string]>)
const EU=new Set<AtPriority10Passport>(['DE','PL','IT','RO','FR'])
const DUTY=new Set<AtPriority10Passport>(['IN','TR','CN'])
const BIOMETRIC=new Set<AtPriority10Passport>(['UA'])
const UNKNOWN='derzeit nicht verfügbar' as const
export const AT_PRIORITY10_MILESTONES=Object.freeze({
 euFive:{passports:Object.freeze(['DE','PL','IT','RO','FR']),target:'2026-11-23',goal:'Official-scope document/visa fact candidates; no owner release yet'},
 thirdCountryWaiver:{passports:Object.freeze(['US','UA']),target:'2026-11-25',goal:'Ordinary passport 90/180 plus UA biometric conditions, no biometric ID storage'},
 thirdCountryVisaRequired:{passports:Object.freeze(['IN','TR','CN']),target:'2026-11-27',goal:'Ordinary-passport Schengen C visa duty and visa-application document scope'},
 independentDevValidation:{target:'2026-11-28',goal:'Exact-current primary evidence, issuer HRS2/MA1, real Dev/50 passport regression, CI and rollback'},
 groupedOwnerCandidate:{target:'2026-11-29',goal:'Send only actually authorized and individually sourced subsets to Owner; NOT a scheduled publication'},
 ownerControlledLaunch:{target:'2026-11-30',goal:'Conditional possibility only after Owner grant, merged CI and separate Production approval'},
})
export type AtPriority10Candidate=Readonly<{
 country:AtPriority10Passport;rank:number;destination:'AT';scope:'ORDINARY_NATIONAL_PASSPORT_DIRECT_SHORT_STAY_TOURISM';
 sourceEdition:'2026-11-06';sourceHash:string;sourceVisaUrl:string;sourcePassportUrl:string;sourceVisaApplicationUrl:string;
 group:'V'|'F'|'E';baselineVisaRule:AtPriority10VisaBase;conditions:string;
 euFreeMovement:boolean;requiresSchengenVisaApplicationForNormalCase:boolean;
 thirdCountryThreeMonthsAfterSchengenExit:boolean;thirdCountryIssuedWithin10Years:boolean;
 twoBlankPagesONLYForVisaApplication:boolean;euValidPassportOrQualifiedNationalId:boolean;
 identityCardMustMeetEU2025_1208WhenUsed:boolean;biometricOrdinaryPassportRequiredForWaiver:boolean;
 shortStay90in180OnlyForThirdCountry:boolean;noFixedGeneralPassportBlankPagesForVisaFreeEntry:true;
 officialRuleScopeReviewed:true;currentLiveSourceSealVerified:false;
 individualPresentedDocumentVerified:false;individualPassportExpiryAndIssueDateVerified:false;
 residenceAndFamilyExemptionVerified:false;actualSchengenDaysPurposeAndBorderRouteVerified:false;
 specialPassOrDualNationalityReviewed:false;sourceToRuleIssuerInstalled:false;
 ownerAal2Authorised:false;publicationAllowed:false;actualPersonalVisaAnswer:typeof UNKNOWN;
 actualPersonalPassportAnswer:typeof UNKNOWN;actualFormUrl:null;actualVisaFee:null;
}>
const PRIORITY=AT_PRIORITY10_PASSPORTS
if(PRIORITY.length!==10||new Set(PRIORITY).size!==10||PRIORITY.join(' ')!=='IN TR CN DE PL IT US UA RO FR')throw Error('AT_PRIORITY10_EXACT_ORDER_REQUIRED')
export const AT_PRIORITY10_VISA_PASSPORT_REVIEW=Object.freeze(PRIORITY.map((raw,rank):AtPriority10Candidate=>{
 const country=raw as AtPriority10Passport
 const eu=EU.has(country),duty=DUTY.has(country)
 const [visa,condition]=classes[country]
 return Object.freeze({
  country,rank:rank+1,destination:'AT',scope:'ORDINARY_NATIONAL_PASSPORT_DIRECT_SHORT_STAY_TOURISM',
  sourceEdition:'2026-11-06',sourceHash:AT_PRIORITY10_SOURCES.bmiOriginalSha256,
  sourceVisaUrl:AT_PRIORITY10_SOURCES.bmiVisa,
  sourcePassportUrl:AT_PRIORITY10_SOURCES.bmiEntry,
  sourceVisaApplicationUrl:AT_PRIORITY10_SOURCES.bmeiaApplication,
  group:eu?'F':duty?'V':'E',baselineVisaRule:visa,conditions:condition,
  euFreeMovement:eu,requiresSchengenVisaApplicationForNormalCase:duty,
  thirdCountryThreeMonthsAfterSchengenExit:!eu,
  thirdCountryIssuedWithin10Years:!eu,
  twoBlankPagesONLYForVisaApplication:duty,
  euValidPassportOrQualifiedNationalId:eu,
  identityCardMustMeetEU2025_1208WhenUsed:eu,
  biometricOrdinaryPassportRequiredForWaiver:BIOMETRIC.has(country),
  shortStay90in180OnlyForThirdCountry:!eu,
  noFixedGeneralPassportBlankPagesForVisaFreeEntry:true,
  officialRuleScopeReviewed:true,currentLiveSourceSealVerified:false,
  individualPresentedDocumentVerified:false,individualPassportExpiryAndIssueDateVerified:false,
  residenceAndFamilyExemptionVerified:false,actualSchengenDaysPurposeAndBorderRouteVerified:false,
  specialPassOrDualNationalityReviewed:false,sourceToRuleIssuerInstalled:false,
  ownerAal2Authorised:false,publicationAllowed:false,
  actualPersonalVisaAnswer:UNKNOWN,actualPersonalPassportAnswer:UNKNOWN,
  actualFormUrl:null,actualVisaFee:null,
 })
}))
