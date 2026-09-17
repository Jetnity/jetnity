// app/(public)/ui-audit/account/page.tsx
//
// Nur für den lokalen Account-Shell-UI-Audit. Production immer 404.

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import AccountAuditClient from '@/components/account/AccountAuditClient'
import { weltGeometrieFuer } from '@/lib/account/welt-geometrie'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

/**
 * Nur die Länder der Fixtures. Die vollständige Kartografie bleibt auf dem
 * Server – auch im Audit, sonst prüfte der Audit eine andere Nutzlast als die
 * Produktseite. SG, HK und MT stehen für Länder ohne zeichenbare Fläche, je
 * einmal besucht, überlagert und geplant.
 */
const AUDIT_LAENDER = ['PT', 'IT', 'JP', 'SG', 'BR', 'HK', 'MT'] as const

export const metadata: Metadata = {
  title: 'Account-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountAuditSeite({
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
  const einzeln = (name: string) => {
    const wert = parameter[name]
    return typeof wert === 'string' ? wert : null
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-75" />}>
      <AccountAuditClient
        geometrie={weltGeometrieFuer(AUDIT_LAENDER)}
        zustand={einzeln('zustand') ?? 'reise'}
        ansicht={einzeln('ansicht')}
      />
    </Suspense>
  )
}
