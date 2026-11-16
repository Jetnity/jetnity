import type { OfficialRequirementType } from '@/types/trips'

/** Customer coverage vocabulary, not an approved rule or a requirement result.
 * A topic's presence never means required, not_required, checked or current.
 * The visitor view fills only from its still-current accepted source facts.
 */
export const V3_CUSTOMER_INFORMATION_GROUPS = Object.freeze([
  Object.freeze({ id: 'permission', label: 'Einreise und Aufenthalt' }),
  Object.freeze({ id: 'documents', label: 'Reisedokumente' }),
  Object.freeze({ id: 'health', label: 'Impfungen und Gesundheit' }),
  Object.freeze({ id: 'forms_costs', label: 'Formulare und Kosten' }),
  Object.freeze({ id: 'border', label: 'Grenze und besondere Situationen' }),
  Object.freeze({ id: 'updates', label: 'Änderungen und amtliche Schritte' }),
] as const)

export type V3CustomerInformationGroup = (typeof V3_CUSTOMER_INFORMATION_GROUPS)[number]['id']

export const V3_CUSTOMER_INFORMATION_TOPICS = Object.freeze([
  Object.freeze({ id: 'visa', label: 'Visum', group: 'permission' }),
  Object.freeze({ id: 'electronic_travel_authorization', label: 'Elektronische Reisegenehmigung (ETA)', group: 'permission' }),
  Object.freeze({ id: 'stay_limit', label: 'Zulässige Aufenthaltsdauer', group: 'permission' }),
  Object.freeze({ id: 'passport', label: 'Reisepass', group: 'documents' }),
  Object.freeze({ id: 'identity_document', label: 'Identitätskarte statt Reisepass', group: 'documents' }),
  Object.freeze({ id: 'passport_validity', label: 'Passgültigkeit', group: 'documents' }),
  Object.freeze({ id: 'blank_passport_pages', label: 'Freie Passseiten', group: 'documents' }),
  Object.freeze({ id: 'required_vaccinations', label: 'Pflichtimpfungen und Impfstoffnamen', group: 'health' }),
  Object.freeze({ id: 'recommended_vaccinations', label: 'Empfohlene Impfungen und Impfstoffnamen', group: 'health' }),
  Object.freeze({ id: 'health_measures', label: 'Gesundheitsmassnahmen', group: 'health' }),
  Object.freeze({ id: 'health_documents', label: 'Gesundheitsnachweise', group: 'health' }),
  Object.freeze({ id: 'insurance', label: 'Versicherung', group: 'health' }),
  Object.freeze({ id: 'entry_forms', label: 'Einreiseformulare und Formularnamen', group: 'forms_costs' }),
  Object.freeze({ id: 'form_costs', label: 'Formularkosten (Betrag und Währung)', group: 'forms_costs' }),
  Object.freeze({ id: 'fraud_warnings', label: 'Amtliche Warnungen vor Betrugsseiten', group: 'forms_costs' }),
  Object.freeze({ id: 'entry_fees', label: 'Gebühren (Betrag und Währung)', group: 'forms_costs' }),
  Object.freeze({ id: 'onward_return_ticket', label: 'Rückreise- oder Weiterreiseticket', group: 'border' }),
  Object.freeze({ id: 'financial_means', label: 'Geldnachweis', group: 'border' }),
  Object.freeze({ id: 'booking_or_travel_document', label: 'Buchungs- und Reisenachweise', group: 'border' }),
  Object.freeze({ id: 'transit', label: 'Transit', group: 'border' }),
  Object.freeze({ id: 'minors', label: 'Minderjährige', group: 'border' }),
  Object.freeze({ id: 'parental_consent', label: 'Einverständniserklärung für Minderjährige', group: 'border' }),
  Object.freeze({ id: 'customs', label: 'Zoll', group: 'border' }),
  Object.freeze({ id: 'dual_nationals', label: 'Doppelbürger und weitere Staatsangehörigkeiten', group: 'border' }),
  Object.freeze({ id: 'recent_changes', label: 'Kürzliche Änderungen', group: 'updates' }),
  Object.freeze({ id: 'official_actions', label: 'Amtliche Links zum Erledigen', group: 'updates' }),
] as const satisfies readonly Readonly<{ id: string; label: string; group: V3CustomerInformationGroup }>[])

