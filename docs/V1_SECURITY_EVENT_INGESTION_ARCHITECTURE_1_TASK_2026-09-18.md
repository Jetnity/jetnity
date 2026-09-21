# Jetnity – V1 Security Event Ingestion Architecture 1 – Binding Task

Stand: 18. September 2026  
Issue: #486  
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

---

## 13. Amendment — 21 September 2026 — Technical-Lead CHANGES REQUIRED

Review: `5265503350` on head `035486e021cf56c0ada4a3dc7ad1924cb1c01de4`.  
Same agent / generation / session / branch / PR.

This amendment **supersedes the integration-only restriction** for architecture corrections only. It does **not** authorise runtime implementation, migration, RLS/grant/Auth changes, privileged credentials, Production action, Writer 1, or a new agent/branch/PR.

Required:

1. Remove wording that the architecture was “accepted” because it survived integration.
2. Replace, do not caveat, the actor-JWT INSERT contract (F1).
3. Reconcile taxonomy with AAL2 / `darf_betrieb_*` / break-glass (F2). Unobserved signals must be named as unobserved.
4. Specify an enforced producer boundary for payload, time, size, rate/volume, historical-type compatibility and delivery failure (F3). Retention remains an activation prerequisite without inventing a legal period.
5. Publish an adversarial acceptance matrix. Distinguish reasoning from tests actually run.
6. Withdraw Writer 1 as previously specified. Propose a replacement follow-up that does not presume F1–F3 are solved.
7. Update DECISION / STATUS / HANDOFF / SELF_REVIEW and the PR description. No false self-SHA or prior-PASS claims.
8. Fresh exact-head CI + Auth + Preview; merge-base = current main; behind = 0; then **STOP FOR TECHNICAL-LEAD REVIEW**.

---

## 14. Amendment — 21 September 2026 — Technical-Lead re-review R1/R2

Review: `5265844197` on head `86540c7a702547fbe5825784dbd64063ef9622cd`.  
Same agent / generation / session / branch / PR. Model remains Cursor Grok 4.6 High Fast.

F1 and F2 remain accepted at design level. Correct only R1/R2 and dependent wording in the existing five-file package. Do not restart the source architecture.

Required:

1. **R1:** Binding fail-closed atomic audit for in-scope operator+AAL2 `blocked_ips` mutations. Source change and derived event commit together or both roll back. Payload/admission/trigger errors must not be swallowed. Login/MFA/authorization stay unobserved and must not flip. Document the availability tradeoff. Define row-level, zero-row, upsert, multi-row and outer-rollback behaviour. Privileged/no-actor paths stay outside the authenticated producer guarantee.
2. **R2:** Separate payload/row-volume, serialized concurrent admission, and retention/cleanup. Missing/invalid cap config disables the producer. Do not treat COUNT-then-INSERT or a count cap as retention. Persistent environment activation stays closed until an approved time-bound cleanup arrangement and the technical controls are implemented and verified. No invented legal period.
3. Identify any extra quota-object dependency explicitly. Narrow the next proposal to repository/local disposable-database producer-contract work and synthetic tests only.
4. Persist the substantive docs, freeze the head, then report final exact-head CI/Auth/Preview in a **PR comment**. Do not add another docs commit solely to record predecessor green checks.
5. No runtime/SQL, migration, grant, RLS, Auth, secret, Ready, merge, Producer 1 or follow-up.

---

## 15. Amendment — 21 September 2026 — Technical-Lead re-review R3/R4

Review: `5266535944` on head `37abe3e15bd4fd3c37c741dc37ed500283384fb5`.  
Same agent / generation / session / branch / PR. Model remains Cursor Grok 4.6 High Fast.

Preserve F1/F2/R1 and the mutation-derived source direction. Correct only R3/R4 in the existing five-file package.

Required:

1. **R3:** `used` is currently retained tracked producer rows. Future cleanup must decrement/reconcile `used` under the same serialized quota lock and transaction as deletion of those rows. Rollback rolls both back. Legacy/privileged rows stay outside quota and must not be deleted to repair accounting. Drift or a missing quota row disables persistent producer writes until repaired/verified. Persistent activation stays closed until this coupling is implemented and tested. No invented period N.
2. **R4:** Keep the AFTER row-level trigger. Each qualifying row reserves **exactly 1** under the same quota-row lock. A later row that exceeds C RAISEs; the whole multi-row statement rolls back all source rows, events and quota increments. Do not claim an upfront statement-wide `n` reservation and do not add a statement-level collector. Add future synthetic tests for bulk capacity boundary and rollback.
3. Freeze the resulting head. Report exact-head CI/Auth/Preview in a **PR comment**. No extra evidence-only commit.
4. No runtime/SQL, migration, grant, RLS, Auth, secret, Ready, merge, Producer Contract 1 or follow-up. Next gate after a clean frozen head is a full independent Guardian adversarial architecture review, not another automatic event classification.

