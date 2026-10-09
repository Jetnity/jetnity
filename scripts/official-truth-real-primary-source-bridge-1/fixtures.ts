// SYNTHETIC ONLY. Audited official envelope shape; no captured government body,
// publishing identifier, personal data or claim of official legal semantics.
import { NATIONAL_LIST as N } from './manifest'

export const FIXTURE_TIME = '2026-10-09T12:00:00.000Z'
export const FIXTURE_BODY = '<p>Synthetic nationality list; no legal effect.</p>\n<div class="legislative-list-wrapper"><ol class="legislative-list"><li>Switzerland</li></ol></div>'
function link(id: string, path: string, schema: string) {
  return { api_path: `/api/content${path}`, api_url: `https://www.gov.uk/api/content${path}`,
    base_path: path, content_id: id, document_type: schema, links: {}, locale: 'en', schema_name: schema,
    title: 'Synthetic public display', web_url: `https://www.gov.uk${path}`, withdrawn: false }
}
export function nationalListFixture() {
  const organisation = { ...link(N.homeOfficeId, '/government/organisations/home-office', 'organisation'),
    details: { organisation_govuk_status: { status: 'live' } } }
  return { analytics_identifier: null, base_path: N.path, content_id: N.contentId,
    description: 'Synthetic source observation only', details: { attachments: [], body: FIXTURE_BODY,
      change_history: [], manual: { base_path: '/guidance/immigration-rules' }, organisations: [], visually_expanded: false },
    document_type: 'manual_section', first_published_at: FIXTURE_TIME,
    links: { available_translations: [link(N.contentId, N.path, 'manual_section')],
      manual: [link(N.manualId, '/guidance/immigration-rules', 'manual')],
      organisations: [organisation], primary_publishing_organisation: [structuredClone(organisation)] },
    locale: 'en', phase: 'live', public_updated_at: FIXTURE_TIME, publishing_app: 'manuals-publisher',
    publishing_request_id: null, publishing_scheduled_at: null, rendering_app: 'frontend',
    scheduled_publishing_delay_seconds: null, schema_name: 'manual_section',
    title: 'Synthetic National List fixture', updated_at: FIXTURE_TIME, withdrawn_notice: {} }
}

/** SYNTHETIC structural coverage only, deliberately NOT a qualified observation.
 * Exercises every optional linked-metadata family without copying real values. */
export function nationalListStructuralFixture() {
  const row = nationalListFixture()
  const publicMetadata = { acronym: 'SYN', brand: 'synthetic-brand',
    default_news_image: { high_resolution_url: 'https://assets.publishing.service.gov.uk/media/synthetic/high.png',
      url: 'https://assets.publishing.service.gov.uk/media/synthetic/low.png' },
    logo: { crest: 'synthetic-crest', formatted_title: 'Synthetic<br/>organisation' },
    organisation_govuk_status: { status: 'live', updated_at: FIXTURE_TIME,
      url: 'https://www.gov.uk/government/organisations/home-office' } }
  return { ...row, details: { ...row.details,
    change_history: [{ public_timestamp: FIXTURE_TIME, note: 'Synthetic change only' }],
    organisations: [{ title: 'Synthetic organisation', abbreviation: 'SYN',
      web_url: 'https://www.gov.uk/government/organisations/home-office' }] },
    links: { ...row.links,
      available_translations: row.links.available_translations.map(x => ({ ...x, public_updated_at: FIXTURE_TIME })),
      manual: row.links.manual.map(x => ({ ...x, public_updated_at: FIXTURE_TIME })),
      organisations: row.links.organisations.map(x => ({ ...x, analytics_identifier: 'synthetic-analytics', details: publicMetadata })),
      primary_publishing_organisation: row.links.primary_publishing_organisation.map(x => ({ ...x,
        analytics_identifier: 'synthetic-analytics', details: structuredClone(publicMetadata) })),
    } }
}
