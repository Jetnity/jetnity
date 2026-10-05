# Jetnity – V1 Incident Process Runbook

Stand: 18. September 2026  
Status: **DOCS-ONLY ZERO-PROVIDER INCIDENT OPERATIONS / NO LIVE PRODUCTION ACTION / NO MONITORING PROVIDER**

Issue: #463  
Draft PR: #464  
Source audit: #438 / merged PR #449 / finding 5.5 **process half**  
Binding task: `docs/V1_INCIDENT_PROCESS_1_TASK_2026-09-18.md`  
Release gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §G / §H / §M

This document is the canonical incident-operations runbook for **today**. It describes how an authorized operator coordinates, triages, contains, verifies and closes an incident using mechanisms Jetnity already has.

It does **not** execute an incident. It does **not** authorize a destructive or live Production action. It does **not** select, install or activate an error-tracking, alerting or log-aggregation provider.

---

## 0. What this document is and is not

### 0.1 This slice closes

The **process half** of audit finding 5.5 and the responsibility / escalation / containment / recovery / evidence part of release-gate §H.

An authorized operator should be able to answer:

- what happened, as far as current evidence allows;
- who coordinates;
- how severe it is, conservatively;
- what evidence exists and what remains unknown;
- what can safely be contained with **already-existing** controls;
- which special Product-Owner gate is required before a risky or live action;
- how recovery is verified;
- when the incident may be closed;
- what remains a launch gap until automated monitoring exists.

### 0.2 This slice does not close

- automated error tracking, alerting, paging or log aggregation (finding 5.5 **tooling half**, Product-Owner-gated);
- support-process finding 4.1;
- account error-boundary finding 4.2;
- security-event ingestion finding 5.2;
- IP-blocklist enforcement finding 5.3;
- system-health probe expansion finding 5.4;
- persistent provider cost-guard / S6A Production apply (finding 5.6);
- backup / restore rehearsal of release-gate §H (not independently re-proven here);
- legal or regulatory notification text or deadlines;
- any invented 24/7 on-call, SLA or contractual response time.

Unknown or unavailable remains unknown or unavailable. It is never PASS.

### 0.3 Related procedure, not a substitute

