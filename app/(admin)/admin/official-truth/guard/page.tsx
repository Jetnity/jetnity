import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import DevGuardPanel from './DevGuardPanel'

export const dynamic = 'force-dynamic'

export default async function DevGuardPage() {
  const selected = getHumanRelease()?.targetUrl === HUMAN_METHOD_DEV_URL && getServerSupabaseUrl() === HUMAN_METHOD_DEV_URL
  if (selected) {
    const gate = await requireAdminPage({ surface: 'official-truth-guard', capability: 'official-truth-freigeben' })
    if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  }
  return <section className="mx-auto max-w-2xl space-y-6">
    <Seitenkopf kicker="Amtliche Quellen" titel="Dev: Quellenversuch und Schutzprüfung">
      <p>CH→DE · Schweizer Reisepass · direkte Einreise · Visumpflicht · Methode Revision 1.</p>
    </Seitenkopf>
    {selected ? <DevGuardPanel /> : <p role="status">Diese Owner-Vorgänge sind hier nicht verfügbar.</p>}
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/official-truth/method">Methode und vollständiges Quellenpaket prüfen</Link></p>
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/official-truth/import">Zum manuellen Dev-Quellenlauf</Link></p>
  </section>
}
