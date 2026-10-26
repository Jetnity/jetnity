import type { Ort } from '@/lib/places/domain'

const ORTE: Record<string, Ort> = {
  'geonames:2657896': {
    id: 'geonames:2657896',
    source: 'geonames',
    sourceId: '2657896',
    name: 'Zürich',
    typ: 'city',
    country: 'Switzerland',
    countryCode: 'CH',
    region: null,
    lat: 47.36667,
    lon: 8.55,
    iata: null,
    keywords: null,
  },
  'geonames:1609350': {
    id: 'geonames:1609350',
    source: 'geonames',
    sourceId: '1609350',
    name: 'Bangkok',
    typ: 'city',
    country: 'Thailand',
    countryCode: 'TH',
    region: null,
    lat: 13.75398,
    lon: 100.50144,
    iata: null,
    keywords: null,
  },
  'geonames:1153671': {
    id: 'geonames:1153671',
    source: 'geonames',
    sourceId: '1153671',
    name: 'Chiang Mai',
    typ: 'city',
    country: 'Thailand',
    countryCode: 'TH',
    region: null,
    lat: 18.79038,
    lon: 98.98468,
    iata: null,
    keywords: null,
  },
  'geonames:1151254': {
    id: 'geonames:1151254',
    source: 'geonames',
    sourceId: '1151254',
    name: 'Phuket',
    typ: 'city',
    country: 'Thailand',
    countryCode: 'TH',
    region: null,
    lat: 7.89059,
    lon: 98.3981,
    iata: null,
    keywords: null,
  },
}

export async function reiseorteBestaetigen(eingabe: {
  zielId: unknown
  abreiseId: unknown
  weitereZielIds?: unknown
}) {
  const weitere = Array.isArray(eingabe.weitereZielIds) ? eingabe.weitereZielIds : []
  const ids = [eingabe.zielId, ...weitere]
  const ziele = ids.map((id) => (typeof id === 'string' ? ORTE[id] : undefined))
  const abreise = typeof eingabe.abreiseId === 'string' ? ORTE[eingabe.abreiseId] : undefined
  if (!abreise || ziele.some((ort) => !ort)) {
    return { ok: false as const, meldung: 'Synthetischer Ort fehlt.', feld: 'destination' as const }
  }
  const [ziel, ...weitereZiele] = ziele as Ort[]
  return { ok: true as const, ziel, abreise, weitereZiele }
}
