import 'server-only'
import { createHash } from 'node:crypto'

const REPO = 'Jetnity/jetnity'
const API = '/repos/' + REPO
const OWNER_ID = 217454461
const REPO_ID = 1020187087
const PO_COMMENT = 6114368313
const PO_BODY_SHA256 = '820c235901c81c169c282953fd6c024c0580ebfb1534296f6b8d4665fa1caa47'
const REF = 'refs/tags/jetnity-official-truth-bern-g3-rq-fetch-1-consumed'
const REF_PATH = API + '/git/ref/' + REF.slice(5)
const ISSUE_URL = 'https://github.com/' + REPO + '/issues/934'
const SCOPE = Object.freeze({
  repository: REPO, issueUrl: ISSUE_URL, phase: 'B',
  source: 'german_embassy_bern_research_candidate',
  sourceUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  method: 'GET', maximumRequests: 1, maximumBytes: 131072, timeoutMs: 10000,
  followRedirects: false, retry: false, ownerApprovalCommentId: PO_COMMENT,
})

export type BernGithubResponse = Readonly<{ status: number; body: unknown }>
export type BernGithubRead = (path: string) => Promise<BernGithubResponse>
export type BernApprovalInput = Readonly<{ mainSha: string; commentId: number }>
export type BernGateReason = 'invalid_approval_receipt' | 'github_unverifiable'
  | 'main_mismatch' | 'postmerge_unverified' | 'owner_grant_invalid' | 'receipt_invalid'
  | 'protection_approval_invalid' | 'actor_not_permitted' | 'protection_unverified'
  | 'attempt_unavailable' | 'claim_unconfirmed' | 'postclaim_changed' | 'transport_failed'
export type BernPreflight = Readonly<{ ok: true; mainSha: string; commentId: number }>
  | Readonly<{ ok: false; reason: BernGateReason }>

type ObjectValue = Record<string, unknown>
function object(value: unknown): ObjectValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectValue : {}
}
function id(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) > 0 }
function exact(value: unknown, expected: ObjectValue): boolean {
  const obj = object(value)
  return Object.keys(obj).length === Object.keys(expected).length
    && Object.entries(expected).every(([key, v]) => obj[key] === v)
}
class Denied extends Error {
  constructor(readonly reason: BernGateReason) { super(reason) }
}
function requireThat(yes: unknown, reason: BernGateReason): asserts yes {
  if (!yes) throw new Denied(reason)
}

