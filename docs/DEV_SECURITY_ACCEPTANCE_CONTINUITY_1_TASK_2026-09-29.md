# Development acceptance continuity 1 — Task v1.0

Date: 29 September 2026. Issue #629. Status: TASK SEED / NOT IMPLEMENTED / NO TL PASS.

Logical Cursor agent: **Jetnity Development acceptance continuity 1**, Generation 1.
Required model: **Grok 4.7 High Fast**, not Auto. Report actual session URL and original model metadata; do not invent an executed model or UI rename. If the required model is unavailable, stop before editing and report that fact.

Branch: `docs/dev-security-acceptance-continuity-1`.
Baseline: `main@94f2747137e2a788c7120f27dc1f23cde12cbcf1`.

## 1. Why this task exists

The main-chat Product Owner requested continuation after the accepted D2-MFA step. The role preparation for #626 remains blocked by a tool safety check. This task does not retry or work around that restriction.

A fresh repository read found a concrete continuity defect: the current headers of START_HERE, ACTIVE_WORK_STATUS and the 29 September checkpoint still say #628 is an active implementation writer and hosted apply has not run. In reality #628 is merged; Development activation, native invocation, D1 and MFA are separately evidenced; the populated authenticated erasure test is unfinished. The startup also still groups Sherpa under WAITING despite a received response and a binding pause on outgoing questions.

Repair those contradictory entry points so a future chat does not re-run completed work, misrepresent tests, or miss the blocker. This is a bounded documentation repair, not a new product implementation, release preflight, permissions proposal or operating system.

## 2. Scope: exactly five files

Allowed:
1. `JETNITY_START_HERE.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-29.md`
4. New `docs/DEV_SECURITY_ACCEPTANCE_CONTINUITY_1_REPORT_2026-09-29.md`
5. This task file, only if a tiny factual dispatch/session addendum is necessary; do not loosen the task.

Keep changes compact. The new report contains the evidence matrix, status, handoff and self-review rather than several competing documents. Original implementation delivery files, historical preflight reports, ADRs, runbooks, SQL, workflows, dependencies and machine governance remain untouched.

## 3. Live read before writing

Read START_HERE, operating mode, the Technical Lead standard, the relevant current handoff, ACTIVE_WORK_STATUS and checkpoint. Then resolve main, this branch, open PRs/issues and the latest #626/#294 comments. Read the named receipts below in full. If relevant state changes, record the later evidence accurately; do not silently retain an old current claim or widen scope.

TL observed before this dispatch:
- machine mode NORMAL; #628 merged, accepted head `80bccb5abb7d56479b65c548e15edde852bec51f`, merge baseline above;
- main CI `36566264144` success;
- existing acceptance Preview `dpl_HatmCkzhDDbbdVCGMkoCMmjmPCcu`, READY at that accepted head;
- Production alias still resolves to `dpl_Erwo4ZPr6ZnqBdoQAsjRmCwVos6Q`, READY at baseline main;
- accepted head to main has the same tree; compare main...head reports 0 ahead / 1 behind (the merge commit);
- open PR search returns only historical #52/#50/#40/#39/#28; leave them alone;
- #628 implementation session is closed according to its TL closure. Work's latest bounded browser task is stopped. Do not claim a fresh external Cursor session-list check from these repository observations.

The new docs-only branch's automatically generated Preview is NOT the accepted #626 test Preview. Do not visit it for Auth, data or account tests. Do not change deployment settings or attempt to move/rebuild the accepted Preview.

## 4. Source receipts

Use canonical links, not copied raw connector JSON:
- #628 implementation closure: https://github.com/Jetnity/jetnity/pull/628#issuecomment-5890198290
- #626 approved Development scope: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5887161416
- hosted activation/native invocation and SQL-test limits: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5891138087
- isolated Preview configuration: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5893640399
- correlated server read / D1 entry: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5895387079
- D1 public receipt: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5897137297
- owner-supplied identity comparison accepted: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5898132656
- blocked role operation and MFA-only boundary: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5898480236
- Work MFA receipt: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5898857003
- latest TL MFA acceptance/blocker matrix: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5898958642
- Sherpa response posture: https://github.com/Jetnity/jetnity/issues/294#issuecomment-5888189192
- binding provider-question pause: https://github.com/Jetnity/jetnity/issues/294#issuecomment-5888940598

