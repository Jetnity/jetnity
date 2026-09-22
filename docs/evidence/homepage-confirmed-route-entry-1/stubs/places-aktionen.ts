import type { Ort } from '@/lib/places/domain'

type Fenster = typeof globalThis & {
  __bestaetigenCalls?: unknown[]
}

const NAMEN: Record<string, { name: string; countryCode: string }> = {
  'geonames:2988507': { name: 'Paris', countryCode: 'FR' },
  'geonames:3169070': { name: 'Rom', countryCode: 'IT' },
  'geonames:3941584': { name: 'Cusco', countryCode: 'PE' },
  'geonames:2657896': { name: 'Zürich', countryCode: 'CH' },
}

function ort(id: string): Ort {
  const bekannt = NAMEN[id]
  return {
    id,
    source: 'geonames',
    sourceId: id.replace(/^geonames:/, ''),
    name: bekannt?.name ?? id,
    typ: 'city',
    country: bekannt?.name ?? null,
    countryCode: bekannt?.countryCode ?? 'XX',
    region: null,
    lat: 1,
    lon: 1,
    iata: null,
    keywords: null,
  }
}

export async function reiseorteBestaetigen(eingabe: {
  zielId: string
  abreiseId: string
  weitereZielIds?: string[]
}) {
  const fenster = globalThis as Fenster
  fenster.__bestaetigenCalls ??= []
  fenster.__bestaetigenCalls.push(eingabe)
  const weitere = (eingabe.weitereZielIds ?? []).map(ort)
  return {
    ok: true as const,
    ziel: ort(eingabe.zielId),
    abreise: ort(eingabe.abreiseId),
    weitereZiele: weitere,
  }
}

export async function ortBestaetigen() {
  return { ok: false as const, meldung: 'nicht Teil dieses Harness' }
}
