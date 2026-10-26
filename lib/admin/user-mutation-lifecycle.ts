// Lebenszyklus einer Rollen- oder Statusänderung in der Benutzerverwaltung.
//
// Eine erfüllte Server-Action gibt void zurück und ist keine beobachtete
// Speicherung. Nur eine akzeptierte kanonische Abfrage stellt Anwesenheit,
// Fehlen oder Widerspruch fest. Eine fehlgeschlagene oder ungültige Abfrage
// lässt den bisherigen Anspruch stehen und behauptet kein fehlendes Konto.
// Eine spätere kanonische Zeile gleicht eine frühere Bestätigung ab. Abschluss
// von Konto A lässt ein laufendes Konto B unberührt. Es gibt keine
// automatische Wiederholung und keinen Speicher für Operationskennungen.

import type { AccountStatus, Role } from '@/lib/auth/roles'
import { banToggleTarget, isDispatchableUserId, mutationBlockReason } from '@/lib/admin/user-row-truth'

export const MUTATION_TRANSPORT_TIMEOUT_MS = 8000

export type MutationIntent =
  | { kind: 'role'; nextRole: Role }
  | { kind: 'status'; nextStatus: AccountStatus }

export type CapturedSubject = {
  userId: string
  email: string | null
  displayName: string | null
  role: Role
  status: AccountStatus
}

export type TruthRow = {
  userId: string
  email: string | null
  displayName: string | null
  role: Role | null
  status: AccountStatus | null
}

export type OperationPhase = 'confirming' | 'pending' | 'fulfilled' | 'confirmed' | 'rejected' | 'ambiguous'

export type HoldReason = 'removed' | 'changed' | 'unknown' | 'malformed' | 'ineligible'

export type AmbiguousReason = 'absent' | 'unchanged' | 'contradictory' | 'transport'

/** Eine fehlgeschlagene oder ungültige Abfrage ist kein kanonischer Kontostand. */
export type DirectoryReadVerdict = 'accepted' | 'failed' | 'invalid'

export type LaterTruth = {
  role: Role | null
  status: AccountStatus | null
}

export type TargetOperation = {
  id: string
  subject: CapturedSubject
  intent: MutationIntent
  phase: OperationPhase
  hold: HoldReason | null
  dispatchReadAttempt: string | null
  fulfilledReadAttempt: string | null
  observedReadAttempt: string | null
  qualifiedReadAttempt: string | null
  ambiguousReason: AmbiguousReason | null
  /** Eine akzeptierte Abfrage hat die gewünschte Zeile einmal gezeigt. */
  confirmedOnce: boolean
  /** Die jüngste Abfrage war kein akzeptierter Kanon. Sie setzt keinen neuen Stand. */
  nonCanonical: Exclude<DirectoryReadVerdict, 'accepted'> | null
  laterTruth: LaterTruth | null
  message: string | null
  queryKey: string | null
}

export type LifecycleState = {
  byTarget: Record<string, TargetOperation>
}

export const EMPTY_LIFECYCLE: LifecycleState = { byTarget: {} }

export type ConfirmContext = {
  rows: TruthRow[]
  actorId: string
  actorRole: Role
  assignable: Role[]
  readAttempt: string | null
}

function replaceOperation(state: LifecycleState, operation: TargetOperation): LifecycleState {
  return { byTarget: { ...state.byTarget, [operation.subject.userId]: operation } }
}

export function requestConfirmation(
  state: LifecycleState,
  input: { id: string; subject: CapturedSubject; intent: MutationIntent; queryKey: string | null },
): { ok: true; state: LifecycleState; operation: TargetOperation } | { ok: false; reason: 'owned'; state: LifecycleState } {
  if (state.byTarget[input.subject.userId]) return { ok: false, reason: 'owned', state }
  const operation: TargetOperation = {
    id: input.id,
    subject: input.subject,
    intent: input.intent,
    phase: 'confirming',
    hold: null,
    dispatchReadAttempt: null,
    fulfilledReadAttempt: null,
    observedReadAttempt: null,
    qualifiedReadAttempt: null,
    ambiguousReason: null,
    confirmedOnce: false,
    nonCanonical: null,
    laterTruth: null,
    message: null,
    queryKey: input.queryKey,
  }
  return { ok: true, state: replaceOperation(state, operation), operation }
}

export function cancelConfirmation(state: LifecycleState, targetId: string): LifecycleState {
  const current = state.byTarget[targetId]
  if (!current || current.phase !== 'confirming') return state
  const byTarget = { ...state.byTarget }
  delete byTarget[targetId]
  return { byTarget }
}

