// Dormant method identity and reader protocol. Valid shape or a digest is not approval.
import 'server-only'
import { createHash } from 'node:crypto'
import { isUint8Array } from 'node:util/types'
import { sha256Hex } from '@/lib/readiness/digest'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { civilDateOrdinalLesen, schema2DatenPruefen, schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { readV3MethodRevisionDraft } from '../contract'

/** Technical custody bounds only; not an approved method or operating SLO. */
export const MA1_LIMITS = Object.freeze({ maxPackageBytes: 65_536, activeReads: 4, receiptMs: 5_000 })
export type Ma1MethodBinding = Readonly<{
  methodId: string; revision: number; methodDigest: string; packageDigest: string;
}>
export type Ma1CurrentRequest = Readonly<Ma1MethodBinding & { checkedAt: string }>
export type Ma1ReadResult<T> = Readonly<{ ok: true; value: T }> | Readonly<{
  ok: false; reason: 'invalid_binding' | 'invalid_draft' | 'invalid_package' | 'digest_mismatch' | 'invalid_request' | 'invalid_result';
}>
export type Ma1CurrentRow = Readonly<{
  status: 'absent' | 'draft' | 'binding_mismatch' | 'different_revision' | 'revoked' | 'expired' | 'approved';
  methodId: string; revision: number | null; methodDigest: string | null; packageDigest: string | null;
  epoch: number; approvalMode: 'until_revoked' | 'until' | null; approvalUntil: string | null;
  observedAt: string; remainingMs: number;
}>

const bindingKeys = ['methodId', 'revision', 'methodDigest', 'packageDigest'] as const
const rowKeys = ['status', 'method_id', 'revision', 'method_digest', 'package_digest',
  'epoch', 'approval_mode', 'approval_until', 'observed_at', 'remaining_ms'] as const
const byteLength = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), 'byteLength')!.get!
const fail = (reason: Extract<Ma1ReadResult<never>, { ok: false }>['reason']): Ma1ReadResult<never> => Object.freeze({ ok: false, reason })
const success = <T>(value: T): Ma1ReadResult<T> => Object.freeze({ ok: true, value: Object.freeze(value) })
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const methodId = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_-]{1,63}$/.test(value)
const revision = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)
  && value >= 1 && value <= 2_147_483_647

function timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value)
    || civilDateOrdinalLesen(value.slice(0, 10)) === null) return false
  const instant = Date.parse(value)
  return Number.isFinite(instant) && new Date(instant).toISOString() === value
}

/** Shape-only fixed configuration. This does not authenticate the supplied hashes. */
export function readMa1FixedBinding(value: unknown): Ma1ReadResult<Ma1MethodBinding> {
  try {
    if (schema2DatenPruefen(value)) return fail('invalid_binding')
    const row = ownRecord(value, bindingKeys)
    if (!row || !methodId(row.methodId) || !revision(row.revision) || !digest(row.methodDigest) || !digest(row.packageDigest)) {
      return fail('invalid_binding')
    }
    return success({ methodId: row.methodId, revision: row.revision, methodDigest: row.methodDigest, packageDigest: row.packageDigest })
  } catch { return fail('invalid_binding') }
}

/** The successful shared draft reader owns admission and detachment before hashing. */
export function readMa1MethodBinding(draft: unknown, packageBytes: Uint8Array, expectedPackageDigest: unknown): Ma1ReadResult<Ma1MethodBinding> {
  try {
    const parsed = readV3MethodRevisionDraft(draft)
    if (!parsed.ok) return fail('invalid_draft')
    if (!isUint8Array(packageBytes)) return fail('invalid_package')
    const length: number = Reflect.apply(byteLength, packageBytes, [])
    if (length < 1 || length > MA1_LIMITS.maxPackageBytes || !digest(expectedPackageDigest)) return fail('invalid_package')
    // Allocate only the admitted bound. Copy actual typed-array elements, not an
    // overridable iterator/length property or decoded text; reject a resized input.
    const bytes = new Uint8Array(length)
    Uint8Array.prototype.set.call(bytes, packageBytes)
    if (Reflect.apply(byteLength, packageBytes, []) !== length) return fail('invalid_package')
    const packageDigest = createHash('sha256').update(bytes).digest('hex')
    if (packageDigest !== expectedPackageDigest) return fail('digest_mismatch')
    return success({ methodId: parsed.value.method.methodId, revision: parsed.value.method.revision,
      methodDigest: sha256Hex(schema2Kanonisch(parsed.value)), packageDigest })
  } catch { return fail('invalid_package') }
}

/** Exact flat request for the sole fixed reader. No role, target, SQL or authority input. */
export function readMa1CurrentRequest(value: unknown): Ma1ReadResult<Ma1CurrentRequest> {
  try {
    if (schema2DatenPruefen(value)) return fail('invalid_request')
    const row = ownRecord(value, [...bindingKeys, 'checkedAt'])
    if (!row || !timestamp(row.checkedAt)) return fail('invalid_request')
    const binding = readMa1FixedBinding({ methodId: row.methodId, revision: row.revision,
      methodDigest: row.methodDigest, packageDigest: row.packageDigest })
    return binding.ok ? success({ ...binding.value, checkedAt: row.checkedAt }) : fail('invalid_request')
  } catch { return fail('invalid_request') }
}

