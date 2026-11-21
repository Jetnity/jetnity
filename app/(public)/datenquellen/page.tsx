import type { Metadata } from 'next'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const metadata: Metadata = {
  title: 'Datenquellen & Lizenzen',
  description: 'Quellen und Lizenzhinweise zu den Ortsdaten und Reisefotografien von Jetnity.',
  alternates: { canonical: `${KANONISCHE_PUBLIC_ORIGIN}/datenquellen` },
}

export default function DatenquellenPage() {
  return (
    <main className="px-5 text-foreground sm:px-8">
      <article className="mx-auto w-full max-w-prose space-y-8 py-12 text-body sm:py-16">
        <header>
          <p className="text-kicker uppercase text-muted-foreground">Rechtliches</p>
          <h1 className="mt-1 text-display text-foreground">Datenquellen &amp; Lizenzen</h1>
        </header>
        <section aria-labelledby="geonames-title" className="space-y-4 rounded-card border border-border bg-card p-5 text-body text-muted-foreground shadow-card sm:p-6">
          <h2 id="geonames-title" className="text-title text-foreground">Ortsdaten: GeoNames</h2>
          <p>
            Jetnity verwendet geografische Daten von{' '}
            <a href="https://www.geonames.org/" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">GeoNames</a>.
            Diese stehen unter der Lizenz{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            <a href="https://www.geonames.org/about.html" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">GeoNames</a>
            {' '}und im{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/legalcode.de" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Lizenztext</a>.
          </p>
        </section>
        <section aria-labelledby="reisefotos-title" className="space-y-4 rounded-card border border-border bg-card p-5 text-body text-muted-foreground shadow-card sm:p-6">
          <h2 id="reisefotos-title" className="text-title text-foreground">Reisefotografien</h2>
          <p>Für weitere eindeutig zugeordnete Ziele bezieht Jetnity automatisch Fotografien aus Wikimedia Commons. Die Zuordnung erfolgt über die GeoNames-Kennung und das Land in Wikidata. Urheber, Original und freie Lizenz werden unmittelbar bei der Reise genannt und verlinkt. Die Darstellung kann einen Bildausschnitt zeigen. Ohne eindeutige Zuordnung oder geeignete Lizenz bleibt ein neutrales Ersatzmotiv.</p>
          <p>
            Das Paris-Foto „Skyline of Paris with the Eiffel Tower 2“ stammt von{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Skyline_of_Paris_with_the_Eiffel_Tower_2.jpg" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              DiscoA340 auf Wikimedia Commons
            </a>{' '}
            und steht unter{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">CC BY-SA 4.0</a>.
            Die Originaldatei bleibt unverändert; die Darstellung wird je nach Bildschirm zugeschnitten.
          </p>
          <p>
            Die einzelnen Quellen, Urheber und Lizenzen weiterer Reisemotive findest du in den{' '}
            <a href="/images/organisieren/Bildnachweise.txt" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Bildnachweisen</a>.
          </p>
        </section>
      </article>
    </main>
  )
}
