# Official Truth Accepted Store Trip Integration 1 — author handoff V1

Date: 2026-11-08. Issue #1155; Draft PR #1156.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Actual continuing session: `/root/accepted_store_trip_integration_writer`.
Immutable main: `e1fe0c696ade9f39b417772b5c065f87530204d6`.
Current publication lease when this handoff was prepared: `b6adb19f21a44860fe1f486fb0cb5a54c14f5ddb`.

**Status: coherent implementation submitted for independent review and full actual CI. No author PASS, Technical-Lead PASS, Ready, merge, hosted apply, source admission or activation.** Earlier native attempts stopped during schema installation. The published R6/R7 head b6adb19f passed that installation and then failed in catalog setup; the diagnosed new-transport duplicate-column error is corrected in this tranche. The larger matrix and mounted Workspace have not executed under the required Node 22/PostgreSQL/SSR/React runtime yet.

TASK V1 and all design/ACK/amendment documents remain immutable. R1 through R7 govern this package. Root owns final gating, remote publication, `ACTIVE_WORK_STATUS`, Ready and merge. No follow-up slice is started.

## 1. Implemented path and boundaries

The package implements an inactive server-owned path from fresh canonical source acceptance to an immutable version ledger, actual durable publication confirmation, a different fresh database reader, the current own Trip and the unchanged Requirements engine. The normal entry is an explicit authenticated `POST /api/readiness/accepted-store` with exactly `{tripId, revision}`. There is no producer, source promotion or lifecycle mutation HTTP endpoint.

`acceptedStoreBinding()` remains absent by default. The default route refuses before body, cookies, Auth, client, SQL or source activity. A dedicated code-owned target/contract/key/independent witness binding is required; environment variables or caller fields do not supply activation. Both the captured RSC target and dynamic service target must equal that binding before constructing a client. The existing global Requirements provider remains null. Initial Workspace rendering is unknown, with no optional positive SSR path.

The producer composes the frozen 64 KiB retrieval and existing canonical Evidence, Review, deterministic extractor and Rule checks. It consumes the actual same-execution extractor/canonical constructor membership and builds a full immutable provenance closure. The null model proposal remains null. The original bytes are encrypted separately using server crypto; no raw key is sent to SQL. Acquired key copies are wiped in a finally covering late abort and binding closure as well as encryption/decryption. This is owned buffer cleanup, not a secure-erasure claim.

The frozen transport has its own ten-second lifetime and cannot be parent-aborted. The producer reserves that complete remaining budget before starting, awaits settlement and refuses a late result. It does not repair or reimplement the held #1131 native framing/Content-Length work. Synthetic fixture bytes do not establish real origin completeness or rights to retain them.

## 2. Six RPC protocol and commit/witness semantics

Every RPC is an independent POST transaction at READ COMMITTED; no connection is represented as spanning HTTP calls.

| RPC | Principal | Purpose |
| --- | --- | --- |
| `official_truth_trip_store_reserve_v1` | Actual authenticated user | Fresh own Owner/AAL2/session and optional own Trip snapshot; opaque one-use operation/token; observed current head |
| `official_truth_trip_store_prepare_v1` | Separate cookie-free service client | Inspect current catalog or persist strictly bounded immutable provisional stage |
| `official_truth_trip_store_snapshot_v1` | Separate cookie-free service client | Return actual retained archive/Evidence/support/original state for historical reproof |
| `official_truth_trip_store_finalize_v1` | Same actual authenticated user | After relevant locks, fresh unchanged #1142 authority, exact closure/CAS and atomic publish or final reader validation |
| `official_truth_trip_store_confirm_v1` | Separate cookie-free service client | Distinct committed readback and exact durable operation/witness acknowledgement |
| `official_truth_trip_store_cleanup_v1` | Separate cookie-free service client | Bounded removal of expired or explicitly acquired provisional reservations/stages; never accepted history |

