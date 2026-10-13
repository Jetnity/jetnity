import ownerBody from './owner-grant.json'
import type { BernGithubRead, BernGithubResponse } from '../authorization'

export const SHA = 'a'.repeat(40)
export const RECEIPT = 7000000001
export const APPROVAL = 7000000002
const ACTOR = 12345
export const RULESET = 10001
export const FIXED_REF = 'refs/tags/jetnity-official-truth-bern-g3-rq-fetch-1-consumed'
export const API = '/repos/Jetnity/jetnity'
export const REF_PATH = API + '/git/ref/' + FIXED_REF.slice(5)
const scope = {
  repository: 'Jetnity/jetnity', issueUrl: 'https://github.com/Jetnity/jetnity/issues/934', phase: 'B',
  source: 'german_embassy_bern_research_candidate',
  sourceUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  method: 'GET', maximumRequests: 1, maximumBytes: 131072, timeoutMs: 10000,
  followRedirects: false, retry: false, ownerApprovalCommentId: 6114368313,
}
export function comment(id: number, issue: number, body: string) {
  return { id, url: 'https://api.github.com' + API + '/issues/comments/' + id,
    issue_url: 'https://api.github.com' + API + '/issues/' + issue,
    html_url: 'https://github.com/Jetnity/jetnity/issues/' + issue + '#issuecomment-' + id,
    user: { id: 217454461, login: 'Jetnity', type: 'User' }, author_association: 'OWNER',
    created_at: '2026-10-13T12:00:00Z', updated_at: '2026-10-13T12:00:00Z', body }
}
export function reference(sha = SHA) {
  return { ref: FIXED_REF, url: 'https://api.github.com' + API + '/git/refs/' + FIXED_REF.slice(5),
    object: { type: 'commit', sha } }
}
export function githubFixture() {
  const permissions = { admin: false, maintain: false, push: true, triage: true, pull: true }
  const receipt = comment(RECEIPT, 934, JSON.stringify({
    recordType: 'G3_RQ_FETCH_1_ATTEMPT_CONSUMED', ...scope, reviewedMainSha: SHA,
    protectionApprovalCommentId: APPROVAL, rulesetId: RULESET, executionActorId: ACTOR,
    independentCodeSecurityApproved: true, postmergeVerified: true,
  }))
  const approval = comment(APPROVAL, 934, JSON.stringify({
    recordType: 'G3_RQ_FETCH_1_PROTECTION_AND_UNUSED_BASELINE_APPROVED', ...scope,
    reviewedMainSha: SHA, rulesetId: RULESET, executionActorId: ACTOR, consumedRef: FIXED_REF,
    initialUnusedAttested: true, availableAuditEvidenceReviewed: true, trustedAdministrationAcknowledged: true,
  }))
  const ruleset = { id: RULESET, target: 'tag', enforcement: 'active', source: 'Jetnity/jetnity',
    source_type: 'Repository', current_user_can_bypass: 'never', bypass_actors: [] as unknown[],
    conditions: { ref_name: { include: [FIXED_REF], exclude: [] as string[] } },
    rules: [{ type: 'update' }, { type: 'deletion' }] as unknown[] }
  const user = { id: ACTOR, login: 'synthetic-writer', type: 'User', site_admin: false }
  const repo = { id: 1020187087, full_name: 'Jetnity/jetnity',
    owner: { id: 217454461, login: 'Jetnity', type: 'User' }, permissions: { ...permissions } }
  const permission = { permission: 'write', role_name: 'write', user: { ...user, permissions: { ...permissions } } }
  const remoteMain = { ref: 'refs/heads/main', url: 'https://api.github.com' + API + '/git/refs/heads/main',
    object: { type: 'commit', sha: SHA } }
  const pr = { number: 935, merged: true, state: 'closed', merge_commit_sha: SHA,
    base: { ref: 'main', repo: { id: 1020187087 } },
    head: { ref: 'feat/official-truth-bern-g3-rq-fetch-1', repo: { id: 1020187087 } } }
  const po = comment(6114368313, 917, ownerBody)
  const responses = new Map<string, BernGithubResponse>([
    [API, { status: 200, body: repo }], ['/user', { status: 200, body: user }],
    [API + '/git/ref/heads/main', { status: 200, body: remoteMain }],
    [API + '/pulls/935', { status: 200, body: pr }],
    [API + '/issues/comments/6114368313', { status: 200, body: po }],
    [API + '/issues/comments/' + RECEIPT, { status: 200, body: receipt }],
    [API + '/issues/comments/' + APPROVAL, { status: 200, body: approval }],
    [API + '/collaborators/' + user.login + '/permission', { status: 200, body: permission }],
    [API + '/rulesets?includes_parents=true&per_page=100', { status: 200, body: [ruleset] }],
    [API + '/rulesets/' + RULESET, { status: 200, body: ruleset }],
    [REF_PATH, { status: 404, body: { message: 'Not Found' } }],
  ])
  const calls: string[] = []
  const read: BernGithubRead = async path => {
    calls.push(path)
    const response = responses.get(path)
    if (!response) throw new Error('unexpected_mock_path')
    return structuredClone(response)
  }
  return { read, calls, responses, receipt, approval, ruleset, user, repo, permission, remoteMain, pr, po }
}
