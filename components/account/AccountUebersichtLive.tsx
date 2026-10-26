'use client'

// Geräte-Kalendertag für aktiv/kommend. Der Server kennt die lokale Lage nicht
// und darf sie nicht aus UTC erfinden.

import AccountUebersicht from '@/components/account/AccountUebersicht'
import { useGeraetekalendertag } from '@/components/account/account-home-export-1/useGeraetekalendertag'
import { naechsteReiseAus } from '@/lib/account/naechste-reise'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import type { WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { TripSummary } from '@/types/trips'

export default function AccountUebersichtLive({
  name,
  problem,
  reisen,
  besucht,
  laender,
}: {
  name: string | null
  problem: Problem | null
  reisen: readonly TripSummary[]
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
}) {
  const heute = useGeraetekalendertag()
  const naechste = problem ? null : naechsteReiseAus(reisen, heute)

  return (
    <AccountUebersicht
      name={name}
      problem={problem}
      naechste={naechste}
      hatReisen={reisen.length > 0}
      reisen={reisen}
      besucht={besucht}
      laender={laender}
      heute={heute}
    />
  )
}
