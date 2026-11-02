import type { Metadata } from 'next'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const metadata: Metadata = {
  title: 'Datenquellen & Lizenzen',
  description: 'Quellen und Lizenzhinweise zu den Ortsdaten von Jetnity.',
  alternates: { canonical: `${KANONISCHE_PUBLIC_ORIGIN}/datenquellen` },
}

export default function DatenquellenPage() {
  return (
    <main className="bg-surface-75 text-brand-800">
      <article className="mx-auto w-full max-w-3xl space-y-8 px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Datenquellen &amp; Lizenzen</h1>
        <section aria-labelledby="geonames-title" className="space-y-4 rounded-2xl border border-line-200 bg-white p-6">
          <h2 id="geonames-title" className="text-2xl font-semibold">Ortsdaten: GeoNames</h2>
          <p>
            Jetnity verwendet geografische Daten von{' '}
            <a href="https://www.geonames.org/" className="underline underline-offset-4">GeoNames</a>.
            Diese stehen unter der Lizenz{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="underline underline-offset-4">
              Creative Commons Namensnennung 4.0 International (CC BY 4.0)
            </a>.
          </p>
          <p>
            Für die Ortssuche bereitet Jetnity die Daten auf, vereinheitlicht
            Bezeichnungen und ergänzt Suchbegriffe sowie Zuordnungen.
            GeoNames unterstützt oder prüft Jetnity dadurch nicht.
          </p>
          <p>
            Die Daten werden ohne Gewähr bereitgestellt. Weitere Informationen
            findest du bei{' '}
            <a href="https://www.geonames.org/about.html" className="underline underline-offset-4">GeoNames</a>
            {' '}und im{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/legalcode.de" className="underline underline-offset-4">Lizenztext</a>.
          </p>
        </section>
      </article>
    </main>
  )
}
