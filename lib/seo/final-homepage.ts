// Customer-facing homepage content and matching entity data.
// Crawl/index permission remains in the existing global launch gate.
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

export const FINAL_HOMEPAGE_H1 = 'Deine ganze Reise. Intelligent an einem Ort.'

/** Rendered in the hero and reused verbatim in the entity description. */
export const FINAL_HOMEPAGE_DEFINITION =
  'Jetnity ist deine intelligente Reiseplattform. Sie verbindet deine Wünsche mit einer durchdachten Reise, prüft Verbindungen und persönliche Einreiseanforderungen und begleitet dich bei Veränderungen unterwegs.'

export const FINAL_HOMEPAGE_DESCRIPTION =
  'Deine ganze Reise mit Jetnity: passende Routen, persönliche Einreisevorbereitung und ein Reiseplan, der sich bei Flugänderungen automatisch anpasst.'

export const HOMEPAGE_UEBERSCHRIFTEN = {
  werkzeuge: 'Eine Reise statt fünf getrennte Tools.',
  produktfenster: 'Dein Flug ändert sich. Jetnity denkt die Reise weiter.',
  begleitung: 'Du beschreibst deine Wünsche. Jetnity bringt alles zusammen.',
  unterschied: 'Jetnity sieht, was zusammengehört.',
  inspiration: 'Wohin es dich zieht, ist persönlich.',
  vertrauen: 'Deine Reise. Deine Entscheidungen.',
  abschluss: 'Freu dich auf deine Reise. Jetnity denkt mit.',
} as const

export const HOMEPAGE_WERKZEUGE = [
  { titel: 'Reiseplan', text: 'Eine Route, in der alles zusammenpasst.' },
  { titel: 'Flüge', text: 'Verbindungen mit Blick auf die weitere Reise.' },
  { titel: 'Unterkunft', text: 'Die passende Lage für deine Pläne.' },
  { titel: 'Erlebnisse', text: 'Entdeckungen in deinem Tempo.' },
  { titel: 'Mobilität', text: 'Passende Wege von Station zu Station.' },
] as const

export const HOMEPAGE_SCHRITTE = [
  { titel: 'Wünsche nennen', text: 'Ein festes Ziel oder eine erste Idee: Beschreibe, was dir wichtig ist, wann du reisen möchtest und welches Budget du hast.' },
  { titel: 'Passenden Vorschlag erhalten', text: 'Jetnity verbindet Route, Aufenthalte und Erlebnisse und erklärt, warum die Empfehlungen zu dir passen.' },
  { titel: 'Begleitet reisen', text: 'Jetnity behält Vorbereitung und Veränderungen im Blick und zeigt dir den nächsten wichtigen Schritt.' },
] as const

export const HOMEPAGE_UNTERSCHIEDE = [
  {
    thema: 'Reiseprüfung',
    titel: 'Eine Route, die wirklich funktioniert.',
    text: 'Jetnity prüft Verbindungen, Wegezeiten und Übernachtungen gemeinsam. Zu knappe Umstiege, fehlende Nächte und Lücken werden früh sichtbar – mit passenden Lösungen.',
    beispiel: 'Die Fähre fährt zu früh nach deiner Landung?',
    ergebnis: 'Jetnity berücksichtigt den Weg vom Flughafen zum Hafen und findet eine sinnvollere Verbindung.',
  },
  {
    thema: 'Persönliche Einreisevorbereitung',
    titel: 'Gut vorbereitet. Mit deinem Reisepass.',
    text: 'Route, Transitländer, Staatsangehörigkeiten und Reisedokumente bestimmen, was du brauchst. Jetnity berücksichtigt jede mitreisende Person – auch mit mehreren Pässen.',
    beispiel: 'Welche Dokumente brauchst du für diese Route?',
    ergebnis: 'Du siehst Anforderungen mit offizieller Quelle, Informationsstand und Fristen. Jetnity erinnert dich, wenn du handeln musst.',
  },
  {
    thema: 'Gesamtkosten und Alternativen',
    titel: 'Die bessere Wahl für die ganze Reise.',
    text: 'Jetnity vergleicht Preis, Reisezeit und Komfort zusammen. Gepäck, Transfers und zusätzliche Übernachtungen fließen ein. Bestätigte Preise und Schätzungen bleiben erkennbar.',
    beispiel: 'Was wäre, wenn du eine Nacht länger bleibst?',
    ergebnis: 'Jetnity zeigt dir die Folgen für Kosten und Verbindungen. Dein bisheriger Plan bleibt erhalten, bis du die Änderung übernimmst.',
  },
] as const

