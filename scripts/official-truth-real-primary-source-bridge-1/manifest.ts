// Disposable research descriptors only. Never inserted in a hosted/shipped catalog.
export const NATIONAL_LIST = Object.freeze({
  sourceId: 'govuk', contentItemId: 'eta-national-list',
  contentId: '2b25b3d4-4eaa-4859-a34e-c7869c114c15',
  homeOfficeId: '06056197-bc69-4147-aa28-070bca132178',
  manualId: '87e2748f-2e9b-4681-8baa-778b6d326a8a',
  path: '/guidance/immigration-rules/immigration-rules-appendix-eta-national-list',
  requestUrl: 'https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list',
  publicUrl: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list',
  profileId: 'govuk-eta-national-list-content-api-en',
})
export const NATIONAL_ITEM = Object.freeze({ sourceId: NATIONAL_LIST.sourceId,
  contentItemId: NATIONAL_LIST.contentItemId, contentItemVersion: 1, current: true,
  externalIdNamespace: 'govuk-content-id', externalContentId: NATIONAL_LIST.contentId,
  expectedPublisherIds: Object.freeze([NATIONAL_LIST.homeOfficeId]),
  expectedAuthorityIds: Object.freeze([NATIONAL_LIST.homeOfficeId]),
})
export const NATIONAL_REPRESENTATION = Object.freeze({ sourceId: NATIONAL_LIST.sourceId,
  contentItemId: NATIONAL_LIST.contentItemId, contentItemVersion: 1,
  representationId: 'eta-national-list-api-en', representationVersion: 1, current: true,
  requestUrls: Object.freeze([NATIONAL_LIST.requestUrl]), expectedFinalUrl: NATIONAL_LIST.requestUrl,
  expectedMediaType: 'application/json', expectedLocale: 'en', expectedSchema: 'manual_section',
  identityProfileId: NATIONAL_LIST.profileId, identityProfileVersion: 1,
})
