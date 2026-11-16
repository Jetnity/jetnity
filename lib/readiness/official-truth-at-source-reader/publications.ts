/** Fixed Austrian official publications for issue #1223.
 * Identity pins only. This module does not classify visa status. */

export const AT_SOURCE_LANE_ROOT = 'lib/readiness/official-truth-at-source-reader/'

/** Paths owned by issue #1222 / Hauptplan 87. This lane must not read or write them. */
export const AT_SOURCE_LANE_FORBIDDEN_PREFIXES = Object.freeze([
  'components/trips/Reisevorbereitung.tsx',
  'components/readiness/',
  'components/trips/reisekarte/',
  'app/(public)/einreise/',
  'lib/readiness/official-truth-product-v3/visitor/',
  'lib/readiness/preparation-premium-experience-5.ts',
  'lib/readiness/official-presentation.ts',
  'lib/trips/destination-essentials.ts',
  'lib/readiness/official-truth-product-v3/',
])

export const AT_OFFICIAL_MAXIMUM_BYTES = 1_048_576
export const AT_OFFICIAL_MAXIMUM_MILLISECONDS = 15_000

export type AtOfficialPublication = Readonly<{
  id: 'bmi-visa-nationality-matrix' | 'bmi-general-entry' | 'bmeia-bern-how-to-apply'
  url: string
  hostname: string
  path: string
  expectedTitle: string
  mediaType: 'text/html'
  maximumBytes: number
}>

export const AT_OFFICIAL_PUBLICATIONS: readonly AtOfficialPublication[] = Object.freeze([
  Object.freeze({
    id: 'bmi-visa-nationality-matrix',
    url: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
    hostname: 'www.bmi.gv.at',
    path: '/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
    expectedTitle: 'Visumpflichtige Länder',
    mediaType: 'text/html',
    maximumBytes: AT_OFFICIAL_MAXIMUM_BYTES,
  }),
  Object.freeze({
    id: 'bmi-general-entry',
    url: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
    hostname: 'www.bmi.gv.at',
    path: '/202/fremdenpolizei_und_grenzkontrolle/start.html',
    expectedTitle: 'Fremdenpolizei und Grenzkontrollwesen',
    mediaType: 'text/html',
    maximumBytes: AT_OFFICIAL_MAXIMUM_BYTES,
  }),
  Object.freeze({
    id: 'bmeia-bern-how-to-apply',
    url: 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
    hostname: 'www.bmeia.gv.at',
    path: '/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
    expectedTitle: 'Wie stelle ich einen Antrag? – BMEIA - Außenministerium Österreich',
    mediaType: 'text/html',
    maximumBytes: AT_OFFICIAL_MAXIMUM_BYTES,
  }),
])

export function atOfficialPublicationById(id: string): AtOfficialPublication | null {
  return AT_OFFICIAL_PUBLICATIONS.find(publication => publication.id === id) ?? null
}

export function atSourceLanePathForbidden(path: string): boolean {
  const normalised = path.replace(/\\/g, '/')
  return AT_SOURCE_LANE_FORBIDDEN_PREFIXES.some(prefix => normalised === prefix || normalised.startsWith(prefix))
}
