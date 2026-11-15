/** Structured details carried by the canonical entry_information fact.
 * Shape validation is deliberately not qualification, method approval or an
 * accepted-store receipt. The existing import/evidence/acceptance chain remains
 * responsible for proving and publishing every value, including explicit false.
 */
import { z } from 'zod'
import { schema2DatenPruefen } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { OfficialRequirementType } from '@/types/trips'

const label = z.string().min(1).max(160).refine(value => value.trim() === value
  && !/[\u0000-\u001f\u007f<>@]/.test(value) && !value.includes('://'))
const amount = z.object({
  // Exact decimal currency units; no floating-point calculation or FX inference.
  value: z.string().regex(/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,4})?$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  basis: z.enum(['per_person', 'per_application', 'per_entry', 'per_day', 'per_stay', 'per_group']),
}).strict()
const cost = z.discriminatedUnion('status', [
  z.object({ status: z.literal('unavailable') }).strict(),
  z.object({ status: z.literal('free') }).strict(),
  z.object({ status: z.literal('specified'), amount }).strict(),
])
const duration = z.object({ value: z.number().int().min(1).max(3660), unit: z.enum(['hours', 'days', 'months', 'years']) }).strict()
const id = z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/)
const ref = z.object({ sourceId: id, contentItemId: id, representationId: id }).strict()
const action = z.object({ source: ref, purpose: z.enum(['application', 'form', 'appointment', 'information']),
  href: z.string().url().max(2048).refine(value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.hash }
    catch { return false }
  }) }).strict()
const date = z.string().regex(/^\d{4}-\d\d-\d\d$/).refine(value => {
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value
})

/** Finite fields retain the whole legal observation in the ordinary V3 envelope.
 * No generic prose field can stand in for a missing typed legal fact.
 */
const detailSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('vaccination_details'), classification: z.enum(['required', 'recommended']),
    vaccines: z.array(z.object({ vaccineLabel: label, diseaseLabel: label,
      minimumDoses: z.number().int().min(1).max(20).nullable(),
      beforeEntry: duration.nullable(), certificateRequired: z.boolean().nullable() }).strict()).min(1).max(16) }).strict(),
  z.object({ kind: z.literal('health_measures'), measures: z.array(z.object({
    measure: z.enum(['test', 'quarantine', 'screening', 'isolation', 'health_declaration', 'treatment']),
    classification: z.enum(['required', 'recommended']), measureLabel: label,
    duration: duration.nullable(), proofRequired: z.boolean().nullable(),
  }).strict()).min(1).max(16) }).strict(),
  z.object({ kind: z.literal('entry_form_details'), formTitle: label,
    completion: z.enum(['required', 'optional']), cost, action: action.nullable(),
    due: z.object({ relation: z.enum(['before_entry', 'on_arrival', 'before_departure']),
      offset: duration.nullable() }).strict().nullable() }).strict(),
  z.object({ kind: z.literal('fee_details'), feeLabel: label,
    purpose: z.enum(['visa', 'electronic_travel_authorization', 'entry_form', 'arrival', 'departure', 'tourism', 'health']),
    cost, paymentTiming: z.enum(['application', 'before_entry', 'on_arrival', 'on_departure', 'unavailable']) }).strict(),
  z.object({ kind: z.literal('fraud_warning'), warning: z.enum([
    'unofficial_intermediaries', 'imitation_website', 'excessive_fees', 'personal_data_theft',
  ]), officialAction: action.nullable() }).strict(),
  z.object({ kind: z.literal('ticket_details'), effect: z.enum(['required', 'not_required']),
    ticket: z.enum(['return', 'onward', 'return_or_onward']) }).strict(),
  z.object({ kind: z.literal('financial_means_details'), effect: z.enum(['required', 'not_required']),
    minimum: amount.nullable(), acceptedProofs: z.array(z.enum([
      'cash', 'bank_statement', 'payment_card', 'sponsorship', 'prepaid_accommodation', 'employment_income',
    ])).max(6).refine(values => new Set(values).size === values.length) }).strict(),
  z.object({ kind: z.literal('minor_travel_details'), appliesBelowAge: z.number().int().min(1).max(25),
    documents: z.array(z.enum(['own_travel_document', 'birth_certificate', 'parental_consent',
      'custody_order', 'death_certificate', 'guardian_identity'])).min(1).max(6)
      .refine(values => new Set(values).size === values.length) }).strict(),
  z.object({ kind: z.literal('parental_consent_details'), effect: z.enum(['required', 'not_required']),
    signatories: z.enum(['all_legal_guardians', 'non_travelling_legal_guardian', 'one_legal_guardian']).nullable(),
    notarisationRequired: z.boolean().nullable(), translationRequired: z.boolean().nullable(),
    officialForm: action.nullable() }).strict(),
  z.object({ kind: z.literal('customs_details'), category: z.enum([
    'cash', 'alcohol', 'tobacco', 'medicines', 'food', 'plants', 'animals', 'personal_goods',
  ]), disposition: z.enum(['prohibited', 'declaration_required', 'permit_required', 'allowance']),
    allowance: z.object({ value: z.string().regex(/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,4})?$/),
      unit: z.enum(['items', 'grams', 'kilograms', 'millilitres', 'litres']),
    }).strict().nullable(), monetaryThreshold: amount.nullable(),
    officialAction: action.nullable() }).strict(),
  z.object({ kind: z.literal('document_alternative_details'), acceptedDocument: z.enum(['passport', 'national_id']),
    replacesPassport: z.boolean(), documentClass: z.enum(['ordinary', 'temporary', 'emergency']).nullable() }).strict(),
  z.object({ kind: z.literal('dual_national_details'), destinationNationalityHeld: z.boolean(),
    entryDocument: z.enum(['destination_passport', 'destination_national_id', 'either_citizenship_document']),
    departureDocument: z.enum(['same_document', 'destination_passport', 'destination_national_id']).nullable() }).strict(),
  z.object({ kind: z.literal('change_notice'), changedOn: date.nullable(), effectiveFrom: date.nullable(),
    change: z.enum(['introduced', 'removed', 'conditions_changed', 'fee_changed', 'form_changed', 'document_rule_changed']),
    changedTopic: label, priorRuleReference: z.string().regex(/^rule-version:v3:[a-f0-9]{64}$/).nullable(),
    announcement: action.nullable() }).strict(),
]).superRefine((value, context) => {
  const invalid = () => context.addIssue({ code: z.ZodIssueCode.custom, message: 'inconsistent_detail' })
  if (value.kind === 'entry_form_details' && value.due?.relation === 'on_arrival' && value.due.offset !== null) invalid()
  if (value.kind === 'document_alternative_details' && value.acceptedDocument === 'passport' && value.replacesPassport) invalid()
  if (value.kind === 'financial_means_details' && value.effect === 'not_required'
    && (value.minimum !== null || value.acceptedProofs.length !== 0)) invalid()
  if (value.kind === 'parental_consent_details' && value.effect === 'not_required'
    && (value.signatories !== null || value.notarisationRequired !== null || value.translationRequired !== null || value.officialForm !== null)) invalid()
  if (value.kind === 'customs_details' && value.disposition === 'prohibited'
    && (value.allowance !== null || value.monetaryThreshold !== null)) invalid()
})

