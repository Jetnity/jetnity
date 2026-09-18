// app/account/settings/page.tsx
//
// Einstellungen: vorhandene Sicherheit und den V1-Kontoexport auffindbar machen.
// Keine Privacy-/Billing-/MFA-/Lösch-Vertragsänderung.

import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, Shield } from 'lucide-react'

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

        <div className="mt-10 space-y-6">
          <Link
            href="/account/security"
            className="flex min-h-[5.5rem] items-start gap-4 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,42,0.11)]"
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

          <section
            aria-labelledby="account-datenexport-title"
            className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)]"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
                <Download className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id="account-datenexport-title"
                  className="text-lg font-semibold tracking-[-0.03em] text-brand-800"
                >
                  Datenexport
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-700">
                  Lädt die aktuell von Jetnity gespeicherten Konto- und Reisedaten dieses Kontos als
                  JSON-Datei herunter. Die Datei kann sensible Reise- und Reisendenangaben enthalten.
                  Bewahre sie sicher auf.
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  Der Download umfasst nur diesen Jetnity-eigenen Konto- und Reisestand. Er ist kein
                  vollständiger rechtlicher Datenauszug und keine Kontolöschung.
                </p>
                <a
                  href="/api/account/export"
                  className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                >
                  Konto- und Reisedaten als JSON herunterladen
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
