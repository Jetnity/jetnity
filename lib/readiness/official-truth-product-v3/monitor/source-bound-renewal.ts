// Cross-destination, passport-specific source-to-fact renewal admission.
// PURE PRECHECK ONLY: no network, database, accepted-fact writes, or authorization.
// The server-owned SourceIssuer and protected PG17 MA1/HRS/BG1/owner history
// MUST independently reprove each item in one transaction before publication.
// Never feed client, LLM or RESEARCH_ONLY objects into this policy as authority.
import 'server-only'

export type RenewalSubject = Readonly<{
  destinationCountryCode: string
  citizenshipCountryCode: string
  requirementType: string
  documentType: string
  routeType: string
  conditionsDigest: string
}>
export type PinnedSource = Readonly<{
  id: string
  role: 'destination_primary' | 'independent_official'
  authorityCountryCode: string // fixed government registry scope, never guessed from host alone
  officialUrl: string
  rawDigest: string
  canonicalDigest: string | null
  normalizationContract: 'none' | 'bmeia-theme-assets-v1'
}>
export type SourceObservation = Readonly<{
  id: string
  officialUrl: string
  state: 'unchanged_exact' | 'unchanged_asset_version_only' | 'changed' | 'unavailable' | 'pending'
  rawDigest: string | null
  canonicalDigest: string | null
  normalizationContract: 'none' | 'bmeia-theme-assets-v1'
  requestedAt: string
  observedAt: string
  batchId: string
}>
export type ReviewedFact = Readonly<{
  subject: RenewalSubject
  methodId: string
  methodRevision: number
  methodDigest: string
  packageDigest: string
  methodEpoch: number
  ownerApproval: 'approved' | 'revoked' | 'unapproved'
  legalValidUntil: string | null
  lastVerifiedAt: string
  sourceBindings: readonly PinnedSource[]
  release: 'accepted' | 'RESEARCH_ONLY' | 'unavailable'
  unresolvedConflict: boolean
}>
export type SourceRenewalCheck = Readonly<{
  subject: RenewalSubject
  approvedMethodId: string
  approvedMethodRevision: number
  approvedMethodDigest: string
  approvedPackageDigest: string
  approvedMethodEpoch: number
  methodStatus: 'current' | 'revoked' | 'unknown'
  bg1Status: 'current' | 'unavailable'
  observations: readonly SourceObservation[]
  checkedAt: string
  passportPriority: readonly string[]
}>
export type SourceRenewalDecision = Readonly<{
  status: 'eligible_for_protected_issuer_only' | 'unavailable'
  expiresAt: string | null
  reason: string
}>

// Exact, versioned user passport-priority.csv ranking (50); no reordering or\n// substituting a convenient nationality to mint a rule. A new ranking is a new review.\nconst PASSPORT_PRIORITY_20261113 = 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'\nconst digest = (s: string): boolean => /^[a-f0-9]{64}$/.test(s)
const code = (s: string): boolean => /^[A-Z]{2}$/.test(s)
const iso = (s: string): number | null => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(s)) return null
  const n = Date.parse(s)
  return Number.isFinite(n) ? n : null
}
const same = (a: RenewalSubject, b: RenewalSubject): boolean =>
  a.destinationCountryCode === b.destinationCountryCode &&
  a.citizenshipCountryCode === b.citizenshipCountryCode &&
  a.requirementType === b.requirementType &&
  a.documentType === b.documentType &&
  a.routeType === b.routeType &&
  a.conditionsDigest === b.conditionsDigest
const fail = (reason: string): SourceRenewalDecision =>
  Object.freeze({status:'unavailable',expiresAt:null,reason})

/** A positive result is never an authorization. Only a native PG17 protected
 * issuer may consume this decision, with a new durable receipt, real BG1 audit
 * and exact current MA1 epoch recheck at the fact-write and visitor-read edges.
 * One fact or passport cannot provide permission for another combination. */
