// Customer-facing homepage content and matching entity data.
// Crawl/index permission remains in the existing global launch gate.
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

export const FINAL_HOMEPAGE_H1 = 'Deine ganze Reise. Intelligent an einem Ort.'

/** Rendered in the hero and reused verbatim in the entity description. */
export const FINAL_HOMEPAGE_DEFINITION =
  'Jetnity ist dein Reiseplaner und Reisebegleiter. Plane deine Route, organisiere Flüge, Unterkünfte und Erlebnisse und behalte deine ganze Reise im Blick.'

export const FINAL_HOMEPAGE_DESCRIPTION =
  'Plane deine Reise mit Jetnity: Reiseziele, Route, Tagesplan, Flüge, Unterkünfte und Aktivitäten an einem Ort. Starte deinen Reiseplan ohne Konto.'

export const HOMEPAGE_UEBERSCHRIFTEN = {
  werkzeuge: 'Alles für deine Reise. Ein gemeinsamer Plan.',
  produktfenster: 'Aus Vorfreude wird dein Reiseplan.',
  begleitung: 'Deine nächste Reise beginnt ganz einfach.',
  unterschied: 'Mehr erleben. Weniger organisieren.',
  inspiration: 'Wohin zieht es dich als Nächstes?',
  vertrauen: 'Deine Reise. Deine Entscheidungen.',
  abschluss: 'Die Welt wartet. Dein Plan beginnt hier.',
} as const

export const HOMEPAGE_WERKZEUGE = [
  { titel: 'Reiseplan', text: 'Ziele verbinden, Tage gestalten und deine Route im Blick behalten.' },
  { titel: 'Flüge', text: 'Hinflug, Rückflug und weitere Flüge deiner Reise zuordnen.' },
  { titel: 'Unterkunft', text: 'Deine Übernachtungen passend zu Orten und Reisetagen organisieren.' },
  { titel: 'Aktivitäten', text: 'Erlebnisse entdecken und deinen Tagen das Besondere geben.' },
  { titel: 'Mobilität', text: 'Zug, Bus, Fähre, Transfer und Mietwagen in deine Reise einordnen.' },
] as const

export const HOMEPAGE_SCHRITTE = [
  { titel: 'Wähle deine Ziele', text: 'Ein Wochenende in einer Stadt oder mehrere Stopps auf einer Rundreise: Starte mit den Orten, die du entdecken möchtest.' },
  { titel: 'Mach den Plan zu deinem', text: 'Lege Reisedaten, Reisende und Budget fest. Ordne deine Route und fülle deine Tage mit dem, was dir wichtig ist.' },
  { titel: 'Behalte alles im Blick', text: 'Dein Tagesplan, die Organisation und deine Vorbereitung bleiben zusammen. So findest du auch unterwegs schnell zurück zu deiner Reise.' },
] as const

export const HOMEPAGE_UNTERSCHIEDE = [
  { titel: 'Ein Ort für das große Ganze', text: 'Von der ersten Idee bis zum letzten Reisetag: Deine Route, Übernachtungen und Erlebnisse gehören zusammen. Mit Jetnity findest du sie in deiner Reise wieder.' },
  { titel: 'Ein Plan, der zu dir passt', text: 'Du bestimmst die Ziele, das Tempo und die Reihenfolge. Ergänze eigene Ideen und ändere deinen Plan, wenn sich deine Wünsche ändern.' },
  { titel: 'Klarheit für den nächsten Schritt', text: 'Sieh, welche Flüge, Übernachtungen und Aktivitäten du bereits eingeplant hast und wo du noch etwas ergänzen möchtest.' },
] as const

export const HOMEPAGE_PRODUKTFENSTER = {
  titel: 'Lissabon und Porto',
  meta: 'Portugal · 8 Tage · 2 Reiseziele',
  kennzeichnung: 'Beispielreise',
  route: [
    { ort: 'Lissabon', text: 'Tag 1–4 · Gassen, Aussicht und Atlantik' },
    { ort: 'Porto', text: 'Tag 5–8 · Altstadt und Zeit am Douro' },
  ],
  tag: 'Ein Tag in Lissabon',
  tagesplan: [
    { zeit: 'Vormittag', titel: 'Durch Alfama schlendern', text: 'Zeit für kleine Gassen und einen Kaffee.', art: 'Entdecken' },
    { zeit: 'Nachmittag', titel: 'Lissabon von oben sehen', text: 'Einen Aussichtspunkt in den Tag einplanen.', art: 'Erleben' },
    { zeit: 'Abend', titel: 'Den Tag am Tejo ausklingen lassen', text: 'Freiraum für das, worauf du Lust hast.', art: 'Genießen' },
  ],
  modi: ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'],
} as const

export const HOMEPAGE_VERTRAUEN = [
  { titel: 'Du behältst die Kontrolle', text: 'Du entscheidest, was in deinen Plan kommt und was du buchst.' },
  { titel: 'Deine Reise bleibt privat', text: 'Persönliche Reisepläne sind kein öffentlicher Inhalt.' },
  { titel: 'Einfach ausprobieren', text: 'Beginne deinen Reiseplan ohne Konto. Mit einem Konto kannst du ihn dauerhaft speichern.' },
] as const

export const HOMEPAGE_FAQ = [
  { frage: 'Was ist Jetnity?', antwort: 'Jetnity ist ein Reiseplaner und Reisebegleiter für individuelle Reisen. Du verbindest Reiseziele zu einer Route, gestaltest deinen Tagesplan und organisierst Flüge, Unterkünfte, Aktivitäten und Mobilität in derselben Reise.' },
  { frage: 'Kann ich meine Reise ohne Konto planen?', antwort: 'Ja. Du kannst ohne Anmeldung mit deinem Reiseziel beginnen und einen Reiseplan erstellen. Dein Gastentwurf bleibt in diesem Browser. Für dauerhaftes Speichern in deinem Konto und den Zugriff auf anderen Geräten meldest du dich an.' },
  { frage: 'Kann ich mehrere Reiseziele verbinden?', antwort: 'Ja. Wähle mehrere Orte aus und ordne sie in der gewünschten Reihenfolge. So planst du auch Rundreisen und Reisen mit mehreren Stopps. Die Ziele bleiben mit deinem Reiseplan verbunden.' },
  { frage: 'Wie buche ich Flüge, Unterkünfte oder Aktivitäten?', antwort: 'Jetnity hilft dir, deine Reise zu planen und passende Reiseleistungen zu organisieren. Wo eine Partnersuche angeboten wird, öffnest du die Angebote beim jeweiligen Anbieter und schließt die Buchung dort ab. Dort prüfst du auch den aktuellen Preis, die Verfügbarkeit und die Buchungsbedingungen. Ein Eintrag in deinem Reiseplan ist noch keine Buchung.' },
  { frage: 'Für welche Reisen eignet sich Jetnity?', antwort: 'Für Städtetrips, Rundreisen, Urlaub mit mehreren Stopps und individuell geplante Reisen weltweit. Du legst Ziele, Reisedaten, Reisende und Budget fest und gestaltest die Reise nach deinen Vorstellungen.' },
  { frage: 'Wie finanziert sich Jetnity?', antwort: 'Wenn du über einen Partnerlink eine Buchung abschließt, kann Jetnity eine Provision erhalten. Solche Verbindungen sind als Partnerlinks gekennzeichnet. Du entscheidest selbst, ob und bei welchem Anbieter du buchst.' },
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
    title: 'Reiseplaner für deine ganze Reise',
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
        image: new URL('/images/jetnity-reiseplaner-share.png', url).href,
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
