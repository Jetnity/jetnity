# Official Truth Accepted Store Trip Integration 1 — design addendum V1

Date: 2026-11-08. Issue #1155 / Draft PR #1156.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Actual session: `/root/accepted_store_trip_integration_writer`.
Baseline: `e1fe0c696ade9f39b417772b5c065f87530204d6`.
Frozen TASK: commit `874407aac71d6fdb086a6cba230fe95200eb860f`, blob `e3336c869472fe50e94473797c1555419f6d82a6`.
Preceding checkpoint SHA256: `0b2e06c5b04d0a464f306b38f4252c3cd176cc658f016ae5a4bf5114f6c5b00f`.

**DESIGN ONLY. No material implementation, native PASS, profile PASS or deployment activation is asserted. Root ACK remains required.** This addendum replaces the checkpoint's imprecise graph-ABA, key-in-RPC and lost-ACK wording. All other frozen scope and holds remain.

## 1. Exact actual-Trip equation and graph closure

Request a narrow pure refactor in `lib/trips/daten.ts` (baseline blob `3f498e2b750f62348fe8edd42c904a8040f41adc`): export the existing `graphZeileZuReise` mapper and its exact raw graph input type without changing its implementation or `reiseLaden` semantics. Do not create another Trip mapping.

The canonical select is `TRIP_GRAPH_SELECT_KANONISCH` in `lib/trips/foundation-e-select.ts` (blob `19f2a373cbe1cac7a251b968d6bab2a53798e56e`). The complete graph comprises exactly:

1. `public.trips`
2. `public.trip_stages`
3. `public.trip_days`
4. `public.trip_items`
5. `public.trip_readiness_items`
6. `public.trip_travellers`
7. `public.trip_traveller_citizenships`
8. `public.trip_traveller_documents`

Reserve, under the actual authenticated user JWT, takes phantom-safe SHARE table locks for these eight tables in a fixed order, selects the own Trip by the actual authenticated UID, checks expected revision and canonical child completeness, then obtains raw canonical rowset R0. It returns that own rowset to the authenticated server caller and privately stores a digest D0 of complete typed raw values, exact relation membership/row identities and per-row xmin. Neither graph nor digest enters global provenance. Capture is bounded in count and bytes; over-bound or missing relation data refuses before mapping. Snapshot and Finalize do not return graph material through service_role.

Let:

- M = the unchanged exported `graphZeileZuReise`.
- T = the subsequent actual `reiseLaden(tripId, signal)` result under authenticated RLS.
- C = a bounded deterministic encoding of all mapped values, with object keys ordered and absent/null distinguished.
- N = order normalization ONLY for unordered identity collections: party, each person's citizenships/documents and readinessItems. It sorts complete elements by their stable identities; duplicate identities refuse. It omits no field and does not rewrite dates, references or declarations. Stages/days/items and any semantically ordered route/input arrays keep their existing mapped order.

The mandatory equation before projection is:

```text
C(N(M(R0))) === C(N(T))
AND pilotContextCurrent(T)
AND declarationReferencesValid(T and its exact persisted declaration)
AND the exact compiled slot/scope/both-date checks for T
```

The provider and unchanged `requirementsFuerReise` receive **T itself**, not M(R0), a reconstructed fixture or a narrowed DTO. The result context fingerprint is computed from that same T using the existing canonical helper.

After all original/closure/engine work, load T1 through `reiseLaden` again. Require its complete normalized mapped values to equal M(R0) and T, and its exact existing context fingerprint to equal T's fingerprint. Authenticated Finalize then takes the same eight phantom-safe table locks, reselects current own raw graph Rf, verifies both complete raw values and current MVCC digest against R0/D0, rechecks actual owner/revision/declaration and all other closure state, and runs the unchanged fresh #1142 guard after relevant waits. Each transaction releases its own locks normally; none is held across HTTP calls.

**Precise ABA limitation:** xmin is not a history ledger. An inserted-then-deleted child which has vanished before final capture can be invisible in the surviving-row digest. This design does not claim to detect every transient write. Its guarantee is that temporary graph B cannot be used by the engine under an A reservation: a `reiseLaden` result B fails complete value equality before projection. If the actual projected Trip is A and the final locked graph is A, an unobserved temporary B does not change that result. Surviving row changes/recreation are additionally caught by the short-lived MVCC digest. Missing legacy-fallback child data remains unavailable.

## 2. Finite reconciliation without resetting or republishing

