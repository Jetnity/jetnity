import 'server-only'
import { createHash } from 'node:crypto'

export const APP_POLICY = Object.freeze({
  repository: 'Jetnity/jetnity', repositoryId: 1020187087, ownerId: 217454461,
  integrationPr: 937, branch: 'feat/official-truth-bern-executor-app-1',
  baselineMain: '0b7c5034389f74d32075027109ef506b9e463cd8',
  taskBlob: 'f4ec0d556ecf4b166903a2600edd244b262448d0',
  tagRuleId: 24998411, mainRuleId: 21875372,
  consumedRef: 'refs/tags/jetnity-official-truth-bern-g3-rq-fetch-1-consumed',
  ownerGrantId: 6114368313,
  ownerGrantDigest: '820c235901c81c169c282953fd6c024c0580ebfb1534296f6b8d4665fa1caa47',
  witnessLifetimeMs: 300_000,
  permissions: Object.freeze({ contents: 'write', metadata: 'read', issues: 'read', pull_requests: 'read' }),
})
export const APP_API = '/repos/' + APP_POLICY.repository
export type AppPins = Readonly<{ appId: number; installationId: number; clientId: string; slug: string }>
export type AppCheckout = Readonly<{ mainSha: string; treeSha: string; clean: boolean }>
export type AppReceipts = Readonly<{ reviewId: number; acceptanceId: number; unusedId: number; witnessId: number }>
export type AppResult = Readonly<{ status: 'BLOCKED' | 'SYNTHETIC_PREFLIGHT_PASS'; reason: string;
  liveAuthenticated: false; executionCapability: false; attemptConsumed: false }>
export type JsonObject = Record<string, unknown>

const SAFE_REASONS = new Set([
  'acceptance_invalid', 'ambiguous_inventory', 'ambiguous_receipt', 'app_authentication_failed', 'app_mismatch',
  'attempt_unavailable', 'checkout_unverified', 'custody_and_code_not_accepted', 'evidence_changed',
  'exchange_expiry_invalid', 'exchange_invalid', 'exchange_scope_invalid', 'github_unverifiable',
  'identity_unconfigured', 'incomplete_inventory', 'installation_authentication_failed', 'installation_changed',
  'installation_inventory_mismatch', 'installation_mismatch', 'integration_unreviewed', 'invalid_arguments',
  'invalid_time', 'main_mismatch', 'malformed_evidence', 'merge_tree_unverified', 'offline_only', 'owner_grant_invalid',
  'owner_mismatch', 'permission_mismatch', 'protection_bypass', 'protection_changed', 'protection_incomplete',
  'protection_unknown_field', 'protection_version_changed', 'receipt_invalid', 'repository_inventory_mismatch',
  'repository_mismatch', 'request_not_allowed', 'review_ambiguous', 'review_unverified', 'rules_inventory_mismatch',
  'session_expired', 'signer_invalid', 'simulation_invalid', 'supplied_credentials_forbidden', 'unsafe_environment',
  'unused_authority_invalid', 'witness_mismatch', 'witness_stale',
])

export class AppBlocked extends Error {
  constructor(readonly reason: string) { super(reason) }
}
export function demand(yes: unknown, reason: string): asserts yes {
  if (!yes) throw new AppBlocked(reason)
}
export function obj(value: unknown): JsonObject {
  demand(value !== null && typeof value === 'object' && !Array.isArray(value), 'malformed_evidence')
  return value as JsonObject
}
export function positiveId(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}
export function sha(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{40}$/.test(value) }
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value !== null && typeof value === 'object') {
    const o = obj(value)
    return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canonical(o[k])).join(',') + '}'
  }
  const text = JSON.stringify(value)
  demand(text !== undefined, 'malformed_evidence')
  return text
}
export function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b) }
export function digest(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex') }
export function timestamp(value: unknown): number {
  demand(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value), 'invalid_time')
  const n = Date.parse(value)
  demand(Number.isFinite(n), 'invalid_time')
  return n
}
export function blocked(reason: string): AppResult {
  return Object.freeze({ status: 'BLOCKED', reason: SAFE_REASONS.has(reason) ? reason : 'github_unverifiable',
    liveAuthenticated: false, executionCapability: false, attemptConsumed: false })
}
export function validatePins(pins: AppPins) {
  demand(same(Object.keys(pins).sort(), ['appId', 'clientId', 'installationId', 'slug'])
    && positiveId(pins.appId) && positiveId(pins.installationId)
    && typeof pins.clientId === 'string' && /^[A-Za-z0-9.]{8,80}$/.test(pins.clientId)
    && typeof pins.slug === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(pins.slug), 'identity_unconfigured')
}
export function owner(value: unknown) {
  const o = obj(value)
  demand(o.id === APP_POLICY.ownerId && o.login === 'Jetnity' && o.type === 'User', 'owner_mismatch')
}
export function repository(value: unknown) {
  const r = obj(value)
  demand(r.id === APP_POLICY.repositoryId && r.full_name === APP_POLICY.repository, 'repository_mismatch')
  owner(r.owner)
}
export function permissions(value: unknown) {
  demand(same(value, APP_POLICY.permissions), 'permission_mismatch')
}
