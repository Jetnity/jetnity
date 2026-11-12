# HS1 V1 — source handoff / NOT_RUN

## Exact identity and authority

Logical author: **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**. Original new-task session: `/root/hosted_intake_writer_g1`. This is not a replacement implementer and no replacement exception is claimed. TASK V1 and both bounded Root review amendments are copied in full in HOSTED_INTAKE_STORE_TASK_V1.md with their persisted URLs.

Sole parent: `dfd692440762b50183fdebbfd6bf8dabde4662d0`. Parent tree: `cbc79e627161d4ace132b84cf057c18adc86586c`. Mode NORMAL. Exactly the eight new paths selected by TASK V1 are added; all 9476 original leaves must retain path, type, mode and blob. The manifest records the full base inventory digest and exact source mappings. Final immutable commit/tree and the observed full recursive-tree comparison are provided in the delivery receipt, since a file cannot embed the identity of its own containing commit/tree without circular hashing.

No branch, PR, Ready or merge is authored here. Only Root can accept or publish this source, integrate the independently reviewed PG17 CI prerequisite, run the native gate, and decide subsequent exact-head gates. No author self-review is a TL PASS. Every changed head requires renewed gates.

## What the source changes

The new installer provides a finite non-superuser ownership path for the existing S1 custody package. The actual LOGIN/session/current postgres must be the NOSUPERUSER CREATEROLE database owner on PG17. Each newly restricted role receives its exact PG17 automatic bootstrap-granted ADMIN-only edge. A second owner edge, issued by the actual postgres, grants SET true with ADMIN and INHERIT false. The installer verifies both grantors/options before schema creation, uses postgres's existing database CREATE privilege, and creates tables/functions under the isolated owner. It resets role, revokes only its creator-issued temporary edge with RESTRICT and verifies final bootstrap-only membership and absent SET/USAGE privileges.

There are no global/owner default-ACL edits and no database CREATE grant to the new owner. Initial ACLs must match the engine baseline; foreign ACLs are refused, not silently normalized. Only baseline PUBLIC EXECUTE on the fourteen new functions is removed in the same transaction. The caller gets API schema USAGE and exactly four API EXECUTE grants. Final finite schema, table, function, column and type ACLs are validated, including exact harmless baseline row/array PUBLIC USAGE without schema/table access. Managed postgres attributes, stored settings and outgoing platform memberships remain outside mutation scope.

The original S1 three tables/constraints, FORCE RLS policies, immutable triggers, signatures, all fourteen full declarations and bodies, and complete 55456-byte retention JSON are copied byte for byte. This remains **UNTRUSTED proposal custody**. It does not approve a method, supply official source truth, bind a real backend/Owner, accept a Rule, or enable any public answer.

The new recovery is independently gated, unused-only removal. It verifies exact supplied target/new-object OIDs, package state and no-consumer prerequisites; forces READ COMMITTED before queries; takes real bounded ACCESS EXCLUSIVE locks on all three custody tables; and refuses any original, reservation or completion. It uses the same temporary SET-only ownership path and finite RESTRICT teardown. History is never cleared to make recovery pass.

## Exact new source pins

| Source | UTF8 bytes | SHA256 |
|---|---:|---|
| install-candidate.sql | 123162 | `7197138e3d2be969cbc0b5c76f89143b9268035287aa84647b2a9747c7c6ecd9` |
| recovery-candidate.sql | 42117 | `539d6014fbe75129fa528f7214e69658f0fc0ff9ad7c8879efaf18f183ebcdf8` |
| native.ts | 64710 | `d373c6aaac7d61006fcbc56d95151907bf34a2415e40fa943f2a1e086568cd02` |
| mandatory test wrapper | 348 | `39a52aafd6caf137ef1e8b0bd22844889c7fd90747e209c82fb0f5c141889263` |

The complete artifact byte/SHA256/Git-blob set is in the manifest plus the immutable delivery receipt. The manifest's own digest is carried by that receipt and its enclosing Git tree; no impossible self-digest is asserted.

