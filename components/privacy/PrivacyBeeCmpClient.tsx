'use client'

import { useSyncExternalStore } from 'react'

import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'
import { createController, ingestApi, type CmpControllerState } from '@/lib/privacy/privacybee-cmp/steuerung'

declare global {
  interface Window {
    PrivacyBee?: unknown
  }
}

let snapshot: CmpControllerState = createController()

function getSnapshot(): CmpControllerState {
  return snapshot
}

function getServerSnapshot(): CmpControllerState {
  return createController()
}

function subscribe(onChange: () => void) {
  const bridge = attachCmpBridge(document, () => window.PrivacyBee, () => {
    snapshot = ingestApi(snapshot, window.PrivacyBee)
    onChange()
  })
  snapshot = ingestApi(snapshot, window.PrivacyBee)
  void bridge.phase()
  return () => bridge.stop()
}

/** Publishes the current snapshot. It does not render a preferences control. */
export function PrivacyBeeCmpClient() {
  const stand = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return <span data-cmp-phase={stand.phase} data-cmp-revision={String(stand.revision)} hidden />
}
