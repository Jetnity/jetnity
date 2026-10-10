// Research allowlist, NOT a registered/approved Source or Content Identity.
export const CH_DE_COMPACT_RESEARCH_SOURCES = Object.freeze([
  Object.freeze({ key: 'S4', item: 'bern-entry-to-germany', externalId: '2643834-2643834',
    url: 'https://bern.diplo.de/ch-de/service/visa/2643834-2643834' }),
  Object.freeze({ key: 'S5', item: 'bern-schengen-visa-application', externalId: 'schengen-visa-2643132',
    url: 'https://bern.diplo.de/ch-de/service/visa/schengen-visa-2643132' }),
] as const)

export type ChDeCompactSourceKey = (typeof CH_DE_COMPACT_RESEARCH_SOURCES)[number]['key']

export const CH_DE_COMPACT_RELEASE_BLOCKERS = Object.freeze([
  'whole_source_not_qualified',
  'bern_identity_and_privacy_profile_not_approved',
  'legal_scope_and_effective_interval_unproven',
  'ordinary_passport_subclass_not_proven_by_source',
  'purpose_route_and_exceptions_research_gap',
  'trusted_accepted_reader_unavailable',
  'owner_acceptance_and_activation_not_authorized',
] as const)
