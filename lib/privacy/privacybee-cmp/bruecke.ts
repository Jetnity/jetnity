// Removable document listeners. Notifications re-read the API. The event detail is not the grant.

import { readCmpApi, type CmpRead } from '@/lib/privacy/privacybee-cmp/schnappschuss'

export type BridgePhase = 'missing' | 'denied' | 'ready' | 'error'

export type BridgeTarget = {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  removeEventListener: (type: string, listener: (event: Event) => void) => void
}

export function phaseFromRead(read: CmpRead, threw: boolean): BridgePhase {
  if (threw) return 'error'
  if (read.status === 'explicit') return 'ready'
  if (read.reason === 'missing_api') return 'missing'
  if (read.reason === 'no_explicit_consent') return 'denied'
  return 'error'
}

export function attachCmpBridge(
  target: BridgeTarget,
  readApi: () => unknown,
  onPhase?: (phase: BridgePhase) => void,
): { phase: () => BridgePhase; stop: () => void; notify: () => void } {
  let phase: BridgePhase = 'missing'
  let stopped = false

  const reconcile = (notify: boolean) => {
    if (stopped) return
    let next: BridgePhase
    try {
      next = phaseFromRead(readCmpApi(readApi()), false)
    } catch {
      next = 'error'
    }
    phase = next
    if (notify) onPhase?.(next)
  }

  const onSignal = () => reconcile(true)
  target.addEventListener('privacybee:ready', onSignal)
  target.addEventListener('privacybee:consent-changed', onSignal)
  reconcile(false)
  if (onPhase) {
    queueMicrotask(() => {
      if (!stopped) onPhase(phase)
    })
  }

  return {
    phase: () => phase,
    notify: () => reconcile(true),
    stop: () => {
      stopped = true
      target.removeEventListener('privacybee:ready', onSignal)
      target.removeEventListener('privacybee:consent-changed', onSignal)
    },
  }
}
