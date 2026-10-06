# Connected Day Experience integration design 1 — Handoff

6 October 2026 · Issue #886 · Draft PR #890

**CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_READY** — writer design classification only.

## Resume at the exact delivery head

Next responsible actor: independent ChatGPT / Technical Lead. First action: fetch live main and [PR #890](https://github.com/Jetnity/jetnity/pull/890), bind review to the exact published head, verify TASK identity and inspect all four deliverables. Do not begin runtime or a follow-up slice.

| Identity | Binding value |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Authorized branch | `docs/connected-day-experience-integration-design-1` |
| Baseline / initial remote main | `fc2734ca60ae3c578fbcd414055fe983773d74d2` |
| Task-seed head | `dab5d00a8021f6690e02977684af67e226501c00` |
| Immutable TASK blob | `29cf9b02d83974cf6aeaa5f3946acfc215e78bb5` |
| Machine mode read | `NORMAL`, blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa` |
| Delivery head | Containing delivery commit; exact full SHA in the session's post-push STOP receipt, independently resolvable from PR Git history |
| Merge-base / counts | Seed was 1 ahead / 0 behind baseline. One design-delivery commit makes 2 ahead / 0 behind if main remains unchanged; final remote readback controls and supersedes this conditional count. |
| Writer / generation | Connected Day Experience integration design 1 / 1 |
| Execution / session | Codex Desktop / `01a1124c-a055-7111-a846-2fc31d9a27d3` |
| Model evidence | `gpt-6-astra` / `xhigh`, local `turn_context`; no inferred model name |

No self-referential commit SHA is inserted into committed Markdown. The exact-head STOP receipt is the publication evidence; read the remote ref again before review because later commits invalidate an earlier review binding.

## Exact file ownership

Created by this delivery:

1. [Design](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_2026-10-06.md)
2. [Report](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_REPORT_2026-10-06.md)
3. [Handoff](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_HANDOFF_2026-10-06.md)
4. [Self-review](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_SELF_REVIEW_2026-10-06.md)

The PR also contains [TASK](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_TASK_2026-10-06.md) from its immutable seed. No other path is authorized. Compare both seed→head (four additions) and merge-base→head (five additions including TASK).

## Review priority

- Check booking/cancellation and activity reservation copy against existing supported kinds and source `user` only.
- Follow the exact Preparation URL/section/traveller contract; a task-specific anchor is explicitly not claimed.
- Attack false location precision, repeated destinations, date-only dependencies, local clocks, stale weather/hours and conflicting evidence.
- Check saved cost attribution once per item, same-currency subtotals, unknown price age and Guest→Account stripping; estimates never become stored price.
- Reproduce the conceptual “3 points” example with proven dependency refs, then remove each proof and confirm the count degrades. It is a future fixture, not current runtime.
- Verify R1–R9 against **later merged** #888/#889 contracts before any implementation. This slice defines no export/type agreement with their unpublished heads.

## Verified versus not verified

Locally executed: mode guard PASS; 16/16 existing guard tests; static dead/export/dependency/admin-route hygiene PASS; TASK identity, allowed files, local Markdown source links, required matrix IDs and diff whitespace checks. Full details and limitations are in the report.

Not locally executed: Typecheck, Lint, production build, full product tests, browser/real-device acceptance, DB/schema/Production checks. No new runtime exists to accept. Exact-head remote CI/status observations, if available after publication, are reported in the STOP receipt; this document does not pre-claim future gate results. No application Preview visit, production deployment or DB/provider call is needed for this design.

No identified in-scope P0–P3 defect from writer self-review. Independent review is still open. The important residual risks are unresolved future interface mapping, missing venue/reservation/cancellation/estimate fields, time/freshness ambiguity, incomplete saved costs and unverified UX execution. Their safe fallback and implementation gates are explicit in the design; they are not current capabilities.

## Later order, without starting it

After Timeline Core and the necessary Intelligence contract are merged/accepted and reconciled: booking + Preparation → saved day costs → stored-location list/pins → bounded Change Impact. Each can use current data without a new provider, while showing unknown where proof is absent. Actual forecasts, venue hours, route/ETA, verified external booking/cancellation and FX require separately approved source contracts. True Trip Cost follows an explicit allocation/fees/refunds/estimates contract.

Zero runtime, DB/Supabase, provider/model call, live weather/map/hours data, F8, Production mutation or global continuity edit. No new ongoing cost.

**Keep Draft. Do not mark Ready. Do not merge. Do not start a follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
