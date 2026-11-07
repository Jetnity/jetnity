import 'server-only'
import { createHash } from 'node:crypto'
import { APP_API as API, APP_POLICY as P, canonical, demand, digest, obj, owner, positiveId, same, sha, timestamp,
  type AppCheckout, type AppPins, type AppReceipts, type JsonObject } from './policy'

export type AppEvidenceRead = (path: string) => Promise<unknown>
const SCOPE = Object.freeze({ repository: P.repository, issue: 934, phase: 'B',
  source: 'german_embassy_bern_research_candidate',
  sourceUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  method: 'GET', maximumRequests: 1, maximumBytes: 131072, timeoutMs: 10000,
  followRedirects: false, retry: false, ownerApprovalCommentId: P.ownerGrantId })

function record(body: unknown): JsonObject {
  demand(typeof body === 'string' && body.length <= 32768, 'receipt_invalid')
  const r = obj(JSON.parse(body))
  // Canonical whole record only. Reject duplicate JSON keys, prose, unknown
  // ordering, embedded fragments and equivalent-but-ambiguous encodings.
  demand(canonical(r) === body, 'receipt_invalid')
  return r
}
function comment(value: unknown, id: number, issue: number): JsonObject {
  const c = obj(value)
  owner(c.user)
  demand(c.id === id && c.url === 'https://api.github.com' + API + '/issues/comments/' + id
    && c.issue_url === 'https://api.github.com' + API + '/issues/' + issue
    && c.html_url === 'https://github.com/' + P.repository + '/issues/' + issue + '#issuecomment-' + id
    && c.author_association === 'OWNER' && c.created_at === c.updated_at, 'receipt_invalid')
  timestamp(c.created_at)
  return c
}
function inventory(value: unknown): unknown[] {
  demand(Array.isArray(value) && value.length < 100, 'incomplete_inventory')
  const ids = value.map(v => obj(v).id)
  demand(ids.every(positiveId) && new Set(ids).size === ids.length, 'ambiguous_inventory')
  return value
}
async function receipt(read: AppEvidenceRead, id: number, issue: number, kind: string) {
  const c = comment(await read(API + '/issues/comments/' + id), id, issue)
  const entries = inventory(await read(API + '/issues/' + issue + '/comments?per_page=100&page=1'))
  const matches = entries.filter(entry => {
    const body = obj(entry).body
    if (typeof body !== 'string') return false
    try { return obj(JSON.parse(body)).recordType === kind } catch { return false }
  })
  // Ambiguous/duplicate records block, even if one of them looks valid.
  demand(matches.length === 1 && same(matches[0], c), 'ambiguous_receipt')
  const data = record(c.body)
  demand(data.recordType === kind, 'receipt_invalid')
  return { c, data }
}

/** Reviewed baseline main policy, read from GitHub on 2026-10-13. This is
 * policy content, never an assertion of current visibility or immutability. */
const MAIN_RULES = [
  { type: 'deletion' },
  { type: 'pull_request', parameters: { required_approving_review_count: 0,
    dismiss_stale_reviews_on_push: false, required_reviewers: [], require_code_owner_review: false,
    require_last_push_approval: false, required_review_thread_resolution: true,
    require_extra_approval_for_unattributed_changes: false, allowed_merge_methods: ['merge'] } },
  { type: 'non_fast_forward' },
  { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true,
    do_not_enforce_on_create: false, required_status_checks: [
      { context: 'Typecheck, Lint & Build', integration_id: 15368 },
      { context: 'Auth-Konfiguration gegen config.toml', integration_id: 15368 },
      { context: 'Vercel', integration_id: 8329 },
    ] } },
]
export function appRuleProjection(value: unknown) {
  const r = obj(value)
  for (const k of ['id', 'name', 'target', 'source_type', 'source', 'enforcement', 'conditions', 'rules', 'created_at', 'updated_at']) {
    demand(Object.hasOwn(r, k), 'protection_incomplete')
  }
  const { id, name, target, source_type, source, enforcement, conditions, rules, created_at, updated_at } = r
  timestamp(created_at); timestamp(updated_at)
  demand(Array.isArray(rules), 'protection_incomplete')
  // Rule order is not semantic. Parameter arrays retain their exact order.
  return { id, name, target, source_type, source, enforcement, conditions,
    rules: [...rules].sort((a, b) => canonical(a).localeCompare(canonical(b))), created_at, updated_at }
}
function validateRule(rule: unknown, id: number) {
  const r = obj(rule), tag = id === P.tagRuleId
  demand(Object.keys(r).every(k => ['id', 'name', 'target', 'source_type', 'source', 'enforcement', 'conditions', 'rules',
    'created_at', 'updated_at', 'node_id', '_links', 'bypass_actors', 'current_user_can_bypass'].includes(k)), 'protection_unknown_field')
  demand(r.id === id && r.source_type === 'Repository' && r.source === P.repository
    && r.target === (tag ? 'tag' : 'branch') && r.enforcement === 'active'
    && r.name === (tag ? 'Official Truth Bern G3 RQ Fetch 1 consumed tag protection' : 'Jetnity main protection')
    && same(r.conditions, { ref_name: { exclude: [], include: [tag ? P.consumedRef : 'refs/heads/main'] } }), 'protection_changed')
  const projection = appRuleProjection(r)
  const expected = (tag ? [{ type: 'deletion' }, { type: 'update' }] : MAIN_RULES)
    .sort((a, b) => canonical(a).localeCompare(canonical(b)))
  demand(same(projection.rules, expected), 'protection_changed')
  demand(timestamp(r.updated_at) === timestamp(tag ? '2026-10-13T12:28:50.736Z' : '2026-08-30T19:43:33.235Z'), 'protection_version_changed')
  if (Object.hasOwn(r, 'bypass_actors')) demand(same(r.bypass_actors, []), 'protection_bypass')
  if (Object.hasOwn(r, 'current_user_can_bypass')) demand(r.current_user_can_bypass === 'never', 'protection_bypass')
  return projection
}

