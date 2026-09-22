# Admin Audience & Partner Reporting Preflight 1 — Adversarial Self-Review

Date: 2026-09-22  
Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — matches required; no Auto/substitution  
Scope of this persist: TL review `5281490348` R1 + R2 on `904122a0`  
This review is **producer evidence**, not Technical-Lead PASS.

---

## 1. Attack questions

| Question | Answer |
| --- | --- |
| Did I reuse #545 / #547 / #548 sessions? | No. Same audience session only. |
| Did I rebase, force-push, or merge #548? | No. Fetched and merged authorized main `8fcccd64` only. |
| Did I claim current trip RPCs exclude fixtures/test/Preview? | No. R1 states only time + `darf_betrieb_lesen()`. |
| Did I call raw trip CSV partner-ready or clean-audience? | No. **INTERNAL RAW OPERATIONS ONLY**; clean external report gated. |
| Did I invent a filter or SQL? | No. |
| Did I tie all click collection to S5-B? | No. R2: missing event/attribution/privacy contract; S5-B conditional on snapshot write. |
| Did I implement analytics, tracking, SQL, UI, or a vendor? | No. Docs only. |
| Did I rewrite the task or global docs? | No. |
| Did I treat #545/#547 unmerged runtime as truth? | They are now on authorized main; cited only as nav/indexing, not audience. |
| Did I claim `last_seen_at` is activity or Users `count` as audience? | No. |
| Did I mark Ready / merge #549 / start the follow-up? | No. |
| Did I claim UI rename? | No. |

---

## 2. Where I could be wrong

| Risk | Severity | Mitigation / residual |
| --- | --- | --- |
| A later reader still treats “honest now” as partner-ready. | P1 | Report class table + CSV label + gated clean-external section. Residual: wording elsewhere still says “honest”. |
| #548 or another merge moves main after freeze. | P2 | Dispatch said report drift; do not silently claim current. |
| A hidden click logger exists that I still missed. | P2 | No versioned event table found; residual unnamed log. |
| A hidden `profiles` insert exists outside the repo. | P1 | Unchanged residual. |

---

## 3. P0 / P1 / P2 / P3

| ID | Sev | Finding |
| --- | --- | --- |
| P0-1 | P0 | Unique visitors still have no producer. |
| P0-2 | P0 | `last_seen_at` / Users `count` still must not be shipped as audience. |
| P1-2 | P1 | Trip aggregates have no test/Preview/bot exclusion — now explicitly **not** partner-ready. |
| R1 | P2 closed in docs | Internal raw vs clean external partner report distinguished. |
| R2 | P2 closed in docs | Click collection no longer blocked on the wrong S5-B gate. |
| P3-1 | P3 | `904122a0` gates are invalid after this persist. |
| P3-2 | P3 | #548 may advance main; pin is dated. |

No P0 in this docs correction. R1/R2 are documentation-contract fixes, not runtime.

---

## 4. Docs-only validation

- Task path unchanged and not rewritten.
- Five owned docs updated; internal links still use those filenames.
- Cited producer paths still exist after the authorized merge (`admin_reisen_kennzahlen` SQL still time + capability only).
- This writer’s new diff vs merged main must be the five owned docs only (plus the already-present task).
- No `app/` `lib/` `components/` `supabase/` edits from this correction.

Not a substitute for new exact-head CI/Auth/Preview.

---

## 5. Verdict

R1 and R2 are corrected consistently across matrix, proposal, status, handoff and self-review. Same session. No follow-up implementation.

I would fail this review again if a later implementer labelled raw trip CSV partner-ready, claimed exclusions implemented, or blocked all click work on `production_write_path_allocated`.
