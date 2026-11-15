import type { V3GlobalRuleContext, V3RuleFact } from '../contract'
import type { V3CustomerInformationTopic } from './topics'
import { v3CustomerDetailTopic } from './detail-topic'

/** Exact existing semantics only. In particular, visa-free is not ETA-free;
 * requiring an ID does not establish that it replaces a passport; generic
 * health/vaccination effects do not name a measure or recommended vaccine.
 */
export function v3CanonicalInformationTopic(context: V3GlobalRuleContext, fact: V3RuleFact): V3CustomerInformationTopic | null {
  if (fact.fact.kind === 'entry_information') return v3CustomerDetailTopic(fact.fact.detail)
  if (fact.fact.kind === 'passport_validity') return 'passport_validity'
  if (fact.fact.kind === 'blank_passport_pages') return 'blank_passport_pages'
  if (fact.fact.kind === 'stay_limit') return 'stay_limit'
  if (fact.fact.kind === 'transit_conditions') return 'transit'
  if (fact.fact.kind === 'official_actions') return 'official_actions'
  if (fact.fact.kind !== 'requirement_effect' && fact.fact.kind !== 'visa_options') return null
  const map = {
    visa: 'visa', electronic_travel_authorization: 'electronic_travel_authorization', passport: 'passport',
    health_document: 'health_documents', insurance: 'insurance',
    onward_or_return_ticket: 'onward_return_ticket', financial_means: 'financial_means',
    booking_or_travel_document: 'booking_or_travel_document',
  } as const
  const requirement = context.scope.requirementType
  return requirement in map ? map[requirement as keyof typeof map] : null
}

/** Derived anew from the current accepted result. A view may link these topics
 * to the original card; it must not keep independent copies after result expiry.
 */
export function v3CanonicalRelatedInformationTopics(_context: V3GlobalRuleContext, fact: V3RuleFact): readonly V3CustomerInformationTopic[] {
  if (fact.fact.kind !== 'entry_information') return []
  const detail = fact.fact.detail, related: V3CustomerInformationTopic[] = []
  if (detail.kind === 'entry_form_details') {
    if (detail.cost.status !== 'unavailable') related.push('form_costs')
    if (detail.action) related.push('official_actions')
  } else if ((detail.kind === 'fraud_warning' || detail.kind === 'customs_details') && detail.officialAction) related.push('official_actions')
  else if (detail.kind === 'parental_consent_details' && detail.officialForm) related.push('official_actions')
  else if (detail.kind === 'change_notice' && detail.announcement) related.push('official_actions')
  return related
}
