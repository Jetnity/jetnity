# Official Truth Bern B-EXECUTOR-APP-1

Date: 2026-10-13. Status at seed: APPROVED / NOT IMPLEMENTED / LIVE B HARD-BLOCKED.
Issue: #936. Operational parent: #934. Product parent: #917.

## 1. Binding authority and baseline

Owner approval: https://github.com/Jetnity/jetnity/issues/934#issuecomment-6146223238
Accepted proposal: https://github.com/Jetnity/jetnity/issues/934#issuecomment-6145959091
Installed-rule TL verification: https://github.com/Jetnity/jetnity/issues/934#issuecomment-6145674655
Prior code-only postmerge: https://github.com/Jetnity/jetnity/issues/934#issuecomment-6145219686
Canonical live index: https://github.com/Jetnity/jetnity/issues/751 (read latest comments too).

The Owner answered “ja” to App setup, bounded permissions, secure custody and necessary independently reviewed code integration, explicitly WITHOUT a real Bern request or additional recurring costs. The approval comment is a TL record of the chat decision, not a fabricated independent Owner API signature. It is not an unused-baseline or consumption receipt.

Verified baseline main: `0b7c5034389f74d32075027109ef506b9e463cd8`, mode NORMAL.
Baseline tree: `4f02945668eeae79c486ccc39a4b5eb44904cfa9`.
Repository ID: `1020187087`; owner Jetnity/User ID: `217454461`.
Branch: `feat/official-truth-bern-executor-app-1`.
PR #935 is already merged and postmerge-verified; do not reopen it or push its branch. Its R5 evidence-correction addendum 5503220444 remains binding history. Earlier attached handoffs stating #935 Draft/ruleset missing are stale.

Read JETNITY_START_HERE.md, TL operating standard, current handoff, ACTIVE_WORK_STATUS and latest #751/#934 checkpoints before work. Live evidence wins. Recheck main/mode/open PRs and relevant #748 MATERIAL. Do not re-audit old completed slices or import research candidates.

## 2. Objective and roles

Deliver a verified, narrowly scoped App-installation authentication path and a concrete secure execution/custody plan, addressing the missing non-admin executor for the first real source. This is ONE integration task with configuration and code lanes, not general database foundation work.

Configuration operator: SAME existing Work browser chat, registration/installation only as in section 3. It must not edit repository files or start coding agents.
Single coding writer: **Jetnity Official Truth Bern Executor App 1 — Codex Generation 1**. New logical task/session, this branch only. No Cursor dispatch. Register actual session evidence without private local-machine paths or session internals. A prompt or task seed is not proof a session started.
TL alone owns arbitration, independent acceptance, Ready and merge. The coding writer may commit/push scoped work, never force push. Immediate review fixes stay in the same writer/session. No automatic follow-up by an agent.

## 3. Configuration lane — authorized now, NO credentials

Inspect the Owner's own App registrations first to avoid duplicates. Preferred name: `Jetnity Bern Research Executor`. Name is a proposal, not an existing identity. If an unrelated global name collision occurs, a unique suffix within GitHub's name limit is allowed; record actual name/slug. If an existing candidate has conflicting permissions/owner/installations, STOP and report rather than modifying an unrelated App.

Register one first-party private GitHub App under the Jetnity account. Homepage may be `https://github.com/Jetnity/jetnity`. Private installation choice: Only on this account. Install ONLY on the selected `Jetnity/jetnity` repository, never All repositories.

Maximum/exact requested repository permissions:
- Contents: write.
- Metadata: read.
- Issues: read.
- Pull requests: read.
All other repository/account/organization permissions: none. In particular NO Administration (including read), Workflows, Actions, Secrets, Deployments, bypass or account authority. Contents-write is repository-level authority, NOT an exact-one-tag token scope.

Webhook Active OFF; no event subscriptions, webhook secret, unattended trigger, OAuth user-authorization request, device flow, callback/setup redirect or marketplace publication. Preserve normal secure login/2FA confirmations. Do not alter organization/repository ownership.

Do NOT click Generate private key or Generate client secret, create a token, run a manifest conversion that returns secrets, download a key into the Work/cloud-browser environment or mint any credential. Register/install without keys only; if GitHub requires a secret-producing step, stop there and preserve the metadata result. Keys are a later gated stage, not a reason to request the same Owner approval again.

Reopen saved registration and installation. Report actual App ID, client ID (identifier only, never client secret), slug, owner, installation ID, selected repository ID/name, complete permission map, webhook/OAuth settings and visibility. Never guess unavailable IDs; provide the authoritative settings/installation links and explain UI-only vs API proof. No publication of unrelated accounts or sensitive personal metadata. No rule or tag changes.

## 4. Coding lane — secure runtime discovery and complete dormant integration

Inspect the EXISTING local developer validation/runtime facilities available to the coding session without reading credentials. Determine whether a controlled runtime can keep App credentials outside the repo, source mounts, caches, public artifacts, cloud-synced folders and ordinary chat tooling. Do not assume the prior disposable test container is a persistent secret store. Do not inspect unrelated personal files.

