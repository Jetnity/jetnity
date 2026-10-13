// Synthetic offline responses only. These App/installation/review IDs have no
// live meaning and are never imported by the developer CLI/configuration.
import grant from '../official-truth-bern-g3-rq-fetch-1/fixtures/owner-grant.json'
import rulesFixture from './rules.fixture.json'
import { APP_API as API, APP_POLICY as P, canonical, digest, type JsonObject } from './policy'
import { appRuleProjection } from './evidence'
import type { AppHttpRequest, AppHttpResponse } from '../../../scripts/official-truth-bern-executor-app-1/github'

export function appFixture() {
  const pins = { appId: 90001, installationId: 90002, clientId: 'Iv1.syntheticfixture', slug: 'synthetic-offline-app' }
  const checkout = { mainSha: 'a'.repeat(40), treeSha: 'b'.repeat(40), clean: true }
  const authorHead = 'c'.repeat(40)
  const receipts = { reviewId: 80001, acceptanceId: 80002, unusedId: 80003, witnessId: 80004 }
  const now = Date.parse('2026-10-13T15:00:30Z')
  const account = { id: P.ownerId, login: 'Jetnity', type: 'User' }
  const repository = { id: P.repositoryId, full_name: P.repository, owner: account }
  const application = { id: pins.appId, slug: pins.slug, client_id: pins.clientId, owner: account,
    html_url: 'https://github.com/apps/' + pins.slug, permissions: { ...P.permissions }, events: [] }
  const installation = { id: pins.installationId, app_id: pins.appId, app_slug: pins.slug,
    target_id: P.ownerId, target_type: 'User', repository_selection: 'selected', account,
    permissions: { ...P.permissions }, events: [], suspended_at: null, suspended_by: null,
    access_tokens_url: 'https://api.github.com/app/installations/' + pins.installationId + '/access_tokens',
    repositories_url: 'https://api.github.com/installation/repositories' }
  const binding = { repositoryId: P.repositoryId, ownerId: P.ownerId, ...pins, integrationPr: 937,
    taskBlob: P.taskBlob, authorHead, authorTree: checkout.treeSha, reviewedMain: checkout.mainSha }
  const reviewRecord = { recordType: 'BERN_APP_CODE_REVIEW_V1', repositoryId: P.repositoryId,
    integrationPr: 937, taskBlob: P.taskBlob, authorHead, authorTree: checkout.treeSha,
    independentCodeSecurityApproved: true, custodyAccepted: true, trustedAdministrationAcknowledged: true }
  function comment(id: number, issue: number, body: string, at = '2026-10-13T15:00:00Z') {
    return { id, url: 'https://api.github.com' + API + '/issues/comments/' + id,
      issue_url: 'https://api.github.com' + API + '/issues/' + issue,
      html_url: 'https://github.com/' + P.repository + '/issues/' + issue + '#issuecomment-' + id,
      user: account, author_association: 'OWNER', created_at: at, updated_at: at, body }
  }
  const acceptance = comment(receipts.acceptanceId, 936, canonical({
    recordType: 'BERN_APP_INTEGRATION_ACCEPTED_V1', ...binding, reviewId: receipts.reviewId,
    reviewBodyDigest: digest(reviewRecord), postmergeVerified: true, appConfigurationReadbackVerified: true,
    selectedRepositoryIds: [P.repositoryId], installationIds: [pins.installationId],
    privateApp: true, webhookActive: false, userOAuthEnabled: false,
  }))
  const unused = comment(receipts.unusedId, 934, canonical({ recordType: 'BERN_APP_UNUSED_AUTHORITY_V1', ...binding,
    scope: { repository: P.repository, issue: 934, phase: 'B', source: 'german_embassy_bern_research_candidate',
      sourceUrl: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474', method: 'GET',
      maximumRequests: 1, maximumBytes: 131072, timeoutMs: 10000, followRedirects: false, retry: false,
      ownerApprovalCommentId: P.ownerGrantId }, consumedRef: P.consumedRef,
    initialUnusedAttested: true, availableAuditEvidenceReviewed: true, trustedAdministrationAcknowledged: true,
    executionIdentity: 'AppInstallation', authorizingOwnerId: P.ownerId }))
  const rules = structuredClone(rulesFixture)
  const witness = comment(receipts.witnessId, 936, canonical({ recordType: 'BERN_APP_PROTECTION_WITNESS_V1', ...binding,
    acceptanceId: receipts.acceptanceId, observerId: P.ownerId, observerRole: 'OwnerTechnicalLead',
    observedAt: '2026-10-13T15:00:00Z', expiresAt: '2026-10-13T15:05:00Z', includesParents: true,
    inventoryComplete: true, policies: rules.map(r => ({ rulesetId: r.id, policy: appRuleProjection(r),
      bypassActors: [], executorCanBypass: 'never' })), trustedAdministrationAcknowledged: true }))
  const review = { id: receipts.reviewId, user: account, commit_id: authorHead, state: 'COMMENTED',
    html_url: 'https://github.com/' + P.repository + '/pull/937#pullrequestreview-' + receipts.reviewId,
    submitted_at: '2026-10-13T14:00:00Z', body: canonical(reviewRecord) }
  const responses = new Map<string, AppHttpResponse>()
  function set(path: string, body: unknown, status = 200) { responses.set(path, { status, body }) }
  set('/app', application)
  set('/app/installations?per_page=100&page=1', [installation])
  set('/app/installations/' + pins.installationId, installation)
  set(API + '/installation', installation)
  set('/app/installations/' + pins.installationId + '/access_tokens', { token: 'synthetic-installation-only-not-a-real-credential',
    permissions: { ...P.permissions }, repository_selection: 'selected', expires_at: '2026-10-13T16:00:00Z', repositories: [repository] }, 201)
  set('/installation/repositories?per_page=100&page=1', { total_count: 1, repositories: [repository] })
  set(API, repository)
  set(API + '/git/ref/heads/main', { ref: 'refs/heads/main', url: 'https://api.github.com' + API + '/git/refs/heads/main',
    object: { type: 'commit', sha: checkout.mainSha } })
  set(API + '/pulls/937', { number: 937, state: 'closed', merged: true, draft: false,
    merge_commit_sha: checkout.mainSha, merged_at: '2026-10-13T14:30:00Z',
    head: { sha: authorHead, ref: P.branch, repo: { id: P.repositoryId } }, base: { ref: 'main', repo: { id: P.repositoryId } } })
  set(API + '/git/commits/' + checkout.mainSha, { sha: checkout.mainSha, tree: { sha: checkout.treeSha },
    parents: [{ sha: P.baselineMain }, { sha: authorHead }] })
  set(API + '/git/commits/' + authorHead, { sha: authorHead, tree: { sha: checkout.treeSha } })
  set(API + '/pulls/937/reviews?per_page=100&page=1', [review])
  set(API + '/issues/comments/' + P.ownerGrantId, comment(P.ownerGrantId, 917, grant))
  set(API + '/issues/comments/' + receipts.acceptanceId, acceptance)
  set(API + '/issues/comments/' + receipts.unusedId, unused)
  set(API + '/issues/comments/' + receipts.witnessId, witness)
  set(API + '/issues/936/comments?per_page=100&page=1', [acceptance, witness])
  set(API + '/issues/934/comments?per_page=100&page=1', [unused])
  set(API + '/rulesets?includes_parents=true&per_page=100&page=1', rules)
  for (const rule of rules) set(API + '/rulesets/' + rule.id, rule)
  set(API + '/git/ref/' + P.consumedRef.slice(5), { message: 'Not Found' }, 404)
  const calls: AppHttpRequest[] = []
  const signals: AbortSignal[] = []
  async function respond(request: AppHttpRequest, signal: AbortSignal) {
    calls.push(request); signals.push(signal)
    const response = responses.get(request.path)
    if (!response) throw new Error('unexpected_fixture_path')
    return response
  }
  function body(path: string): JsonObject { return responses.get(path)!.body as JsonObject }
  function editRecord(c: typeof witness, change: JsonObject) { c.body = canonical({ ...JSON.parse(c.body), ...change }) }
  return { pins, checkout, receipts, now, respond, responses, body, set, calls, signals, installation,
    application, repository, acceptance, unused, witness, review, rules, editRecord }
}
