// Rev1 parent messages for the separate 12Go host.
// The child creates the challenge. This module checks it and builds one grant.
// No trip, scope, or traveller fields. No node:crypto.

import { TWELVE_GO_WIDGET_ALLGEMEIN_SHA256 } from '@/lib/providers/twelve-go/widget/kennungen'

export const TWELVE_GO_PARENT_ORIGIN = 'https://jetnity.com'
export const TWELVE_GO_CHILD_ORIGIN = 'https://jetnity-widgets.vercel.app'
const TWELVE_GO_EMBED_PATH = '/embed/twelvego'
export const TWELVE_GO_HOST_SRC = `${TWELVE_GO_CHILD_ORIGIN}${TWELVE_GO_EMBED_PATH}`
export const TWELVE_GO_HOST_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups'
export const TWELVE_GO_POLICY_ID = 'twelvego-general-chf-20261031-r1'
export const TWELVE_GO_PROVIDER = 'twelvego'
const TWELVE_GO_MESSAGE_TYPE = 'jetnity-widget-host'
const TWELVE_GO_MESSAGE_LIMIT = 2048
const TWELVE_GO_GENERATION_MAX = 1_000_000

const HEX64 = /^[a-f0-9]{64}$/
const POLICY_ID = /^[a-z0-9-]{1,64}$/
const READY_KEYS = ['type', 'revision', 'kind', 'provider', 'challenge', 'frameGeneration'] as const
const GRANT_KEYS = [...READY_KEYS, 'parentGeneration', 'policyId', 'artifactSha256'] as const
const REVOKE_KEYS = ['type', 'revision', 'kind', 'provider', 'frameGeneration'] as const

export type TwelveGoReady = {
  readonly challenge: string
  readonly frameGeneration: number
}

export type TwelveGoGrantFields = {
  readonly challenge: string
  readonly frameGeneration: number
  readonly parentGeneration: number
  readonly policyId: string
  readonly artifactSha256: string
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const own = Object.keys(record)
  return own.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(record, key))
}

function textOk(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== 'string' || value.includes('<') || value.includes('//') || !pattern.test(value)) return null
  return value
}

function generation(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > TWELVE_GO_GENERATION_MAX) return null
  return value
}

function withinLimit(value: unknown): boolean {
  try {
    return JSON.stringify(value).length <= TWELVE_GO_MESSAGE_LIMIT
  } catch {
    return false
  }
}

function common(record: Record<string, unknown>, kind: string): boolean {
  return record.type === TWELVE_GO_MESSAGE_TYPE
    && record.revision === 1
    && record.kind === kind
    && record.provider === TWELVE_GO_PROVIDER
}

export function twelveGoReadyLesen(value: unknown): TwelveGoReady | null {
  const record = recordOf(value)
  if (!record || !exactKeys(record, READY_KEYS) || !common(record, 'ready') || !withinLimit(record)) return null
  const challenge = textOk(record.challenge, HEX64)
  const frameGeneration = generation(record.frameGeneration)
  if (!challenge || frameGeneration === null) return null
  return { challenge, frameGeneration }
}

export function twelveGoRevokeLesen(value: unknown): { readonly frameGeneration: number } | null {
  const record = recordOf(value)
  if (!record || !exactKeys(record, REVOKE_KEYS) || !common(record, 'revoke') || !withinLimit(record)) return null
  const frameGeneration = generation(record.frameGeneration)
  if (frameGeneration === null) return null
  return { frameGeneration }
}

export function twelveGoGrantBauen(fields: TwelveGoGrantFields): TwelveGoGrantFields & {
  readonly type: typeof TWELVE_GO_MESSAGE_TYPE
  readonly revision: 1
  readonly kind: 'grant'
  readonly provider: typeof TWELVE_GO_PROVIDER
} | null {
  const challenge = textOk(fields.challenge, HEX64)
  const policyId = textOk(fields.policyId, POLICY_ID)
  const artifactSha256 = textOk(fields.artifactSha256, HEX64)
  const frameGeneration = generation(fields.frameGeneration)
  const parentGeneration = generation(fields.parentGeneration)
  if (!challenge || !policyId || !artifactSha256 || frameGeneration === null || parentGeneration === null) return null
  if (policyId !== TWELVE_GO_POLICY_ID || artifactSha256 !== TWELVE_GO_WIDGET_ALLGEMEIN_SHA256) return null
  if (parentGeneration < 1) return null
  const message = {
    type: TWELVE_GO_MESSAGE_TYPE as typeof TWELVE_GO_MESSAGE_TYPE,
    revision: 1 as const,
    kind: 'grant' as const,
    provider: TWELVE_GO_PROVIDER as typeof TWELVE_GO_PROVIDER,
    challenge,
    frameGeneration,
    parentGeneration,
    policyId,
    artifactSha256,
  }
  if (!exactKeys(message, GRANT_KEYS) || !withinLimit(message)) return null
  return message
}
