// app/(public)/ui-audit/account-settings-security/page.tsx
//
// Lokaler Sicht-Harness für Account Settings + Security Premium UX 1.
// Production bleibt 404. Keine eigene Auth-Semantik: die Produktseiten
// werden unverändert eingebettet.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AccountNavigation from '@/components/account/AccountNavigation'
import EinstellungenSeite from '@/app/account/settings/page'
import SicherheitSeite from '@/app/account/security/page'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Account-Einstellungen-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountSettingsSecurityAuditSeite({
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
  const flaeche = parameter.flaeche === 'sicherheit' ? 'sicherheit' : 'einstellungen'

  return (
    <div data-audit-shell="account-settings-security">
      <AccountNavigation />
      {flaeche === 'sicherheit' ? <SicherheitSeite /> : <EinstellungenSeite />}
    </div>
  )
}