export const HOMEPAGE_PRODUKTFENSTER = {
  titel: 'Dein Ankunftstag in Lissabon',
  meta: 'Zürich → Lissabon · 2 Reisende',
  kennzeichnung: 'Beispielreise',
  schritte: [
    {
      name: 'Dein Plan',
      titel: 'Alles beginnt mit deiner Vorfreude.',
      text: 'Ankommen, einchecken und die Stadt entdecken. Alle Teile gehören zu derselben Reise.',
      status: 'Ursprünglicher Plan',
      punkte: [
        { zeit: 'Vormittag', titel: 'Ankunft in Lissabon', text: 'Deine Reise beginnt am Flughafen.' },
        { zeit: 'Mittag', titel: 'Transfer und Hotel', text: 'Weiter zur Unterkunft, Zeit zum Ankommen.' },
        { zeit: 'Nachmittag', titel: 'Die Altstadt entdecken', text: 'Der erste Spaziergang durch Lissabon.' },
      ],
      naechsterSchritt: 'Alles an einem Ort: Anreise, Unterkunft und dein erster Tag.',
    },
    {
      name: 'Flugänderung',
      titel: 'Fünf Stunden später. Mehr als eine neue Flugzeit.',
      text: 'Jetnity erkennt die Verspätung und prüft, was sie für den restlichen Tag bedeutet.',
      status: 'Flug verspätet',
      punkte: [
        { zeit: 'Ankunft', titel: 'Dein Flug landet später', text: 'Die neue Ankunftszeit wird berücksichtigt.' },
        { zeit: 'Transfer', titel: 'Die Abholung passt nicht mehr', text: 'Verbindung und Hotelankunft müssen neu abgestimmt werden.' },
        { zeit: 'Erlebnis', titel: 'Zu wenig Zeit für die Altstadt', text: 'Der geplante Nachmittag ist nicht mehr erreichbar.' },
      ],
      naechsterSchritt: 'Jetnity betrachtet die Folgen für deinen gesamten Ankunftstag.',
    },
    {
      name: 'Jetnity passt an',
      titel: 'Dein Plan passt wieder zusammen.',
      text: 'Jetnity aktualisiert die Zeiten und ordnet den Tag neu. Nötige Buchungsänderungen legt es dir zur Entscheidung vor.',
      status: 'Plan angepasst',
      punkte: [
        { zeit: 'Ankunft', titel: 'Neue Ankunftszeit im Plan', text: 'Alle folgenden Wege berücksichtigen die spätere Landung.' },
        { zeit: 'Abend', titel: 'In Ruhe im Hotel ankommen', text: 'Eine passende Transferalternative liegt zur Auswahl bereit.' },
        { zeit: 'Morgen', titel: 'Die Altstadt mit Zeit erleben', text: 'Dein frei geplanter Spaziergang rückt auf den nächsten Tag.' },
      ],
      naechsterSchritt: 'Jetzt wichtig: Transferalternative bestätigen und die spätere Hotelankunft mitteilen.',
    },
  ],
} as const

export const HOMEPAGE_VERTRAUEN = [
  { titel: 'Du entscheidest', text: 'Jetnity denkt voraus. Wichtige Entscheidungen und Buchungen bleiben bei dir.' },
  { titel: 'Deine Reise bleibt privat', text: 'Persönliche Reisepläne und Reisedokumente sind kein öffentlicher Inhalt.' },
  { titel: 'Einfach beginnen', text: 'Starte ohne Konto. Mit einem Konto bleiben deine Reisen und Vorlieben für später verfügbar.' },
] as const

