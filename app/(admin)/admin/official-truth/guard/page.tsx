import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import DevGuardPanel from './DevGuardPanel'

export const dynamic = 'force-dynamic'

export default async function DevGuardPage() {
  const selected = getHumanRelease()?.targetUrl === HUMAN_METHOD_DEV_URL && getServerSupabaseUrl() === HUMAN_METHOD_DEV_URL
  if (selected) {
    const gate = await requireAdminPage({ surface: 'official-truth-guard', capability: 'official-truth-freigeben' })
    if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  }
  return <section className="mx-auto max-w-3xl space-y-6 px-4 py-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">Dev: Quellenversuch und Schutzprüfung</h1>
      <p>CH→DE · Schweizer Reisepass · direkte Einreise · Visumpflicht · Methode Revision 1.</p></header>
    {selected ? <DevGuardPanel /> : <p role="status">Diese Owner-Vorgänge sind hier nicht verfügbar.</p>}
    <p><Link className="underline" href="/admin/official-truth/method">Methode und vollständiges Quellenpaket prüfen</Link></p>
    <p><Link className="underline" href="/admin/official-truth/import">Zum manuellen Dev-Quellenlauf</Link></p>
  </section>
}