No service request impersonates a user or supplies replacement Auth claims. Finalize receives only token and prepared digest. It checks the original reservation and JWT/session expiry, exact head, current catalog/contract, and actual own graph after waits. It forces deferred integrity before its final fresh authority/time checks.

The canonical store is the immutable version/operation ledger plus a verified current pointer. Each accepted version retains the complete fact/support/acceptance/custody binding and the exact legacy projection. The existing unique `(rule_scope_key, fact_kind)` remains. Successor publication atomically archives the prior version, updates only the approved current Claim/fact/support columns and advances the journal. It cannot adopt unbound old claims or an old archive's idempotent success.

R7 corrects successor support to select all 15 real fields from retained Evidence/source, match the exact staged identity/scope/version and require exactly one row. The exact four relevant legacy constraints are deferred only for the complete replacement and flushed inside the existing postgres-owned bridge. Outer ALL IMMEDIATE and the final fresh guard remain. Legacy tables, triggers and public writers are unchanged.

Journal validation re-proves actual retained archive bytes, ciphertext/metadata, version supports, legacy Evidence and current projection. It recomputes the publication/operation hashes, original acceptance metadata and bounded contiguous journal; current pointer/status must equal that journal. At most one committed successor may remain unwitnessed. An independent witness lives outside the database restore domain. A committed-but-lost acknowledgement is reconciled by a callable internal bounded known-prior-to-exact-successor CAS; it never resets the witness to a database head or republishes the source. Reader calls never invoke producer reconciliation.

The separate R4 disposal exception permits one direct service REST cleanup attempt, at most five seconds, only for an actually acquired token. It starts no Auth SDK call, retry, witness or business result. Unknown acknowledgement is reported honestly. The normal explicit reader first sweeps expired provisional work after its own Auth/rate/Trip/context checks so lost Reserve acknowledgements cannot permanently consume quota. No source operation is required for this recovery.

## 3. Structural and SQL ownership details

R2 adds strict `ot-accepted-store-trip-closure-v1` with fixed depth 16 and the unchanged full verifier semantics. Existing standard depth 8 and historical local depth 16 entries remain unchanged. Historical Layout 2 is a physical archive, never an accepted authority. The new profile is bound through admission, stage, fresh authenticated Finalize, immutable version, operation and witness. Exact bounds remain receipt 262144 bytes, custody binding 4096, each artifact 1048576, total binding plus artifacts 8388608, 256 nodes including binding and 1024 edges.

The candidate is explicitly UNAPPLIED under `scripts/db/official-truth-accepted-store-trip-integration-1/accepted-store-candidate.sql`; there is no new hosted migration or automatic installation path. `ot_accepted_trip_exec` is private NOLOGIN/NOINHERIT/NOSUPERUSER/NOBYPASSRLS. The four approved narrow postgres-owned bridges preserve old private table and Auth access; the archive bridge uses the existing provenance read executor. R6 grants postgres EXECUTE only on the five pure new invoker helpers required by those bridges. No application role receives private helper/table access or executor membership.

The disposable installer verifies all original source pins and preserves original migration bytes/order/owners. Its synthetic postgres runtime is NOLOGIN/NOINHERIT/NOSUPERUSER/NOCREATEROLE, with the previously declared fixture BYPASSRLS. R5 temporary database CREATE is revoked after installation. R6 temporary CREATEROLE surrounds only the exact four-role original custody migration; the owned bootstrap removes the four automatic PG16 ADMIN memberships and asserts no remaining postgres membership. All installation and cleanup errors are retained, including multiple failures. pgcrypto is installed alongside pg_trgm as an explicit owned fixture prerequisite; this is not target installation evidence or proof that old custody encryption functions were exercised.

The native protocol fixture uses actual PostgreSQL BEGIN/role/claims/timeouts/RPC/COMMIT, then sends its HTTP acknowledgement. It sets transaction timeouts before the RPC statement. Actual target PostgREST version, hoisted transaction settings and managed Auth remain future evidence. The fixture is a real signed closed synthetic Auth protocol, not a managed-target JWT claim.

