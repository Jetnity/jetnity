// app/account/settings/page.tsx
//
// Einstellungen: kompakter Hub. Sicherheit, vorhandener JSON-Export und die
// V1-Kontolöschung. Die Löschoberfläche bleibt hinter derselben Umgebungsschranke.

import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, Shield } from 'lucide-react'

import KontoLoeschen from '@/components/account/KontoLoeschen'
import { SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'
import { loeschUmgebungErlaubt } from '@/lib/account/kontoloeschung-vertrag'

export const metadata: Metadata = {
  title: 'Einstellungen',
  description: 'Kontoeinstellungen von Jetnity.',
  robots: { index: false, follow: false },
}

export default function AccountEinstellungenSeite() {
  // Sichtbarkeit kommt aus der konfigurierten Supabase-Projekt-URL, nicht aus
  // dem Host der Anfrage. Exaktes Production-HTTPS ist eine erlaubte Umgebung.
  const loeschungAngeboten = loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const loeschBereich = loeschungAngeboten ? <KontoLoeschen /> : null
  return (
    <main data-einstellungen-hub="" className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Konto</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-4xl">
            Einstellungen
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">
            Hier verwaltest du die vorhandenen Kontoeinstellungen. Weitere Bereiche folgen, sobald sie
            fachlich bereit sind.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Link
            href="/account/security"
            className="flex min-h-11 items-start gap-4 rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_16px_50px_rgba(15,46,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,42,0.11)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
              <Shield className="h-5 w-5" aria-hidden="true" />
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
            className="rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_16px_50px_rgba(15,46,42,0.06)]"
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
                  className={`${SICHERHEIT_ZIEL_44} mt-4 inline-flex items-center rounded-2xl bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
                >
                  Konto- und Reisedaten als JSON herunterladen
                </a>
              </div>
            </div>
          </section>
        </div>

        {loeschBereich ? (
          <div className="mt-8 border-t border-red-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-800">Gefahrenbereich</p>
            <div className="mt-3">{loeschBereich}</div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
