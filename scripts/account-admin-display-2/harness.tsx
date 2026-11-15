// Actual product components. Account Server Components are rendered on the
// fixture server; their native controls are not replaced by a client copy.
// This fixture never reads a real account/session or saves a language.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import TravelAnalytics from '@/components/admin/analytics/TravelAnalytics'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import type { TravelAnalyticsReport } from '@/lib/admin/analytics/report'
import type { Fehler } from '@/lib/admin/ladezustand'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export type DisplayFixtureBoot = {
  surface: 'analytics' | 'bookings' | 'loading' | 'error'
  sprache: UiSprache
  documentId: string
  report?: TravelAnalyticsReport
  invalidRange?: boolean
  fehler?: Fehler
}

declare global {
  interface Window {
    __displayFixtureBoot: DisplayFixtureBoot
    __displayBlockedOperations: string[]
    __recordDisplayViolation: (message: string) => Promise<void>
    __displayProof: { documentId: string; retries: () => number }
  }
}

const boot = window.__displayFixtureBoot
if (!boot || !['de', 'en'].includes(boot.sprache) || !boot.documentId) throw new Error('Missing synthetic display fixture')
if (!Array.isArray(window.__displayBlockedOperations) || typeof window.__recordDisplayViolation !== 'function') {
  throw new Error('Display isolation must be installed before the product bundle')
}
const container = document.getElementById('root')
if (!container) throw new Error('Missing display root')

let retryCalls = 0
function RetryExample({ fehler }: { fehler: Fehler }) {
  const [pending, setPending] = useState(false)
  return <Fehlerflaeche fehler={fehler} sprache={boot.sprache} veraltet laeuft={pending}
    onWiederholen={() => { retryCalls += 1; setPending(true) }} />
}

if (boot.surface === 'analytics') {
  if (!boot.report) throw new Error('Missing synthetic analytics report')
  createRoot(container).render(<StrictMode><main className="min-w-0 bg-background p-4 text-foreground">
    <TravelAnalytics report={boot.report} invalidRange={boot.invalidRange} sprache={boot.sprache} />
  </main></StrictMode>)
} else if (boot.surface === 'error') {
  if (!boot.fehler) throw new Error('Missing synthetic diagnostic')
  createRoot(container).render(<StrictMode><main className="min-w-0 p-4"><RetryExample fehler={boot.fehler} /></main></StrictMode>)
} else if (!container.querySelector(boot.surface === 'loading' ? '[aria-busy="true"]' : '[data-buchungen]')) {
  throw new Error('Actual Account Server Component markup is missing')
}

window.__displayProof = { documentId: boot.documentId, retries: () => retryCalls }
