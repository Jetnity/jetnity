# Jetnity – V1 Security Event Coverage Truth 1 – Binding Task

Stand: 18. September 2026  
Issue: #484  
Branch: `fix/v1-security-event-coverage-truth-1`  
Canonical base: `main@21f489d3beed55ca6a80d901d4aded5e669eb1a9`

## 1. Objective

Make the existing Admin Security surface truthful about its **coverage boundary**.

Current live repository truth:
- application runtime contains readers for `public.security_events`;
- no application runtime writer exists;
- normal authenticated RLS has SELECT capability, not a general authenticated INSERT path;
- Production currently contains only two historical 2025 rows;
- Development currently contains zero rows.

Therefore a displayed `0` must never be presented as “no security event happened”. It means only that zero rows were recorded in this table/window.

This slice is a truth-hygiene remediation. It does **not** implement event ingestion and must not claim finding 5.2 is fully closed.

## 2. File ownership / collision boundary

Allowed runtime files:
- `components/admin/security/SecurityWidget.tsx`
- `lib/admin/ehrliche-zustaende.ts`

Allowed focused tests:
- existing/new tests under `lib/admin/**`

Allowed audit update:
- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`

Required slice docs:
- `docs/V1_SECURITY_EVENT_COVERAGE_TRUTH_1_STATUS_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_COVERAGE_TRUTH_1_HANDOFF_2026-09-18.md`
- `docs/V1_SECURITY_EVENT_COVERAGE_TRUTH_1_SELF_REVIEW_2026-09-18.md`

Do **not** touch:
- `app/(public)/error.tsx`
- `app/account/error.tsx`
- `app/(admin)/admin/error.tsx`
- `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`
- any file owned by parallel PR #483.

## 3. Required UI truth

### 3.1 Page / top-level hint

`ADMIN_EHRLICHE_TEXTE.securityHinweis` must state clearly, in concise German:
- this surface reads local `security_events` rows;
- current Jetnity application runtime does not provide complete event ingestion;
- zero recorded rows is **not** proof that no security-relevant event occurred;
- there is no live monitoring;
- IP blocklist is not enforced.

Do not overstate historical/test provenance beyond what is verified.

### 3.2 Persistent coverage notice

The Security UI must show a persistent, visible truth notice separate from transient load errors:
- counts below refer to **recorded rows** in the current table/window only;
- missing ingestion means coverage is incomplete.

Reuse central copy from `ADMIN_EHRLICHE_TEXTE` rather than duplicating the whole contract inline.

### 3.3 KPI labels

Rename misleading KPI labels so they cannot be read as complete observed reality.

Examples of acceptable semantics:
- `Aufgezeichnete Events (24h)`
- `Aufgezeichnete Login-Fehler (24h)`
- `Aufgezeichnete Auffälligkeiten (24h)`

Exact concise wording may be improved, but **recorded/aufgezeichnet** semantics are mandatory.

Do not change the numerical calculation contract in this slice unless required only to keep labels/code consistent.

### 3.4 Event table / empty state

The event table heading and empty state must be coverage-honest.

The current:
- `Letzte Security-Events (7 Tage)`
- `Keine Events gefunden.`

must not imply complete monitoring.

Use wording equivalent to:
- `Aufgezeichnete Security-Events (7 Tage)`
- `Keine aufgezeichneten Events in diesem Zeitraum.`

The UI should retain empty vs error distinction.

### 3.5 Blocklist

Preserve existing truth:
- IP blocklist is not enforced;
- writing/removing local blocklist rows remains as currently implemented.

Do not expand enforcement or mutate middleware/edge behavior.

## 4. Audit update

In audit finding 5.2 add a **dated 18 September 2026 mitigation update** that preserves the historical audit text and states:

- Admin Security presentation now explicitly says the table is an incomplete recorded-event view;
- zero rows no longer imply zero real security events;
- **runtime ingestion remains OPEN**;
- release-gate §G is **not** satisfied by copy alone;
- no service-role writer, Auth log integration, observability vendor, migration or Production mutation was introduced.

Do not mark 5.2 PASS/RESOLVED.

## 5. Security / privacy / operations hard exclusions

Forbidden:
- service-role client or writer;
- new authenticated/anonymous INSERT policy;
- migration;
- RLS/grant change;
- Supabase/Auth mutation;
- direct Production write;
- raw auth log ingestion;
- IP/user-agent fingerprint collection;
- new PII/security-event schema;
- Sentry/Vercel observability/Datadog/Logtail or other vendor;
- new provider/secret/env;
- cost;
- scheduler/cron;
- changing blocklist enforcement;
- global continuity edits.

A later event-ingestion slice must separately decide source, identity, PII minimization, abuse/rate-limit semantics and retention.

## 6. Tests

Strengthen focused tests so regressions fail if:
- `securityHinweis` stops stating incomplete coverage;
- it stops distinguishing recorded rows from real-world event absence;
- it stops stating blocklist not enforced;
- SecurityWidget KPI labels no longer use recorded/aufgezeichnet semantics;
- empty-event copy returns to a complete “Keine Events” claim.

Do not introduce fragile snapshot tests for unrelated UI.

At completion run at least:
- focused tests for changed admin truth contract;
- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run check:api-schutz`;
- `npm run check:schema-bezug`;
- `npm run check:dead`;
- `npm run check:exports`;
- `npm run check:deps`;
- `npm run build`.

Then obtain exact-head GitHub CI and Vercel Preview evidence.

## 7. Evidence

STATUS/HANDOFF must record:
- base / branch / exact head;
- changed files;
- merge-base / ahead / behind;
- local gates;
- CI run/job IDs;
- Vercel Preview deployment ID;
- review/thread status;
- explicit statement that event ingestion remains open;
- explicit statement that no service-role, migration, Auth/RLS, Production write, provider, secret or cost was introduced.

## 8. Agent / governance

Cursor-Agent: **Jetnity V1 security event coverage truth 1**  
Generation: **1**  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

Cursor:
- one writer for this branch;
- do not touch #483-owned files;
- do not mark Ready;
- do not merge;
- do not start follow-up work;
- stop at **STOP FOR TECHNICAL-LEAD REVIEW**.

Any new head invalidates earlier exact-head gates.