function integerCell(value: unknown, maximum: number): number | null {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,9})$/.test(value)) return null
  const result = Number(value)
  return result <= maximum ? result : null
}

/** Decodes one actual wire row; formatted observed_at never determines a TTL. */
export function readMa1CurrentRows(rows: unknown, expectedInput: Ma1MethodBinding, checkedAt: string): Ma1ReadResult<Ma1CurrentRow> {
  try {
    const expected = readMa1FixedBinding(expectedInput)
    if (!expected.ok || !timestamp(checkedAt) || !Array.isArray(rows) || Object.getPrototypeOf(rows) !== Array.prototype
      || Object.getOwnPropertyDescriptor(rows, 'length')?.value !== 1 || Reflect.ownKeys(rows).length !== 2) return fail('invalid_result')
    const descriptor = Object.getOwnPropertyDescriptor(rows, '0')
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return fail('invalid_result')
    const row = ownRecord(descriptor.value, rowKeys)
    if (!row || rowKeys.some(key => row[key] !== null && (typeof row[key] !== 'string' || row[key].length > 64))) return fail('invalid_result')
    if (row.method_id !== expected.value.methodId || !timestamp(row.observed_at)) return fail('invalid_result')
    const epoch = integerCell(row.epoch, 2_147_483_647), remainingMs = integerCell(row.remaining_ms, MA1_LIMITS.receiptMs)
    if (epoch === null || remainingMs === null) return fail('invalid_result')
    const status = row.status
    if (status !== 'absent' && status !== 'draft' && status !== 'binding_mismatch' && status !== 'different_revision'
      && status !== 'revoked' && status !== 'expired' && status !== 'approved') return fail('invalid_result')
    const selectedRevision = row.revision === null ? null : integerCell(row.revision, 2_147_483_647)
    if (status === 'absent') {
      if (row.revision !== null || row.method_digest !== null || row.package_digest !== null || epoch !== 0
        || row.approval_mode !== null || row.approval_until !== null || remainingMs !== 0) return fail('invalid_result')
      return success({ status, methodId: row.method_id, revision: null, methodDigest: null, packageDigest: null,
        epoch, approvalMode: null, approvalUntil: null, observedAt: row.observed_at, remainingMs })
    }
    if (selectedRevision === null || selectedRevision < 1 || !digest(row.method_digest) || !digest(row.package_digest)) return fail('invalid_result')
    const mode = row.approval_mode, until = row.approval_until
    if (mode !== null && mode !== 'until' && mode !== 'until_revoked') return fail('invalid_result')
    if (mode === 'until' ? !timestamp(until) : until !== null) return fail('invalid_result')
    if (epoch === 2_147_483_647 && mode !== null) return fail('invalid_result')
    const exact = selectedRevision === expected.value.revision && row.method_digest === expected.value.methodDigest
      && row.package_digest === expected.value.packageDigest
    switch (status) {
      case 'draft':
        if (!exact || epoch !== 0 || mode !== null || remainingMs !== 0) return fail('invalid_result')
        break
      case 'binding_mismatch':
        if (selectedRevision !== expected.value.revision || exact || remainingMs !== 0 || (epoch === 0 && mode !== null)) return fail('invalid_result')
        break
      case 'different_revision':
        if (selectedRevision === expected.value.revision || epoch === 0 || remainingMs !== 0) return fail('invalid_result')
        break
      case 'revoked':
        if (!exact || epoch === 0 || mode !== null || remainingMs !== 0) return fail('invalid_result')
        break
      case 'expired':
        if (!exact || epoch === 0 || mode !== 'until' || remainingMs !== 0) return fail('invalid_result')
        break
      case 'approved':
        if (!exact || epoch === 0 || mode === null || remainingMs < 1
          || (mode === 'until_revoked' && remainingMs !== MA1_LIMITS.receiptMs)
          || (mode === 'until' && (until as string) <= row.observed_at)) return fail('invalid_result')
        if (mode === 'until') {
          // Formatted instants provide inconsistency upper bounds only. They may
          // refuse an impossible response but never supply/grant a positive TTL.
          // Receipt lifetime still uses the independently floored SQL remaining_ms.
          const expiry = Date.parse(until as string)
          if (remainingMs > expiry - Date.parse(row.observed_at)
            || remainingMs > expiry - Date.parse(checkedAt)) return fail('invalid_result')
        }
        break
    }
    return success({ status, methodId: row.method_id, revision: selectedRevision,
      methodDigest: row.method_digest, packageDigest: row.package_digest, epoch,
      approvalMode: mode, approvalUntil: until as string | null, observedAt: row.observed_at, remainingMs })
  } catch { return fail('invalid_result') }
}
