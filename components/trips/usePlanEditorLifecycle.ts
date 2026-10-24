'use client'

import * as React from 'react'

/**
 * Generation, one in-flight id per editor, one per delete, and focus fallback.
 * Local to the plan surface. Not a shared editor framework.
 */
export function usePlanEditorLifecycle(aktiverTag: string) {
  const owner = React.useRef(0)
  const [editorGeneration, setEditorGeneration] = React.useState(0)
  const editorOp = React.useRef(0)
  const deleteOp = React.useRef(0)
  const loeschtRef = React.useRef(false)
  const [loescht, setLoescht] = React.useState(false)
  const [reiseEpoch, setReiseEpoch] = React.useState(0)
  const epochAngewandt = React.useRef(0)

  React.useLayoutEffect(() => {
    owner.current += 1
  }, [aktiverTag])

  React.useLayoutEffect(() => {
    if (epochAngewandt.current === reiseEpoch) return
    epochAngewandt.current = reiseEpoch
    owner.current += 1
    editorOp.current += 1
    deleteOp.current += 1
    loeschtRef.current = false
    setEditorGeneration(owner.current)
    setLoescht(false)
  }, [reiseEpoch])

  const oeffnen = React.useCallback(() => {
    owner.current += 1
    setEditorGeneration(owner.current)
  }, [])

  const generationPasst = React.useCallback((generation: number) => generation === owner.current, [])

  const editorBeginnen = React.useCallback(() => {
    editorOp.current += 1
    return editorOp.current
  }, [])

  const editorAktuell = React.useCallback((id: number) => editorOp.current === id, [])

  const loeschungBeginnen = React.useCallback(() => {
    if (loeschtRef.current) return null
    loeschtRef.current = true
    deleteOp.current += 1
    setLoescht(true)
    return deleteOp.current
  }, [])

  const loeschungAktuell = React.useCallback((id: number) => deleteOp.current === id, [])

  const loeschungBeenden = React.useCallback((id: number) => {
    if (deleteOp.current !== id) return
    loeschtRef.current = false
    setLoescht(false)
  }, [])

  const fremdeReise = React.useCallback(() => {
    setReiseEpoch((wert) => wert + 1)
  }, [])

  return {
    editorGeneration,
    loescht,
    oeffnen,
    generationPasst,
    editorBeginnen,
    editorAktuell,
    loeschungBeginnen,
    loeschungAktuell,
    loeschungBeenden,
    fremdeReise,
  }
}

/** Trigger, then the item's control, then the unassigned heading, then the zero-day text or the plan section. */
export function planFokusZurueck(root: HTMLElement | null, trigger: HTMLElement | null, punktId: string | null) {
  requestAnimationFrame(() => {
    if (trigger?.isConnected && trigger.getClientRects().length > 0) {
      trigger.focus({ preventScroll: true })
      trigger.scrollIntoView({ block: 'center', behavior: 'instant' })
      return
    }
    const punkt = punktId
      ? root?.querySelector<HTMLElement>(`[data-plan-punkt="${CSS.escape(punktId)}"]`)
      : null
    const control = punkt?.querySelector<HTMLElement>('button, a, input, select, textarea, [tabindex]')
    if (control && control.getClientRects().length > 0) {
      control.focus({ preventScroll: true })
      return
    }
    const ueberschrift = root?.querySelector<HTMLElement>('[data-plan-ungeplant]')
    if (ueberschrift && ueberschrift.getClientRects().length > 0) {
      ueberschrift.focus({ preventScroll: true })
      return
    }
    const ohneTage = root?.querySelector<HTMLElement>('[data-plan-keine-tage]')
    if (ohneTage && ohneTage.getClientRects().length > 0) {
      ohneTage.focus({ preventScroll: true })
      return
    }
    root?.focus({ preventScroll: true })
  })
}
