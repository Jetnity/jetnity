// lib/seo/final-homepage.ts
//
// Vertrag der finalen Startseite: sichtbare Definition, Fähigkeitsstand und
// JSON-LD. Indexing bleibt am bestehenden fail-closed Gate. Keine sameAs,
// Bewertungen, Angebote, Nutzerzahlen oder Anbieterwahrheit.

import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

export const FINAL_HOMEPAGE_H1 = 'Deine ganze Reise. Intelligent an einem Ort.'

/** Sichtbare Definition. Dieselbe Zeichenkette steht in JSON-LD. */
export const FINAL_HOMEPAGE_DEFINITION =
  'Jetnity ist eine Reiseplanungs- und Reisebegleitungsplattform. Route, Planung und offene Schritte bleiben in einer Reise. Was nicht belegt ist, bleibt offen.'

export const FINAL_HOMEPAGE_DESCRIPTION = FINAL_HOMEPAGE_DEFINITION

export const HOMEPAGE_KENNZEICHNUNGEN = [
  'Heute nutzbar',
  'Soweit Daten vorliegen',
  'In Vorbereitung',
  'Kommt später',
  'Produktvorschau',
] as const

export type HomepageKennzeichnung = (typeof HOMEPAGE_KENNZEICHNUNGEN)[number]

export type HomepageFaehigkeitsstand = 'LIVE' | 'PARTIAL' | 'PLANNED'

export type HomepageFaehigkeit = {
  id: string
  stand: HomepageFaehigkeitsstand
  titel: string
  text: string
  kennzeichnung: HomepageKennzeichnung
}

/**
 * Inventar gegen main@91ab08bb9163444fcbce4a5303c1522c5ad5498c.
 * LIVE darf als verfügbar stehen. PARTIAL bleibt eng. PLANNED ist gekennzeichnet.
 * Unsicheres wurde herabgestuft.
 */
export const HOMEPAGE_FAEHIGKEITEN = [
  {
    id: 'ziel-bestaetigen',
    stand: 'LIVE',
    titel: 'Ziel bestätigen und Entwurf starten',
    text: 'Du bestätigst ein Ziel aus der Ortsliste und kannst ohne Konto einen Entwurf beginnen.',
    kennzeichnung: 'Heute nutzbar',
  },
  {
    id: 'mehrere-ziele',
    stand: 'LIVE',
    titel: 'Mehrere Ziele als eine Route',
    text: 'Mehrere bestätigte Ziele bleiben in deiner Reihenfolge. Jetnity erfindet daraus keinen Ort.',
    kennzeichnung: 'Heute nutzbar',
  },
  {
    id: 'reisebereich',
    stand: 'LIVE',
    titel: 'Eine Reise mit Übersicht und Tagesbezug',
    text: 'Übersicht, Tagesbezug und die Bereiche Flüge, Unterkunft, Aktivitäten und Mobilität gehören zu derselben Reise.',
    kennzeichnung: 'Heute nutzbar',
  },
  {
    id: 'offene-schritte',
    stand: 'PARTIAL',
    titel: 'Offene Schritte aus bekannten Angaben',
    text: 'Jetnity kann zeigen, was im vorhandenen Plan noch offen ist. Prüfungen, die externe Quellen brauchen, bleiben offen.',
    kennzeichnung: 'Soweit Daten vorliegen',
  },
  {
    id: 'live-angebote',
    stand: 'PLANNED',
    titel: 'Preise und Verfügbarkeit',
    text: 'Die Reisebereiche sind da. Echte Anbieterpreise und Verfügbarkeiten sind nicht freigeschaltet.',
    kennzeichnung: 'In Vorbereitung',
  },
  {
    id: 'amtliche-auskuenfte',
    stand: 'PLANNED',
    titel: 'Amtliche Einreise- und Sicherheitsauskünfte',
    text: 'Amtliche Angaben werden nicht als vorliegendes Ergebnis gezeigt.',
    kennzeichnung: 'In Vorbereitung',
  },
  {
    id: 'routenfolgen',
    stand: 'PLANNED',
    titel: 'Folgen einer Routenänderung',
    text: 'Dass eine Änderung andere Bereiche betreffen kann, ist hier eine Produktvorschau. Eine automatische Umsetzung mit Anbieterdaten ist nicht live.',
    kennzeichnung: 'Produktvorschau',
  },
  {
    id: 'gemeinsam-planen',
    stand: 'PLANNED',
    titel: 'Gemeinsam planen',
    text: 'Mehrere Personen planen eine Reise hier noch nicht gemeinsam.',
    kennzeichnung: 'Kommt später',
  },
  {
    id: 'jetnity-pro',
    stand: 'PLANNED',
    titel: 'Jetnity Pro',
    text: 'Live-Hinweise, Offline-Zugriff und Dokumentenerinnerungen sind nicht verfügbar.',
    kennzeichnung: 'Kommt später',
  },
] as const satisfies readonly HomepageFaehigkeit[]

