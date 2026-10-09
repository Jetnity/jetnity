// Developer research labels only. These are NOT source/identity registry entries.
// R1–R6 and audit row IDs refer to #845, sections 3, 6, 8 and 9 (historical).
export const SOURCE_LABELS = ['ETA_APPENDIX', 'NATIONAL_LIST', 'IRISH_GUIDANCE'] as const
export const URLS = {
  ETA_APPENDIX: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation',
  NATIONAL_LIST: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list',
  IRISH_GUIDANCE: 'https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible',
} as const

export const QUESTION_IDS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] as const
export const PREDICATES = [
  'ETA14_QUALIFIER_TARGET', 'ETA14_NEVER_APPLIED_REFERENCE_EVENT',
  'BOTC_BNO_STATUS_VS_SELECTED_PASSPORT', 'PENDING_SAVED_ISLAND_ADMISSION_EFFECT',
  'EXEMPT_CONTROL_AGREEMENT_COVERAGE', 'CREW_RESTRICTION_RECONCILIATION',
  'FRONTIER_S2_ETA_EFFECT_BY_ARRIVAL_MODE', 'GERMAN_MIXED_PUPIL_COUNT',
  'GERMAN_FORM_ORIGIN_DOCUMENT_BOUNDARIES',
] as const

export const ANCHORS = {
  ETA_SCOPE: { url: URLS.ETA_APPENDIX, locator: 'Introduction; ETA 1.1(d), 1.3–1.4, 1.7, 1.9–1.10; ETA 4.3', role: 'OPERATIVE_RULE_RESEARCH', auditRows: 'A00–A01, I01–I05, C07, F01–F02, G01–G02, B01, B03' },
  ETA_NATIONALITY: { url: URLS.NATIONAL_LIST, locator: 'ETANL 1.1(d), Switzerland; cross-reference to Appendix ETA', role: 'NATIONALITY_COHORT_RESEARCH', auditRows: 'A02' },
  IRELAND: { url: URLS.IRISH_GUIDANCE, locator: 'ETA rules: Exemption for Irish residents; Children; Documents that show lawful residence in Ireland', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'I06, I09–I10' },
  PERMISSION: { url: 'https://www.gov.uk/eta/when-not-need-eta', locator: 'When you do not need an ETA', role: 'SUMMARY_GUIDANCE_RESEARCH', auditRows: 'C01–C02, C05' },
  PENDING: { url: 'https://www.gov.uk/settled-status-eu-citizens-families/after-youve-applied', locator: '#guide-contents, opening validation paragraphs; #returning-to-the-uk', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C06' },
  CTA: { url: 'https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible', locator: 'Irish residence exemption; Crown Dependency permission; Article 5; frontier-worker saved status', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'I12, C04, C32–C33' },
  CONTROL: { url: 'https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible', locator: '#persons-posted-to-diplomatic-missions-in-the-uk; #persons-attending-an-international-conference; #employees-of-international-organisations', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C10–C21, C23, C36' },
  ORGANISATIONS: { url: 'https://www.gov.uk/government/publications/exempt-exm/list-of-international-organisations-whose-employees-qualify-for-exempt-entry-clearances-accessible-version', locator: 'UK-based/non-UK lists; footnotes 1 and 2', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C22' },
  CREW: { url: 'https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls', locator: '#check-if-youre-exempt-from-obtaining-permission-to-enter; #seafarers; #ferry-crew; #airline-crew; #international-rail-crew', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C09, C26, C29–C31' },
  AIRCREW: { url: 'https://www.gov.uk/government/publications/aircrew-crm02/aircrew-crm02', locator: 'CRM 2.1–2.4: legislation, identity documents, arriving crew and entry clearance', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C27' },
  SEAFARERS: { url: 'https://www.gov.uk/government/publications/seafarers-crm01/seafarers-crm01', locator: '#seafarers; #ilo-identity-documents; #seafarers-arriving-by-ships-in-the-united-kingdom', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C28' },
  FORCES: { url: 'https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance/appendix-international-forces-caseworker-guidance-accessible--2', locator: '#who-is-exempt-from-immigration-control; #visiting-forces-act-vfa', role: 'INTERPRETIVE_GUIDANCE_RESEARCH', auditRows: 'C25' },
  FRONTIER: { url: 'https://www.gov.uk/frontier-worker-permit', locator: 'Overview; What the permit allows you to do; Family members', role: 'STATUS_GUIDANCE_RESEARCH', auditRows: 'C34' },
  S2: { url: 'https://www.gov.uk/guidance/enter-the-uk-as-an-s2-healthcare-visitor', locator: 'Overview; Patient; Accompanying or joining a patient; Information', role: 'STATUS_GUIDANCE_RESEARCH', auditRows: 'C35' },
  SCHOOL_RULE: { url: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk', locator: 'Part 1 paragraphs 11A–11D', role: 'INCORPORATED_RULE_RESEARCH', auditRows: 'F03–F04, G03–G04' },
  FRENCH_SCHOOL: { url: 'https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip', locator: 'Opening below Contents; #filling-in-the-form; #bringing-the-form-to-the-uk', role: 'FORM_GUIDANCE_RESEARCH', auditRows: 'F05–F06, F09' },
  GERMAN_SCHOOL: { url: 'https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip', locator: 'Opening below Contents; #filling-in-the-form; #documents-the-adults-need; #bringing-the-form-to-the-uk', role: 'FORM_GUIDANCE_RESEARCH', auditRows: 'G05–G06, G09' },
  GERMAN_FORM: { url: 'https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf', locator: 'Printed page 2: declaration, signature, authority stamp/date; page 3: instructions', role: 'FORM_GUIDANCE_RESEARCH', auditRows: 'G07–G08' },
} as const
export type AnchorId = keyof typeof ANCHORS

export const QUESTIONS = [
  { id: 'R1', predicates: ['ETA14_QUALIFIER_TARGET', 'ETA14_NEVER_APPLIED_REFERENCE_EVENT'], anchors: ['ETA_SCOPE', 'IRELAND'] },
  { id: 'R2', predicates: ['BOTC_BNO_STATUS_VS_SELECTED_PASSPORT'], anchors: ['ETA_SCOPE', 'IRELAND', 'PERMISSION'] },
  { id: 'R3', predicates: ['PENDING_SAVED_ISLAND_ADMISSION_EFFECT'], anchors: ['PENDING', 'CTA', 'PERMISSION'] },
  { id: 'R4', predicates: ['EXEMPT_CONTROL_AGREEMENT_COVERAGE', 'CREW_RESTRICTION_RECONCILIATION'], anchors: ['CONTROL', 'CREW', 'FORCES', 'AIRCREW', 'SEAFARERS', 'ORGANISATIONS'] },
  { id: 'R5', predicates: ['FRONTIER_S2_ETA_EFFECT_BY_ARRIVAL_MODE'], anchors: ['FRONTIER', 'S2', 'CTA', 'ETA_SCOPE'] },
  { id: 'R6', predicates: ['GERMAN_MIXED_PUPIL_COUNT', 'GERMAN_FORM_ORIGIN_DOCUMENT_BOUNDARIES'], anchors: ['SCHOOL_RULE', 'GERMAN_SCHOOL', 'GERMAN_FORM', 'ETA_SCOPE'] },
] as const

export const COVERAGE_CASES = [
  'UK_ENTRY_CLEARANCE', 'UK_PERMISSION_AND_SETTLED_STATUS', 'RIGHT_OF_ABODE',
  'ISLAND_PERMISSION', 'PENDING_SAVED_APPEAL_JOINING_STATUS', 'IRELAND_CTA',
  'BOTC_BNO', 'FRENCH_SCHOOL', 'GERMAN_SCHOOL', 'DIPLOMATIC_ROLE_FAMILY_AGREEMENTS',
  'FORCES', 'SHIP_AIR_RAIL_CREW', 'FRONTIER_WORKER', 'S2_ARRIVAL',
  'UNENUMERATED_EXEMPTIONS', 'BRITISH_IRISH_CITIZENSHIP', 'AIRSIDE_TRANSIT',
  'LANDSIDE_TRANSIT', 'ETA_APPLICATION_AND_USE', 'CROWN_DEPENDENCY_ETA_RECOGNITION',
] as const

export function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
freeze(URLS); freeze(ANCHORS); freeze(QUESTIONS)