The b6 native setup failure is diagnosed precisely: its transaction setup selected three `set_config` expressions without aliases. The unchanged strict native wire rejects duplicate RowDescription names before the catalog RPC, which the canonical catalog wrapper reports as `catalog_failed`. The correction supplies three distinct aliases and preserves the same SQL settings, roles, bound values, transaction and parser. Root and both backend/release reviewers independently verified this source diagnosis. No role, ACL, timeout, product or old parser change is included, and the correction has not yet executed in CI.

## 4. Real Trip binding and historical read

The external route accepts no source, registry, fact, receipt, actor, key, clock or database transport. It uses actual `auth.getUser`, the existing limiter and RLS-backed `reiseLaden`. Foreign and missing Trips return the same 404; revision mismatch returns 409.

Reserve returns the authenticated canonical raw rowset under locks over trips, stages, days, items, readiness, travellers, citizenships and documents. The existing mapper is narrowly exported/reused, including `tageEtappenZuordnen` and unassigned items. The mapped reserved values must equal the actual RLS-loaded Trip. Raw relation membership/count and MVCC checks remain separate so mapper normalization cannot legitimize missing children. Finalize rechecks the raw values/MVCC digest with phantom-safe table locks. No blanket detection claim is made for a child inserted and completely removed between snapshots; a temporary graph cannot be projected from different reserved/final graph values.

The reader preserves original retrieval and acceptance times. It reconstructs and re-extracts from retained bytes through canonical checks, without synthesizing a fresh retrieval or calling producer construction. It uses existing `pilotScope`, context/reference/fingerprint checks, exact traveller/document/linked citizenship, ordinary CH passport, tourism/direct CH–DE route and both actual dates. The first bounded subset requires the exact compiled start-date scope and both dates inside the compiled application interval and source-derived legal interval. Other persons/options/requirements remain unknown. No Trip/credential identifiers enter global provenance.

Only after reproof, actual own Trip reread, fresh SQL finalization, committed confirmation and witness checks does the unchanged Requirements engine's selected visa cell become current. The result envelope contains sanitized references/timestamps/evaluations only. Its monotonic deadline offset is measured from server reader invocation start and conservatively anchored at the earlier browser request start, so server work and transport latency are consumed once. No timer starts a fresh lease at response delivery.

## 5. Workspace and actual draft edits

A separate accepted-store hook owns request generation, abort, result, dirty context and bounded lease. Shared explicit latest-intent ownership cancels the other lane in both directions without inventing a local edit. Old pilot invalidation cannot permanently mask a newly confirmed accepted-store read. Failure never reveals an older positive.

A per-mount display clock observes monotonic and wall time, availability and context. An expired or regressed attempt is irreversibly poisoned until a new explicit request. Render-time checks precede Effects and timers; rerenders, clock restoration, background resume, pagehide/pageshow and late responses cannot restore a prior lease.

R5 adds an optional semantic draft-change notification to the existing traveller controller and forwards it through Workspace. Actual document/citizenship add/remove/reset/re-entry changes invalidate synchronously; focus/disclosure/navigation do not. Both existing Workspace/preparation renderers use the same actual draft guard. An unsaved/mismatched retained draft hides positive evaluations, confirmed-status wording and usable official read controls even after newer confirmed props and genuine native bytes arrive. Existing editing, explicit Save, reload and guest semantics remain. The mandatory browser proof mounts the actual controller, hooks, preparation renderer and real buttons; its save route performs real canonical traveller SQL and explicit closed-fixture context re-attestation, not a positive DTO.

Independent source review of the frozen 14-file R5 snapshot reported no further concrete UI defect. That is not a React/native/browser execution PASS. The exact freeze manifest SHA-256 is `be6b275c752df7ce3a53d1d89ad4959700d83148ffc7192932808111240595d3`.

## 6. Required executable matrix and current evidence

