# Admin Audience & Partner Reporting Preflight 1 — Handoff

Date: 2026-09-22  
From: **Jetnity admin audience partner reporting preflight 1**, Generation 1, session `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
To: ChatGPT / Technical Lead (independent exact-head review)  
PR: Draft #549 · branch `audit/admin-audience-partner-reporting-1`  
Stop: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

---

## 1. What to read

1. Task (TL-owned, not rewritten): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_TASK_2026-09-22.md`
2. Source matrix (definitions + partner-report proposal): `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SOURCE_MATRIX_2026-09-22.md`
3. Next-task PROPOSAL: `docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_NEXT_TASK_PROPOSAL_2026-09-22.md`
4. Status + this handoff + Self-Review
5. Live GitHub for the **frozen content head** (this persist’s commit), not the task seed `8ebed62`

Do not treat `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` as updated by this writer. They remain read-only.

---

## 2. Decision asked of the Technical Lead

Review the inventory and decide whether the proposed **admin audience truth overview 1** is the correct next bounded slice — or whether accounts/visitors should wait until a later gated producer exists.

This writer must not implement that slice.

---

## 3. Material findings (short)

1. **Account ≠ profile ≠ visitor ≠ human.** Signup writes `auth.users` only. No `auth.users` trigger. No application `profiles` insert found. Users page counts **profiles** under `konten-verwalten` and optional search. That is not registrations and not unique visitors.
2. **`last_seen_at` has no producer.** Display and account-export include the column; nothing writes it. It cannot define active accounts.
3. **AVAILABLE trip aggregates** (`admin_reisen_kennzahlen` / `admin_reisen_zeitreihe`) are the only honest Admin numbers for this question. They count persisted account trips. Guest `localStorage` drafts are excluded. Local `booked` is not a provider booking. No test/bot exclusion. Deletes cascade out of history. `reisen_gesamt` is returned but not shown.
4. **No traffic collection.** AP6A: no tracker package, no consent banner. Sessions table was removed. `account_visits` is travel-place history.
5. **Affiliate provenance ≠ click/booking/commission.** Write path still `production_write_path_allocated=false`.
6. **Skyscanner admission** (fetched 2026-09-22): **>5,000 unique visitors/month**, not accounts. Jetnity cannot currently attest that figure. No partner contact.
7. TL live function metadata is **quoted**, not a Production PASS and not personal-row access.

---

## 4. Git / isolation

| Item | Pin |
| --- | --- |
| Live main / merge-base | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Seed | `8ebed62b565a7ab28f80b276984d12f2b535dff0` |
| Ahead / behind before persist | 1 / 0 |
| Siblings | #545 `a187e4df…` · #547 `ed25bd07…` · #548 `5417569d…` — not reused, not merged |
| Mode | NORMAL |

Exact content SHA + CI/Auth/Preview IDs: PR comment after push.

---

## 5. What the next actor must not do

- Ready or merge #549 from Cursor.
- Start the proposed overview from this session.
- Use Users `count` or `last_seen_at` as audience.
- Restore a tracker/banner to “fill” unique visitors.
- Contact Skyscanner/Impact or sign a vendor.
- Service-role around missing account counts.
- Merge/rebase #545 / #547 / #548 onto this branch.
- Reorder V1 or treat this as a launch gate.

---

## 6. Recommended TL next step

Independent exact-head review of the frozen docs. If accepted, version a **new** task for `admin audience truth overview 1` on a new branch/session. If accounts or visitors are required in the same slice, name the extra gate explicitly and do not pretend it is still the smallest slice.