export type V3CustomerInformationTopic = (typeof V3_CUSTOMER_INFORMATION_TOPICS)[number]['id']

export const V3_CUSTOMER_INFORMATION_TOPIC_IDS = Object.freeze(
  V3_CUSTOMER_INFORMATION_TOPICS.map(topic => topic.id),
)

/** Reviewed semantic words only, e.g. arrival_card, cash_allowance, standard_fee.
 * The source/method program owns this key across revisions. Never derive it from
 * prices, dates, a URL, source hashes or an operation ID to reset a subject.
 * Syntax alone does not grant that program's approval or establish its meaning.
 */
export const V3_INFORMATION_ITEM_PATTERN = '^[a-z]{2,24}(?:_[a-z]{2,24}){0,7}$'
export function v3InformationItemValid(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && new RegExp(V3_INFORMATION_ITEM_PATTERN).exec(value)?.[0] === value
}

/** The finite relation is shared by the canonical reader and the generated SQL
 * context/JSONB validators. Adding a display topic never implicitly widens it.
 */
export const V3_CUSTOMER_DETAIL_BINDINGS = Object.freeze([
  { topic: 'required_vaccinations', requirement: 'vaccination', detailKind: 'vaccination_details', discriminator: { key: 'classification', values: ['required'] } },
  { topic: 'recommended_vaccinations', requirement: 'vaccination', detailKind: 'vaccination_details', discriminator: { key: 'classification', values: ['recommended'] } },
  { topic: 'health_measures', requirement: 'health', detailKind: 'health_measures' },
  { topic: 'entry_forms', requirement: 'entry_form', detailKind: 'entry_form_details' },
  { topic: 'form_costs', requirement: 'entry_form', detailKind: 'fee_details', discriminator: { key: 'purpose', values: ['entry_form'] } },
  { topic: 'entry_fees', requirement: 'visa', detailKind: 'fee_details', discriminator: { key: 'purpose', values: ['visa'] } },
  { topic: 'entry_fees', requirement: 'electronic_travel_authorization', detailKind: 'fee_details', discriminator: { key: 'purpose', values: ['electronic_travel_authorization'] } },
  { topic: 'entry_fees', requirement: 'other_entry_requirement', detailKind: 'fee_details', discriminator: { key: 'purpose', values: ['arrival', 'departure', 'tourism', 'health'] } },
  { topic: 'fraud_warnings', requirement: 'other_entry_requirement', detailKind: 'fraud_warning' },
  { topic: 'onward_return_ticket', requirement: 'onward_or_return_ticket', detailKind: 'ticket_details' },
  { topic: 'financial_means', requirement: 'financial_means', detailKind: 'financial_means_details' },
  { topic: 'minors', requirement: 'other_entry_requirement', detailKind: 'minor_travel_details' },
  { topic: 'parental_consent', requirement: 'other_entry_requirement', detailKind: 'parental_consent_details' },
  { topic: 'customs', requirement: 'other_entry_requirement', detailKind: 'customs_details' },
  { topic: 'identity_document', requirement: 'identity_document', detailKind: 'document_alternative_details' },
  { topic: 'dual_nationals', requirement: 'other_entry_requirement', detailKind: 'dual_national_details' },
  { topic: 'recent_changes', requirement: 'other_entry_requirement', detailKind: 'change_notice' },
] as const satisfies readonly { topic: V3CustomerInformationTopic; requirement: OfficialRequirementType; detailKind: string;
  discriminator?: { key: string; values: readonly string[] } }[])

export function v3InformationTopicRequirementMatches(topic: V3CustomerInformationTopic, requirement: OfficialRequirementType): boolean {
  return V3_CUSTOMER_DETAIL_BINDINGS.some(binding => binding.topic === topic && binding.requirement === requirement)
}
