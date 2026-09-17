// app/account/page.tsx
//
// Persönliche Account-Übersicht. Reisen kommen ausschliesslich aus
// `reisenLaden()`, bestätigte Besuche ausschliesslich aus `besucheLaden()`.
// Empty und Error bleiben je Seite getrennt: ein Ausfall der einen Quelle darf
// die andere nicht als leer erscheinen lassen. aktiv/kommend klassifiziert der
// Client am Geräte-Kalendertag, nicht der Server.
//
// Die Länderflächen werden hier ausgewählt, nicht im Browser: die vollständige
// Kartografie bleibt auf dem Server, der Client bekommt nur die Pfade der
// Länder, die dieses Konto betreffen.

import type { Metadata } from 'next'

import AccountUebersichtLive from '@/components/account/AccountUebersichtLive'
import { begruessungName } from '@/lib/account/begruessung'
import { besucheLaden } from '@/lib/account/besuche-daten'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderLaden } from '@/lib/account/welt-geometrie'
import { worldMapAbleiten } from '@/lib/account/world-map'
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

  const [reisenLesung, besucheLesung] = await Promise.all([reisenLaden(), besucheLaden()])
  const reisen = reisenLesung.zeilen ?? []
  const besucht = weltBesuchtAbleiten({
    besuche: besucheLesung.zeilen ?? [],
    problem: besucheLesung.problem,
  })
  const laender = weltLaenderLaden({
    besucht: besucht.laenderCodes,
    geplant: worldMapAbleiten({ problem: reisenLesung.problem, reisen }).laenderCodes,
  })

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <AccountUebersichtLive
          name={name}
          problem={reisenLesung.problem}
          reisen={reisen}
          besucht={besucht}
          laender={laender}
        />
      </div>
    </main>
  )
}