Admin TOTP-factor loss for a Jetnity **application admin** has its own runbook: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md`. Use that procedure for that class. It is not a general incident process and it does not recover Supabase platform-account MFA.

---

## 1. Incident trigger and scope

Treat a situation as an incident when it is, or may be, one of the following in Production, Preview or Development, and the truth is not already known and contained:

| Class | Examples that count |
| --- | --- |
| Production outage / degradation | Site 5xx, Auth unreachable, trip/account surfaces unusable, Vercel Production not READY |
| Security / privacy | Secret leak, session-cookie exposure, unauthorized admin, unexpected data disclosure |
| Auth / MFA / AAL / RLS | Mass lockout, AAL2 bypass suspicion, RLS/ownership failure, service-role misuse |
| Data integrity / data loss | Unexpected deletes, silent write failure, migration/history defect, empty presented as “nothing happened” |
| Provider / official-truth degradation | Live or test provider returning invented `not_required`, stale treated as current, Official Truth mixed with LLM |
| Paid / cost / quota anomaly | Unexpected model spend, quota exhaustion, suspected paid-call loop |
| Deployment / configuration regression | Bad Production/Preview SHA, env/flag drift, accidental indexing or model activation |
| Privacy / sensitive-data concern | Traveller/document/MRZ/health data in logs, tickets or chat |
| User-reported critical failure | A real user cannot plan, open, edit or trust a trip/account path |

Do **not** treat as an incident merely because:

- a Preview or CI job is red on an unmerged docs branch;
- a factory is `null` and the domain is fail-closed as designed;
- Production provider search is hard-off via `VERCEL_ENV=production`;
- an admin board reports `unknown` / `not_configured` / `foundation_only` (that is the honest idle state);
- `security_events` is empty (nothing currently writes it — see §5.2).

When it is unclear whether the event is an incident, open one at the conservative severity and narrow later. Do not wait for a pager that does not exist.

---

## 2. Current repository truth

Verified against current `main` / this branch at implementation. Stale audit line numbers were not copied as current evidence.

### 2.1 VERIFIED CURRENT CAPABILITY

#### Detection and evidence sources that actually exist

| Source | Kind | Environment | What it can prove | What it cannot prove |
| --- | --- | --- | --- | --- |
| GitHub Actions workflow `.github/workflows/ci.yml` | Automated on `push` to `main` and on pull requests. Two jobs: `verify` (`Typecheck, Lint & Build`) and `auth-konfiguration`. No pager. | CI of a SHA. Not a live Production health signal. | That a specific SHA passed or failed the verify suite (`npm ci`, `check:setup:ci`, `typecheck`, `lint`, `test`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`, `build`) and, when secrets exist, `auth:pruefen` against `supabase/config.toml`. | That Production is healthy. That users are unaffected. That a later env/dashboard click did not change Auth. A skipped-looking green job is forbidden by ADR-0039; a missing secret on a non-fork PR is fail-closed. |
| Vercel project `jetnity-app` | Automated per deployment. Dashboard/API show READY / ERROR / BUILDING. Build and runtime logs exist for an authorized operator. Instant rollback of a previous deployment is a **platform** capability. | Production, Preview, Development as configured in Vercel. | Exact deployment SHA, build outcome, and host-side runtime log lines if the operator opens them. | Automated paging. Central aggregation. That a READY deploy is behaviourally correct. This slice did not rehearse a Production rollback. |
| Supabase Dashboard / Management API (read-only when authorized) | Manual. Project logs, Auth, advisors, migration history. `npm run db:advisors` / `auth:pruefen` / `production:pruefen` exist as **scripts**, not alerts. | Development ref and Production ref `qscbgcdmivbbnzrcyegn` are documented in continuity; this slice does not query them. | What an authorized read shows at that moment. | Automated security or health alerts. That `security_events` reflects Auth failures (it has no application writer). |
| Next.js error boundaries | Automatic **user-visible** catch only. `app/(public)/error.tsx` logs `console.error('[PublicRouteError]', error)` in the **user browser** and shows `Fehler-ID` via `oeffentlicheFehlerId`. `app/(admin)/admin/error.tsx` shows `error.digest` only if present. | Public and admin route groups. **No** `app/account/error.tsx`, **no** root `app/error.tsx`, **no** `global-error.tsx`. | That a public or admin render failed for that user. | Operator notification. Correlation of `Fehler-ID` to host logs. Account-area crashes. |
| Provider-ops console events | Best-effort, non-persistent. `providerOpsConsoleEventSink` in `lib/provider-ops/observability.ts` writes `console.info('provider_ops_event', event)` with an allowlisted payload only. Sink errors are swallowed. | Server process / Vercel runtime logs, if someone looks. | A single allowlisted event if it was emitted and the log line is still retained by the host. | Persistence, aggregation, health over time. `providerOpsHealthAusEvents()` is a read-only derivation from **already-held** events; it is not a monitor. |
| Admin System Health `/admin/system-health` | Manual, AAL2, read-only. `lib/admin/system-health/runtime.ts` pings `airports` `select iata limit 1` (8s timeout). Vercel/GitHub/Infomaniak checks are honest `not_configured`. 30s in-memory cache. `writeActions: []`. | The environment of the signed-in admin session. | That this app process can or cannot read one public catalog table right now. | Deployment health, CI, DNS/mail, provider health, platform status. |
| Admin Provider & Kosten `/admin/provider-ops` | Manual, AAL2, read-only. `lib/admin/provider-ops-board/sammeln.ts` evaluates/assembles S1 domain state, kill-switch **form** and in-memory cost-guard **presence**, and consumes `deps.liesModelUsage()`. `lib/admin/provider-ops-board/runtime.ts` performs the last-30-day `model_usage` read (`USAGE_FENSTER_MS`, `USAGE_LIMIT = 200`, `.limit(USAGE_LIMIT)`). | Same as admin session. | S1 contract evaluation and stored `model_usage` rows if the read succeeds. Empty ≠ zero cost if the read failed. | Live provider health, a global budget, or that a kill switch was “toggled” in-app. There is no admin write toggle. |
| `public.model_usage` | Automated **after** a reserved model call. Enforced in the database by `modell_kontingent_beanspruchen()` / `modell_nutzung_abschliessen()` (`lib/modell/kontingent.ts`, migration `20260818040000_modellnutzung.sql`). | The Supabase project that received the call. Production Assistant/`reisebegleiter` migration is documented as **not** applied; Production model activation remains closed. | Stored cost/result class for completed reservations in that project. | Alert when a ceiling is hit. Display of more than the admin 200-row window. |
| User/contact signal | Manual. Footer `mailto:info@jetnity.ch` in `components/layout/Footer.tsx` on public and account layouts. Absent from admin and from error surfaces. | Whoever reads that mailbox. | That a person sent mail, if someone opens it. | A support process, SLA, ownership or monitoring. Finding 4.1 remains open. |
| CI / review / issue evidence | Manual plus GitHub automation. | GitHub. | What was reviewed, merged, or reported. | Live runtime truth. Live-evidence wins. |

