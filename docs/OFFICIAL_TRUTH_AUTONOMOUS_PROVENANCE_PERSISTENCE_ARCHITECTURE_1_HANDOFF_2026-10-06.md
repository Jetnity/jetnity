# Official Truth autonomous provenance persistence architecture 1 — Handoff

Date: 6 October 2026
Logical writer: **Jetnity Official Truth autonomous provenance persistence architecture 1** · Generation **1**
Issue [#858](https://github.com/Jetnity/jetnity/issues/858) · Draft PR [#859](https://github.com/Jetnity/jetnity/pull/859)
Branch: `docs/official-truth-autonomous-provenance-persistence-1`
Session: `01a10e26-495a-7340-acd1-c58fdd047aac` · **`gpt-6-astra` / `xhigh`**, verified from current session metadata.

## First unfinished action

Independent ChatGPT / Technical-Lead review of **#859's actual remote exact head**. Read that SHA, its CI/Preview, live main/mode/#751/#748 and #857 Changed Files again. This handoff is not PASS, Ready, merge authority or a follow-up dispatch. Post-push evidence is in the writer's final delivery message, because this document cannot contain its own commit SHA.

Binding [TASK](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_TASK_2026-10-06.md): seed `68c70a60fc0b5ac55dc798394927cedd37d13b24`, blob `791480c1ef8adbc74a234f44d7ed2ef73955e493`.
Baseline/main/merge-base at startup: `7fb95414db6b7e4de12bea0df29b2c771081b9d4`; mode `NORMAL`.
TL dispatch: [comment 6004267747](https://github.com/Jetnity/jetnity/pull/859#issuecomment-6004267747).

## Delivered decision

[Architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md) · [Report](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_REPORT_2026-10-06.md) · [Self-review](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_SELF_REVIEW_2026-10-06.md)

**AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_READY_FOR_IMPLEMENTATION_DESIGN**

Option 1: canonical UTF-8 receipt payload bytes + a shared typed immutable artifact store + dependency links verified against canonical parents. No receipt semantic extension, JSONB authority, current-row history join or added acceptance constructor. Complete closure is atomically published and byte-verified; unknown/missing/corrupt dependencies fail closed. Historical `valid` proves only retained consistency, not original execution or present freshness.

READY permits only TL consideration of a separate persistence implementation/SQL-design slice, with retention/lifecycle dependencies re-evaluated. It grants no SQL/migration/DB/Supabase/apply/retention/Rule/F8 authority.

## Review focus

1. Preserve #855's exact payload/hash and its partial privacy/custody admission. The storage envelope/index is outside semantic receipt authority. The three-field global definition is not wrapped/rehashed into a different artifact meaning.
2. Root slots are derived from the receipt; transitive manifests hash their exact Pins. Stored links are checked in both directions. Complete catalog/selection snapshots cannot be narrowed to selected supports/winners.
3. Generic storage still has closed typed historical codecs, semantic id/version uniqueness, full digest/byte checks and no arbitrary JSON or current-code fallback. Archived executable bundles are data, never dynamically executed by the reader.
4. Atomic insert/idempotency must verify all existing bytes/links and closure, including concurrent duplicates. Missing dependencies on retry cannot trigger silent repair or idempotent success.
5. Technical limits are storage admission limits, not changed fact schemas or retention values: 256 KiB receipt, 11 roots, 256 artifacts, 1,024 edges, 1 MiB artifact, 8 MiB closure, longest depth 8. Oversize means refusal, no truncation.
6. Read failures remain distinguishable from absent objects. The five integrity verdicts have bounded details. No write/repair/fetch/extraction/acceptance side effect or current freshness assertion occurs.
7. Rule→receipt is a later immutable relationship without authority. Server authorization/custody, restricted access and transitive privacy admission cannot be replaced by RLS, service credentials or a fingerprint.
8. Retention, lifecycle, deletion/tombstones/erasure/backups and public display remain undecided. The five future gates are kept separate, including an explicit exact Development-apply Product-Owner gate.

## Parallel state and continuity

#857 owns Applicability Schema 2 runtime/test/docs paths. At initial read it was Draft at `f4105039a0ae04a91d02b9e72d6401ff547333ae`, with only its TASK in Changed Files. Both that observed set and its complete allowed path set are disjoint from this slice's five docs. Final prepublication overlap is independently re-read and recorded in the report/delivery. No #857 branch/file was edited or synchronized.

#748 latest relevant MATERIAL/triage: `5988971332` / `5989855107`, unchanged at prepublication read. #751's top section initially named two writers and now adds #860/#861, the separate docs-only global-admission/metadata-custody writer. #861 was read Draft at `4d37d8a6c5d4b2e9945cc699bbe45b234657eb6b`, with only its separately named TASK changed and zero overlap. No #861 content is adopted as merged authority; no file/branch there is edited. Older lower #751 paragraphs are stale continuity. Hosted Development/Production status is reported by that index and was not directly inspected with DB tools here.

## Remaining boundaries

The current runtime cannot emit the proposed receipt. Separately authorized global admission, original Evidence metadata custody, producer context capture and exact artifact/schema pins remain prerequisites. This docs slice implements none of them and imports no schema-2 semantics from #857.

Next authority remains with TL for exact-head review. Later gates remain separate: implementation/SQL design; Product-Owner + Security + Privacy retention/lifecycle; exact Development apply + verification; F8/acceptance integration; Production Product-Owner approval. Source/profile/extractor/policy/provider activation remains separately gated. `regelKandidatAkzeptieren` remains the only canonical constructor.

No local runtime tests/build or DB actions were run. No test/code/SQL was added. Local document/gate checks and actual hosted exact-head CI/Preview are reported without treating a queued check as success.

PR remains **Draft**. Do not Ready, merge or start implementation, retention, F8 or any follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
