// Bekannte Inspirationsziele der Startseite. Die IDs stammen aus GeoNames
// und werden serverseitig erneut geprüft – sie sind kein Freibrief.
//
// Zwei Kennungen mit getrennter Aufgabe:
//   - `placeId` ist die redaktionelle Kennung des Eintrags (CMS-EntryId). Sie ist, zusammen mit Name, Land und `image`,
//     Teil der persistierten CMS-Referenz (`lib/admin/content/cms/contract.ts`) und bleibt, wie sie veröffentlicht wurde.
//   - `zielId` ist die GeoNames-Kennung des Ortes für Anzeige und Planungs-Handoff (`zielHref`).
// Beide sind gleich, ausser bei Zermatt: `geonames:2657915` ist laut GeoNames Zofingen (AG); Zermatt (VS) ist
// `geonames:2657928`. Die redaktionelle Altkennung gilt nur für diesen einen geprüften Eintrag und gleicht die Orte nicht an.

export const INSPIRATION_ZIELE = [
  {
    name: 'Bali',
    country: 'Indonesien',
    image: '/images/bali.jpg',
    idea: 'Zwei Wochen Bali mit Ubud, ruhigen Stränden, Natur und lokaler Küche',
    placeId: 'geonames:1650535',
    zielId: 'geonames:1650535',
  },
  {
    name: 'Lissabon',
    country: 'Portugal',
    image: '/images/lisbon.jpg',
    idea: 'Fünf Tage Lissabon mit Aussichtspunkten, gutem Essen und einem Tagesausflug ans Meer',
    placeId: 'geonames:2267057',
    zielId: 'geonames:2267057',
  },
  {
    name: 'Zermatt',
    country: 'Schweiz',
    image: '/images/zermatt.jpg',
    idea: 'Ein verlängertes Wochenende in Zermatt mit Wandern, Wellness und Matterhornblick',
    placeId: 'geonames:2657915',
    zielId: 'geonames:2657928',
  },
  {
    name: 'Amsterdam',
    country: 'Niederlande',
    image: '/images/amsterdam.jpg',
    idea: 'Vier Tage Amsterdam mit Grachten, Museen, Fahrradtour und besonderen Restaurants',
    placeId: 'geonames:2759794',
    zielId: 'geonames:2759794',
  },
] as const
