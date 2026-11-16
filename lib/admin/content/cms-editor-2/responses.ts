import { cmsReference, parseCmsCommand, type CmsCommand } from '../cms/contract'
import { cmsRequestId, parseCmsRecoveryMarker, type CmsRecoveryMarker } from './request'

export type CmsEditable = Extract<CmsCommand, { action: 'save_draft' }>['payload']
type Reference = NonNullable<ReturnType<typeof cmsReference>>
export type CmsRevision = Readonly<{
  entryId: string; revision: string; content: Reference & CmsEditable
  createdBy: string; createdAt: string; restoredFromRevision: string | null
}>
export type CmsReadQuery = Readonly<{ entryId: string; revision?: string; beforeRevision?: string; limit?: number }>
export type CmsRead = Readonly<{
  schema: 1
  entry: Reference & Readonly<{
    version: string; draftRevision: string | null; publishedRevision: string | null
    publishedAt: string | null; archived: boolean; updatedAt: string
  }>
  preview: CmsRevision | null; history: readonly CmsRevision[]; nextBeforeRevision: string | null
}>
export type CmsReceipt = Readonly<{
  schema: 1; status: 'recorded'; requestId: string; entryId: string; action: CmsCommand['action']
  beforeVersion: string; version: string; draftRevision: string; publishedRevision: string | null
  archived: boolean; createdRevision: string | null; recordedAt: string
}>
export type CmsConfirmation = CmsReceipt | Readonly<{ schema: 1; status: 'unknown'; requestId: string }>
type CmsPublished = Readonly<{ schema: 1; items: readonly Readonly<{
  entryId: string; revision: string; content: Reference & CmsEditable; publishedAt: string
}>[] }>

const VALIDATION_ID = '00000000-0000-4000-8000-000000000000'
const MAX_BIGINT = 9_223_372_036_854_775_807n
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function record(input: unknown, expected: readonly string[]): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return null
  const descriptors = Object.getOwnPropertyDescriptors(input)
  const keys = Reflect.ownKeys(descriptors)
  if (keys.length !== expected.length || keys.some(key => typeof key !== 'string' || !expected.includes(key))) return null
  const result: Record<string, unknown> = Object.create(null)
  for (const key of expected) {
    const descriptor = descriptors[key]
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null
    result[key] = descriptor.value
  }
  return result
}

function array(input: unknown, max: number): unknown[] | null {
  if (!Array.isArray(input)) return null
  const descriptors = Object.getOwnPropertyDescriptors(input as object)
  const length: unknown = descriptors.length?.value
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0 || length > max
    || Reflect.ownKeys(descriptors).length !== length + 1) return null
  const values: unknown[] = []
  for (let i = 0; i < length; i++) {
    const descriptor = descriptors[String(i)]
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null
    values.push(descriptor.value)
  }
  return values
}

function decimal(input: unknown, positive = false): input is string {
  return typeof input === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(input)
    && BigInt(input) <= MAX_BIGINT && (!positive || input !== '0')
}
function nullableRevision(input: unknown): input is string | null { return input === null || decimal(input, true) }
function timestamp(input: unknown): input is string {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(input)) return false
  const milliseconds = input.slice(0, 23) + 'Z'
  const value = new Date(milliseconds)
  return Number.isFinite(value.getTime()) && value.toISOString() === milliseconds
}
function referenceMatches(value: Record<string, unknown>, reference: Reference): boolean {
  return Object.entries(reference).every(([key, expected]) => value[key] === expected)
}

/** Reuses the unchanged candidate parser, without minting an operation ID. */
export function cmsEditable(input: unknown, entryId: string): CmsEditable | null {
  const command = parseCmsCommand({ requestId: VALIDATION_ID, entryId, expectedVersion: '0', action: 'save_draft', payload: input })
  return command?.action === 'save_draft' ? command.payload : null
}

function revision(input: unknown, reference: Reference): CmsRevision | null {
  const value = record(input, ['entryId', 'revision', 'content', 'createdBy', 'createdAt', 'restoredFromRevision'])
  if (!value || value.entryId !== reference.entryId || !decimal(value.revision, true)
    || typeof value.createdBy !== 'string' || !UUID.test(value.createdBy) || !timestamp(value.createdAt)
    || !nullableRevision(value.restoredFromRevision)
    || (value.restoredFromRevision !== null && BigInt(value.restoredFromRevision) >= BigInt(value.revision))) return null
  const content = record(value.content, ['entryId', 'locale', 'name', 'country', 'image', 'beschreibung', 'idea', 'themen'])
  if (!content || !referenceMatches(content, reference)) return null
  const editable = cmsEditable({ beschreibung: content.beschreibung, idea: content.idea, themen: content.themen }, reference.entryId)
  return editable ? {
    entryId: reference.entryId, revision: value.revision, content: { ...reference, ...editable },
    createdBy: value.createdBy, createdAt: value.createdAt, restoredFromRevision: value.restoredFromRevision,
  } : null
}

