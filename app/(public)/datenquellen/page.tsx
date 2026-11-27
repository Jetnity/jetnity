import type { Metadata } from 'next'
import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'
import {
  BILDNACHWEISE,
  datumDeutsch,
  FREIGEGEBENE_ILLUSTRATIONEN,
  ILLUSTRATIONSHINWEIS,
  KI_ILLUSTRATIONEN,
  KI_URHEBER,
  KI_VORSCHAUBILD,
} from '@/lib/trips/organisieren/bildnachweise'

const LINK_KLASSE =
  'font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export const metadata: Metadata = {
  title: 'Datenquellen & Lizenzen',
  description: 'Quellen und Lizenzhinweise zu den Ortsdaten, Reisefotografien und KI-Illustrationen von Jetnity.',
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
        </section>
        <section aria-labelledby="bildnachweise-title" className="space-y-4 rounded-card border border-border bg-card p-5 text-body text-muted-foreground shadow-card sm:p-6">
          <h2 id="bildnachweise-title" className="text-title text-foreground">Bildnachweise</h2>
          <p>
            Diese Reisebilder liefert Jetnity selbst mit. Dieselben Angaben stehen in der Reise hinter dem
            kleinen Symbol ⓘ am Foto im Reisekopf.
          </p>
          <ul className="space-y-3 text-meta">
            {BILDNACHWEISE.map((nachweis) => (
              <li key={nachweis.datei} className="space-y-0.5">
                <p className="font-medium text-foreground">«{nachweis.bildtitel}»</p>
                <p>
                  {nachweis.urheber ?? 'Urheber nicht angegeben'}
                  {' · '}
                  {nachweis.lizenzUrl ? (
                    <a href={nachweis.lizenzUrl} className={LINK_KLASSE}>{nachweis.lizenz}</a>
                  ) : nachweis.lizenz}
                  {' · '}
                  <a href={nachweis.quelleUrl} className={LINK_KLASSE}>Original ansehen</a>
                </p>
                <p>{nachweis.bearbeitung}</p>
              </li>
            ))}
          </ul>
          <p>
            Dieselben Angaben stehen auch als{' '}
            <a href="/images/organisieren/Bildnachweise.txt" className={LINK_KLASSE}>Textdatei</a>.
          </p>
        </section>
        <section id="ki-illustrationen" aria-labelledby="ki-illustrationen-title" className="space-y-4 rounded-card border border-border bg-card p-5 text-body text-muted-foreground shadow-card sm:p-6">
          <h2 id="ki-illustrationen-title" className="text-title text-foreground">KI-Illustrationen (keine Fotos)</h2>
          <p>
            Einige Motive auf der Startseite und bei den Reiseideen sind mit KI erzeugte Illustrationen. Sie sind keine
            Fotos und zeigen keine echte Aufnahme des genannten Ortes. Am Bild stehen sie als «{ILLUSTRATIONSHINWEIS}».
          </p>
          <p>
            Herkunft: {KI_URHEBER}. Quelle dieser Angabe ist die Erklärung des Product Owners; Prompts,
            Generierungs-Kennungen und Original-Adressen sind nicht erfasst. Es gilt keine Creative-Commons-Lizenz.
          </p>
          <p>
            Grundlage sind die Nutzungsbedingungen von OpenAI, Abschnitt «Ownership of content»:{' '}
            <a href={KI_ILLUSTRATIONEN[0]!.herkunft.bedingungen.archiv} className={LINK_KLASSE}>Archivfassung vom 11.12.2024</a>
            {' und '}
            <a href={KI_ILLUSTRATIONEN[0]!.herkunft.bedingungen.aktuell} className={LINK_KLASSE}>aktuelle Fassung (Stand 16.01.2026)</a>.
            Danach gehört das Ergebnis im Verhältnis zu OpenAI und soweit gesetzlich zulässig der nutzenden Person. Eine
            Garantie für exklusive Rechte oder für die Freiheit von Rechten Dritter gibt es nicht.
          </p>
          <ul className="space-y-3 text-meta">
            {[...KI_ILLUSTRATIONEN, KI_VORSCHAUBILD].map((nachweis) => (
              <li key={nachweis.datei} className="space-y-0.5" data-illustration={nachweis.datei}>
                <p className="font-medium text-foreground">{nachweis.bildtitel}</p>
                <p>
                  {nachweis.datei} · {nachweis.urheber}
                </p>
                {nachweis.herkunft.ableitung ? (
                  <>
                    <p>
                      Abgeleitet aus {nachweis.herkunft.ableitung.quelle} (SHA-256 {nachweis.herkunft.ableitung.quelleSha256.slice(0, 12)}…), kein neues Original.{' '}
                      {nachweis.bearbeitung}
                    </p>
                    <p>
                      {nachweis.herkunft.ableitung.breite} × {nachweis.herkunft.ableitung.hoehe} px, {nachweis.herkunft.ableitung.mime}, {nachweis.herkunft.ableitung.bytes} Bytes.
                    </p>
                  </>
                ) : (
                  <p>
                    Ersteintrag im Repository {datumDeutsch(nachweis.herkunft.ersteintrag.datum)} (Commit{' '}
                    {nachweis.herkunft.ersteintrag.commit.slice(0, 9)}), kein verifiziertes Erstellungsdatum.
                  </p>
                )}
                <p className="break-all">SHA-256: {nachweis.herkunft.sha256}</p>
                {nachweis.herkunft.fruehererPfad ? (
                  <p>
                    Früherer Dateiname: {nachweis.herkunft.fruehererPfad}. Die Datei enthält PNG-Daten; nur die Endung wurde korrigiert (byteidentisch, gleiche Prüfsumme).
                  </p>
                ) : null}
                {nachweis.herkunft.ableitung ? <p>{nachweis.herkunft.binaerhinweis}</p> : null}
                {FREIGEGEBENE_ILLUSTRATIONEN.includes(nachweis.datei) ? null : <p>Derzeit nicht im Einsatz: Die Freigabe steht aus.</p>}
              </li>
            ))}
          </ul>
          <p>{KI_ILLUSTRATIONEN[0]!.herkunft.binaerhinweis}</p>
        </section>
      </article>
    </main>
  )
}
