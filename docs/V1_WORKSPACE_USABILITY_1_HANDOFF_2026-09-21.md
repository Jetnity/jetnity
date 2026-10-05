# V1 Workspace Usability 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead. Old-head gates do not approve a changed head.

## What to open

1. Draft PR #516 / issue #513  
2. TL CHANGES REQUIRED on `4b5f34f9` plus this integration-boundary instruction  
3. STATUS / SELF_REVIEW with this prefix  
4. R2 on the **clean integrated product**: `docs/evidence/v1-workspace-usability-1/vux-r2-interaction.json`  
   - `productTree.head` = `dda36b176d9ca66a7fb2e66a28193a37e8b3e719`  
   - `workingTree` = `clean`  
5. R2 screens: `screens/r2_complex-r2-scrolled-search_390x844.png`, `screens/r2_complex-r2-rapid-close_390x844.png`

Do not reopen #506. Do not treat `4b5f34f9` or `cdaff642` gates as current.

## Source vs evidence

| Layer | SHA | Role |
| --- | --- | --- |
| Authorized main | `66af1539` | #517 guest-draft adoption |
| Merge into this branch | `b67adcb6` | one-time integration, no conflicts |
| Harness honesty + product | `dda36b17` | **tested product tree for R2** (clean) |
| Evidence/docs freeze | later commit on top of `dda36b17` | artifacts + STATUS only |

## Look-first

| Question | Evidence |
| --- | --- |
| Impossible days | `lib/trips/datum-anzeige.test.ts` |
| No unsolicited scroll reset | `vux-r2-interaction.json`: 433 → 1038 → 1038 → 1038 |
| Rapid close | return-after-escape only; not a pending-callback proof |

## Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.**  
No Ready, no PR merge, no follow-up slice by Cursor.
