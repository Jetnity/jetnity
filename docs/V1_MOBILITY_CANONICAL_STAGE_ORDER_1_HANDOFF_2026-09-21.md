# Jetnity – V1 Mobility Canonical Stage Order 1 HANDOFF

Stand: 21. September 2026  
Status: **CURSOR STOP AFTER GATES / TECHNICAL-LEAD REVIEW ONLY**

| | |
| --- | --- |
| Issue | #501 |
| Draft PR | #502 |
| Branch | `fix/v1-mobility-canonical-stage-order-1` |
| Assigned dispatch base | `main@d1949e23b3dda30b7482265822e7e1279f244228` |
| Integrated main | `main@546b33d9b5086d23c1fb93eb2af2aaf84bbefd12` |
| Binding task | `docs/V1_MOBILITY_CANONICAL_STAGE_ORDER_1_TASK_2026-09-21.md` |
| Finding | RH-3.1 |
| Writer | Jetnity V1 mobility canonical stage order 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast |

## 1. What changed

Mobility edges are derived from canonical `position` order.

`lib/mobility/kanten.ts` `benoetigteKanten()`:

1. copy `reise.stages` (do not mutate the trip);
2. sort by `position`, then `id` — same comparator as timeline `etappenSortieren`;
3. drop blank names;
4. walk first / adjacent / last named stages.

Route matching and fail-closed duplicate/ambiguous semantics are unchanged. Traveller credentials are not involved; Route Truth stays traveller-neutral.

## 2. What a reviewer should verify first

1. Diff vs this slice’s allowed files only.
2. Out-of-order Phuket/Bangkok/Chiang Mai fixture follows `position`, not array order.
3. Origin-equal first *canonical* stage still skips outbound.
4. Two matching transfers still yield `unknown`, not a guessed assignment.
5. `docs/ACTIVE_WORK_STATUS.md` is absent from the PR diff vs current main.
6. #497 landed on main as docs-only and was integrated here; no sibling feature branches were merged.
7. Exact-head CI / Auth / Preview IDs in the PR comment, not an extra evidence commit.
8. This handoff is not Technical-Lead PASS.

## 3. What this slice does not mean

- No visa, transit, health or carrier rule was added.
- No shared `etappenSortieren` extraction across trip modules.
- No claim that every live DB graph is unsorted; the contract is that mobility must not depend on array order.
- No Ready, merge or follow-up by Cursor.

## 4. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.**
