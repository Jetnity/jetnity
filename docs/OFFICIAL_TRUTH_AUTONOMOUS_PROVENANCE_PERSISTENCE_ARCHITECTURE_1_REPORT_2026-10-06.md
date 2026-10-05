# Official Truth autonomous provenance persistence architecture 1 — Report

Date: 6 October 2026
Issue: [#858](https://github.com/Jetnity/jetnity/issues/858) · Draft PR: [#859](https://github.com/Jetnity/jetnity/pull/859)
Branch: `docs/official-truth-autonomous-provenance-persistence-1`
Logical writer: **Jetnity Official Truth autonomous provenance persistence architecture 1** · Generation **1**
Session: `01a10e26-495a-7340-acd1-c58fdd047aac`
Model / effort: **`gpt-6-astra` / `xhigh`**, read from this session's recorded `turn_context`; session metadata and environment agree.

## Delivered result

The [architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md) selects **Option 1**: exact canonical receipt bytes, a shared content-addressed immutable artifact store with closed typed codecs, and immutable root/dependency links verified against canonical parent content.

**AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_READY_FOR_IMPLEMENTATION_DESIGN**

This is the author's architecture classification, not independent TL PASS. It only permits TL consideration of a separately dispatched implementation/SQL-design slice after re-evaluating its relationship to the separate retention/lifecycle gate. It grants no SQL, migration, DB/Supabase operation, Development/Production apply, retention policy, Rule acceptance or F8.

## Design findings

1. **B is the authority for stored receipt content.** B is exactly #855's `C(payload)`, not the receipt wrapper or a JSONB serialization. Recompute the unchanged `ot-provenance-v1` fingerprint with its LF-separated domain. Validate canonical bytes and all checkable historical derived identities. Parsed indexes cannot repair or replace B.
2. **No receipt field is added.** Root dependencies are the existing 8–11 Pin slots. Support scalar preimages stay in the receipt; global scope and Evidence lookup identities remain derived where #855 already defines that. Raw Evidence/review/body records are not dependencies.
3. **Artifact edges must be committed by their parents.** The generic store has a closed codec per type/version. Except for #855's exactly three-field global-definition leaf, proposed canonical artifact manifests include their exact dependency Pins in hashed bytes. Link tables are checked projections, not an independent mutable manifest. Complete selection/catalog snapshots remain complete.
4. **Semantic-version identity and blob identity are both enforced.** Same id/version cannot acquire different bytes/digest/type; same digest cannot accept different bytes. Exact duplicate insertion includes full closure/link verification. Atomic publication prevents visible partial receipts; conflicting concurrent writes fail closed.
5. **Historical independence has explicit limits.** Unknown versions, missing artifacts and corrupt bytes/edges have bounded distinct results. No latest/current/main lookup, source fetch, extraction, acceptance, repair or write occurs. A historical reader cannot establish original server custody or recompute omitted raw-body/review preimages.
6. **Bounds are deliberately conservative.** Receipt ≤256 KiB, direct references ≤11, total artifacts ≤256, edges ≤1,024, one artifact ≤1 MiB, artifact closure ≤8 MiB and longest graph depth ≤8. Existing narrower support/assignment/fact/catalog bounds remain. A larger runtime-valid snapshot is refused intact, never truncated or represented by only its winning definition.
7. **Rule references do not confer authority.** A later accepted Rule version may refer to the exact fingerprint under its own separately reviewed contract. Presence/integrity does not accept a Rule, refresh Evidence, authorize F8 or permit storage. `regelKandidatAkzeptieren` remains untouched.
8. **Access/privacy/lifecycle remain separate.** Private server write authorization and custody checks are distinct from RLS or digest validation; no traveller/browser writes or default public reads. No PII/hash-of-PII/raw government bodies. Optional insertion metadata is external to semantic authority and requires minimization review. No retention, delete, tombstone, erasure or backup policy is chosen.

Option 2 either illegally expands the receipt schema or duplicates the full closure in a separate external package without a demonstrated need. Option 3 fails because present catalog/current rows cannot reconstruct the exact historical execution closure. No storage cost optimization takes priority over those integrity boundaries.

## Evidence read

Live Git/GitHub startup reconstruction read origin/main, operating mode, #751, #748 and relevant newer MATERIAL/triage, #858, #859 and dispatch `6004267747`, #857 with current Changed Files, the complete immutable binding task and merged #855 architecture/report/handoff. #294 supplied product truth constraints and #741 future F8 context only.

Repository inspection covered the current store writer; content/Evidence identity and catalog loader; extractor/policy definitions and limits; applicability bounds; the content-identity v2 and hardening migrations and reports; operating-mode guard; and relevant repository governance, product, logic, architecture and continuity guidance. Broad default instructions to update global documentation are superseded by this task's exact five-file ownership. No global governance file was edited.

Live #751's updated top section controls over its stale lower historical sequence/no-writer paragraphs. #748 latest relevant MATERIAL is `5988971332`, processed in TL triage `5989855107`; no newer material was present at startup. Development hardening applied/Production Official Truth absent are **reported continuity**, not hosted database verification performed by this writer.

Official vendor documentation was checked only for storage/access facts: [PostgreSQL JSON types](https://www.postgresql.org/docs/18/datatype-json.html) and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). The Supabase skill was used for repository-only privilege analysis; its schema/apply procedures were not applicable to this docs-only task. Its markdown changelog endpoint failed; the [HTML changelog](https://supabase.com/changelog) was available, with no relevant change requiring an implementation here. No hosted Supabase tool or DB command was used.

## Immutable identity and parallel guard

| Item | Evidence |
| --- | --- |
| Baseline / origin/main / merge-base | `7fb95414db6b7e4de12bea0df29b2c771081b9d4` |
| Immutable task seed | `68c70a60fc0b5ac55dc798394927cedd37d13b24` |
| Immutable task Git blob | `791480c1ef8adbc74a234f44d7ed2ef73955e493` |
| TL dispatch | [#859 comment 6004267747](https://github.com/Jetnity/jetnity/pull/859#issuecomment-6004267747) |
| Mode | `NORMAL`; special Product-Owner gates still apply |
| Initial #857 head | `f4105039a0ae04a91d02b9e72d6401ff547333ae` |
| Initial #857 Changed Files | Only `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_TASK_2026-10-06.md` |
| Initial overlap | Empty intersection with all five paths below; also disjoint from #857's complete task-authorized runtime/test/docs path set |
| Session / model / effort | `01a10e26-495a-7340-acd1-c58fdd047aac` / `gpt-6-astra` / `xhigh` |

The separate checkout is on this slice's authorized branch. #857's checkout, branch and files were not edited or synchronized. During prepublication re-read #751 added #860/#861, a parallel docs-only global-admission/metadata-custody architecture writer. #861 was read at `4d37d8a6c5d4b2e9945cc699bbe45b234657eb6b`, Draft, with only `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_TASK_2026-10-06.md` changed. Its path intersection is also empty. This is additional live coordination evidence, not a dependency on that unreviewed architecture or authority to modify it.

## Exact changed-file set

The PR diff against live main consists of the seeded immutable TASK plus four new documents:

1. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_TASK_2026-10-06.md`
2. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md`
3. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_REPORT_2026-10-06.md`
4. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_HANDOFF_2026-10-06.md`
5. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_SELF_REVIEW_2026-10-06.md`

The delivery commit changes only the latter four; TASK remains byte-identical to the seed.

## Validation and exact-head evidence

Prepublication live re-read completed **6 October 2026, 00:30 Europe/Zurich (5 October 22:30 UTC)**. Git fetch and GitHub agree on unchanged main, NORMAL mode and #859 seed/Draft. #858, #748 and #859 dispatch/comments are unchanged; latest #748 comment remains `5989855107`. #751 adds #861 as described above and preserves this writer's scope. #857 remains Draft at its task seed with the same one-file Changed Files set. Both path-set intersections are empty.

| Local validation | Result |
| --- | --- |
| TASK bytes compared directly to seed | Identical; Git blob `791480c1ef8adbc74a234f44d7ed2ef73955e493` |
| Proposed diff vs live main | Exactly the five docs listed above; no other path |
| Markdown local links, balanced fences, final newlines | PASS |
| `git diff --check`, staged and committed diff checks | PASS |
| Operating-mode guard | PASS with explicit PR event, exact branch, live baseline and HEAD |
| Merge-base | `7fb95414db6b7e4de12bea0df29b2c771081b9d4` |
| Before delivery commit | 1 ahead / 0 behind; four delivery docs only are new |
| After one local delivery commit | 2 ahead / 0 behind, clean working tree; committed five-file scope and operating-mode gate PASS; remote equality must be reverified after publication |
| Session/model/effort | Current session metadata confirms the exact values above |

No runtime/test file is changed. No application tests, typecheck, lint, build, dependency installation or DB fixture is run locally for this explicitly docs-only task. The adversarial matrix is a future implementation specification, not an executed suite or proof of working persistence.

The authorized shell push failed with `could not read Username for 'https://github.com': Device not configured`; it did not move the remote branch. The already authenticated GitHub connector is the publication path: upload the four exact delivery blobs, compare the resulting complete tree with the checked local tree, create a single delivery commit on the immutable seed, then fast-forward only this branch with expected old head and `force=false`. Server commit metadata may differ, so the published SHA may differ from the local commit while the complete tree must be identical. After fetch, align the clean local branch only after proving that byte/tree equality; recheck remote head, task, scope, mode and ahead/behind. No credentials are printed/changed and no authentication gate or force push is bypassed.

Prepublication and postpublication evidence must refer to the actual checked head. A commit cannot contain its own SHA or CI results triggered by publishing it; the final delivery message supplies the separately read remote exact head, actual CI and Vercel Preview status, clean-tree confirmation and final overlap check. The task seed's CI/Preview is not evidence for the delivery commit. Pending/queued hosted checks must be reported as such; no fabricated PASS or repeated rerun loop.

## Effects, limits and remaining gates

No runtime, tests, SQL, migration, DB/Supabase write, Development/Production apply, retention policy, source/profile registration, extractor/composition activation, provenance producer/store implementation, accepted Evidence, Rule acceptance, F8, provider activation, CH imports/CH-11 or Trip Workspace/B01 work occurred. No API/UI/travel-graph behavior or running cost changes.

Current runtime still lacks the producer/global-admission/trusted-original-metadata and artifact-pin prerequisites described in #855. A generic artifact store is not a generalized permission to archive arbitrary data/code; every exact codec/preimage needs future review. Storage caps may refuse large complete catalogs, deliberately. Privileged-owner corruption remains outside an application append-only guarantee; no signature origin claim is made.

Separate remaining gates: independent exact-head TL review; persistence implementation/SQL design; Product-Owner + Security + Privacy retention/lifecycle decision; exact Development apply approval and verification; F8/acceptance integration; Production Product-Owner approval. Producer/source/profile/extractor/policy/provider activation remains separately gated.

PR stays **Draft**. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
