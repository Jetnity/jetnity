// app/(public)/ui-audit/trip-workspace/page.tsx
//
// Nur für den lokalen Trip-Workspace-UI-Audit. Production ist unabhängig vom
// Audit-Flag immer 404. Ausserhalb von Production braucht es JETNITY_UI_AUDIT.
// Keine Fake-Reisen im Produktweg.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import TripWorkspaceAuditClient from '@/components/trips/TripWorkspaceAuditClient'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Trip-Workspace-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function TripWorkspaceAuditSeite() {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }
  return <TripWorkspaceAuditClient />
}
