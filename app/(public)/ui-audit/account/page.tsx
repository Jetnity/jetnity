// app/(public)/ui-audit/account/page.tsx
//
// Nur für den lokalen Account-Shell-UI-Audit. Production immer 404.

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import AccountAuditClient from '@/components/account/AccountAuditClient'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Account-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AccountAuditSeite() {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-75" />}>
      <AccountAuditClient />
    </Suspense>
  )
}
