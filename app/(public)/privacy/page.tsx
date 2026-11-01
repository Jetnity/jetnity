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
        <section aria-label="DiscoverCars" className="mt-10 border-t border-line-200 pt-6 text-sm leading-6 text-ink-800">
          <h2 className="text-lg font-semibold text-brand-800">Mietwagensuche mit DiscoverCars</h2>
          <p className="mt-3">
            Das offizielle Suchformular von DiscoverCars wird erst geladen, wenn du „Suchformular laden“ wählst.
            Es läuft auf der Anbieter-Domain in einem getrennten Rahmen. Dabei erhält DiscoverCars Verbindungsdaten wie die IP-Adresse,
            die öffentliche Herkunftsadresse von Jetnity, die Partnerkennung sowie Deutsch und CHF als Anzeigeeinstellungen.
            DiscoverCars kann Cookies oder ähnliche Technologien einsetzen. Gespeicherte Reiseinhalte, Reise-IDs und Teilnehmerangaben
            übermittelt Jetnity dafür nicht. Angaben im Formular gibst du direkt bei DiscoverCars ein.
            Fahrzeugangebote, Mietbedingungen, Buchung und Bezahlung öffnen bei DiscoverCars.
          </p>
          <p className="mt-3">
            Ausblenden, Reisewechsel oder Verlassen des Mietwagenbereichs beendet die Einbindung. Bereits erfolgte Übertragungen werden
            dadurch nicht rückgängig gemacht. Vorhandene Ablehnungen oder Widerrufe in den Datenschutzeinstellungen werden respektiert.
            Die Anzeigeentscheidung wird nicht für andere Reisen oder spätere Besuche gespeichert. Bei einer vermittelten Buchung kann Jetnity eine Provision erhalten.
          </p>
          <p className="mt-3">
            <a href="https://www.discovercars.com/de/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4">Datenschutzhinweise von DiscoverCars</a>
          </p>
        </section>
        <section aria-label="Aktivitätenangebote" className="mt-10 border-t border-line-200 pt-6 text-sm leading-6 text-ink-800">
          <h2 className="text-lg font-semibold text-brand-800">Externe Aktivitätenangebote</h2>
          <p className="mt-3">
            Jetnity kann offizielle Widgets von Viator und GetYourGuide für das bestätigte Reiseziel anzeigen.
            Beim Öffnen des Aktivitätenbereichs werden Angebote zum ausgewählten Ziel automatisch geladen, sofern sie nicht ausgeblendet sind.
            Das Öffnen einer Reise oder der Aktivitäten gilt nicht als Datenschutzeinwilligung. Bereits über die Datenschutzeinstellungen erfasste Ablehnungen oder Widerrufe verhindern das weitere Laden.
            Beim Laden erhalten die Anbieter technisch notwendige Verbindungsdaten, beispielsweise die IP-Adresse.
            Ausblenden beendet die weitere Einbindung, macht bereits erfolgte Übertragungen aber nicht rückgängig.
            Die Anzeigepräferenz „Ausblenden“ wird für die aktuelle Browsersitzung gespeichert und erteilt keine Zustimmung.
          </p>
        </section>
        <section aria-label="Viator" className="mt-10 border-t border-line-200 pt-6 text-sm leading-6 text-ink-800">
          <h2 className="text-lg font-semibold text-brand-800">Viator</h2>
          <p className="mt-3">
            Das Viator-Widget wird in einem getrennten Rahmen geladen. Jetnity übergibt den bestätigten öffentlichen Zielnamen sowie Deutsch und CHF als Anzeigeeinstellungen.
            Private Reisebezeichnungen, Reisedaten und Teilnehmerangaben werden dafür nicht übergeben. Buchung und Bezahlung erfolgen bei Viator.
          </p>
          <p className="mt-3">
            <a href="https://www.viator.com/support/privacyPolicy" target="_blank" rel="noopener noreferrer"
              className="font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4">Datenschutzhinweise von Viator</a>
          </p>
        </section>
        <section aria-label="GetYourGuide" className="mt-10 border-t border-line-200 pt-6 text-sm leading-6 text-ink-800">
          <h2 className="text-lg font-semibold text-brand-800">GetYourGuide</h2>
          <p className="mt-3">
            Jetnity lädt das offizielle Aktivitäten-Widget und den Integration Analyzer von GetYourGuide in einem getrennten Rahmen. Der Analyzer dient GetYourGuide zur Auswertung der Einbindung und ihrer Nutzung. Dabei entsteht eine Verbindung zu GetYourGuide. Jetnity übergibt dafür den bestätigten öffentlichen Ortsnamen und das Land, keine privaten Reisedaten. Buchung und Bezahlung erfolgen bei GetYourGuide.
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
