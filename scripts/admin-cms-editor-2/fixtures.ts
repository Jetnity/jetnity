// Synthetic editorial responses only. These fixtures are never imported by a
// product route and do not certify installation or database behavior.
import type { CmsCommand } from '@/lib/admin/content/cms/contract'

export const CMS_TEST_ENTRY = 'geonames:1650535'
export const CMS_TEST_OTHER = 'geonames:2267057'
export const CMS_TEST_ID = '11111111-1111-4111-8111-111111111111'
export const CMS_TEST_AT = '2026-11-15T12:00:00.123456Z'
const references = {
  [CMS_TEST_ENTRY]: { entryId: CMS_TEST_ENTRY, locale: 'de', name: 'Bali', country: 'Indonesien', image: '/images/bali.jpg' },
  [CMS_TEST_OTHER]: { entryId: CMS_TEST_OTHER, locale: 'de', name: 'Lissabon', country: 'Portugal', image: '/images/lisbon.jpg' },
}
export const CMS_TEST_COPY = { beschreibung: 'Ruhige Wege und Kultur entdecken.', idea: 'Eine Woche mit Zeit für Natur.', themen: ['natur'] }
export function fixtureRevision(revision: string, options: {
  entryId?: keyof typeof references; copy?: typeof CMS_TEST_COPY; restoredFrom?: string | null
} = {}) {
  const entryId = options.entryId ?? CMS_TEST_ENTRY
  return { entryId, revision, content: { ...references[entryId], ...(options.copy ?? CMS_TEST_COPY) },
    createdBy: CMS_TEST_ID, createdAt: CMS_TEST_AT, restoredFromRevision: options.restoredFrom ?? null }
}
export function fixtureRead(options: {
  entryId?: keyof typeof references; version?: string; draft?: string | null; published?: string | null; archived?: boolean
  revisions?: ReturnType<typeof fixtureRevision>[]; before?: string | null; preview?: ReturnType<typeof fixtureRevision> | null
} = {}) {
  const entryId = options.entryId ?? CMS_TEST_ENTRY
  const draft = options.draft ?? null
  const revisions = options.revisions ?? (draft ? [fixtureRevision(draft, { entryId })] : [])
  const published = options.published ?? null
  return { schema: 1, entry: { ...references[entryId], version: options.version ?? draft ?? '0', draftRevision: draft,
    publishedRevision: published, publishedAt: published ? CMS_TEST_AT : null, archived: options.archived ?? false, updatedAt: CMS_TEST_AT },
    preview: options.preview === undefined ? revisions.find(item => item.revision === draft) ?? null : options.preview,
    history: revisions, nextBeforeRevision: options.before ?? null }
}
export function fixtureReceipt(command: CmsCommand, options: { draft: string; published?: string | null; created?: string | null; archived?: boolean }) {
  return { schema: 1, status: 'recorded', requestId: command.requestId, entryId: command.entryId, action: command.action,
    beforeVersion: command.expectedVersion, version: (BigInt(command.expectedVersion) + 1n).toString(),
    draftRevision: options.draft, publishedRevision: options.published ?? null, archived: options.archived ?? false,
    createdRevision: options.created ?? null, recordedAt: CMS_TEST_AT }
}
