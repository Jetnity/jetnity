# Admin Audience & Partner Reporting Preflight 1 — Status

Stand: 22. September 2026  
Status: **CONTENT ACCEPTED ON `4d618d9a` / FINAL INTEGRATION SYNC / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD FINAL RE-GATING**

Issue / requirement: Product-Owner request recorded in [#512 comment 5780510581](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5780510581)  
Draft PR: #549 (next integration candidate)  
Branch: `audit/admin-audience-partner-reporting-1`  
Binding task: `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md` v1 at seed `8ebed62b565a7ab28f80b276984d12f2b535dff0` — **not rewritten**  
TL content acceptance: review `5281789519` on `4d618d9afda240577487d3fe798d0951796868f0` — R1/R2 closed; integration pending this sync; **NOT Ready**

Cursor-Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast` via cursor-cloud run-info)  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270` (same session)  
Run URL: https://cursor.com/agents/bc-ea4a0209-f139-4b47-8943-16ddf78e4270  
Session footer: **verified** in [#549 comment 5781045231](https://github.com/Jetnity/jetnity/pull/549#issuecomment-5781045231) HTML.  
UI rename: **not performed**.

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Gates on `4d618d9a` are invalid after this persist.

---

## 1. Result

Final integration sync only. Authorized merge of live main `e71218b47c1299397deb2ae3f6a4c264dc695b2b` (#548 accepted). Five owned docs updated only where current-state claims were stale. Task, global docs and runtime untouched. Proposed overview **not** implemented and **not** dispatched.

R1/R2 remain closed as accepted on `4d618d9a`:

- **R1:** Trip RPCs are internal raw operations (time + `darf_betrieb_lesen()` only). No fixture/test/Preview/bot exclusion claimed. First CSV, if any, is **INTERNAL RAW OPERATIONS ONLY**. Clean external partner report stays gated.
- **R2:** Click collection is a missing event/attribution/privacy contract. S5-B applies only if a later design writes the commercial snapshot.

**TL next-slice decision (binding):** do not implement the proposed unavailable-metric overview. TL will separately scope a minimal aggregate account measurement. Unique visitors stay a separate privacy/collection decision; accounts never substitute.

Inventory distinctions unchanged: account ≠ profile ≠ visitor; `last_seen_at` unwritten; `account_visits` is travel history; local `booked`/payments ≠ provider confirmation. Missing audience producers are **product gaps**, not live P0 incidents.

---

## 2. Git evidence (at this persist)

Authorized **merge** of live main (no rebase, no force-push, no unmerged-sibling merge).

| Item | Value |
| --- | --- |
| Task baseline (historical) | `main@9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Prior accepted content head | `4d618d9afda240577487d3fe798d0951796868f0` |
| Intermediate authorized main | `8fcccd6475f41703bd2a31deecb3067391f330b4` (#547 then #545) |
| Authorized merge-from main | `e71218b47c1299397deb2ae3f6a4c264dc695b2b` (#548 accepted) |
| Operating mode | `NORMAL` |

Exact new content SHA, ahead/behind vs **then-current** main, and CI/Auth/Preview belong in the PR comment after this single persist. TL stated no unrelated main merge is planned before that freeze.

---

## 3. Owned files

Only the five named docs were edited. Task not rewritten.

`git diff --name-only origin/main...HEAD` after this persist must still list only the six `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_*` paths (task + five deliverables). Merge commits brought #545/#547/#548 files from main; those are main history, not this writer’s new edits.

Forbidden paths were not written by this sync.

---

## 4. Parallel state (observed, not owned)

| PR | Observation at this persist | Classification |
| --- | --- | --- |
| #545 | Merged on earlier main `8fcccd64`, present under `e71218b4` | Closed sibling; nav search, not audience |
| #547 | Merged before #545 | Closed sibling; indexing config, not audience |
| #548 | **Merged** `2026-09-22T18:02:01Z` as main `e71218b4` | Closed sibling; HBX fixture adapter, not audience |
| #549 | This preflight; next integration candidate | Docs-only; not Ready |

Old open audits #40 / #39 / #52 / #50 / #28 are not authority.

---

## 5. Checks versus unchecked evidence

**Performed**

- Read TL reviews `5281490348` and `5281789519` in full.
- Fetched and merged authorized `origin/main` `e71218b4`.
- Re-checked trip RPC SQL: still time + `darf_betrieb_lesen()` only.
- Confirmed HBX adapter adds no visitor/analytics producer.
- Corrected current-state claims in matrix, proposal, status, handoff, self-review.
- Path/link check of owned docs. Docs-only: no manufactured runtime tests.

**Invalid as this content head**

- Prior freeze CI `35761855018` / Preview `3kTTPHcXCogEoM8oQbbfkVm1XDy8` on `4d618d9a`.

**Not performed / not claimed**

- Production row access, Auth-admin listing, live DB `TimeZone`, complete schema PASS.
- Implementation of the proposed overview.
- Ready, merge of #549, new agent, new slice.
- UI session rename.

---

## 6. Stop

Independent Technical-Lead exact-head **final re-gating** of the new frozen content head.

Do not mark Ready. Do not merge. Do not implement the rejected overview or any follow-up from this session.
