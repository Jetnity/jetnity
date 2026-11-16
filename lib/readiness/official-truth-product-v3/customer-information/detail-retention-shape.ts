/** Finite JSONB custody shape for canonical entry_information details.
 * The canonical reader separately proves requirement/topic, cross-field meaning,
 * exact official action registration and full source/method/acceptance binding.
 */
import type { S1Shape } from '../storage/retention-shape'

const lit = (value: string): S1Shape => ({ type: 'literal', value })
const enumeration = (values: readonly string[]): S1Shape => ({ type: 'enum', values })
const text = (pattern: string, maximum: number): S1Shape => ({ type: 'string', pattern, maximum })
const integer = (minimum: number, maximum: number): S1Shape => ({ type: 'integer', minimum, maximum })
const object = (properties: Readonly<Record<string, S1Shape>>): S1Shape => ({ type: 'object', properties, optional: [] })
const array = (items: S1Shape, minimum: number, maximum: number, unique = false): S1Shape => ({ type: 'array', items, minimum, maximum, unique })
const union = (...choices: S1Shape[]): S1Shape => ({ type: 'union', choices })
const nullable = (value: S1Shape) => union({ type: 'null' }, value)
const kind = (name: string, fields: Readonly<Record<string, S1Shape>>) => object({ kind: lit(name), ...fields })
const bool: S1Shape = { type: 'boolean' }, label = text('^.{1,160}$', 160)
const amount = object({ value: text('^(?:0|[1-9][0-9]{0,8})(?:\\.[0-9]{1,4})?$', 14), currency: text('^[A-Z]{3}$', 3),
  basis: enumeration(['per_person', 'per_application', 'per_entry', 'per_day', 'per_stay', 'per_group']) })
const cost = union(object({ status: lit('unavailable') }), object({ status: lit('free') }), object({ status: lit('specified'), amount }))
const duration = object({ value: integer(1, 3660), unit: enumeration(['hours', 'days', 'months', 'years']) })
const id = text('^[a-z][a-z0-9_-]{1,63}$', 64)
const source = object({ sourceId: id, contentItemId: id, representationId: id })
const action = object({ source, purpose: enumeration(['application', 'form', 'appointment', 'information']), href: text('^https://[^\\s]+$', 2048) })
const effect = enumeration(['required', 'not_required'])

export const V3_CUSTOMER_DETAIL_RETENTION_SHAPE: S1Shape = union(
  kind('vaccination_details', { classification: enumeration(['required', 'recommended']), vaccines: array(object({
    vaccineLabel: label, diseaseLabel: label, minimumDoses: nullable(integer(1, 20)), beforeEntry: nullable(duration), certificateRequired: nullable(bool),
  }), 1, 16) }),
  kind('health_measures', { measures: array(object({ measure: enumeration(['test', 'quarantine', 'screening', 'isolation', 'health_declaration', 'treatment']),
    classification: enumeration(['required', 'recommended']), measureLabel: label, duration: nullable(duration), proofRequired: nullable(bool),
  }), 1, 16) }),
  kind('entry_form_details', { formTitle: label, completion: enumeration(['required', 'optional']), cost, action: nullable(action),
    due: nullable(object({ relation: enumeration(['before_entry', 'on_arrival', 'before_departure']), offset: nullable(duration) })) }),
  kind('fee_details', { feeLabel: label, purpose: enumeration(['visa', 'electronic_travel_authorization', 'entry_form', 'arrival', 'departure', 'tourism', 'health']),
    cost, paymentTiming: enumeration(['application', 'before_entry', 'on_arrival', 'on_departure', 'unavailable']) }),
  kind('fraud_warning', { warning: enumeration(['unofficial_intermediaries', 'imitation_website', 'excessive_fees', 'personal_data_theft']), officialAction: nullable(action) }),
  kind('ticket_details', { effect, ticket: enumeration(['return', 'onward', 'return_or_onward']) }),
  kind('financial_means_details', { effect, minimum: nullable(amount), acceptedProofs: array(enumeration([
    'cash', 'bank_statement', 'payment_card', 'sponsorship', 'prepaid_accommodation', 'employment_income',
  ]), 0, 6, true) }),
  kind('minor_travel_details', { appliesBelowAge: integer(1, 25), documents: array(enumeration([
    'own_travel_document', 'birth_certificate', 'parental_consent', 'custody_order', 'death_certificate', 'guardian_identity',
  ]), 1, 6, true) }),
  kind('parental_consent_details', { effect, signatories: nullable(enumeration(['all_legal_guardians', 'non_travelling_legal_guardian', 'one_legal_guardian'])),
    notarisationRequired: nullable(bool), translationRequired: nullable(bool), officialForm: nullable(action) }),
  kind('customs_details', { category: enumeration(['cash', 'alcohol', 'tobacco', 'medicines', 'food', 'plants', 'animals', 'personal_goods']),
    disposition: enumeration(['prohibited', 'declaration_required', 'permit_required', 'allowance']),
    allowance: nullable(object({ value: text('^(?:0|[1-9][0-9]{0,8})(?:\\.[0-9]{1,4})?$', 14),
      unit: enumeration(['items', 'grams', 'kilograms', 'millilitres', 'litres']) })), monetaryThreshold: nullable(amount), officialAction: nullable(action) }),
  kind('document_alternative_details', { acceptedDocument: enumeration(['passport', 'national_id']), replacesPassport: bool,
    documentClass: nullable(enumeration(['ordinary', 'temporary', 'emergency'])) }),
  kind('dual_national_details', { destinationNationalityHeld: bool, entryDocument: enumeration(['destination_passport', 'destination_national_id', 'either_citizenship_document']),
    departureDocument: nullable(enumeration(['same_document', 'destination_passport', 'destination_national_id'])) }),
  kind('change_notice', { changedOn: nullable({ type: 'date' }), effectiveFrom: nullable({ type: 'date' }),
    change: enumeration(['introduced', 'removed', 'conditions_changed', 'fee_changed', 'form_changed', 'document_rule_changed']), changedTopic: label,
    priorRuleReference: nullable(text('^rule-version:v3:[a-f0-9]{64}$', 80)), announcement: nullable(action) }),
)