Read current #395/#585 comments only if stating their current repository posture; no inbox or vendor action. An absence of a repository reply is not an inbox check.

## 5. Required result

Add one clear current block above historical material in each entry point and replace its obsolete current-status headline. Explicitly label the old #628 delivery-time paragraphs historical, with the new report as the current acceptance pointer. Do not delete substantive historical evidence or pretend that earlier claims were written after the merge.

Report these separate states accurately:
- #628/#627 implementation completed; do not restart that old agent.
- #626 remains OPEN: Development producer installed/activated, seven-day retention, hourly cleanup, cap 1,000, five triggers, last recorded healthy/zero-owned-event state. Cite the dated accepted health receipt; do not imply a new database query.
- Native scheduler execution was observed. Manual rolled-back expiry/cap/erasure rehearsals are not populated scheduled-expiry or authenticated HTTP erasure evidence. Preserve the recorded full-hosted-rollback limitation too.
- Deployed client evidence, Development Settings receipt and one correlated shared-server read are bounded proofs, not proof of every request path.
- D1 registration/confirmation/identity association accepted on attributed Work observations, owner-supplied view and limited independent operational corroboration.
- D2 MFA accepted at its observation time: one verified TOTP factor and current AAL2. Do not imply an indefinitely valid session or fresh factor-table read.
- Temporary operator permission NOT established; three genuine producer events NOT STARTED; authenticated populated erasure NOT RUN. The blocked SQL/Auth/profile operations remain blocked, not completed or approved through a different tool.
- No current runtime or browser task. This docs-only PR is the sole new bounded writer while open; after it closes, do not restart tests or auto-start another slice.
- Sherpa response received / PO consideration / outgoing follow-up paused; no selection, contract, credential or integration. Preserve IATA/KAYAK's last-recorded state with no invented mail read.
- Preflight 2 remains the release boundary; finding 5.2/Gate G, launch, provider and reserved Production gates are not closed by this repair.

Give a short resume sequence: first check for genuinely new authorized evidence resolving the recorded tooling restriction; then TL re-evaluates the exact test identity, valid AAL2, minimal permitted role, producer health and populated baseline before staged normal erasure and postconditions. Do not include workaround commands, a replacement SQL statement or speculative permission escalation. A possible tooling-support review is only an escalation option, not a contact sent, fix promised or authority to bypass.

## 6. Hard non-scope and privacy

Do not mark Ready. Do not merge. Do not start a follow-up slice.

No code/SQL/schema/RLS/Auth/MFA/role/status changes, no fresh personal Auth/profile/factor queries, no live test requests, database connections, key inspection/creation/rotation, account operations, fixtures, erasure, scheduler changes, Edge changes, deployment/settings changes or manual deployment. Do not execute scripts/db/*.

No reformulation/retry/delegation/alternate credential or dashboard path for a denied operation; no request for the owner to run replacement SQL; no forged claims, disabled protections, or weaker acceptance criteria. Production is not an execution target. No providers, external support contact, payments, new services/tariffs or automations.

The repository is public. Never include the disposable user's ID, email, exact account creation time, private MFA identifiers, QR/seed/OTP/password/session/token/header values, private quote amounts or user screenshots. Use the D1/D2 run labels and result booleans. Do not obtain the private handoff. Sanitize before output, not after printing raw data.

## 7. Validation and return

Before committing: inspect the entire diff; `git diff --check`; verify the changed-file allowlist; verify source links and state ordering; check no private values or contradictory current writer/activation statements were introduced. Keep the historical text explicitly historical. Run relevant existing non-network documentation/governance checks; CI runs normally. Do not execute hosted tests for a documentation PASS.

Return exact branch/head, merge-base/ahead/behind, all changed filenames, validation results and limits, session URL/model evidence, and concise self-review in the report/PR. Do not preclaim future CI, Vercel, TL PASS, Ready or merge. New head means new TL review. Remain Draft and STOP for independent main-chat TL review. #629 may close only on accepted docs merge; #626 must remain open.