`package.json` has no `sentry`, `datadog`, `axiom`, `logtail`, `pagerduty`, `posthog`, `plausible` or other error-tracking/analytics SDK. That absence was re-verified for this slice.

#### Existing kill switches and fail-closed disablement paths

These are the **only** containment levers this runbook may name. Do not invent another switch.

Shared form: `providerOpsZustand()` / `providerOpsFlagAn()` / `providerOpsIstProduction()` in `lib/provider-ops/zustand.ts`.

| Control | Current symbol / path | What “off” means today | Notes |
| --- | --- | --- | --- |
| Shared Production hard-off | `providerOpsIstProduction(VERCEL_ENV)` → `aktiv: false, grund: 'production'` | Any domain using the shared form is off when `VERCEL_ENV === 'production'`, **even if its flag is true**. | This is a contract, not an admin toggle and not a persistent global switch (`bewerteKillSwitch()` says so). |
| Model / Assistant paid path | `JETNITY_MODELL_AKTIV` via `modellZustand()` in `lib/modell/konfiguration.ts` | Only exact `true` or `1` enables. Missing / `false` / typo → `{ aktiv: false, grund: 'abgeschaltet' }`. Also requires `OPENAI_API_KEY` and a priced `JETNITY_MODELL_NAME`. | **Not** Production-hard-off via `VERCEL_ENV`. Production stays off because the flag/key are not activated. Database quota is a second brake (`MODELL_GRENZEN` + `modell_kontingent_beanspruchen()`), not a pager. |
| Flight search | `JETNITY_FLIGHT_AKTIV` via `flugZustand()` in `lib/flights/zustand.ts` | Production hard-off, then explicit flag. Credentials stay in the Duffel factory; 0 constructible providers → search unavailable. | In-memory flight cost guard: `flugSucheErlaubt()` / `FLUG_RATE_GRENZEN` in `lib/flights/rate-limit.ts` (8 / 10 min, 24 / day, process-local). |
| Hotel search | `JETNITY_HOTEL_AKTIV` via `hotelZustand()` in `lib/hotels/zustand.ts` | Shared form + `zugangVorhanden`. `hotelProviderAus()` is `null`. | Flag alone cannot create a provider. |
| Activity search | `JETNITY_ACTIVITY_AKTIV` via `activityZustand()` in `lib/activities/zustand.ts` | Same. `activityProviderAus()` is `null`. | |
| Mobility search | `JETNITY_MOBILITY_AKTIV` via `mobilityZustand()` in `lib/mobility/zustand.ts` | Same. Factory remains `null`. | |
| Rental search | `JETNITY_RENTAL_CAR_AKTIV` via `rentalCarZustand()` in `lib/rental-cars/zustand.ts` | Same. Factory remains `null`. | |
| Requirements / Official Truth provider | `JETNITY_READINESS_AKTIV` via `readinessZustand()` / `requirementsProviderNachZustand()` in `lib/readiness/zustand.ts` | Shared form. `requirementsProviderAus()` is `null`. | Fail-closed `unknown`, never invented `not_required`. |
| Internal UI-audit pages | `JETNITY_UI_AUDIT` via `uiAuditSeiteAktiv()` in `lib/ui-audit/freigabe.ts` | Production always `false`, even with the flag. | ADR-0086. |
| Public indexing | `NEXT_PUBLIC_ALLOW_INDEXING` via `indexingIstExplizitFreigegeben()` / `oeffentlicherOrigin()` in `lib/seo/oeffentlicher-origin.ts` | Only exact `true` **and** canonical `https://jetnity.com` **and** Production may allow index. Unset / `false` / any other value remains deny. | Public indexing / domain cutover remains a special Product-Owner gate. Turning **on** is not incident containment. |

Safety / Seasonal have **no** current `JETNITY_SAFETY_AKTIV` / `JETNITY_SEASONAL_AKTIV` runtime flags. `safetyProviderAus()` and `seasonalProviderAus()` return `null`. Do not invent those flags during an incident.

#### What looks like a control and is not

