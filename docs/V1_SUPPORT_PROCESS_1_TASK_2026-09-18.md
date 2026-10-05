# Jetnity – V1 Support Process 1 Task

Stand: 18. September 2026  
Status: **ACTIVE / PARALLEL BOUNDED REMEDIATION / DOCS-ONLY / ZERO COST**

Issue: #467  
Source audit: #438 / merged PR #449 / finding 4.1 process half  
Release gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §M  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`

Branch: `docs/v1-support-process-1`

Cursor-Agent: **Jetnity V1 support process 1**  
Generation: **1**  
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Goal

Create one truthful V1 support runbook around the already public `info@jetnity.ch` contact channel. Do not invent a ticket system, 24/7 support, SLA, dedicated support staff, automated error correlation, legal desk or Production support tooling.

## Required content

- current support entry point and current limitations;
- intake categories: account/auth, trip/traveller, product/UX, provider/commercial truth, security/privacy, data-rights/legal request, billing/payment confusion, outage/incident;
- minimum information to request;
- data minimisation and redaction rules;
- never request password, OTP, TOTP seed/QR secret, access token, session cookie, service-role key, passport/MRZ/biometric/health data over ordinary email;
- screenshots only when needed and with sensitive content redacted;
- Fehler-ID may be supplied as context, but current Jetnity has no operator-side correlation system, so do not claim it can be resolved automatically;
- triage, ownership and escalation to the merged incident runbook;
- Product Owner / Technical Lead boundaries;
- no uncontrolled direct Production DB access;
- known/unknown discipline;
- no invented response SLA;
- closure/evidence expectations;
- explicit remaining support-tooling gaps.

## Allowed write scope

Only:
- `docs/V1_SUPPORT_PROCESS_1_TASK_2026-09-18.md`
- `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`
- `docs/V1_SUPPORT_PROCESS_1_STATUS_2026-09-18.md`
- `docs/V1_SUPPORT_PROCESS_1_HANDOFF_2026-09-18.md`
- `docs/V1_SUPPORT_PROCESS_1_SELF_REVIEW_2026-09-18.md`

Read broadly as needed.

## Parallel isolation

This slice runs concurrently with issues #468 and #469. Do not touch:
- `app/account/error.tsx`;
- `components/admin/home/AdminStatsStrip.tsx`;
- `lib/admin/ehrliche-zustaende.ts`;
- global continuity/status docs outside this slice.

No cross-branch merges during implementation.

## Hard exclusions

No runtime support page, mailbox/provider configuration, ticket system, user contact, legal text, Production access, Supabase/Auth/RLS mutation, monitoring provider, secret, paid call or recurring cost.

## Validation

Run required repo gates, exact-head CI, exact-head Vercel Preview, report main/head/merge-base/ahead/behind and thread state. Persist STATUS/HANDOFF/SELF_REVIEW.

No Ready. No merge. No follow-up slice.

Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
