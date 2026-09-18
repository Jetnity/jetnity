# Jetnity – V1 Support Process 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #467  
Draft PR: #470  
Branch: `docs/v1-support-process-1`  
Binding task: `docs/V1_SUPPORT_PROCESS_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the runbook

| Attack | Result |
| --- | --- |
| Invent a named inbox owner or “we read mail daily” because the audit asked who monitors the address | Rejected. Repository evidence is **unknown**. Product Owner owns the decision of who may read; coverage is not claimed. |
| Invent a first-response window because release-gate §M wants a defined channel | Rejected. Channel + role ownership are defined; SLA is explicitly absent. |
| Treat Footer `mailto` as proven controller / Datenschutzkontakt | Rejected. AP-6a legal-input contract and DECISIONS legal-input rule kept. |
| Claim `Fehler-ID` can be looked up once support exists | Rejected. §6.2 states no operator-side correlation; finding 4.3 / 5.5 tooling remain open. |
| Add `app/account/error.tsx` or mailto on error surfaces “to make support reachable” | Rejected. Runtime 4.2 is another parallel slice; write scope forbids it. |
| Use `/admin/users` or Production SQL as a support console | Rejected. §11 allows only already-authorized AAL2 datensparse lookup and forbids dumps, role/status unlocks and service-role. |
| Apply the admin MFA runbook to consumer lockouts | Rejected. Named as out of scope. Consumer MFA recovery stays open. |
| Fulfill DSAR / deletion by ad-hoc Production export | Rejected. No fulfillment path; PO + Legal; no uncontrolled DB access. |
| Promise refunds or treat admin `payments`/`refunds` as user billing | Rejected. No payment provider; leftover ledger is not consumer billing. |
| Invent visa / official-truth answers to close trip mail | Rejected. `unknown` preserved; traveller-context policy applied. |
| Bundle a helpdesk or error-tracking vendor into this process | Rejected. Product-Owner-gated; §14 keeps tooling OPEN. |
| Edit global continuity docs or reserved parallel-slice files | Rejected. Allowed files only. |
| Mark Ready / merge because the process doc exists | Rejected. |

## 2. Residual risks this slice does not close

- Mail may sit unread. Detection delay is unknown and is the operational hole behind the process.
- Users who crash on `/account/*` still have no Jetnity error boundary and no mailto on that surface (4.2).
- `Fehler-ID` remains unresolvable on the operator side (4.3 / 5.5 tooling).
- Data-rights requests can now be **classified**, not fulfilled (2.1 / 2.2).
- Consumer MFA loss can now be answered honestly as unrestorable, not recovered (3.4 consumer).
- Auth confirmation/reset mail can still fail at low volume (3.8).
- Single-operator risk: if only one person can open the mailbox, process ownership exists on paper but coverage does not.
- The incident runbook’s support-handoff line still says finding 4.1 had no owned mailbox **process**. After merge, a later continuity edit on `main` may update that sentence; this slice must not edit that merged runbook.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Docs-only allowed write scope | Yes | TASK + RUNBOOK + STATUS + HANDOFF + SELF_REVIEW |
| Current entry point + limitations | Yes | §1; current Footer, not stale “Kontakt” heading |
| Required intake categories | Yes | §3 |
| Minimum information + data minimisation | Yes | §4 |
| Never request password / OTP / TOTP seed / tokens / cookies / service-role / passport-MRZ-biometric-health over email | Yes | §5 |
| Screenshots only when needed and redacted | Yes | §6.1 |
| Fehler-ID as context, not automatic resolution | Yes | §6.2 |
| Triage, ownership, escalation to merged incident runbook | Yes | §7–§9 |
| Product Owner / Technical Lead boundaries | Yes | §2 / §10 |
| No uncontrolled Production DB access | Yes | §11 |
| Known/unknown; no invented SLA | Yes | §2.1 / §12 |
| Closure / evidence | Yes | §13 |
| Explicit remaining tooling gaps | Yes | §14 |
| No runtime / mailbox / ticket / legal / Production / secret / cost | Yes | |
| No parallel reserved files / no global continuity | Yes | |
| Exact-head gates + persist | Pending on this implementation persist | |
| No Ready / no merge / no follow-up slice | Yes | |

## 4. What remains before Technical-Lead review

Local gates and exact-head CI / Vercel Preview are still pending on the implementation HEAD. Re-fetch CI/Vercel/threads on the live HEAD. Agent self-review is still not PASS.