Add immutable non-personal `official_accepted_trip_private.operations` and a separate minimal witness-ack state to the proposed candidate. Each prepared publication gets a server-generated random operation UUID, distinct from its authorization token. The UUID is bound into the immutable prepared manifest. The atomic final publication writes the durable operation row with:

- operation UUID and admitted contract/policy digest;
- exact known prior lifecycle epoch/sequence/head hash;
- exact successor epoch/sequence/head hash;
- accepted receipt/version fingerprint and prepared-material digest;
- commit acceptance timestamp and operation kind.

This row has no user/session/Trip ID and no cascading dependency on reservation/stage cleanup. It is committed atomically with the immutable version/current projection/lifecycle transition. Uncommitted attempts leave no committed operation. The committed operation survives authorization-record cleanup and a lost final HTTP acknowledgement.

At most one unwitnessed successor is allowed for the candidate head. Finalize refuses another publication while that predecessor operation has not completed witness acknowledgement. Readers refuse an unwitnessed head. There is no queue of automatically publishable prepared facts.

Add a private server function `reconcileAcceptedStorePublication(signal)` in the new `producer-server.ts` (or a narrowly focused new `reconciliation-server.ts` in the approved package). It accepts no caller-selected source, operation, head, receipt or transport. It is callable by the internal producer recovery path and by future compiled operator wiring; **no HTTP mutation route, scheduler, automatic retry loop or live binding is added**. The test harness invokes this actual private function after deliberate lost-ACK cases.

The bounded call performs exactly one reconciliation attempt:

1. Check the same compiled deployment, target, key-policy and independent witness bindings. Use `confirm_v1` in observe mode to acquire the relevant head lock and read the sole committed unwitnessed operation plus its exact immutable successor/receipt/manifest binding. It does not rely on the old token still existing. Zero or ambiguous rows gives unavailable; absence is never permission to republish.
2. Read the independently stored witness. It must equal the operation's exact known prior or exact already-acknowledged successor. A different epoch, rollback, later/different head or gap refuses and leaves the candidate unavailable.
3. If witness equals prior, perform one witness CAS **prior → this exact committed successor**, binding the operation UUID. If it already equals this exact successor including operation identity, treat that as idempotent witness confirmation. Never set the witness from an arbitrary database head.
4. After an acknowledged CAS, or one bounded read resolving an unknown CAS ACK, require exact successor equality. If unknown remains, return unavailable with the operation still pending.
5. Use service-only `confirm_v1` witness-ack mode to record only the exact acknowledgement for this existing immutable operation after rechecking its full committed binding/current head. This mode cannot publish facts, alter legacy projection or choose a new head. A separate bounded confirm observes the committed acknowledgement. Lost/rolled-back ack bookkeeping stays pending and can be retried by a later explicit reconciliation call.

The service writer is trusted only for this narrow server-owned transport. A recorded database ack alone never substitutes for the independently read witness in the consumer. A restored database behind the external witness, a restored witness behind a previously acknowledged operation, missing committed operation, or mismatching successor remains unavailable. There is no DB-head reset, historical republishing or automatic canonical producer restart.

Actual finite request/SQL/cleanup budgets apply to every step. Reconciliation never holds a DB transaction while awaiting the external witness. Local proof uses a separately owned witness fixture which is not restored with the SQL cluster; it is explicitly a fixture, not production witness custody.

## 3. Original encryption stays entirely in server crypto

Revise the RPC table in the checkpoint:

- Prepare accepts a bounded **ciphertext envelope and exact metadata/digests**, never plaintext original bytes or a raw key.
- Snapshot returns that exact ciphertext envelope and immutable metadata only to service_role; server code decrypts it.
- Finalize receives only its opaque token and exact operation-bound expected digest; no plaintext, ciphertext replacement, key or caller authority facts.

The new package uses Node server crypto for authenticated encryption, proposed envelope version 1 with AES-256-GCM, a fresh cryptographic 96-bit nonce per encryption and a 128-bit tag. A dedicated `custody-server.ts` in the approved package may own this concern. The server-owned 32-byte key is obtained only through the absent-by-default compiled key binding, held in memory for the bounded operation, and never serialized into SQL/JSON/RPC arguments, persisted, logged or sent to a client. An opaque key-policy/key ID is allowed in metadata. No real key is created or provisioned here; native fixtures use explicitly ephemeral test keys.