/** Pure evidence validation used only behind the App-authenticated session.
 * This returns evidence digests, never authorization to fetch or create a ref.
 * A caller injecting a read function has supplied a simulation, not provenance. */
export async function verifyAppEvidence(read: AppEvidenceRead, pins: AppPins, checkout: AppCheckout,
  receipts: AppReceipts, now: number): Promise<string> {
  const started = performance.now()
  demand(Number.isSafeInteger(now) && now > 0 && checkout.clean === true && sha(checkout.mainSha) && sha(checkout.treeSha)
    && checkout.mainSha !== P.baselineMain, 'checkout_unverified')
  const ids = Object.values(receipts)
  demand(same(Object.keys(receipts).sort(), ['acceptanceId', 'reviewId', 'unusedId', 'witnessId'])
    && ids.every(positiveId) && new Set(ids).size === 4 && !ids.includes(P.ownerGrantId), 'receipt_invalid')
  const main = obj(await read(API + '/git/ref/heads/main')), target = obj(main.object)
  demand(main.ref === 'refs/heads/main' && main.url === 'https://api.github.com' + API + '/git/refs/heads/main'
    && target.type === 'commit' && target.sha === checkout.mainSha, 'main_mismatch')
  const pr = obj(await read(API + '/pulls/937')), head = obj(pr.head), base = obj(pr.base)
  demand(pr.number === 937 && pr.state === 'closed' && pr.merged === true && pr.draft === false
    && pr.merge_commit_sha === checkout.mainSha && base.ref === 'main' && obj(base.repo).id === P.repositoryId
    && head.ref === P.branch && obj(head.repo).id === P.repositoryId && sha(head.sha), 'integration_unreviewed')
  const mergedAt = timestamp(pr.merged_at)
  const author = obj(await read(API + '/git/commits/' + head.sha))
  const merge = obj(await read(API + '/git/commits/' + checkout.mainSha))
  const authorTree = obj(author.tree).sha
  demand(author.sha === head.sha && merge.sha === checkout.mainSha && sha(authorTree)
    && authorTree === checkout.treeSha && obj(merge.tree).sha === authorTree
    && Array.isArray(merge.parents) && merge.parents.length === 2
    && obj(merge.parents[0]).sha === P.baselineMain && obj(merge.parents[1]).sha === head.sha, 'merge_tree_unverified')

  const binding = { repositoryId: P.repositoryId, ownerId: P.ownerId, ...pins,
    integrationPr: 937, taskBlob: P.taskBlob, authorHead: head.sha, authorTree,
    reviewedMain: checkout.mainSha }
  const reviews = inventory(await read(API + '/pulls/937/reviews?per_page=100&page=1'))
  const candidates = reviews.filter(v => {
    try { return obj(JSON.parse(String(obj(v).body))).recordType === 'BERN_APP_CODE_REVIEW_V1' } catch { return false }
  })
  demand(candidates.length === 1, 'review_ambiguous')
  const review = obj(candidates[0]); owner(review.user)
  demand(review.id === receipts.reviewId && review.commit_id === head.sha && ['APPROVED', 'COMMENTED'].includes(String(review.state))
    && review.html_url === 'https://github.com/' + P.repository + '/pull/937#pullrequestreview-' + receipts.reviewId
    && timestamp(review.submitted_at) <= mergedAt, 'review_unverified')
  const reviewData = record(review.body)
  demand(same(reviewData, { recordType: 'BERN_APP_CODE_REVIEW_V1', repositoryId: P.repositoryId,
    integrationPr: 937, taskBlob: P.taskBlob, authorHead: head.sha, authorTree,
    independentCodeSecurityApproved: true, custodyAccepted: true, trustedAdministrationAcknowledged: true }), 'review_unverified')
  const acceptance = await receipt(read, receipts.acceptanceId, 936, 'BERN_APP_INTEGRATION_ACCEPTED_V1')
  demand(timestamp(acceptance.c.created_at) >= mergedAt && timestamp(acceptance.c.created_at) <= now
    && same(acceptance.data, { recordType: 'BERN_APP_INTEGRATION_ACCEPTED_V1', ...binding,
      reviewId: receipts.reviewId, reviewBodyDigest: digest(reviewData),
      postmergeVerified: true, appConfigurationReadbackVerified: true,
      selectedRepositoryIds: [P.repositoryId], installationIds: [pins.installationId],
      privateApp: true, webhookActive: false, userOAuthEnabled: false }), 'acceptance_invalid')

  const grant = comment(await read(API + '/issues/comments/' + P.ownerGrantId), P.ownerGrantId, 917)
  demand(typeof grant.body === 'string' && createHash('sha256').update(grant.body).digest('hex') === P.ownerGrantDigest,
    'owner_grant_invalid')
  const unused = await receipt(read, receipts.unusedId, 934, 'BERN_APP_UNUSED_AUTHORITY_V1')
  demand(same(unused.data, { recordType: 'BERN_APP_UNUSED_AUTHORITY_V1', ...binding, scope: SCOPE,
    consumedRef: P.consumedRef, initialUnusedAttested: true, availableAuditEvidenceReviewed: true,
    trustedAdministrationAcknowledged: true, executionIdentity: 'AppInstallation',
    authorizingOwnerId: P.ownerId }) && timestamp(unused.c.created_at) >= timestamp(acceptance.c.created_at)
    && timestamp(unused.c.created_at) <= now, 'unused_authority_invalid')

  const witness = await receipt(read, receipts.witnessId, 936, 'BERN_APP_PROTECTION_WITNESS_V1')
  const data = witness.data
  const observed = timestamp(data.observedAt), expires = timestamp(data.expiresAt)
  demand(observed <= timestamp(witness.c.created_at) && timestamp(witness.c.created_at) <= now
    && observed >= timestamp(acceptance.c.created_at) && now - observed <= P.witnessLifetimeMs
    && expires > now && expires > observed && expires - observed <= P.witnessLifetimeMs, 'witness_stale')
  const rules = inventory(await read(API + '/rulesets?includes_parents=true&per_page=100&page=1'))
  demand(rules.length === 2 && same(rules.map(r => obj(r).id).sort(), [P.mainRuleId, P.tagRuleId].sort()), 'rules_inventory_mismatch')
  const policies = []
  for (const id of [P.mainRuleId, P.tagRuleId]) {
    const r = obj(await read(API + '/rulesets/' + id))
    const listed = obj(rules.find(v => obj(v).id === id))
    for (const key of ['id', 'source', 'source_type', 'target', 'enforcement']) {
      demand(listed[key] === r[key], 'rules_inventory_mismatch')
    }
    policies.push({ rulesetId: id, policy: validateRule(r, id), bypassActors: [], executorCanBypass: 'never' })
  }
  demand(same(data, { recordType: 'BERN_APP_PROTECTION_WITNESS_V1', ...binding,
    acceptanceId: receipts.acceptanceId, observerId: P.ownerId, observerRole: 'OwnerTechnicalLead',
    observedAt: data.observedAt, expiresAt: data.expiresAt, includesParents: true,
    inventoryComplete: true, policies, trustedAdministrationAcknowledged: true }), 'witness_mismatch')
  demand(expires > now + Math.ceil(performance.now() - started), 'witness_stale')
  // The privileged observer's authenticated statement bridges ONLY omitted
  // fields. It cannot override an explicit bypass, changed policy or version.
  return digest({ binding, review: reviewData, acceptance, unused, witness, policies })
}
