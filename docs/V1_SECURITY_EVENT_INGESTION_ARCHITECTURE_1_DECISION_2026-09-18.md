# Jetnity – V1 Security Event Ingestion Architecture 1 – Binding Decision

Stand: 18. September 2026  
Status: **ARCHITECTURE DECIDED / FINDING 5.2 INGESTION REMAINS OPEN / NOT RESOLVED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`  
Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 5.2  
Presentation hygiene: merged PR #485

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast**  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This document is the binding source / threat / privacy decision for the smallest V1-safe writer. It is **not** a runtime implementation and does **not** close finding 5.2.

---

## 1. Binding decision

**Preferred V1 architecture: Jetnity-owned application events, authenticated / server-controlled only.**

`security_events` may record only events that an already-authenticated admin session can insert under its own JWT after a server-side admin decision. The table remains one trust class: **Jetnity application truth**.

Rejected as V1 ingestion:

1. **Supabase / platform auth-log source** as a runtime reader or copier into `security_events`.
2. **Hybrid ingestion** that merges platform rows and Jetnity rows into one undifferentiated table.
3. **Unauthenticated writers**, including login-password failure inserts from the public admin form.
4. **Service-role client** and **new SECURITY DEFINER write RPC** for this table.

Platform Auth logs remain a **separate** operator-only truth class. Operators may inspect them in the Supabase dashboard. Jetnity must not copy them into `security_events` in V1.

Release-gate §G is **not** satisfied by this decision. Admin Security copy from #485 remains the honest empty/incomplete state until a later writer slice persists real rows.

---

## 2. Live evidence inspected

Live repository evidence outranks historical audit wording.

| Evidence | Finding |
| --- | --- |
| `app/api/admin/security/{list,events,summary}/route.ts` | Authenticated `betrieb-lesen` readers via `lese()`. Empty ≠ error. |
| `components/admin/security/SecurityWidget.tsx` + `lib/admin/ehrliche-zustaende.ts` | Coverage is disclosed as incomplete recorded-event view. 24h KPIs count recorded rows only. |
| `app/(public)/admin/login/actions.ts` | Password sign-in and magic-link send write **no** `security_events` row. Failed password returns `error.message`. Non-admin sessions are signed out after `evaluateAdminAccess`. |
| `lib/auth/admin-guard.ts` | Denials are `console.warn` / `console.error` only. Break-glass success logs email in console. Auth failure must stay a denial. |
| `app/api/admin/security/{block,unblock}/route.ts` | Authenticated `betrieb-eingreifen` + `adminWriteErlaubt` writes `blocked_ips` only. No paired security event. Blocklist is **not** enforced (`proxy.ts` / no middleware). |
| `lib/admin/kennzahlen.ts` | Summary counts `type === 'auth_failed'` and `type.startsWith('anomaly')`. Nothing in application runtime produces those types. |
| `SecurityWidget.tsx` L149–150 | UI treats `type` containing `failed` and `/bot\|suspicious\|ddos/i` as KPIs. Those names are historical display guesses, not a producer contract. |
| `supabase/migrations/20260815060111_baseline.sql` L1036–1044 | Table: `id`, `type text NOT NULL`, `ip text`, `user_id uuid`, `extra jsonb`, `created_at`, `metadata jsonb`. No type check, no TTL. |
| Same file L1677 + L1911–1913 | Baseline `service_role` ALL policy and GRANT ALL, including to `anon`/`authenticated`. |
| `20260817100300_rechte.sql` L30 + L73 | Later revoke-all then `GRANT SELECT` only to `authenticated`. No INSERT grant. Pairing rule: grant exists only when a matching policy exists. |
| `20260817100800_faehigkeiten.sql` L122–123 | Current read policy: `security_events_lesen` / `darf_betrieb_lesen()` (moderator+). No INSERT policy. |
| `20260817100000_rollenmodell.sql` | `hat_rolle_mindestens` is SECURITY DEFINER and already used by capability helpers. `darf_betrieb_*` are SECURITY INVOKER wrappers. |
| `20260817100700_admin_security_overview.sql` | Existing SECURITY DEFINER **read** of RLS catalog counts. Not an event writer. |
| `scripts/db/sicherheit.mjs` L3649 | Test harness inserts `('login_failed', '203.0.113.1')` as privileged setup. Not application runtime. |
| `lib/supabase/auth-erwartung.ts` L294 | `audit_log_disable_postgres` is explicitly **not checked**. Capability of platform audit persistence is UNKNOWN from current gates. |
| `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_LIVE_EVIDENCE_2026-08-29.md` §8 | Management log source names historically include `auth_logs` and `auth_audit_logs`. This is dashboard/API inventory, not an app reader. |
| Application tree | No INSERT to `security_events` in `app/**`, `components/**`, `lib/**`. No auth-log reader. No service-role security-event client. |

Finding 5.2 remains: the admin security page is a correct reader of a table with no application writer.

---

## 3. Source-architecture evaluation

### 3.1 Supabase / platform auth-log source

**Decision: not the V1 ingestion source.**

What the repository can prove:

- Supabase Auth exists and already authenticates admin login.
- A platform Auth setting `audit_log_disable_postgres` exists and is currently unchecked.
- A 29 August 2026 operator evidence note lists Management log sources `auth_logs` and `auth_audit_logs`.
- No Jetnity runtime reads those sources.

What is **UNKNOWN** and must stay UNKNOWN until a read-only operator check:

1. Whether Production Auth currently persists Postgres audit rows (`audit_log_disable_postgres` on Production ref `qscbgcdmivbbnzrcyegn`).
2. Whether existing operator dashboard access can list the minimum V1 signals without a new secret.
3. Whether the app JWT / PostgREST roles can see `auth` schema objects. Repository evidence does not show such a grant; do not assume they can.

Exact read-only verification, if a later slice wants it:

- Operator dashboard only, no new env/secret, no runtime reader, no copy into `security_events`.
- Record whether Auth logs are visible, which fields they contain, and whether `audit_log_disable_postgres` is on.
- That verification still would **not** authorise ingestion.

Why platform ingestion is the wrong V1 source even if logs exist:

- Runtime read needs a Management API token or other privileged credential. That is a **new secret / data-processor / operational dependency**.
- Auth logs are a different truth class (platform Auth), not Jetnity admin-decision truth.
- They typically carry email, IP and user-agent. Release-gate §G forbids PII in logs.
- They cannot express Jetnity-only facts: capability denial, break-glass-vs-role grant, local blocklist add/remove, AAL2 admin gate.
- Copying them into `security_events` would launder platform PII into the admin UI and collapse trust classes.
- Binding task forbids raw auth-log ingestion in this programme until a later gated slice explicitly opens it.

### 3.2 Jetnity-owned application events

**Decision: this is the V1 source, with a hard authenticated-only writer contract.**

Events Jetnity can record safely:

- Outcomes that already have a verified user (`auth.getUser()`), a server-side admin decision, and an INSERT that runs as that user.
- Local administrative mutations that already passed `requireAdminApi({ capability: 'betrieb-eingreifen' })` and `adminWriteErlaubt`.

Events Jetnity must **not** record in V1:

- Password / OTP / magic-link failures from an unauthenticated caller.
- “Someone typed an email” attempts.
- Any event whose only identity is a client-supplied IP, email or user-agent.
- Auth lookup failures (`lookup-failed`, `aal-lookup-failed`): writing those into the same database that just failed is recursive.

How login failures avoid an anonymous spam-write surface:

- The public admin form is unauthenticated. An INSERT policy for `anon`, a client-callable SECURITY DEFINER RPC, or a service-role write from that form would let the internet flood `security_events`.
- V1 therefore **does not persist unauthenticated login failures**.
- Platform Auth may already rate-limit and log those attempts. Jetnity does not ingest that stream.
- After a **successful** password auth, `evaluateAdminAccess` can persist `admin_login_success` or `admin_authorization_denied` **only if** the user already satisfies `darf_betrieb_lesen()` (moderator+). A normal traveller account that happens to open `/admin/login` cannot insert.

Is a privileged mechanism necessary?

| Mechanism | Necessary for V1? | Why |
| --- | --- | --- |
| Authenticated INSERT grant + RLS `WITH CHECK` | **Yes, later** | Current schema has SELECT-only grant and SELECT-only policy. No application write is possible without this additive change. |
| Service-role writer | **No** | Baseline already grants `service_role` ALL on this table. Using it expands blast radius to every row and bypasses actor binding. Existing service-role use (`model_usage`) must not be reused here. |
| New SECURITY DEFINER write RPC | **No** | Would recreate the historical `anon_security_definer_function_executable` class of bug unless execute is locked down; still a privilege-escalation magnet for unauthenticated failures. Existing DEFINER helpers (`hat_rolle_mindestens`, `admin_security_overview`) are not event writers and must not be extended into one. |
| Scoped server secret / Management token | **No** | Only needed for platform-log read. Not chosen. |
| Anon INSERT | **Forbidden** | Spam / forgery surface. |

### 3.3 Hybrid

**Decision: hybrid *ingestion* is rejected. Hybrid *operator visibility* is allowed.**

If a later gated slice ever reads platform logs, they must stay labelled `platform-auth` and must not be inserted into `security_events` without a new source/trust column **and** a Product-Owner/privacy review.

V1 table meaning is only: **Jetnity recorded this authenticated admin application event.**

It is never: **Supabase Auth says this login failed** or **the network blocked this IP**.

---

## 4. Trust classes

| Class | Meaning | May write `security_events` in V1? |
| --- | --- | --- |
| `jetnity-app-authenticated` | Server-controlled insert using the actor JWT after `evaluateAdminAccess` / `requireAdminApi` / `adminWriteErlaubt`. | **Yes** |
| `platform-auth` | Supabase Auth / Management logs. | **No** |
| `unauthenticated-claim` | Public form, anonymous client, forged type/actor. | **No** |
| `privileged-ingest` | `service_role` or new DEFINER writer. | **No** |
| `local-admin-action` | Subclass of `jetnity-app-authenticated` for block/unblock. Records the **attempt/result of a local row change**, not network enforcement. | **Yes** |

Admin UI must keep saying that zero recorded rows ≠ zero real events. After a writer exists, zero still means only “zero Jetnity-authenticated rows in this window”.

---

## 5. Minimum V1 event taxonomy

Smallest set that materially helps release-gate §G without a SIEM.

Canonical types are **new names**. Do **not** reuse `auth_failed`, `login_failed`, `anomaly*`, `bot`, `suspicious`, or `ddos` for V1 producers. Those strings currently drive empty KPIs and would create false certainty if stretched to cover authenticated denials.

### 5.1 In V1

| Canonical type | Producer / source | Trust class | Actor identity | Unauthenticated? | Allowed fields | Forbidden fields | Dedupe / idempotency | Severity / usefulness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `admin_login_success` | `signInWithPasswordAction` only after `evaluateAdminAccess` allows (`freigeben` or `step-up`) | `jetnity-app-authenticated` | `user_id = auth.uid()` of that admin | No | `type`, `user_id`, `created_at`, `extra.surface` (`admin-login`), `extra.grant` (`role` \| `break-glass`), `extra.outcome` (`granted` \| `step-up`) | `ip`, email, user-agent, password/error text, session/token, request body | One insert per successful server decision. Retry may duplicate. No unique key in V1. | Info. Proves ingestion and admin auth succeeded. |
| `admin_aal2_success` | `/admin/mfa` server path after AAL2 is actually reached | `jetnity-app-authenticated` | same | No | `type`, `user_id`, `extra.surface` (`admin-mfa`) | same plus MFA codes | One insert per successful step-up. Duplicates acceptable. | Info. Useful if login itself only reached step-up. |
| `admin_authorization_denied` | Login action **or** `requireAdminApi` when user is present, `darf_betrieb_lesen()` would pass, and denial is `forbidden` or `aal2-required` | `jetnity-app-authenticated` | same | No | `type`, `user_id`, `extra.surface` (allowlisted token), `extra.denial` (enum), `extra.capability` (allowlisted capability name or omit) | lookup-failed writes; raw URL; email; IP; `error.message` | No insert on unauthenticated 401. Accept duplicates if the client retries. | Warning. Shows an identified admin was refused. |
| `admin_blocklist_add` | `POST /api/admin/security/block` after successful upsert | `local-admin-action` | acting admin `user_id` | No | `type`, `user_id`, `extra.surface` (`api/security/block`), `extra.result` (`ok`) | blocked IP, reason free text, request body | One insert per successful mutation. | Notice. Local administrative action only. |
| `admin_blocklist_remove` | `POST /api/admin/security/unblock` after successful delete | `local-admin-action` | acting admin `user_id` | No | `type`, `user_id`, `extra.surface` (`api/security/unblock`), `extra.result` (`ok`) | target IP | One insert per successful mutation. | Notice. Local administrative action only. |

`extra` is a closed JSON object of allowlisted keys and enum values only. `metadata` stays null. `ip` stays null.

### 5.2 Assessed and excluded from V1

| Candidate | Why excluded |
| --- | --- |
| Unauthenticated admin/user password failure | No trusted actor; insert is a spam/forgery surface; email must not be stored “because login failed”. |
| Magic-link send / OTP send | Public form; always-same response is an anti-oracle. Logging would add PII or create a new oracle. |
| `auth_failed` / `login_failed` as produced types | Legacy KPI/test-harness names. Reusing them would make “recorded login failures” look populated without a trusted failure source. |
| `anomaly*` / bot / suspicious / ddos | No producer. Inventing them is false SIEM. |
| Non-admin account login success/failure | Out of V1 admin-security scope; high volume; PII. |
| Traveller / document / MRZ / health events | Forbidden. Wrong domain. |
| Platform Auth log copies | Wrong trust class; PII; secret/provider gate. |
| Blocklist **enforcement** events | Finding 5.3. Nothing enforces `blocked_ips`. Do not emit “blocked request” events. |
| Auth/DB lookup failures | Recursive failure / availability coupling. |

### 5.3 Call-site rule

Do **not** hook success writes into `evaluateAdminAccess`. That function runs on every admin page and on the 15-second SecurityWidget poll. Success writes belong only at explicit, rare surfaces (login action, MFA step-up).

Denial writes, if added, belong only at `requireAdminApi` (and the login action), never at `requireAdminPage` layout evaluation.

Writer failure is swallowed after a non-PII console error. It must not change the auth/API decision. A failed insert must never turn a rejection into a success.

Break-glass sessions must not write (`adminWriteErlaubt` / role grant only), matching ADR-0036.

---

## 6. Privacy / PII contract

Default: **minimum data**. Purpose of V1 rows: operator attribution of authenticated admin application decisions. Not investigation of anonymous attackers. Not legal evidence of network blocking.

| Field | Decision | Purpose / retention if kept |
| --- | --- | --- |
| Email address | **Never store** in `security_events`. Not on failure, not on success. | Account email already lives on the user. Console break-glass email logging is an existing residual; do not copy it into the table. |
| IP address | **Do not store in V1 events.** Column exists; writer writes `NULL`. IP is identifying, not anonymous. | Not required for authenticated admin attribution. `blocked_ips.ip` remains the local list object and is a separate table/decision. |
| User-agent | **Never store.** | Fingerprint / PII. Not required. |
| `user_id` | **Allowed** for the authenticated admin actor only. Must equal `auth.uid()`. | Attribution. Retention = row lifetime; legal period is not decided (finding 2.4). |
| Session / token identifiers | **Never store.** | Credential material. |
| Free-text `detail` / `extra` / `metadata` | **No arbitrary payload.** No `JSON.stringify` of unknown objects as a write contract. No copy of `error.message`, form fields, or `blocked_ips.reason`. | Current list route stringifies `extra` for display. That is a reader residual. Writers must only emit allowlisted enums so display cannot become a log-injection / PII dump. |
| Route / path | **Allowlisted surface tokens only** (`admin-login`, `admin-mfa`, `api/security/block`, `api/security/unblock`, `api/security/events`, …). No raw URL, query string, or Referer. | Debugging which gate fired. |
| Request body | **Never store.** | Passwords, emails, reasons. |
| Traveller data | **Never store.** No trip, document, MRZ, biometric, health, citizenship, or registry identifiers. | Wrong domain. |

Hard bans: passwords, OTPs, MFA codes, JWTs, refresh tokens, cookies, secrets, service-role keys, passport/MRZ/biometric/health/traveller-document data.

If a later slice claims IP is required, it needs a purpose statement, a retention period, and a Product-Owner/legal gate. It is not required for this architecture.

---

## 7. Threat model

| Attack | Assessment | V1 control |
| --- | --- | --- |
| Anonymous spam / flood of `security_events` | High if unauthenticated insert exists. | No anon grant/policy; no DEFINER write RPC; no service-role login hook; no failure insert on the public form. |
| Forging event type or actor | Authenticated admin could INSERT arbitrary `type` / foreign `user_id` if policy is only “is moderator”. | Future INSERT `WITH CHECK`: `user_id is not distinct from auth.uid()`, `ip is null`, `type` in the closed allowlist. Server writer is the only caller. |
| Privilege escalation | Service-role or DEFINER write would let a bug write as anyone. | Do not add either. Do not grant INSERT to `anon`. |
| Service-role blast radius | Baseline policy `security_events service all` already allows unrestricted service-role DML. | Do not start using it. A later hardening slice may revoke service-role write **after** the authenticated writer exists. Out of this slice. |
| SECURITY DEFINER abuse | New write function executable by `anon`/`authenticated` would be a classic escalation. | No new DEFINER writer. Reuse only existing INVOKER `darf_betrieb_lesen()` inside RLS. |
| Recursive failure | Event insert uses the same DB as auth/role lookup. | Never write on `lookup-failed` / `aal-lookup-failed`. Writer errors are ignored by the auth path. |
| Availability coupling | Sync insert on every admin poll would add latency and row growth. | No success hook in `evaluateAdminAccess`. Rare explicit call sites only. |
| Duplicate / retry storms | Login and block retries can double-insert. | Accept duplicates. No unique constraint and no client-supplied idempotency key in V1 (that key would itself be a flood handle). |
| Stale / partial data | Table will still miss unauthenticated failures and platform Auth facts. | Keep #485 coverage copy. Do not retitle KPIs as “real login failures”. |
| Log injection | Free-text `extra` / `error.message` rendered in admin HTML. | Closed enums only. No raw provider errors. |
| PII accumulation | `ip` + `extra` + unbounded `created_at` grow forever. | V1 writes null IP and tiny extras. Retention job is finding 2.4 / PO-legal, not this slice. |
| Admin UI false certainty | `auth_failed` / anomaly KPIs are still zero after V1 writes of the new types. | Do not remap new types onto those KPI strings in the first writer slice unless a dedicated presentation slice updates labels to the new taxonomy. Prefer leaving KPIs at 0 over fake “failed logins”. |
| Auth outcome flip | Insert throw after a denial. | Writer is fire-and-forget; denial/success already decided. |
| Break-glass write | Break-glass has UI grant but must not persist. | Same `adminWriteErlaubt` gate as block/unblock. |

Logging failure must never turn an auth rejection into a success.

---

## 8. Retention

Finding 2.4 remains **separate and not decided**.

| Layer | Statement |
| --- | --- |
| Must not claim | Any legal retention period (days/months) as Product-Owner or CH-DSG/GDPR truth. |
| Technical minimum | Rows must be **bounded**. An unbounded append-only security table will accumulate `user_id` (personal data) even with V1 minimisation. |
| Later technical shape | A single delete-older-than-N job, table-local, no generic retention framework. Scheduler/`pg_cron` is a later gated implementation. |
| Product-Owner / legal input | The value of N, whether `user_id` may be stored that long, whether `blocked_ips` shares the same period, and privacy-notice wording. |
| This slice | No cron, no purge SQL, no invented N. |

---

## 9. Current schema assessment

**Verdict: usable only with a strict writer contract. An additive migration is required before any application write. The table should remain the V1 target. Do not replace it.**

Do not mutate schema in this slice.

Why not “usable unchanged”:

- `authenticated` has SELECT grant and SELECT policy only. Application INSERT is impossible.
- `type` is unconstrained text.
- `ip`, `extra`, `metadata` invite PII and free-text dumps.
- `user_id` is nullable and not bound to `auth.uid()`.
- No retention column / TTL.
- `service_role` still has ALL.

Why not “should not be the target”:

- Readers, types, search (`ereignisSuchfilter`), admin UI and RLS read path already exist.
- A second table would duplicate truth and worsen finding 5.2.

Minimal **future** additive migration (describe only; do not apply here):

1. `GRANT INSERT ON public.security_events TO authenticated` (required by `scripts/db/rechte.mjs` pairing).
2. INSERT policy `security_events_schreiben` for `authenticated` with `WITH CHECK` of `darf_betrieb_lesen()` AND `user_id is not distinct from auth.uid()` AND `ip is null` AND `type` in the V1 allowlist.
3. Optional but recommended: CHECK constraint on `type` equal to that allowlist, so a loose client cannot invent types.
4. No UPDATE/DELETE grant for `authenticated`.
5. No new columns required for V1. Do not add IP hashing, source, or retention columns in the first writer slice.
6. Do not grant INSERT to `anon`. Do not add a DEFINER writer.

Until that migration exists, the writer contract may be specified and tested as a pure function, but it cannot persist.

---

## 10. Product-Owner / special gates

Standing Authorization #440 does not waive special gates.

| Class | Items |
| --- | --- |
| **Ungated next engineering work** | This architecture decision. The smallest follow-up writer slice in §12: contract module + tests + additive INSERT grant/policy + explicit authenticated call sites. Preview/Development only. Keep #485 coverage copy. Do not mark 5.2 resolved. |
| **Production-write gated** | Applying the INSERT grant/policy to Production. Any Production row insert. Any later revoke of `service_role` ALL on this table. Any Production Auth/config change. |
| **New provider / secret gated** | Management API / log-drain token. Observability vendor (Sentry, Datadog, Logtail, …). New env vars. Paid log storage. Using service-role for this table even though the key already exists. |
| **Retention / legal decision gated** | Period N, privacy-notice text, whether IP may ever be stored, whether `user_id` in this table is named in the notice, deletion/export interaction with finding 2.1/2.2. |
| **Not needed for V1** | SIEM. Platform-log ingestion. Unauthenticated failure writer. Blocklist enforcement (5.3). Anomaly/bot taxonomy. User-agent/IP fingerprinting. Per-request success logging. New DEFINER RPC. Scheduler in the first writer slice. |

---

## 11. Traveller-context check

Not relevant. This decision is admin operational telemetry. It must not collect or infer citizenship, documents, residence, route, or other traveller credentials.

---

## 12. Smallest safe follow-up implementation slice

**Name:** Jetnity V1 Security Event Writer 1  
**Issue/PR:** to be opened by Technical Lead after this decision is accepted  
**Goal:** Persist the five V1 types in §5.1 from authenticated admin surfaces, with the additive INSERT grant/policy from §9, without creating an unauthenticated write surface.

### Allowed files / areas

- New writer module under `lib/admin/` (suggested: `security-event-schreiben.ts`) and focused tests.
- One additive migration that only adds authenticated INSERT grant + INSERT policy (+ optional `type` CHECK). No other tables.
- Explicit call sites only:
  - `app/(public)/admin/login/actions.ts` — after the admin decision, fire-and-forget, never change redirect/sign-out/error.
  - `app/(public)/admin/mfa/` server path — `admin_aal2_success` after real AAL2.
  - `app/api/admin/security/block/route.ts`
  - `app/api/admin/security/unblock/route.ts`
  - optionally `requireAdminApi` for `admin_authorization_denied` only (`forbidden` / `aal2-required`, user present). **Not** `requireAdminPage`. **Not** `evaluateAdminAccess` success.
- Generated `types/supabase.ts` only if the usual type pipeline requires it.
- Slice-local TASK / STATUS / HANDOFF / SELF_REVIEW.

### Hard exclusions

- no service-role client or writer
- no new SECURITY DEFINER function
- no anon INSERT
- no unauthenticated login-failure insert
- no raw Auth-log / Management API reader
- no IP, email, user-agent, token, free-text reason, request body, traveller data
- no remap of new types onto `auth_failed` / anomaly KPIs unless a separately tasked presentation fix updates labels
- no blocklist enforcement / `proxy.ts` / middleware
- no scheduler / cron / retention job
- no Production apply
- no new provider / secret / env / paid call
- no global continuity edits (`JETNITY_HANDOFF.md`, `ROADMAP.md`, `docs/ACTIVE_WORK_STATUS.md`, `CONTINUITY_STANDARD.md`)
- no marking finding 5.2 PASS/RESOLVED — even after first rows exist, unauthenticated failures and platform Auth remain outside the table
- no Ready / merge by Cursor
- no second follow-up slice from that writer agent

### Done when

- Preview/Development can show at least one authenticated V1 type as a recorded row.
- Insert as `anon` and as a non-admin authenticated user fails.
- Writer failure leaves login denial/success unchanged.
- Coverage copy still says recorded ≠ real.
- Production is untouched.

---

## 13. What this document does not do

- It does not implement a writer.
- It does not change schema, RLS, grants, Auth, or Production.
- It does not close finding 5.2.
- It does not satisfy release-gate §G.
- It does not decide retention law.
- It does not enforce `blocked_ips`.
