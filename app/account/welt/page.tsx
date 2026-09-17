// app/account/welt/page.tsx
//
// Die persönliche Besuchshistorie: bestätigen, ändern, widerrufen.
//
// Zwei Quellen, zwei getrennte Leseergebnisse. Fällt eine aus, bleibt die
// andere eine gültige Aussage – und der Ausfall wird als Ausfall gezeigt, nicht
// als leere Historie.

import type { Metadata } from 'next'

import AccountBesuche from '@/components/account/AccountBesuche'
import { besucheLaden } from '@/lib/account/besuche-daten'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderLaden } from '@/lib/account/welt-geometrie'
import { worldMapAbleiten } from '@/lib/account/world-map'
import { reisenLaden } from '@/lib/trips/daten'

export const metadata: Metadata = {
  title: 'Deine Welt',
  description: 'Bestätigte Besuche in deinem Jetnity-Konto.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountWeltSeite() {
  const [reisenLesung, besucheLesung] = await Promise.all([reisenLaden(), besucheLaden()])

  const welt = worldMapAbleiten({
    problem: reisenLesung.problem,
    reisen: reisenLesung.zeilen ?? [],
  })
  const besucht = weltBesuchtAbleiten({
    besuche: besucheLesung.zeilen ?? [],
    problem: besucheLesung.problem,
  })
  const laender = weltLaenderLaden({
    besucht: besucht.laenderCodes,
    geplant: welt.laenderCodes,
  })

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <AccountBesuche
          welt={welt}
          besucht={besucht}
          laender={laender}
          besuche={besucheLesung.zeilen ?? []}
          problem={besucheLesung.problem}
        />
      </div>
    </main>
  )
}
