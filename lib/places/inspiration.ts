// Bekannte Inspirationsziele der Startseite. Die IDs stammen aus GeoNames
// und werden serverseitig erneut geprüft – sie sind kein Freibrief.

export const INSPIRATION_ZIELE = [
  {
    name: 'Bali',
    country: 'Indonesien',
    image: '/images/bali.jpg',
    idea: 'Zwei Wochen Bali mit Ubud, ruhigen Stränden, Natur und lokaler Küche',
    placeId: 'geonames:1650535',
  },
  {
    name: 'Lissabon',
    country: 'Portugal',
    image: '/images/lisbon.jpg',
    idea: 'Fünf Tage Lissabon mit Aussichtspunkten, gutem Essen und einem Tagesausflug ans Meer',
    placeId: 'geonames:2267057',
  },
  {
    name: 'Zermatt',
    country: 'Schweiz',
    image: '/images/zermatt.jpg',
    idea: 'Ein verlängertes Wochenende in Zermatt mit Wandern, Wellness und Matterhornblick',
    placeId: 'geonames:2657915',
  },
  {
    name: 'Amsterdam',
    country: 'Niederlande',
    image: '/images/amsterdam.jpg',
    idea: 'Vier Tage Amsterdam mit Grachten, Museen, Fahrradtour und besonderen Restaurants',
    placeId: 'geonames:2759794',
  },
] as const
