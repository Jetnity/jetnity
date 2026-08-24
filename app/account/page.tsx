// app/account/page.tsx
//
// Persönliche Account-Übersicht. Reisen kommen ausschliesslich aus
// `reisenLaden()`. Empty und Error bleiben getrennt.

import type { Metadata } from 'next'

import AccountUebersicht from '@/components/account/AccountUebersicht'
import { begruessungName } from '@/lib/account/begruessung'
import { heutigesDatum, naechsteReiseAus } from '@/lib/account/naechste-reise'
import { createServerComponentClient } from '@/lib/supabase/server'
import { reisenLaden } from '@/lib/trips/daten'

export const metadata: Metadata = {
  title: 'Konto',
  description: 'Dein persönliches Jetnity-Zuhause.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountSeite() {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const nutzer = data.user
  const name = begruessungName({
    name: typeof nutzer?.user_metadata?.name === 'string' ? nutzer.user_metadata.name : null,
    email: nutzer?.email ?? null,
  })

  const { zeilen, problem } = await reisenLaden()
  const reisen = zeilen ?? []
  const naechste = problem ? null : naechsteReiseAus(reisen, heutigesDatum())

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <AccountUebersicht
          name={name}
          problem={problem}
          naechste={naechste}
          hatReisen={reisen.length > 0}
        />
      </div>
    </main>
  )
}
