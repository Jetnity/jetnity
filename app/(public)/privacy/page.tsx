import type { Metadata } from 'next'
import { headers } from 'next/headers'

import PrivacyBeeEinbettung from '@/components/legal/PrivacyBeeEinbettung'
import {
  PRIVACYBEE_KILL_SWITCH_ENV,
  privacyBeeEinbettungErlaubt,
} from '@/lib/legal/privacybee-vertrag'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung für jetnity.com, bereitgestellt von PrivacyBee.',
  alternates: { canonical: `${KANONISCHE_PUBLIC_ORIGIN}/privacy` },
  robots: { index: false, follow: false },
}

export default async function PrivacyPage() {
  const kopf = await headers()
  const einbetten = privacyBeeEinbettungErlaubt({
    hostHeader: kopf.get('host'),
    killSwitch: process.env[PRIVACYBEE_KILL_SWITCH_ENV],
  })

  return (
    <main className="bg-surface-75 text-brand-800">
      <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <PrivacyBeeEinbettung flaeche="datenschutz" einbetten={einbetten} />
        <section aria-label="GetYourGuide" className="mt-10 border-t border-line-200 pt-6 text-sm leading-6 text-ink-800">
          <h2 className="text-lg font-semibold text-brand-800">GetYourGuide</h2>
          <p className="mt-3">
            Wenn du in einer Reise GetYourGuide ausdrücklich anzeigen lässt, lädt Jetnity das offizielle Aktivitäten-Widget und den Integration Analyzer von GetYourGuide in einem getrennten Rahmen. Dabei entsteht eine Verbindung zu GetYourGuide. Jetnity übergibt dafür den bestätigten öffentlichen Ortsnamen und das Land, keine privaten Reisedaten. Entfernen beendet die weitere Einbindung und löscht keine bereits gesendeten Anfragen.
          </p>
          <p className="mt-3">
            <a
              href="https://www.getyourguide.com/c/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4"
            >
              Datenschutzhinweise von GetYourGuide
            </a>
          </p>
        </section>
      </article>
    </main>
  )
}
