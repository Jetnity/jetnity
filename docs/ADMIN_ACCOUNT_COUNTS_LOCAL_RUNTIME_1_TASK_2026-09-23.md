# Admin Account Counts Local Runtime 1 — Binding Task v1

Date: 23 September 2026. TL-owned immutable task and interface; agents must not rewrite it.
Agent: **Jetnity admin account counts local runtime 1**, **Generation 1**, NEW dedicated session.
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto or substitution. Report actual session/model; no invented UI rename.
Branch: `test/admin-account-counts-local-runtime-1`.
Exact product/integration baseline: **fa7f651c023eb361fb142cbb931bc702f3a3d213**, NORMAL.

## 1. Why this is the next bounded work

PO: “Ok weiter. Du kannst mehrere Agenten einsetzen wenn es geht.” TL selects the actual executable local acceptance workflow, not another general audit. #557 caller-status protection is CLOSED/MERGED/POST-MERGE VERIFIED (TL5290676242; closure #512 comment5794518007). #556 is closed ONLY for safe preflight/helper/blocked-environment evidence; actual stack/Auth/login/TOTP/Admin execution is NOT IMPLEMENTED/NOT RUN. Do not restart completed #550/#552/#551/#553/#554/#555/#556/#557 sessions.

Live precheck: mainfa7f651c; CI35858174804 jobs107171614113/107171614367 SUCCESS; connected Production dpl_DuQWxYEJeYuybstq88kVBPMPDYnK READY exactfa7. Fresh TL read-only catalog: PG17.6, reporting schema/inner producer/public wrapper ABSENT, latest migration20260917120000 account_visits. No user rows/counts or hosted mutation. Open old Drafts #52/#50/#40/#39/#28 are historical, not writers. Machine NORMAL is authoritative over old issue440 HOLD prose. No new relevant #512 comment after closure at dispatch precheck.

Read JETNITY_START_HERE.md, operating-mode, TL/Cursor and Multi-Agent Slice Planning standards, latest #512 live checkpoint, and relevant accepted code. The four central startup docs still contain dated #551 observations: live closures above supersede them. Build-order fit: finish an existing V1 Account/Operations acceptance gap. No product/business/Provider order change.

## 2. Outcome and exclusive ownership

Implement executable Node modules that create, verify, use and safely tear down ONE isolated local test environment containing actual managed Supabase Auth + Postgres/PostgREST and the unchanged Jetnity application. Own runtime setup, source identity, actual fixture provisioning, transparent server-side RPC observation and final orchestration/cleanup. The parallel browser-flow agent owns UI scenario code under a separate directory; §4 freezes the interface before either starts.

WRITE ONLY:
- `scripts/e2e/admin-account-counts-local-runtime-1/**` (entrypoint `run.mjs`, supporting runtime modules, local tooling manifest, focused tests, README and ignore rules).
- Own `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-23.md`.
- New sanitized receipts in `docs/evidence/admin-account-counts-local-runtime-1/`.

READ ONLY: product app/components/lib/types; all migrations and canonical config; package.json/lock/CI; all existing scripts/db proofs and #556 fallback files; browser-flow agent files; central docs; historical receipts. Reuse/import suitable existing #556 environment, source-manifest, TOTP/lifecycle and gate helpers after assessing actual fitness. Do not copy the entire fallback into a second framework. New modules implement genuinely missing execution capabilities; no placeholder stack/fixture/observer function can be called implemented. A necessary change outside ownership is a concrete TL dependency, not permission to widen scope.

## 3. Runtime acceptance and safety

