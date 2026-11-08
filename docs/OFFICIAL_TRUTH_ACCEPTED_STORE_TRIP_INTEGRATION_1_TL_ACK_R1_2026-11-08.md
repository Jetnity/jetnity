# Official Truth Accepted Store Trip Integration 1 — TL DESIGN ACK / AMENDMENT R1

Date: 2026-11-08. Work #1155 / DRAFT #1156.
Technical Lead: ChatGPT / Root.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**, same actual session `/root/accepted_store_trip_integration_writer`.
Immutable baseline main: `e1fe0c696ade9f39b417772b5c065f87530204d6`.
Frozen TASK V1: commit `874407aac71d6fdb086a6cba230fe95200eb860f`, blob `e3336c869472fe50e94473797c1555419f6d82a6`. TASK bytes remain unchanged.

## Decision and evidence

**IMPLEMENTATION ARCHITECTURE ACK**, restricted to the complete dormant package in TASK V1, the checked author design/addendum and the concrete decisions below. This is not an implementation PASS, exact-head release gate, hosted approval or activation.

Root read the full author design (SHA-256 `0b2e06c5b04d0a464f306b38f4252c3cd176cc658f016ae5a4bf5114f6c5b00f`) and addendum (SHA-256 `33766333d7480fc08ed8f1b461658c4b6f9825b3a8d32edd0d6593ef978cac9c`). Those texts are preserved alongside this decision. Where wording differs, this R1 and the explicit addendum corrections govern.

Independent read-only reviews:
- `/root/refresh_independent_review`: concrete PostgREST/authority/version/closure/witness/cleanup review, then full design review.
- `/root/entry_scope_reconstruction`: actual Auth/RLS Trip load, graph binding, API and mounted Workspace lifecycle review, then full design review.
- `/root/release_reconstruction`: exact RPC/schema/import/API hygiene and CI-discovery/runtime review.
None grants PASS or Ready authority. Root independently checked the existing session factory, Trip loader, frozen retrieval/helper and its finite importer guard, legacy schema/writer, canonical source/extractor/Rule semantics, and actual lockfile.

No new runtime PostgreSQL driver, dependency upgrade, workflow or timeout change is approved.

## 1. Finite transport and authority protocol

Use the six explicitly named new RPCs in the author design. Each invocation is a separate bounded POST/VOLATILE/READ COMMITTED transaction; there is no DB lock spanning HTTP responses. A fresh reader means an independent new transaction after the producer has settled, not an assertion that a pool must use a different backend PID.

Authenticated Reserve and Finalize carry the real user JWT and execute the unchanged #1142 guard. Service-only Prepare/Snapshot/Confirm/Cleanup validate their own role, operation, reservation and immutable bindings; they never fabricate user claims or invoke a service-role substitute for that guard. Authenticated outputs never reveal source originals, keys or positive capabilities. Finalize accepts only the operation token and exact expected binding, never facts, raw bytes or actor claims.

Apply SQL-enforced quotas, byte limits, expiry and one-use state transitions. Finalize rechecks the exact user/session and the earliest original JWT/session budget after all relevant waits. No token refresh extends an already observed deadline.

A successful function/HTTP response alone is not durable evidence: a distinct Confirm transaction must find the exact committed operation/version. Lost or delayed ACK stays unknown; no automatic publication retry and no assertion that abort rolled back a submitted write.

## 2. Amendment A — narrow existing client/Trip support

Allowed existing files: `lib/supabase/server.ts` and `lib/trips/daten.ts`, solely:
- Add optional per-invocation AbortSignal and strictly observational ownership/settlement tracking for the existing RSC session client. Preserve the no-argument path, captured URL/anon key, cookies, identity verification and RSC cookie behavior.
- Compose lifetime cancellation with an existing Request/init/query signal; do not replace or discard either signal. No caller-supplied fetch implementation, target, headers, credentials, actor or positive response.
- Pass the already present `reiseLaden` signal through to that client.
- Expose/reuse the existing pure canonical graph mapper, without changing its mapping semantics, only as needed for the precise Reserve-value/RLS-Trip equality below.

