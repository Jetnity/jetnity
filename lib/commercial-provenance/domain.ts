// lib/commercial-provenance/domain.ts
//
// Provider-neutraler Commercial-Provenance-Vertrag (S5-A).
// Kein UniversalOffer. Keine Flight-/Hotel-/Activity-/Transport-Semantik.
// Keine Official-/Safety-/Seasonal-Evidence. Kein S1-Operationsvertrag.
//
// Ein Preis, eine Providerangabe oder eine Buchungsinformation darf später
// nur dann als kommerzielle Wahrheit gelten, wenn Herkunft, Beobachtungszeit,
// Freshness und Währung belegbar sind. Fehlt Evidence, bleibt unknown.
//
// Frei von Next, Supabase, Provider-SDKs und `process.env`.

export const COMMERCIAL_PROVENANCE_DOMAINS = [
  'flights',
  'hotels',
  'activities',
  'mobility',
  'rental_cars',
] as const
export type CommercialProvenanceDomain = (typeof COMMERCIAL_PROVENANCE_DOMAINS)[number]

/**
 * Belegte Quellen einer kommerziellen Beobachtung.
 * Assistant/LLM ist bewusst kein Source-Kind: Hard Truth darf nicht
 * vom Sprachmodell erzeugt oder überschrieben werden.
 */
export const COMMERCIAL_SOURCE_KINDS = [
  'live_api',
  'provider_snapshot',
  'persisted_snapshot',
  'user_intake',
  'manual',
] as const
export type CommercialSourceKind = (typeof COMMERCIAL_SOURCE_KINDS)[number]

export const COMMERCIAL_AKTEURE = ['system', 'provider_adapter', 'user', 'assistant', 'llm'] as const
export type CommercialAkteur = (typeof COMMERCIAL_AKTEURE)[number]

export const COMMERCIAL_FRESHNESS = ['current', 'stale', 'unknown'] as const
export type CommercialFreshness = (typeof COMMERCIAL_FRESHNESS)[number]

/**
 * Gesamter kommerzieller Wahrheitsstatus.
 * Nicht mit Availability oder einem boolean `available` vermischen.
 */
export const COMMERCIAL_STATUS = [
  'current',
  'stale',
  'unknown',
  'unavailable',
  'error',
  'partial',
] as const
export type CommercialStatus = (typeof COMMERCIAL_STATUS)[number]

export const COMMERCIAL_CURRENCY_STATUS = ['matched', 'mismatch', 'unknown'] as const
export type CommercialCurrencyStatus = (typeof COMMERCIAL_CURRENCY_STATUS)[number]

export const COMMERCIAL_AFFILIATE_STATUS = ['present', 'absent', 'unknown'] as const
export type CommercialAffiliateStatus = (typeof COMMERCIAL_AFFILIATE_STATUS)[number]

export const COMMERCIAL_PERSISTENZ = ['ephemeral', 'snapshot'] as const
export type CommercialPersistenz = (typeof COMMERCIAL_PERSISTENZ)[number]

export const COMMERCIAL_AMOUNT_STATUS = ['quoted', 'missing', 'error'] as const
export type CommercialAmountStatus = (typeof COMMERCIAL_AMOUNT_STATUS)[number]

export const COMMERCIAL_KONFLIKT_STATUS = [
  'single',
  'consistent',
  'conflict',
  'insufficient_evidence',
] as const
export type CommercialKonfliktStatus = (typeof COMMERCIAL_KONFLIKT_STATUS)[number]

/**
 * Verfügbarkeit bleibt ein eigener Status.
 * S5-A zertifiziert kein `available`. Fehlende Evidence bleibt `unknown`.
 */
export const COMMERCIAL_AVAILABILITY = ['unavailable', 'unknown'] as const
export type CommercialAvailability = (typeof COMMERCIAL_AVAILABILITY)[number]

export const COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS = 5 * 60 * 1000

export const COMMERCIAL_PROVENANCE_FEHLER = [
  'invalid_retrieved_at',
  'retrieved_at_in_future',
  'invalid_fresh_until',
  'fresh_until_before_retrieved_at',
  'fresh_until_ohne_quellenbeleg',
  'retrieved_at_ohne_abruf',
  'missing_observed_at',
  'invalid_observed_at',
  'missing_source',
  'missing_actor',
  'invalid_source_kind',
  'assistant_source_forbidden',
  'actor_source_forbidden',
  'missing_provider',
  'erfundene_provider_id',
  'persistenz_source_widerspruch',
  'invalid_currency',
  'conversion_without_evidence',
  'invalid_amount',
  'observed_at_mismatch',
  'invalid_affiliate_claim',
  'assistant_overwrite_forbidden',
  'provider_truth_overwrite_forbidden',
  'refresh_identity_mismatch',
  'provider_id_ohne_providerquelle',
  'amount_status_widerspruch',
  'bind_domain_mismatch',
  'bind_provider_mismatch',
  'bind_ref_mismatch',
] as const
export type CommercialProvenanceFehlerCode = (typeof COMMERCIAL_PROVENANCE_FEHLER)[number]