### Tooling, platform and source
- Node22 and repository-locked dependencies, including existing Playwright; no root dependency upgrade. Support Linux x64 and eventual macOS arm64 in code, without claiming execution on untested systems.
- Supabase CLI **v2.117.0** is the selected bounded local tooling candidate. TL verified the official stable release tag via `https://api.github.com/repos/supabase/cli/releases/tags/v2.117.0` (release384221143; non-prerelease). Use verified official archive/checksum identity, observed `--version` AND relevant `--help`, not PATH presence or an invented permit. Darwin arm64 archive API digest at precheck: `c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b`; verify fresh release checksum content and platform assets before using. If mismatch/incompatibility, report BLOCKED; never silently switch versions. This is not a blanket permit to download/execute arbitrary binaries.
- Tool acquisition, if needed, is one bounded official hash-checked download into run-owned tooling, never apt/system configuration, curl-pipe-shell, unpinned npx/latest, Docker installation or daemon privilege changes. Existing locked npm installation is unchanged. No hosted credentials or Management API access.
- One read-only capability check in this VM. Docker absent means execution BLOCKED, not stop implementing the actual supported path. Do not retry container installation. A real runtime rehearsal may run only if an already-working LOCAL Docker daemon and verified tooling satisfy all isolation checks. At most one bounded real runtime rehearsal per delivery; no retry loop.
- Dedicated private HOME/config/cache, rebuilt allowlisted child env, and explicit local-only Docker socket/context. Do not inherit remote Docker context, connection/provider/model/SMTP keys, NODE_OPTIONS/preload, .env files or authenticated cloud configuration. The repo's SQL/auth convenience commands can target hosted systems: DO NOT invoke them.
- Verify a clean exact product tree against baseline before execution. Include caller-status module, reader, SQL, shared Auth/client/UI, config, full migration inventory, package/lock and middleware/config execution inputs. Never calculate expected pins from a dirty target. Do not treat `git show HEAD:path` alone as actual worktree identity. A dedicated temporary application checkout/copy must contain the verified bytes and no inherited .env files or reused .next output.

### Local services, schema and fixture preparation
- Official CLI-managed local stack, Postgres17 as in accepted config. Do not assume Compose/Kong/Envoy defaults or old Auth schema. Read current official release/help and changelog relevant to CLI/API gateway, API_EXTERNAL_URL and managed schema differences.
- Before launching any listener, configure loopback-only host publication for every owned service; a localhost URL alone is not proof. Verify the Docker network/port plan before start and actual bindings afterward. Refuse any 0.0.0.0/::/remote bind; do not briefly expose it and then call stopping it isolation. One run-owned project/network/volume set; no global/default-project reset, prune or stop.
- Replay the actual committed migration history into the full managed local Auth/catalog, with repository seed disabled only in a disclosed temporary overlay. Keep password, confirmation, TOTP/MFA, anonymous-sign-in and security semantics unchanged. Never overlay the reduced #550 auth.users bootstrap, replace global authorization helpers with permissive stubs, skip a failing migration silently, or reuse a hosted schema/data dump. A replay issue must name the exact file and prerequisite and remain BLOCKED.
- Install the already-reviewed #557 producer plus unchanged wrapper only into that run-owned local database. Source SHA256 must remain `612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de` / `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb`. Verify definitions/owner/ACL/catalog in this actual engine. Do not loosen #555 PG16 fingerprint checks or call a local PG17 observation hosted parity. No canonical migration is created.
- Provision synthetic actors through local GoTrue Admin API, not direct inserts into managed identity/session/MFA tables. Pre-confirmed synthetic accounts are fixture setup, not registration/email-flow proof. Use local generated secrets only. Assign persisted profile roles/status using a narrowly scoped fixture administrator connected to the exact owned DB. Accounts: owner, moderator, ordinary user, creator. Never expose fixture admin credentials to app/browser contexts.
- Count scenarios operate only on run-owned fixture users: all counted fixtures older than 720h gives zero recent; one newly created synthetic account gives a known +1/+1 delta. Any controlled created_at adjustment is explicitly fixture-only and must not alter identity/password/session claims. Derive expected present/window counts independently with a bounded local SELECT, not by calling the producer under test. Record fixture labels/counts, no secrets/real identities.
- Launch unchanged Jetnity with the existing local-only activation and authenticated client, using the SAME effective loopback URL for real server/browser traffic. ON and OFF runs use controlled owned app restarts and fresh build/runtime state; no environment snapshot trick, guard bypass or code patch.