function read(input: unknown, query: CmsReadQuery): CmsRead | null {
  const reference = cmsReference(query.entryId)
  const limit = query.limit ?? 20
  if (!reference || !Number.isInteger(limit) || limit < 1 || limit > 50
    || (query.revision !== undefined && !decimal(query.revision, true))
    || (query.beforeRevision !== undefined && !decimal(query.beforeRevision, true))) return null
  const value = record(input, ['schema', 'entry', 'preview', 'history', 'nextBeforeRevision'])
  if (!value || value.schema !== 1 || !nullableRevision(value.nextBeforeRevision)) return null
  const entry = record(value.entry, ['entryId', 'locale', 'name', 'country', 'image', 'version', 'draftRevision', 'publishedRevision', 'publishedAt', 'archived', 'updatedAt'])
  if (!entry || !referenceMatches(entry, reference) || !decimal(entry.version)
    || !nullableRevision(entry.draftRevision) || !nullableRevision(entry.publishedRevision)
    || typeof entry.archived !== 'boolean' || !timestamp(entry.updatedAt)
    || !(entry.publishedAt === null || timestamp(entry.publishedAt))
    || ((entry.publishedRevision === null) !== (entry.publishedAt === null))
    || (entry.archived && entry.publishedRevision !== null)) return null
  if (entry.draftRevision === null) {
    if (entry.version !== '0' || entry.archived || entry.publishedRevision !== null) return null
  } else if (BigInt(entry.draftRevision) > BigInt(entry.version)
    || (entry.publishedRevision !== null && BigInt(entry.publishedRevision) > BigInt(entry.draftRevision))) return null
  const preview = value.preview === null ? null : revision(value.preview, reference)
  const selected = query.revision ?? entry.draftRevision
  if ((selected === null && value.preview !== null) || (selected !== null && (!preview || preview.revision !== selected))) return null
  if (preview && (entry.draftRevision === null || BigInt(preview.revision) > BigInt(entry.draftRevision))) return null
  const items = array(value.history, limit)
  if (!items) return null
  const history: CmsRevision[] = []
  let previous = query.beforeRevision ? BigInt(query.beforeRevision) : MAX_BIGINT + 1n
  for (const item of items) {
    const parsed = revision(item, reference)
    if (!parsed || entry.draftRevision === null || BigInt(parsed.revision) >= previous
      || BigInt(parsed.revision) > BigInt(entry.draftRevision)) return null
    history.push(parsed)
    previous = BigInt(parsed.revision)
  }
  if (query.beforeRevision === undefined && entry.draftRevision !== null && history[0]?.revision !== entry.draftRevision) return null
  const previewInHistory = preview && history.find(item => item.revision === preview.revision)
  if (previewInHistory && JSON.stringify(previewInHistory) !== JSON.stringify(preview)) return null
  if (value.nextBeforeRevision !== null && (history.length !== limit || history.at(-1)?.revision !== value.nextBeforeRevision)) return null
  return {
    schema: 1, entry: { ...reference, version: entry.version, draftRevision: entry.draftRevision,
      publishedRevision: entry.publishedRevision, publishedAt: entry.publishedAt, archived: entry.archived, updatedAt: entry.updatedAt },
    preview, history, nextBeforeRevision: value.nextBeforeRevision,
  }
}

export function parseCmsRead(input: unknown, query: CmsReadQuery): CmsRead | null {
  try { return read(input, query) } catch { return null }
}

