import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { APP_API as API, APP_POLICY as P, AppBlocked, canonical, type JsonObject } from './policy'
import { simulateAppPreflightForTests } from './authentication'
import { appFixture } from './fixture'
import { bernAppCustodyGate, bernAppDeveloperPreflight } from '../../../scripts/official-truth-bern-executor-app-1/run'
import { liveAppTransport } from '../../../scripts/official-truth-bern-executor-app-1/github'

type Fixture = ReturnType<typeof appFixture>
const exchange = '/app/installations/90002/access_tokens'
const rulesPath = API + '/rulesets?includes_parents=true&per_page=100&page=1'
const installationRepos = '/installation/repositories?per_page=100&page=1'
const mainPath = API + '/git/ref/heads/main'
const prPath = API + '/pulls/937'
const cases: [string, (f: Fixture) => void][] = [
  ['wrong app', f => { f.application.id++ }],
  ['wrong slug', f => { f.application.slug = 'foreign-app' }],
  ['wrong client ID', f => { f.application.client_id = 'Iv1.otherfixture' }],
  ['wrong app owner', f => { f.application.owner.id++ }],
  ['app is bot owned', f => { f.application.owner.type = 'Bot' }],
  ['app events', f => { f.body('/app').events = ['push'] }],
  ['app permissions missing', f => { delete f.body('/app').permissions }],
  ['wrong installation', f => { f.installation.id++ }],
  ['wrong installation app', f => { f.installation.app_id++ }],
  ['wrong installation slug', f => { f.installation.app_slug = 'other' }],
  ['installation belongs to org', f => { f.installation.target_type = 'Organization' }],
  ['wrong installation target', f => { f.installation.target_id++ }],
  ['all repositories', f => { f.installation.repository_selection = 'all' }],
  ['suspended', f => { f.body(API + '/installation').suspended_at = '2026-10-13T10:00:00Z' }],
  ['suspension unknown', f => { delete f.body(API + '/installation').suspended_by }],
  ['installation event', f => { f.body(API + '/installation').events = ['issues'] }],
  ['foreign exchange URL', f => { f.installation.access_tokens_url = 'https://other.example/token' }],
  ['second installation', f => { f.set('/app/installations?per_page=100&page=1', [f.installation, { ...f.installation, id: 9 }]) }],
  ['missing installation', f => { f.set('/app/installations?per_page=100&page=1', []) }],
  ['installation inventory pagination', f => { f.responses.set('/app/installations?per_page=100&page=1', { status: 200, body: [f.installation], link: 'next' }) }],
  ['arbitrary supplied token', f => { f.body(exchange).token = 'ghp_this_is_only_a_synthetic_user_token' }],
  ['token newline', f => { f.body(exchange).token = 'synthetic\r\nInjected: value' }],
  ['exchange omitted permissions', f => { delete f.body(exchange).permissions }],
  ['exchange all scope', f => { f.body(exchange).repository_selection = 'all' }],
  ['exchange extra repo', f => { f.body(exchange).repositories = [f.repository, { ...f.repository, id: 7 }] }],
  ['exchange wrong repo', f => { f.body(exchange).repositories = [{ ...f.repository, id: 7 }] }],
  ['token expired', f => { f.body(exchange).expires_at = '2026-10-13T14:59:59Z' }],
  ['token expires during preflight', f => { f.body(exchange).expires_at = '2026-10-13T15:01:00Z' }],
  ['token expiry excessive', f => { f.body(exchange).expires_at = '2026-10-13T17:00:00Z' }],
  ['malformed expiry', f => { f.body(exchange).expires_at = 'tomorrow' }],
  ['accessible extra repository', f => { f.set(installationRepos, { total_count: 2, repositories: [f.repository, { ...f.repository, id: 7 }] }) }],
  ['accessible count mismatch', f => { f.body(installationRepos).total_count = 2 }],
  ['accessible empty', f => { f.set(installationRepos, { total_count: 0, repositories: [] }) }],
  ['wrong repo ID', f => { f.repository.id++ }],
  ['wrong repo name', f => { f.body(API).full_name = 'other/repo' }],
  ['dirty checkout', f => { f.checkout.clean = false }],
  ['old 935 baseline main', f => { f.checkout.mainSha = P.baselineMain }],
  ['arbitrary main', f => { f.checkout.mainSha = 'd'.repeat(40) }],
  ['wrong local tree', f => { f.checkout.treeSha = 'd'.repeat(40) }],
  ['main not commit', f => { (f.body(mainPath).object as JsonObject).type = 'tag' }],
  ['unmerged PR', f => { f.body(prPath).merged = false }],
  ['draft PR', f => { f.body(prPath).draft = true }],
  ['historical PR935 only', f => { f.body(prPath).number = 935 }],
  ['foreign PR branch', f => { (f.body(prPath).head as JsonObject).ref = 'other' }],
  ['changed author head', f => { (f.body(prPath).head as JsonObject).sha = 'e'.repeat(40) }],
  ['merge tree drift', f => { f.body(API + '/git/commits/' + f.checkout.mainSha).tree = { sha: 'e'.repeat(40) } }],
  ['different merge base', f => { f.body(API + '/git/commits/' + f.checkout.mainSha).parents = [{ sha: 'e'.repeat(40) }, { sha: 'c'.repeat(40) }] }],
  ['dismissed review', f => { f.review.state = 'DISMISSED' }],
  ['review wrong head', f => { f.review.commit_id = 'e'.repeat(40) }],
  ['review wrong URL', f => { f.review.html_url += '1' }],
  ['review unapproved', f => { f.review.body = canonical({ ...JSON.parse(f.review.body), independentCodeSecurityApproved: false }) }],
  ['review changed body', f => { f.review.body = canonical({ ...JSON.parse(f.review.body), extra: true }) }],
  ['review wrong ID', f => { f.receipts.reviewId++ }],
  ['review duplicate', f => { f.set(API + '/pulls/937/reviews?per_page=100&page=1', [f.review, { ...f.review, id: 80009 }]) }],
  ['no postmerge acceptance', f => { f.editRecord(f.acceptance, { postmergeVerified: false }) }],
  ['acceptance wrong pins', f => { f.editRecord(f.acceptance, { appId: 5 }) }],
  ['installation extra selected repo in readback', f => { f.editRecord(f.acceptance, { selectedRepositoryIds: [P.repositoryId, 6] }) }],
  ['non-private app readback', f => { f.editRecord(f.acceptance, { privateApp: false }) }],
  ['oauth app readback', f => { f.editRecord(f.acceptance, { userOAuthEnabled: true }) }],
  ['webhook readback', f => { f.editRecord(f.acceptance, { webhookActive: true }) }],
  ['owner grant changed', f => { f.body(API + '/issues/comments/' + P.ownerGrantId).body = 'yes' }],
  ['owner grant edited', f => { f.body(API + '/issues/comments/' + P.ownerGrantId).updated_at = '2026-10-13T15:01:00Z' }],
  ['no unused attestation', f => { f.editRecord(f.unused, { initialUnusedAttested: false }) }],
  ['User substitutes for App', f => { f.editRecord(f.unused, { executionIdentity: 'User' }) }],
  ['Owner substitutes for App', f => { f.editRecord(f.unused, { executionIdentity: 'Owner' }) }],
  ['consumed receipt substitutes for unused', f => { f.editRecord(f.unused, { recordType: 'G3_RQ_FETCH_1_ATTEMPT_CONSUMED' }) }],
  ['witness wrong observer', f => { f.editRecord(f.witness, { observerId: 9 }) }],
  ['witness wrong observer role', f => { f.editRecord(f.witness, { observerRole: 'App' }) }],
  ['witness wrong main', f => { f.editRecord(f.witness, { reviewedMain: 'd'.repeat(40) }) }],
  ['witness wrong installation', f => { f.editRecord(f.witness, { installationId: 9 }) }],
  ['witness incomplete inventory', f => { f.editRecord(f.witness, { inventoryComplete: false }) }],
  ['witness excludes parents', f => { f.editRecord(f.witness, { includesParents: false }) }],
  ['witness missing bypass observation', f => { const r = JSON.parse(f.witness.body); delete r.policies[0].bypassActors; f.witness.body = canonical(r) }],
  ['witness stale', f => { f.now += 300_000 }],
  ['witness future', f => { f.editRecord(f.witness, { observedAt: '2026-10-13T15:00:31Z' }) }],
  ['witness long TTL', f => { f.editRecord(f.witness, { expiresAt: '2026-10-13T15:10:00Z' }) }],
  ['witness edited', f => { f.witness.updated_at = '2026-10-13T15:00:01Z' }],
  ['witness wrong issue', f => { f.witness.issue_url = 'https://api.github.com' + API + '/issues/934' }],
  ['witness duplicate keys', f => { f.witness.body = f.witness.body.replace('{', '{"recordType":"forged",') }],
  ['witness fragment with prose', f => { f.witness.body = 'Approved! ' + f.witness.body }],
  ['witness duplicate receipt', f => { f.set(API + '/issues/936/comments?per_page=100&page=1', [f.acceptance, f.witness, { ...f.witness, id: 80010 }]) }],
  ['witness absent from inventory', f => { f.set(API + '/issues/936/comments?per_page=100&page=1', [f.acceptance]) }],
  ['witness identity alias', f => { f.receipts.witnessId = f.receipts.acceptanceId }],
  ['rules inventory extra', f => { f.set(rulesPath, [...f.rules, { id: 8 }]) }],
  ['rules inventory missing', f => { f.set(rulesPath, [f.rules[1]]) }],
  ['rules inventory duplicate', f => { f.set(rulesPath, [f.rules[1], f.rules[1]]) }],
  ['rules pagination', f => { f.responses.set(rulesPath, { status: 200, body: f.rules, link: 'next' }) }],
  ['100 rules uncertain completeness', f => { f.set(rulesPath, Array.from({ length: 100 }, (_, n) => ({ id: n + 1 }))) }],
  ['tag creation restriction', f => { f.body(API + '/rulesets/24998411').rules = [{ type: 'creation' }, { type: 'update' }, { type: 'deletion' }] }],
  ['tag wildcard', f => { f.body(API + '/rulesets/24998411').conditions = { ref_name: { include: ['refs/tags/*'], exclude: [] } } }],
  ['rule disabled', f => { f.body(API + '/rulesets/24998411').enforcement = 'disabled' }],
  ['tag bypass explicit', f => { f.body(API + '/rulesets/24998411').bypass_actors = [{ actor_id: 90001, actor_type: 'Integration', bypass_mode: 'always' }] }],
  ['unknown bypass null', f => { f.body(API + '/rulesets/24998411').bypass_actors = null }],
  ['executor can bypass', f => { f.body(API + '/rulesets/24998411').current_user_can_bypass = 'always' }],
  ['changed tag version', f => { f.body(API + '/rulesets/24998411').updated_at = '2026-10-13T15:00:01Z' }],
  ['changed main policy', f => { f.body(API + '/rulesets/21875372').rules = [] }],
  ['changed main version', f => { f.body(API + '/rulesets/21875372').updated_at = '2026-10-13T15:00:01Z' }],
  ['main bypass', f => { f.body(API + '/rulesets/21875372').bypass_actors = [{ actor_id: 9 }] }],
  ['missing rule version', f => { delete f.body(API + '/rulesets/24998411').updated_at }],
  ['consumed tag exists', f => { f.set(API + '/git/ref/' + P.consumedRef.slice(5), { ref: P.consumedRef }) }],
  ['ambiguous absence', f => { f.set(API + '/git/ref/' + P.consumedRef.slice(5), {}, 404) }],
]
for (const scope of ['/app', API + '/installation', exchange]) {
  for (const privilege of ['administration', 'actions', 'workflows', 'secrets', 'deployments', 'members']) {
    cases.push([scope + ' rejects privilege ' + privilege, f => {
      (f.body(scope).permissions as JsonObject)[privilege] = 'read'
    }])
  }
}

