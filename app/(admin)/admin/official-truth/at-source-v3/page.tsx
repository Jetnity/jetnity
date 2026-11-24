import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { atSourceV3ProductionSelected } from '@/lib/readiness/official-truth-at-method-v1/at-source-v3-owner-server'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import AtSourceV3OwnerPanel from './AtSourceV3OwnerPanel'

export const dynamic='force-dynamic'

export default async function AtSourceV3OwnerPage(){
 const gate=await requireAdminPage({surface:'official-truth-source-v3',capability:'official-truth-freigeben'})
 if(gate.role!=='owner'||gate.grant!=='role')redirect('/unauthorized?grund=owner_required')
 const enabled=atSourceV3ProductionSelected()
 return <main className="mx-auto max-w-2xl space-y-6 px-5 pb-14 pt-6 text-foreground sm:px-8 sm:pb-20 sm:pt-10">
  <Seitenkopf kicker="Amtliche Quellen" titel="CH → Österreich: Quellen-Nachfolger V3 · Owner">
   <p>Nur geschützte Inhaberprüfung mit frischer Zwei-Faktor-Anmeldung. Eine Quellenentscheidung ist keine Veröffentlichung oder Visumfreigabe.</p>
  </Seitenkopf>
  <AtSourceV3OwnerPanel enabled={enabled}/>
 </main>
}
