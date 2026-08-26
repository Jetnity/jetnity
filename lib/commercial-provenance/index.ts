// lib/commercial-provenance/index.ts
//
// Öffentlicher S5-A Commercial-Provenance-Vertrag.
// Kein UniversalOffer, keine Provideraktivierung, keine Persistenz.

export {
  COMMERCIAL_AFFILIATE_STATUS,
  COMMERCIAL_AKTEURE,
  COMMERCIAL_AMOUNT_STATUS,
  COMMERCIAL_AVAILABILITY,
  COMMERCIAL_CURRENCY_STATUS,
  COMMERCIAL_FRESHNESS,
  COMMERCIAL_KONFLIKT_STATUS,
  COMMERCIAL_PERSISTENZ,
  COMMERCIAL_PROVENANCE_DOMAINS,
  COMMERCIAL_PROVENANCE_FEHLER,
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  COMMERCIAL_SOURCE_KINDS,
  COMMERCIAL_STATUS,
  type CommercialAkteur,
  type CommercialAffiliate,
  type CommercialAvailability,
  type CommercialBewertung,
  type CommercialKonflikt,
  type CommercialOptionIdentitaet,
  type CommercialProvenance,
  type CommercialProvenanceDomain,
  type CommercialProvenanceFehler,
  type CommercialPruefung,
  type MitCommercialProvenance,
} from '@/lib/commercial-provenance/domain'
export { commercialAngeboteVergleichen, commercialBesteQuelleWaehlen } from '@/lib/commercial-provenance/konflikt'
export {
  commercialIdentitaetAusOption,
  commercialProvenancePruefen,
  commercialTruthUebernehmen,
  darfCommercialAlsCurrentQuoteErscheinen,
  istCommercialLiveBehauptungErlaubt,
  optionMitCommercialProvenance,
} from '@/lib/commercial-provenance/pruefen'
export { commercialFrischheitBewerten } from '@/lib/commercial-provenance/frischheit'
export { commercialWaehrungBewerten } from '@/lib/commercial-provenance/waehrung'
export { commercialAffiliateLesen, commercialQuellePruefen } from '@/lib/commercial-provenance/quelle'
