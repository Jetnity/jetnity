'use client'

import { useSyncExternalStore } from 'react'

import { browserHostIstLizenziert } from '@/lib/legal/privacybee-vertrag'
import { readCmpController, serverCmpSnapshot, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { bakedProductionGateAllows, readBakedProductionGate } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { CMP_PREFERENCES_CLASS } from '@/lib/privacy/privacybee-cmp/vertrag'

const SURFACE =
  'inline-flex min-h-11 w-full min-w-0 items-center justify-center whitespace-normal break-words rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-center text-base font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

const FOOTER =
  'inline-flex min-h-11 min-w-0 max-w-full items-center whitespace-normal break-words text-left text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 pointer-fine:min-h-0'

function preferencesVisible(phase: string): boolean {
  if (phase !== 'ready' && phase !== 'denied') return false
  if (!bakedProductionGateAllows(readBakedProductionGate())) return false
  const hostname = typeof location === 'undefined' ? null : location.hostname
  return browserHostIstLizenziert(hostname)
}

/** Official preferences control. Readiness is not permission to execute a provider. */
export function PrivacyBeeCmpPreferences({ appearance = 'surface' }: { appearance?: 'footer' | 'surface' }) {
  const stand = useSyncExternalStore(subscribeCmpController, readCmpController, serverCmpSnapshot)
  if (!preferencesVisible(stand.phase)) return null
  const button = (
    <button
      type="button"
      className={`${appearance === 'footer' ? FOOTER : SURFACE} ${CMP_PREFERENCES_CLASS}`}
      data-cmp-preferences={appearance}
    >
      Datenschutz-Einstellungen
    </button>
  )
  if (appearance === 'footer') return <li>{button}</li>
  return button
}