The route/action client factories, MFA/auth policies, cookie authority and other Trip reads remain outside this amendment. Tests must exercise the pinned actual SDK expired-session/refresh path: fetch abortion is not assumed to mean SDK settlement. No network may start after cancellation; started work must settle. Preserve original deadline while any SDK bookkeeping finishes. No fabricated Auth status/error responses to suppress retries.

Pinned baseline: supabase-js 2.57.2, auth-js 2.71.1, ssr 0.6.1, postgrest-js 1.21.3. No upgrade is authorized.

## 3. Amendment B — one frozen source-helper importer

Exactly `lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts` may additionally import `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport`. Its catalog transport is private/code-owned/bounded; no profile/registry/source/transport override comes from a product request.

The existing retrieval runtime file remains **byte-identical**. This decision is the precise finite importer exception to its older comment; no marker/getter/HTTP/DNS/TLS/UTF-8/framing semantics change. The helper keeps its 65,536-byte ceiling and no privileged Protocol-2 budget. No AA/Bern qualification follows.

The existing intrinsic HTTP operation has its own ten-second bound and no parent-signal parameter. Start it only with its full required remaining budget, await its actual settlement, and refuse subsequent positive/persistence work on cancellation/deadline loss. Do not invent immediate physical cancellation or abandon it through Promise.race.

The existing #1131 completeness P1 and independent hold remain. No code from that held PR is inspected, copied or recreated.

## 4. Amendment C — immutable history and exact current materialization

Approve a new candidate-only immutable accepted-version/custody/decision binding ledger plus an atomic current legacy projection. No existing migration/schema/writer file is changed or installed.

For this flat single-primary `requirement_effect/visa` path:
- First acceptance uses the existing canonical legacy insertion inside final publication. An existing unbound claim is a conflict, never backfilled.
- Succession proves exact predecessor/version/history and current materialization equality, then atomically inserts the complete immutable successor and moves the current pointer by CAS.
- Existing-row DML is limited to the bound claim's `accepted_at`, its one typed requirement-effect row's `effect`/`visa_mode`, and replacement of that claim's current support rows.
- Scope/claim identity/fact kind remain fixed. Quality stays `explicit_primary_statement`; lifecycle stays `accepted`; validation stays `valid`. No open-ended state/quality update permission.
- No old Evidence, receipt/artifact, historical fact/support/version/decision or original metadata is overwritten/deleted.
- Snapshot and Finalize recompute equality of scope, acceptance time, quality, typed fact and complete ordered support against the immutable version. A stored digest or claim_id alone is insufficient.
- Old writer remains unchanged: identical current payload is idempotent, differing payload remains 23505.

All history insertion, projection change, pointer and lifecycle events share one atomic transaction. Rollback/reconciliation notes must distinguish code/candidate rollback from any future data-bearing deployment; no destructive production rollback is implied.

## 5. Exact Trip/value binding and read linearization

Use initial unknown plus explicit stored read for this version. Do not add optional SSR positive-envelope acceptance.

Reserve must attest a bounded canonical own-Trip value snapshot. Reuse the unchanged existing mapper to compare it with the actual RLS-loaded Trip passed to `requirementsFuerReise`. Explicit equality covers all consumed traveller/document/citizenship/route/date/declaration/context fields, not only revision or the declaration's old fingerprint.

Finalize recomputes that reserved value snapshot and its separate concurrency digest under an explicitly enumerated phantom-safe set of graph locks, then rechecks current authority. MVCC markers supplement values; they do not prove all transient insert/delete histories or restore safety. A temporary B read must never be projected from a reserved/final A snapshot. An unobserved transient change that leaves both reserved, projected and final values identical is not falsely claimed to be detected.

Code-owned finite date slots and exactly CH citizenship/ordinary linked CH passport are an explicit supported subset. Both travel dates must also fit independently extracted legal validity; the technical application slot is not legal evidence. No inferred person/passport or Schema1/2 expansion.

The last locked Finalize is the result's linearization point. Currentness does not promise retroactive invalidation of an offline screen. Earliest server/DB/source/legal/retention/authorization limits and a bounded monotonic display budget prevent indefinite reuse.

## 6. Cryptography, independent witness and recovery

Encrypt/decrypt original bytes in server-owned crypto; raw key material is not an SQL argument, stored column, error/log or client value. Bind ciphertext integrity to exact original/Evidence/source identity, full-byte hash/count, receipt/version and key/policy IDs. Finalize takes immutable prepared ciphertext/metadata and requires no key.

