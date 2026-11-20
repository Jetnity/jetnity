// Checked only against Austrian BMI source-category list (06.11.2026) and
// BMEIA visa conditions (19.11.2026). This is NOT an individualized rule,
// visitor visa decision, MA1 permit, or authorization to publish a fact.
export const AT_BMI_REVIEW_SOURCES=Object.freeze({
 bmi:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 bmeia:'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
 sourceEdition:'2026-11-06',reviewedAt:'2026-11-19',
});
export const AT_BMI_GROUPS=Object.freeze({
 V:Object.freeze('IN TR CN SY AF RU IQ IR PK ER TH SO VN NG EG LK PH LB CM MA'.split(' ')),
 F:Object.freeze('DE PL IT RO FR NL ES HU CZ CH HR BE PT BG GR SK SE DK LT'.split(' ')),
 E:Object.freeze('US UA GB BR XK KR JP RS CA IL'.split(' ')),
 H:Object.freeze(['AT']),
});
export type AtBmiGroup=keyof typeof AT_BMI_GROUPS
const expected:Readonly<Record<AtBmiGroup,number>>={V:20,F:19,E:10,H:1}
const groups=new Map<string,AtBmiGroup>()
for(const group of (['V','F','E','H'] as const)){
 if(AT_BMI_GROUPS[group].length!==expected[group])throw Error('AT_BMI_GROUP_SIZE_REFUSED')
 for(const code of AT_BMI_GROUPS[group]){
  if(!/^[A-Z]{2}$/.test(code)||groups.has(code))throw Error('AT_BMI_DUPLICATE_CODE_REFUSED')
  groups.set(code,group)
 }
}
if(groups.size!==50||groups.get('CH')!=='F'||groups.get('AT')!=='H'
 ||groups.get('UA')!=='E'||groups.get('XK')!=='E'||groups.get('RS')!=='E')
 throw Error('AT_BMI_MATRIX_SIGNATURE_REFUSED')
const scope=Object.freeze({
 V:Object.freeze({label:'Visumpflicht als BMI-Grundregel',text:'Bei einem gewöhnlichen Pass ist eine reguläre touristische Einreise grundsätzlich visumpflichtig. Gültige Schengen-Visa/Aufenthaltstitel, EU-Familienrechte, Sonderdokumente und andere Ausnahmen müssen für den Einzelfall zusätzlich geprüft werden.'}),
 F:Object.freeze({label:'EU/EWR/CH-Freizügigkeitsgruppe',text:'Mit gültigem anerkanntem Reisepass oder Personalausweis benötigen EU-/EWR-/Schweizer Staatsangehörige für die reguläre Einreise kein Visum. Dokument und Staatsangehörigkeit müssen tatsächlich geprüft werden.'}),
 E:Object.freeze({label:'Bedingte Befreiung für Kurzaufenthalte',text:'Für gewöhnliche touristische Kurzaufenthalte ohne Erwerbstätigkeit kann bis 90 Tage in 180 Tagen Visumfreiheit bestehen; nur bei einem im BMI ausdrücklich erfassten Pass und erfüllten weiteren Bedingungen. Bilaterale Besonderheiten nicht pauschal übernehmen.'}),
 H:Object.freeze({label:'Österreichische Staatsangehörigkeit',text:'Ein österreichischer Pass ist kein Fall eines ausländischen Visa-Antrags; Dokument und Identität bleiben gesondert zu prüfen.'}),
})
const biometric=new Set(['UA','XK','RS'])
const bilateral=new Set(['BR','KR','JP','CA','IL'])
// Exact differentiated BMI visa-exception cells, 06.11.2026 edition. These
// are Austrian exceptional bilateral terms, NOT universally portable Schengen
// permissions, not an automatic override of EU 90/180 or the EU EES.
const nationalBilateralTerms:Readonly<Record<string,string>>=Object.freeze({
 BR:'BMI Österreich-Altabkommen: gewöhnlicher brasilianischer Reisepass 3 Monate; nur Diplomaten-/Dienstpässe 6 Monate. Bei mehr als 90 Tagen europäische/österreichische Sonderbedingungen getrennt prüfen.',
 KR:'BMI Österreich-Altabkommen: gewöhnlicher südkoreanischer Reisepass 90 Tage, Diplomaten-/Dienstpass 180 Tage; keine allgemeine EU-Schengen-180-Tage-Visafreiheit daraus ableiten.',
 JP:'BMI Österreich-Altabkommen: 6 Monate für die angegebenen Passkategorien, jedoch eine ausdrücklich österreichische nationale Ausnahme; Schengen-Tage, Reisezweck und Aufenthaltsstatus separat prüfen.',
 CA:'BMI Österreich-Altabkommen: 3 Monate für die angeführten Passkategorien. Die Sonderregel darf nicht ungeprüft als 90/180-EU-Regel oder andere Zielstaatenregel umgedeutet werden.',
 IL:'BMI Österreich-Altabkommen: 3 Monate für die angeführten Passkategorien, mit eigener Änderungsurkunde; nicht automatisch auf andere Schengenstaaten übertragbar.',
})
// Individual BMİ row EXCEPTIONS, checked against original Nov-6 Austrian BMI
// national/EU waiver fields on 20.11.2026. These are conditions, never a
// personal result; special/diplomatic documents are NOT ordinary passports.
const specialVisaDuty:Readonly<Record<string,string>>=Object.freeze({
 IN:'BMI: Nur der Diplomatenpass besitzt die genannte österreichische Sonder-Visumbefreiung. Normale Reisepässe sind davon nicht erfasst.',
 TR:'BMI: Die österreichische Sonderbefreiung betrifft Diplomaten-, Dienst- und Spezialpässe; nicht jeden türkischen gewöhnlichen Reisepass.',
 CN:'BMI: Die in der EU-Zeile genannte Ausnahme gilt nur für Diplomatenpässe, nicht gewöhnliche chinesische Reisepässe.',
 RU:'BMI: Die frühere EU-Visaerleichterung für russische Diplomatenpässe ist ausgesetzt. Daraus keine heutige Sonderbefreiung ableiten.',
 PK:'BMI: Nur Diplomaten- und Dienstpässe haben die angegebene nationale Ausnahme; Flughafentransitvisum A zusätzlich separat prüfen.',
 TH:'BMI: Die nationale Sonderbefreiung gilt nur für Diplomaten- und Dienstpässe, nicht allgemein für Thailand.',
 EG:'BMI: Diplomaten-, Dienst- und Spezialpässe sind die begrenzten österreichischen Sonderfälle.',
 PH:'BMI: Diplomaten- und Dienstpässe haben eine eigene Sonderregel; gewöhnliche Pässe nicht pauschal.',
 MA:'BMI: Diplomaten- und Dienstpässe besitzen die erwähnte nationale Sonderregel. Gewöhnliche Pässe sind keine Ausnahme.',
})
export type AtBmiSourceReview=Readonly<{code:string;group:AtBmiGroup;label:string;text:string;
 special:string|null;sourceEdition:string;reviewedAt:string;bmiUrl:string;bmeiaUrl:string;
 groupSourceVerified:true;individualVisaQualified:false;ownerAal2Approved:false;
 personalVisaEffect:null;verifiedPrice:null}>
