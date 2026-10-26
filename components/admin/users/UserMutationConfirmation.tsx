'use client'

import * as React from 'react'

import type { CapturedSubject, HoldReason, MutationIntent } from '@/lib/admin/user-mutation-lifecycle'
import { confirmationLines, confirmationTitle, holdCopy } from '@/components/admin/users/user-mutation-copy'

export function UserMutationConfirmation({
  subject,
  intent,
  hold,
  onConfirm,
  onCancel,
  triggerId,
}: {
  subject: CapturedSubject
  intent: MutationIntent
  hold: HoldReason | null
  onConfirm: () => void
  onCancel: () => void
  triggerId: string
}) {
  const titleId = React.useId()
  const bodyId = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const confirmRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const panel = panelRef.current
    const previous = document.querySelector<HTMLElement>(`[data-mutation-trigger="${CSS.escape(triggerId)}"]`)
    let frame = 0
    // Menü und Zeilenknopf gehören zur Öffnung. Suche und andere spätere
    // Ziele bleiben, wo der Nutzer sie hingesetzt hat.
    const heldByUser = (node: Node | null) => {
      if (!(node instanceof Element)) return false
      if (node === document.body || node === document.documentElement) return false
      if (panel?.contains(node)) return false
      if (previous && (node === previous || previous.contains(node))) return false
      if (node.closest('[role="menu"]')) return false
      return true
    }
    const focusCancelUnlessNewer = () => {
      if (heldByUser(document.activeElement)) return
      cancelRef.current?.focus()
    }
    focusCancelUnlessNewer()
    frame = window.requestAnimationFrame(focusCancelUnlessNewer)
    const onFocusIn = (event: FocusEvent) => {
      if (heldByUser(event.target instanceof Node ? event.target : null)) window.cancelAnimationFrame(frame)
    }
    document.addEventListener('focusin', onFocusIn, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('focusin', onFocusIn, true)
      if (heldByUser(document.activeElement)) return
      if (previous?.isConnected) previous.focus()
      else document.querySelector<HTMLElement>('[data-users-directory-root]')?.focus()
    }
  }, [triggerId])

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    onCancel()
  }

  return (
    <div className="user-mutation-confirmation" onKeyDown={onKeyDown}>
      <div
        ref={panelRef}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        data-mutation-confirmation="true"
        data-mutation-subject={subject.userId}
        data-hold={hold ?? 'none'}
        className="user-mutation-confirmation__panel"
      >
        <h2 id={titleId} className="user-mutation-confirmation__title">
          {confirmationTitle(subject)}
        </h2>
        <div id={bodyId}>
          {confirmationLines(subject, intent).map((line) => (
            <p key={line} className="user-mutation-confirmation__line">
              {line}
            </p>
          ))}
          {hold ? (
            <p className="user-mutation-confirmation__hold" role="alert">
              {holdCopy(hold)}
            </p>
          ) : null}
        </div>
        <div className="user-mutation-confirmation__actions">
          <button
            type="button"
            ref={cancelRef}
            data-mutation-cancel="true"
            className="user-mutation-confirmation__button"
            onClick={onCancel}
          >
            Abbrechen
          </button>
          <button
            type="button"
            ref={confirmRef}
            data-mutation-confirm="true"
            className="user-mutation-confirmation__button user-mutation-confirmation__button--primary"
            disabled={hold !== null}
            onClick={onConfirm}
          >
            Änderung bestätigen
          </button>
        </div>
      </div>
    </div>
  )
}