export const HOMEPAGE_UEBERSCHRIFTEN = {
  werkzeuge: 'Eine Reise statt fünf getrennte Tools',
  produktfenster: 'So sieht eine Reise in Jetnity aus.',
  begleitung: 'So begleitet Jetnity deine Reise',
  unterschied: 'Warum Jetnity anders ist',
  inspiration: 'Eine Idee, dann ein bestätigtes Ziel.',
  vertrauen: 'Deine Reise. Deine Entscheidungen.',
  abschluss: 'Starte mit deinem eigenen Ziel.',
} as const

export const HOMEPAGE_WERKZEUGE = [
  {
    titel: 'Route und Tagesplan',
    text: 'Bestätigte Ziele werden zu einer Reise mit Tagesbezug.',
    kennzeichnung: 'Heute nutzbar',
  },
  {
    titel: 'Flüge',
    text: 'Der Flugbereich gehört zur Reise. Anbieterpreise und Verfügbarkeit sind in Vorbereitung.',
    kennzeichnung: 'Soweit Daten vorliegen',
  },
  {
    titel: 'Unterkunft',
    text: 'Die Unterkunft bleibt im Zusammenhang der Reise. Konkrete Angebote sind in Vorbereitung.',
    kennzeichnung: 'Soweit Daten vorliegen',
  },
  {
    titel: 'Aktivitäten',
    text: 'Aktivitäten lassen sich der Reise zuordnen. Live-Suche mit Anbietern ist in Vorbereitung.',
    kennzeichnung: 'Soweit Daten vorliegen',
  },
  {
    titel: 'Mobilität',
    text: 'Wege zwischen Orten gehören zur selben Reise. Live-Verbindungen sind in Vorbereitung.',
    kennzeichnung: 'Soweit Daten vorliegen',
  },
] as const satisfies readonly {
  titel: string
  text: string
  kennzeichnung: HomepageKennzeichnung
}[]

export const HOMEPAGE_SCHRITTE = [
  {
    titel: 'Beschreiben',
    text: 'Sag Jetnity, wohin du möchtest und was dir wichtig ist. Ein Ort gilt erst nach deiner Bestätigung.',
  },
  {
    titel: 'Organisieren',
    text: 'Route, Tagesplan, Flüge, Unterkunft und weitere Bereiche bleiben an derselben Reise. Live-Angebote sind in Vorbereitung.',
  },
  {
    titel: 'Begleiten lassen',
    text: 'Jetnity zeigt offene Schritte aus dem, was zur Reise schon bekannt ist. Live-Hinweise und amtliche Auskünfte kommen später.',
  },
] as const

export const HOMEPAGE_UNTERSCHIEDE = [
  {
    titel: 'Reisekontext statt Einzelsuche',
    text: 'Ein Flug oder eine Unterkunft gehört in Jetnity zur selben Reise. Die Bereiche liegen nicht als getrennte Suchen nebeneinander.',
  },
  {
    titel: 'Wahrheit statt geratenen Antworten',
    text: 'Unbekannt bleibt unbekannt. Geplant bleibt geplant. Amtliche Angaben, Anbieterfakten, Vorschläge von Jetnity und dein Plan bleiben getrennt.',
  },
  {
    titel: 'Nächster sinnvoller Schritt statt Informationsflut',
    text: 'Jetnity stellt nach vorn, was im vorhandenen Plan Aufmerksamkeit braucht, statt endlose Optionen zu zeigen.',
  },
] as const

export const HOMEPAGE_PRODUKTFENSTER = {
  kennzeichnung: 'Produktvorschau',
  titel: 'Lissabon und Porto',
  meta: '8 Tage · beispielhafter Entwurf',
  jetztWichtig: 'Die Unterkunft in Porto ist noch offen.',
  hinweis: 'Beispiel aus einem Reiseplan. Kein Preis und keine Verfügbarkeit.',
  naechsterSchritt: 'Eigenes Ziel bestätigen',
  zeilen: [
    { label: 'Route', wert: 'Lissabon, dann Porto', kennzeichnung: 'Produktvorschau' },
    { label: 'Tagesplan', wert: 'Noch ein Entwurf', kennzeichnung: 'Produktvorschau' },
    { label: 'Flüge', wert: 'Keine Angebote', kennzeichnung: 'In Vorbereitung' },
    { label: 'Unterkunft', wert: 'Offen, ohne Angebote', kennzeichnung: 'In Vorbereitung' },
    { label: 'Aktivitäten', wert: 'Noch nicht belegt', kennzeichnung: 'In Vorbereitung' },
    { label: 'Mobilität', wert: 'Noch nicht belegt', kennzeichnung: 'In Vorbereitung' },
  ],
} as const

export const HOMEPAGE_VERTRAUEN = [
  'Jetnity trifft keine wichtige Reiseentscheidung still für dich.',
  'Anbieterpreise, Verfügbarkeit und Buchungen werden hier nicht erfunden.',
  'Amtliche Angaben, Anbieterfakten, Vorschläge von Jetnity und dein eigener Plan bleiben getrennt.',
  'Sensible Reisedaten sind kein Werbeinhalt. Private Reisen sind keine öffentlichen Seiten.',
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
    title: FINAL_HOMEPAGE_H1,
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
