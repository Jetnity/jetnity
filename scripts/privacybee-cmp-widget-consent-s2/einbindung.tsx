'use client'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { PrivacyBeeCmpFrameSlot } from '@/components/privacy/PrivacyBeeCmpFrameSlot'
import { decideSyntheticBundle, SYNTHETIC_BUNDLE_POLICY } from '@/lib/privacy/privacybee-cmp/bundle'
import { emptyFrameBook, invalidateFrame, tryStartFrame, type FrameBook } from '@/lib/privacy/privacybee-cmp/rahmen'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import { createWidgetConsentState, type WidgetConsentCommand } from '@/lib/privacy/widget-consent/entscheidung'

const cmp = readCmpApi({
  getAllConsents: () => ({
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: true,
    AD_STORAGE: true,
    AD_USER_DATA: true,
    AD_PERSONALIZATION: true,
    PERSONALIZATION_STORAGE: true,
  }),
  getConsent: (category: string) => {
    const werte: Record<string, boolean> = {
      SECURITY_STORAGE: true,
      FUNCTIONALITY_STORAGE: true,
      ANALYTICS_STORAGE: true,
      AD_STORAGE: true,
      AD_USER_DATA: true,
      AD_PERSONALIZATION: true,
      PERSONALIZATION_STORAGE: true,
    }
    return werte[category]
  },
  hasExplicitConsent: () => true,
})

export function CmpSyntheticHost() {
  const [book, setBook] = useState<FrameBook>(emptyFrameBook())
  const [choice, setChoice] = useState(() => createWidgetConsentState('discovercars', 'scope-alpha'))
  const entscheidung = decideSyntheticBundle({
    policy: SYNTHETIC_BUNDLE_POLICY,
    providerId: 'discovercars',
    intent: 'selected',
    generation: book.generation,
    expectedGeneration: book.generation,
    cmp,
  })

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-3xl bg-surface-75 px-4 py-6 text-brand-800 [overflow-wrap:anywhere]">
      <h1 className="break-words text-2xl font-semibold">Synthetische CMP-Prüfung</h1>
      <p className="mt-2 text-base leading-6">Produktionsstart bleibt aus. Der Rahmen ist lokal.</p>
      <p className="mt-2 font-semibold" data-production-execute="false">
        Produktion: {entscheidung.productionExecute ? 'an' : 'aus'}
      </p>
      <div className="mt-6 grid gap-4">
        <WidgetConsentChoice
          state={choice}
          cmpPreferences="ready"
          onCommand={(command: WidgetConsentCommand) => {
            void command
            setChoice(createWidgetConsentState('discovercars', 'scope-alpha'))
          }}
        />
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
          data-synthetic="start"
          onClick={() => setBook((current) => tryStartFrame(current, {
            allowed: entscheidung.execute,
            providerId: 'discovercars',
            generation: current.generation,
          }).book)}
        >
          Rahmen starten
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-base font-semibold"
          data-synthetic="withdraw"
          onClick={() => setBook((current) => invalidateFrame(current))}
        >
          Entziehen
        </button>
        <PrivacyBeeCmpFrameSlot live={book.live} />
      </div>
    </main>
  )
}

if (typeof document !== 'undefined') {
  const knoten = document.getElementById('cmp-s2-root')
  if (knoten) createRoot(knoten).render(<CmpSyntheticHost />)
}