### Observation, limits and teardown
- Transparent loopback forwarding observer at the actual app-to-Supabase HTTP boundary. Preserve actual request/response/authentication semantics; never substitute success/error bodies. Record only sanitized path, method, status, counters and completeness, never authorization/cookie headers, query/body secrets or tokens. A positive real server-side observed RPC control is required before OFF/no-call can be asserted. Page-only request events cannot prove server-side silence.
- Runtime default is a safe preflight/no-start command. Real execution requires an explicit local-only CLI mode; no caller-supplied success boolean/tooling bypass. `--runtime-only` may validate setup but cannot report full acceptance. Full mode must load the fixed sibling browser module (§4); absent module means NOT_IMPLEMENTED, never a successful empty flow.
- Total real runtime wall-clock budget at most 15 minutes, one app/stack and serial browser sessions. Timeouts/budgets for subprocesses, HTTP, navigation, drain, close and cleanup. No paid call or extra hosted runner. Report measured resources if available; no invented 16GB/Mac performance claim.
- Register ownership before fallible work; try/finally across setup, browser, abort and evidence write. Track actual browser/process exit, Docker containers/services/networks/volumes separately. CLI process exit is NOT service teardown. Kill only owned processes; never pkill/global prune; never delete directories while termination/ownership is unknown. Retain resources with explicit recovery instructions if safe removal cannot be proved.
- Overall status precedence: cleanup/ownership failure FAIL, then failed mandatory gate FAIL, then missing environment/dependency BLOCKED/NOT_RUN. Full acceptance only if every mandatory G0–G20 gate actually passed in the real integrated run. Unit/double PASS is a different field, not fullLocalExecution. Evidence serialization must whitelist fields and refuse secret-bearing outputs. Historical receipts must never be overwritten.

## 4. Frozen two-lane interface — TL authority, v1

This section is the same exact interface for both agents. Propose an amendment to TL if inadequate; neither agent changes it unilaterally. The runtime agent implements context, the browser agent implements the consumer. No dependency on unmerged sibling CODE for initial implementation.

Browser entrypoint (sibling-owned):
`export async function runBrowserFlows(context)` in `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`.
It returns `{ contractVersion, gates }`, where `contractVersion` is exactly **jetnity.account-counts.local-acceptance.v1** and gates cover G6–G19 from the existing #556 GATE_IDS. Each gate: `{ id, result: 'PASS'|'FAIL'|'BLOCKED'|'NOT RUN', evidence: string|null, notes: string|null }`. Missing/duplicate/unknown IDs are rejected by the runtime. Browser code never decides overall PASS, runtime readiness, G0–G5 or G20.

Context supplied by the runtime (in memory only, not serialized):
- `contractVersion`, `runId`, `productHead`, `signal` (AbortSignal), `timeoutMs`.
- `accounts`: keys `owner`, `moderator`, `ordinary`, `creator`; each `{ id, email, password }` of an actual run-owned GoTrue fixture. All strings, never real accounts. Local fixture secrets MUST NOT enter reports/screenshots.
- `localApi: { origin, anonKey }`: exact observed numeric-loopback gateway URL and only the local public client key. No service-role/management/database credentials in context.
- `async useApp({ countsEnabled: boolean }): Promise<{ origin: string }>`: runtime owns serial restart at the configured loopback app origin with truthful ON/OFF env. No app patch. Auth local API/project identity stays stable across app restarts.
- `async newBrowserSession({ viewport: { width, height } }): Promise<BrowserContext>` and `async closeBrowserSession(browserContext): Promise<void>`: runtime registers unique run-owned profile/context, launches actual locked Playwright, enforces local browser traffic policy and bounded close; rejected/unknown close throws and remains owned for final cleanup. Browser consumer uses normal Playwright pages, no launch or storageState injection.
- `fixture.setStatus(actorKey, status)` and `fixture.setRole(actorKey, role)`: Promise<void>, validate keys against the four actors and status/role allowlists; mutate only that fixture's public.profiles row and verify. Not exposed to the application or remote callers. Restore scenario mutations in finally.
- `fixture.prepareCountScenario('zero-window'|'one-recent')`: Promise<void>, deterministic/idempotent scenario preparation on run-owned synthetic users only; keep actor identifiers/passwords and actual Auth sessions intact.
- `fixture.expectedCounts()`: Promise<{ present: string, recent: string }>, bounded independent SELECT at test time over fixture-local auth.users under the unchanged metric definition; never the tested RPC.
- `fixture.setWrapperPresent(boolean)`: Promise<void>, exact local wrapper only, using the accepted unchanged source for restore; no arbitrary SQL passed by browser consumer.
- `rpcObserver.mark(): number`; `rpcObserver.since(mark): { complete: boolean, calls: Array<{ method: string, path: string, status: number|null }> }`. Marks refer to monotonic events of the actual observed app gateway. Any dropped/in-flight/unaccounted interval is incomplete and cannot prove no calls. B isolates direct-HTTP tests from server-no-call observation intervals.
- `evidenceDir`: run-owned private output directory. Browser may write ONLY sanitized final count-section screenshots and its gate receipts beneath it; never trace/HAR/video/storageState/QR/JWT/cookie/password material. Runtime final sanitizer and cleanup remain authoritative.