export function liveHold(operation: TargetOperation, context: ConfirmContext): HoldReason | null {
  const row = context.rows.find((item) => item.userId === operation.subject.userId) ?? null
  if (!row) return 'removed'
  if (!isDispatchableUserId(row.userId)) return 'malformed'
  if (!row.role || !row.status) return 'unknown'
  const subject = operation.subject
  if (
    row.userId !== subject.userId ||
    row.email !== subject.email ||
    row.displayName !== subject.displayName ||
    row.role !== subject.role ||
    row.status !== subject.status
  ) {
    return 'changed'
  }
  if (
    mutationBlockReason({
      userId: row.userId,
      role: row.role,
      status: row.status,
      actorId: context.actorId,
      actorRole: context.actorRole,
    })
  ) {
    return 'ineligible'
  }
  if (operation.intent.kind === 'role') {
    if (!context.assignable.includes(operation.intent.nextRole) || operation.intent.nextRole === row.role) {
      return 'ineligible'
    }
  } else if (banToggleTarget(row.status) !== operation.intent.nextStatus) {
    return 'ineligible'
  }
  return null
}

export function confirmDispatch(
  state: LifecycleState,
  targetId: string,
  context: ConfirmContext,
):
  | { ok: true; state: LifecycleState; operation: TargetOperation }
  | { ok: false; reason: 'missing' | 'not-confirming' | HoldReason; state: LifecycleState } {
  const current = state.byTarget[targetId]
  if (!current) return { ok: false, reason: 'missing', state }
  if (current.phase !== 'confirming') return { ok: false, reason: 'not-confirming', state }
  const hold = liveHold(current, context)
  if (hold) {
    if (current.hold === hold) return { ok: false, reason: hold, state }
    return { ok: false, reason: hold, state: replaceOperation(state, { ...current, hold }) }
  }
  const operation: TargetOperation = {
    ...current,
    hold: null,
    phase: 'pending',
    dispatchReadAttempt: context.readAttempt,
  }
  return { ok: true, state: replaceOperation(state, operation), operation }
}

function pendingOperation(state: LifecycleState, targetId: string, operationId: string): TargetOperation | null {
  const current = state.byTarget[targetId]
  if (!current || current.id !== operationId || current.phase !== 'pending') return null
  return current
}

/** Der Rückruf ist da. Das ist noch keine beobachtete Zeile. */
export function noteFulfilled(
  state: LifecycleState,
  targetId: string,
  operationId: string,
  readAttempt: string | null,
): LifecycleState {
  const current = pendingOperation(state, targetId, operationId)
  if (!current) return state
  return replaceOperation(state, {
    ...current,
    phase: 'fulfilled',
    fulfilledReadAttempt: readAttempt,
    message: null,
  })
}

export function noteRejected(
  state: LifecycleState,
  targetId: string,
  operationId: string,
  message: string,
): LifecycleState {
  const current = pendingOperation(state, targetId, operationId)
  if (!current) return state
  return replaceOperation(state, {
    ...current,
    phase: 'rejected',
    message,
    ambiguousReason: null,
  })
}

export function noteTransportFailure(
  state: LifecycleState,
  targetId: string,
  operationId: string,
): LifecycleState {
  const current = pendingOperation(state, targetId, operationId)
  if (!current) return state
  return replaceOperation(state, {
    ...current,
    phase: 'ambiguous',
    ambiguousReason: 'transport',
    message: null,
  })
}

export function isTransportFailure(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof TypeError) return true
  if (error instanceof Error) return /fetch|network|timeout|aborted|load failed|failed to fetch/i.test(error.message)
  return false
}

function sameCaptured(subject: CapturedSubject, row: TruthRow): boolean {
  return (
    row.userId === subject.userId &&
    row.email === subject.email &&
    row.displayName === subject.displayName &&
    row.role === subject.role &&
    row.status === subject.status
  )
}

function matchesIntent(operation: TargetOperation, row: TruthRow): boolean {
  if (row.email !== operation.subject.email || row.displayName !== operation.subject.displayName) return false
  if (operation.intent.kind === 'role') {
    return row.role === operation.intent.nextRole && row.status === operation.subject.status
  }
  return row.status === operation.intent.nextStatus && row.role === operation.subject.role
}

function alreadyUsed(operation: TargetOperation, readAttempt: string): boolean {
  return (
    operation.dispatchReadAttempt === readAttempt ||
    operation.fulfilledReadAttempt === readAttempt ||
    operation.observedReadAttempt === readAttempt ||
    operation.qualifiedReadAttempt === readAttempt
  )
}

function laterTruthOf(row: TruthRow): LaterTruth {
  return { role: row.role, status: row.status }
}

/**
 * Eine fehlgeschlagene oder ungültige Abfrage qualifiziert nur die Unsicherheit.
 * Sie begründet weder Fehlen noch Widerspruch noch einen neuen Rollenstand.
 */
