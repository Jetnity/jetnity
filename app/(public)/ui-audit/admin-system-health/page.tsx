import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SystemHealthBoard from '@/components/admin/system-health/SystemHealthBoard'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from '@/lib/admin/system-health/fixtures'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Admin System Health Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminSystemHealthAuditSeite() {
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
      <h1 className="text-2xl font-semibold">System Health Audit</h1>
      <SystemHealthBoard anfang={SYSTEM_HEALTH_AUDIT_BERICHT} aktualisierenErlaubt={false} />
    </main>
  )
}