Canonical associated data binds envelope version, operation UUID, receipt/version and original pin, original content SHA-256, immutable source/representation identity, original retrievedAt and retention bound, and key-policy ID. These exact canonical bytes and ciphertext-envelope digest are part of the prepared manifest. Stage manifest/ciphertext cannot be updated after preparation; abort/expiry can delete only the provisional material. Final publication copies the exact stage envelope and immutable metadata into accepted custody in the same transaction as its version, then consumes the stage. It cannot accept a replacement envelope.

Server canonical verification establishes raw-byte hash and fresh deterministic acceptance before encryption. SQL does not claim it can establish a plaintext hash from an undecryptable ciphertext; it enforces protected service preparation, immutable exact stage/decision/manifest binding and final current authenticated authority. A fresh reader authenticates and decrypts the exact stored envelope, recomputes the complete raw hash and canonical original/acceptance closure, and refuses any mismatch. Nonce/tag/AAD/ciphertext/key tampering is in the native negative matrix.

Do not use the older synthetic custody key RPC. Its key/review/admission restrictions remain unchanged. No crypto secret is placed into an exception, debug result or test artifact. Buffer cleanup is best effort; JavaScript garbage collection is not represented as provable memory erasure.

## 4. Structural closure profile: bounded preflight first

The current canonical file is `lib/readiness/official-truth-integrated-pilot-bundle.ts`, blob `ee4a35d224b7177c6b07efcf4b131433751f70d1`:

- `verifyIntegratedPilotBundle(bundle)` uses the fixed depth limit **8**.
- `verifyLocalIntegratedPilotBundle({profile: 'ot-integrated-pilot-local-closure-v2', bundle})` uses the explicitly selected local depth **16**.
- Neither is a fresh authorization or production source/admission capability.

No actual new complete accepted-store bundle exists before material implementation, so this design does **not** assert a depth-8 PASS or borrow an old CH→GB bundle as the new proof.

Make the first bounded post-ACK construction checkpoint the actual new synthetic complete bundle assembled from the agreed canonical producer values: actual CH→DE global cell, real constructed packet/extraction/decision, receipt, custody binding and every referenced artifact. Before SQL/UI implementation proceeds, run the unchanged depth-8 verifier on it and independently run the explicit local-16 verifier on byte-identical input for diagnostics. Record receipt fingerprint, each artifact pin, full graph node/edge counts, total bytes, observed longest depth, exact two outcomes and unchanged verifier blob. No dependency is omitted/flattened to pass a bound.

The proposed product structural consumer is depth 8 **unless a separate exact successor amendment is first approved**. A depth-8 failure is not an automatic local-16 retry in the consumer. If actual complete bytes require depth 9–16, return that evidence and a narrowly versioned successor-profile proposal to Root before editing the canonical verifier, storage contract or product consumer. Existing depth-8 semantics and explicit local-16 semantics must remain unchanged. If depth exceeds 16 or semantic checks fail, fix the actual bounded construction or return the precise incompatibility; no larger implicit bound.

The old local storage/retained verification contract remains explicitly local structural evidence. It is not renamed or presented as a production closure profile. No current Task/architecture acknowledgement is interpreted as advance permission to promote it.

## 5. Bounded session transport and exact frozen retrieval exception

### Amendment A: no-argument compatibility, owned work and real SDK proof

Keep no-argument `createServerComponentClient()` identical in target/anon key, read-only cookie adapter, Auth identity and SDK options. Preserve the existing compatibility alias, route/action factories and all old callers.

The new optional bounded invocation accepts only the request AbortSignal and a server-created opaque lifetime scope if tracking ownership needs it; it must not accept custom fetch, URL, credentials, headers, tokens, cookie adapters or authority callbacks. The scope is constructed by code, exposes only abort/deadline/operation-tracking/settlement, and is not a product request input. Forward the existing `reiseLaden` signal into this bounded client without changing its canonical query or fallback behavior.

The factory supplies its own fetch wrapper internally. Before any native fetch it checks the owned lifetime. Compose every applicable signal—owned request/deadline, an input Request's signal, and RequestInit.signal—so a supplied SDK signal never replaces request cancellation and vice versa. Preserve normal Request/init method, body, headers, credentials and target semantics. Track all started native/SDK operations and complete response-body consumption; every actual awaited SDK call remains owned until it settles. Remove listeners/timers when settled. No abandoned Promise.race is accepted as cleanup.

