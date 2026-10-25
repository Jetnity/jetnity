# R107-W — Account World Visit Workflow Completion 1 — SELF-REVIEW

Date: 2026-10-25

Reviewer: the same implementation author. This is not an independent Technical-Lead review and it is not a PASS.

Reviewed product head: `82260869d6cb0070a020cc2efdcabb9de78cdfb4`. TASK blob `9fb3c8f242014761af64aa342a3222cf7d15f180`. PLAN blob `771313c5c3ee601598d41e83e9ad2e1b6f6b73a4`.

## Against the authorized plan

- Returned `{ ok: false }` is unconfirmed. Only a local reader miss before `senden` is not-sent. Covered by the pure classifier test and the mounted returned-error, throw, rejection, and extra-key cases.
- The action thunk is inside the owned try/finally. The same-turn second submit does not call the action twice.
- Displayed content is not described as a fresh or causal read. Seen-before-settlement stamps stay "gleich".
- Create never selects a row. Repeated identical visits stay distinct in the pure test.
- Dirty same-id drift and removal bump the epoch while the write is in flight. The later `{ ok: true, wert: null }` leaves the draft or the confirmation open. Mounted and pure cases both continue through the acknowledgement.
- Revoke cleanup requires confirmation id, epoch, and event id, with conflict `keiner`. A changed row does not adopt a revoke. The mounted sequence is: A pending, open B, settle, B remains; then reopen A with a new id, settle, that id remains. One confirmation is on screen. That matches the R3 binding interpretation. No second confirmation slot was added.
- Product copy does not say "einer Zeile zugeordnet", "belegt nicht", or "neu gelesen".
- Map JSX and the three action call shapes remain the strings the existing source tests pin. Those tests passed.
- No file outside the approved allowlist and this lane's delivery docs was edited for the feature.

## Findings

No P0 or P1 in this lane.

| Id | Severity | Finding |
| --- | --- | --- |
| W-S1 | P2 limit | Frozen RPCs still have no version token. A cross-session write can land after this page's read. The UI can only show what this page observes. |
| W-S2 | P2 limit | Full unmount drops the ledger. The copy says so. It does not recover the operation after navigation. |
| W-S3 | P3 evidence | `npm test` exits 1 in this environment because local PostgreSQL 16 is absent. The 11 failures are existing native-PG proofs, not visit failures. They are not a pass. |
| W-S4 | P3 evidence | Project lint reports 182 warnings against a previously recorded 181. This lane's files contributed none. The extra warning was not triaged. |
| W-S5 | P3 evidence | The width sweep uses the first page of the 40-event fixture, not every row expanded. Horizontal overflow of the expanded grid is the same card. The report states the narrower measurement. |
| W-S6 | P3 | After an accepted create, the empty form is the module empty value. Discard uses `BESUCH_FORMULAR_LEER`. The fields are the same six empty values. |

## Not claimed

Hosted Account, SQL, RLS, full Next router, device, native CI, Preview, Production, Ready, or merge.
