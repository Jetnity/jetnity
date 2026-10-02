# Official Truth Deterministic Trusted-Fact Extractor Architecture 1 — Report

Date: 3 October 2026
Issue: #773
Draft PR: #775
Branch: `docs/official-truth-deterministic-trusted-fact-extractor-architecture-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Task: `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_TASK_2026-10-03.md`
Task seed: `39eb137e94c27085d0b954bfbe59e31a3510ce3c` is not the review head.
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor architecture 1**
Generation: **1**
Session: https://cursor.com/agents/bc-e12b4f3e-b7f1-4b49-bc0d-54e57b90ff7a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. It does not implement an extractor and it does not implement F8.

## Classification

**`EXTRACTOR_FRAMEWORK_FIRST`**

No current fact kind has a deterministic official representation in the repository. The architecture defines the extractor contract for all eight kinds and classifies the next runtime step as a pure registry/framework, followed later by one separately verified source-specific extractor. It does not choose a source family and it does not choose `blank_passport_pages` as that extractor.

Binding design: `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`.

## Baseline

`git fetch origin main` in this session resolved `origin/main` to `a7ad77743327c01821cf2532ca253a3220c857e8` (`Merge #771: document F8 deterministic trusted-fact source audit`). The local `main` pin before the fetch was the stale snapshot `c04964e7`. Merge-base of this branch and `origin/main` is that fetched SHA. Before these architecture documents the branch was the task seed `39eb137e94c27085d0b954bfbe59e31a3510ce3c`: 1 ahead, 0 behind. Machine mode in `.jetnity/operating-mode.json` is `NORMAL`. This slice does not edit that file.

## What was designed

The contract is a pure, versioned, source-specific registry. One `extractorId` is one `RegelFaktArt` and one source family. `extractorVersion` is an immutable positive integer. The server selects exactly one current row from fact kind, official `sourceId`, retrieval-declared content type, and schema family. Zero or two matches fail closed. A request cannot name the extractor.

The input is a frozen object from the future same-request proof graph. It carries the re-proved scope, the snapshot, and the content hash. It does not carry `proposal`, suggestion or model output, a caller trusted fact, `extractionNote`, or the evidence validity window. The extractor recomputes `evidenceQuellenFingerprint` and refuses a hash mismatch. Output is one complete `RegelFakt` or a closed fail-closed reason. There is no partial fact. The output is not acceptance. A later F8 slice would still call `regelKandidatAkzeptieren`.

Arbitrary prose read by a general regex or a model is `representation_not_eligible`. Narrow source-specific prose can be registered only under the pinned-label conditions in the architecture. Drift, missing keys, changed headings, duplicate values, unknown units, moved domains, and an unrecognized structure fail closed and return to research or human review.

Support version ids already stored on a claim are necessary and are not sufficient for autonomous provenance. Extractor id/version, composition policy id/version, and `reviewPacketKey` are absent from `claimPayload` and from the claim migration. A later provenance record is required before autonomous persistence. This slice does not add that record and does not require a Production schema change. Production apply stays a Product-Owner gate.

CH-01..CH-10 stay Candidate Evidence for the 64 Swiss ordinary-passport destinations named in Issue #294 comment `5935531376`, finalized by `5935581800`. They are not re-researched, not imported, and not treated as autonomous truth. CH-11 is not planned.

## Evidence used

