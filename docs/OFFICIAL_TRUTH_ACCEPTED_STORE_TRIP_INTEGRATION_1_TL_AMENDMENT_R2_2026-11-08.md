# Official Truth Accepted Store Trip Integration 1 — TL AMENDMENT R2

Date: 2026-11-08. Work #1155 / DRAFT #1156.
Technical Lead: ChatGPT / Root.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**, same actual session `/root/accepted_store_trip_integration_writer`.
Baseline main remains `e1fe0c696ade9f39b417772b5c065f87530204d6`; immediately preceding task/design/R1 head is `3e5f9e418c2ebc48d0351ae7185e71f07a30d3db`.
TASK V1 and R1 remain unchanged. This amendment resolves only R1 section 7's measured structural-profile decision and its precise private SQL reuse.

## Decision

**APPROVED FOR IMPLEMENTATION: a separately named Accepted-Store structural profile with fixed maximum depth 16, and an immutable binding of that profile in the new accepted ledger.**

The old depth-8 entry and explicit local-depth-16 entry keep their exact contracts. This is neither a product/authority PASS nor permission to install a hosted schema, activate a source, or reinterpret historical receipts as accepted versions. The actual implementation, native durability, authority, original reproof, Trip/Workspace flow and exact-head release gates remain pending.

## 1. Actual evidence, independently checked

The author generated a fresh, complete CH ordinary passport → DE direct-tourism synthetic bundle through the actual new canonical and provenance builders. Root read both complete builders and the fixture/preflight code, checked all 42 recorded Git blobs, compared all 39 pre-existing blobs against the immutable main tree, and copied the exact sources into an isolated reviewer directory.

Root then (a) replayed the byte-identical saved bundle through the unchanged verifier and (b) independently reran the actual fresh canonical construction with a new retrieval timestamp. Both executions exited 0 and produced the same graph measurements and profile outcomes. Read-only reviewer `/root/refresh_independent_review` independently checked the two builders, saved bundle and all 42 embedded source capsules as well.

| Evidence | Exact value |
| --- | --- |
| Original observed time | 2026-11-08T03:05:19.536Z |
| Root exact-byte replay | 2026-11-08T03:08:50.655Z |
| Unchanged verifier | `lib/readiness/official-truth-integrated-pilot-bundle.ts`, blob `ee4a35d224b7177c6b07efcf4b131433751f70d1` |
| New canonical builder | blob `958923cfc13ee1643d38e362f48931f78966e2ec` |
| New provenance builder | blob `e17f07c0cbfe980c6ed1089df4193bb5847f14fa` |
| Synthetic fixture | blob `aa1a1b1010bd76532ad325af851eaa7b6485de09` |
| Original receipt | `ot-provenance-v1:56eb5ec94db3b57346af7d8397e20f6a0362b6dc96722884e177270248737a89` |
| Root fresh receipt | `ot-provenance-v1:32b764bf5bae37c80a0eb562d5ac97118bcfcca163b03966c61e2e7388649e70` |
| Original evidence JSON SHA-256 | `9c812ecad9ee3a758ed136bb82d95a37f4fad1c4be71ddb7da54640548e22c30` |
| Complete saved bundle SHA-256 | `33a763bd2eba1eee325e3608e99c219e1508b5862aa9045b1f9133282f6b3bab` |
| Standard entry | refuses `closure_bound_exceeded`, depth observed 11 / maximum 8 |
| Explicit local diagnostic | succeeds, 40 nodes / 172 edges / 1,113,484 bytes / longest depth 11 |
| Complete archive material | 39 artifacts plus separate custody binding; 6 implementation capsules containing 42 distinct source paths |

The full original and fresh evidence JSONs and Root replay record are persisted beside this amendment under `docs/evidence/official-truth-accepted-store-trip-integration-1/`. The original saved bundle remains unchanged in the reviewer evidence directory. These are structural/canonical proofs with an explicitly synthetic original and registry/extractor selection. They are not Auth, SQL, COMMIT, legal-source or production evidence.

The builders call the actual canonical Evidence/Review/fingerprint functions, actual deterministic extraction with the consumed input-bound execution context, and `regelKandidatAkzeptieren`. The provenance constructor consumes the builder's one-use membership and binds historical review/fact values to that actual execution. Historical eligibility/current-at-reference fields still cannot substitute for current authority or lifecycle checks.

## 2. Exact TypeScript amendment

In `lib/readiness/official-truth-integrated-pilot-bundle.ts`, add only:
- the explicit literal constant `ACCEPTED_STORE_TRIP_CLOSURE_PROFILE = 'ot-accepted-store-trip-closure-v1'`;
- an explicitly structural public entry `verifyAcceptedStoreIntegratedBundleV1`, taking a strictly closed envelope with exactly `profile` and `bundle`;
- this entry accepts only the new literal and delegates to the existing complete private `verifyBundle` semantics with fixed depth 16.

Do not expose caller-selected depth, attempt the old entry first, fall back automatically, flatten dependencies or omit implementation/semantic artifacts. All existing byte/node/edge limits remain unchanged: receipt 262,144; binding 4,096; per artifact 1,048,576; total artifacts 8,388,608 bytes; 256 nodes including binding; 1,024 edges. Existing longest-path/shared-subgraph/cycle/closure/semantic verification is reused without weakening.