### Original full-body pins retained

Original SQL: blob `8ef08c3131e2aeee61a16a565e51b2fb322c8572`, 88575 UTF8 bytes, SHA256 `db3256889195ce4f68daa847b55f23a7e7433d4f4c8bb5e49cfda3be54484719`.

| Function | Body bytes | Original and candidate body SHA256 |
|---|---:|---|
| exact_keys_v1 | 238 | `d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba` |
| safe_data_v1 | 1137 | `bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf` |
| binding_valid_v1 | 1000 | `8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1` |
| unique_json_v1 | 820 | `d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609` |
| proposal_shape_v1 | 55498 | `4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9` |
| data_nodes_v1 | 786 | `ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85` |
| shape_matches_v1 | 3595 | `760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a` |
| proposal_retainable_v1 | 298 | `d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797` |
| immutable_v1 | 767 | `ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86` |
| record_v1 | 418 | `f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3` |
| capture_v1 | 2212 | `5488c6a3d2613b99f58890fcd2aac7205d3f766ce298102a8a655019787fa1b7` |
| read_v1 | 820 | `3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4` |
| reserve_v1 | 2193 | `82055d6a6f736a116c90a500d294d77953a338731e0a5047f5fd9dac6c8746d7` |
| finish_v1 | 6993 | `d4fa49784f32d0feccdc7e9beaa6cb1e552fb0117be51e91b40b3b4a8556f262` |

The manifest additionally supplies every complete declaration hash and source/destination byte offset, separate table/policy/trigger and retention-JSON spans, and a complete nonoverlapping inverse map covering every byte of original and candidate SQL. It records the original native full-file hash, all ten original semantic group ranges, and every harness adaptation. Original S1 installer, rollback, native budgets and shared infrastructure remain untouched.

## Native proof source

The mandatory new test uses the existing owned Unix-socket cluster and unmodified wire client, including duplicate-column refusal. It asserts actual PG major17 and a real LOGIN postgres identity with relevant hosted NOSUPERUSER attributes. Bootstrap is restricted to synthetic fixture setup, controlled faults and independent observation; it is not used as the installer via SET ROLE. Only the new HS1 installer/recovery is executed as package proof.

The source contains 18 required groups: seven new installation/recovery groups, all ten original S1 semantic groups, and final after-use refusal. Coverage includes creator/default/collision faults, exact grantor/member/role/ACL/catalog faults, complete rollback and unrelated user-catalog preservation, all original S1 semantics, unused recovery, external-dependency/consumer refusal, R1 reader-vs-caller identity, R2 inherited-repeatable-read late capture, and actual blocking lock/commit behavior. The known MA1 names and unrelated history sentinels are synthetic coexistence fixtures; actual hosted HMA1 composition is not claimed.

Effects are fixed at 150000ms. The unchanged OwnedTestLifetime provides a separate 35000ms drain; the wrapper is fixed at 210000ms. The source bounds total connections at 1024, active connections at 24, children at two total/one active, and worker SQL jobs at four per child. Connections and query/commit promises are owned through the lifetime wrapper; adapter calls and child IPC jobs/close joins are tracked, finite timers are cleared, and successful completion requires zero pending operations, all connections closed, both children joined and the one owned cluster stopped. No optional skip and no widened budget is present.

## Gate status — distinct claims

| Layer | Current evidence/status |
|---|---|
| Source preparation | Authored immutable objects only; final Root/independent review pending |
| Text/pin/tree metadata | In-memory source composition, exact byte/hash mapping and immutable Git readback only; final tree receipt binds results |
| Parser/compiler/type/lint/tests/build | **NOT_RUN** by author |
| Mandatory actual PG17 native proof | **NOT_RUN**; requires separately gated HMA1 CI prerequisite and Root selection |
| GitHub Actions / Preview / full exact-head gates | Not executed or accepted by author |
| Actual Dev target validation / installation | **UNAPPLIED**; no hosted query/apply or credential access |
| Real backend/caller/Owner binding | Unfinished, not selected by HS1 source task |
| Method D1 / official source / pilot extension | Unfinished; no current source revision or signed Owner invented |
| Production/public CH→DE answer | Not activated by this package |

