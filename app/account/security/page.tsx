// app/account/security/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import SecurityLogout from '@/components/account/SecurityLogout'
import SecurityMFA from '@/components/account/SecurityMFA'
import SecurityPasswort from '@/components/account/SecurityPasswort'
import SecuritySitzung from '@/components/account/SecuritySitzung'
import { passkeysServerAktiviertLesen } from '@/lib/auth/account-security-passkeys-lesen'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sicherheit',
  description: 'Passwort und Zwei-Faktor-Anmeldung für deinen Jetnity-Account.',
  robots: { index: false, follow: false },
}

export default function SecurityPage() {
  const passkeysServerAktiviert = passkeysServerAktiviertLesen()

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Einstellungen</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          Sicherheit
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">
          {passkeysServerAktiviert
            ? 'Ändere dein Passwort, prüfe diese Sitzung oder richte eine Authenticator-App ein, um dein Konto besser zu schützen.'
            : 'Ändere dein Passwort, prüfe diese Sitzung oder richte eine Authenticator-App ein, um dein Konto besser zu schützen. Passkeys sind in der Anmeldung derzeit nicht unterstützt.'}
        </p>

        <div className="mt-10 space-y-6">
          <SecurityPasswort />
          <SecuritySitzung />
          <SecurityLogout />
          <Suspense
            fallback={
              <div className="rounded-[26px] border border-black/5 bg-white p-6">
                <div className="mb-4 h-4 w-40 rounded bg-surface-100" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-surface-100" />
                  <div className="h-3 w-2/3 rounded bg-surface-100" />
                  <div className="mt-4 h-10 w-48 rounded-full bg-surface-100" />
                </div>
              </div>
            }
          >
            <SecurityMFA passkeysServerAktiviert={passkeysServerAktiviert} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