function observeUnreadable(
  operation: TargetOperation,
  verdict: Exclude<DirectoryReadVerdict, 'accepted'>,
  readAttempt: string,
): TargetOperation {
  return {
    ...operation,
    nonCanonical: verdict,
    qualifiedReadAttempt: readAttempt,
  }
}

function observeAccepted(operation: TargetOperation, rows: TruthRow[], readAttempt: string): TargetOperation {
  const row = rows.find((item) => item.userId === operation.subject.userId) ?? null
  if (operation.confirmedOnce) {
    if (row && matchesIntent(operation, row)) {
      return {
        ...operation,
        phase: 'confirmed',
        ambiguousReason: null,
        message: null,
        hold: null,
        nonCanonical: null,
        laterTruth: null,
        observedReadAttempt: readAttempt,
      }
    }
    if (!row) {
      return {
        ...operation,
        phase: 'ambiguous',
        ambiguousReason: 'absent',
        hold: null,
        nonCanonical: null,
        laterTruth: null,
        observedReadAttempt: readAttempt,
      }
    }
    return {
      ...operation,
      phase: 'ambiguous',
      ambiguousReason: 'contradictory',
      hold: null,
      nonCanonical: null,
      laterTruth: laterTruthOf(row),
      observedReadAttempt: readAttempt,
    }
  }
  if (!row) {
    return {
      ...operation,
      phase: 'ambiguous',
      ambiguousReason: 'absent',
      hold: null,
      nonCanonical: null,
      laterTruth: null,
      observedReadAttempt: readAttempt,
    }
  }
  if (sameCaptured(operation.subject, row)) {
    return {
      ...operation,
      phase: 'ambiguous',
      ambiguousReason: 'unchanged',
      hold: null,
      nonCanonical: null,
      laterTruth: null,
      observedReadAttempt: readAttempt,
    }
  }
  if (matchesIntent(operation, row)) {
    return {
      ...operation,
      phase: 'confirmed',
      confirmedOnce: true,
      ambiguousReason: null,
      message: null,
      hold: null,
      nonCanonical: null,
      laterTruth: null,
      observedReadAttempt: readAttempt,
    }
  }
  return {
    ...operation,
    phase: 'ambiguous',
    ambiguousReason: 'contradictory',
    hold: null,
    nonCanonical: null,
    laterTruth: null,
    observedReadAttempt: readAttempt,
  }
}

/**
 * Nur eine erfüllte oder bereits bestätigte Operation und nur ein noch nicht
 * verwendeter Leseversuch. Eine bloße Aktualisierungsanfrage hat hier keinen
 * Eingang. Nur `accepted` darf Anwesenheit, Fehlen oder Widerspruch feststellen.
 */
export function observeLifecycle(
  state: LifecycleState,
  rows: TruthRow[],
  readAttempt: string | null,
  verdict: DirectoryReadVerdict = 'accepted',
): LifecycleState {
  if (!readAttempt) return state
  let changed = false
  const byTarget = { ...state.byTarget }
  for (const [targetId, operation] of Object.entries(state.byTarget)) {
    if (operation.phase !== 'fulfilled' && operation.phase !== 'confirmed') continue
    if (alreadyUsed(operation, readAttempt)) continue
    const next =
      verdict === 'accepted'
        ? observeAccepted(operation, rows, readAttempt)
        : observeUnreadable(operation, verdict, readAttempt)
    byTarget[targetId] = next
    changed = true
  }
  return changed ? { byTarget } : state
}

const DISMISSABLE: OperationPhase[] = ['fulfilled', 'confirmed', 'rejected', 'ambiguous']

/** Schließt nur die lokale Rückmeldung. Löst keine Schreiboperation aus. */
export function dismissFeedback(state: LifecycleState, targetId: string): LifecycleState {
  const current = state.byTarget[targetId]
  if (!current || !DISMISSABLE.includes(current.phase)) return state
  const byTarget = { ...state.byTarget }
  delete byTarget[targetId]
  return { byTarget }
}

/** Eine noch nicht gesendete Bestätigung verschwindet mit der Zeile. Kein Versand. */
export function releaseHiddenConfirmations(state: LifecycleState, visibleIds: ReadonlySet<string>): LifecycleState {
  let changed = false
  const byTarget = { ...state.byTarget }
  for (const [targetId, operation] of Object.entries(state.byTarget)) {
    if (operation.phase === 'confirming' && !visibleIds.has(targetId)) {
      delete byTarget[targetId]
      changed = true
    }
  }
  return changed ? { byTarget } : state
}

export function detachedOperations(state: LifecycleState, visibleIds: ReadonlySet<string>): TargetOperation[] {
  return Object.values(state.byTarget).filter(
    (operation) => operation.phase !== 'confirming' && !visibleIds.has(operation.subject.userId),
  )
}