Dev receipts #1139/6816048537 and #1139/6816258415 concern profile/PG17 prerequisites; #1139/6821829506 concerns Data API configuration. They do not close all fourteen remaining full Dev rows. PG1 R3 and HMA1 R2 were source fixes in progress when TASK V1 was selected; this package assumes no acceptance or integration. #917 human evidence stays scoped, its denied action is not repeated/rerouted, and #1131 remains NOT_REQUIRED and untouched.

## Review history and remaining risks

R1 (HS1-RECOVERY-01 / P2) corrected the initial wrong `ot_v3_method_caller` exception to the actual `ot_v3_method_reader`. The source proof preserves the positive exact-reader case and negative unrelated-caller case.

R2 (HS1-RECOVERY-02 / P1) corrected inherited repeatable-read visibility: recovery now selects READ COMMITTED immediately after BEGIN. A real prefix/late allowed COMMIT/suffix proof is authored; exact bytes, history, OIDs and catalog preservation are asserted after refusal. This is a source correction, not evidence of executed data loss or runtime success.

No P0 conclusion about live production is made. The material pending P1 gate is actual execution of the exact non-superuser ownership and history-protection paths on PG17. The finite catalog validator deliberately refuses unexpected role/ACL/object/dependency state; PG17 deparser/property assertions must be verified by the mandatory native run and any concrete failure reviewed without relaxing custody or widening scope. Source/pin self-checks do not establish actual hosted safety. The independent external no-consumer/quiescence recovery prerequisite remains essential even with locks and READ COMMITTED. Production/backend/public activation is still separately unfinished.

## First next action / STOP

Root reviews the complete immutable eight-file candidate and its exact unchanged-base-tree proof, reconciles independent source findings in this same author session, and selects later exact-head execution only after separately accepting the required PG17 CI prerequisite. A new finding means CHANGES REQUIRED, same session fix, new exact source/head and complete re-gating. The author stops at delivery. No HM04, hosted apply, public activation or automatic follow-on is started.

---

# Current handoff: HS1 SOURCE-V2 / LABEL1

This appended current section supersedes only the earlier current-source identity for the four files selected below. The complete preceding Handoff is retained verbatim as SOURCE-V1 history. All prior SQL, custody, native coverage, ownership and execution-boundary evidence remains in force; no runtime acceptance is inferred.

## Task and exact parent

Root's bounded task: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6826971069 . Same original reachable session `/root/hosted_intake_writer_g1`, logical implementer **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**. Sole parent is now `4278696db179cd1b1d056bb64237e3bfff12ef8a`, tree `d3bdd862efb7799bca5d03873b84d139dac7ce5b`. No other main or package is integrated.

The parent has 9484 leaves. Exactly four existing files are selected: the HS1 native source and Task, Handoff, Manifest evidence documents. The expected complement is all other 9480 leaves, with zero additions/deletions. Final observed recursive-tree equality and sole-parent readback are supplied in the immutable delivery receipt.

## Exactly one native label change

Old label:

`HS1 late writer is blocked by recovery locks; each nonempty history stage refuses removal`

New label:

`HS1 recovery waits for an active writer and then refuses committed history; each nonempty history stage refuses removal`

This resolves the nonblocking P3 HS1-NATIVE-LABEL-01 terminology finding described by Root. The recovery is the waiting participant in the observed scenario. No assertion, query, execution order, budget, group count, behavior or cleanup logic changes. All 18 groups and the fixed 150000/35000/210000ms limits remain exactly as before.

Current Native: **64740 UTF8 bytes**, Git blob `6114d5b6a985bcc7715ee2b41cc9101bed10e957`, SHA256 `8a24ad65bdfa85d4e91539b7c9be7e45dac5128625368d605a9cb990134fa2d8`.

