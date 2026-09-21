# Jetnity – V1 Security Event Mutation-Derived Producer Contract 1 – Binding Task

Stand: 21. September 2026  
Issue: #493  
Branch: `test/v1-security-event-mutation-derived-producer-contract-1`  
Canonical base: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`

## 1. Objective

Prove the accepted PR #487 security-event producer contract in a **local disposable PostgreSQL database only**.

This is a contract/proof slice, not a persistent rollout.

PR #487 is merged. Its architecture decision is binding for this slice:
- no actor-JWT INSERT to `security_events`;
- only mutation-derived local blocklist events are in-scope;
- operator + current AAL2 is required for the source mutation;
- break-glass stays non-persistent;
- source mutation + event + quota reservation are atomic fail-closed;
- payload/volume/admission/retention are separate controls;
- `used` means currently retained tracked producer rows;
- cleanup and quota reconciliation share one serialized lock/transaction domain;
- AFTER ROW trigger reserves exactly 1 per qualifying row;
- persistent activation remains closed.

Finding 5.2 and release-gate §G remain OPEN.

## 2. Reuse before add

Inspect and reuse the existing isolated DB proof style:

- `scripts/db/besuche-rls-lokal.mjs`
- `scripts/db/besuche-rls-lokal-bootstrap.sql`
- `scripts/db/s5b-persistenz-lokal.mjs`
- `scripts/db/s5b-persistenz-lokal-bootstrap.sql`
- `scripts/db/sicherheit.mjs`
- `scripts/db/rechte.mjs`
- `scripts/db/rls.mjs`
- `package.json`

Read the merged architecture package from #487, especially:
- `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`
- TASK amendments §13–§15
- STATUS/HANDOFF/SELF_REVIEW.

Do not invent a second event architecture.

## 3. Current Supabase/Postgres verification requirement

Before implementation:
1. check current Supabase changelog/docs relevant to RLS / Data API / database functions / SECURITY DEFINER / trigger access;
2. record any relevant current behavior or breaking change in the slice self-review;
3. do not depend on training-memory-only Supabase semantics.

Important current security constraints to verify and preserve:
- Data API access is controlled by both grants and RLS;
- SECURITY DEFINER is privileged and must have pinned/empty search_path with schema-qualified objects;
- function EXECUTE must not remain available to PUBLIC/anon/authenticated unless explicitly needed;
- service-role/secret keys are not used by this local proof.

## 4. Topology

Decision: **SINGLE_AGENT**.

Reason:
- one shared contract across trigger, quota ledger, cleanup semantics and tests;
- parallel writers would collide in the same local bootstrap/harness;
- the slice is small enough that one writer is safer.

Agent:
**Jetnity V1 security event mutation-derived producer contract 1**, Generation 1.

Required model:
**Cursor Grok 4.6 High Fast** — no Auto/substitution.

## 5. Allowed files

Preferred ownership:

- `scripts/db/security-events-producer-contract-lokal.mjs`
- `scripts/db/security-events-producer-contract-lokal-bootstrap.sql`
- optionally `scripts/db/security-events-producer-contract-lokal-contract.sql`
- `package.json` for one local test command only
- slice-local:
  - `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_STATUS_2026-09-21.md`
  - `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_HANDOFF_2026-09-21.md`
  - `docs/V1_SECURITY_EVENT_MUTATION_DERIVED_PRODUCER_CONTRACT_1_SELF_REVIEW_2026-09-21.md`
- this task.

Do **not** add any file under:
- `supabase/migrations/`
- `app/`
- `components/`
- `lib/`
- `hooks/`
- `types/`
- `public/`

unless TL explicitly revises this task.

## 6. Local-only hard safety

The harness must fail immediately if any remote DB use is requested.

At minimum:
- no Management API;
- no Supabase project ref;
- no remote connection string;
- no service-role key;
- no network DB target;
- local disposable PostgreSQL database created/dropped by the script;
- synthetic UUIDs and fake IP/reason fixtures only.

Use an explicit guard such as:
- reject `JETNITY_ALLOW_REMOTE_DB=1`;
- reject known Supabase/remote DB env variables if the script would otherwise consume them;
- do not import `scripts/db/sql.mjs`.

Production / Development / Preview Supabase must remain untouched.

## 7. Contract-under-test

Build a minimal Supabase-like local bootstrap sufficient to test the accepted architecture.

Must model:
- roles: `anon`, `authenticated`, `service_role`;
- `auth.uid()`;
- `auth.jwt()` or equivalent current AAL claim simulation;
- a minimal admin role source sufficient to distinguish moderator vs operator;
- `darf_betrieb_lesen()`;
- `darf_betrieb_eingreifen()` = operator+ AND current AAL2;
- `blocked_ips`;
- `security_events`;
- baseline SELECT-only event access for authenticated reader if needed;
- no authenticated/anon INSERT to security_events.

Prototype the **future producer contract only inside the disposable harness**:
- narrow quota object;
- trigger-only privileged function;
- AFTER ROW trigger;
- fixed search_path / fully schema-qualified references;
- no client-callable RPC;
- no EXECUTE for PUBLIC/anon/authenticated;
- fixed event shape;
- one quota reservation per qualifying row;
- same transaction for source/event/quota;
- cleanup/quota reconciliation under same lock domain.

This prototype is test fixture/proof code, not a persistent migration.

## 8. Event contract

Only these future producer event types:
- `admin_blocklist_add`
- `admin_blocklist_remove`

Derived fields only:
- type from TG_OP / accepted mutation semantics;
- user_id from auth.uid();
- created_at from database time;
- `ip = null`;
- `metadata = null`;
- closed `extra` object only.

Never copy into `security_events`:
- blocked IP;
- reason;
- email;
- user-agent;
- raw request body;
- token/session values;
- arbitrary JSON;
- traveller/passport/MRZ/health data.

Event means only:
**local blocked_ips row changed**.

It does not mean:
**network request was blocked**.

## 9. Required adversarial test matrix

The local harness must automatically test and fail the command if any case fails.

### Direct write / authorization
- anon direct INSERT to security_events fails;
- authenticated moderator AAL2 direct INSERT fails;
- authenticated operator AAL2 direct INSERT fails;
- moderator AAL2 cannot mutate blocked_ips;
- operator AAL1 cannot mutate blocked_ips;
- operator AAL2 can mutate blocked_ips;
- break-glass representation must not grant DB mutation authority;
- service_role/null-uid mutation is outside authenticated producer guarantee and must not mint a trusted event.

### Producer integrity
- INSERT blocked_ips → exactly one derived add event;
- DELETE blocked_ips → exactly one derived remove event;
- UPDATE with actual row-image change → exactly one add/update-notice event per accepted contract;
- unchanged UPDATE → no event;
- zero-row UPDATE/DELETE → no event;
- ON CONFLICT DO NOTHING → no event;
- ON CONFLICT DO UPDATE with actual change → one event;
- actor/type/time/extra cannot be client-selected.

### Payload / PII
- event IP null;
- metadata null;
- no blocked IP in extra;
- no reason/free text in extra;
- extra keys/values exactly allowlisted;
- payload ≤ accepted test bound;
- database time is used.

### Atomic fail-closed R1
Inject/fault the event insert and prove:
- source mutation does not commit;
- event does not commit;
- quota increment does not commit.

Prove outer transaction rollback removes:
- source mutation;
- derived event;
- quota increment.

### Serialized admission R2/R4
Use a synthetic fixture cap C.

Prove:
- each qualifying row reserves exactly 1;
- at C−1, two concurrent transactions cannot both make retained tracked rows exceed C;
- one blocks/serializes and the over-cap transaction fails;
- rollback leaks no reservation;
- retry must re-reserve;
- multi-row mutation that crosses C rolls the **whole statement** back;
- no upfront statement-wide n claim/mechanism.

### Invalid state
- missing quota row disables/fails producer writes;
- null/zero/negative/invalid cap disables/fails producer writes;
- deliberately drifted `used` vs retained tracked rows disables/fails writes until repaired;
- no silent best-effort mode.

### Cleanup ↔ quota lifecycle R3
Using a synthetic test-only cleanup age:
- cleanup selects only tracked producer rows;
- cleanup and quota decrement/reconcile are one transaction under the quota lock;
- rollback restores both deleted events and `used`;
- legacy `login_failed` fixture remains untouched;
- privileged/out-of-contract rows remain untouched;
- after cleanup, `used` equals retained tracked producer rows.

The synthetic cleanup age is a test fixture only — not a legal retention period or production policy.

### Legacy compatibility
- existing historical `login_failed` / IP-bearing fixture remains readable;
- no blanket type CHECK requiring rewrite/delete;
- quota ignores legacy/out-of-contract rows.

## 10. Concurrency proof quality

Do not fake concurrency with two sequential statements.

Use two separate local PostgreSQL sessions/processes/transactions or another real concurrency mechanism.

The test must demonstrate lock/serialization behavior, not merely inspect SQL text.

Record what actually ran.

## 11. Security-definer proof

The harness must inspect catalog truth and assert:
- producer function security mode matches the chosen contract;
- search_path is fixed/empty as designed;
- PUBLIC/anon/authenticated cannot EXECUTE;
- it is not a client-callable RPC;
- direct event DML grants remain closed;
- no unexpected role inheritance grants access.

A SECURITY DEFINER function must never be introduced merely to work around a permissions failure. The test fixture is proving an already-reviewed narrow trigger-only contract.

## 12. Persistent-environment boundary

This slice must **not**:
- apply the prototype to Supabase Development;
- apply the prototype to Preview;
- apply the prototype to Production;
- create a real migration;
- write real actor rows;
- change Auth/RLS/Grants remotely;
- configure cron;
- choose retention N;
- revoke service_role in Production;
- implement login/MFA event writers;
- enforce blocked_ips at edge/network level.

Any attempt to do so is scope failure.

## 13. Validation

At minimum run:
- new local producer-contract harness;
- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run check:api-schutz`;
- `npm run check:schema-bezug`;
- `npm run check:dead`;
- `npm run check:exports`;
- `npm run check:deps`;
- `npm run build`;
- exact-head GitHub CI;
- exact-head Vercel Preview;
- merge-base/current-main / behind=0;
- review threads 0.

If PostgreSQL/local tooling is unavailable in the Cursor environment:
- do not substitute a fake unit test;
- report BLOCKED with exact missing capability;
- preserve the task and STOP for TL.

## 14. Deliverables

Persist:
- TASK
- STATUS
- HANDOFF
- SELF_REVIEW
- executable local harness / bootstrap / contract fixture
- package script.

Self-review must explicitly attack:
- same-JWT bypass;
- direct event write;
- moderator/AAL1/break-glass;
- function EXECUTE exposure;
- trigger failure;
- quota race;
- multi-row rollback;
- cleanup/quota drift;
- PII leakage;
- legacy row destruction;
- accidental remote DB use.

## 15. Stop condition

When implementation/tests are complete:
- freeze the head;
- put exact-head CI/Auth/Vercel IDs in a PR comment rather than adding an evidence-only commit;
- STOP FOR TECHNICAL-LEAD REVIEW.

Cursor:
- no Ready;
- no merge;
- no persistent apply;
- no follow-up slice.

Any changed head invalidates older exact-head evidence.
