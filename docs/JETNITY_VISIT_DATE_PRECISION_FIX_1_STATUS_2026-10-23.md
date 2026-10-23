# Visit Date Precision Fix 1 — status

Date: 23 October 2026
Writer: **Jetnity Visit Date Precision Fix 1 — Cursor Generation 1**
Issue: #969
Branch: `fix/visit-date-precision-1`
Draft PR: #972
Status: implementation committed. Stopped for independent Technical-Lead review. Not Ready. Not merged.

The review head is the commit that adds this status, the self-review and the handoff. The code commit before that is `b40cf319fca60066c16c90b637c2f3e2902355e1`, tree `d3e175dd4fd6d20507b81a72a8d7bbcf08958579`. Exact final SHA is in the PR evidence comment, written after this commit. CI and Preview on `b40cf319` do not automatically gate the later head.

Immutable TASK blob `7d466cdb61b6988f7df1d627aaf0ff2651789baa` is unchanged.
Fresh `origin/main` at this write: `5269b9192a2300c6c03fc8659964583130d2d1d1`. Merge-base is that SHA. Before the handoff commit the branch was ahead 2 / behind 0.

## What changed

The shared create/edit form clears dependent visit-date fields when the user clears a parent. Month clear drops day. Year clear drops month and day. Filling a parent again does not restore them. `besuchEingabeAus` and `besuche-eingabe.ts` are unchanged, so the server still rejects inconsistent, impossible and future dates.

## Evidence

See `docs/JETNITY_VISIT_DATE_PRECISION_FIX_1_HANDOFF_2026-10-23.md` for the command table, git identity, model/session evidence and acceptance map. This status does not repeat that table.

## Not done

No signed-in account session. No Development or Production database. No follow-up slice.
