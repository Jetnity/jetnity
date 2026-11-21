// AT50 RESEARCH_ONLY: Austria's own 06.11.2026 BMI nationality matrix,
// column "zusätzlich gültige Reisedokumente" for IQ and SO. Do not treat
// nationality, a passport series, a historical date or an archive digest as
// a present-day personal document-recognition decision.
export const AT_BMI_DOCUMENT_RECOGNITION_SOURCE = Object.freeze({
 url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 edition:'2026-11-06' as const,
 verifiedAt:'2026-11-20' as const,
 archiveOriginalSha256:'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
 scope:'AT_ONLY_RESEARCH' as const,
})
const DOCUMENT_NOTES = Object.freeze({
 IQ:Object.freeze([
  'BMI: Iraqi series A and G passports are listed as recognized; the document and its current validity must still be checked.',
  'BMI: Iraqi series S passports are explicitly listed as not recognized.',
  'BMI: Iraqi series H, M and N require expiry/issuance/extension before 19.03.2003 or a post-19.03.2003 CPA stamp, with the precise dates and stamp independently verified.',
 ]),
 SO:Object.freeze([
  'BMI: Passports of the Republic of Somaliland are explicitly listed as not recognized by Austria.',
  'BMI: Passports of the Republic of Somalia issued after 31.01.1991 are explicitly listed as not recognized by Austria.',
  'BMI: No inference that any other Somali document is currently valid or recognized; issuer, exact document, dates and current recognition must be independently qualified.',
 ]),
})
export type AtBmiDocumentRecognitionResearch=Readonly<{
 code:'IQ'|'SO';destination:'AT';sourceUrl:string;sourceEdition:'2026-11-06';
 originalArchiveSha256:string;scope:'AT_ONLY_RESEARCH';
 conditionalOriginalNotes:readonly string[];
 exactPassportSeriesAndIssuerVerified:false;exactDocumentDateAndStampVerified:false;
 documentValidityAndCurrentRecognitionVerified:false;legalApplicabilityVerified:false;
 sourceOriginalSealedForIndividual:false;hrs2Ma1Bg1OwnerAal2Approved:false;
 personalDocumentRecognitionAnswer:'derzeit nicht verfügbar';
}>
export function atBmiDocumentRecognitionResearch(code:string):AtBmiDocumentRecognitionResearch|null{
 if(code!=='IQ'&&code!=='SO')return null
 return Object.freeze({
  code,destination:'AT',sourceUrl:AT_BMI_DOCUMENT_RECOGNITION_SOURCE.url,
  sourceEdition:AT_BMI_DOCUMENT_RECOGNITION_SOURCE.edition,
  originalArchiveSha256:AT_BMI_DOCUMENT_RECOGNITION_SOURCE.archiveOriginalSha256,
  scope:AT_BMI_DOCUMENT_RECOGNITION_SOURCE.scope,
  conditionalOriginalNotes:DOCUMENT_NOTES[code],
  exactPassportSeriesAndIssuerVerified:false,
  exactDocumentDateAndStampVerified:false,
  documentValidityAndCurrentRecognitionVerified:false,
  legalApplicabilityVerified:false,sourceOriginalSealedForIndividual:false,
  hrs2Ma1Bg1OwnerAal2Approved:false,
  personalDocumentRecognitionAnswer:'derzeit nicht verfügbar',
 })
}