function receipt(input: unknown, command: CmsCommand): CmsReceipt | null {
  const value = record(input, ['schema', 'status', 'requestId', 'entryId', 'action', 'beforeVersion', 'version', 'draftRevision', 'publishedRevision', 'archived', 'createdRevision', 'recordedAt'])
  if (!value || value.schema !== 1 || value.status !== 'recorded' || value.requestId !== command.requestId
    || value.entryId !== command.entryId || value.action !== command.action || value.beforeVersion !== command.expectedVersion
    || !decimal(value.version, true) || BigInt(value.version) !== BigInt(command.expectedVersion) + 1n
    || !decimal(value.draftRevision, true) || BigInt(value.draftRevision) > BigInt(value.version)
    || !nullableRevision(value.publishedRevision) || !nullableRevision(value.createdRevision)
    || typeof value.archived !== 'boolean' || !timestamp(value.recordedAt)
    || (value.publishedRevision !== null && BigInt(value.publishedRevision) > BigInt(value.draftRevision))) return null
  if (command.action === 'save_draft' || command.action === 'restore_draft') {
    if (value.createdRevision !== value.draftRevision || value.archived
      || (value.publishedRevision !== null && BigInt(value.publishedRevision) >= BigInt(value.draftRevision))
      || (command.action === 'restore_draft' && BigInt(value.createdRevision) <= BigInt(command.payload.revision))) return null
  } else if (value.createdRevision !== null) return null
  if (command.action === 'publish' && (value.archived || value.draftRevision !== command.payload.revision || value.publishedRevision !== command.payload.revision)) return null
  if (command.action === 'archive' && (!value.archived || value.publishedRevision !== null)) return null
  return {
    schema: 1, status: 'recorded', requestId: command.requestId, entryId: command.entryId, action: command.action,
    beforeVersion: command.expectedVersion, version: value.version, draftRevision: value.draftRevision,
    publishedRevision: value.publishedRevision, archived: value.archived, createdRevision: value.createdRevision, recordedAt: value.recordedAt,
  }
}

export function parseCmsReceipt(input: unknown, command: CmsCommand): CmsReceipt | null {
  try { return receipt(input, command) } catch { return null }
}

export function parseCmsConfirmation(input: unknown, command: CmsCommand): CmsConfirmation | null {
  try {
    const unknown = record(input, ['schema', 'status', 'requestId'])
    if (unknown?.schema === 1 && unknown.status === 'unknown' && unknown.requestId === command.requestId) {
      return { schema: 1, status: 'unknown', requestId: command.requestId }
    }
    return receipt(input, command)
  } catch { return null }
}

/** Reload recovery has no original payload. The actor-bound operation journal
 * can confirm its receipt; it cannot authorize replaying a reconstructed write. */
export function parseCmsRecoveryConfirmation(input: unknown, marker: CmsRecoveryMarker): CmsConfirmation | null {
  try {
    if (!parseCmsRecoveryMarker(marker)) return null
    const unknown = record(input, ['schema', 'status', 'requestId'])
    if (unknown?.schema === 1 && unknown.status === 'unknown' && unknown.requestId === marker.requestId) {
      return { schema: 1, status: 'unknown', requestId: marker.requestId }
    }
    const value = record(input, ['schema', 'status', 'requestId', 'entryId', 'action', 'beforeVersion', 'version', 'draftRevision', 'publishedRevision', 'archived', 'createdRevision', 'recordedAt'])
    if (!value || value.schema !== 1 || value.status !== 'recorded' || value.requestId !== marker.requestId
      || value.entryId !== marker.entryId || value.beforeVersion !== marker.expectedVersion
      || !decimal(value.version, true) || BigInt(value.version) !== BigInt(marker.expectedVersion) + 1n
      || !decimal(value.draftRevision, true) || BigInt(value.draftRevision) > BigInt(value.version)
      || !nullableRevision(value.publishedRevision) || !nullableRevision(value.createdRevision)
      || typeof value.archived !== 'boolean' || !timestamp(value.recordedAt)
      || (value.publishedRevision !== null && BigInt(value.publishedRevision) > BigInt(value.draftRevision))) return null
    const action = value.action
    if (action === 'save_draft' || action === 'restore_draft') {
      if (value.createdRevision !== value.draftRevision || value.archived
        || (value.publishedRevision !== null && BigInt(value.publishedRevision) >= BigInt(value.draftRevision))
        || (action === 'restore_draft' && BigInt(value.draftRevision) < 2n)) return null
    } else if (action === 'publish') {
      if (value.createdRevision !== null || value.archived || value.publishedRevision !== value.draftRevision) return null
    } else if (action === 'archive') {
      if (value.createdRevision !== null || !value.archived || value.publishedRevision !== null) return null
    } else return null
    return { schema: 1, status: 'recorded', requestId: marker.requestId, entryId: marker.entryId,
      action, beforeVersion: marker.expectedVersion, version: value.version, draftRevision: value.draftRevision,
      publishedRevision: value.publishedRevision, archived: value.archived,
      createdRevision: value.createdRevision, recordedAt: value.recordedAt }
  } catch { return null }
}