| Apparent control | Current truth |
| --- | --- |
| Admin IP blocklist `blocked_ips` | Writable, **not enforced**. `proxy.ts` does not consult it. `ADMIN_EHRLICHE_TEXTE.ipBlockHinweis` says so. Do not use it as containment. |
| `public.security_events` | Table + admin read exist. Application does not INSERT. Empty means “nothing recorded”, not “nothing happened”. |
| `providerOpsInMemoryCostGuard` | Process-local `Map`. Resets per serverless instance. Not a global spend ceiling. |
| `lib/provider-ops/persistent-cost-guard.ts` | Exists, **not** exported from `lib/provider-ops/index.ts`. S6A Production tables are documented as absent. Not available as containment. |
| `ADMIN_ALLOWED_EMAILS` break-glass | Opens an admin **shell** only after AAL2. `reachesDatabase()` is false. Not an incident containment or recovery path. |
| Admin Provider-Ops / System-Health boards | Read-only. No toggle. |

### 2.2 CURRENT LIMITATION / UNKNOWN

The following are **absent**. Do not imply them in status, chat or user copy:

- 24/7 on-call, rota, or guaranteed human coverage;
- automatic paging (PagerDuty or equivalent);
- Sentry, Datadog, Axiom, Logtail or any hosted error-tracking / log-aggregation provider;
- a log drain from Vercel/Supabase into a central store;
- guaranteed automated provider-health alerting;
- guaranteed automated security-event alerting;
- a public or user-facing status / maintenance page;
- a defined support mailbox owner or response window (finding 4.1);
- contractual SLAs or legal notification deadlines;
- verified PITR (prior repair docs: Supabase Pro daily backups with 7-day window were recorded; PITR was **not** activated; this slice did not re-verify live backup/restore);
- an in-product “incident mode” banner.

A detection source that was not opened is **unknown**, not green.

---

## 3. Roles

These are responsibilities, not a staffing plan. Jetnity has no 24/7 incident team.

