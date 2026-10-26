import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  EMPTY_LIFECYCLE,
  cancelConfirmation,
  confirmDispatch,
  detachedOperations,
  dismissFeedback,
  isTransportFailure,
  noteFulfilled,
  noteRejected,
  noteTransportFailure,
  observeLifecycle,
  releaseHiddenConfirmations,
  requestConfirmation,
  type CapturedSubject,
  type ConfirmContext,
  type LifecycleState,
  type MutationIntent,
  type TruthRow,
} from './user-mutation-lifecycle'
import { outcomeCopy } from '@/components/admin/users/user-mutation-copy'

const ada: CapturedSubject = {
  userId: 'ada',
  email: 'ada.example@example.test',
  displayName: 'Ada Example',
  role: 'user',
  status: 'active',
}

const bao: CapturedSubject = {
  userId: 'bao',
  email: 'bao.example@example.test',
  displayName: 'Bao Example',
  role: 'operator',
  status: 'pending',
}

function rowOf(subject: CapturedSubject, patch: Partial<TruthRow> = {}): TruthRow {
  return {
    userId: subject.userId,
    email: subject.email,
    displayName: subject.displayName,
    role: subject.role,
    status: subject.status,
    ...patch,
  }
}

function context(rows: TruthRow[], readAttempt = 'read-1'): ConfirmContext {
  return {
    rows,
    actorId: 'actor',
    actorRole: 'admin',
    assignable: ['user', 'creator', 'moderator', 'operator'],
    readAttempt,
  }
}

function open(state: LifecycleState, subject: CapturedSubject, intent: MutationIntent, id: string) {
  const decision = requestConfirmation(state, { id, subject, intent, queryKey: 'q1' })
  assert.equal(decision.ok, true)
  if (!decision.ok) throw new Error('expected confirmation')
  return decision
}