export type CommercialProvenanceFehler = {
  code: CommercialProvenanceFehlerCode
  path: string
}

export type CommercialQuelle = {
  providerId: string | null
  /** Nur true, wenn die Quelle tatsächlich providergebunden und belegt ist. */
  providerBelegt: boolean
  sourceKind: CommercialSourceKind
  sourceLabel: string | null
}

export type CommercialReferenz = {
  externalRef: string | null
  providerOfferId: string | null
  /** External/Provider-Referenz ist Herkunft, kein Trust. */
  referenzIstKeinTrust: true
}

export type CommercialZeitpunkt = {
  /** Provider-Abrufzeit. Null bei User-Intake/Manual – das ist kein Abruf. */
  retrievedAt: string | null
  /** Beobachtungs- oder Eintragszeit. Für Nutzerangaben die massgebliche Zeit. */
  observedAt: string
  freshUntil: string | null
}

export type CommercialWaehrung = {
  requestedCurrency: string | null
  quotedCurrency: string | null
}

export type CommercialPreis = {
  amount: number | null
  amountStatus: CommercialAmountStatus
}

export type CommercialAffiliate = {
  status: CommercialAffiliateStatus
  partnerId: string | null
  clickId: string | null
  attributionRef: string | null
}

export type CommercialProvenance = {
  domain: CommercialProvenanceDomain
  quelle: CommercialQuelle
  referenz: CommercialReferenz
  zeit: CommercialZeitpunkt
  waehrung: CommercialWaehrung
  preis: CommercialPreis
  persistenz: CommercialPersistenz
  affiliate: CommercialAffiliate
  availabilityStatus: CommercialAvailability
  vergleichsschluessel: string | null
}

/**
 * Abgeleitete Bewertung. Enthält absichtlich kein `available: boolean`.
 * Ein Snapshot ist niemals live. Current Quote ist keine Live-Verfügbarkeit.
 */
export type CommercialBewertung = {
  freshnessStatus: CommercialFreshness
  currencyStatus: CommercialCurrencyStatus
  affiliateStatus: CommercialAffiliateStatus
  commercialStatus: CommercialStatus
  availabilityStatus: CommercialAvailability
  conversionEvidence: 'absent'
  snapshotIstNieLive: true
  darfAlsCurrentQuoteDargestelltWerden: boolean
  darfAlsLiveDargestelltWerden: false
  darfRequestedWaehrungAlsVergleichbarGelten: boolean
}

export type CommercialPruefungOk = {
  ok: true
  provenance: CommercialProvenance
  bewertung: CommercialBewertung
}

export type CommercialPruefungFehler = {
  ok: false
  fehler: CommercialProvenanceFehler[]
}

export type CommercialPruefung = CommercialPruefungOk | CommercialPruefungFehler

export type CommercialKonflikt = {
  status: CommercialKonfliktStatus
  schluessel: string | null
  anzahl: number
  widersprueche: Array<{
    feld: 'amount' | 'quotedCurrency' | 'availabilityStatus'
    werte: string[]
  }>
}

export type MitCommercialProvenance<T> = T & {
  commercialProvenance: CommercialProvenance
}

export type CommercialOptionIdentitaet = {
  provider?: string | null
  externalRef?: string | null
}

export type CommercialBindungOk<T> = {
  ok: true
  option: MitCommercialProvenance<T>
}

export type CommercialBindung<T> = CommercialBindungOk<T> | CommercialPruefungFehler

export const COMMERCIAL_PROVIDER_QUELLEN = [
  'live_api',
  'provider_snapshot',
  'persisted_snapshot',
] as const

export const COMMERCIAL_NUTZER_QUELLEN = ['user_intake', 'manual'] as const

export const COMMERCIAL_AKTEUR_QUELLEN: Record<CommercialAkteur, readonly CommercialSourceKind[]> = {
  provider_adapter: ['live_api', 'provider_snapshot'],
  system: ['persisted_snapshot'],
  user: ['user_intake', 'manual'],
  assistant: [],
  llm: [],
}
