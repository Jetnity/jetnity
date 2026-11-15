import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'

/** Candidate only. Parsing editorial copy grants no publication or source authority. */
const MAX_BIGINT = 9_223_372_036_854_775_807n
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const THEMES = ['stadt-kultur', 'natur', 'strand', 'erholung'] as const
type Theme = (typeof THEMES)[number]
type EntryId = (typeof INSPIRATION_ZIELE)[number]['placeId']
type Editable = Readonly<{ beschreibung: string; idea: string; themen: readonly Theme[] }>
type Base = Readonly<{ requestId: string; entryId: EntryId; expectedVersion: string }>

export type CmsCommand = Base & (
  | Readonly<{ action: 'save_draft'; payload: Editable }>
  | Readonly<{ action: 'publish' | 'restore_draft'; payload: Readonly<{ revision: string }> }>
  | Readonly<{ action: 'archive'; payload: Readonly<Record<string, never>> }>
)

function record(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const snapshot: Record<string, unknown> = Object.create(null)
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string') return null
    const descriptor = descriptors[key]
    if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return null
    snapshot[key] = descriptor.value
  }
  return snapshot
}

function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Reflect.ownKeys(value)
  return actual.length === expected.length && actual.every(key => typeof key === 'string' && expected.includes(key))
}

function decimal(value: unknown, positive = false): value is string {
  return typeof value === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(value)
    && BigInt(value) <= MAX_BIGINT && (!positive || value !== '0')
}

function plainText(value: unknown, characters: number, bytes: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
    && !/[\u0000-\u001f\u007f-\u009f<>\uD800-\uDFFF]/u.test(value)
    && [...value].length <= characters && new TextEncoder().encode(value).byteLength <= bytes
}

function editable(input: unknown): Editable | null {
  const value = record(input)
  if (!value || !keys(value, ['beschreibung', 'idea', 'themen'])
    || !plainText(value.beschreibung, 800, 3200) || !plainText(value.idea, 300, 1200)
    || !Array.isArray(value.themen)) return null
  const descriptors = Object.getOwnPropertyDescriptors(value.themen as object)
  const length: unknown = descriptors.length?.value
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 1 || length > 4
    || Reflect.ownKeys(descriptors).length !== length + 1) return null
  const themes: Theme[] = []
  let previous = -1
  for (let at = 0; at < length; at++) {
    const descriptor = descriptors[String(at)]
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return null
    const index = THEMES.findIndex(candidate => candidate === descriptor.value)
    if (index <= previous) return null
    themes.push(THEMES[index])
    previous = index
  }
  return { beschreibung: value.beschreibung, idea: value.idea, themen: themes }
}

function parseCommand(input: unknown): CmsCommand | null {
  const value = record(input)
  if (!value || !keys(value, ['requestId', 'entryId', 'expectedVersion', 'action', 'payload'])
    || typeof value.requestId !== 'string' || !UUID_V4.test(value.requestId)
    || !decimal(value.expectedVersion)) return null
  const reference = INSPIRATION_ZIELE.find(item => item.placeId === value.entryId)
  if (!reference) return null
  const base: Base = { requestId: value.requestId, entryId: reference.placeId, expectedVersion: value.expectedVersion }
  if (value.action === 'save_draft') {
    const payload = editable(value.payload)
    return payload ? { ...base, action: value.action, payload } : null
  }
  const payload = record(value.payload)
  if (!payload) return null
  if (value.action === 'publish' || value.action === 'restore_draft') {
    return keys(payload, ['revision']) && decimal(payload.revision, true)
      ? { ...base, action: value.action, payload: { revision: payload.revision } } : null
  }
  return value.action === 'archive' && keys(payload, [])
    ? { ...base, action: value.action, payload: {} } : null
}

/** Strict data snapshots. Accessors are never invoked; hostile proxies fail closed. */
export function parseCmsCommand(value: unknown): CmsCommand | null {
  try { return parseCommand(value) } catch { return null }
}

/** Reference identity only: this does not certify the place, image rights or travel facts. */
export function cmsReference(entryId: string) {
  const source = INSPIRATION_ZIELE.find(item => item.placeId === entryId)
  return source ? {
    entryId: source.placeId, locale: 'de' as const,
    name: source.name, country: source.country, image: source.image,
  } : null
}