// Bounds even a stalled injected client. A timed-out POST is NEVER retried or
// converted to success by a later GET; a remote commit may already have happened.
async function bounded<T>(operation: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([operation(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Denied('github_unverifiable')), 5000)
    })])
  } finally { clearTimeout(timer) }
}
async function get(read: BernGithubRead, path: string): Promise<unknown> {
  const response = await bounded(() => read(path))
  requireThat(response.status === 200, 'github_unverifiable')
  return response.body
}
function comment(value: unknown, commentId: number, issue: number): ObjectValue {
  const c = object(value), user = object(c.user)
  requireThat(c.id === commentId && c.url === 'https://api.github.com' + API + '/issues/comments/' + commentId
    && c.issue_url === 'https://api.github.com' + API + '/issues/' + issue
    && c.html_url === 'https://github.com/' + REPO + '/issues/' + issue + '#issuecomment-' + commentId
    && user.id === OWNER_ID && user.login === 'Jetnity' && user.type === 'User'
    && c.author_association === 'OWNER' && typeof c.body === 'string'
    && c.body.length <= 16384 && typeof c.created_at === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(c.created_at)
    && Number.isFinite(Date.parse(c.created_at)) && c.created_at === c.updated_at, 'receipt_invalid')
  return c
}
function record(c: ObjectValue): ObjectValue {
  try {
    const result = object(JSON.parse(c.body as string))
    // Whole canonical record: no Markdown/prose, duplicate keys, appended stdout,
    // embedded matching fragments, ambiguous property ordering or unknown fields.
    requireThat(JSON.stringify(result) === c.body, 'receipt_invalid')
    return result
  } catch { throw new Denied('receipt_invalid') }
}
async function main(read: BernGithubRead, sha: string) {
  const ref = object(await get(read, API + '/git/ref/heads/main')), target = object(ref.object)
  requireThat(ref.ref === 'refs/heads/main' && target.type === 'commit' && target.sha === sha
    && ref.url === 'https://api.github.com' + API + '/git/refs/heads/main', 'main_mismatch')
}
function writePermissions(value: unknown) {
  const p = object(value)
  return Object.keys(p).every(k => ['admin', 'maintain', 'push', 'triage', 'pull'].includes(k))
    && p.admin === false && p.maintain === false && p.push === true && p.pull === true
    && typeof p.triage === 'boolean'
}
async function actorAndProtection(read: BernGithubRead, actorId: number, rulesetId: number) {
  const user = object(await get(read, '/user'))
  requireThat(user.id === actorId && actorId !== OWNER_ID && user.type === 'User' && user.site_admin === false
    && typeof user.login === 'string' && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(user.login), 'actor_not_permitted')
  const repo = object(await get(read, API)), owner = object(repo.owner)
  // This proof deliberately supports ONLY this personal repository's standard
  // collaborator role. Organization/custom-role/App authority is not inferred.
  requireThat(repo.id === REPO_ID && repo.full_name === REPO && owner.id === OWNER_ID
    && owner.login === 'Jetnity' && owner.type === 'User' && writePermissions(repo.permissions), 'actor_not_permitted')
  const permission = object(await get(read, API + '/collaborators/' + user.login + '/permission'))
  const collaborator = object(permission.user)
  requireThat(permission.permission === 'write' && permission.role_name === 'write'
    && collaborator.id === actorId && collaborator.login === user.login
    && collaborator.type === 'User' && writePermissions(collaborator.permissions), 'actor_not_permitted')
  const rules = await get(read, API + '/rulesets?includes_parents=true&per_page=100')
  requireThat(Array.isArray(rules) && rules.length < 100, 'protection_unverified')
  const listed = rules.filter(r => object(r).id === rulesetId)
  requireThat(listed.length === 1 && object(listed[0]).target === 'tag'
    && object(listed[0]).enforcement === 'active' && object(listed[0]).source === REPO
    && object(listed[0]).source_type === 'Repository', 'protection_unverified')
  const rule = object(await get(read, API + '/rulesets/' + rulesetId))
  const conditions = object(rule.conditions), names = object(conditions.ref_name)
  requireThat(rule.id === rulesetId && rule.target === 'tag' && rule.enforcement === 'active'
    && rule.source === REPO && rule.source_type === 'Repository' && rule.current_user_can_bypass === 'never'
    && Array.isArray(rule.bypass_actors) && rule.bypass_actors.length === 0
    && Object.keys(conditions).length === 1 && Object.keys(names).length === 2
    && Array.isArray(names.include) && names.include.length === 1 && names.include[0] === REF
    && Array.isArray(names.exclude) && names.exclude.length === 0
    && Array.isArray(rule.rules) && rule.rules.length === 2
    && rule.rules.filter(r => exact(r, { type: 'update' })).length === 1
    && rule.rules.filter(r => exact(r, { type: 'deletion' })).length === 1, 'protection_unverified')
}
async function verify(read: BernGithubRead, input: BernApprovalInput) {
  requireThat(exact(input, { mainSha: input.mainSha, commentId: input.commentId })
    && /^[0-9a-f]{40}$/.test(input.mainSha) && id(input.commentId) && input.commentId !== PO_COMMENT,
  'invalid_approval_receipt')
  await main(read, input.mainSha)
  const pr = object(await get(read, API + '/pulls/935')), base = object(pr.base), head = object(pr.head)
  requireThat(pr.number === 935 && pr.merged === true && pr.state === 'closed'
    && pr.merge_commit_sha === input.mainSha && base.ref === 'main'
    && object(base.repo).id === REPO_ID && object(head.repo).id === REPO_ID
    && head.ref === 'feat/official-truth-bern-g3-rq-fetch-1', 'postmerge_unverified')
  const po = comment(await get(read, API + '/issues/comments/' + PO_COMMENT), PO_COMMENT, 917)
  requireThat(createHash('sha256').update(po.body as string, 'utf8').digest('hex') === PO_BODY_SHA256, 'owner_grant_invalid')
  const receipt = comment(await get(read, API + '/issues/comments/' + input.commentId), input.commentId, 934)
  const data = record(receipt)
  requireThat(id(data.protectionApprovalCommentId) && data.protectionApprovalCommentId !== input.commentId
    && id(data.rulesetId) && id(data.executionActorId), 'receipt_invalid')
  requireThat(exact(data, {
    recordType: 'G3_RQ_FETCH_1_ATTEMPT_CONSUMED', ...SCOPE, reviewedMainSha: input.mainSha,
    protectionApprovalCommentId: data.protectionApprovalCommentId, rulesetId: data.rulesetId,
    executionActorId: data.executionActorId, independentCodeSecurityApproved: true, postmergeVerified: true,
  }), 'receipt_invalid')
  const approval = comment(await get(read, API + '/issues/comments/' + data.protectionApprovalCommentId), data.protectionApprovalCommentId, 934)
  requireThat(exact(record(approval), {
    recordType: 'G3_RQ_FETCH_1_PROTECTION_AND_UNUSED_BASELINE_APPROVED', ...SCOPE,
    reviewedMainSha: input.mainSha, rulesetId: data.rulesetId, executionActorId: data.executionActorId,
    consumedRef: REF, initialUnusedAttested: true, availableAuditEvidenceReviewed: true,
    trustedAdministrationAcknowledged: true,
  }) && (approval.created_at as string) <= (receipt.created_at as string), 'protection_approval_invalid')
  await actorAndProtection(read, data.executionActorId, data.rulesetId)
  return { actorId: data.executionActorId, rulesetId: data.rulesetId,
    receiptBody: receipt.body, approvalBody: approval.body }
}
function failure(error: unknown): BernPreflight {
  return Object.freeze({ ok: false, reason: error instanceof Denied ? error.reason : 'github_unverifiable' })
}

