# Jetnity – V1 Security Event Ingestion Architecture 1 – Binding Decision

Stand: 21. September 2026  
Status: **ARCHITECTURE CORRECTED AFTER TL CHANGES REQUIRED (F1–F3) / NOT A TECHNICAL-LEAD PASS / FINDING 5.2 INGESTION REMAINS OPEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #486  
Draft PR: #487  
Branch: `docs/v1-security-event-ingestion-architecture-1`  
Original canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`  
Current integration base: `main@4a223d342e24fb9316f5ee4333914a16dca3b7bc`  
Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Task amendment: 21 September 2026 (same file)  
Source audit: #438 / merged PR #449 / finding 5.2  
Presentation hygiene: merged PR #485  
TL review: CHANGES REQUIRED on `035486e0` (review `5265503350`)

Cursor-Agent: **Jetnity V1 security event ingestion architecture 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast**  
Session: `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd`

This document **replaces** the 18–21 September actor-JWT INSERT contract. It is not a runtime implementation and does **not** close finding 5.2. Integration onto current main preserved a then-proposed draft; that preservation was **not** architectural acceptance.

---

## 0. What was rejected

The previous draft claimed “server-controlled Jetnity application truth” while proposing `GRANT INSERT` to `authenticated` gated only by `darf_betrieb_lesen()`, `user_id = auth.uid()`, null IP and an allowed type.

That is **authenticated caller-report INSERT**, not server-authored action truth:

- The same JWT works on the Supabase Data API.
- `darf_betrieb_lesen()` is moderator **and** AAL2 (`20260827170000_admin_aal2_data_plane_alignment.sql`). It does not prove a handler ran or that a mutation occurred.
- Block/unblock requires `darf_betrieb_eingreifen()` (operator **and** AAL2) plus `adminWriteErlaubt`.
- The predicate did not constrain `extra`, `metadata`, `created_at` or size.
- `admin_login_success` / `aal2-required` events cannot be inserted by a predicate that already requires AAL2.
- Break-glass grant fields were advertised while break-glass writes were forbidden.

Those claims are withdrawn. They are not patched with call-site discipline, `server-only`, or “the app is the only caller”.

---

## 1. Binding decision

**Preferred V1 architecture: mutation-derived Jetnity events. No actor-JWT table INSERT.**

`security_events` may record a V1 **action-success** row only when that row is **derived from a verified data-plane mutation** that already passed the existing capability and grant rules. The producer must not accept caller-chosen type, actor, success flag, timestamp or payload.

Rejected as V1 ingestion / producer:

1. **Actor-JWT `INSERT` into `security_events`** (PostgREST/Data API or server client using the same JWT).
2. **Supabase / platform auth-log** copy into this table.
3. **Hybrid ingestion** that merges platform rows and Jetnity rows into one trust class.
4. **Unauthenticated writers** (public login form, anon grant, client-callable write RPC).
5. **Raw `service_role` table DML** on `security_events` from application code.
6. Labelling caller-chosen rows as “the action occurred”.

Platform Auth logs remain a separate operator-only truth class. Dashboard inspection is allowed. Ingestion is not.

Release-gate §G is **not** satisfied. Most auth signals remain **unobserved** in this table. #485 coverage copy stays required.

---

## 2. Live evidence inspected

Live repository evidence outranks historical audit wording.

| Evidence | Finding |
| --- | --- |
| `app/api/admin/security/{list,events,summary}/route.ts` | Authenticated `betrieb-lesen` readers via `lese()`. Empty ≠ error. |
| `SecurityWidget.tsx` + `ehrliche-zustaende.ts` | Incomplete recorded-event view. KPIs count recorded rows only. |
| `app/(public)/admin/login/actions.ts` | No `security_events` write. Password failure returns `error.message`. Non-admin sessions signed out after `evaluateAdminAccess`. `step-up` redirects to `/admin/mfa` while still AAL1. |
| `lib/auth/admin-guard.ts` | Denials are console only. Break-glass logs email. Auth failure must stay a denial. |
| `app/api/admin/security/{block,unblock}/route.ts` | `betrieb-eingreifen` + `adminWriteErlaubt`; writes `blocked_ips` only. Not enforced on the edge. |
| `20260827170000_admin_aal2_data_plane_alignment.sql` | `darf_betrieb_lesen()` = moderator **and** `aktuelles_admin_aal2()`. `darf_betrieb_eingreifen()` = operator **and** AAL2. |
| `20260817100800_faehigkeiten.sql` | `blocked_ips` INSERT/UPDATE/DELETE require `darf_betrieb_eingreifen()`. `security_events` is SELECT-only for `authenticated`. |
| `20260815060111_baseline.sql` | `security_events`: unconstrained `type`, nullable `ip`/`user_id`/`extra`/`metadata`, default `created_at`, no TTL. `service_role` ALL. |
| `20260817100300_rechte.sql` | `GRANT SELECT` only on `security_events` to `authenticated`. Pairing rule: grant iff matching policy. |
| `scripts/db/sicherheit.mjs` L3649 | Privileged test fixture `('login_failed', '203.0.113.1')`. Historical type exists. |
| Application tree | No application INSERT to `security_events`. No auth-log reader. |

Finding 5.2 remains: correct reader, no application writer.

---

## 3. Source-architecture evaluation

### 3.1 Platform auth-log source

**Not the V1 ingestion source.** Unchanged from the earlier evaluation: privileged secret, PII, wrong trust class, cannot express Jetnity blocklist/AAL/capability facts. Capability of Production audit persistence remains **UNKNOWN** pending operator dashboard verification. That verification would not authorise ingestion.

### 3.2 Actor-JWT application INSERT — rejected

Previously chosen. **Rejected (F1).** Same-JWT Data API bypass is a counterexample, not a Production incident. Identity binding ≠ action provenance.

If such rows were ever stored, they would have to be labelled `authenticated-caller-report` and **must not** claim that the named action occurred. V1 does **not** store that class.

### 3.3 Mutation-derived producer — chosen for persistable V1 action evidence

The only V1 persistable class is a row created **because** `blocked_ips` was inserted, updated or deleted under existing RLS.

Enforced producer (specified, not implemented):

- **No** `GRANT INSERT` on `security_events` to `anon` or `authenticated`.
- **No** INSERT policy for those roles.
- An `AFTER INSERT OR UPDATE OR DELETE` trigger on `public.blocked_ips` writes `security_events`.
- The trigger function is a **least-privilege privileged mechanism** (table-owner / SECURITY DEFINER, trigger-only, not a client RPC):
  - fixed `search_path`;
  - `REVOKE ALL` / no `EXECUTE` for `anon` or `authenticated`;
  - inserts only `admin_blocklist_add` or `admin_blocklist_remove` derived from `TG_OP` (`INSERT`/`UPDATE` → add; `DELETE` → remove);
  - `user_id = auth.uid()`; if `auth.uid()` is null, **write nothing** (fail closed; no service-role impersonation);
  - `ip` null; `metadata` null; `created_at = now()` inside the function (ignore any tuple field);
  - `extra` built only as `{"surface":"blocked_ips","result":"ok","op":"<tg_op>"}`;
  - does not copy `NEW.ip`, `OLD.ip`, `reason`, request bodies or emails;
  - rejects the write (exception or no-op documented in implementation) if payload would exceed a documented byte cap (≤ 256 bytes JSON).
- Application routes keep today’s block/unblock behaviour. They do **not** insert into `security_events`.
- Event meaning: **local `blocked_ips` row changed**. Not “network blocked this IP”. Finding 5.3 remains.

This is privileged in the narrow trigger-owner sense. It is **not** authorised to be implemented in this slice. It is **not** raw service-role table DML and **not** an authenticated write RPC.

### 3.4 Privileged server writer for auth-gate outcomes — assessed, gated, not V1

Login success, AAL2 completion and capability denial have **no durable mutation** to derive from.

A later least-privilege function, `EXECUTE` only for `service_role`, taking a closed operation token and deriving type/actor/time internally, **may** be designed after reserved approval. Requirements if ever proposed:

- no `authenticated`/`anon` EXECUTE;
- no caller-chosen type/actor/success/time/JSON;
- callable only after `auth.getUser()` + `evaluateAdminAccess` already decided, and never able to change that decision;
- not the existing unrestricted `security_events service all` policy;
- Product-Owner / security gate for expanding privileged write.

Until that gate exists, those signals stay **unobserved**.

### 3.5 Hybrid ingestion

Rejected. Operators may look at platform logs out of band.

---

## 4. Trust classes

| Class | Meaning | Write `security_events` in V1? |
| --- | --- | --- |
| `mutation-derived` | Trigger-built row from a real `blocked_ips` change. | **Yes, after a later implementation + activation prerequisites** |
| `authenticated-caller-report` | Actor JWT INSERT / client-chosen fields. | **No** |
| `platform-auth` | Supabase Auth / Management logs. | **No** |
| `unauthenticated-claim` | Public form / anon. | **No** |
| `privileged-auth-writer` | Future service-role-only closed RPC for AAL2-complete auth outcomes. | **Not V1; reserved gate** |
| `unobserved` | Real events that this table will not contain. | n/a — must stay disclosed |

Zero recorded rows still means only “zero mutation-derived Jetnity rows in this window”.

---

## 5. Taxonomy and role × AAL × grant truth table

Do **not** reuse `auth_failed`, `login_failed`, `anomaly*`, `bot`, `suspicious`, `ddos` as new producers.

### 5.1 Persistable in V1 (after later implementation)

| Type | Producer | Trust class | Actor | Unauthenticated? | Allowed fields | Forbidden | Dedupe | Usefulness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `admin_blocklist_add` | `blocked_ips` AFTER INSERT/UPDATE trigger | `mutation-derived` | `auth.uid()` of the mutating session | No | `type` from `TG_OP`, `user_id`, `created_at=now()`, closed `extra` | IP, reason, request body, caller JSON, caller time | One row per successful mutation. Retry/upsert may add another derived row. No client idempotency key. | Notice. Local list change only. |
| `admin_blocklist_remove` | `blocked_ips` AFTER DELETE trigger | same | same | No | same | same | same | Notice. Local list change only. |

### 5.2 Assessed and **unobserved** in V1

These are **not** covered. They must not be advertised as recorded.

| Signal | Role × AAL × grant | Why unobserved |
| --- | --- | --- |
| Unauthenticated password / OTP / magic-link failure | none | Spam/forgery; no trusted actor; no email-on-failure. |
| Traveller password success | authenticated, no admin role | Wrong domain; PII; no capability. |
| Admin password success then `step-up` / `aal2-required` | moderator+ **AAL1** role | `darf_*` is false until AAL2. No mutation. Actor INSERT rejected. |
| `admin_login_success` after `freigeben` | moderator+ **AAL2** role | No durable mutation. Privileged auth-writer gated, not V1. |
| `admin_aal2_success` | moderator+ **AAL2** after `/admin/mfa` | Same. |
| `admin_authorization_denied` (`forbidden`, `aal2-required`) | depends | AAL1 cannot pass data-plane predicates; AAL2 denial has no mutation; lookup-failed must not write (recursive). |
| Break-glass UI grant | any role, AAL2, **break-glass** | ADR-0036: must not persist. Cannot mutate `blocked_ips`. No grant field in events. |
| Lookup / AAL lookup failure | any | Same database as the failure. |
| Platform Auth log copies | n/a | Wrong class; PII; secret gate. |
| Blocklist **enforcement** | n/a | Finding 5.3. |
| Anomaly / bot / ddos | n/a | No producer. |

### 5.3 Role × AAL × grant × persistability

| Actor | AAL | Grant | Can persist a V1 row? | How |
| --- | --- | --- | --- | --- |
| anon / public | — | — | No | No grant; no mutation. |
| Traveller | any | session | No | Cannot change `blocked_ips`. |
| Moderator | aal1 | role | No | `darf_betrieb_*` false; cannot mutate. |
| Moderator | aal2 | role | No | Can read events; cannot mutate `blocked_ips`; cannot INSERT events. |
| Operator+ | aal1 | role | No | Data-plane intervention requires AAL2. |
| Operator+ | aal2 | role | **Yes, only via `blocked_ips` mutation** | Trigger derives the event. |
| Any | aal2 | break-glass | No | UI only; `adminWriteErlaubt` false; RLS intervention false. |
| Moderator AAL2 via Data API | aal2 | role | No | Forged `admin_blocklist_*` INSERT must fail (no grant/policy). |
| Operator AAL2 via Data API choosing fields | aal2 | role | No direct event INSERT | They may mutate `blocked_ips` if RLS allows; the trigger, not the client, builds the event. They cannot choose type/actor/time/JSON on `security_events`. |

Do not weaken AAL2 or break-glass rules to make a larger taxonomy persist.

---

## 6. Privacy / PII contract

Unchanged minimum-data rule. Purpose of persistable rows: attribute **who changed the local blocklist**. Not attacker investigation. Not network-enforcement evidence.

| Field | Decision |
| --- | --- |
| Email | Never store. |
| IP | Never store on `security_events`. `blocked_ips.ip` is a different table. |
| User-agent | Never store. |
| `user_id` | Allowed only as `auth.uid()` of the mutating session. |
| Session / tokens | Never store. |
| `extra` / `metadata` / free text | Trigger-built closed object only. `metadata` null. No `reason`, no `error.message`. |
| Route | Only the token `blocked_ips` from the trigger. No raw URL. |
| Request body / traveller data | Never. |

---

## 7. Threat model and adversarial matrix

| Case | Required outcome | How the replacement enforces it |
| --- | --- | --- |
| Direct same-JWT bypass | Fail | No authenticated INSERT grant/policy. Data API cannot insert events. |
| Moderator forging operator action | Fail | Cannot mutate `blocked_ips`; cannot INSERT events. |
| AAL1 | No persist | `darf_betrieb_eingreifen()` false; no mutation; no event. |
| AAL2 operator mutation | Persist derived row only | Trigger after real change. |
| Break-glass | No persist | No `blocked_ips` write; no event fields for grant kind. |
| Foreign actor | Fail | `user_id` is `auth.uid()` of the mutator, not a client field. |
| Arbitrary JSON | Fail | Trigger builds `extra`; no client `extra`/`metadata`. |
| Supplied `created_at` | Fail | Function uses `now()`. No authenticated INSERT to override. |
| Oversized payload | Fail | Trigger cap; closed object. |
| Replayed / duplicate mutation | Possible second derived row | Accepted only as “one event per mutation”. Volume bounded by intervention capability + §8 cap. No client replay handle. |
| Logging / trigger failure | Auth/API outcome unchanged | Trigger exception must **not** flip a denied login into success (login does not write). For block/unblock: implementation must choose fail-closed on the mutation vs best-effort event; **recommended:** mutation remains source of truth, event failure is visible as missing coverage, not as “action failed” if the row committed. Must be specified in the implementation slice. Telemetry loss ≠ complete coverage. |
| Historical / test rows (`login_failed` + IP) | Keep | No table-wide type CHECK that forbids legacy types. No rewrite/delete of old rows to fit a new constraint. New producer emits only the two new types. |
| Unauthenticated flood | Fail | No anon write. |
| Service-role blast | Residual | Baseline ALL remains. App must not use it. Trigger must no-op when `auth.uid()` is null. Later revoke is a separate hardening gate. |
| DEFINER abuse | Residual if trigger added | Trigger-only EXECUTE; closed insert shape; no client RPC. |
| UI false certainty | Residual | Keep #485 copy. Do not map derived add/remove onto `auth_failed` KPIs. |

Logging failure must never turn an auth rejection into a success.

**Tests actually run in this correction:** none against PostgreSQL/RLS. The matrix is source reasoning. TL already performed a synthetic predicate evaluation on the *rejected* contract. A future implementation slice must turn this matrix into automated tests.

---

## 8. Retention and bounded ingestion

Finding 2.4 remains **not decided**. No legal period is invented.

| Layer | Statement |
| --- | --- |
| Technical minimum | Rows that contain `user_id` must be bounded. |
| Activation prerequisite | **No writer may be activated** (Preview persistent writes included) until either (a) Product-Owner/legal sets period N and a delete-older-than-N job is specified, or (b) a documented **temporary technical row-cap** exists that refuses further derived inserts when the cap is reached, explicitly **not** a legal retention period. |
| Rate / volume | Persistable volume = successful `blocked_ips` mutations by operator+AAL2. No unauthenticated path. Implementation must still define a numeric cap or refuse-open behaviour when the table is over cap. |
| This slice | No cron, no cap SQL, no invented N. |

---

## 9. Schema assessment

**Verdict: remain on `security_events`. Usable only with a mutation-derived producer. Actor-JWT INSERT is the wrong future migration. Do not mutate schema in this slice.**

Why not usable unchanged: no producer; unconstrained columns; `service_role` ALL; no TTL.

Why keep the table: readers and UI already exist.

Minimal **future** additive change (describe only):

1. Trigger + trigger function as in §3.3. **Not** `GRANT INSERT` to `authenticated`.
2. No INSERT policy for `authenticated`.
3. Do **not** add a table CHECK that only allows the two new types (would break historical/test `login_failed` without a rewrite).
4. Optional later: CHECK that `ip IS NULL` **for new producer rows** is enforced in the trigger, not by deleting old IP-bearing fixtures.
5. No UPDATE/DELETE grant for `authenticated`.
6. Payload/time/size enforced in the function, not in TypeScript.
7. Privileged auth-writer and `service_role` ALL revoke are separate gated slices.

---

## 10. Gates

Standing Authorization #440 does not waive special gates.

| Class | Items |
| --- | --- |
| **Ungated next engineering (after TL PASS on this decision)** | A later numbered slice that implements **only** the mutation-derived trigger + tests for the adversarial matrix. Preview/Development schema only. No login writer. Keep #485 copy. |
| **Activation / retention gated** | Enabling the trigger in any persistent environment; row-cap or delete-older-than-N; privacy-notice text. |
| **Production-write gated** | Applying the trigger/function to Production; any Production event row; revoking `service_role` ALL. |
| **Privileged-auth-writer gated** | service-role-only closed RPC for AAL2-complete login/MFA outcomes. |
| **New provider / secret gated** | Management API, observability vendor, new env, paid log storage. |
| **Not needed for V1** | SIEM; platform-log ingest; actor-JWT INSERT; unauthenticated failure writer; blocklist enforcement; anomaly taxonomy; weakening AAL2. |

The previously named **Writer 1** (authenticated INSERT + five call sites) is **withdrawn**. It must not be started.

---

## 11. Traveller-context check

Not relevant. No traveller credentials.

---

## 12. Smallest safe follow-up implementation slice

**Name:** Jetnity V1 Security Event Mutation-Derived Producer 1  
**Issue/PR:** only after Technical-Lead PASS on **this corrected** decision  
**Goal:** Persist `admin_blocklist_add` / `admin_blocklist_remove` solely from a `blocked_ips` trigger with enforced payload/time, without authenticated INSERT and without claiming auth-event coverage.

### Allowed files / areas (future slice)

- One additive migration: trigger + function only (no authenticated INSERT grant).
- Tests that encode §7 (same-JWT bypass, moderator forge, AAL1, break-glass, foreign actor, arbitrary JSON, supplied time, oversized payload, historical `login_failed` remains readable).
- Slice-local TASK / STATUS / HANDOFF / SELF_REVIEW.

### Hard exclusions

- no actor-JWT INSERT grant/policy
- no TypeScript-only writer presented as the enforcement boundary
- no login / MFA / denial writes
- no raw service-role `security_events` DML
- no client-callable DEFINER RPC
- no platform-log ingest
- no Auth/AAL/RLS weakening
- no Production apply
- no invented legal retention period
- no activation without §8 prerequisite
- no Writer 1 as previously specified
- no Ready / merge by Cursor

### Done when (future slice)

- Direct authenticated INSERT of a forged blocklist event fails.
- A real operator+AAL2 `blocked_ips` mutation produces exactly the derived shape.
- Coverage copy still says recorded ≠ real, and unobserved auth signals stay unnamed as recorded.
- Production untouched.

**This correction slice does not start that work.**

---

## 13. What this document does not do

- It does not implement a trigger, grant, RLS change or writer.
- It does not close finding 5.2 or satisfy §G.
- It does not decide retention law.
- It does not enforce `blocked_ips` on the network.
- It is not a Technical-Lead PASS.
