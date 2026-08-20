// app/(public)/ui-audit/activities/page.tsx
//
// Nur für den lokalen Activities-UI-Audit. In Production und ohne
// JETNITY_UI_AUDIT immer 404 – keine Fake-Aktivitäten, kein produktiver Pfad.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ActivitiesAuditClient from '@/components/trips/ActivitiesAuditClient'

export const metadata: Metadata = {
  title: 'Aktivitäten-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ActivitiesAuditSeite() {
  if (process.env.JETNITY_UI_AUDIT !== '1' && process.env.JETNITY_UI_AUDIT !== 'true') {
    notFound()
  }
  return <ActivitiesAuditClient />
}
