# Official Truth Accepted Store Trip Integration 1 — TL AMENDMENT R3

Date: 2026-11-08. Work #1155 / DRAFT #1156.
Technical Lead: ChatGPT / Root.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**, same session `/root/accepted_store_trip_integration_writer`.
Baseline main: `e1fe0c696ade9f39b417772b5c065f87530204d6`. Preceding R2 head: `cef42e26448da180a67255274197b46291bbfd39`.
TASK V1, R1 and R2 remain immutable. This amendment records two concrete implementation decisions revealed by actual privilege/source/runtime inspection. It is not an implementation PASS.

## 1. Exact private candidate bridges

The new NOLOGIN/NOBYPASSRLS executor cannot directly call #1142's owner-only guard, read FORCE-RLS legacy rows, or acquire phantom-safe SHARE table locks using SELECT privileges. Root inspected the unchanged authority candidate and the PostgreSQL LOCK/SECURITY DEFINER rules.

Approve exactly four additional private functions in the NEW `scripts/db/official-truth-accepted-store-trip-integration-1/accepted-store-candidate.sql`, owned by `postgres`, with SECURITY DEFINER, VOLATILE/PARALLEL UNSAFE where they lock/read current state, fixed empty search_path, fully qualified fixed objects and explicit bounded inputs/outputs:

| Private function | Exact purpose and boundary |
| --- | --- |
| `official_accepted_trip_private.lock_legacy_v1(boolean)` | Two code-fixed read/publish branches for the already approved catalog/Evidence/Claim/support lock order and nonpersonal current catalog/projection read. No arbitrary relation name or SQL. Acquire strongest required mode first; no opportunistic lock upgrade. |
| `official_accepted_trip_private.own_graph_v1(uuid)` | Fixed eight-table SHARE locks and bounded raw own-Trip values/identities/membership/xmin snapshot. The only argument is Trip ID. Determine identity from the actual authenticated JWT/auth.uid, explicitly require own Trip, and never return another account's graph. No actor parameter and no Trip/Auth mutation. |
| `official_accepted_trip_private.require_owner_v1()` | Invoke the byte-identical `jetnity_ot_auth.require_current_owner_session_v1()` and return only the actual current UID/session and original confirmed expiry/window metadata needed for the private operation. No substitute session/role/claims, no broad Auth-row output. |
| `official_accepted_trip_private.publish_legacy_v1(uuid)` | The UUID identifies the immutable prepared operation. Load its exact staged values in SQL; do not accept a caller-supplied JSON fact/publication payload. Perform only R1 amendment C's canonical first insertion or proved bound-current succession. |

Explicitly REVOKE default PUBLIC execution and all anon/authenticated/service_role/old-local-caller execution; GRANT EXECUTE only to `ot_accepted_trip_exec`. No role membership or new direct privileges/policies on existing objects. These functions are narrow exceptions to the otherwise new-executor ownership of package routines. The R2 archive bridge remains owned by `ot_provenance_read_exec` exactly as recorded there.

Each private bridge is reachable only through the six already named package RPCs and their explicit principal/token/state checks. No new public RPC, Data API schema exposure, dynamic SQL, generic admin helper, Auth settings change or global role-policy change. Existing migration/candidate/writer/guard files remain byte-identical.

The new executor and bridges must never widen legacy DML beyond accepted_at, the bound typed effect/visa_mode and current support replacement. First acceptance still uses the existing canonical writer and refuses an unbound existing claim. No old Evidence or history deletion/update.

Finalize must perform the unchanged authority guard after relevant lock waits. Force all applicable deferred constraints/integrity work before its last fresh guarded authority/time/result checks, so a function return is not based only on pre-validation time. Preserve original reservation/JWT/session/source/retention deadlines; keep authority and graph locks to transaction end. The fresh Confirm and server monotonic check still determine whether an actual committed result can be relied on; there is no promise that returning from the function alone proves COMMIT.

The actual native tests must inspect privileges and directly deny old roles/API principals against these bridges and new tables, exercise foreign/missing Trip equivalence, real lock waits, changed/expired authority, graph changes, late replies and rollback. Native installer `postgres` privileges are not a proof of a hosted target's privileges; that separate target gate is unchanged.

## 2. Pinned SDK finding and explicit lifetime decision

The independent `/root/release_reconstruction` investigation executed twelve actual synthetic loopback cases using auth-js 2.71.1, supabase-js 2.57.2 and postgrest-js 1.21.3 with repository-matching package integrities. No SDK, clock, Auth response or project implementation was patched. Root read the harness, exact relevant SDK source, manifest and raw case summaries and verified every saved artifact hash.

Actual findings:
- Fetch abort becomes `AuthRetryableFetchError`. An expired-session refresh continued for about 25.4 seconds: one aborted native fetch, then seven denied attempts before native fetch.
- Already-aborted construction can still start about 25.4 seconds of bookkeeping if construction is not prevented.
- `initialize()` does not include the unawaited subscriber `_emitInitialSession` chains. A single public INITIAL_SESSION barrier resolved while three/four `_useSession` tasks remained.
- Starting another getSession/getUser after cancellation can start a second refresh cycle, about 50.9 seconds total. A cleanup/barrier must never do that.
- The retry decision uses Date.now and unabortable sleeps; no hard clock-rollback-safe monotonic return deadline follows from the pinned public SDK API.
- The exact Node execution also returned an initialize AuthUnknownError caused by `window is not defined`; getUser continued. Do not invent a changed authentication decision from this diagnostic.
- Native fetch starts and HTTP requests after owner abort were zero in the observed cases. A later idle TCP accept was observed; connect-start time was not instrumented. No blanket claim that all physical networking stopped instantaneously.

