# Jetnity – V1 Security Event Ingestion Architecture 1 – Binding Task

Stand: 18. September 2026  
Issue: #undefined  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`

## 1. Objective

Close the **architecture-decision half** of audit finding 5.2 before any runtime security-event writer is allowed.

PR #485 made the Admin Security surface honest: it now states that `security_events` is an incomplete recorded-event view and that zero recorded rows are not proof of zero real events.

The remaining problem is real ingestion. This task must produce the binding source/threat/privacy decision for the smallest V1-safe implementation.

This is a **docs / architecture / threat-model slice only**.

## 2. Read first

At minimum inspect current-main versions of:

- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md` finding 5.2;
- `components/admin/security/SecurityWidget.tsx`;
- `lib/admin/ehrliche-zustaende.ts`;
- `app/api/admin/security/list/route.ts`;
- `app/api/admin/security/events/route.ts`;
- `app/api/admin/security/summary/route.ts`;
- `app/api/admin/security/block/route.ts`;
- `app/api/admin/security/unblock/route.ts`;
- `app/(public)/admin/login/actions.ts`;
- schema/migrations defining `security_events`, `blocked_ips` and their RLS;
- `lib/auth/admin-guard.ts`;
- `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §G/§H;
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`.

Live evidence wins over historical audit wording.

## 3. Architecture questions that MUST be decided

Evaluate and decide among:

1. **Supabase/platform auth-log source**
   - Can it supply the minimum V1 auth/security signal Jetnity needs?
   - What runtime/management credentials would be required?
   - Is direct runtime reading appropriate, or would it introduce an unacceptable privileged secret/data-processor/operational dependency?
   - If current repository evidence cannot establish capability, mark only that fact UNKNOWN and state the exact read-only verification needed.

2. **Jetnity-owned application events**
   - Which events can be recorded safely by authenticated/server-controlled code?
   - Which events cannot be trusted because the caller is unauthenticated?
   - How can login failures avoid creating an anonymous spam-write surface?
   - Is a SECURITY DEFINER RPC, scoped server secret, service-role client, or another privileged mechanism actually necessary? Do not implement one here.

3. **Hybrid**
   - If different sources own different event classes, define the boundary explicitly.
   - Never merge platform truth and Jetnity app truth into one undifferentiated truth class.

Choose a preferred architecture. Do not finish with “A/B/C are possible” unless evidence genuinely prevents a safe choice.

## 4. Minimum V1 event taxonomy

Define the smallest event set that materially helps release-gate §G without building a SIEM.

At minimum assess:
- admin login failure;
- admin login success / AAL2 success if useful;
- admin authorization denial / capability denial;
- admin intervention attempts/results;
- blocklist add/remove as **local administrative actions only**, not proof of network enforcement;
- security-relevant account/auth events only where source trust is defensible.

For every proposed event define:
- canonical event type;
- producer/source;
- trust class;
- actor identity availability;
- whether unauthenticated;
- allowed fields;
- forbidden fields;
- dedupe/idempotency expectation;
- severity/operational usefulness.

## 5. Privacy / PII hard requirements

Default to **minimum data**.

Explicitly decide treatment of:
- email address;
- IP address;
- user-agent;
- user_id;
- session/token identifiers;
- free-text `detail`;
- route/path;
- request body;
- traveller data.

Rules:
- no passwords, OTPs, tokens, secrets;
- no passport/MRZ/biometric/health/traveller-document data;
- no arbitrary free-text payload copied into security events;
- no email address merely because login failed;
- do not call IP “anonymous”;
- if IP is not strictly required for the chosen V1 architecture, prefer not storing it;
- if a field is necessary, define purpose and retention boundary.

## 6. Threat model

Attack the proposed design for:
- anonymous spam/flood of the event table;
- forging event types or actor identity;
- privilege escalation;
- service-role blast radius;
- security-definer abuse;
- recursive failure (event logging breaks auth);
- availability coupling;
- duplicate/retry storms;
- stale/partial data;
- log injection;
- PII accumulation;
- admin UI false certainty.

Logging failure must never turn an auth rejection into a success.

## 7. Retention

Finding 2.4 retention policy remains separate and not fully decided.

Therefore:
- do not invent a legal retention period as settled Product-Owner truth;
- state the minimum technical requirement for bounded retention;
- identify which retention decision is Product-Owner/legal input;
- do not add cron/migration in this slice.

## 8. Current schema assessment

Assess current `security_events` schema as:
- usable unchanged;
- usable only with strict writer contract;
- requires additive migration;
- should not be the target.

Do not mutate schema.

If a future migration is required, describe only the minimal fields/constraints and why.

## 9. Product-Owner / special gates

Produce a table that separates:
- **ungated next engineering work**;
- **Production-write gated**;
- **new provider/secret gated**;
- **retention/legal decision gated**;
- **not needed for V1**.

Standing Authorization #440 does not waive special gates.

## 10. Required deliverables

Create:

- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_STATUS_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_HANDOFF_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_SELF_REVIEW_2026-09-18.md`

Do **not** edit global continuity documents in this slice.
Do **not** mark finding 5.2 resolved merely because the architecture is decided.

The decision doc must end with a concrete **smallest safe follow-up implementation slice**, including exact allowed files/areas and hard exclusions.

## 11. Validation

Because this is docs-only:
- verify changed-file scope;
- run documentation/repository hygiene checks that are relevant and available;
- no unnecessary DB/Auth/Production calls;
- GitHub CI + Vercel Preview on exact head if normal repository automation triggers them;
- prove merge-base/current-main and ahead/behind;
- review threads 0 before stop.

## 12. Governance

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**  
Generation: **1**  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

Cursor:
- one writer on this branch;
- no runtime implementation;
- no Ready;
- no merge;
- no follow-up slice;
- STOP FOR TECHNICAL-LEAD REVIEW.

Any new head invalidates older exact-head evidence.
