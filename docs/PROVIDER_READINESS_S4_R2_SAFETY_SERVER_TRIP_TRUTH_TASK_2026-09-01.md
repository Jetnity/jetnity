# Provider Readiness S4-R2 – Safety Server-Owned Trip Truth Task

Stand: 1. September 2026  
Status: **BINDING CURSOR TASK / RUNTIME BOUNDED / NO PROVIDER ACTIVATION / NO DB MUTATION**  
Parent: Issue #365  
Baseline: `main@17ee633ea89567761297c8f07c023953ec98bbf2`

## 1. Objective

Close the concrete residual S4 Safety trust-boundary gap without widening Provider Readiness.

For an account-owned trip, Safety evaluation must derive canonical trip/route/traveller context from the server-side RLS-protected trip load. Browser-supplied citizenship/traveller/party claims must never become Safety truth.

Current evidence:

- `app/api/safety/evaluate/route.ts` accepts browser-supplied trip context;
- `lib/safety/auswerten.ts::tripAusSafetyAnfrage()` reconstructs a synthetic trip and sets `party: []`;
- `lib/trips/daten.ts::reiseLaden()` already loads the full owned trip through authenticated RLS, including `trip_travellers`;
- `lib/trips/abbildung.ts::reiseAus()` maps those rows into `party`.

## 2. Multi-Agent ownership

This is **Agent A / runtime writer** of the parent MULTI_AGENT workstream.

This agent owns only:

- Safety account-trip request/trust-boundary code;
- narrowly required Safety schemas/helpers;
- Safety-specific tests;
- versioned S4-R2 status/self-review/handoff docs.

This agent must NOT edit:

- `lib/readiness/*` except a type-only import if absolutely unavoidable and justified;
- `lib/seasonal/*`;
- shared `lib/provider-ops/*` contracts;
- Supabase migrations/types/RLS/functions;
- `docs/ACTIVE_WORK_STATUS.md`;
- `JETNITY_START_HERE.md`;
- Agent B audit files;
- S6/S7/S8 code.

If the solution requires one of those, STOP and document the dependency instead of silently expanding scope.

## 3. Required behavior

### Account path

A request for Safety evaluation of an account trip must use a canonical trip identifier and load that trip server-side through the existing authenticated/RLS path or an equally strict existing read seam.

Required properties:

1. ownership is enforced by RLS / authenticated server read, never by trusting a client `user_id`;
2. no service-role bypass for trip loading;
3. route/stages/items used for Safety come from the server-loaded trip;
4. `party` comes from the server-loaded trip traveller snapshot/registry relation already represented by `reiseLaden()`;
5. browser-supplied citizenships/documents/party/traveller claims are rejected or ignored and cannot override server truth;
6. unknown/foreign trip does not reveal ownership/existence details and fails closed;
7. database/read failure is not represented as empty trip/safe/OK;
8. current Safety provider factory stays `null` in Production/Preview;
9. no Official/Safety evidence can be submitted by browser and accepted as truth.

### Guest path

Do not break legitimate guest trip Safety route-context evaluation merely to solve the account path.

However:

- guest requests have no server-owned traveller identity/trip traveller truth;
- guest browser citizenship/party claims must not be promoted to traveller-dependent Safety truth;
- traveller-dependent Safety must therefore remain unavailable/unknown/fail-closed unless a separately trusted guest-traveller architecture already exists and is explicitly in scope (do not invent one here).

Choose a clear request contract that distinguishes account-owned canonical-trip evaluation from transient guest context without creating two Safety truth engines.

## 4. Reuse before add

Prefer existing:

- `reiseLaden()` / authenticated RLS trip read;
- `reiseAus()` / mapped party;
- `safetyAuswerten()` / existing Safety engine;
- current provider-neutral failure/status semantics;
- existing body caps, headers and rate limits.

Do not create a parallel account trip loader if the existing one is suitable. If it is not suitable for Route Handlers, prove why and build the smallest equivalent RLS-protected read seam.

## 5. Tests / adversarial acceptance

At minimum prove:

1. account trip uses server-loaded route/stages/items;
2. server-loaded `party` reaches Safety evaluation;
3. client-injected party/citizenship cannot override account trip truth;
4. foreign/unknown trip fails closed without existence oracle;
5. DB/read failure is distinguishable from empty/unavailable;
6. guest path cannot create traveller-dependent Safety claims from browser citizenship data;
7. existing no-provider state stays honest `unavailable`/`unknown`, never safe/green;
8. no service-role trip read introduced;
9. no provider activation or external calls;
10. existing Safety tests remain green.

Use dependency injection/test seams rather than requiring Production DB mutation.

## 6. Hard non-scope

- no real Safety provider;
- no provider activation flag implementation unless strictly needed to preserve current hard-null behavior (otherwise STOP);
- no S6 persistent cost guard;
- no S7/S8;
- no Readiness body-cap work;
- no Entry Requirements provider;
- no Supabase migration/RLS/grant/function change;
- no service-role trip loading;
- no passport/MRZ/scan/biometric/health storage;
- no Auth/MFA/AAL changes;
- no TW-8/TW-9;
- no UI redesign.

## 7. Deliverables

Create/update only versioned S4-R2 docs owned by this agent:

- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_STATUS_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_SELF_REVIEW_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_HANDOFF_2026-09-01.md`

Self-review must list exact changed files, tests, known residuals, and explicitly confirm no Agent B ownership was touched.

## 8. Stop rule

Do not Ready. Do not merge. Do not start S6 or another follow-up.

After implementation/self-review, STOP for independent Technical-Lead exact-head review.
