import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { HotelKandidat, HotelSuchanfrage, QuartierKandidat, QuartierSuchkontext } from '@/lib/hotels/domain'
import { HOTEL_RANGLISTE_GEWICHTE, hotelOptionenBewerten } from '@/lib/hotels/ranking'
import { QUARTIER_GEWICHTE, quartiereBewerten } from '@/lib/hotels/quartier-ranking'

const ANFRAGE: HotelSuchanfrage = {
  destinationPlaceId: 'geonames:2950159',
  checkIn: '2026-09-12',
  checkOut: '2026-09-16',
  rooms: 1,
  adults: 2,
  children: 0,
  currency: 'CHF',
  quartier: {
    id: 'eixample',
    name: 'Eixample',
    zentrum: { lat: 41.39, lon: 2.16 },
  },
  preferences: {
    budgetProNachtMax: 220,
    mindestSterne: 3,
    fruehstueckBevorzugt: null,
    stornierbarBevorzugt: true,
  },
}

function hotel(werte: Partial<HotelKandidat> & Pick<HotelKandidat, 'id' | 'name' | 'preisGesamt' | 'preisProNacht'>): HotelKandidat {
  return {
    id: werte.id,
    provider: werte.provider ?? 'provider-a',
    externalRef: werte.externalRef ?? werte.id,
    name: werte.name,
    punkt: werte.punkt ?? { lat: 41.39, lon: 2.16 },
    quartierName: werte.quartierName ?? 'Eixample',
    adresse: werte.adresse ?? null,
    sterne: werte.sterne ?? 4,
    bewertung: werte.bewertung ?? 8.5,
    bewertungenAnzahl: werte.bewertungenAnzahl ?? 1200,
    preisGesamt: werte.preisGesamt,
    preisProNacht: werte.preisProNacht,
    preisWaehrung: werte.preisWaehrung ?? 'CHF',
    steuernEnthalten: werte.steuernEnthalten ?? true,
    stornierbar: werte.stornierbar ?? true,
    stornierungBis: werte.stornierungBis ?? null,
    fruehstueckEnthalten: werte.fruehstueckEnthalten ?? null,
    zimmerName: werte.zimmerName ?? null,
    context: werte.context ?? {
      taeglicheWegeMinuten: 25,
      quartierFitScore: 0.8,
      ruheScore: 0.6,
      praeferenzFitScore: 0.8,
    },
  }
}

const GUTE_LAGE = hotel({
  id: 'gute-lage',
  name: 'Hotel Gute Lage',
  preisGesamt: 760,
  preisProNacht: 190,
  bewertung: 9.0,
  context: {
    taeglicheWegeMinuten: 14,
    quartierFitScore: 0.95,
    ruheScore: 0.75,
    praeferenzFitScore: 0.9,
  },
})

const BILLIG_ABGELEGEN = hotel({
  id: 'billig-abgelegen',
  name: 'Hotel Billig',
  preisGesamt: 520,
  preisProNacht: 130,
  bewertung: 7.8,
  stornierbar: false,
  context: {
    taeglicheWegeMinuten: 62,
    quartierFitScore: 0.35,
    ruheScore: 0.4,
    praeferenzFitScore: 0.5,
  },
})

const PREMIUM = hotel({
  id: 'premium',
  name: 'Hotel Premium',
  preisGesamt: 1320,
  preisProNacht: 330,
  sterne: 5,
  bewertung: 9.4,
  context: {
    taeglicheWegeMinuten: 20,
    quartierFitScore: 0.88,
    ruheScore: 0.85,
    praeferenzFitScore: 0.9,
  },
})

