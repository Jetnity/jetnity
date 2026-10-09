'use client'

import * as React from 'react'
import type { Trip, TripSource } from '@/types/trips'
import { WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'

const EditContext = React.createContext<{ close: () => void; setBusy: (value: boolean) => void } | null>(null)
export const useWorkspaceEditSurface = () => React.useContext(EditContext)

/** Native modality owns focus/inertness. The saved Workspace and its scroll stay mounted. */
export default function TripWorkspaceEditSurface({ reise, quelle, ansicht, onClose, children }: {
  reise: Trip; quelle: TripSource; ansicht: WorkspaceAnsicht; onClose: () => void; children: React.ReactNode
}) {
  const dialog = React.useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = React.useState(false)
  const closeRef = React.useRef(onClose)
  const backRef = React.useRef<() => void>(() => {})
  React.useLayoutEffect(() => { closeRef.current = onClose }, [onClose])
  const close = React.useCallback(() => backRef.current(), [])
  const context = React.useMemo(() => ({ close, setBusy }), [close])
  const titleId = React.useId(), contextId = React.useId()

  React.useLayoutEffect(() => {
    const node = dialog.current
    if (!node) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const y = window.scrollY, overflow = document.body.style.overflow
    const prior = window.history.state, url = window.location.href
    const token = crypto.randomUUID()
    let returning = false
    const locked = () => !!node.querySelector('[data-aenderung-sperre="true"]')
    // A same-URL entry makes browser Back a safe return from this contextual task.
    const mark = () => window.history.pushState({ ...prior, jetnityContextEdit: token }, '', url)
    mark()
    const pop = (event: PopStateEvent) => {
      event.stopImmediatePropagation()
      if (locked()) { returning = false; mark(); return }
      returning = true
      closeRef.current()
    }
    backRef.current = () => {
      if (locked() || returning) return
      returning = true
      if (window.history.state?.jetnityContextEdit === token) window.history.back()
      else closeRef.current()
    }
    const unload = (event: BeforeUnloadEvent) => {
      if (locked()) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('popstate', pop, true)
    window.addEventListener('beforeunload', unload)
    document.body.style.overflow = 'hidden'
    node.showModal()
    node.querySelector<HTMLElement>('[data-edit-surface-title]')?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('popstate', pop, true)
      window.removeEventListener('beforeunload', unload)
      if (window.history.state?.jetnityContextEdit === token) {
        const state = { ...window.history.state }
        delete state.jetnityContextEdit
        window.history.replaceState(state, '')
      }
      node.close()
      document.body.style.overflow = overflow
      window.scrollTo({ top: y, behavior: 'instant' })
      if (trigger?.isConnected && !trigger.closest('[hidden], [inert]')) trigger.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={contextId}
    onCancel={event => { event.preventDefault(); close() }}
    className="fixed inset-0 m-auto max-h-[100dvh] w-full max-w-none overflow-y-auto overscroll-contain bg-surface-75 p-0 text-ink-950 backdrop:bg-brand-900/40 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-6xl sm:rounded-3xl sm:border sm:border-line-200"
    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
    <EditContext.Provider value={context}>
      <div className="min-w-0 p-[16px] [overflow-wrap:anywhere] sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 id={titleId} data-edit-surface-title tabIndex={-1} className="text-xl font-semibold text-brand-900 outline-none">Reise ändern</h2>
          <button type="button" disabled={busy} onClick={close} className="min-h-11 max-w-full rounded-full border border-line-300 bg-white px-4 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50">Zurück zum Workspace</button>
        </div>
        <div className="mt-4 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.7fr)]">
          <aside id={contextId} aria-label="Gespeicherter Reisekontext" className="min-w-0 rounded-2xl bg-surface-100 p-3 sm:p-4">
            <p className="text-xs font-semibold text-brand-700">{WORKSPACE_ANSICHT_LABEL[ansicht]} · {quelle === 'guest' ? 'Gastreise' : 'Kontoreise'}</p>
            <p className="mt-2 font-semibold text-brand-900">{reise.title}</p>
            <p className="mt-2 text-sm leading-6">{reise.startDate ?? 'Beginn offen'} – {reise.endDate ?? 'Ende offen'} · {reise.days.length} Tage · {reise.stages.length} Etappen</p>
            <p className="mt-1 text-xs leading-5">Gespeicherter Stand</p>
            <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand-600">Reiseziele ansehen</summary><ol className="grid gap-2 text-sm">{reise.stages.map(stage => <li key={stage.id}>{stage.position}. {stage.name}</li>)}</ol></details>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </EditContext.Provider>
  </dialog>
}