/** Read-only preflight, NOT an execution capability. Real CLI owns the client. */
export async function verifyBernGithubPreflight(read: BernGithubRead, input: BernApprovalInput): Promise<BernPreflight> {
  try {
    await verify(read, input)
    return Object.freeze({ ok: true, mainSha: input.mainSha, commentId: input.commentId })
  } catch (error) { return failure(error) }
}

/** Simulations only. No production GitHub writer or Bern physical transport is
 * imported here; this function cannot mint a capability for the live export. */
export async function simulateBernGlobalClaimForOfflineTests(
  input: BernApprovalInput,
  deps: Readonly<{ read: BernGithubRead;
    createRef: (ref: string, sha: string) => Promise<BernGithubResponse>;
    transport: () => Promise<void> }>,
): Promise<BernPreflight> {
  try {
    requireThat(process.env.NODE_TEST_CONTEXT !== undefined, 'github_unverifiable')
    const before = await verify(deps.read, input)
    const absent = await bounded(() => deps.read(REF_PATH))
    requireThat(absent.status === 404 && object(absent.body).message === 'Not Found', 'attempt_unavailable')
    // Owner unused attestation + independently protected ref are both required.
    // A 404 alone never establishes the initial unused condition.
    await main(deps.read, input.mainSha)
    const created = await bounded(() => deps.createRef(REF, input.mainSha))
    requireThat(created.status === 201 && validRef(created.body, input.mainSha), 'claim_unconfirmed')
    const after = await verify(deps.read, input)
    requireThat(exact(after, before), 'postclaim_changed')
    requireThat(validRef(await get(deps.read, REF_PATH), input.mainSha), 'postclaim_changed')
    await main(deps.read, input.mainSha)
    try { await bounded(deps.transport) } catch { throw new Denied('transport_failed') }
    return Object.freeze({ ok: true, mainSha: input.mainSha, commentId: input.commentId })
  } catch (error) { return failure(error) }
}
function validRef(value: unknown, sha: string) {
  const ref = object(value), target = object(ref.object)
  return ref.ref === REF && ref.url === 'https://api.github.com' + API + '/git/refs/' + REF.slice(5)
    && target.type === 'commit' && target.sha === sha
}
