'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { PrivacyBeeCmpBoundary } from '@/components/privacy/PrivacyBeeCmpBoundary'
import { PrivacyBeeCmpFrameSlot } from '@/components/privacy/PrivacyBeeCmpFrameSlot'
import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import { applyController, readCmpController, retireSharedExecution, serverCmpSnapshot, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import {
  acceptPending,
  dispatchChoice,
  issueWork,
  selectProvider,
  startLocalContext,
  type WorkToken,
} from '@/lib/privacy/privacybee-cmp/steuerung'
import type { WidgetConsentCommand } from '@/lib/privacy/widget-consent/entscheidung'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import { TEST_BUNDLE_POLICY } from './politik'

declare global {
  interface Window {
    PrivacyBee?: unknown
    __jetnityToken?: WorkToken | null
    __jetnityBreak?: () => void
    __jetnityRestore?: () => void
    __jetnityUnmount?: () => void
    __jetnityRemount?: () => void
  }
}

function canaryMerken(entry: { epoch: number; scope: string; ok: boolean }) {
  const node = document.getElementById('cmp-canary-log')
  if (!node) return
  const bisher = JSON.parse(node.getAttribute('data-canary-log') || '[]') as { epoch: number; scope: string; ok: boolean }[]
  bisher.push(entry)
  node.setAttribute('data-canary-log', JSON.stringify(bisher))
}

function istAnbieter(value: unknown): value is WidgetConsentProviderId {
  return value === 'discovercars' || value === 'twelvego'
}

export function CmpSyntheticHost() {
  const state = useSyncExternalStore(subscribeCmpController, readCmpController, serverCmpSnapshot)
  const slot = state.slots.discovercars

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { jetnityCanary?: unknown; provider?: unknown; scope?: unknown } | null
      if (!data || typeof data.jetnityCanary !== 'number' || typeof data.scope !== 'string' || !istAnbieter(data.provider)) return
      const ok = acceptPending(readCmpController(), {
        providerId: data.provider,
        epoch: data.jetnityCanary,
        scopeKey: data.scope,
      })
      canaryMerken({ epoch: data.jetnityCanary, scope: data.scope, ok })
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      retireSharedExecution('discovercars')
    }
  }, [])

  return (
    <main
      data-white-mint="home"
      data-workspace-theme="light"
      className="workspace-shell workspace-content mx-auto min-h-screen w-full min-w-0 max-w-3xl bg-surface-75 px-4 py-6 text-brand-800 [overflow-wrap:anywhere]"
    >
      <PrivacyBeeCmpBoundary harnessRelease={{ purpose: 's2-test-release' }} />
      <h1 className="break-words text-2xl font-semibold">Synthetische CMP-Prüfung</h1>
      <p
        data-phase={state.phase}
        data-revision={String(state.revision)}
        data-intent={slot.intent}
        data-epoch={String(slot.epoch)}
        data-consent-generation={String(slot.consent.generation)}
        data-scope={slot.consent.scopeKey}
        data-live-epoch={state.live ? String(state.live.epoch) : ''}
      >
        Phase {state.phase}, Revision {state.revision}
      </p>
      <WidgetConsentChoice
        state={slot.consent}
        cmpPreferences={state.phase === 'ready' ? 'ready' : 'hidden'}
        onCommand={(command: WidgetConsentCommand) => {
          applyController((current) => dispatchChoice(current, 'discovercars', command))
        }}
      />
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="select" onClick={() => applyController((current) => selectProvider(current, 'discovercars'))}>
        Anbieter wählen
      </button>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
        data-synthetic="remember"
        onClick={() => {
          window.__jetnityToken = issueWork(readCmpController(), 'discovercars')
          document.getElementById('cmp-issued')?.setAttribute('data-issued', window.__jetnityToken ? String(window.__jetnityToken.epoch) : '')
        }}
      >
        Arbeit merken
      </button>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
        data-synthetic="start"
        onClick={() => applyController((current) => startLocalContext(
          current,
          'discovercars',
          TEST_BUNDLE_POLICY,
          window.PrivacyBee,
          location.hostname,
          window.__jetnityToken,
        ).state)}
      >
        Kontext starten
      </button>
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="stale" onClick={() => applyController((current) => dispatchChoice(current, 'discovercars', { type: 'reset_context', generation: 0, reason: 'reorder' }))}>
        Veralteten Kontext verwerfen
      </button>
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="reorder" onClick={() => applyController((current) => dispatchChoice(current, 'discovercars', { type: 'reset_context', generation: current.slots.discovercars.consent.generation, reason: 'reorder' }))}>
        Reihenfolge zurücksetzen
      </button>
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="scope" onClick={() => applyController((current) => dispatchChoice(current, 'discovercars', { type: 'reset_context', generation: current.slots.discovercars.consent.generation, reason: 'scope_changed', scopeKey: 'scope-beta' }))}>
        Scope wechseln
      </button>
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="break" onClick={() => window.__jetnityBreak?.()}>
        API beschädigen
      </button>
      <button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold" data-synthetic="restore" onClick={() => window.__jetnityRestore?.()}>
        API herstellen
      </button>
      <PrivacyBeeCmpFrameSlot live={state.live} />
    </main>
  )
}

function mount(): Root | null {
  const knoten = document.getElementById('cmp-s2-root')
  if (!knoten) return null
  const wurzel = createRoot(knoten)
  wurzel.render(<CmpSyntheticHost />)
  return wurzel
}

if (typeof document !== 'undefined') {
  let wurzel = mount()
  window.__jetnityUnmount = () => {
    wurzel?.unmount()
    wurzel = null
  }
  window.__jetnityRemount = () => {
    window.__jetnityUnmount?.()
    wurzel = mount()
  }
}
