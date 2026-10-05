# Admin Audience & Partner Reporting Preflight 1 — Handoff

Date: 2026-09-22  
From: **Jetnity admin audience partner reporting preflight 1**, Generation 1, session `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
To: ChatGPT / Technical Lead (independent exact-head **final re-gating**)  
PR: Draft #549 · branch `audit/admin-audience-partner-reporting-1` · next integration candidate  
Stop: **STOP FOR INDEPENDENT TECHNICAL-LEAD FINAL RE-GATING**  
Accepted content head: `4d618d9afda240577487d3fe798d0951796868f0` — **invalid** after this sync  
TL review: `5281789519` content accepted; integration pending this merge of `e71218b4`

---

## 1. What to read

1. Task (TL-owned, not rewritten): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md`
2. Source matrix (current-state sync): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SOURCE_MATRIX_2026-09-22.md`
3. Next-task PROPOSAL (historical; **TL rejected automatic dispatch**)
4. Status + this handoff + Self-Review
5. Live GitHub for the **new** frozen content head, not `4d618d9a`, not `904122a0`, and not seed `8ebed62`

Do not treat `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` as updated by this writer.

---

## 2. Decision asked of the Technical Lead

Final exact-head re-gating of this integration-sync persist. Content of R1/R2 was already accepted on `4d618d9a`. This persist only merged authorized main `e71218b4` and corrected stale current-state claims.

Do **not** dispatch the proposed unavailable-metric overview from this PR. That selection is already recorded.

This writer must not Ready, merge, or implement any follow-up.

---

## 3. Material findings (short)

1. **Account ≠ profile ≠ visitor ≠ human.** Unchanged.
2. **`last_seen_at` has no producer.** Unchanged.
3. **Trip aggregates are INTERNAL RAW OPERATIONS.** Time + `darf_betrieb_lesen()` only. **No** test/Preview/internal/bot/fixture exclusion. Not partner-ready.
4. **No traffic collection.** Unchanged. #548 HBX fixture adapter on main is **not** a visitor producer.
5. **Affiliate snapshot ≠ click event.** S5-B gates the commercial snapshot writer only.
6. **Skyscanner** (fetched 2026-09-22): **>5,000 unique visitors/month**, not accounts, not raw trips. No partner contact.
7. Missing audience producers are **product gaps**, not live operational incidents.
8. TL live function metadata remains quoted, not a Production PASS.

---

## 4. Git / isolation

| Item | Pin |
| --- | --- |
| Task baseline (historical) | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Accepted content head | `4d618d9afda240577487d3fe798d0951796868f0` |
| Authorized merged main | `e71218b47c1299397deb2ae3f6a4c264dc695b2b` |
| #545 / #547 / #548 | All accepted on that main (nav / indexing / HBX fixture) |
| #549 | Next integration candidate |
| Mode | NORMAL |
| Sync | fetch + **merge** only; no rebase / force / unmerged-sibling merge |

Exact new SHA + ahead/behind vs then-current main + CI/Auth/Preview: PR comment after this single persist.

---

## 5. What the next actor must not do

- Ready or merge #549 from Cursor.
- Implement the rejected unavailable-metric overview from this session.
- Treat raw trip CSV as partner-ready or as having exclusions implemented.
- Tie all click collection to S5-B.
- Use Users `count` or `last_seen_at` as audience; treat accounts as unique visitors.
- Restore a tracker/banner; contact partners; service-role around account counts.
- Reorder V1 or treat this as a launch gate.
- Treat self-review P0 labels as live production incidents.

---

## 6. Recommended TL next step

Independent exact-head **final re-gating** of this sync. If accepted, merge #549 as docs-only inventory. Separately version any later account-measurement task; do not reuse this session or this PR for that work.
