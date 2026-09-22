# Admin Audience & Partner Reporting Preflight 1 — Status

Stand: 22. September 2026  
Status: **R1+R2 DOCS CORRECTION / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Issue / requirement: Product-Owner request recorded in [#512 comment 5780510581](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5780510581)  
Draft PR: #549  
Branch: `audit/admin-audience-partner-reporting-1`  
Binding task: `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md` v1 at seed `8ebed62b565a7ab28f80b276984d12f2b535dff0` — **not rewritten**  
TL CHANGES REQUIRED: review `5281490348` on `904122a0cac2ea3314c227e74fde60131a6bb86a`

Cursor-Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast` via cursor-cloud run-info)  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270` (same session as the inventory)  
Run URL: https://cursor.com/agents/bc-ea4a0209-f139-4b47-8943-16ddf78e4270  
Session footer: **verified** in [#549 comment 5780608829](https://github.com/Jetnity/jetnity/pull/549#issuecomment-5780608829) HTML.  
UI rename: **not performed**.

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Gates on `904122a0` are invalid after this persist.

---

## 1. Result

R1 and R2 corrected in the five owned docs. Task, global docs and runtime untouched. Proposed overview **not** implemented.

**R1:** Existing trip RPCs remain internal raw operations. They apply only time + `darf_betrieb_lesen()`. They cannot prove clean real-user volume. First CSV, if any, is **INTERNAL RAW OPERATIONS ONLY** with exclusions-not-implemented disclosed. Clean external partner report stays gated until exclusion/provenance is validated. No invented filter.

**R2:** Outbound-click collection is a missing versioned event/attribution/privacy/collection contract. `production_write_path_allocated` gates `trip_item_commercial_provenance_schreiben` only and applies **conditionally** if a later design writes that snapshot.

Inventory distinctions unchanged: account ≠ profile ≠ visitor; `last_seen_at` unwritten; `account_visits` is travel history; local `booked`/payments ≠ provider confirmation.

---

## 2. Git evidence (at this persist)

Authorized **merge** of live main (no rebase, no force-push, no #548 branch merge).

| Item | Value |
| --- | --- |
| Task baseline | `main@9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Authorized merge-from main | `8fcccd6475f41703bd2a31deecb3067391f330b4` (accepted #547 then #545) |
| Prior content head (invalid after this persist) | `904122a0cac2ea3314c227e74fde60131a6bb86a` |
| Operating mode | `NORMAL` |

Exact new content SHA, ahead/behind vs **then-current** main, and CI/Auth/Preview belong in the PR comment after push. #548 may advance main again; do not treat this pin as permanently current.

---

## 3. Owned files

Only the five named docs were edited. Task not rewritten.

`git diff --name-only origin/main...HEAD` after this persist must still list only the six `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_*` paths (task + five deliverables). The merge commit itself brought #545/#547 files from main; those are main history, not this writer’s new edits.

Forbidden paths were not written by this correction.

---

## 4. Parallel state (observed, not owned)

| PR | Observation at this persist | Classification |
| --- | --- | --- |
| #545 | Merged on authorized main `8fcccd64` | Closed sibling; nav search, not audience |
| #547 | Merged on authorized main (before #545) | Closed sibling; indexing config, not audience |
| #548 | Open Draft; observed head `2542a95b2c5de066e355a66ade920bd0846f3cea`; session `bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1` | Next integration candidate; **may advance main**; not reused |

Old open audits #40 / #39 / #52 / #50 / #28 are not authority.

---

## 5. Checks versus unchecked evidence

**Performed**

- Read TL review `5281490348` in full.
- Fetched and merged authorized `origin/main` `8fcccd64`.
- Re-checked trip RPC SQL: still time + `darf_betrieb_lesen()` only.
- Corrected matrix, proposal, status, handoff, self-review consistently.
- Path/link check of owned docs. Docs-only: no manufactured runtime tests.

**Invalid as this content head**

- Prior freeze CI `35758575817` / Preview `GHic7FYZhqzriFQn3jDSWdRD2zSM` on `904122a0`.

**Not performed / not claimed**

- Production row access, Auth-admin listing, live DB `TimeZone`, complete schema PASS.
- Implementation of the proposed overview.
- Ready, merge of #549, new agent, new slice.
- UI session rename.

---

## 6. Stop

Independent Technical-Lead exact-head **re-review** of the new frozen content head.

Do not mark Ready. Do not merge. Do not implement the proposed next slice from this session.
