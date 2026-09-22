# Admin Audience & Partner Reporting Preflight 1 — Handoff

Date: 2026-09-22  
From: **Jetnity admin audience partner reporting preflight 1**, Generation 1, session `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
To: ChatGPT / Technical Lead (independent exact-head **re-review**)  
PR: Draft #549 · branch `audit/admin-audience-partner-reporting-1`  
Stop: **STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Prior reviewed head: `904122a0cac2ea3314c227e74fde60131a6bb86a` — **invalid** after this persist  
TL review: `5281490348` R1 + R2

---

## 1. What to read

1. Task (TL-owned, not rewritten): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md`
2. Source matrix (R1/R2 corrected): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SOURCE_MATRIX_2026-09-22.md`
3. Next-task PROPOSAL (R1/R2 corrected): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_NEXT_TASK_PROPOSAL_2026-09-22.md`
4. Status + this handoff + Self-Review
5. Live GitHub for the **new** frozen content head, not `904122a0` and not seed `8ebed62`

Do not treat `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` as updated by this writer.

---

## 2. Decision asked of the Technical Lead

Confirm R1/R2 are closed on the new exact head. Then decide whether the proposed **admin audience truth overview 1** (internal-raw tiles + optional internal-raw CSV) is the correct next bounded slice.

This writer must not implement that slice.

---

## 3. Material findings (short)

1. **Account ≠ profile ≠ visitor ≠ human.** Unchanged.
2. **`last_seen_at` has no producer.** Unchanged.
3. **Trip aggregates are INTERNAL RAW OPERATIONS.** `admin_reisen_kennzahlen` / `admin_reisen_zeitreihe` count persisted account trips by time only. Guest drafts never enter the table. Deletes cascade. **No** test/Preview/internal/bot/fixture exclusion. They are honest raw ops numbers, **not** partner-ready or clean-audience volume.
4. **No traffic collection.** Unchanged.
5. **Affiliate snapshot ≠ click event.** S5-B `production_write_path_allocated` gates the commercial snapshot writer only. Click collection needs its own event/attribution/privacy contract; S5-B is conditional on writing that snapshot.
6. **Skyscanner** (fetched 2026-09-22): **>5,000 unique visitors/month**, not accounts, not raw trips. No partner contact.
7. TL live function metadata remains quoted, not a Production PASS.

---

## 4. Git / isolation

| Item | Pin |
| --- | --- |
| Authorized merged main | `8fcccd6475f41703bd2a31deecb3067391f330b4` |
| Prior content head | `904122a0cac2ea3314c227e74fde60131a6bb86a` |
| Seed | `8ebed62b565a7ab28f80b276984d12f2b535dff0` |
| #545 / #547 | Accepted on that main (nav / indexing) |
| #548 | Open; observed `2542a95b2c5de066e355a66ade920bd0846f3cea`; **may advance main** |
| Mode | NORMAL |
| Sync | fetch + **merge** only; no rebase / force / #548 merge |

Exact new SHA + ahead/behind vs then-current main + CI/Auth/Preview: PR comment after push.

---

## 5. What the next actor must not do

- Ready or merge #549 from Cursor.
- Start the proposed overview from this session.
- Treat raw trip CSV as partner-ready or as having exclusions implemented.
- Tie all click collection to S5-B.
- Use Users `count` or `last_seen_at` as audience.
- Restore a tracker/banner; contact partners; service-role around account counts.
- Merge the #548 branch here.
- Reorder V1 or treat this as a launch gate.

---

## 6. Recommended TL next step

Independent exact-head re-review of the R1/R2 persist. If accepted, version a **new** task for the internal-raw overview on a new branch/session. If a clean external partner report is required in the same slice, name the exclusion/provenance gate explicitly — that is no longer the smallest slice.