describe('Hotelranking', () => {
  test('die billigste Option ist nicht automatisch Jetnitys Empfehlung', () => {
    const bewertet = hotelOptionenBewerten([BILLIG_ABGELEGEN, PREMIUM, GUTE_LAGE], ANFRAGE)
    const jetnity = bewertet.find((option) => option.labels.includes('jetnity'))
    assert.equal(jetnity?.id, 'gute-lage')
    assert.notEqual(jetnity?.id, 'billig-abgelegen')
  })

  test('Providername beeinflusst den Score nicht', () => {
    const a = hotelOptionenBewerten([GUTE_LAGE], ANFRAGE)[0]!
    const b = hotelOptionenBewerten([{ ...GUTE_LAGE, provider: 'anderer-provider' }], ANFRAGE)[0]!
    assert.equal(a.score, b.score)
  })

  test('Labels für Lage, Value und Premium sind deterministisch', () => {
    const bewertet = hotelOptionenBewerten([PREMIUM, GUTE_LAGE, BILLIG_ABGELEGEN], ANFRAGE)
    assert.equal(bewertet.find((option) => option.labels.includes('best_location'))?.id, 'gute-lage')
    assert.ok(bewertet.find((option) => option.labels.includes('best_value')))
    assert.equal(bewertet.find((option) => option.labels.includes('premium'))?.id, 'premium')
  })

  test('Gewichte enthalten keine Provision', () => {
    assert.equal('provision' in HOTEL_RANGLISTE_GEWICHTE, false)
    assert.equal(Object.values(HOTEL_RANGLISTE_GEWICHTE).reduce((summe, wert) => summe + wert, 0), 100)
  })
})

const QUARTIER_KONTEXT: QuartierSuchkontext = {
  destinationPlaceId: 'geonames:3128760',
  destinationName: 'Barcelona',
  naechte: 4,
  reiseAnker: [
    { id: 'sagrada', name: 'Sagrada Família', punkt: { lat: 41.4036, lon: 2.1744 }, gewicht: 1 },
    { id: 'gotic', name: 'Barri Gòtic', punkt: { lat: 41.383, lon: 2.176 }, gewicht: 0.9 },
  ],
  budgetProNachtMax: 220,
  praeferenzen: {
    ruhe: 0.6,
    nachtleben: 0.4,
    essen: 0.9,
    strand: null,
    familie: null,
  },
  transferPrioritaet: { anreise: 0.5, abreise: 0.5 },
}

function quartier(werte: Partial<QuartierKandidat> & Pick<QuartierKandidat, 'id' | 'name'>): QuartierKandidat {
  return {
    id: werte.id,
    name: werte.name,
    zentrum: werte.zentrum ?? { lat: 41.39, lon: 2.16 },
    taeglicheWegeMinuten: werte.taeglicheWegeMinuten ?? 30,
    anreiseTransferMinuten: werte.anreiseTransferMinuten ?? 35,
    abreiseTransferMinuten: werte.abreiseTransferMinuten ?? 35,
    gehScore: werte.gehScore ?? 0.8,
    oevScore: werte.oevScore ?? 0.8,
    ruheScore: werte.ruheScore ?? 0.6,
    nachtlebenScore: werte.nachtlebenScore ?? 0.5,
    essenScore: werte.essenScore ?? 0.8,
    strandScore: werte.strandScore ?? 0.2,
    familieScore: werte.familieScore ?? 0.6,
    typischeNachtPreis: werte.typischeNachtPreis ?? 190,
  }
}

describe('Quartier-Ranking', () => {
  test('kurze Reisewege können ein etwas teureres Quartier sinnvoller machen', () => {
    const zentral = quartier({ id: 'zentral', name: 'Zentral', taeglicheWegeMinuten: 18, typischeNachtPreis: 210 })
    const billig = quartier({ id: 'billig', name: 'Billig', taeglicheWegeMinuten: 70, typischeNachtPreis: 130, oevScore: 0.55 })
    const bewertet = quartiereBewerten([billig, zentral], QUARTIER_KONTEXT)
    assert.equal(bewertet[0]?.id, 'zentral')
  })

  test('dieselbe Menge liefert unabhängig von der Eingabereihenfolge dieselbe Rangfolge', () => {
    const a = quartier({ id: 'a', name: 'A', taeglicheWegeMinuten: 20 })
    const b = quartier({ id: 'b', name: 'B', taeglicheWegeMinuten: 35 })
    const eins = quartiereBewerten([a, b], QUARTIER_KONTEXT).map((q) => q.id)
    const zwei = quartiereBewerten([b, a], QUARTIER_KONTEXT).map((q) => q.id)
    assert.deepEqual(eins, zwei)
  })

  test('Quartiergewichte enthalten keine Provider- oder Provisionskomponente', () => {
    assert.equal('provider' in QUARTIER_GEWICHTE, false)
    assert.equal('provision' in QUARTIER_GEWICHTE, false)
    assert.equal(Object.values(QUARTIER_GEWICHTE).reduce((summe, wert) => summe + wert, 0), 100)
  })
})
