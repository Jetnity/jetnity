# Admin Audience & Partner Reporting Preflight 1 — Adversarial Self-Review

Date: 2026-09-22  
Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — matches required; no Auto/substitution  
Scope of this persist: final integration sync of authorized main `e71218b4` after TL content acceptance `5281789519` on `4d618d9a`  
This review is **producer evidence**, not Technical-Lead PASS.

Severity labels below are **documentation/product-gap classifications**. They are **not** live operational incidents and do not establish Production severity.

---

## 1. Attack questions

| Question | Answer |
| --- | --- |
| Did I reuse #545 / #547 / #548 sessions? | No. Same audience session only. |
| Did I rebase, force-push, or merge an unmerged sibling branch? | No. Fetched and merged authorized main `e71218b4` only. |
| Did I claim current trip RPCs exclude fixtures/test/Preview? | No. R1 remains: only time + `darf_betrieb_lesen()`. |
| Did I call raw trip CSV partner-ready or clean-audience? | No. **INTERNAL RAW OPERATIONS ONLY**; clean external report gated. |
| Did I invent a filter or SQL? | No. |
| Did I tie all click collection to S5-B? | No. R2 unchanged. |
| Did I implement analytics, tracking, SQL, UI, or the rejected overview? | No. Docs-only sync. |
| Did I rewrite the task or global docs? | No. |
| Did I treat #548 as still open? | No. Recorded merged on `e71218b4`. Still not an audience producer. |
| Did I dispatch the unavailable-metric overview? | No. TL rejected automatic dispatch. |
| Did I treat missing-producer labels as live P0 incidents? | No. Product gaps only. |
| Did I mark Ready / merge #549 / start a follow-up? | No. |
| Did I claim UI rename? | No. |

---

## 2. Where I could be wrong

| Risk | Docs class | Mitigation / residual |
| --- | --- | --- |
| A later reader still treats “honest now” as partner-ready. | product-gap | Report class table + CSV label + gated clean-external section. Residual: wording elsewhere still says “honest”. |
| Another merge moves main after this freeze. | process | TL stated no unrelated main merge is planned before this freeze. Residual: later unexpected merge still possible. |
| A hidden click logger exists that I still missed. | product-gap | No versioned event table found after #548 merge; residual unnamed log. |
| A hidden `profiles` insert exists outside the repo. | product-gap | Unchanged residual. |

---

## 3. Findings (not live incidents)

| ID | Docs class | Finding |
| --- | --- | --- |
| G-visitors | product-gap | Unique visitors still have no producer. Not a live incident. |
| G-last-seen | product-gap | `last_seen_at` / Users `count` still must not be shipped as audience. Not a live incident. |
| G-exclusions | product-gap | Trip aggregates have no test/Preview/bot exclusion — explicitly **not** partner-ready. |
| R1 | closed in docs | Internal raw vs clean external partner report distinguished. Accepted on `4d618d9a`. |
| R2 | closed in docs | Click collection no longer blocked on the wrong S5-B gate. Accepted on `4d618d9a`. |
| S-548 | closed | #548 is merged on `e71218b4`; fixture adapter, not audience. |
| S-overview | closed | Proposed unavailable-metric overview is **not** dispatched. |

No live operational P0/P1/P2 on this docs sync. Missing audience producers remain product gaps.

---

## 4. Docs-only validation

- Task path unchanged and not rewritten.
- Five owned docs updated for current-state only; internal links still use those filenames.
- Cited producer paths still exist after the authorized merge (`admin_reisen_kennzahlen` SQL still time + capability only).
- HBX adapter files from main add no visitor/analytics producer.
- This writer’s new diff vs merged main must be the five owned docs only (plus the already-present task).
- No `app/` `lib/` `components/` `supabase/` edits from this sync.

Not a substitute for new exact-head CI/Auth/Preview.

---

## 5. Verdict

Integration sync is consistent: #548 recorded as merged, overview recorded as not dispatched, missing-producer labels recorded as product gaps. Same session. No follow-up implementation.

I would fail this review if a later actor treated the rejected overview as dispatched, treated accounts as unique visitors, or labelled raw trip CSV partner-ready.
