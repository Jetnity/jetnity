import { createRoot } from 'react-dom/client'

import AccountNavigation from '@/components/account/AccountNavigation'
import MerklisteSeite from '@/components/saved-offers/MerklisteSeite'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import type { SavedOffer } from '@/lib/saved-offers/contract'

/** Synthetische Merkliste, keine echten Angebote und keine Anbieterverbindung. */
const ANGEBOTE: SavedOffer[] = [
  {
    id: '00000000-0000-4000-8000-0000000000a1',
    user_id: '00000000-0000-4000-8000-0000000000ff',
    category: 'rental_car',
    title: 'Kompaktwagen in Zürich',
    url: 'https://angebot.example.invalid/mietwagen/zuerich-kompakt',
    provider: 'Beispielvermieter',
    source: 'manual',
    offer_ref: 'manual:beispiel-1',
    destination: 'Zürich',
    starts_on: '2026-12-18',
    ends_on: '2026-12-23',
    starts_at: '09:00:00',
    ends_at: '17:30:00',
    start_timezone: 'Europe/Zurich',
    end_timezone: 'Europe/Zurich',
    expires_at: null,
    created_at: '2026-11-20T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000a2',
    user_id: '00000000-0000-4000-8000-0000000000ff',
    category: 'stay',
    title: 'Chalet bei Zermatt',
    url: 'https://angebot.example.invalid/unterkunft/zermatt-chalet',
    provider: 'Beispielportal',
    source: 'manual',
    offer_ref: 'manual:beispiel-2',
    destination: 'Zermatt',
    starts_on: null,
    ends_on: null,
    starts_at: null,
    ends_at: null,
    start_timezone: null,
    end_timezone: null,
    expires_at: null,
    created_at: '2026-11-21T10:00:00.000Z',
  },
]

const wurzel = typeof document !== 'undefined' ? document.getElementById('root') : null

if (wurzel) {
  createRoot(wurzel).render(
    <WorkspaceShell contentId="account-content">
      <AccountNavigation />
      <MerklisteSeite ergebnis={{ ok: true, value: ANGEBOTE }} />
    </WorkspaceShell>,
  )
}
