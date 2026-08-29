// lib/commercial-provenance/index.ts
//
// Öffentlicher S5-A Commercial-Provenance-Vertrag plus S5-B Mint-/Projektion.
// Kein UniversalOffer, keine Provideraktivierung, kein Service-Role-Pfad.

export {
  COMMERCIAL_AFFILIATE_STATUS,
  COMMERCIAL_AKTEURE,
  COMMERCIAL_AKTEUR_QUELLEN,
  COMMERCIAL_AMOUNT_STATUS,
  COMMERCIAL_AVAILABILITY,
  COMMERCIAL_CURRENCY_STATUS,
  COMMERCIAL_FRESHNESS,
  COMMERCIAL_KONFLIKT_STATUS,
  COMMERCIAL_NUTZER_QUELLEN,
  COMMERCIAL_PERSISTENZ,
  COMMERCIAL_PROVENANCE_DOMAINS,
  COMMERCIAL_PROVENANCE_FEHLER,
  COMMERCIAL_PROVIDER_QUELLEN,
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  COMMERCIAL_SOURCE_KINDS,
  COMMERCIAL_STATUS,
  type CommercialAkteur,
  type CommercialAffiliate,
  type CommercialAvailability,
  type CommercialBewertung,
  type CommercialBindung,
  type CommercialKonflikt,
  type CommercialOptionIdentitaet,
  type CommercialProvenance,
  type CommercialProvenanceDomain,
  type CommercialProvenanceFehler,
  type CommercialPruefung,
  type MitCommercialProvenance,
} from '@/lib/commercial-provenance/domain'
export { commercialIdentitaetAusOption, optionMitCommercialProvenance } from '@/lib/commercial-provenance/bindung'
export { commercialAngeboteVergleichen, commercialBesteQuelleWaehlen } from '@/lib/commercial-provenance/konflikt'
export {
  commercialNutzerangabePruefen,
  commercialPersistiertenSnapshotPruefen,
  commercialProviderQuotePruefen,
  commercialProvenancePruefen,
  commercialTruthUebernehmen,
  darfCommercialAlsCurrentQuoteErscheinen,
  istCommercialLiveBehauptungErlaubt,
} from '@/lib/commercial-provenance/pruefen'
export { commercialFrischheitBewerten } from '@/lib/commercial-provenance/frischheit'
export { commercialWaehrungBewerten } from '@/lib/commercial-provenance/waehrung'
export { commercialAffiliateLesen, commercialQuellePruefen } from '@/lib/commercial-provenance/quelle'
export { commercialAkteurQuellePruefen, istCommercialProviderQuelle } from '@/lib/commercial-provenance/trust'
export {
  COMMERCIAL_LEGACY_GUARD,
  COMMERCIAL_PERSISTENCE_CLIENT_QUOTE_KEYS,
  COMMERCIAL_PERSISTENCE_MINT,
  COMMERCIAL_PERSISTENCE_VERTRAG,
  TRIP_ITEM_COMMERCIAL_KINDS,
  TRIP_ITEM_KIND_TO_COMMERCIAL_DOMAIN,
  commercialAkteurIstWriteActor,
  commercialDomainFuerTripItemKind,
  commercialIstProviderHardTruth,
  commercialLegacyGuardFuerKind,
  commercialLegacyOhneProvenanceIstUnknown,
  commercialLegacyProjektionAusSnapshot,
  commercialPersistenzNutzlastBauen,
  commercialPersistenzNutzlastFuerTripItem,
  commercialPersistenzNutzlastIstRohclient,
  commercialSnapshotFuerPersistenzMinten,
  type CommercialLegacyFeldvertrag,
  type CommercialLegacyGuard,
  type CommercialLegacyProjektion,
  type CommercialPersistenzNutzlast,
  type CommercialSnapshotMint,
  type TripItemCommercialKind,
} from '@/lib/commercial-provenance/persistenz'
