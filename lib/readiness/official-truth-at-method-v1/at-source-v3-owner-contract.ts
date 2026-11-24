// CH->AT Production-only immutable source-review selection. This is NOT MA1.
// Never expose this functionality to visitors, 49 other passports or a Dev URL.
export const AT_SOURCE_V3_BMEIA_SHA='b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'
export const AT_SOURCE_V3_BMEIA_BYTES=172428
export const AT_SOURCE_V3_SELECTION='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'
export const AT_SOURCE_V3_METHOD_SHA='fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
export const AT_SOURCE_V3_PACKAGE_SHA='6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
export const AT_SOURCE_V3_SOURCES=Object.freeze([
 Object.freeze({id:'bmi-general-entry',name:'BMI · Grenzkontrolle',bytes:91655,sha:'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'}),
 Object.freeze({id:'bmi-visa-nationality-matrix',name:'BMI · Visa-Ländermatrix',bytes:498415,sha:'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'}),
 Object.freeze({id:'bmeia-bern-how-to-apply',name:'BMEIA Bern · Konsularquelle',bytes:AT_SOURCE_V3_BMEIA_BYTES,sha:AT_SOURCE_V3_BMEIA_SHA,url:'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'}),
])
export const AT_SOURCE_V3_OLD_LINK='https://www.bmeia.gv.at/oeb-bern/service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/handy-signatur-id-austria'
export const AT_SOURCE_V3_NEW_LINK='https://www.bmeia.gv.at/oeb-bern/service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/id-austria'

export type AtSourceV3Intent='approve'|'confirm'
export type AtSourceV3Command=Readonly<{schema:3;intent:AtSourceV3Intent;selectionId:typeof AT_SOURCE_V3_SELECTION;sourceSha:typeof AT_SOURCE_V3_BMEIA_SHA;operationId:string}>
export type AtSourceV3Outcome=Readonly<{schema:3;intent:AtSourceV3Intent;status:'recorded'|'confirmed'|'absent'|'unresolved';operationId:string;recordedAt:string|null;code:string|null}>
export function readAtSourceV3Command(input:unknown):AtSourceV3Command|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null
 const value=input as Record<string,unknown>
 if(Object.keys(value).sort().join(',')!=='intent,operationId,schema,selectionId,sourceSha')return null
 if(value.schema!==3||!['approve','confirm'].includes(String(value.intent))
 ||value.selectionId!==AT_SOURCE_V3_SELECTION||value.sourceSha!==AT_SOURCE_V3_BMEIA_SHA
 ||typeof value.operationId!=='string'||!/^atsrc3_[a-f0-9]{32}$/.test(value.operationId))return null
 return value as AtSourceV3Command
}
