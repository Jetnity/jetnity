# CTA region-pin source audit 1 — Report

Date: 4 October 2026 (Europe/Zurich)
Issue: #804 / Draft PR: #805
Branch: `docs/official-truth-cta-region-pin-source-audit-1`
Baseline: `main@ec798ab3b7738b3adc76d85ac8b5223e07e970d9`
Immutable task-seed / dispatch head: `db1f5bfac8689aae314e016a7e6c2beaedde0eab`
Logical writer: **Jetnity Official Truth CTA region-pin source audit 1**, Generation **1**
Execution: Codex Desktop, **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`)
Status: **DOCS-ONLY / AUTHOR DELIVERY / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Outcome

**CTA_REGION_PIN_SOURCE_PROVEN**. One directly fetched official government response is sufficient for the existing one-source membership type. The [primary audit](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md) contains the complete URL/metadata/hash ledger, mapping and proposed drift rules.

Selected: `https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance`.

Publisher metadata: Cabinet Office (primary), with Home Office. Content id `f841223e-d1ae-4a25-9783-bfa7b727ee11`. Response: HTTP 200, no redirects, `application/json; charset=utf-8`, 21,474 exact bytes, valid fatal UTF-8. SHA-256 `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8`. Repeat fetch was byte-identical. Candidate sorted codes: `GB`, `GG`, `IE`, `IM`, `JE`.

The JSON contains HTML, not a structured membership record. Its own first content paragraph names every member; no second legal source is required. All three candidate HTML responses and the staff Content API response exceed the current 65,536-byte ceiling. The public-travel Content API also fits but is not the selected support.

## Work performed and exact changed files

Four new documents, plus the pre-existing immutable task seed in the PR diff against baseline:

1. `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_TASK_2026-10-04.md` — created by Technical Lead before dispatch; unchanged by writer.
2. `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md` — source audit and exact classification.
3. `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_REPORT_2026-10-04.md` — this delivery report.
4. `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_HANDOFF_2026-10-04.md` — review handoff.
5. `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-04.md` — adversarial author checks.

The audit does not modify global current-state files. A final commit cannot embed its own SHA; the exact final head is recorded in the completion delivery and must equal the live #805 head. The seed SHA is not the review head. This report records validation of the delivered docs tree, not a Technical-Lead verdict.

## Validation performed

| Check | Result |
| --- | --- |
| Initial live baseline, mode, #751, #748 and writer gate | Baseline matched; NORMAL; #804/#805 current writer; no newer #748 MATERIAL; no overlap |
| Direct official research fetches | Eight responses, seven unique official URLs; all HTTP 200, zero redirects, exact byte counts and raw Content-Type recorded |
| Saved-byte verification | All eight SHA-256 values, Content-Lengths, fatal UTF-8 decodes, round trips and clean URLs independently recomputed/checked |
| One-source source-statement check | Selected complete body inspected; five explicit names in the first paragraph; no external definition required; no conflicting territorial enumeration found |
| Canonical code execution | All five accepted by actual `landescodeLesen`; all five in `ISO_3166_1_ALPHA2`; English labels and UK/GB short-name mapping verified |
| Negative code controls | UK/XX pass lexical parser but are outside catalogue; subdivision strings fail; CI is Côte d’Ivoire, not Channel Islands |
| Runtime fingerprint comparison | Actual `evidenceQuellenFingerprint` equals raw SHA-256 for both in-ceiling API responses; no CR/BOM in them |
| Proposed fragment-guard sensitivity | Eight member/structure mutation cases all differ from pinned digest; pretty-printed JSON differs from full-response hash |
| Existing focused suites | 21 tests, two suites, 21 pass / 0 fail / 0 skipped: country display and regulatory applicability |
| Operating-mode guard | PASS |
| Final live gate and repository integrity | Recorded below after the closing re-read |

The focused tests were run with Node `v22.23.3` and the existing local tsx loader; no dependency/config change or package install was needed. Canonical parser assertions were a separate read-only execution. No new repository test was written. Full `npm test`, typecheck, lint, Production build and UI/browser verification were **not run**: the task is docs-only with no runtime changes and requires source/parser/integrity validation. No CI or Vercel success on the final head is claimed; exact-head integration gates belong to the Technical Lead.

## Model evidence

The local session's `turn_context` records `model: gpt-6-astra` and `effort: xhigh`, with the same model/reasoning in collaboration settings. This is GPT-6 Astra — Sehr hoch. It was verified before material audit work. No UI screenshot claim is made, no other model was used for material work, and no subagent was created. Session id: `01a103da-d97e-7842-8a77-06b7396bda28`.

## Immutable seed

Dispatch commit `db1f5bfac8689aae314e016a7e6c2beaedde0eab` contains seed blob `a70d368c33f96fb1ce7e1091ea2d2db5402931c3`.

Seed exact-byte SHA-256: `b55ae9f10a7a06ca2f01caef29e5a258409d279815924071ab217a73e95d36bc`.

The writer did not edit it. Closing validation compares working bytes and Git blob against the dispatch version, not merely the filename.

## Security, database, cost and residuals

No runtime, Auth/RLS, database/migration, source registration, extractor, composition policy, acceptance/store/F8 or Production change. No credential access for official fetches, no paid API/provider, no new ongoing cost. No CH import, #626 or launch/indexing change. This source research does not authenticate or populate a live catalogue and does not grant any traveller an ETA outcome.

The existing lexical country parser and normalized-text fingerprint limitations are documented, not repaired. Future source drift needs the separately reviewed verification/version policy described in the audit. The smallest implementation candidate is one source-backed region pin only, after approved identity/server retrieval prerequisites are met.

## Closing verification

Closing live verification completed at `2026-10-03T22:37:50Z` (4 October, 00:37:50 Europe/Zurich):

- Fresh `origin/main` is still `ec798ab3b7738b3adc76d85ac8b5223e07e970d9`; machine mode is `NORMAL`.
- The remote audit branch is still the dispatch head before this writer's commit; no unexpected competing commit.
- #751 still identifies #804/#805 and this generation; body last updated `2026-10-03T22:15:33Z`.
- #748 still has zero comments newer than marker `5971622750`; no newer MATERIAL.
- Open PRs remain #805 plus historical #28/#39/#40/#50/#52. #805 is open, Draft, unmerged; this is the only active Codex writer in the available chat inventory. No writer collision found.
- Exact changed-path allowlist check passes: task seed plus four required outputs, five files total versus baseline; four authored files versus dispatch. No runtime/test/config/database file changed.
- Seed byte comparison and Git blob comparison against dispatch pass; SHA-256 matches the value above.
- Recomputed source hashes, statement/identity assertions, all metadata checks and the eight fragment-mutation checks pass.
- `git diff --check` for the staged change and full baseline diff passes. The commit/push result and exact final head are reported in the completion delivery; remote readback must confirm that same head and Draft state.

## STOP

Remain Draft. No Ready, no merge, no follow-up. Independent Technical-Lead exact-head review is the next action.