The independent witness is outside the database. A publication becomes confirmed only after actual COMMIT, fresh exact Confirm and CAS from the independently known prior witness to that exact committed successor. No witness update before COMMIT.

Keep a non-personal committed operation identity and exact predecessor/successor event chain after private reservation cleanup. A bounded explicit internal reconciliation path may confirm that exact operation and retry/read back its witness CAS; it may not republish, select an arbitrary current head, rewind/reset the witness, or reinterpret an old request as successful. It has no HTTP mutation route or automatic live schedule. Witness failure closes positive reads.

Provisional ciphertexts need hard quotas and actual bounded cleanup/sweep from a new connection, including lost-process/ACK and Finalize races. Cleanup can never remove finalized history/accepted originals. Report cleanup uncertainty honestly.

## 7. Mandatory first bundle preflight

Before committing the full SQL/UI path, build one complete fresh canonical synthetic bundle and measure its actual depth. Record the exact verifier entry, configured profile, actual positive/negative result and code pins.

`verifyIntegratedPilotBundle` depth8 and `verifyLocalIntegratedPilotBundle` depth16 are different explicit contracts. No fallback, truncation, depth-bound edit or relabelling local proof as production authority is permitted. If depth8 does not admit the full honest structure, return the actual result to Root for the narrowly recorded profile decision before proceeding with that integration. Other approved bounded implementation work may proceed while Root reviews that concrete preflight.

## 8. Amendment D — exact hygiene/test additions

Allow only actual named package consumers/RPCs and preserved negative assertions in:
- `scripts/db/verwendung.mjs` and `lib/admin/account-counts-delivery/schema-reference.test.ts`: exact six RPC names + single runtime source + candidate SQL path.
- `lib/readiness/official-truth-content-identity.test.ts` and `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`: exact newly used importer paths.
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`: test21's finite helper importer set adds only the new producer; update its title. All other same-request proof/marker/getter assertions unchanged.
- `lib/readiness/trip-official-evaluations-server.test.ts`: precise new dependency imports/props while preserving RLS/guest/null-provider/pilot assertions.
- `scripts/api-schutz.mjs`: one exact `app/api/readiness/accepted-store/route.ts` delegation/protection check; preserve all twelve admin routes. Executable new handler tests remain mandatory.

No wildcard/path-prefix exclusion, generic unused-export exception, existing-suite weakening, migration/type regeneration or workflow/timeout change. If another necessary exact file emerges, return its concrete reason to Root before editing it.

## 9. Release acceptance and stop

The actual native pipeline must end in the same product reader and unchanged Requirements engine. Native real SQL/roles/constraints/COMMIT, canonical acceptance/extraction, durable fresh read, original/closure and actual UI output are not mocks. Required browser flow receives a fresh native result without rewriting its read/expiry timestamps; exercise both cross-direction pilot/store races as well as edit/confirmed refresh/expiry/background/clock rollback/failure.

All infrastructure fixtures remain under scripts/db; the discovered .test.ts entries run in Core. New native/browser stages may not skip. Full exact-head Core, native retained/refresh, Auth, typecheck, lint, five hygiene and build remain required. Actual Preview, base/threads/ruleset and independent code/SQL/UI review precede any Ready/merge. Actual-main CI and Production/domain evidence precede closure.

Provider stays null, all source/extractor/application registrations remain inactive/unchanged, deployment/key/witness bindings absent. No hosted SQL, refused #917 readback route, held #1131/#985 action, ownerMac/Bern/privacy work, real fetch/retention, paid calls, Production Auth/RLS changes or launch. The new candidate's transactional reads are not the separately requested pure SELECT operator audit.

Author implements in the same isolated workspace/session and returns HANDOFF + complete changed-file manifest + actual evidence. Immediate CHANGES REQUIRED stays in this session. **No author Ready, merge or follow-up slice.** Root architecture ACK never substitutes for independent full implementation PASS.


Technical references for the transaction boundary: [PostgREST transactions](https://docs.postgrest.org/en/stable/references/transactions.html), [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [PostgreSQL function volatility](https://www.postgresql.org/docs/current/xfunc-volatility.html). These document request/transaction and snapshot behavior; they do not prove this candidate's implementation or any hosted installation.