Previous Native: **64710 UTF8 bytes**, Git blob `a71ca9a0168bea7c49a54a6affd4d310794337dd`, SHA256 `d373c6aaac7d61006fcbc56d95151907bf34a2415e40fa943f2a1e086568cd02`.

The replacement is the only changed literal, at zero-based UTF8 byte range [33253,33342) in the parent and [33253,33372) in the current Native. It adds exactly 30 bytes. The 64621 prefix/suffix bytes outside that literal are identical. Inserting the old literal between the current unchanged prefix and suffix reconstructs the entire previous 64710-byte Native exactly, with the original SHA256 and blob identity above. The manifest retains this complete three-span inverse and updates every shifted current Native mapping/hash.

## Evidence preservation and status

The previous Task and Handoff raw contents remain exact prefixes. This complete LABEL1 task is appended, with its URL. The previous 52851-byte Manifest is preserved as an exact raw UTF8 string in the new Manifest history, pinned to blob `6d617342c818155f4bd8508737d53960b8f3f5d8` and SHA256 `f57fc8d17d69c1413e41f2d507272ae9481516623860f21b0104e700a97ede0a`. Current artifact pins are updated without any circular self-hash.

The installer, recovery SQL, test wrapper, Recovery document, prerequisite sources and all other tree leaves remain exact. No project parser/compiler/SQL/native/tests/build/APT, CI, hosted action or official-source GET was executed. No ref/PR/Ready/merge is selected. Source V2 awaits independent Root review; actual PG17/main integration remains a separate explicit task. #917/#1131 are untouched. STOP after immutable-object delivery; same session remains available.

## Complete persisted LABEL1 task, verbatim

https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6826971069

## HS1 SOURCE-V2 / LABEL1 — bounded same-session review correction

Root selects the nonblocking P3 **HS1-NATIVE-LABEL-01** correction recorded in independent SOURCE PASS6823221683. Same original reachable implementer: **Jetnity Official Truth V3 Hosted Intake Store1 — Codex Generation1**, /root/hosted_intake_writer_g1.

Exact sole parent: **4278696db179cd1b1d056bb64237e3bfff12ef8a**. Parent tree: **d3bdd862efb7799bca5d03873b84d139dac7ce5b**. This task does not integrate another main or package.

### Exactly one code-text replacement
In scripts/db/official-truth-v3-hosted-intake-store-1/native.ts, current blob **a71ca9a0168bea7c49a54a6affd4d310794337dd**,64,710 bytes, SHA256 **d373c6aaac7d61006fcbc56d95151907bf34a2415e40fa943f2a1e086568cd02**, replace only this group name:

`HS1 late writer is blocked by recovery locks; each nonempty history stage refuses removal`

with:

`HS1 recovery waits for an active writer and then refuses committed history; each nonempty history stage refuses removal`

Root already reviewed the actual interleaving: recovery waits for the active writer, then observes and refuses its committed history. This corrects the label to match the proof; no assertion, query, order, budget or behavior changes.

### Finite file scope
Only these four existing files may change:
- scripts/db/official-truth-v3-hosted-intake-store-1/native.ts
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_TASK_V1.md
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_HANDOFF_V1.md
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_MANIFEST_V1.json

Keep the complete previous Task/Handoff/history verbatim, append this complete task, and update the current Native byte/Gitblob/SHA256 and inverse mapping for the one literal change. Preserve the old manifest history and its exact pins without circular self-hashes. All installer, recovery SQL, wrapper, Recovery document, prerequisite sources and every other tree leaf remain exact. All18 groups, original semantic cases, 150/35/210s limits and ownership/cleanup remain unchanged.

### Delivery boundary
Only immutable Git objects and inert text/hash/tree comparisons; no parser/compiler/SQL/native/tests/build/APT execution, CI/ref/PR publication, Ready, merge, hosted action or official source GET. Full actual tree/sole-parent and raw file readback; give exact pins, complete complement equality and a full Native inverse restoring a71ca9a…. STOP for independent Root review. Same session remains available. #917/#1131 remain untouched. Actual joint PG17/main integration will be a separate explicit Root task; do not begin it automatically.
