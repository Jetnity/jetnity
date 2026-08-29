// app/account/settings/page.tsx
//
// Einstellungen in AP-1: vorhandene Sicherheit auffindbar machen.
// Keine Privacy-/Billing-/MFA-Vertragsänderung.

import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Einstellungen',
  description: 'Kontoeinstellungen von Jetnity.',
  robots: { index: false, follow: false },
}

export default function AccountEinstellungenSeite() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Konto</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          Einstellungen
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">
          Hier verwaltest du die vorhandenen Kontoeinstellungen. Weitere Bereiche folgen, sobald sie
          fachlich bereit sind.
        </p>

        <Link
          href="/account/security"
          className="mt-10 flex min-h-[5.5rem] items-start gap-4 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,42,0.11)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
            <Shield className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold tracking-[-0.03em] text-brand-800">Sicherheit</span>
            <span className="mt-1 block text-sm leading-6 text-ink-700">
              Passwort, aktuelle Sitzung, Abmelden und Zwei-Faktor-Anmeldung für dein Konto prüfen
              oder ändern.
            </span>
          </span>
        </Link>
      </div>
    </main>
  )
}
