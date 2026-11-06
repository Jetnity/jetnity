import 'server-only'

// Reviewed change-control data, not source custody, admission or legal dates.
// A changed body, mapping or pilot window needs a new review/version/digest.
const url = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'

export const AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE = Object.freeze({
  mappingVersion: 1,
  contractId: 'aa-ch-de-visa-v1',
  applicationScope: 'ch-ordinary-tourism-direct-de-v1',
  travelDates: Object.freeze({ from: '2026-11-07', through: '2026-11-13' }),
  binding: Object.freeze({
    sourceId: 'de-aa-staatenliste-visumpflicht',
    contentItemId: 'aa-staatenliste-visumpflicht-207820', contentItemVersion: 1,
    representationId: 'aa-staatenliste-visumpflicht-html-de', representationVersion: 1,
    identityProfileId: 'de-aa-visa-table-html-de-candidate', identityProfileVersion: 1,
  }),
  requestUrl: url, canonicalUrl: url, finalUrl: url,
  contentType: 'text/html', locale: 'de', schema: 'article', sourceFingerprintProtocol: 2,
  sourceContentHash: 'fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979',
  coverage: Object.freeze({
    destinationCountryCodes: Object.freeze(['DE']), transitCountryCodes: Object.freeze([]),
    requirementTypes: Object.freeze(['visa'] as const),
    citizenship: Object.freeze({ mode: 'exact' as const, countryCodes: Object.freeze(['CH']) }),
    residence: Object.freeze({ mode: 'not_applicable' as const }),
    documents: Object.freeze({ mode: 'exact' as const, options: Object.freeze([
      Object.freeze({ documentType: 'passport' as const, issuingCountryCode: 'CH' }),
    ]) }),
  }),
  extractorId: 'otx_aa_ch_de_visa', extractorVersion: 1,
  sourceFamilyId: 'otf_aa_visa_table', schemaFamily: 'ots_aa_visa_table_html_de',
  policyId: null, policyVersion: null, requiredFieldPaths: Object.freeze([]),
  fact: Object.freeze({ kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' } as const),
  recognition: 'complete-v2-pin-and-unqualified-s1-swiss-row-v1',
  validitySemantics: 'recognized-unknown-legal-bounds-null-null-otherwise-refuse-v1',
} as const)
