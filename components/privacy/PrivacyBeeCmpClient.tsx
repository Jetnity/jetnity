'use client'

import { useSyncExternalStore } from 'react'

import { readCmpController, serverCmpSnapshot, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'

export { readCmpController, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'

/** Mounted reader. Preferences stay on the choice surface, not on this span. */
export function PrivacyBeeCmpClient() {
  const stand = useSyncExternalStore(subscribeCmpController, readCmpController, serverCmpSnapshot)
  return <span data-cmp-client="1" data-cmp-phase={stand.phase} data-cmp-revision={String(stand.revision)} hidden />
}
