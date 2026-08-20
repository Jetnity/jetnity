// app/(public)/ui-audit/activities/page.tsx
//
// Nur für den lokalen Activities-UI-Audit. Production ist unabhängig vom
// Audit-Flag immer 404. Ausserhalb von Production braucht es JETNITY_UI_AUDIT.
// Keine Fake-Aktivitäten, kein produktiver Pfad.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ActivitiesAuditClient from '@/components/trips/ActivitiesAuditClient'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Aktivitäten-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ActivitiesAuditSeite() {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }
  return <ActivitiesAuditClient />
}
