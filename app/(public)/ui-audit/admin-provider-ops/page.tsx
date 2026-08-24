import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProviderOpsBoard from '@/components/admin/provider-ops/ProviderOpsBoard'
import { PROVIDER_OPS_BOARD_AUDIT_BERICHT } from '@/lib/admin/provider-ops-board/fixtures'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Admin Provider-Ops Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminProviderOpsAuditSeite() {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Provider & Kosten Audit</h1>
      <ProviderOpsBoard anfang={PROVIDER_OPS_BOARD_AUDIT_BERICHT} aktualisierenErlaubt={false} />
    </main>
  )
}
