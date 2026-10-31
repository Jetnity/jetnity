'use client'

import { useSyncExternalStore } from 'react'

import { attachCmpBridge, type BridgePhase } from '@/lib/privacy/privacybee-cmp/bruecke'

declare global {
  interface Window {
    PrivacyBee?: unknown
  }
}

let snapshot: BridgePhase = 'missing'

function getSnapshot(): BridgePhase {
  return snapshot
}

function getServerSnapshot(): BridgePhase {
  return 'missing'
}

function subscribe(onChange: () => void) {
  const bridge = attachCmpBridge(document, () => window.PrivacyBee, (next) => {
    snapshot = next
    onChange()
  })
  snapshot = bridge.phase()
  return () => bridge.stop()
}

/** Listens only. It does not insert the banner and does not write consent. */
export function PrivacyBeeCmpClient() {
  const phase = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return <span data-cmp-phase={phase} hidden />
}