See the adjacent acceptance matrix for entry/case mapping. Every required entry is a discovered `lib/readiness/official-truth-accepted-store-trip-integration-1*.test.ts`; no new case depends on an undiscovered scripts test, optional browser skip or workflow change. Each owns and drains its disposable infrastructure. The native cleanup assertions inspect actual backend disappearance, including idle COMMIT guard/control peers, rather than only counting outer connections; the browser path separately drains its browser, HTTP handlers and disposable cluster.

The native entries cover positive producer/COMMIT/fresh reader/succession; strict staged archive/fact/identity rejection; retained Evidence/support/archive/ciphertext corruption and partial restore; actual blocked SQL followed by authority/session/Trip changes; actual pinned SSR constructor-only and concurrent-user abort/drain; direct role-separated RPC refusal; target/key/body boundaries; actual persisted context/person/document/date/ref changes; unbound old archive/claim refusal; source expiry during deferred validation; late finalized response; actual lost acknowledgements/R4 cleanup race; and 32 real expired unknown-token reservations recovered by explicit read alone. Target-specific RPC/state/refusal assertions and positive controls prevent 429, stale source or earlier unrelated failures from satisfying these cases. The unchanged real limiter is reset only by its existing fixture control.

The final focused additions execute three actual pinned SSR cases, including a query-only abort while the earlier Auth refresh remains genuinely active until owner cancellation. Separate real outgoing cases compose owner/Request/init signals, hold native RLS response headers or body, observe abort after genuine fulfilled headers but before the wrapper reader, and compare actual factory query-only versus owner abort. They assert native body terminal state/reader release separately from later server peer teardown; no instantaneous TCP-close claim is made. The whole operation remains owned during notification races and is fully awaited in finally.

The new semantic negative starts with a genuinely committed protected database Snapshot and an untouched actual historical-reproof positive control. It creates a deliberately false fact with self-consistent receipt/candidate/fact/custody hashes and passes the complete strict R2 structural verifier. All artifact/original bytes remain unchanged; the same actual key re-encrypts those original bytes against the new receipt AAD. The actual new reader must reach `retained_fact_invalid` only after its fixed parser/extractor and canonical Rule acceptance. Additional focused clone cases bind review/support/profile/code/contract and the current closed-fixture extractor descriptor. These are direct historical-boundary negatives, never claimed as successful forged SQL publication; actual durable history/journal/witness remain unchanged, and the untouched Snapshot passes afterward. The acceptance matrix maps every TASK §8 family to this package's invoked case and, where applicable, exact unchanged #1142/#1151/#1154 markers/pins.

Browser tests use installed system Chrome through the locked Playwright package, actual React 19.2.8, fresh native responses and the actual presentation/controller path. They check closed zero-fetch state, selected cell/source attribution, real local button edits with zero persistence, retained draft/new prop/native-result blocking, actual Save/reload recovery, both lane races, out-of-order replies, clock rollback/expiry, availability and visibility loss, failed refresh and original monotonic expiry. No fabricated positive DTO or mocked positive evaluator is supplied. The old pilot transport is negative-only test infrastructure.

### Actual results at this author handoff

