// lib/places/titel-name.ts
//
// Anzeigename für den Reisetitel: gängiger deutscher Ortsname in Schweizer
// Schreibweise. Reine Darstellung. Der Katalogname bleibt die Namenswahrheit für
// Suche, Etappen, Flughafen- und Anbieterabfragen; es wird nichts gespeichert,
// was nicht schon im Titel steht, und nichts in der Datenbank geändert.
//
// Die Tabelle nennt nur Orte, deren GeoNames-Name im Bestand vom deutschen Namen
// abweicht. Jede Zeile ist gegen den Production-Bestand geprüft (Typ, Land und
// exakter Katalogname). Ein Ort ohne Eintrag behält seinen Katalognamen.

import type { Ort, OrtTyp } from '@/lib/places/domain'

type Eintrag = readonly [land: string, katalogName: string, deutsch: string]

const STAEDTE: readonly Eintrag[] = [
  ['AT', 'Vienna', 'Wien'],
  ['BE', 'Antwerp', 'Antwerpen'], ['BE', 'Brugge', 'Brügge'], ['BE', 'Brussels', 'Brüssel'], ['BE', 'Liège', 'Lüttich'],
  ['CA', 'Montréal', 'Montreal'], ['CA', 'Québec', 'Quebec'],
  ['CH', 'Geneva', 'Genf'], ['CH', 'Neuchâtel', 'Neuenburg'],
  ['CN', 'Beijing', 'Peking'], ['CN', 'Shanghai', 'Schanghai'],
  ['CU', 'Havana', 'Havanna'],
  ['CY', 'Nicosia', 'Nikosia'],
  ['CZ', 'Prague', 'Prag'],
  ['DE', 'Munich', 'München'], ['DE', 'Nuremberg', 'Nürnberg'],
  ['DK', 'Copenhagen', 'Kopenhagen'],
  ['EG', 'Cairo', 'Kairo'],
  ['ES', 'Zaragoza', 'Saragossa'],
  ['ET', 'Addis Ababa', 'Addis Abeba'],
  ['FR', 'Nice', 'Nizza'], ['FR', 'Strasbourg', 'Strassburg'],
  ['GR', 'Athens', 'Athen'], ['GR', 'Thessaloníki', 'Thessaloniki'],
  ['HK', 'Hong Kong', 'Hongkong'],
  ['IN', 'Kolkata', 'Kalkutta'], ['IN', 'New Delhi', 'Neu-Delhi'],
  ['IQ', 'Baghdad', 'Bagdad'],
  ['IR', 'Tehran', 'Teheran'],
  ['IT', 'Bolzano', 'Bozen'], ['IT', 'Florence', 'Florenz'], ['IT', 'Genoa', 'Genua'], ['IT', 'Merano', 'Meran'],
  ['IT', 'Milan', 'Mailand'], ['IT', 'Naples', 'Neapel'], ['IT', 'Rome', 'Rom'], ['IT', 'Siracusa', 'Syrakus'],
  ['IT', 'Trieste', 'Triest'], ['IT', 'Venice', 'Venedig'],
  ['JP', 'Tokyo', 'Tokio'],
  ['LU', 'Luxembourg', 'Luxemburg'],
  ['LY', 'Tripoli', 'Tripolis'],
  ['MA', 'Marrakesh', 'Marrakesch'],
  ['MM', 'Yangon', 'Rangun'],
  ['MX', 'Mexico City', 'Mexiko-Stadt'],
  ['NL', 'The Hague', 'Den Haag'],
  ['NP', 'Kathmandu', 'Katmandu'],
  ['OM', 'Muscat', 'Maskat'],
  ['PA', 'Panama City', 'Panama-Stadt'],
  ['PL', 'Gdańsk', 'Danzig'], ['PL', 'Kraków', 'Krakau'], ['PL', 'Poznań', 'Posen'], ['PL', 'Szczecin', 'Stettin'],
  ['PL', 'Warsaw', 'Warschau'], ['PL', 'Wrocław', 'Breslau'],
  ['PT', 'Lisbon', 'Lissabon'],
  ['RO', 'Bucharest', 'Bukarest'],
  ['RS', 'Belgrade', 'Belgrad'],
  ['RU', 'Moscow', 'Moskau'], ['RU', 'Saint Petersburg', 'Sankt Petersburg'],
  ['SA', 'Jeddah', 'Dschidda'], ['SA', 'Makkah', 'Mekka'], ['SA', 'Riyadh', 'Riad'],
  ['SE', 'Gothenburg', 'Göteborg'],
  ['SG', 'Singapore', 'Singapur'],
  ['SY', 'Damascus', 'Damaskus'],
  ['TZ', 'Dar es Salaam', 'Daressalam'], ['TZ', 'Zanzibar', 'Sansibar'],
  ['UA', 'Kyiv', 'Kiew'], ['UA', 'Odesa', 'Odessa'],
  ['UZ', 'Tashkent', 'Taschkent'],
  ['VN', 'Ho Chi Minh City', 'Ho-Chi-Minh-Stadt'],
  ['ZA', 'Cape Town', 'Kapstadt'],
]