Produce a concrete custody/transfer report using non-sensitive logical locations: storage/access controls, local-vs-cloud boundary, key import method, dedicated minimal runtime environment, log/error redaction, lifecycle/revocation, backups and who can access the signer. Prefer an existing suitable signing/secret store; do not purchase or create cloud infrastructure. Do not claim a plain file is a non-exportable vault. If a local protected file is proposed, explicitly cover restrictive permissions, symlink/path checks, no sync/repo inclusion and residual host-admin access. Synthetic temporary key material may be used in offline tests; it must never be registered with GitHub or committed as a real credential.

**No real key generation/read/import/token mint until TL accepts this concrete runtime/custody report and the relevant code.** The Owner permission exists; the remaining checkpoint is technical safety verification. Report an unavailable runtime honestly rather than fetching secrets through another tool. Code implementation with synthetic data can proceed while Work obtains non-secret IDs.

Build a developer-only, separately named App-installation preflight/credential boundary, not a public App/API route. Keep the old ordinary-User verifier intact; do not weaken it into a generic bot/Owner-token allowance. Live Bern entry and old CLI stay hard-blocked.

### Required authentication contract

1. Separate App identity from user identity. An installation token must originate in the reviewed App-authenticated exchange; arbitrary supplied bearer strings, token prefixes, unsigned decoded JWT fields, a bot name or fixture IDs are not proof. No fallback to gh auth/Owner PAT/GITHUB_TOKEN/GH_TOKEN or user OAuth tokens. Production credentials cannot be injected through test-only seams.
2. Authenticate the App and its installation against official GitHub API responses. Validate actual pinned App/installation/owner/repository identities, unsuspended state, selected-only installation, and the complete maximum permission map. Reject unexpected granted privileges. Pin real configuration only after independent TL readback of Work's result; absent configuration remains unconfigured, never a fixture-based success.
3. Request any later installation token for ONLY repository ID1020187087 and the approved permission subset. Verify response permissions/repositories where returned, bounded expiry and the repositories actually accessible through the issued token. Do not log/return the token or private key. An ordinary User token/Owner identity cannot substitute. Live minting is disabled until the custody gate; tests are offline.
4. Preserve original Owner A+B grant verification and distinct execution/unused authority. Introduce a separately versioned App preflight contract. Bind it to the current reviewed integration PR/author tree/actual merged main and authenticated TL receipt, not a caller-picked arbitrary SHA. The current #935-only merge equality cannot remain as the new integration's sole main check, nor can it simply be deleted. All later changed heads require re-gating. An App preflight PASS is NOT an execution capability or ATTEMPT_CONSUMED receipt.
5. Preserve installed ruleset24998411 exact ref, active enforcement, update/deletion restrictions, no creation restriction/extra rules and no bypass. Main rule21875372 must stay unchanged. GitHub may omit bypass details for the App; **missing is not empty**. Support only an explicitly authenticated fresh TL/Owner protection witness when the executor cannot observe those fields, with exact repository/App/installation/ruleset IDs, observed policy/version/time, reviewed main and expiry. Recheck all App-visible current fields/version against that witness and reject mismatch, stale/edited/foreign witness, incomplete inventory or ambiguous data. Do not put Owner/admin credentials in the execution runtime or grant the App Administration to read hidden fields. The witness retains a trusted-administrator assumption and does not prove immutable governance. Before accepting this contract, TL must review its precise implementation and custody/freshness limitations. If these facts cannot be proved, return BLOCKED rather than success.
6. Fixed `api.github.com` HTTPS443 GitHub-only transport, strict TLS/certificate validation, no redirect follow, bounded full JSON/UTF-8 framing and cancellation/timeouts. Request methods/endpoints are a small closed allowlist for App identity, installation identity, scoped token exchange and required read-only evidence. No arbitrary URL, proxy/header injection, generic write endpoint, rule edit, git ref writer or Bern request. GitHub App JWT/token exchange is distinct from the protected Bern source transport; no alternate Bern HTTP stack.
7. No executable create-ref or source invocation in this task. Simulation may verify the future global one-shot interface, but must not claim deployed uniqueness. No real consumed tag, temporary substitute tag or write-denial test. Public site, CI, Preview, build and module import must never mint a token or contact Bern.

## 5. Owned paths and protected boundaries

Code/test additions allowed under:
- `lib/readiness/official-truth-bern-executor-app-1/`
- `scripts/official-truth-bern-executor-app-1/`
- `docs/OFFICIAL_TRUTH_BERN_EXECUTOR_APP_1_*_2026-10-13.md`
- sanitized evidence under `docs/evidence/official-truth-bern-executor-app-1/`

Use a small cohesive implementation; do not add another general platform or duplicate the existing entire authorization system. Existing read-only helpers may be reused where their contract fits. Shared-code refactoring requires exact blob/line-level proposed diff and TL arbitration BEFORE applying it. Existing code-only source and legacy verifier are reference/read-only by default.

