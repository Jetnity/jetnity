// app/account/security/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import SecurityLogout from '@/components/account/SecurityLogout'
import SecurityMFA from '@/components/account/SecurityMFA'
import SecurityPasswort from '@/components/account/SecurityPasswort'
import SecuritySitzung from '@/components/account/SecuritySitzung'
import { SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'
import { passkeysServerAktiviertLesen } from '@/lib/auth/account-security-passkeys-lesen'
import { kontoAnzeigesprache } from '@/lib/localization/konto-anzeigesprache'
import { sicherheitText } from '@/lib/localization/account-security-texte'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const sprache = await kontoAnzeigesprache()
  return {
    title: sicherheitText(sprache, 'page.title'),
    description: sicherheitText(sprache, 'page.metadata'),
    robots: { index: false, follow: false },
  }
}

const BEREICHE = [
  { href: '#account-passwort', titel: 'password.title' },
  { href: '#account-sitzung', titel: 'session.title' },
  { href: '#account-abmelden', titel: 'logout.title' },
  { href: '#account-totp', titel: 'totp.navigation' },
  { href: '#account-passkeys', titel: 'passkey.title' },
] as const

export default async function SecurityPage() {
  const sprache = await kontoAnzeigesprache()
  const passkeysServerAktiviert = passkeysServerAktiviertLesen()

  return (
    <main lang={sprache} data-sicherheit-hub="" className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{sicherheitText(sprache, 'page.settings')}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-4xl">
            {sicherheitText(sprache, 'page.title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">
            {sicherheitText(sprache, 'page.intro')}
          </p>
        </header>

        <nav aria-label={sicherheitText(sprache, 'page.navigation')} className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {BEREICHE.map((bereich) => (
              <li key={bereich.href}>
                <a
                  href={bereich.href}
                  className={`${SICHERHEIT_ZIEL_44} inline-flex max-w-full items-center rounded-full border border-black/10 bg-white px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
                >
                  {sicherheitText(sprache, bereich.titel)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 space-y-4">
          <SecurityPasswort sprache={sprache} />
          <section aria-label={sicherheitText(sprache, 'page.sessionGroup')} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            <SecuritySitzung sprache={sprache} />
            <SecurityLogout sprache={sprache} />
          </section>
          <Suspense
            fallback={
              <div role="status" className="rounded-[26px] border border-black/5 bg-white p-4">
                <span className="sr-only">{sicherheitText(sprache, 'page.loading')}</span>
                <div className="mb-3 h-4 w-40 rounded bg-surface-100" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-surface-100" />
                  <div className="h-3 w-2/3 rounded bg-surface-100" />
                  <div className="mt-4 h-11 w-48 rounded-full bg-surface-100" />
                </div>
              </div>
            }
          >
            <SecurityMFA sprache={sprache} passkeysServerAktiviert={passkeysServerAktiviert} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
