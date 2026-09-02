// app/account/page.tsx
//
// Persönliche Account-Übersicht. Reisen kommen ausschliesslich aus
// `reisenLaden()`. Empty und Error bleiben getrennt. aktiv/kommend
// klassifiziert der Client am Geräte-Kalendertag, nicht der Server.
// Die Weltkarte nutzt dieselbe geladene TripSummary-Menge.

import type { Metadata } from 'next'

import AccountUebersichtLive from '@/components/account/AccountUebersichtLive'
import { begruessungName } from '@/lib/account/begruessung'
import { createServerComponentClient } from '@/lib/supabase/server'
import { reisenLaden } from '@/lib/trips/daten'

export const metadata: Metadata = {
  title: 'Konto',
  description: 'Dein persönliches Jetnity-Zuhause.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountSeite() {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const nutzer = data.user
  const name = begruessungName({
    name: typeof nutzer?.user_metadata?.name === 'string' ? nutzer.user_metadata.name : null,
    email: nutzer?.email ?? null,
  })

  const { zeilen, problem } = await reisenLaden()
  const reisen = zeilen ?? []

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <AccountUebersichtLive name={name} problem={problem} reisen={reisen} />
      </div>
    </main>
  )
}
