// Nur für /ui-audit/account?dichte=40.
//
// AccountAuditClient bleibt unangetastet: die Karte und die Übersicht gehören
// der parallelen Spur. Diese Hülle reicht vierzig schon abgeleitete Ereignisse
// in dieselbe Besuchskomponente, damit die Verwaltungslänge messbar ist.
// Nichts davon wird gespeichert.

import AccountBesuche from '@/components/account/AccountBesuche'
import AccountNavigation from '@/components/account/AccountNavigation'
import { besuchVerwaltungDichteFixture } from '@/lib/account/account-world-visit-management-premium-1-fixture'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten, type WeltGeometrie } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'

export default function AccountBesuchVerwaltungDichte({
  geometrie,
}: {
  geometrie: WeltGeometrie
}) {
  const besuche = besuchVerwaltungDichteFixture(40)
  const besucht = weltBesuchtAbleiten({ besuche, problem: null })
  const welt = worldMapAbleiten({ problem: null, reisen: [] })
  const laender = weltLaenderAbleiten({
    besucht: besucht.laenderCodes,
    geplant: welt.laenderCodes,
    geometrie,
  })

  return (
    <div data-account-audit="dichte-40" className="min-h-screen bg-surface-75">
      <AccountNavigation />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <AccountBesuche
            welt={welt}
            besucht={besucht}
            laender={laender}
            besuche={besuche}
            problem={null}
          />
        </div>
      </main>
    </div>
  )
}
