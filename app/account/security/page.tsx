// app/account/security/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import SecurityLogout from '@/components/account/SecurityLogout'
import SecurityMFA from '@/components/account/SecurityMFA'
import SecurityPasswort from '@/components/account/SecurityPasswort'
import SecuritySitzung from '@/components/account/SecuritySitzung'
import { SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'
import { passkeysServerAktiviertLesen } from '@/lib/auth/account-security-passkeys-lesen'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sicherheit',
  description: 'Passwort und Zwei-Faktor-Anmeldung für deinen Jetnity-Account.',
  robots: { index: false, follow: false },
}

const BEREICHE = [
  { href: '#account-passwort', titel: 'Passwort' },
  { href: '#account-sitzung', titel: 'Diese Sitzung' },
  { href: '#account-abmelden', titel: 'Abmelden' },
  { href: '#account-totp', titel: 'Authenticator' },
  { href: '#account-passkeys', titel: 'Passkeys' },
] as const

export default function SecurityPage() {
  const passkeysServerAktiviert = passkeysServerAktiviertLesen()

  return (
    <main data-sicherheit-hub="" className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Einstellungen</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-4xl">
            Sicherheit
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">
            {passkeysServerAktiviert
              ? 'Ändere dein Passwort, prüfe diese Sitzung oder richte eine Authenticator-App ein, um dein Konto besser zu schützen.'
              : 'Ändere dein Passwort, prüfe diese Sitzung oder richte eine Authenticator-App ein, um dein Konto besser zu schützen. Passkeys sind in der Anmeldung derzeit nicht unterstützt.'}
          </p>
        </header>

        <nav aria-label="Sicherheitsbereiche" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {BEREICHE.map((bereich) => (
              <li key={bereich.href}>
                <a
                  href={bereich.href}
                  className={`${SICHERHEIT_ZIEL_44} inline-flex max-w-full items-center rounded-full border border-black/10 bg-white px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
                >
                  {bereich.titel}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 space-y-4">
          <SecurityPasswort />
          <section aria-label="Sitzung und Abmelden" className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            <SecuritySitzung />
            <SecurityLogout />
          </section>
          <Suspense
            fallback={
              <div className="rounded-[26px] border border-black/5 bg-white p-4">
                <div className="mb-3 h-4 w-40 rounded bg-surface-100" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-surface-100" />
                  <div className="h-3 w-2/3 rounded bg-surface-100" />
                  <div className="mt-4 h-11 w-48 rounded-full bg-surface-100" />
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
