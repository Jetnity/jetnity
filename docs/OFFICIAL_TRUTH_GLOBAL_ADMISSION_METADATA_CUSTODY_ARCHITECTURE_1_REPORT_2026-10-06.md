# Official Truth global admission and trusted metadata custody architecture 1 — Report

Date: 6 October 2026
Logical writer: **Jetnity Official Truth global admission trusted metadata custody architecture 1**
Generation: **1**
Issue: [#860](https://github.com/Jetnity/jetnity/issues/860) · Draft PR: [#861](https://github.com/Jetnity/jetnity/pull/861)
Branch: `docs/official-truth-global-admission-metadata-custody-1`
Session: `01a10e2d-fc54-7ad2-93d2-f0f5186402ed`
Model / effort: **`gpt-6-astra` / `xhigh`**, verified from this session's local `turn_context`.

## Result

Delivered the [trust architecture](OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md) closing #855's pre-provenance origin contracts: independently admitted global cells, exact original accepted-Evidence custody, complete server-owned support selection, canonical scope equality, proposal-null review construction and qualification of non-personal full source representations. Fresh same-request retrieval remains an additional independent requirement.

**GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_READY_FOR_PRODUCER_DESIGN**

This is the author's bounded architecture classification, not independent TL PASS. READY allows only later TL consideration of a separate private producer/metadata-custody implementation design. Nothing here authorizes runtime implementation, Evidence acceptance, persistence, DB, Rule acceptance, F8 or Production. The current runtime does not implement these new custody/admission contracts.

## Decisions and evidence

1. **Independent global origin:** preserve #855's exact `{id,version,scope}` definition; keep admission basis and current eligibility separately pinned. Forbid traveller-derived cells, delayed aggregation of personal combinations and itinerary dates relabelled as regulatory dates.
2. **A AND B:** semantic Evidence validity and original metadata custody are different checks. Existing review/store reconstruction can satisfy structural semantics without proving the original observation, validity or acceptance origin. A fresh matching body cannot repair that origin.
3. **Minimum custody record:** bind exact Evidence identity/full preimage, scope, original qualified observation, deterministic validity origin and separately authorized accepted-version origin. No acceptance policy or write implementation is designed. Existing rows without this origin remain ineligible.
4. **Quality is candidate-level:** current `EvidenceVersion` has no quality field. Fact kind/quality and exact membership are custodied by the server-owned support definition/manifest; actual primary/composed execution must agree.
5. **Exact support selection:** independently required item pairs, one eligible exact version per item, sorted unique IDs and full custody identities. Ambiguous versions fail; no newest-value shortcut, missing support, unreviewed extra or post-fetch substitution. Primary remains exactly one support/null policy. Composition preserves phase-A freeze and phase-B complete observations/citations.
6. **Scope values and checksum:** `rule-scope:v1` is insufficient by itself. Require exact canonical parsed equality at every cell→Evidence→review/proof→extraction→candidate-binding→receipt edge, with no privacy redaction/defaults or legal qualifier loss.
7. **Safe review identity:** keep existing v3 preimage/algorithm with server-created `proposal:null` from inception. Never sanitize/reuse a contaminated packet. A new domain would not establish origin; a future internal custody-material seam is required because today's fingerprint entry reconstructs envelopes.
8. **Full-response privacy:** a public URL, official host or successful identity verifier does not establish global/non-personal content. Require a code-owned qualified full-response envelope and context-free transport at original and fresh observation. Do not substitute sanitized excerpts for full-response identity.
9. **Historical linkage without storage design:** define the immutable custody dependency references a later producer must bind to its receipt. Preserve #855 receipt-v1 bytes; do not add fields silently. #859 owns persistence and TL reconciles any later interface conflict.
10. **Freshness claims remain precise:** old observation, legal validity, proof reference and fresh completion are separate. Evidence is proven current at the reference; no implicit freshness-at-acceptance statement or new TTL is introduced.

## Read evidence and scope plan

Startup reads covered live origin/main and operating mode, #751 body, relevant #748 MATERIAL and TL triage, #860, #861 and dispatch comment [6004414878](https://github.com/Jetnity/jetnity/pull/861#issuecomment-6004414878), full immutable TASK, #857/#859 Changed Files, and merged #855 architecture/report/handoff/self-review. #294 was read for product truth boundaries; #741 only for future F8 context. No new legal-source audit was performed.

The latest observed #748 MATERIAL is `5988971332`, with triage `5989855107`; its clarification does not authorize this writer to apply anything. Live top-of-#751 writer/baseline state and code override lower historical active-writer/sequence text. Hosted Development/Production statements are continuity evidence only; no database or Supabase reads/writes were made.

Code examined:

- `lib/readiness/evidence.ts`, `rule-claims.ts`
- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`, `official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`, `official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-content-identity.ts`, the GOV.UK identity profile, and relevant registry/profile tests
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-store-server.ts` and relevant proof/extraction/review/identity/store tests

Repository governance, product vision, architecture, roadmap, relevant decisions, design, quality, README and continuity context were checked. The bounded plan was to write only the four delivery documents beside the immutable TASK, review origin/authority/privacy adversarially, run documentation and operating-mode gates, then commit/publish and read exact-head CI/Preview. API, DB, UI, travel graph and runtime behavior have no changes; no new running cost. The task's five-path allowlist overrides broad default instructions to update global architecture/roadmap files.

## Identity and parallel guard

| Item | Evidence |
| --- | --- |
| Baseline / merge base | `7fb95414db6b7e4de12bea0df29b2c771081b9d4` |
| Immutable task seed | `4d37d8a6c5d4b2e9945cc699bbe45b234657eb6b` |
| Immutable task blob | `d4b734ddf5da998dfa49ebf4129d14e69fa0ea88` |
| Operating mode | `NORMAL`; no override or mode edit |
| Session / model / effort | `01a10e2d-fc54-7ad2-93d2-f0f5186402ed` / `gpt-6-astra` / `xhigh` |
| #857 observed delivery head | `1355a4ff51cdcbeefa8c5992a2c4b9316d083c8b`, Draft; 12 files |
| #859 observed delivery head | `c6a17189aa089106b800cd28414b493dab53495c`, Draft; 5 files |

At startup each parallel PR contained only its seeded TASK. The later expanded path sets were read live; both intersections with this slice's exact five-file set remain empty.

#857 owns four `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1{_TASK,_REPORT,_HANDOFF,_SELF_REVIEW}_2026-10-06.md` files and eight runtime/test paths: `lib/readiness/e4-temporal-rules.test.ts`, `official-truth-store-server.test.ts`, `official-truth-store-server.ts`, `regulierungs-anwendbarkeit.test.ts`, `regulierungs-anwendbarkeit.ts`, `rule-claims.test.ts`, `rule-claims.ts`, `temporal.ts`. All latter basenames are under `lib/readiness/`. None is edited here; no unmerged behavior is used.

#859 owns exactly five `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1{,_TASK,_REPORT,_HANDOFF,_SELF_REVIEW}_2026-10-06.md` paths. No persistence choice or file is taken over. Neither parallel branch is edited or synchronized by this writer.

## Exact changed-file set

The branch diff includes the immutable seeded TASK and four additions:

1. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_TASK_2026-10-06.md`
2. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md`
3. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_REPORT_2026-10-06.md`
4. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_HANDOFF_2026-10-06.md`
5. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_SELF_REVIEW_2026-10-06.md`

## Validation and publication

Publication gates and the final pre-push re-read are recorded below before publication. A commit cannot contain its own SHA or the CI caused by its push; the final delivery message records the independently re-read remote head, CI and Preview. Reviewers must fetch that actual head, not use the seed as the delivery identity.

Prepublication live re-read: **6 October 2026, 00:41 Europe/Zurich (5 October, 22:41 UTC)**. Git fetch and GitHub agree on unchanged main/baseline and task-seed remote head. Mode is `NORMAL`. #751/#860 bodies and the #861 dispatch are unchanged; #748 has 41 comments, no new/changed entry and latest triage `5989855107`. #861 remains Draft. #857/#859 remain Draft on the delivery heads and expanded disjoint path sets recorded above.

| Check | Result |
| --- | --- |
| TASK bytes against immutable seed | Exact byte comparison PASS; blob `d4b734ddf5da998dfa49ebf4129d14e69fa0ea88`. |
| Staged tree against current origin/main | Exactly the five named documents, all additions; only the four delivery docs staged beyond the seed. |
| Path-set intersection with #857 / #859 | Empty / empty, recomputed from live Changed Files (12 / 5). |
| `git diff --check`, `git diff --cached --check` | PASS. |
| Local Markdown links, fenced blocks, UTF-8/EOF and exact deliverable count | PASS; no missing local targets, unbalanced fences or extra document. |
| Operating-mode guard | PASS under PR event, exact branch and baseline/head refs. The committed-head check is repeated before remote publication. |
| Merge base | `7fb95414db6b7e4de12bea0df29b2c771081b9d4`. |
| Before delivery commit | 1 ahead / 0 behind; no unrelated changes. |
| After one delivery commit | Expected 2 ahead / 0 behind; committed/remote equality and clean working tree must be verified in final readback. |
| Session / model / effort | All observed contexts agree: `01a10e2d-fc54-7ad2-93d2-f0f5186402ed` / `gpt-6-astra` / `xhigh`. |

Publication uses the existing authenticated GitHub path and only the authorized branch. If shell Git cannot authenticate, the authenticated connector may publish the exact locally checked tree with the seed as sole parent and an expected-old-head/non-force ref update. A connector-created commit can differ in metadata/SHA; its complete tree must equal the reviewed local tree, and local/remote equality is verified afterward. No credentials are printed, modified or introduced. No extra Product-Owner approval is requested for this already authorized publication.

No application tests, typecheck, lint, dependency installation or production build are run locally for this docs-only slice. No test files are added/modified. Existing tests are read-only specification evidence; the adversarial review is analysis, not an executed runtime test suite. This is the explicit docs-only validation boundary, not a claim that unrun checks passed.

## Effects, risks and STOP

Security/privacy effect: the design refuses structural replay, metadata laundering, unsafe full-response hash preimages and ID-as-capability shortcuts. These protections are proposed architecture, not deployed mechanisms. The principal future risk is treating an origin-required reference as a syntactically valid DTO or interpreting READY as runtime authority.

No runtime/test file, Evidence acceptance, producer/store, storage architecture, SQL/migration, DB/Supabase operation, Development/Production apply, retention/lifecycle decision, registration, extractor/policy activation, Rule acceptance/F8, provider activation, CH import/CH-11, Trip Workspace/B01 or secret work. No new running costs.

Remaining gates are independent exact-head review, separately dispatched implementation design and actual controlled issuance/loader integration, source/global-representation qualification, exact artifact availability, #859 persistence integration and separate retention/lifecycle, Evidence/Rule/F8/DB/Production/provider authorizations. No such gate is consumed here.

PR remains **Draft**. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
