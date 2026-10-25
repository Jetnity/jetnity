# R107-W — Account World Visit Workflow Completion 1 — SELF-REVIEW

Date: 2026-10-25

Reviewer: the same implementation author. This is not an independent Technical-Lead review and it is not a PASS.

Reviewed correction head: `8b1e6ac0185c2ba89542793a631f95ac0bb74ae4`. The candidate that root reviewed was `016d5309683c372bcfc06afd80355b5b48bc2e8d`. TASK blob `9fb3c8f242014761af64aa342a3222cf7d15f180`. PLAN blob `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4`.

## Candidate findings

| Id | Was found | Resolution in `8b1e6ac0` |
| --- | --- | --- |
| W-R1.1 P1 | Old **Erneut senden** followed the open editor and could call the other mutation. | Retry is bound to `vorgang.art` and enabled only for the current applicable intent of that kind. Both mounted directions pass, including a newer year and a newer confirmation. **Ja, widerrufen** remains the explicit revoke. |
| W-R1.2 P2 | Edit and revoke status disappeared on a failed read or when the row left the list. | The latest operation renders outside the row, keeps its event id, and keeps **Liste prüfen**. A failed read stays `lesefehler` and does not send again. Pending, unknown, removal, and filtering are mounted. |
| W-R1.3 | The first receipt omitted command, versions, runner/shim/CSS hashes, and tracked dirty state. | `run-8b1e6ac0185c.json` records them for the correction run. `run-82260869d6cb.json` was not rewritten. |

The R3 rules still hold on this head: a returned `{ ok: false }` is unconfirmed, the thunk is inside the guard, one confirmation is visible, and an older settlement does not clear a newer confirmation id and epoch. No second confirmation slot was added.

## Remaining limits

| Id | Severity | Finding |
| --- | --- | --- |
| W-S1 | P2 limit | Frozen RPCs still have no version token. A cross-session write can land after this page's read. |
| W-S2 | P2 limit | Full unmount drops the ledger. The copy says so. It does not recover the operation after navigation. |
| W-S3 | P3 evidence | `npm test` exits 1 because local PostgreSQL 16 is absent. The 11 failures are existing native-PG proofs, not visit failures. They are not a pass. |
| W-S4 | P3 evidence | Project lint reports 182 warnings against a previously recorded 181. This lane's files contributed none. |
| W-S5 | P3 evidence | The width sweep uses the first page of the 40-event fixture, not every row expanded. |
| W-S6 | P3 | After an accepted create, the empty form is the module empty value. Discard uses `BESUCH_FORMULAR_LEER`. The fields are the same six empty values. |
| W-S7 | P3 evidence | The original receipt `run-82260869d6cb.json` still lacks the W-R1.3 bindings. The correction receipt does not claim to repair it. This run used Node `v22.23.4`, not the reviewer's Node 24.22.1. |

## Not claimed

Hosted Account, SQL, RLS, full Next router, device, a new native CI pass, Preview, Production, Ready, or merge. CI 40213289991 does not cover `8b1e6ac0`.