export function atBmiSourceReview(code:string):AtBmiSourceReview|null{
 if(!/^[A-Z]{2}$/.test(code))return null
 const group=groups.get(code);if(!group)return null
 let special:string|null=null
 if(biometric.has(code))special='Für diese Staatsangehörigkeit erfordert die BMI-Visumbefreiung eines gewöhnlichen Reisepasses einen biometrischen Reisepass. Ein nichtbiometrischer gewöhnlicher Pass ist dadurch nicht automatisch visumfrei.'+
  (code==='UA'||code==='RS'?' Die BMI-Originalzeile beschreibt eine eigenständige Ausnahme für einen nichtbiometrischen Diplomatenpass; sie gilt nicht für den gewöhnlichen Pass.':'')+
  (code==='RS'?' Die genaue serbische Koordinationsdirektion-Passkategorie muss separat anhand der BMI-Originalzeile geprüft werden.':'')
 else if(code==='GB')special='Die BMI-Liste unterscheidet mehrere britische Staatsangehörigkeits- und Passkategorien, die im konkreten Fall geprüft werden müssen.'
 else if(bilateral.has(code))special=nationalBilateralTerms[code]+' Die BMI-Liste kennzeichnet EES-Sonderregelung Altabkommen als bilaterale nationale Ausnahme; nicht als EU-Allgemeinbefreiung ausgeben.'
 else if(group==='V')special=specialVisaDuty[code]??null
 return Object.freeze({
  code,group,label:scope[group].label,text:scope[group].text,special,
  sourceEdition:AT_BMI_REVIEW_SOURCES.sourceEdition,reviewedAt:AT_BMI_REVIEW_SOURCES.reviewedAt,
  bmiUrl:AT_BMI_REVIEW_SOURCES.bmi,bmeiaUrl:AT_BMI_REVIEW_SOURCES.bmeia,
  groupSourceVerified:true,individualVisaQualified:false,ownerAal2Approved:false,
  personalVisaEffect:null,verifiedPrice:null,
 })
}