Specifically preserve `lib/readiness/official-truth-server-owned-retrieval.ts` baseline blob5998fdea54d3337fb68cd7111460b59e43a3cef7 and its live refusal, all official loaders/transport/size guards, `lib/readiness/official-truth-bern-g3-rq-fetch-1/authorization.ts` blob9ef5d6c420124987cfbefd4278ca70f103f3e022, old `scripts/official-truth-bern-g3-rq-fetch-1/run.ts` and `github-read.ts` (reader blob2784a3afc2fb5176b14bf90e2c1328832abf696a). No original TASK/grant/history rewrites.

No package/lockfile/workflow/config/app-route changes by default; prefer existing packages and Node built-ins. If an actual required change lies outside owned paths, post the minimal exact diff, reason and regression evidence for TL, not an open-ended permission request. Docs-only metadata coordination does not permit repository-security changes.

## 6. Acceptance and tests

A01 Registration/installation metadata matches exact scope; real IDs independently verified. No credentials accidentally generated by Work. Treat UI-only proof honestly.
A02 Concrete runtime/custody accepted BEFORE real secrets; no paid service, real secret or privacy-sensitive metadata in evidence. Demonstrate with synthetic credentials/temporary isolated resources only until acceptance.
A03 App/installation identity, repository selection and permission checks deny wrong App/owner/installation/repository, all-repo or extra-repo access, suspension, wider privileges, supplied User/Owner tokens, missing/unknown/malformed evidence.
A04 Token boundary tests cover scope/expiry, wrong-key/mismatched identity, redaction of request/response/error paths and cleanup; no network during tests. Module import/build/test/Preview cannot mint credentials.
A05 Protection witness tests cover omitted bypass field, explicit bypass, changed policy/update time, incomplete pagination, wrong observer/issue/IDs/main, stale/edited/duplicate/ambiguous receipt and injected truth. Missing privileged data must not pass without the separately validated witness.
A06 Reviewed-main binding works with the new integration's real merge contract, rejects historical #935-only success and changed/unreviewed heads. Fixtures are never live identity configuration.
A07 Both direct and CLI Bern live entries remain blocked; no real ref writer/source fetch/public-provider activation. Existing source transport/trust/65536 default/131072 Bern cap/10s/no-follow and global-claim simulation remain unchanged.
A08 Fresh task tests plus full prescribed suite: setup/mode/typecheck/lint/tests, native PG16 M1–M4 with unchanged240s, schema/API/dead/exports/deps and build. Exact-HEAD original GitHub Verify/Auth logs, matching Preview and testmerge tree relationship; no old-head success substitution. Local vs CI evidence must be distinguished.
A09 Independent TL exact-head security/code review and thread disposition before Ready/SHA-locked merge. If merged, actual main-push original Verify/Auth and Production alias readback before engineering completion. Do not label this code-only result a full executor or product PASS.
A10 After accepted custody/code and independently confirmed App IDs, TL may explicitly sequence approved secure key provisioning and authenticated GitHub-only preflight within this issue. No B, no one-shot consumption and no additional cost. If those operational steps remain unperformed, report them OPEN, not completed by mocks.

## 7. Deliverables and stop

One coherent implementation with concise PLAN, runtime/custody report, REPORT/SELF_REVIEW/STATUS/HANDOFF and sanitized evidence. Preserve full test logs privately as appropriate; public summaries may not contain secret values, local usernames/absolute private paths, government HTML or source hashes. Record exact author HEAD/tree/parent, actual changed paths, immutable task blob, merge-base/ahead/behind and fresh original CI/Preview IDs. No self-referential final commit hash in its own commit.

Work registration may run in parallel with code/runtime inspection because it writes no branch. Report App IDs back to TL; do not edit a coding writer's branch from Work. One coding writer only. Do not ask the Owner to reapprove this same scope; routine choices belong to TL. A real missing capability/unsafe custody/new permission/new cost is a concrete stop, not a justification for an unsafe substitute.

**DO NOT mark Ready. DO NOT merge. DO NOT start a follow-up slice. STOP for independent TL review and any still-needed custody/protected gate.**

#934 and #917 stay OPEN. SOURCE_NOT_QUALIFIED, Provider NULL, Visa UNKNOWN. This task is NOT historical non-use attestation, live-B activation, source/evidence/rule admission, raw-source retention approval, hosted migration/Auth/RLS/security-key rollout, Production functionality launch or a paid service. #913 safety block, P2 native-PG timing variance and G7 19 advisories remain unchanged.

## 8. Primary API references verified by TL on 2026-10-13

- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
- https://docs.github.com/en/rest/apps/apps
- https://docs.github.com/en/rest/apps/installations
- https://docs.github.com/en/rest/repos/rules#get-a-repository-ruleset

These describe API mechanics, not proof of our actual installation, effective token or runtime. Check actual response schemas; never infer omitted security facts.
