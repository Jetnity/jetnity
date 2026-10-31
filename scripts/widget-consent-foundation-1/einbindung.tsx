'use client'

// Nur die synthetische Prüffläche. Keine Produktionsroute.

import { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import {
  applyWidgetConsentCommand,
  createWidgetConsentState,
  vendorScriptMayExecute,
  type WidgetConsentCommand,
  type WidgetConsentState,
} from '@/lib/privacy/widget-consent/entscheidung'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

type Paar = Record<WidgetConsentProviderId, WidgetConsentState>

function anfang(): Paar {
  const discovercars = createWidgetConsentState('discovercars', 'scope-alpha')
  const twelvegoOffen = createWidgetConsentState('twelvego', 'scope-alpha')
  const twelvego = applyWidgetConsentCommand(twelvegoOffen, {
    type: 'close',
    generation: twelvegoOffen.generation,
  }).state
  return { discovercars, twelvego }
}

export function WidgetConsentSyntheticHost() {
  const [states, setStates] = useState(anfang)
  const dispatch = useCallback((providerId: WidgetConsentProviderId, command: WidgetConsentCommand) => {
    setStates((current) => {
      const result = applyWidgetConsentCommand(current[providerId], command)
      return { ...current, [providerId]: result.state }
    })
  }, [])

  const killDiscover = vendorScriptMayExecute(states.discovercars, { enabled: true })
  const killTwelve = vendorScriptMayExecute(states.twelvego, { enabled: true })

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-3xl break-words bg-surface-75 px-4 py-6 text-brand-800 [overflow-wrap:anywhere]">
      <h1 className="break-words text-2xl font-semibold">Synthetische Einwilligung</h1>
      <p className="mt-2 text-base leading-6 text-ink-900">
        Prüffläche ohne Anbieter-Skript. Zustimmung lädt nichts.
      </p>
      <p className="mt-2 text-base font-semibold" data-kill-switch={killDiscover || killTwelve ? 'open' : 'closed'}>
        Ausführung trotz Schalter-Versuch: {killDiscover || killTwelve ? 'an' : 'aus'}.
      </p>
      <div className="mt-6 grid gap-6">
        <WidgetConsentChoice
          state={states.discovercars}
          onCommand={(command) => dispatch('discovercars', command)}
        />
        <WidgetConsentChoice
          state={states.twelvego}
          onCommand={(command) => dispatch('twelvego', command)}
        />
      </div>
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold text-brand-800"
          data-synthetic="stale-grant"
          onClick={() => dispatch('discovercars', { type: 'grant_informative', generation: 0 })}
        >
          Veraltete Zustimmung
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold text-brand-800"
          data-synthetic="reorder"
          onClick={() =>
            dispatch('discovercars', {
              type: 'reset_context',
              generation: states.discovercars.generation,
              reason: 'reorder',
            })
          }
        >
          Reihenfolge zurücksetzen
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold text-brand-800"
          data-synthetic="scope"
          onClick={() =>
            dispatch('discovercars', {
              type: 'reset_context',
              generation: states.discovercars.generation,
              reason: 'scope_changed',
              scopeKey: states.discovercars.scopeKey === 'scope-alpha' ? 'scope-beta' : 'scope-alpha',
            })
          }
        >
          Andere Reise
        </button>
      </div>
    </main>
  )
}

if (typeof document !== 'undefined') {
  const knoten = document.getElementById('widget-consent-synthetic-root')
  if (knoten) createRoot(knoten).render(<WidgetConsentSyntheticHost />)
}
