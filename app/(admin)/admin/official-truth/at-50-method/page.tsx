import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getAt50HumanRelease } from '@/lib/readiness/official-truth-at-method-v1/at-50-human-release'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import MethodAuthorityPanel from '../method/MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function Austria50MethodPage() {
 const gate=await requireAdminPage({surface:'official-truth-method',capability:'official-truth-freigeben'})
 if (gate.role!=='owner' || gate.grant!=='role') redirect('/unauthorized?grund=owner_required')
 const release=getAt50HumanRelease()
 return <section className="mx-auto max-w-2xl space-y-6">
   <Seitenkopf kicker="Amtliche Quellen" titel="Österreich – 50 Reisepässe, V3-Methode (nur Dev)">
     <p>Dies ist ausschliesslich die separate Inhaberfreigabe der Quellen- und
       Prüfmethode. Auch nach einer Bestätigung wird keine neue Visa- oder
       Einreiseregel importiert oder veröffentlicht. Die 49 zusätzlichen
       Passregeln benötigen einen eigenen geprüften Source-/MA1-/BG1-Importer,
       individuelle Fallprüfung und eine separate Production-Freigabe.</p>
   </Seitenkopf>
   <MethodAuthorityPanel key={release?.selectionId ?? 'at50-unselected'} release={release}/>
 </section>
}