A owns G0–G5/G20, tooling/source/stack/fixtures/application/observer/orchestration. B owns actual UI/G6–G19 flow assertions. Both use unit context doubles ONLY for explicitly labeled unit tests; real artifact context is constructed exclusively from completed runtime stages and cannot be enabled via a fake-mode production path.

## 5. Parallel and integration topology

Decision: **MULTI_AGENT, two disjoint implementation lanes**. This is not two independent security reviews and not Guardian. One writer for runtime/fixtures/lifecycle; one writer for UI flow assertions. Stable interface §4 is pinned before dispatch.

Sibling logical agent: **Jetnity admin account counts browser flows 1**, Generation1, branch `test/admin-account-counts-browser-flows-1`, own task. It may read THIS immutable TL task by seed SHA (explicit doc-only dependency), not your unmerged code. Both branches start exactfa7. This lane must not write/import unmerged sibling implementation. No agent main sync/rebase/force/reset/cherry-pick without exact TL instruction.

Integration order: runtime lane first after independent bounded implementation review, then browser lane after TL-authorized exact-main sync and interface check. Runtime-only merge is NOT full browser acceptance. The final integrated real execution is a separate explicit TL gate after both implementations are reviewed and a suitable environment is verified. This dispatch does not authorize execution on the user's incoming Mac or cloud/hosted fallback. No automatic follow-up agent.

## 6. Delivery tests and remaining gates

Deliver complete execution code for this lane, not just a plan, a shell of throw-not-implemented functions or readiness stubs. Missing Docker can block real execution; it must not be presented as the only blocker if implementation remains incomplete. Report code-completeness and actual-execution separately.

Required safe unit/contract tests: reject hosted/inherited/overridden env; exact-source drift and old producer; no public bind; wrong CLI checksum/version/help; fixture actor ownership; transparent local observer positive/failure/drain controls; mandatory gate aggregation; partial startup failure and timeout/abort; normal/rejected/nonsettling cleanup; no deletion of foreign resource/sentinel; secret redaction and historical receipt protection. Use existing Node test infrastructure, actual harmless child processes/tempdirs/loopback-only stand-ins as appropriate. Such tests are NOT GoTrue/MFA/real app execution.

Record Node/CLI/engine/browser identities as actually observed, source hashes, supported-vs-executed platforms, fresh exact-head CI/Auth/Preview, full diff/merge-base/ahead-behind, actual agent/session and sanitized proof commands. Status/Handoff/Self-review must give the exact remaining integration/execution step. No final TL PASS claimed by the author.

Current references (read before implementation): official Supabase local-development and TOTP docs, https://supabase.com/changelog, https://playwright.dev/docs/auth, https://docs.docker.com/engine/network/port-publishing/. TL checked these plus CLI release; the Markdown changelog endpoint was unavailable via the fetcher, HTML index read instead. Do not infer hosted defaults are identical to selected CLI images.

P0: no incident established. P1: isolation/secret exposure/Auth integrity/no false full PASS. P2: migration replay, source applicability, fixture/observer correctness, cleanup and resource budgets. P3: actual Darwin/PG17/container execution still unverified. All hosted DB/DDL including staged objects/grants/exposure/runtime activation, general Auth/session changes, providers/Terms/secrets/payments/SMTP/tracking/domain/launch and new infrastructure/budget commitments remain forbidden/reserved. Existing bounded Cursor usage only; quota unknown.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP for independent TL exact-head review.**
