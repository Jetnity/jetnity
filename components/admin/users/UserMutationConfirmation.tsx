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
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const confirmRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const previous = document.querySelector<HTMLElement>(`[data-mutation-trigger="${CSS.escape(triggerId)}"]`)
    const focusCancel = () => cancelRef.current?.focus()
    focusCancel()
    const frame = window.requestAnimationFrame(focusCancel)
    return () => {
      window.cancelAnimationFrame(frame)
      if (previous?.isConnected) previous.focus()
      else document.querySelector<HTMLElement>('[data-users-directory-root]')?.focus()
    }
  }, [triggerId])

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const nodes = [cancelRef.current, confirmRef.current].filter((node): node is HTMLButtonElement => {
      if (!node) return false
      return !node.disabled
    })
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="user-mutation-confirmation" onKeyDown={onKeyDown}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        data-hold={hold ?? 'none'}
        className="user-mutation-confirmation__dialog"
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
