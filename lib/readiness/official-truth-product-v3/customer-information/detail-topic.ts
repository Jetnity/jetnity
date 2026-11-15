import type { V3CustomerInformationDetail } from './details'
import type { V3CustomerInformationTopic } from './topics'

export function v3CustomerDetailTopic(detail: V3CustomerInformationDetail): V3CustomerInformationTopic {
  if (detail.kind === 'vaccination_details') return detail.classification === 'required' ? 'required_vaccinations' : 'recommended_vaccinations'
  if (detail.kind === 'fee_details') return detail.purpose === 'entry_form' ? 'form_costs' : 'entry_fees'
  const exact = { health_measures: 'health_measures', entry_form_details: 'entry_forms', fraud_warning: 'fraud_warnings',
    ticket_details: 'onward_return_ticket', financial_means_details: 'financial_means', minor_travel_details: 'minors',
    parental_consent_details: 'parental_consent', customs_details: 'customs', document_alternative_details: 'identity_document',
    dual_national_details: 'dual_nationals', change_notice: 'recent_changes' } as const
  return exact[detail.kind]
}