Investigation runtime was Node 24.22.1; CI is Node 22. SSR 0.6.1 source was read at its pinned tag, but the package and real RSC adapter were not executed locally. This is supporting evidence, not the required actual factory/SSR PASS.

### Binding R3 decision

Keep the dependencies and SDK behavior unchanged. **Distinguish the strict monotonic business/I/O deadline from completion of already-started SDK bookkeeping.**

The strict deadline still forbids new business operations, new native requests, positive continuation and positive results after cancellation/expiry. Abort native fetch/body work with all composed owner/Request/init signals, await its actual settlement, and discard late data. Never extend any reservation, original JWT/session window, source/legal/retention bound or display validity while draining. No publish, read reconstruction, retry or newly started Auth operation is a cleanup action.

Already-started SDK/background work must be completely observed and awaited until it actually settles. For this bookkeeping drain, this package does **not** claim a fixed monotonic return ceiling under wall-clock rollback. This expressly narrows the earlier combined wording about bounded SDK settlement; it does not weaken a result, authority, lease or I/O gate. Do not replace the missing guarantee with a fixed sleep, Promise.race, abandoned promise, false network success/error, changing clock, SDK patch or version upgrade.

The measured slow cancelled-failure drain is an operational P2. The dormant package generates zero such activity with absent binding. Real deployment runtime/capacity compatibility remains part of the existing future target/activation evidence; no separate Product Owner permission is being requested for this engineering choice.

Independent reviewer `/root/refresh_independent_review` read the exact SDK/SSR sources and actual investigation evidence and found no additional concrete P0/P1 integrity/identity/privacy defect in this narrower direction, subject to actual implementation gates. Root retains the decision; this is not a reviewer PASS.

## 3. Exact factory ownership and observer requirements

R1's permitted changes remain in `lib/supabase/server.ts`, narrow Trip signal/mapping support and the new package lifetime module. The bounded factory path opts in ONLY through an opaque private lifetime registration already created by this package.

- No automatic lifetime/scope creation for arbitrary pre-existing Trip AbortSignals. No-argument and legacy factory/cookie/auth behavior remain unchanged; existing caller/query cancellation is preserved.
- Pre-aborted owned signals refuse before cookies/client construction or any operation starts.
- Install the factory-owned public auth.debug observer at construction time, before either internal Supabase or SSR subscriber can start. It is strictly observational and never throws.
- Keep only fixed event categories, completion state and counters. Never retain/print debug arguments containing session, token, headers, identity, cookie or key data. No global console suppression.
- Own all actual constructor/background/initial subscriber chains, relevant session/refresh/notification/lock phases, explicit public SDK promises and complete fetch/body work. Check the exact pinned source's event ordering and completion boundaries; initialize() plus pending fetch alone is insufficient.
- Once closed, no newly started public SDK call can be used to flush or check the client. Cleanup only awaits already owned work and removes owned listeners/timers after their legitimate completion.
- A late successful network/SDK response cannot revive a closed scope. Unknown submitted server-side effects remain unknown; abort is not rollback.
- Preserve unchanged URL/anon/cookies/identity verification and route/action factories. No caller transport/target/header/actor/cookie adapter or positive capability is introduced.

The final actual Node22/SSR0.6.1 factory tests must run, not skip. Include constructor-only expired-session background work, preabort, query-only versus owner abort, Request/init signal composition, body settlement, no new request after abort, every initial subscriber's completion, no secondary Auth cycle in drain, and unchanged no-arg/legacy behavior. Counter balance and expected completion conditions are actual assertions; time is only a test failure bound, never evidence that work stopped.

## 4. Evidence and unchanged release gates

The supporting investigation manifest is persisted under `docs/evidence/official-truth-accepted-store-trip-integration-1/sdk-lifetime-audit-manifest.json`, including commands, original source pins, package integrities and original raw artifact hashes. Original raw files remain unchanged in the recorded reviewer evidence directory.

Manifest SHA-256: `d394cee7d1f375bca22091924a524290fa55d80777a2de296a6c7cecb18e4827`.
Eight-case JSONL: `5432c92c58d80c30ba6d43dedb16cc919a58436a218cc3677c856794f5c34531`.
Four-case barrier JSONL: `c902c4d84f7ae76048f87b6df5d941c03df5b0bd5fcba41456a44e8d9550c8aa`.

Proceed with the complete native-first producer/store/fresh-reader path and then the actual Workspace lifecycle. Preserve all canonical, same-request, provenance, crypto, witness/reconciliation, strict profile, currentness and API protections. The author returns complete implementation, real evidence and changed-file manifest; same-session fixes and full new-head re-gating remain mandatory.

No hosted SQL, no source/key/retention activation, no #917/#1131/#985 action, no Auth/RLS production changes, no paid calls or launch. All special gates remain. No implementation PASS/Ready/merge is granted.

Technical references: [PostgreSQL LOCK](https://www.postgresql.org/docs/current/sql-lock.html), [SECURITY DEFINER guidance](https://www.postgresql.org/docs/current/sql-createfunction.html), [pinned auth-js source](https://github.com/supabase/auth-js/blob/v2.71.1/src/GoTrueClient.ts), [pinned SSR source](https://github.com/supabase/ssr/blob/v0.6.1/src/createServerClient.ts).
