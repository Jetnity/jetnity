// lib/commercial-provenance/konflikt.ts
//
// Mehrere belegte Quellen dürfen widersprechen. Keine erfundene beste Quelle.
// Kein Mittelwert. Kein stilles Gewinner-Angebot.

import type { CommercialKonflikt, CommercialProvenance } from '@/lib/commercial-provenance/domain'

function identitaet(angebot: CommercialProvenance): string | null {
  if (angebot.vergleichsschluessel) return `${angebot.domain}:vergleich:${angebot.vergleichsschluessel}`
  if (angebot.quelle.providerBelegt && angebot.quelle.providerId && angebot.referenz.externalRef) {
    return `${angebot.domain}:provider:${angebot.quelle.providerId}:ref:${angebot.referenz.externalRef}`
  }
  return null
}

function preisWert(angebot: CommercialProvenance): string | null {
  if (angebot.preis.amountStatus !== 'quoted' || angebot.preis.amount == null) return null
  return String(angebot.preis.amount)
}

export function commercialAngeboteVergleichen(angebote: readonly CommercialProvenance[]): CommercialKonflikt {
  if (angebote.length === 0) {
    return { status: 'insufficient_evidence', schluessel: null, anzahl: 0, widersprueche: [] }
  }
  if (angebote.length === 1) {
    return { status: 'single', schluessel: identitaet(angebote[0]!), anzahl: 1, widersprueche: [] }
  }

  const schluessel = angebote.map(identitaet)
  if (schluessel.some((wert) => wert == null) || new Set(schluessel).size !== 1) {
    return { status: 'insufficient_evidence', schluessel: null, anzahl: angebote.length, widersprueche: [] }
  }

  const widersprueche: CommercialKonflikt['widersprueche'] = []
  const betraege = [...new Set(angebote.map(preisWert))]
  if (betraege.includes(null)) {
    return {
      status: 'insufficient_evidence',
      schluessel: schluessel[0] ?? null,
      anzahl: angebote.length,
      widersprueche: [],
    }
  }
  if (new Set(betraege).size > 1) {
    widersprueche.push({ feld: 'amount', werte: betraege.filter((wert): wert is string => wert != null) })
  }

  const waehrungen = [...new Set(angebote.map((angebot) => angebot.waehrung.quotedCurrency))]
  if (waehrungen.includes(null)) {
    return {
      status: 'insufficient_evidence',
      schluessel: schluessel[0] ?? null,
      anzahl: angebote.length,
      widersprueche,
    }
  }
  if (new Set(waehrungen).size > 1) {
    widersprueche.push({
      feld: 'quotedCurrency',
      werte: waehrungen.filter((wert): wert is string => wert != null),
    })
  }

  const verfuegbarkeit = [...new Set(angebote.map((angebot) => angebot.availabilityStatus))]
  if (verfuegbarkeit.length > 1) {
    widersprueche.push({ feld: 'availabilityStatus', werte: verfuegbarkeit })
  }

  return {
    status: widersprueche.length > 0 ? 'conflict' : 'consistent',
    schluessel: schluessel[0] ?? null,
    anzahl: angebote.length,
    widersprueche,
  }
}

export function commercialBesteQuelleWaehlen(_angebote: readonly CommercialProvenance[]): null {
  return null
}