| Claim | Result | Where |
| --- | --- | --- |
| No fact kind is autonomously derivable today | Confirmed on this baseline | `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`, merged in #771. All eight kinds are `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`. |
| Acceptance trusts `trustedRuleFact` and does not read `proposal` | Confirmed | `regelKandidatAkzeptieren`, `lib/readiness/rule-claims.ts` lines 825–888. The body does not contain `proposal`. The same function accepts whatever object parses. |
| Eight fact shapes are the parser shapes | Confirmed | Types and parsers in `lib/readiness/rule-claims.ts` lines 26–35, 144–228, and 441–758. Temporal points in `lib/readiness/temporal.ts` lines 7–45 and 108–136. |
| Accepted Evidence has no fact body and no content type | Confirmed | `EvidenceVersion`, `lib/readiness/evidence.ts` lines 134–152. Fingerprint bound `INHALT_MAX` is 65,536 at line 28. `evidenceQuellenFingerprint` is lines 475–479. |
| The review packet holds the snapshot; public re-proof drops it | Confirmed | `OfficialTruthRegelReviewSupport` lines 85–94 and `stuetzEintrag` lines 161–171 of `lib/readiness/official-truth-rule-review-packet.ts`. `reproofStuetze` lines 305–314 of `lib/readiness/official-truth-server-held-source-registry.ts` returns version id, retrieval time, hash, and the validity window only. |
| The v2 key includes the proposal, so a claim that omits the proposal cannot rebuild the key | Confirmed | `lib/readiness/official-truth-rule-review-fingerprint.ts` lines 160–168. The fingerprint header says the snapshot and `extractionNote` stay out of the key. |
| The store payload has no extractor, policy, or review key | Confirmed | `claimPayload` and `faktSpalten` in `lib/readiness/official-truth-store-server.ts` lines 101–229. The claim migration stores support version ids and typed facts. A search of `supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql` finds no `review_packet`, `extractor`, or `policy_version` column. |
| `visaModeLesen(null)` and `officialAktionAusQuelle` are not extractors | Confirmed | `lib/readiness/official.ts` lines 135–143 and 213–218. The fact-source audit already rejected both as fact sources. This architecture forbids them as defaults. |
| F8 is blocked on a missing truth source, and the same-request graph does not create a fact | Confirmed | `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`, classification `BLOCKED_BY_MISSING_TRUTH_SOURCE`. |
| CH-01..CH-10 are closed research, 64 destinations, not an import | Confirmed by the two named comments | Issue #294 comments `5935531376` and `5935581800`, read in this session. Comment `5932615323` shows research YAML qualifiers and units that are not a `RegelFakt`. No operational batch file is in the repository (`docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_REPORT_2026-10-01.md`). |
| No registered machine-readable official schema family | Confirmed | No `contentType` or schema-family field in the readiness source modules read for this slice. |

The visa values, durations, and page counts that appear in older audits and in the CH research comment are fixtures or research notes. This report does not adopt them as law.

## Provenance decision

| Binding | On the accepted claim today? | Autonomous requirement |
| --- | --- | --- |
| Support version ids | Yes, through claim support rows | Keep. Necessary, not sufficient alone. |
| Source content hash | On the evidence row, not on the claim fact | Keep on evidence. Do not copy the snapshot into the claim. |
| Extractor id and version | No | Required before autonomous persistence. |
| Composition policy id and version | No | Required when the registry row is not single-source. Explicit null only for a single-source row. |
| `reviewPacketKey` | No | Required as an equality witness of the same-request packet. Not authority. Recording the key does not require recording `proposal`. |
| Deploy git SHA | No | Optional later audit context. It does not replace `extractorVersion`. |

A schema or retention change for that record is a separate slice. This architecture does not silently require a Production migration.

## Traveller context

One invocation is one regulatory cell. CH research is citizenship `CH` and `ordinary_passport` only. A second citizenship or a second document is another batch and another scope key. The extractor does not collect a passport number, MRZ, or health record, and it does not invent a visa, transit, health, carrier, eligibility, or document rule. `ordinary_passport` is not rewritten to `passport`.

## Boundaries

No runtime, test, migration, Auth, route, store, provider, model, secret, or cost change. No #626 work. No F8 implementation. No CH import. No follow-up slice. The task file, `docs/ACTIVE_WORK_STATUS.md`, and `DECISIONS.md` were not edited. A dirty `next-env.d.ts` was already in the worktree and stays unstaged.

## Validation

| Check | Result |
| --- | --- |
| `git fetch origin main` | `a7ad77743327c01821cf2532ca253a3220c857e8` |
| Ahead / behind versus that SHA before these documents | 1 ahead / 0 behind. The ahead commit is the task seed. |
| `git diff --check` on the architecture documents | Pass. No whitespace errors. |
| `node scripts/operating-mode-guard.mjs` | `operating-mode guard: PASS` |
| Runtime, tests, migrations | Not edited. |
| `npm test`, typecheck, lint, production build | Not run. This slice does not change runtime. Those gates are not claimed. |
| Production database | Not queried. |

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a follow-up from this session.