test('complete synthetic protocol proves no live authentication or capability', async () => {
  const f = appFixture()
  assert.equal((await simulateAppPreflightForTests(simulation(f))).status, 'SYNTHETIC_PREFLIGHT_PASS')
  assert.equal(f.calls.filter(r => r.method === 'POST').length, 1)
  assert.deepEqual(f.calls.find(r => r.method === 'POST')?.body, { repository_ids: [P.repositoryId], permissions: P.permissions })
  assert.ok(f.calls.every(r => !r.path.includes('/user') && !r.path.includes('/git/refs')))
  assert.ok(f.signals.length > 0 && f.signals.every(s => s.aborted))
})
// Supply only the harness contract, never the fixture's inspection helpers.
function simulation(f: Fixture) { return { pins: f.pins, checkout: f.checkout, receipts: f.receipts, now: f.now, respond: f.respond } }
for (const [name, mutate] of cases) test('deny: ' + name, async () => {
  const f = appFixture(); mutate(f)
  const r = await simulateAppPreflightForTests(simulation(f))
  assert.equal(r.status, 'BLOCKED', name)
  assert.equal(r.liveAuthenticated, false)
  assert.equal(r.executionCapability, false)
  assert.equal(r.attemptConsumed, false)
})

test('missing privileged fields accepted only through complete authenticated synthetic witness', async () => {
  const f = appFixture()
  for (const id of [P.mainRuleId, P.tagRuleId]) {
    delete f.body(API + '/rulesets/' + id).bypass_actors
    delete f.body(API + '/rulesets/' + id).current_user_can_bypass
  }
  assert.equal((await simulateAppPreflightForTests(simulation(f))).status, 'SYNTHETIC_PREFLIGHT_PASS')
  f.set(API + '/issues/comments/' + f.receipts.witnessId, {}, 404)
  assert.equal((await simulateAppPreflightForTests(simulation(f))).status, 'BLOCKED')
})
test('wrong cryptographic signing key fails before any response is trusted', async () => {
  const f = appFixture()
  assert.equal((await simulateAppPreflightForTests({ ...simulation(f), wrongSigningKey: true })).status, 'BLOCKED')
  assert.equal(f.calls.length, 0)
})
test('supplied credentials cannot enter the simulation', async () => {
  const f = appFixture()
  const input = { ...simulation(f), token: 'synthetic-user-token' }
  assert.equal((await simulateAppPreflightForTests(input)).status, 'BLOCKED')
  assert.equal(f.calls.length, 0)
})
test('errors, response tokens and synthetic key material are absent from results', async () => {
  const f = appFixture()
  const result = await simulateAppPreflightForTests({ ...simulation(f), respond: async () => {
    throw new Error('synthetic-private-key-and-token-canary')
  } })
  assert.equal(result.status, 'BLOCKED')
  assert.ok(!JSON.stringify(result).includes('canary'))
  const branded = await simulateAppPreflightForTests({ ...simulation(f), respond: async () => {
    throw new AppBlocked('synthetic-private-key-and-token-canary')
  } })
  assert.equal(branded.reason, 'github_unverifiable')
})
test('witness expiring while policy reads are in flight blocks at completion', async () => {
  const f = appFixture()
  f.editRecord(f.witness, { expiresAt: '2026-10-13T15:00:30.050Z' })
  const result = await simulateAppPreflightForTests({ ...simulation(f), respond: async (r, s) => {
    if (r.path === API + '/rulesets/24998411') await new Promise(resolve => setTimeout(resolve, 70))
    return f.respond(r, s)
  } })
  assert.equal(result.status, 'BLOCKED'); assert.equal(result.reason, 'witness_stale')
})
test('second evidence snapshot detects edited witness after the first check', async () => {
  const f = appFixture(); let n = 0
  const result = await simulateAppPreflightForTests({ ...simulation(f), respond: async (r, s) => {
    if (r.path === API + '/issues/comments/' + f.receipts.witnessId && ++n === 2) f.witness.updated_at = '2026-10-13T15:00:01Z'
    return f.respond(r, s)
  } })
  assert.equal(result.status, 'BLOCKED')
})
test('a stalled exchange aborts and is never retried', { timeout: 8000 }, async () => {
  const f = appFixture(); let attempts = 0; let signal: AbortSignal | undefined
  const r = await simulateAppPreflightForTests({ ...simulation(f), respond: async (request, s) => {
    signal = s
    if (request.method === 'POST') { attempts++; return new Promise(() => {}) }
    return f.respond(request, s)
  } })
  assert.equal(r.status, 'BLOCKED'); assert.equal(attempts, 1); assert.equal(signal?.aborted, true)
})
test('production entry and second custody gate reject all configuration/credential attempts', () => {
  for (const args of [[], ['--preflight'], ['--app-id=90001'], ['--token=synthetic'], ['--execute-owner-approved-once']]) {
    const r = bernAppDeveloperPreflight(args)
    assert.equal(r.exitCode, 2); assert.equal(r.report.status, 'BLOCKED'); assert.equal(r.report.appId, null)
    assert.equal(r.report.credentialRead, false); assert.equal(r.report.credentialMinted, false)
  }
  assert.equal(bernAppCustodyGate().reason, 'custody_and_code_not_accepted')
  assert.throws(() => liveAppTransport(), /custody_and_code_not_accepted/)
})
test('ordinary module import and actual developer CLI cannot mint or contact Bern', () => {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'production',
    GH_TOKEN: 'synthetic-forbidden-token', GITHUB_TOKEN: 'synthetic-forbidden-token' }
  const child = spawnSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx',
    'scripts/official-truth-bern-executor-app-1/run.ts', '--preflight'], { env, encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 2); assert.equal(child.stderr, '')
  const report = JSON.parse(child.stdout)
  assert.equal(report.reason, 'identity_unconfigured'); assert.equal(report.credentialRead, false)
  assert.ok(!child.stdout.includes('synthetic-forbidden-token'))
})
test('protected original authorizer, reader, CLI and source retain their immutable blobs', () => {
  for (const [path, blob] of [
    ['lib/readiness/official-truth-server-owned-retrieval.ts', '5998fdea54d3337fb68cd7111460b59e43a3cef7'],
    ['lib/readiness/official-truth-bern-g3-rq-fetch-1/authorization.ts', '9ef5d6c420124987cfbefd4278ca70f103f3e022'],
    ['scripts/official-truth-bern-g3-rq-fetch-1/github-read.ts', '2784a3afc2fb5176b14bf90e2c1328832abf696a'],
    ['scripts/official-truth-bern-g3-rq-fetch-1/run.ts', 'a31766ea91bb7cb1dd3c7c70d4d7bf6ca17163dd'],
  ]) {
    const bytes = readFileSync(path!)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), blob)
  }
})
