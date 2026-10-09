// Wholly invented developer example. No live source content, people or metadata.
import type { ResearchIntent } from './packet'
import { SOURCE_LABELS, URLS } from './catalog'

export function syntheticIntent(): ResearchIntent {
  return {
    schemaVersion: 1, intent: 'UK_ETA_LEGAL_PROOF_GAPS', observedAt: '2026-10-09T12:00:00.000Z',
    scope: {
      destinationCountryCode: 'GB', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: ['CH'] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      residence: { mode: 'not_applicable' }, requirementType: 'electronic_travel_authorization',
      validity: { mode: 'travel_date', travelDate: '2026-11-01' },
    },
    journey: 'INBOUND_DESTINATION', applicationScenario: 'NEVER_APPLIED', contextCoverage: [], permissionCoverage: [],
    observations: SOURCE_LABELS.map(source => ({ source, url: URLS[source], origin: 'SYNTHETIC',
      retrievedAt: '2026-10-09T11:00:00.000Z', publishedAt: null, interpretation: 'UNRESOLVED' })),
  }
}