describe('Mutationslebenszyklus', () => {
  test('dieselbe Runde kann ein Ziel nicht zweimal öffnen oder senden', () => {
    const first = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const second = requestConfirmation(first.state, {
      id: 'op-2',
      subject: ada,
      intent: { kind: 'status', nextStatus: 'banned' },
      queryKey: 'q1',
    })
    assert.equal(second.ok, false)
    if (second.ok) return
    assert.equal(second.reason, 'owned')
    const sent = confirmDispatch(first.state, ada.userId, context([rowOf(ada)]))
    assert.equal(sent.ok, true)
    if (!sent.ok) return
    const again = confirmDispatch(sent.state, ada.userId, context([rowOf(ada)]))
    assert.equal(again.ok, false)
    if (again.ok) return
    assert.equal(again.reason, 'not-confirming')
    assert.equal(again.state.byTarget[ada.userId]?.id, 'op-1')
  })

  test('Rolle und Status eines laufenden Ziels bleiben eine Operation', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)]))
    assert.equal(sent.ok, true)
    if (!sent.ok) return
    const status = requestConfirmation(sent.state, {
      id: 'op-2',
      subject: ada,
      intent: { kind: 'status', nextStatus: 'banned' },
      queryKey: 'q1',
    })
    assert.equal(status.ok, false)
    assert.equal(sent.state.byTarget[ada.userId]?.intent.kind, 'role')
  })

  test('der Abschluss von A lässt B laufend', () => {
    const a = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-a')
    const b = open(a.state, bao, { kind: 'status', nextStatus: 'banned' }, 'op-b')
    const sentA = confirmDispatch(b.state, ada.userId, context([rowOf(ada), rowOf(bao)], 'read-a'))
    const sentB = sentA.ok ? confirmDispatch(sentA.state, bao.userId, context([rowOf(ada), rowOf(bao)], 'read-b')) : sentA
    assert.equal(sentA.ok && sentB.ok, true)
    if (!sentA.ok || !sentB.ok) return
    const fulfilled = noteFulfilled(sentB.state, ada.userId, 'op-a', 'read-a')
    const observed = observeLifecycle(
      fulfilled,
      [rowOf(ada, { role: 'creator' }), rowOf(bao)],
      'read-after',
    )
    assert.equal(observed.byTarget[ada.userId]?.phase, 'confirmed')
    assert.equal(observed.byTarget[bao.userId]?.phase, 'pending')
    assert.equal(observed.byTarget[bao.userId]?.id, 'op-b')
  })

  test('eine erfüllte Aktion ohne neue Zeile ist nicht bestätigt', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)], 'read-1'))
    assert.equal(sent.ok, true)
    if (!sent.ok) return
    const fulfilled = noteFulfilled(sent.state, ada.userId, 'op-1', 'read-1')
    assert.equal(fulfilled.byTarget[ada.userId]?.phase, 'fulfilled')
    const sameRead = observeLifecycle(fulfilled, [rowOf(ada, { role: 'creator' })], 'read-1')
    assert.equal(sameRead.byTarget[ada.userId]?.phase, 'fulfilled')
    assert.match(outcomeCopy(fulfilled.byTarget[ada.userId]!), /noch nicht bestätigt/)
    assert.doesNotMatch(outcomeCopy(fulfilled.byTarget[ada.userId]!), /Die neue Abfrage zeigt/)
  })

  test('fehlende, unveränderte und widersprüchliche Abfragen bleiben unbestätigt', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)], 'read-1'))
    if (!sent.ok) return
    const fulfilled = noteFulfilled(sent.state, ada.userId, 'op-1', 'read-1')
    assert.equal(observeLifecycle(fulfilled, [], 'read-2').byTarget[ada.userId]?.ambiguousReason, 'absent')
    assert.equal(observeLifecycle(fulfilled, [rowOf(ada)], 'read-2').byTarget[ada.userId]?.ambiguousReason, 'unchanged')
    const contradictory = observeLifecycle(fulfilled, [rowOf(ada, { role: 'moderator' })], 'read-2')
    assert.equal(contradictory.byTarget[ada.userId]?.ambiguousReason, 'contradictory')
    const returned = observeLifecycle(contradictory, [rowOf(ada, { role: 'creator' })], 'read-3')
    assert.equal(returned.byTarget[ada.userId]?.id, 'op-1')
    assert.equal(returned.byTarget[ada.userId]?.phase, 'confirmed')
    assert.match(outcomeCopy(returned.byTarget[ada.userId]!), /Die neue Abfrage zeigt/)
    assert.match(outcomeCopy(returned.byTarget[ada.userId]!), /Creator/)
    assert.doesNotMatch(outcomeCopy(returned.byTarget[ada.userId]!), /widerspricht/)
    assert.match(outcomeCopy(contradictory.byTarget[ada.userId]!), /keine bestätigte Speicherung/)
  })

  test('eine passende neue Abfrage bestätigt nur die beobachtete Rolle', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)], 'read-1'))
    if (!sent.ok) return
    const fulfilled = noteFulfilled(sent.state, ada.userId, 'op-1', 'read-1')
    const observed = observeLifecycle(fulfilled, [rowOf(ada, { role: 'creator' })], 'read-2')
    assert.equal(observed.byTarget[ada.userId]?.phase, 'confirmed')
    assert.match(outcomeCopy(observed.byTarget[ada.userId]!), /Die neue Abfrage zeigt/)
    assert.match(outcomeCopy(observed.byTarget[ada.userId]!), /Creator/)
  })

  test('eine geänderte oder verschwundene Zeile wird nicht gesendet', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const changed = confirmDispatch(opened.state, ada.userId, context([rowOf(ada, { role: 'creator' })]))
    assert.equal(changed.ok, false)
    if (changed.ok) return
    assert.equal(changed.reason, 'changed')
    assert.equal(changed.state.byTarget[ada.userId]?.phase, 'confirming')
    const removed = confirmDispatch(opened.state, ada.userId, context([]))
    assert.equal(removed.ok, false)
    if (removed.ok) return
    assert.equal(removed.reason, 'removed')
    const unknown = confirmDispatch(opened.state, ada.userId, context([rowOf(ada, { role: null })]))
    assert.equal(unknown.ok, false)
    if (unknown.ok) return
    assert.equal(unknown.reason, 'unknown')
  })

  test('ein alter Fehler bleibt am Konto hängen und wird nicht erneut gesendet', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'status', nextStatus: 'banned' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)]))
    if (!sent.ok) return
    const rejected = noteRejected(sent.state, ada.userId, 'op-1', 'Für dieses Konto fehlt die Berechtigung.')
    const other = rowOf(bao)
    const detached = detachedOperations(rejected, new Set([bao.userId]))
    assert.equal(detached.length, 1)
    assert.equal(detached[0]?.subject.userId, ada.userId)
    assert.equal(detached[0]?.queryKey, 'q1')
    assert.match(outcomeCopy(detached[0]!), /Ada Example/)
    assert.doesNotMatch(outcomeCopy(detached[0]!), /Bao Example/)
    const dismissed = dismissFeedback(rejected, ada.userId)
    assert.equal(dismissed.byTarget[ada.userId], undefined)
    assert.equal(other.userId, bao.userId)
  })

  test('eine fehlgeschlagene oder ungültige Abfrage behauptet kein fehlendes Konto', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)], 'read-1'))
    if (!sent.ok) return
    const fulfilled = noteFulfilled(sent.state, ada.userId, 'op-1', 'read-1')
    const failed = observeLifecycle(fulfilled, [], 'read-error', 'failed')
    assert.equal(failed.byTarget[ada.userId]?.phase, 'fulfilled')
    assert.equal(failed.byTarget[ada.userId]?.ambiguousReason, null)
    const failedText = outcomeCopy(failed.byTarget[ada.userId]!)
    assert.match(failedText, /fehlgeschlagen/)
    assert.match(failedText, /nicht, dass das Konto fehlt/)
    assert.doesNotMatch(failedText, /fehlt in der neuen Abfrage/)
    assert.doesNotMatch(failedText, /Die neue Abfrage zeigt/)
    const invalid = observeLifecycle(fulfilled, [], 'read-invalid', 'invalid')
    assert.equal(invalid.byTarget[ada.userId]?.phase, 'fulfilled')
    const invalidText = outcomeCopy(invalid.byTarget[ada.userId]!)
    assert.match(invalidText, /ungültig/)
    assert.doesNotMatch(invalidText, /fehlt in der neuen Abfrage/)
    const after = observeLifecycle(failed, [rowOf(ada, { role: 'creator' })], 'read-3', 'accepted')
    assert.equal(after.byTarget[ada.userId]?.phase, 'confirmed')
    assert.match(outcomeCopy(after.byTarget[ada.userId]!), /Die neue Abfrage zeigt/)
  })

  test('eine spätere kanonische Abfrage macht eine ältere Bestätigung historisch', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)], 'read-1'))
    if (!sent.ok) return
    const fulfilled = noteFulfilled(sent.state, ada.userId, 'op-1', 'read-1')
    const confirmed = observeLifecycle(fulfilled, [rowOf(ada, { role: 'creator' })], 'read-2')
    assert.match(outcomeCopy(confirmed.byTarget[ada.userId]!), /Die neue Abfrage zeigt/)
    const reverted = observeLifecycle(confirmed, [rowOf(ada, { role: 'user' })], 'read-3')
    assert.equal(reverted.byTarget[ada.userId]?.phase, 'ambiguous')
    assert.equal(reverted.byTarget[ada.userId]?.ambiguousReason, 'contradictory')
    const revertedText = outcomeCopy(reverted.byTarget[ada.userId]!)
    assert.match(revertedText, /Eine frühere Abfrage zeigte/)
    assert.match(revertedText, /Nutzer/)
    assert.match(revertedText, /nicht mehr der aktuelle Stand/)
    assert.doesNotMatch(revertedText, /Die neue Abfrage zeigt/)
    const absent = observeLifecycle(confirmed, [], 'read-4')
    assert.equal(absent.byTarget[ada.userId]?.ambiguousReason, 'absent')
    const absentText = outcomeCopy(absent.byTarget[ada.userId]!)
    assert.match(absentText, /enthält das Konto nicht/)
    assert.match(absentText, /Es wird nichts erneut gesendet/)
    assert.doesNotMatch(absentText, /Die neue Abfrage zeigt/)
    const failed = observeLifecycle(confirmed, [], 'read-5', 'failed')
    assert.equal(failed.byTarget[ada.userId]?.phase, 'confirmed')
    const failedText = outcomeCopy(failed.byTarget[ada.userId]!)
    assert.match(failedText, /Eine frühere Abfrage zeigte/)
    assert.match(failedText, /fehlgeschlagen und setzt keinen neuen Stand/)
    assert.doesNotMatch(failedText, /Die neue Abfrage zeigt/)
    assert.doesNotMatch(failedText, /fehlt in der neuen Abfrage/)
    const invalid = observeLifecycle(confirmed, [rowOf(ada, { role: 'owner' })], 'read-6', 'invalid')
    assert.equal(invalid.byTarget[ada.userId]?.phase, 'confirmed')
    assert.match(outcomeCopy(invalid.byTarget[ada.userId]!), /ungültig und setzt keinen neuen Stand/)
    const stillHeld = requestConfirmation(reverted, {
      id: 'op-2',
      subject: ada,
      intent: { kind: 'status', nextStatus: 'banned' },
      queryKey: 'q1',
    })
    assert.equal(stillHeld.ok, false)
    assert.equal(dismissFeedback(reverted, ada.userId).byTarget[ada.userId], undefined)
    const matchedAgain = observeLifecycle(reverted, [rowOf(ada, { role: 'creator' })], 'read-7')
    assert.equal(matchedAgain.byTarget[ada.userId]?.id, 'op-1')
    assert.equal(matchedAgain.byTarget[ada.userId]?.phase, 'confirmed')
    const matchedText = outcomeCopy(matchedAgain.byTarget[ada.userId]!)
    assert.match(matchedText, /Die neue Abfrage zeigt/)
    assert.match(matchedText, /Creator/)
    assert.doesNotMatch(matchedText, /Nutzer/)
    assert.doesNotMatch(matchedText, /enthält das Konto nicht/)
    const absentThenBack = observeLifecycle(absent, [rowOf(ada, { role: 'creator' })], 'read-8')
    assert.equal(absentThenBack.byTarget[ada.userId]?.phase, 'confirmed')
    assert.doesNotMatch(outcomeCopy(absentThenBack.byTarget[ada.userId]!), /enthält das Konto nicht/)
    const moderator = observeLifecycle(reverted, [rowOf(ada, { role: 'moderator' })], 'read-9')
    assert.equal(moderator.byTarget[ada.userId]?.phase, 'ambiguous')
    const moderatorText = outcomeCopy(moderator.byTarget[ada.userId]!)
    assert.match(moderatorText, /Moderation/)
    assert.doesNotMatch(moderatorText, /zeigt die Rolle Nutzer/)
    const failedAfter = observeLifecycle(reverted, [], 'read-10', 'failed')
    const failedAfterText = outcomeCopy(failedAfter.byTarget[ada.userId]!)
    assert.match(failedAfterText, /zeigte/)
    assert.match(failedAfterText, /Nutzer/)
    assert.match(failedAfterText, /fehlgeschlagen und setzt keinen neuen Stand/)
    assert.doesNotMatch(failedAfterText, /Die aktuelle Abfrage zeigt/)
    assert.doesNotMatch(failedAfterText, /Die letzte akzeptierte Abfrage zeigt/)
    assert.doesNotMatch(failedAfterText, /enthält das Konto nicht/)
    assert.equal(requestConfirmation(failedAfter, {
      id: 'op-3',
      subject: ada,
      intent: { kind: 'role', nextRole: 'moderator' },
      queryKey: 'q1',
    }).ok, false)
  })

  test('Transportabbruch und verspätete Rückkehr senden nicht erneut', () => {
    const opened = open(EMPTY_LIFECYCLE, ada, { kind: 'role', nextRole: 'creator' }, 'op-1')
    const sent = confirmDispatch(opened.state, ada.userId, context([rowOf(ada)]))
    if (!sent.ok) return
    const ambiguous = noteTransportFailure(sent.state, ada.userId, 'op-1')
    assert.equal(ambiguous.byTarget[ada.userId]?.ambiguousReason, 'transport')
    const late = noteFulfilled(ambiguous, ada.userId, 'op-1', 'read-2')
    assert.equal(late, ambiguous)
    assert.equal(isTransportFailure(new TypeError('Failed to fetch')), true)
    assert.equal(isTransportFailure(new Error('Für diese Rollenänderung fehlt die Berechtigung.')), false)
    const hidden = releaseHiddenConfirmations(opened.state, new Set())
    assert.equal(hidden.byTarget[ada.userId], undefined)
    const cancelled = cancelConfirmation(opened.state, ada.userId)
    assert.equal(cancelled.byTarget[ada.userId], undefined)
  })
})
