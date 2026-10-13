// Browser-only synthetic prop-update fixture. Bundled by the local audit, never an app import/route.
import React from 'react'
import { createRoot } from 'react-dom/client'
import WorldExplorer from '@/components/account/world-explorer-1/WorldExplorer'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { Besuch } from '@/lib/account/besuche'
import type { TripSummary } from '@/types/trips'

const visit: Besuch = { id: 'synthetic-event', placeId: 'synthetic-place', placeLabel: 'Porto', countryCode: 'PT', latitude: 41.15, longitude: -8.61, jahr: 2004, monat: null, tag: null, erstelltAm: '2026-01-01' }
const trip: TripSummary = { id: 'synthetic-trip', title: 'Portugal', origin: null, startDate: null, endDate: null, travellers: 1, currency: 'CHF', budgetAmount: null, status: 'planned', updatedAt: '2026-01-01', stages: [{ name: 'Porto', position: 1, countryCode: 'PT', placeId: 'synthetic-plan', latitude: 41.15, longitude: -8.61 }], stageCount: 1, dayCount: 0, itemCount: 0 }
const root = createRoot(document.getElementById('explorer-props-root')!)
function render(state: string) {
  const welt = worldMapAbleiten({ reisen: [trip], problem: null })
  const besucht = weltBesuchtAbleiten({ besuche: state === 'revoked' ? [] : [visit], problem: null })
  if (state === 'plan-error') welt.lage = 'fehler'
  if (state === 'visit-error') besucht.lage = 'fehler'
  const laender = weltLaenderAbleiten({ besucht: besucht.laenderCodes, geplant: welt.laenderCodes, geometrie: {} })
  root.render(<WorldExplorer welt={welt} besucht={besucht} laender={laender} />)
}
window.addEventListener('explorer-synthetic-props', (event) => render((event as CustomEvent<string>).detail))
render('initial')