Depth 16 uses the already bounded and exercised complete algorithm also used by the physical v2 structural archive. The measured honest graph requires 11; no semantic failure or missing dependency is being excused by the choice. Larger structures still fail. This profile proves structure and cross-artifact semantics only; it never mints acceptance, an authority handle, source qualification or a current-reader grant.

The existing `verifyIntegratedPilotBundle` remains fixed at 8. The existing `verifyLocalIntegratedPilotBundle` remains fixed at 16 and accepts only `ot-integrated-pilot-local-closure-v2`. Old tests and old SQL files remain byte-identical.

The new product provenance/consumer uses the new explicit entry directly and pins that literal in its code-owned contract. Product requests cannot select any profile.

## 3. Physical archive and new accepted authority are separately bound

Retain the existing eight-table physical provenance storage-contract version 2 as the **historical/local structural archive**. Do not invent storage version 3, change old receipt trigger dispatch, rename old rows or imply that a local writer response is current accepted authority.

The NEW candidate must immutably bind the new structural profile and exact archive contract/version through:
1. compiled admission/contract identity;
2. immutable staged manifest/digest;
3. fresh authenticated Finalize with the unchanged #1142 authority guard;
4. accepted-version/decision and exact receipt/complete support binding;
5. committed operation and independently witnessed predecessor/successor digest.

Snapshot, Finalize, fresh Confirm and the product reader compare this full binding. A wrong/missing/mixed profile refuses. Existing historical/local receipts without that protected new binding stay unavailable. A successful old local writer, old receipt, or `idempotent` archive result alone cannot create a new accepted version or adopt an unbound old claim. A duplicate outcome is valid only for the exact already-bound immutable operation; no blind republish/retry is authorized.

The candidate can call the old full SQL validators/publisher as private structural mechanisms. Its own Snapshot remains the separately approved POST/VOLATILE/READ COMMITTED protocol; it must not call or reinterpret the old repeatable-read/read-only public reader as a reservation-writing product transaction. No product import of `scripts/db/official-truth-integrated-pilot-1/storage.ts`.

## 4. Exact candidate-only provenance ACL bridge

Approve the author's narrow plan in the NEW `accepted-store-candidate.sql` only:
- New `ot_accepted_trip_exec`: NOLOGIN, NOINHERIT, NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, NOREPLICATION. It owns the new package RPCs/private routines.
- For existing provenance objects, grant this role only USAGE on `official_provenance_api`, USAGE on `official_provenance_api.artifact_input_v1`, and EXECUTE on the exact existing `official_provenance_api.publish_local_integrated_v2(text,smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[])`.
- Add candidate-only `official_accepted_trip_private.read_archive_v1(text)`, SECURITY DEFINER with fixed empty search_path and bounded exact input/output. It is owned by existing NOLOGIN `ot_provenance_read_exec` and uses that role's already-granted complete retained validation/closure and eight-table SELECT permissions.
- The old read-exec role receives only USAGE on the new private schema, with no CREATE, new ledger table access or new authority-RPC execution.
- Explicitly revoke default PUBLIC execution on the new bridge and grant its execution only to `ot_accepted_trip_exec`. No PUBLIC/anon/authenticated/service_role/local-writer/local-reader execution. Do not grant any membership in old roles.
- No direct old provenance DML/SELECT grants or old RLS policy changes to the new executor. No changes to old local function bodies, old table grants or original SQL files.

The new read bridge only returns structural archive bytes to its private caller. It cannot create acceptance or bypass the outer reservation/version/currentness binding. The implementation must preserve complete byte/edge verification, prove lock/snapshot consistency, bound output before allocation and keep the old local roles unable to reach new accepted versions/originals.

Native direct-role tests and catalog ACL evidence must verify this exact privilege boundary. Any additional existing-object grant/policy/body change requires a separately specified decision before editing; this amendment is not blanket access permission.

## 5. Focused acceptance additions

Add meaningful tests in the new package, preserving all old suites:
- the actual complete CH→DE bundle passes the new structural entry; the identical bundle still fails old8;
- old local16 results and strict local literal remain unchanged;
- the new entry refuses local/unknown/missing/extra profile fields and caller depth options;
- depth, full closure and byte/node/edge bounds retain their exact checks, including shared longest path and semantic mismatch;
- the native complete fresh acceptance→COMMIT→fresh-read flow carries the exact new immutable profile binding and matches TS/SQL structural verification;
- old local archive success or a pre-seeded unbound receipt cannot yield a positive product read;
- wrong/missing profile/receipt/support/operation bindings refuse atomically, leaving no accepted history/current projection on rollback;
- direct old local/anon/authenticated/service roles cannot execute the private archive bridge or read/mutate new ledger/original tables.

The full final bundle will change as actual product code is completed. Recompute its complete source pins and verify the new profile on the final candidate; the preflight is not an exact-head product PASS.

## 6. Remaining work and holds

This unblocks the approved SQL/reader structural integration. The author continues in the same session with actual native proofs and the full Trip/Workspace path. Pinned SDK refresh/background settlement is still independently under investigation; no lifetime PASS is implied.

All R1 decisions, null provider/inactive registries/absent deployment-key-witness bindings, no hosted apply, #917/#1131/#985 and all Owner/source/retention/target/privacy/launch gates remain. No approval request is needed from the Product Owner for this bounded engineering choice; no special Owner gate has been lifted.

Author must not Ready, merge or start a following slice. Root retains full independent review and exact-head release authority.
