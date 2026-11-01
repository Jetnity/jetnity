'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import type { ActivityWidgetProvider } from '@/lib/activities/widget-datenschutz'
import { readActivityWidgetFreigabe, serverActivityWidgetFreigabe, subscribeActivityWidgetFreigabe } from '@/lib/activities/widget-konfiguration'

export default function AktivitaetenWidgetFreigabe({ provider, children }: {
  provider: ActivityWidgetProvider
  children: ReactNode
}) {
  const erlaubt = useSyncExternalStore(subscribeActivityWidgetFreigabe, readActivityWidgetFreigabe, serverActivityWidgetFreigabe)
  // Unmounting disposes the provider frame and any pending render generation.
  if (erlaubt) return children
  return (
    <section aria-label={provider === 'viator' ? 'Viator' : 'GetYourGuide'} data-activity-widget-blocked={provider}
      className="mt-6 min-w-0 border-t border-line-200 pt-5 [overflow-wrap:anywhere]">
      <h3 className="text-lg font-semibold text-brand-800">{provider === 'viator' ? 'Viator' : 'GetYourGuide'}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-800">
        Externe Angebote sind derzeit nicht aktiviert. Du kannst deine Reise weiter planen.
      </p>
    </section>
  )
}
