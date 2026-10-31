'use client'

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { PrivacyBeeCmpFrameSlot } from '@/components/privacy/PrivacyBeeCmpFrameSlot'
import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'
import {
  createController,
  dispatchChoice,
  ingestApi,
  selectProvider,
  startLocalContext,
  type CmpControllerState,
} from '@/lib/privacy/privacybee-cmp/steuerung'
import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import type { WidgetConsentCommand } from '@/lib/privacy/widget-consent/entscheidung'

import { TEST_BUNDLE_POLICY } from './politik'

declare global {
  interface Window {
    PrivacyBee?: unknown
  }
}

export function CmpSyntheticHost() {
  const [state, setState] = useState<CmpControllerState>(createController)

  useEffect(() => {
    const bridge = attachCmpBridge(document, () => window.PrivacyBee, () => {
      setState((current) => ingestApi(current, window.PrivacyBee))
    })
    return () => bridge.stop()
  }, [])

  const slot = state.slots.discovercars

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-3xl bg-surface-75 px-4 py-6 text-brand-800 [overflow-wrap:anywhere]">
      <h1 className="break-words text-2xl font-semibold">Synthetische CMP-Prüfung</h1>
      <p data-phase={state.phase} data-revision={String(state.revision)} data-intent={slot.intent}>
        Phase {state.phase}, Revision {state.revision}
      </p>
      <WidgetConsentChoice
        state={slot.consent}
        cmpPreferences={state.phase === 'ready' ? 'ready' : 'hidden'}
        onCommand={(command: WidgetConsentCommand) => setState((current) => dispatchChoice(current, 'discovercars', command))}
      />
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
        data-synthetic="select"
        onClick={() => setState((current) => selectProvider(current, 'discovercars'))}
      >
        Anbieter wählen
      </button>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
        data-synthetic="start"
        onClick={() => setState((current) => startLocalContext(
          current,
          'discovercars',
          TEST_BUNDLE_POLICY,
          window.PrivacyBee,
          location.hostname,
        ).state)}
      >
        Kontext starten
      </button>
      <PrivacyBeeCmpFrameSlot live={state.live} />
    </main>
  )
}

if (typeof document !== 'undefined') {
  const knoten = document.getElementById('cmp-s2-root')
  if (knoten) createRoot(knoten).render(<CmpSyntheticHost />)
}
