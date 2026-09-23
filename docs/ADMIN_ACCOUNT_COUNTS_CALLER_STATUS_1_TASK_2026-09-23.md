# Admin Account Counts Caller Status 1 — Binding Task v1

Date: 2026-09-23
Status: TL AUTHORIZED IMPLEMENTATION / LOCAL PROOFS / HOSTED COUNTS REMAIN OFF
Agent: **Jetnity admin account counts caller status 1**
Generation: **1 — NEW dedicated session**, not a continuation of #555 or #556.
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto or substitution; unavailable means BLOCKED.
Branch: `fix/admin-account-counts-caller-status-1`
Exact baseline: **87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b**, mode NORMAL.

## 1. Binding precheck and product outcome

PO asks whether Jetnity development must wait for the incoming MacBook, with standing continuation and safe multi-agent preference. TL decision: do not block provider-independent implementation on local browser execution. This bounded slice closes the **profile-status** part of the account-count pre-live NO-GO documented in accepted #555; it is actual feature-security code, not another general audit.

Only an existing, nondeleted, nonanonymous caller with the already-required role/capability and AAL2 AND a persisted **active** profile may read these aggregates. A banned or disabled privileged profile must not read them. Pending, missing, NULL or unrecognized caller status fails closed. This is a feature-specific additional prerequisite, NOT a change to global roles, login, MFA, sessions, general Admin access or the counted population.

The two metrics, no-argument RPC/output shape, fixed 720-hour half-open window and clock semantics stay identical. **Banned/internal/unconfirmed profiles remain counted** when the corresponding auth account belongs to the accepted population. Caller eligibility is not a filter on the metric population.

Build-order fit: phase-1 Account/Privacy/Operations minimum and concrete existing pre-live security blocker; no provider access, monetization expansion or broad platform redesign. Traveller/citizenship/document context is not relevant to these raw account aggregates.

Read JETNITY_START_HERE.md, .jetnity/operating-mode.json, TL/Cursor and Multi-Agent Slice Planning standards, dated checkpoint/ACTIVE_WORK_STATUS plus latest #512 live conversation. Historical startup writer pins must not restart closed work. #550/#552/#551/#553/#554/#555 are closed at their bounded scopes. #556 is a separate active test-tool correction lane.

## 2. Source and live baseline

TL has read the following at exact baseline:
- `scripts/db/admin-account-counts-1-candidate.sql`, blob **63974e6509bf42963d2028d99567c4b4062c36d8**, SHA256 **dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420**. Current producer checks subject, existing nondeleted/nonanonymous auth user and `public.darf_konten_verwalten()`, but not profile.status.
- `lib/admin/account-counts-delivery/reader.ts`, blob **02dcafd80502067935eee78f3d8a7b21e417d720**. Current default gate maps evaluateAdminAccess; no feature-status query.
- `lib/auth/admin-guard.ts`, blob **b650a5e25a4db6572bbb7267e3735a746649497b**. `evaluateAdminAccess` returns a verified user along with decision; `loadRole` reads role only. This SHARED module stays READ ONLY.
- Wrapper, parser, metric contract, activation and shared Supabase client remain accepted sources. Identify their exact baseline plus relevant proofs/types before editing.
- #555 is merged at87cdc with reviewed local install/revoke/rollback and exact identity fingerprints. Its old receipts are history, not approval of your new source.
- Connected Vercel production at baseline is **dpl_4UDqvtGwJYtKdtRgVYnf1rUY1zeX**, READY. Last TL READ ONLY metadata in #556 review: PG17.6; reporting schema/producer/wrapper ABSENT; migration20260917120000 latest. This is supplied dated evidence, not permission for the agent to connect.

## 3. Exclusive writer scope

You may change only:
1. `scripts/db/admin-account-counts-1-candidate.sql` — the existing unapplied candidate; add caller-status enforcement without changing metric semantics or privileges.
2. `lib/admin/account-counts-delivery/reader.ts`, its existing tests, and at most one small feature-local caller-status module and its tests under the SAME account-counts-delivery directory. Use the actual existing reader, not an unused alternative.
3. Existing `scripts/db/admin-account-counts*` proof implementation/test files on this baseline, ONLY for necessary caller-status fixtures/assertions and source-pin compatibility with this change. Includes local, delivery, independent-verification/HTTP proofs where applicable and the already-merged `admin-account-counts-rollout-preparation-1/` composer/identity/manifest. Do not redesign their process lifecycle or widen this into general harness work.
4. New bounded status regression helpers under `scripts/db/admin-account-counts-caller-status-1/` only when existing runners cannot house the proof without needless coupling; reuse accepted isolation helpers.
5. Own `docs/ADMIN_ACCOUNT_COUNTS_CALLER_STATUS_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-23.md` and `docs/evidence/admin-account-counts-caller-status-1/` sanitized new receipts.

This task is TL-owned/immutable. All `scripts/e2e/admin-account-counts-browser-acceptance-1/` and corresponding #556 docs/evidence are EXCLUDED. All global Auth/MFA/AAL/roles/capabilities, `lib/supabase/`, runtime activation, public wrapper SQL, metric parser/contract, general UI, migrations/schema discovery, package/lock/CI/checker, .env/secrets/config, central docs and old task/evidence files are READ ONLY.