const INSELN: readonly Eintrag[] = [
  ['CY', 'Cyprus', 'Zypern'],
  ['DE', 'Rügen Island', 'Rügen'],
  ['DK', 'Fyn', 'Fünen'], ['DK', 'Sjælland', 'Seeland'],
  ['ES', 'Canary Islands', 'Kanarische Inseln'], ['ES', 'Minorca', 'Menorca'], ['ES', 'Tenerife', 'Teneriffa'],
  ['FR', 'Corsica Island', 'Korsika'],
  ['GR', 'Corfu', 'Korfu'], ['GR', 'Crete', 'Kreta'], ['GR', 'Cyclades', 'Kykladen'], ['GR', 'Rhodes', 'Rhodos'],
  ['GR', 'Santorini Island', 'Santorin'],
  ['IT', 'Sardinia', 'Sardinien'], ['IT', 'Sicily', 'Sizilien'],
  ['PT', 'Azores', 'Azoren'],
]

const REGIONEN: readonly Eintrag[] = [
  ['BE', 'Flanders', 'Flandern'], ['BE', 'Wallonia', 'Wallonien'],
  ['CH', 'Canton de Genève', 'Kanton Genf'], ['CH', 'Canton de Vaud', 'Kanton Waadt'],
  ['CH', 'Canton du Valais', 'Kanton Wallis'], ['CH', 'Cantone Ticino', 'Kanton Tessin'],
  ['DE', 'Bavaria', 'Bayern'], ['DE', 'Saxony', 'Sachsen'], ['DE', 'Saxony-Anhalt', 'Sachsen-Anhalt'],
  ['DE', 'Thuringia', 'Thüringen'],
  ['ES', 'Andalusia', 'Andalusien'], ['ES', 'Catalunya', 'Katalonien'],
  ['ES', 'Comunitat Autònoma de les Illes Balears', 'Balearen'], ['ES', 'Euskal Autonomia Erkidegoa', 'Baskenland'],
  ['ES', 'Galicia', 'Galicien'],
  ['FI', 'Lapland', 'Lappland'],
  ['FR', 'Corse', 'Korsika'],
  ['GB', 'Scotland', 'Schottland'],
  ['GR', 'Peloponnese', 'Peloponnes'],
  ['HR', 'Istria County', 'Istrien'],
  ['IT', 'Calabria', 'Kalabrien'], ['IT', 'Campania', 'Kampanien'], ['IT', 'Lazio', 'Latium'], ['IT', 'Liguria', 'Ligurien'],
  ['IT', 'Lombardia', 'Lombardei'], ['IT', 'Piemonte', 'Piemont'], ['IT', 'Puglia', 'Apulien'], ['IT', 'Toscana', 'Toskana'],
  ['IT', 'Umbria', 'Umbrien'], ['IT', 'Veneto', 'Venetien'],
  ['US', 'California', 'Kalifornien'],
]

function schluessel(typ: OrtTyp, land: string, katalogName: string): string {
  return `${typ}:${land}:${katalogName}`
}

function tabelle(typ: OrtTyp, eintraege: readonly Eintrag[]): Array<readonly [string, string]> {
  return eintraege.map(([land, name, deutsch]) => [schluessel(typ, land, name), deutsch] as const)
}

const DEUTSCHE_NAMEN: ReadonlyMap<string, string> = (() => {
  const alle = [...tabelle('city', STAEDTE), ...tabelle('island', INSELN), ...tabelle('region', REGIONEN)]
  const karte = new Map(alle)
  if (karte.size !== alle.length) throw new Error('Doppelter Eintrag in der Tabelle deutscher Ortsnamen.')
  return karte
})()

/** Schweizer Rechtschreibung: kein «ß». */
export function schweizerSchreibweise(text: string): string {
  return text.replace(/ß/g, 'ss').replace(/ẞ/g, 'SS')
}

export function ortTitelName(ort: Pick<Ort, 'typ' | 'name' | 'sourceName' | 'countryCode'>): string {
  const katalogName = ort.sourceName ?? ort.name
  const deutsch = ort.countryCode ? DEUTSCHE_NAMEN.get(schluessel(ort.typ, ort.countryCode, katalogName)) : undefined
  return schweizerSchreibweise(deutsch ?? ort.name)
}

const ORT_TYPEN: readonly OrtTyp[] = ['city', 'island', 'region']

/**
 * Erkennt einen Reisetitel, der nur das erste Ziel wiedergibt: alt als Katalogname («Lisbon»), neu als
 * deutscher Name in Schweizer Schreibweise («Lissabon»). Eigene Titel bleiben unberührt.
 */
export function titelFolgtDemErstenZiel(titel: string, ziel: { name: string; countryCode: string | null }): boolean {
  if (titel === ziel.name || titel === schweizerSchreibweise(ziel.name)) return true
  const land = ziel.countryCode
  if (!land) return false
  return ORT_TYPEN.some((typ) => {
    const deutsch = DEUTSCHE_NAMEN.get(schluessel(typ, land, ziel.name))
    return deutsch !== undefined && schweizerSchreibweise(deutsch) === titel
  })
}