export const HOMEPAGE_FAQ = [
  { frage: 'Was ist Jetnity?', antwort: 'Jetnity ist eine intelligente Reiseplattform und dein persönlicher Reisebegleiter. Jetnity verbindet Route, Flüge, Unterkünfte, Erlebnisse und Mobilität, prüft die Zusammenhänge und begleitet dich von der ersten Idee bis zur Rückkehr. Deine Wünsche, die tatsächlichen Gesamtkosten und deine persönliche Vorbereitung werden gemeinsam berücksichtigt.' },
  { frage: 'Wie berücksichtigt Jetnity meine Einreiseanforderungen?', antwort: 'Jetnity berücksichtigt deine Route einschließlich Zwischenstopps sowie Staatsangehörigkeiten, Reisepässe, bestehende Visa und Aufenthaltsbewilligungen. Für jede mitreisende Person werden relevante Anforderungen anhand offizieller Quellen aufbereitet. Du siehst den Informationsstand, wichtige Fristen und deine nächsten Vorbereitungsschritte. Bei einer Routenänderung wird die Vorbereitung erneut geprüft.' },
  { frage: 'Was passiert bei einer Flugänderung oder einem Ausfall?', antwort: 'Jetnity erkennt die Änderung, prüft ihre Folgen für Anschlüsse, Transfers, Unterkunft und Erlebnisse und aktualisiert deinen Reiseplan automatisch. Bei einem Ausfall bereitet Jetnity passende Alternativen vor und erklärt die Folgen für Reisezeit und Kosten. Eine neue Verbindung kann auch andere Transit- und Einreiseanforderungen mit sich bringen; diese werden erneut berücksichtigt.' },
  { frage: 'Welche Entscheidungen trifft Jetnity automatisch?', antwort: 'Jetnity prüft deine Reise, aktualisiert Zeiten und stimmt den Reiseplan innerhalb deiner Freigaben neu ab. Neue Buchungen, kostenpflichtige Umbuchungen und Stornierungen bestätigst du selbst. Wo eine Buchung beim jeweiligen Anbieter abgeschlossen wird, führt Jetnity dich dorthin. Ein angepasster Planeintrag allein ist noch keine Buchung oder Umbuchung.' },
] as const

const VERBOTENE_JSON_LD_SCHLUESSEL = [
  'sameAs',
  'aggregateRating',
  'review',
  'reviewCount',
  'offers',
  'award',
  'price',
  'priceRange',
] as const

export function finalHomepageSeitenUrl(): string {
  return kanonischeUrl('/')
}

export function finalHomepageMetadaten(url: string) {
  if (url !== finalHomepageSeitenUrl()) {
    throw new Error('Homepage-Metadaten akzeptieren nur die kanonische Startseiten-URL.')
  }
  return {
    title: 'Intelligente Reiseplattform und persönlicher Reisebegleiter',
    description: FINAL_HOMEPAGE_DESCRIPTION,
    canonical: url,
    openGraph: {
      type: 'website' as const,
      siteName: 'Jetnity',
      locale: 'de_CH',
      title: FINAL_HOMEPAGE_H1,
      description: FINAL_HOMEPAGE_DESCRIPTION,
      url,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: FINAL_HOMEPAGE_H1,
      description: FINAL_HOMEPAGE_DESCRIPTION,
    },
  }
}

export function finalHomepageJsonLd(eingabe: { url: string }) {
  if (eingabe.url !== finalHomepageSeitenUrl()) {
    throw new Error('Homepage-JSON-LD akzeptiert nur die kanonische Startseiten-URL.')
  }
  const url = eingabe.url
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: 'Jetnity',
        url,
        description: FINAL_HOMEPAGE_DEFINITION,
        email: 'info@jetnity.ch',
        logo: new URL('/brand/jetnity-logo.png', url).href,
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: 'Jetnity',
        url,
        inLanguage: 'de',
        description: FINAL_HOMEPAGE_DEFINITION,
        publisher: { '@id': `${url}#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}#application`,
        name: 'Jetnity',
        url,
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Web',
        image: new URL('/images/hero-bali.png', url).href,
        description: FINAL_HOMEPAGE_DEFINITION,
        publisher: { '@id': `${url}#organization` },
      },
    ],
  }
  const roh = JSON.stringify(graph)
  for (const schluessel of VERBOTENE_JSON_LD_SCHLUESSEL) {
    if (roh.includes(`"${schluessel}"`)) {
      throw new Error(`Homepage-JSON-LD enthält den verbotenen Schlüssel ${schluessel}.`)
    }
  }
  return graph
}