export function checkSourceBoundRenewal(
  previous: ReviewedFact, input: SourceRenewalCheck,
): SourceRenewalDecision {
  const now = iso(input.checkedAt), prior = iso(previous.lastVerifiedAt)
  if (now === null || prior === null || prior >= now || input.bg1Status !== 'current')
    return fail('guard_or_clock')
  if (!code(input.subject.destinationCountryCode) || !code(input.subject.citizenshipCountryCode)
    || !digest(input.subject.conditionsDigest) || !same(input.subject,previous.subject)
    || !input.subject.requirementType || !input.subject.documentType || !input.subject.routeType)
    return fail('unqualified_subject')
  if (input.passportPriority.length !== 50 ||
      new Set(input.passportPriority).size !== 50 ||
      input.passportPriority.some(p => !code(p)) ||\n      input.passportPriority.join(' ') !== PASSPORT_PRIORITY_20261113 ||
      !input.passportPriority.includes(input.subject.citizenshipCountryCode))
    return fail('unqualified_passport')
  if (previous.release !== 'accepted' || previous.unresolvedConflict ||
      previous.ownerApproval !== 'approved' || input.methodStatus !== 'current' ||
      !previous.methodId || !digest(previous.methodDigest) || !digest(previous.packageDigest) ||
      !Number.isSafeInteger(previous.methodRevision) || previous.methodRevision < 1 ||\n      !Number.isSafeInteger(previous.methodEpoch) || previous.methodEpoch < 1 ||
      previous.methodId !== input.approvedMethodId ||
      previous.methodRevision !== input.approvedMethodRevision ||
      previous.methodEpoch !== input.approvedMethodEpoch ||
      previous.methodDigest !== input.approvedMethodDigest ||
      previous.packageDigest !== input.approvedPackageDigest)
    return fail('not_currently_approved')
  const legalEnd = previous.legalValidUntil === null ? null : iso(previous.legalValidUntil)
  if (previous.legalValidUntil !== null && (legalEnd === null || legalEnd <= now))
    return fail('legal_expiry')
  const pins = previous.sourceBindings
  const observations = input.observations
  if (pins.length < 1 || pins.length > 8 || pins.length !== observations.length ||
      pins.filter(p => p.role === 'destination_primary').length !== 1 ||
      new Set(pins.map(p => p.id)).size !== pins.length ||
      new Set(observations.map(o => o.id)).size !== observations.length)
    return fail('incomplete_source_set')
  const ids = new Set(pins.map(p=>p.id))
  if (observations.some(o=>!ids.has(o.id))) return fail('unexpected_source')
  const batch = observations[0]?.batchId
  if (!batch || observations.some(o=>o.batchId!==batch))
    return fail('mixed_source_batch')
  for (const pin of pins) {
    const receipt = observations.find(o=>o.id===pin.id)
    if (!receipt || !pin.id || !code(pin.authorityCountryCode) ||
      (pin.role === 'destination_primary' && pin.authorityCountryCode !== input.subject.destinationCountryCode) ||
      !digest(pin.rawDigest) ||
      !pin.officialUrl.startsWith('https://') || receipt.officialUrl!==pin.officialUrl)
      return fail('source_identity')
    const seen = iso(receipt.observedAt), sent = iso(receipt.requestedAt)
    if (seen === null || sent === null || sent > seen || seen > now ||
      seen - sent > 5 * 60_000 || now - seen > 70 * 60_000 ||
      seen <= prior || !digest(receipt.rawDigest ?? ''))
      return fail('source_not_new_and_fresh')
    if (receipt.state === 'unchanged_exact') {
      if (receipt.rawDigest !== pin.rawDigest ||
          receipt.normalizationContract !== 'none') return fail('original_changed')
    } else if (receipt.state === 'unchanged_asset_version_only') {
      if (pin.officialUrl !== 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/' ||\n          pin.normalizationContract !== 'bmeia-theme-assets-v1' ||
          receipt.normalizationContract !== pin.normalizationContract ||
          !digest(pin.canonicalDigest ?? '') ||
          receipt.canonicalDigest !== pin.canonicalDigest)
        return fail('unsupported_normalization')
    } else return fail('source_changed_or_unavailable')
  }
  // A fresh source observation is not an extension of the law's effective date.
  // The current source lease is at most one hour and can end sooner on a legal date.
  const end = Math.min(now + 60 * 60_000, legalEnd ?? Number.POSITIVE_INFINITY)
  if (end <= now) return fail('legal_expiry')
  return Object.freeze({
    status:'eligible_for_protected_issuer_only',expiresAt:new Date(end).toISOString(),
    reason:'same_approved_fact_with_new_independently_reproved_source_receipts',
  })
}
