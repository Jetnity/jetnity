# Jetnity – V1 Admin MFA Loss Recovery Runbook 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #459  
Draft PR: #460  
Branch: `docs/v1-admin-mfa-loss-recovery-runbook-1`  
Binding task: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the runbook

| Attack | Result |
| --- | --- |
| Document a Dashboard click-path that was not independently confirmed | Rejected. Dashboard is allowed only if the operator can confirm it is the same Auth Admin delete. Otherwise API-in-secure-environment or STOP. |
| Copy stale audit line numbers as current truth | Rejected. AAL2 / enrollment / break-glass / SDK versions re-read from current files and lockfile. |
| Treat official `listFactors()` example without params as authoritative | Rejected. Installed types and the official `AuthMFAAdminListFactorsParams` contract require `userId`. |
| Use user-level `auth.mfa.unenroll` as the recovery operation | Rejected. The locked-out admin cannot reach the AAL2 that verified unenroll requires. |
| Claim the runbook also recovers Supabase platform-account MFA | Rejected. Hard distinction and explicit inability claim. |
| Treat `ADMIN_ALLOWED_EMAILS` as the operational fix | Rejected. Documented as shell-only, AAL2-still-required, no data plane. |
| Weaken AAL2 “until re-enrollment” | Rejected. After delete the user is AAL1; admin stays closed until new TOTP + AAL2. |
| Add backup codes / phone / WebAuthn / a recovery endpoint “while we are here” | Rejected. Out of scope and PO-gated Auth/MFA contract. |
| Invent a full incident process to close 5.5 in the same slice | Rejected. Compromise branch STOPS and hands off. |
| Resolve AUTH.md vs Production AAL2 apply contradiction (finding 3.3) | Rejected. Named as residual verify-in-environment / unknown. No global doc edit. |
| Put a real project service-role example or runnable script in-repo | Rejected. Placeholders only. No script added. |
| Execute a smoke delete against Development | Rejected. Task forbids live Auth mutation. |
| Edit global continuity docs | Rejected. Allowed files only. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- No live recovery has been rehearsed. The first real use remains a Product-Owner-gated Auth mutation.
- Finding 3.3: repository documents still disagree whether Production has `aktuelles_admin_aal2()`. The runbook refuses to claim data-plane recovery when that is unknown.
- Finding 5.5: still no incident/alerting process. Compromise can only STOP and escalate.
- Consumer MFA loss remains unaddressed.
- Single-operator risk: if only one person holds Production service_role, dual control may be unavailable. The runbook requires written verification anyway; it cannot create a second operator.
- Installed Admin MFA types are still marked `@expermental` upstream. A later SDK change is a STOP condition, not a silent rewrite.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Docs-only allowed write scope | Yes | TASK + RUNBOOK + STATUS + HANDOFF + SELF_REVIEW |
| Verify current AAL2 / enrollment / break-glass | Yes | Current symbols, not stale audit lines |
| Verify installed client and official docs | Yes | 2.57.2 / 2.71.1; three official URLs fetched |
| Distinguish app-user vs platform MFA | Yes | §0 |
| List/identify exact user/factor before delete | Yes | §4–§5 |
| Preserve AAL2; incomplete until enroll + AAL2 + data plane | Yes | §6 |
| Fail-closed STOPs and compromise escalation | Yes | §8–§9 |
| No secrets; placeholders only | Yes | |
| No live Auth mutation / no runtime / no Ready / no merge | Yes | |

## 4. What remains before Technical-Lead review

Implementation-head `fecf5228` local + GitHub CI `35293321757` SUCCESS + Vercel `2Y9XtVLu7QSQEsw5Y1rbXBdXvGTU` READY are recorded in STATUS. This evidence persist is a new HEAD and invalidates those exact-head gates. The Technical Lead must re-fetch CI/Vercel/threads on the live HEAD. Agent self-review is still not PASS.