export type V3CustomerInformationDetail = z.infer<typeof detailSchema>
export type V3ResearchCost = z.infer<typeof cost>

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

export function readV3CustomerInformationDetail(value: unknown):
  Readonly<{ ok: true; value: V3CustomerInformationDetail }> | Readonly<{ ok: false; reason: 'invalid_research_detail' }> {
  if (schema2DatenPruefen(value)) return Object.freeze({ ok: false, reason: 'invalid_research_detail' })
  try {
    const result = detailSchema.safeParse(JSON.parse(JSON.stringify(value)))
    return result.success ? freeze({ ok: true, value: result.data }) : Object.freeze({ ok: false, reason: 'invalid_research_detail' })
  } catch { return Object.freeze({ ok: false, reason: 'invalid_research_detail' }) }
}

/** Only syntactically declared actions. This does not verify their URLs or source. */
export function v3CustomerDetailActions(detail: V3CustomerInformationDetail): readonly z.infer<typeof action>[] {
  if (detail.kind === 'entry_form_details') return detail.action ? [detail.action] : []
  if (detail.kind === 'fraud_warning' || detail.kind === 'customs_details') return detail.officialAction ? [detail.officialAction] : []
  if (detail.kind === 'parental_consent_details') return detail.officialForm ? [detail.officialForm] : []
  if (detail.kind === 'change_notice') return detail.announcement ? [detail.announcement] : []
  return []
}

/** A detail never changes its enclosing canonical requirement taxonomy. */
export function v3CustomerDetailRequirementMatches(detail: V3CustomerInformationDetail, requirement: OfficialRequirementType): boolean {
  switch (detail.kind) {
    case 'vaccination_details': return requirement === 'vaccination'
    case 'health_measures': return requirement === 'health'
    case 'entry_form_details': return requirement === 'entry_form'
    case 'ticket_details': return requirement === 'onward_or_return_ticket'
    case 'financial_means_details': return requirement === 'financial_means'
    case 'document_alternative_details': return requirement === 'identity_document'
    case 'fee_details': return detail.purpose === 'visa' ? requirement === 'visa'
      : detail.purpose === 'electronic_travel_authorization' ? requirement === 'electronic_travel_authorization'
        : detail.purpose === 'entry_form' ? requirement === 'entry_form' : requirement === 'other_entry_requirement'
    default: return requirement === 'other_entry_requirement'
  }
}