| Role | Responsibility in an incident |
| --- | --- |
| **Incident coordinator / Technical Lead** | Owns coordination, severity, containment decisions that stay inside existing controls, exact-head verification, and the written evidence record. ChatGPT / Technical Lead is this role under `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. |
| **Product Owner** | Decides every special gate listed in §7.3, any externally binding or public communication, vendor/user contact, and any new cost or provider. A generic “fix it” is not a special-gate approval. |
| **Bounded implementation agent** | Only if explicitly dispatched on a versioned task. Implements the bounded change. Never Ready. Never merge. Never mutates Production/Auth/secrets unless that later slice is separately gated. |
| **Guardian / read-only challenger** | When risk warrants (security, Auth/AAL/RLS, data loss, Production mutation). Challenge and evidence only. Not a second writer. Not Ready/Merge. |
| **Operator with host access** | The human who already has authorized Vercel / Supabase / GitHub access. Dashboard clicks are live actions; this document does not grant that access. |

Cursor agents, Guardian and this runbook **do not** become an on-call rota by being named here.

If the only available person is the Product Owner, that person may coordinate **and** still must not skip a special gate that applies to the action.

---

## 4. Severity

Use a small conservative model. When evidence is incomplete, choose the **higher** severity. These are internal coordination labels, not contractual SLAs.

| Severity | Meaning | Jetnity examples | Coordination |
| --- | --- | --- | --- |
| **SEV-0** | Immediate user-safety, security, sensitive-data or unbounded-cost harm, or confirmed Production data loss. | Production secret in a log or ticket; service-role in a client bundle; Auth/RLS bypass; traveller/document dump; confirmed destructive Production write; paid-call loop while a model key is live. | Technical Lead coordinates immediately. Product Owner is informed before any public statement and before any special-gate action. Do not wait for more telemetry that does not exist. |
| **SEV-1** | Production core journey, Auth/account, or data-integrity is down or untrustworthy for more than a single fluke, or a Preview leak that can reach real secrets. | Production 5xx / Auth outage; users cannot open account trips; empty/error collapse on trip reads; Production deploy on a known-bad SHA; suspected AAL2/RLS regression in Production. | Technical Lead coordinates the same day the signal is seen. Contain with existing controls. No “it might be flaky” downgrade without independent evidence. |
| **SEV-2** | Significant degradation, Preview/Development paid-path or provider-test incident, or a single-user critical failure with a plausible class risk. | Preview model spend anomaly; Duffel test-path hanging; one admin locked out (also use the MFA runbook); public `Fehler-ID` reports without host correlation; indexing flag uncertainty. | Technical Lead triages when next available. Record the incident even if containment is “leave the fail-closed path off”. |
| **SEV-3** | Isolated UX / copy / non-core degradation with no security, data, cost or official-truth risk. | Visual glitch, single-browser layout, docs typo, admin placeholder page. | Track as a normal issue. Do not consume incident coordination unless it escalates. |

Default rules:

1. Security, Auth/AAL/RLS, data loss and cost-loop start at **SEV-0** or **SEV-1**.
2. “Only one user reported it” does not make it SEV-3 if the class can affect others.
3. Preview/Development is not automatically low severity if Production secrets, Production data or live paid keys are involved.
4. Absence of an alert is not evidence of SEV-3.

---

## 5. Detection today

### 5.1 How an incident is noticed in practice

Today an incident is noticed only if a human:

1. sees a Vercel deployment fail or a Production/Preview runtime error in host logs;
2. sees a GitHub Actions failure on `main` or a relevant PR;
3. opens admin System Health or Provider-Ops and reads an honest non-green or failed **read**;
4. reads Supabase logs/advisors/Auth while already investigating;
5. receives mail at `info@jetnity.ch` or another out-of-band message;
6. reproduces a failure while using the product.

There is no automated path that pages anyone when those sources are silent.

### 5.2 Partial-failure limitations

- A green Vercel READY proves the deploy built and the host accepted it. It does not prove Auth, RLS, trip reads or model quotas.
- A green CI job proves the SHA’s verify suite. It does not prove the live environment still matches `supabase/config.toml` after a Dashboard click.
- A successful `airports` ping does not prove trip tables, Auth or Storage.
- A `model_usage` empty window after a **failed** read is unavailable, not “USD 0”.
- `security_events` empty is not “no security events”.
- A public `Fehler-ID` cannot currently be resolved on the operator side (finding 4.3 / 5.5 tooling).
- Provider-ops events are not persisted. A process restart or missed log window loses them.
- The in-memory cost guard can be green on instance A while instance B spends.

If a needed source cannot be opened, record **unknown** and keep the higher severity.

---

## 6. First-response triage

Fail closed. Work this order. Do not optimize for convenience or “keeping the feature on”.

1. **User safety / security / sensitive data** — stop further disclosure. Remove secrets from the working set (chat, ticket, screenshot). Do not paste tokens, session cookies, OTP/TOTP seeds, service-role keys, or raw traveller/document/MRZ/health data into the incident record.
2. **Auth / MFA / AAL / RLS / ownership** — is the session contract still true? Is admin still AAL2-gated? Are trip/traveller rows still owner-scoped? If unknown, treat as SEV-0/1.
3. **Data integrity / destructive-write risk** — freeze further writes on the affected path. Do not “repair” with an unreviewed Production UPDATE/DELETE.
4. **Paid / cost / quota** — if a paid path may be live, use the **existing** model kill switch and stop additional calls. Do not raise ceilings.
5. **Provider / official truth** — prefer unavailable / `unknown` over a guessed `not_required`. Do not enable a factory or flag to “see if it helps”.
6. **Trip / traveller availability and reliability** — can users open and edit existing trips? Empty vs error must stay distinct (`lib/api/datenbank-lesen.ts` / `lib/admin/ladezustand.ts`).
7. **Lower-severity UX** — only after the above are stable or explicitly out of scope.

Traveller-context rule: if the incident touches citizenships, documents, residence, route or readiness, evaluate per traveller and per credential option. Do not collapse to one passport. Do not invent visa/transit/health/carrier rules. Preserve `unknown`.

---

## 7. Containment

### 7.1 Allowed containment (existing controls only)

Prefer the smallest disablement that stops harm:

1. **Leave a fail-closed path off.** Production provider domains are already off via `VERCEL_ENV=production`. Do not turn them on to debug.
2. **Disable the model kill switch** in the **affected** Vercel environment: unset or set `JETNITY_MODELL_AKTIV` to anything other than `true`/`1`. This is the documented containment for paid-model spend. An authorized human applies it in the host. This slice does not do it.
3. **Disable a domain flag** in Preview/Development (`JETNITY_FLIGHT_AKTIV`, `JETNITY_HOTEL_AKTIV`, `JETNITY_ACTIVITY_AKTIV`, `JETNITY_MOBILITY_AKTIV`, `JETNITY_RENTAL_CAR_AKTIV`, `JETNITY_READINESS_AKTIV`) when that environment is the incident surface.
4. **Keep public indexing deny.** If `NEXT_PUBLIC_ALLOW_INDEXING` is not exactly `true` on canonical Production, do not set it. If it was set in error, turning it **off** is containment; turning it **on** is a Public-Launch / indexing Product-Owner gate.
5. **Keep UI-audit off in Production.** `uiAuditSeiteAktiv()` already forces this.
6. **Stop the bleeding in process, not in data.** Pause further deploys to the affected environment until the exact SHA and env diff are known.
7. **Preserve evidence.** Do not wipe Vercel/Supabase logs, do not rotate a key before recording that it leaked (rotation itself may be required — see §8.1 — but capture the fact first).

### 7.2 Forbidden containment

- Invent a new env flag, webhook, alert or kill switch “for this incident”.
- Treat `blocked_ips` as a WAF.
- Treat break-glass as restored admin access.
- “Fix” Production with an unreviewed destructive SQL, Auth factor delete, RLS edit or secret rewrite.
- Enable S6A persistent cost-guard, a provider factory, or `JETNITY_MODELL_AKTIV` in Production as containment.
- Contact users, providers or vendors from this process document.
- Bundle a support process, error-boundary or monitoring-vendor decision into the containment.

### 7.3 Special Product-Owner gates remain special gates

Do not perform, and do not ask an agent to perform, the following as “incident stabilization” without a **current, explicit** Product-Owner approval for that action:

- Production migration, restore, PITR (if later purchased), or other destructive / hard-to-reverse Production data change;
- large Production RLS / ownership / identity contract change;
- fundamental Auth / Session / MFA / AAL change, including live Production factor deletion (see the admin MFA runbook: writing it ≠ executing it);
- storing or exporting passport / MRZ / biometric / health data;
- real provider contracts, Production secrets, paid calls, or live provider activation;
- payments / money movement;
- new recurring cost, including any error-tracking / alerting vendor;
- public launch, indexing enablement, domain cutover, or store launch.

Technical-Lead merge autonomy does **not** lift these gates. This process document does not lift them either.

Disabling an already-documented kill switch on a Preview/Development environment to stop spend is containment, not activation. **Enabling** a Production paid/provider/indexing path is activation and stays gated.

---

## 8. Response branches

Every branch starts with §6 triage, then the specifics below. Record known vs unknown. STOP if the next step crosses §7.3 without approval.

### 8.1 Security / privacy

1. Classify: secret leak, session leak, unauthorized access, unexpected personal-data disclosure, or unknown.
2. Contain disclosure first (revoke the leaked credential **after** recording that it leaked; do not paste the secret into the record).
3. Identify environment and exact SHA. Assume blast radius is larger than the first screenshot.
4. Do not use `security_events` emptiness as exoneration.
5. Do not invent legal breach-notification text or a statutory deadline. Product Owner decides any externally binding notice. Technical Lead may prepare **internal** facts only: what class of data, which environment, time window, whether travellers/documents were involved (yes/no/unknown — no raw values).
6. If Auth/AAL/RLS is involved, continue in §8.2. If data may already be wrong or gone, continue in §8.3.

### 8.2 Auth / MFA / AAL / RLS

1. Confirm which Auth project (Development vs Production). Wrong project is a STOP.
2. Confirm whether the symptom is application-user MFA or Supabase **platform** MFA. Platform MFA is out of scope for the admin MFA runbook and for Jetnity app controls.
3. Admin AAL2 remains mandatory (`lib/auth/admin-guard.ts`, `lib/auth/admin-aal.ts`, `aktuelles_admin_aal2()` where applied). Do not weaken it to “restore access”.
4. Single admin TOTP loss, no compromise: use `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md`. Live `deleteFactor` remains a later Product-Owner Auth gate.
5. Suspected compromise: STOP that recovery path. Record evidence. Do not delete factors as a shortcut. Do not add backup codes / phone / WebAuthn “while we are here”.
6. RLS/ownership doubt: prefer read-only verification. No policy rewrite in the incident unless a separately gated slice exists.
7. Finding 3.3 (Production `aktuelles_admin_aal2()` apply state) remains a residual **unknown** unless independently re-verified in that environment. Do not declare data-plane recovery when that is unknown.

### 8.3 Data loss / integrity

1. Stop further writes on the affected path.
2. Distinguish empty, denied and error. Do not “heal” an error by showing an empty list.
3. Identify table/RPC/migration version. Compare to the versioned files on the exact SHA.
4. Forward-fix vs restore: default to a reviewed, reversible forward-fix on a branch. Restore / replay / `schema_migrations` mutation / Development reset is a Product-Owner Production-data gate. Prior repair docs required a confirmed backup window and Before-Image; PITR is not activated.
5. Guest localStorage is not Production truth. Do not overwrite account rows from guest state to “recover”.
6. Traveller/document rows: no silent singular-citizenship repair. No invented official results.

### 8.4 Cost / quota / model

1. Check `modellZustand()` inputs for the **affected** environment: is `JETNITY_MODELL_AKTIV` actually on? If unknown, treat as possibly on.
2. Contain: turn the model kill switch off in that environment. Do not raise `MODELL_GRENZEN` or the SQL constants.
3. Read `model_usage` with the existing admin path or an authorized SQL **read**. A failed read is not zero. The admin window in `lib/admin/provider-ops-board/runtime.ts` (`USAGE_LIMIT = 200`) can truncate a busy period.
4. Database quota (`jeKennungStunde` 4, `jeKennungTag` 8, `gaesteTag` 24, `gesamtTag` 38, `kostenTagMikroUsd` 3_000_000) may already be failing closed. That is containment succeeding, not proof the kill switch is off.
5. Provider in-memory guards do **not** bound global spend. If a commercial provider were ever live, S6A absence is a SEV-0 cost risk. Today Production provider domains are hard-off; do not activate them to test the guard.
6. Production model activation and the Assistant Production migration remain closed special gates. Do not “temporarily” enable them.

### 8.5 Provider / commercial / official truth

1. Confirm whether any provider factory is non-null in the running SHA. Current truth: hotel/activity/mobility/rental/requirements/safety/seasonal factories return `null`. Flight may construct a **test** Duffel adapter only outside Production when `JETNITY_FLIGHT_AKTIV` and a test token exist. Live tokens are treated as missing access.
2. Contain by leaving flags off and Production hard-off. Do not contact Duffel or any vendor.
3. Official Truth must stay fail-closed: timeout, stale, untrusted or missing evidence → `unknown`, never `not_required`.
4. Commercial provenance writer and `booking_url` remain closed. Do not mint booking links during an incident.
5. A provider outage on a null factory is not an incident; it is the designed unavailable state.

### 8.6 Deployment / runtime outage

1. Identify environment (Production / Preview / Development) and exact deployment SHA from Vercel. Do not guess from a branch name.
2. Compare to GitHub SHA, merge-base and CI of that SHA. A READY deploy of an unreviewed SHA is still a regression candidate.
3. Rollback vs forward-fix:
   - **Rollback** (Vercel redeploy / instant rollback to a previous READY SHA) is allowed as a Technical-Lead operational option when the previous SHA is known, previously reviewed, and the rollback does **not** require Auth/RLS/schema/secret/provider activation changes.
   - **Forward-fix** is a normal gated slice on a branch: Draft PR, exact-head review, no Ready/merge by agents.
   - If rollback would undo a special-gate Production migration or secret, STOP and ask the Product Owner.
4. This slice does not perform a rollback. A single green CI or READY badge is not recovery (see §9).
5. Configuration drift (Dashboard Auth vs `supabase/config.toml`) is detected only when someone runs `auth:pruefen` or equivalent. If that job did not run, Auth config is unknown.

---

## 9. Recovery

Recovery is a claim about the **same** environment and class that failed. It is not a vibe.

Minimum verification, as applicable to the branch:

1. Exact environment + exact SHA + exact Vercel deployment id.
2. The failing symptom is gone on a **repeat** of the original probe, or the path is honestly fail-closed and users are not shown a false success.
3. CI of the recovered SHA is known (verify job, and auth-config job when secrets apply).
4. If Auth/AAL/RLS was in scope: AAL2 still required; ownership still holds; empty vs denied vs error still distinct. Use an existing **read** path. No probe write.
5. If data was in scope: row counts / representative reads match the expected post-fix contract. No silent backfill from deprecated columns.
6. If cost was in scope: `JETNITY_MODELL_AKTIV` is off (or the intended gated state), and a fresh `model_usage` read is recorded as ok/empty/unavailable honestly.
7. If provider/official truth was in scope: no invented `not_required`; factories still match the SHA contract.
8. Residual risks and follow-up issues are written down.

Do **not** declare recovery from only one of: a single READY badge, a single green CI job, a single `airports` ping, or “no new user emails”.

Rollback vs forward-fix is chosen from evidence (§8.6), not from speed. Prefer reviewed reversible action.

---

## 10. Communication

| Audience | What this process allows today |
| --- | --- |
| Internal record | Mandatory. Use §11. Persist in the repository or the incident issue. No secrets. |
| Support handoff | If users are or may be affected, write a short internal handoff: environment, user-visible symptom, what to say (`unknown` if unknown), `Fehler-ID` if quoted, and that finding 4.1 still has no owned mailbox process. Do **not** implement a support process here. |
| Users | There is no status page and no in-product incident banner. Product Owner decides any user-facing statement. Do not improvise legal or marketing reassurance. |
| Public / press / authorities | Product Owner only. This runbook contains no breach-notification language and no deadlines. |
| Providers / vendors | Do not contact them from this slice. Provider contact remains deferred unless a current Product-Owner gate says otherwise. |

Honesty rule: if detection is manual and delayed, say that. Do not claim “we were alerted instantly”.

---

## 11. Evidence and timeline

Create or update one incident record (GitHub issue or slice STATUS) with:

- UTC timestamps for detection, containment, recovery, closure;
- affected environment (Production / Preview / Development / CI / unknown);
- exact git SHA and Vercel deployment id when known;
- first detection source (from the §2.1 table) and whether it was automated or manual;
- symptoms in operator language, no raw payloads;
- known / unknown list;
- actions, actor, and authority (Technical Lead / Product Owner / dispatched agent / host operator);
- special-gate approvals, or “not requested / not granted”;
- validation evidence (what was re-read, not what was assumed);
- closure decision and residual actions.

Never paste:

- secrets, tokens, service-role keys, connection strings;
- session cookies, OTP/TOTP seeds, recovery codes (none exist in-product today);
- raw traveller names-plus-documents, MRZ, scan images, health data;
- full user email lists or mailbox contents;
- provider live responses that contain personal or booking data.

Placeholders such as `<PRODUCTION_SERVICE_ROLE>` are acceptable. Redact first, store second.

---

## 12. Closure and post-incident review

An incident may close only when **all** of the following are true:

1. Containment has ended safely or is an intentional remaining fail-closed state.
2. Recovery was independently verified for the affected domain (§9), or the Technical Lead records that recovery is withheld and the incident stays open.
3. Known impact is written: users, data, cost, security — including “unknown”.
4. Residual risks and open actions are written.
5. Follow-up work is a **new** bounded issue/slice (tooling, support process, error boundary, S6A, backup rehearsal, and so on). It is not silently bundled into this process document.

Post-incident review is a short written note:

- what the first signal actually was;
- what the process could and could not see;
- whether a special gate was touched;
- whether finding 5.5 tooling would have changed the outcome (usually: yes for detection delay; no for inventing a vendor here).

Agent self-review of a later fix is not Technical-Lead PASS. Changed heads invalidate earlier exact-head gates.

---

## 13. Remaining launch blocker

This document satisfies the **process / ownership / escalation** part of finding 5.5 and release-gate §H (“Incident-Prozess mit Verantwortlichkeit”).

It does **not** satisfy, and must not be cited as satisfying:

- release-gate §G (visible technical errors, provider health, cost/quota alerts, security-event visibility, alert ownership, partial-failure detection) as an automated capability;
- the **tooling half** of finding 5.5: hosted error tracking, alerting, paging, or log aggregation;
- finding 4.1 support process;
- finding 4.2 account error boundary;
- finding 4.5 user-facing incident communication;
- finding 5.2 security-event ingestion;
- finding 5.4 system-health probes beyond the current `airports` ping;
- finding 5.6 persistent provider cost guard;
- a rehearsed Supabase restore or Vercel Production rollback.

Selecting Sentry, Datadog, Axiom, Logtail, PagerDuty or any equivalent remains a **Product-Owner-gated** new-provider / data-processor / possible-cost decision. Until that later slice exists, Public V1 Launch remains blocked on the tooling half of 5.5 by the repository’s own release gate.

---

## 14. STOP conditions and forbidden shortcuts

STOP and escalate to Technical Lead (and Product Owner if a special gate is in play) when:

- environment, project ref, or SHA is uncertain;
- the next step needs Production mutation, restore, Auth factor deletion, RLS change, or a new secret;
- compromise is suspected;
- someone asks to enable a provider, model, or indexing “just to recover”;
- someone asks to invent legal notification text;
- someone asks to install a monitoring vendor inside the incident;
- evidence would require dumping secrets or raw sensitive traveller data;
- the only “fix” is an unreviewed destructive write.

Forbidden shortcuts:

- marking Ready or merging from this runbook;
- starting the support, error-boundary or tooling follow-up inside this slice;
- claiming 24/7 coverage;
- treating READY / green CI / empty `security_events` / empty `model_usage` as full recovery;
- using stale audit line numbers instead of current symbols.

---

## 15. Traveller-context check

This is an operations process, not a traveller-data feature. It does not collect credentials.

If an incident **involves** trip or traveller data, the coordinator still follows `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`: no default/primary passport inference, per-option evaluation, Route Truth remains reusable, legal/regulatory facts stay official or `unknown`, and evidence stays minimized.