First map the concrete dependent proof files. New expected source hashes must be derived from the new reviewed candidate installed on a CLEAN disposable reference, not copied from a drifted target. Do not disable hash checks or silently accept both permissive and corrected producers. Old #555 object identity must be refused, not overwritten in place. Persist old/new applicability and a later controlled upgrade requirement. No new migration is commissioned.

## 4. Implementation acceptance

**Database is authoritative:** add a fully-qualified lookup of this caller's persisted profile and require exactly active before executing the aggregate. Preserve subject/existence/deleted/anonymous, moderator-capability and AAL2 gates, trusted execution owner, empty arguments, fixed search_path/UTC, no dynamic SQL and no client auth.users SELECT. Direct invocation of inner producer AND wrapper with a blocked caller must fail with 42501, not return zeros. Do not expose general status lookup RPCs or change managed auth tables/RLS/helper definitions.

**Application defense in depth:** reuse the verified user returned by the existing access decision; read only that user's persisted profile status through the existing authenticated server client. Do not use caller-supplied user IDs or user_metadata, cached cross-user status, service-role access, or a client-side-only check. Denied/unknown status yields forbidden without invoking the count RPC. A failed status lookup yields failed without RPC. An already disabled runtime performs no new status lookup or count RPC. Break-glass remains denied. Do not add logs containing account identifiers/status/credentials. The authoritative SQL check must protect against status changes between an app check and the RPC.

Tests: active permitted caller; banned, disabled, pending, NULL/unknown/missing profile denied; ordinary/creator and insufficient AAL still denied; same authenticated caller active→blocked→active across new requests; blocked before RPC even when role+AAL2 otherwise valid; lookup error/throw fails closed; runtime OFF no lookup/RPC. Direct SQL status change must deny the subsequent producer/wrapper call without changing JWT claims. Assert that the metric population/counts themselves remain unchanged solely because a profile status changes. Real local SQL uses synthetic data only; Node dependency doubles are not browser/Auth-issued-session proofs.

Auth-level `banned_until`, session revocation/token lifetime and general Admin status enforcement are DISTINCT and are not silently declared fixed. Explicitly retain their separate assessment/rollout boundary. Do not alter global Auth to make this feature test green.

Re-run the affected local SQL/module tests and the #555 install/granted-test/staged-unexposed/revoke/rollback/drift flows against the NEW candidate. Update current executable test expectations which previously documented banned/disabled allow; do not rewrite the historical receipts or claim a full-system PASS. If a needed shared change lies outside the owned scope, report that concrete dependency before changing it.

## 5. Parallelism and integration

Decision: **MULTI_AGENT across disjoint lanes; SINGLE_AGENT for this security contract**.
- Existing #556, G1 session **bc-7a3a3769-52a4-4d68-863e-4e750246fb64**, owns preflight/test-tool B1/B2 correction and safe blocked fallback on its fixed87cdc baseline. It does not write your product/SQL files.
- This NEW agent owns only the feature-local caller restriction and necessary already-merged proof compatibility above. No second product/SQL writer.

Both branches start exact87cdc. Neither imports the other's unmerged work. **Integration order: accept/integrate #556's safe bounded fallback first if ready, then this slice after an explicit exact-main synchronization instruction.** This order does not require waiting to implement now. No agent may merge/rebase/reset/force/cherry-pick newer main without exact TL instruction.

The old #556 source pins describe pre-fix product truth, not this new candidate. After #556 is independently accepted and has stopped writing, TL must authorize the minimal compatibility re-pin within this slice before its final integration, or leave this slice unmerged. No permission to edit #556 now. This is the explicit shared evidence contract boundary; do not ignore it or mislabel old browser receipts as tests of new security code.

## 6. Environment, gates and delivery

No MacBook, Docker or real provider is needed for the scoped Node + disposable PostgreSQL implementation/proof. Verify the actual agent environment first; use existing supported private PostgreSQL helper machinery. If unavailable, report the exact execution blocker rather than connecting to hosted Supabase. No Docker installation, new cloud runner, plan or budget increase.

**No hosted Production/Development query, DDL, migration, grant, activation, credentials or live account access.** No provider/contract/Terms/payment/SMTP/tracking/domain/indexing/public-launch/model-call work. Existing Cursor model usage only; quota/cost balance unknown. The statistics runtime stays hard-disabled on hosted deployments. Every future Production DDL/grant/runtime enabling remains separately PO-gated, even after a code merge.

Fresh tests and CI/Auth/Preview on one frozen exact head, truthful assertion categories, SQL engine/version, source/ACL fingerprints, safe cleanup, actual model/session/footer and remaining pre-live limitations. Persist own status/handoff/self-review and sanitized evidence. New head invalidates old gates. No browser/GoTrue/MFA/PG17-hosted-parity/Guardian PASS without actual evidence.

P0: no incident established. P1 prevention: authoritative caller restriction and no widening of privileges. P2: proof compatibility/stale status/runtime-OFF behavior. P3: environment/version and remaining browser evidence. Production readiness is not this deliverable.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
