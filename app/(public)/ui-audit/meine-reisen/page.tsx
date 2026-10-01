// app/(public)/ui-audit/meine-reisen/page.tsx
//
// Interner Harness für Meine Reisen. Production bleibt 404.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MeineReisenHubAudit, {
  type MeineReisenHubAuditZustand,
} from '@/components/trips/MeineReisenHubAudit'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Meine-Reisen-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ZUSTAENDE = new Set<MeineReisenHubAuditZustand>([
  'po',
  'gemischt',
  'archiv',
  'leer',
  'fehler',
  'grenze',
])

export default async function MeineReisenAuditSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }

  const parameter = await searchParams
  const roh = parameter.zustand
  const wert = typeof roh === 'string' ? roh : 'po'
  const zustand: MeineReisenHubAuditZustand = ZUSTAENDE.has(wert as MeineReisenHubAuditZustand)
    ? (wert as MeineReisenHubAuditZustand)
    : 'po'

  return <MeineReisenHubAudit zustand={zustand} heute={heutigesDatum()} />
}