**Pinned SDK gate:** Root verified auth-js 2.71.1 / supabase-js 2.57.2 / ssr 0.6.1 / postgrest-js 1.21.3. A fetch AbortSignal alone does not prove that Auth refresh retry/backoff bookkeeping has ended. The first bounded transport proof must run those actual installed packages with an expired synthetic session and cancellation during real refresh work. It must prove:

- no native network request can start after lifetime abort, including a later SDK retry;
- all already started fetch/body/SDK work actually settles and is awaited, including constructor/initialization or refresh bookkeeping;
- the caller's bounded settlement budget accounts for the actual pinned SDK retry behavior; no immediate-settlement claim is inferred from abort;
- neither a later refreshed JWT nor a late response extends the originally pinned authorization/request deadline or produces a late positive;
- existing no-argument identity/cookie behavior and independent Request/init abort behavior remain intact.

Use actual pinned SDK code and normal protocol-faithful synthetic Auth fixtures. Do not fabricate a special Auth response merely to terminate retry, alter the dependency, monkeypatch SDK internals, suppress a required negative or silently disable refresh semantics. If actual SDK settlement cannot satisfy the finite contract under this narrow amendment, return that concrete result to Root before changing session/auth behavior. No SDK settlement PASS exists yet.

The request has a success deadline and separately bounded draining/cleanup work; crossing the success deadline can never yield a successful envelope. Abort does not allow returning while owned SDK work continues. SQL/HTTP budgets must be selected only after the pinned settlement proof rather than inventing an unverified instantaneous bound.

### Amendment B/D: one exact frozen retrieval importer

Permit only:

`lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts`

as an additional production importer of the existing `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport`. Its catalog transport is privately code-owned and bounded; no request-provided transport/source/profile is accepted. Use the frozen **64KiB** ceiling. No marker, privileged getter, HTTP implementation, framing or source admission is changed.

The retrieval source `lib/readiness/official-truth-server-owned-retrieval.ts` must remain byte-identical to baseline blob `5998fdea54d3337fb68cd7111460b59e43a3cef7`, including its existing comment. The precise exception is recorded by Root's amendment and the finite importer guard, not by silently rewriting that frozen runtime.

The intrinsic HTTP timeout is 10,000 ms and is not parent-abortable through this existing entry. Refuse to start without its full remaining 10-second budget plus the bounded catalog/owned overhead needed before that phase. Once started, await the retrieval's actual settlement even if the parent lifetime aborts, then refuse a late/aborted positive. Do not wrap it in an abandoning Promise.race or claim parent cancellation reaches its internal HTTP controller. No real-origin request is made in this package's verification.

The exact existing test modification is `lib/readiness/official-truth-same-request-extraction-server.test.ts`, current test 21 (the exact `treffer` list previously containing `[ABRUF_DATEI, DATEI]`): add only the new producer path and rename the test title to state the finite exception. Keep all other same-request assertions/semantics. Include this path in the final baseline-blob manifest.

## 6. Exact addendum file-plan delta and remaining gates

Beyond checkpoint A–D, the necessary named deltas are:

- `lib/trips/daten.ts`: pure export of the existing mapper/raw input type and forwarding its existing optional signal; no mapping/read semantics change.
- New `custody-server.ts` in the approved new package, if separated from canonical/database modules.
- Optional new `reconciliation-server.ts` in the same package; otherwise the private function lives in producer-server.ts.
- New candidate's immutable `operations` plus exact witness-ack bookkeeping and the two finite confirm modes; no new RPC name or HTTP route is required.
- Existing exact retrieval importer-guard test above, in addition to the already named exact hygiene/test amendments.
- A separately versioned closure-profile amendment **only if the actual preflight requires it**. Nothing in this addendum authorizes that future amendment in advance.

The two first implementation proof gates are actual complete-bundle depth8/16 diagnostics and real pinned-SDK expired-session cancellation/settlement. They are prerequisites to claiming an executable product pipeline, not excuses to leave an architecture-only deliverable. On pass, proceed through the complete agreed producer → durable accepted store → distinct fresh reader → actual Trip → existing engine → bounded Workspace path. On a precise contract incompatibility, return it in this same session with the needed narrow amendment.

All #917 hosted-readback, #1131 framing, #985 protocol/marker/getter, ownerMac/Bern, privacy, actual source/key/retention/hosted/JWT/deployment activation gates remain exact. No implementation or verification of held code was performed for this addendum.

**RETURN / STOP pending Root's concrete architecture and amendment acknowledgement.**

