// Research allowlist, NOT a registered/approved Source or Content Identity.
export const CH_DE_RESEARCH_SOURCES = Object.freeze([
  Object.freeze({ key: 'S1', item: 'visa-country-table', externalId: '207820',
    url: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820' }),
  Object.freeze({ key: 'S2', item: 'visa-faq', externalId: '606470',
    url: 'https://www.auswaertiges-amt.de/de/service/fragenkatalog-node/01-visumnoetig-606470' }),
] as const)

export const CH_DE_RELEASE_BLOCKERS = Object.freeze([
  'whole_source_not_qualified',
  'aa_identity_and_privacy_profile_not_approved',
  'legal_scope_and_effective_interval_unproven',
  'ordinary_passport_subclass_not_in_canonical_context',
  'purpose_and_direct_route_not_in_provider_contract',
  'trusted_accepted_reader_unavailable',
  'owner_acceptance_and_activation_not_authorized',
] as const)
