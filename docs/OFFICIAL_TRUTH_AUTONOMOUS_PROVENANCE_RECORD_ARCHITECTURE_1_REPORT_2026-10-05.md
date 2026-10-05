# Official Truth autonomous provenance record architecture 1 — Report

Date: 5 October 2026
Issue: [#854](https://github.com/Jetnity/jetnity/issues/854)
Draft PR: [#855](https://github.com/Jetnity/jetnity/pull/855)
Branch: `docs/official-truth-autonomous-provenance-record-1`
Logical writer: **Jetnity Official Truth autonomous provenance record architecture 1**
Generation: **1**
Session: `01a10ddb-bb39-7540-8b3d-72d87605ea5a`
Model / effort: **`gpt-6-astra` / `xhigh`**

## Result

Delivered the [semantic architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md) for a minimal success-only receipt of one trusted global fact production. It specifies the complete proposed field graph, explicit nullability, canonical serialization and hash preimages, candidate/value custody, exact support/identity bindings, composition assignments/citations, global privacy admission, immutable artifact dependencies, failure semantics, replay, versioning and downstream gates. All new names are proposal/not implemented.

**AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN**

This is the author's architecture classification, not independent Technical-Lead PASS. It permits only later TL consideration of a separate persistence/retention architecture slice. It grants no DB, migration, retention policy, F8, Rule acceptance or Production authority. The current runtime cannot emit this proposed receipt; explicit implementation and upstream origin gates remain.

## Material findings and decisions

1. **The current RuleScope is not automatically globally safe.** Its canonical key includes the full citizenship set, one document option/link, residence and possibly travel date. Define an identity-preserving partial projection from an independently reviewed global cell; reject traveller-derived cells instead of redacting qualifiers. This preserves the same-scope invariant without storing personal hashes.
2. **Every hash preimage matters.** `review-packet:v3:` includes `kandidat.proposal`; omission from the receipt does not remove that preimage. Admit only an already proposal-null server-created global proof. Evidence IDs and full-source hashes also need non-personal preimages. Public accessibility of a body is insufficient privacy evidence.
3. **Submitted-material reproof is not original-metadata provenance.** The current graph reconstructs accepted Evidence in memory from submitted envelopes. Fresh server retrieval closes byte/origin equality for current content, but does not establish trusted origin of an originally supplied retrieval time, validity window, global scope or metadata. Receipt production requires independent server custody of those values and the exact accepted support selection, otherwise no receipt. It does not perform Evidence acceptance.
4. **Review identity and produced fact identity differ.** Keep the review key, canonical fact/hash, candidate binding and proof identity distinct. The canonical fact is the deterministic output, never the proposal. A later acceptance input must retain exact private fact custody plus canonical value equality; the receipt cannot reconstruct authority.
5. **Composition metadata must be captured while it exists.** Phase B returns provenance, but the outer result returns only a private seal. The current seal view cannot recover extractor/schema/registry/retrieval/assignment context later. A separately authorized internal hook must preserve that context; a mutable registry lookup or second execution cannot fill the gap.
6. **Minimal duplication is deliberate.** Support entries retain the compact accepted identity preimage and fresh initial-request/completion observations. Scope, support-ID sets and lookup keys are derived where possible. Common identity/final URL/MIME/hash are stored once only after accepted/fresh equality. Original and fresh retrieval times stay distinct.
7. **Exact audit requires immutable dependency resolution.** Large non-personal catalog and executable manifests are referenced by immutable ID/version/digest pins. A digest without its artifact is incomplete evidence; readers must report missing dependency rather than join current rows. This is a future interface requirement, not an archive or retention implementation.
8. **Freshness is a historical statement.** Original Evidence freshness is evaluated at the proof's server reference. Fresh fetch completion normally follows that reference. No freshness-at-acceptance conclusion follows, and no new TTL is introduced.
9. **No failure receipt.** Blocked or failed attempts create no record and no persistent error/security/traveller log. Successful fact production still does not imply acceptance or storage.
10. **Exact content-item semantics win over older prose.** Live composition is keyed by `(sourceId, contentItemId)`; two items of one source can differ, while two representations of the same item are not separate supports. Both production extractor/policy registries remain empty.

## Read evidence

Live startup and prepublication checks cover origin/main, `.jetnity/operating-mode.json`, #751, #748, #854, #855, dispatch comment `6002753876`, the complete immutable task, and #851/#853 changed paths. #294 was read only for product truth boundaries and #741 only for future autonomy/F8 context. No legal source audit or new source family was started.

Code examined at the baseline includes:

- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts` — current composition implementation
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-candidate.ts`
- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/rule-claims.ts`, `evidence.ts`, `official.ts`, `official-truth-store-server.ts`

Read historical architecture/report material for #772/#774 proof graph, #777 retrieval, #781 extractor framework, #787 scope binding, #799 applicability wiring, #801 composition architecture and #803 runtime/corrections. The acceptance trust-boundary architecture remains binding for authority and the single canonical constructor. Later live content-identity code wins where historical reports use source-count semantics or older key versions.

Repository governance, product/architecture continuity and the relevant Official Truth decisions were checked. The task's exact five-document ownership supersedes broad default instructions to update global current-state files. None of those global files was edited.

## Immutable identity and parallel ownership

| Item | Evidence |
| --- | --- |
| Baseline / origin/main | `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec` |
| Task seed | `87f4a14c7025dc793146ac3de6a67d8435e787ff` |
| Task blob | `ebb88606b6fc8e62b84cf3907a6f353812944bd3` |
| Binding task | `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_TASK_2026-10-05.md` |
| #851 observed head | `a6a7ea0ce7f03dc22a5f9ca56b723999da33425f` |
| #853 observed head | `ff4a0c56b02ae71679e32e3aa8ae214327ce1622` |
| #748 newest processed MATERIAL / last comment | `5988971332` / `5989855107`; no newer entry at startup |
| Session evidence | Local current-session `turn_context` reports `model=gpt-6-astra`, `effort=xhigh`; thread ID agrees with session environment |

The #851 namespace is exactly the five `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1{,_HANDOFF,_REPORT,_SELF_REVIEW,_TASK}_2026-10-05.md` paths. The #853 namespace is exactly the five `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1{,_HANDOFF,_REPORT,_SELF_REVIEW,_TASK}_2026-10-05.md` paths. Both set intersections with the five paths below are empty. Neither branch was edited or synchronized.

## Exact deliverable set

The branch diff contains the seeded immutable task plus four new delivery documents:

1. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_TASK_2026-10-05.md`
2. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md`
3. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_REPORT_2026-10-05.md`
4. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_HANDOFF_2026-10-05.md`
5. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md`

## Validation and publication evidence

The local checks and final live re-read are recorded below before publication. The commit cannot contain its own SHA or the CI results caused by its push. The final delivery message reports the independently re-read remote exact head and its actual CI/Vercel observations; reviewers must re-fetch #855 rather than treating the task seed as the delivered head.

Prepublication live re-read: **5 October 2026, 23:12 Europe/Zurich (21:12 UTC)**. Git fetch and GitHub API agree: main remains `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`; mode remains `NORMAL`; #751/#748/#854 bodies and their comments are unchanged; no MATERIAL after `5989855107`; #855 remains Draft on the immutable seed; #851/#853 remain Draft at the exact heads above with the same disjoint five-file sets. Dispatch comment `6002753876` is unchanged.

| Local check | Result |
| --- | --- |
| TASK bytes against `87f4a14c7025dc793146ac3de6a67d8435e787ff` | Identical; `git hash-object` = `ebb88606b6fc8e62b84cf3907a6f353812944bd3` |
| Index compared with live `origin/main` | Exactly the five listed docs, all additions; no runtime/test/schema path |
| Initial and prepublication path-set intersections with #851 / #853 | Empty / empty |
| `git diff --check` and `git diff --cached --check` | PASS |
| Markdown local links / code fences | All local targets exist; fences balanced; newline endings present |
| Operating-mode gate | `node scripts/operating-mode-guard.mjs` with PR event, exact branch and baseline/head refs: PASS |
| Merge base | `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec` |
| Before delivery commit | 1 ahead / 0 behind (immutable task seed); only the four intended delivery docs staged |
| After the one intended delivery commit | Expected 2 ahead / 0 behind; final committed/remote readback must verify this and a clean working tree before STOP |
| Session / model / effort | `01a10ddb-bb39-7540-8b3d-72d87605ea5a` / `gpt-6-astra` / `xhigh` |

The initially sandboxed network fetch could not resolve GitHub; the authorized read-only network fetch succeeded. The later shell push reported `could not read Username for 'https://github.com': Device not configured` and did not move the remote branch. Publication therefore uses the already authenticated GitHub connector: upload the exact four delivery blobs, verify the resulting tree against the locally reviewed tree, create one delivery commit with the immutable seed as parent, then update only the authorized branch with the expected old head and `force=false`. The server-created commit may have a different SHA because it has server-side commit metadata; its complete tree must equal the checked local tree. Local checkout/remote equality is verified afterward. No credentials were printed or changed and no force push is used.

No application tests, typecheck, lint, dependency installation or production build were run locally for this documentation-only slice. No tests were added or changed. Architecture examples/adversarial cases are specifications reviewed against the code, not executed runtime tests. This follows the binding docs-only task; no application-test PASS is claimed.

GitHub CI is independent exact-head evidence. If hosted jobs remain queued or cancelled, report their actual run/job status; no infinite reruns and no fabricated success. Vercel Preview must likewise match the pushed head; a seed Preview is not delivery evidence.

## Scope, effects and remaining risks

No runtime, test, persistence schema, migration, DB/Supabase access, retention decision, source/content/profile registration, extractor/policy activation, accepted Evidence, Rule acceptance, F8, provider activation, Production, CH import/CH-11 or Trip Workspace/B01 change. No new running costs. No UI/API/engine or travel-graph behavior changes.

The main risk is a later implementation mistaking structural success for trusted custody, or treating a hash as privacy protection/authority. Sections 3, 9–12 and 14 of the architecture make these fail-closed boundaries explicit. Current return shapes and registries are not sufficient to emit a receipt, and schema-1/composed-branch restrictions are unchanged. Exact artifact availability and lifecycle remain separate gates.

PR stays **Draft**. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