- d41ba0a: actual typecheck passed; lint failed two newly introduced local variable names. Exact same-session Fix1 corrected both.
- 94b6b063: actual typecheck/lint passed; Core reported 8200 tests, 8195 pass, 3 fail and two existing skips. The native path stopped during installation; exact factory/foundation hygiene and database CREATE corrections followed.
- f8017c63: [actual run 42449017089](https://github.com/Jetnity/jetnity/actions/runs/42449017089) typecheck/lint passed; Core 8200/8197/1 failure/two existing skips. Native still stopped during installation with CREATEROLE refusal, zero completed families. R6/R7 address independently verified installation and successor defects.
- b6adb19f: [actual run 42451142700](https://github.com/Jetnity/jetnity/actions/runs/42451142700), Core job128640429691, typecheck/lint passed; 8200 tests, 8197 pass, 1 failure, 0 cancelled, two existing skips, 695211ms. The sole new native failure was `seedNativeCatalog` returning `catalog_failed`, zero completed families, now traced to the three duplicate native column names. Persisted passed (one test/no skips, 181641.870792ms); Auth passed (55 values/243 keys).
- Full tranche native/SSR/browser execution: **not yet run**. Full actual-head CI must pass after publication; every new head invalidates prior gates.
- Local environment: Node 24 only; no PostgreSQL, Node 22, SSR 0.6.1, Next/React runtime or locked Playwright. Partial `tsc` cannot pass because these dependencies and unrelated baseline files are absent. The final run has zero diagnostics for the new product package/native harness. Locked local `@types/node 22.20.1` exposed two real Web Stream `isErrored` typing errors; a narrowly documented test-only declaration accommodation corrected both without changing the genuine runtime stream or public API. This is diagnostic, never a replacement full typecheck.
- Actual local fresh canonical/strict R2 verification at 05:33:13Z produced 43 nodes, 226 edges, 1795462 bytes, depth 11 and 121 exact source pins; receipt `ot-provenance-v1:76f8a112abffd4b25fdfbf158855f7d872f7a7604899aa2fc0ecf7791a082b39`, bundle SHA-256 `a2380493bd8362092500f8365b7113d2929d37e08cb3d533102348f31a7b1738`. All 121 source pins were rechecked unchanged before final freeze. This and the separately pinned SDK-core observations do not prove native publication, managed Auth, full SSR, browser behavior or production source completeness.
- Existing Atomic gate passed on f8017c63, with 152 markers and 561240ms. On b6adb19f, Atomic job128640429921 again reached the unchanged 900000ms test ceiling: 146 raw phase markers, last at 838360ms/readback_failure, 0 failures/1 cancellation and no final cleanup marker. Aggregate job128643598810 failed. The older PASS is historical only. No favorable rerun, timeout/workflow/code relaxation is made; full natural final-head and actual-main gates remain required.

## 7. Rollback, future gates and risks

The default absence of the binding is the current deployment state. A future binding can be closed to refuse new work before Auth/client/DB/source access. This does not delete or rewrite accepted history. Native fixture cleanup stops and removes only the freshly owned disposable clusters/witness directories. No hosted rollback or destructive schema action is included. Any future hosted candidate apply requires independent target/backup/ACL/Auth/key/restore and migration decisions; this handoff supplies no route around the #917 refusal.

| Priority | Current disposition |
| --- | --- |
| P0 | No newly established P0. Default activation remains absent. This is not a claim of completed production assurance. |
| P1 | New package full actual native/SSR/Workspace and exact-head gates remain open. Held #1131 real transport framing/completeness remains a separate prerequisite for source activation. |
| P2 | Pinned auth-js retry bookkeeping may drain for about 25 seconds after abort and has no fixed monotonic return ceiling under wall-clock rollback; business/results/new native starts remain closed. Atomic CI runtime variability is recorded without timeout relaxation. Target PostgREST/managed Auth/independent production witness/key semantics are unproved. |
| P3 | Existing warning/optional old-test inventory remains; no cleanup or unrelated scope expansion is performed. |

All hard holds remain exact: #917 refused hosted readback/no alternate SQL/operator route; #1131 held implementation not inspected/copied/reimplemented; #985 Protocol3/marker/getter; #937/#934 App/Signer/Bern/Owner Mac; #913 privacy. No real AA/Bern fetch, real HTML retention, source admission, actual key/secrets, paid calls, hosted Production/Auth/RLS changes, public launch/indexing or automatic following slice.

## 8. Exact next step

Root reviews the complete frozen tranche and publishes it against the current remote lease. Run full actual CI, including every mandatory native and mounted entry. Any concrete failure returns CHANGES REQUIRED to this same author/session, then a new exact head receives complete re-gating. Only Root may issue independent PASS/Ready/merge. Post-merge actual-main CI and exact Production/domain checks precede closure. The real entry-requirements feature must not be described as live from this package.