/** Server boundary for the existing confirm-by-ID RPC. The caller still binds
 * the returned entry and version to its own intent before showing success. */
export function parseCmsStoredConfirmation(input: unknown, requestId: string): CmsConfirmation | null {
  try {
    if (!cmsRequestId(requestId)) return null
    const unknown = record(input, ['schema', 'status', 'requestId'])
    if (unknown?.schema === 1 && unknown.status === 'unknown' && unknown.requestId === requestId) {
      return { schema: 1, status: 'unknown', requestId }
    }
    const value = record(input, ['schema', 'status', 'requestId', 'entryId', 'action', 'beforeVersion', 'version', 'draftRevision', 'publishedRevision', 'archived', 'createdRevision', 'recordedAt'])
    const marker = value && parseCmsRecoveryMarker({ requestId, entryId: value.entryId, expectedVersion: value.beforeVersion })
    return marker ? parseCmsRecoveryConfirmation(input, marker) : null
  } catch { return null }
}

export function cmsRecoveredReadback(readback: CmsRead, receipt: CmsReceipt): 'current' | 'changed' | null {
  if (readback.entry.entryId !== receipt.entryId || BigInt(readback.entry.version) < BigInt(receipt.version)
    || !readback.entry.draftRevision || BigInt(readback.entry.draftRevision) < BigInt(receipt.draftRevision)) return null
  if (BigInt(readback.entry.version) > BigInt(receipt.version)) return 'changed'
  if (readback.entry.draftRevision !== receipt.draftRevision || readback.entry.publishedRevision !== receipt.publishedRevision
    || readback.entry.archived !== receipt.archived) return null
  if (receipt.action === 'save_draft' && readback.preview?.restoredFromRevision !== null) return null
  if (receipt.action === 'restore_draft' && !readback.preview?.restoredFromRevision) return null
  return 'current'
}

export function parseCmsPublished(input: unknown): CmsPublished | null {
  try {
    const value = record(input, ['schema', 'items'])
    if (!value || value.schema !== 1) return null
    const items = array(value.items, 4)
    if (!items) return null
    const seen = new Set<string>(), published: CmsPublished['items'][number][] = []
    for (const item of items) {
      const row = record(item, ['entryId', 'revision', 'content', 'publishedAt'])
      if (!row || typeof row.entryId !== 'string' || !decimal(row.revision, true) || !timestamp(row.publishedAt) || seen.has(row.entryId)) return null
      const reference = cmsReference(row.entryId)
      const content = record(row.content, ['entryId', 'locale', 'name', 'country', 'image', 'beschreibung', 'idea', 'themen'])
      if (!reference || !content || !referenceMatches(content, reference)) return null
      const editable = cmsEditable({ beschreibung: content.beschreibung, idea: content.idea, themen: content.themen }, row.entryId)
      if (!editable) return null
      seen.add(row.entryId)
      published.push({ entryId: row.entryId, revision: row.revision, content: { ...reference, ...editable }, publishedAt: row.publishedAt })
    }
    return { schema: 1, items: published }
  } catch { return null }
}

/** A receipt for a committed operation is not necessarily the current entry. */
export function cmsReadback(readback: CmsRead, receipt: CmsReceipt, command: CmsCommand): 'current' | 'changed' | null {
  if (readback.entry.entryId !== command.entryId || BigInt(readback.entry.version) < BigInt(receipt.version)) return null
  if (!readback.entry.draftRevision || BigInt(readback.entry.draftRevision) < BigInt(receipt.draftRevision)) return null
  if (BigInt(readback.entry.version) > BigInt(receipt.version)) return 'changed'
  if (readback.entry.draftRevision !== receipt.draftRevision || readback.entry.publishedRevision !== receipt.publishedRevision
    || readback.entry.archived !== receipt.archived) return null
  if (command.action === 'save_draft') {
    const content = readback.preview?.content
    if (!content || content.beschreibung !== command.payload.beschreibung || content.idea !== command.payload.idea
      || content.themen.join(',') !== command.payload.themen.join(',')) return null
  }
  if (command.action === 'restore_draft' && readback.preview?.restoredFromRevision !== command.payload.revision) return null
  return 'current'
}
