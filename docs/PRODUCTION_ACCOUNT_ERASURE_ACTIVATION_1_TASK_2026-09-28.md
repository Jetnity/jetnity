# Jetnity – Production Account Erasure Activation 1 – Binding Task

Stand: 28 September 2026  
Issue: #592  
Base: `main@a2645cfa622e272ee224b77d7c6478e84931fd84`  
Branch: `feat/production-account-erasure-activation-1`

## Authority

Product Owner explicitly approved the bounded Production activation of the already accepted V1 account-erasure implementation.

Development implementation remains closed:
- PR #590 merged;
- accepted head `8d1755e926756776bd6f62e0e042bfb3169844e3`;
- disposable Development proof 11/11 PASS;
- Development Function `account-delete-v1` ACTIVE v2 with `verify_jwt=true`;
- Development graph-cascade migration applied.

Current Production truth at task creation (historical task-creation state, not the live migration state):
- project `qscbgcdmivbbnzrcyegn`;
- 0 Edge Functions;
- graph-cascade migration not yet applied;
- UI/environment contract still hard-blocks Production;
- no real Production user deletion has occurred;
- public indexing remains disabled.

## Logical agent

Cursor-Agent: **Jetnity production account erasure activation 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast**  
No Auto. If unavailable, STOP/report.

## Objective

Prepare the smallest repository change that makes the already accepted account-erasure path valid for the exact Production Supabase project after Technical-Lead backend activation.

The shared environment contract currently blocks Production in `loeschUmgebungErlaubt()`. Because the Edge Function and account settings UI both depend on that same function, Production deployment would otherwise remain fail-closed as `umgebung_gesperrt`.

Change only the reviewed environment contract and the tests/docs required to make Production an explicitly allowed HTTPS Supabase environment.

## Required runtime behavior

`loeschUmgebungErlaubt()` must:

- allow exact Production host `qscbgcdmivbbnzrcyegn.supabase.co` only over HTTPS;
- keep exact Development host `yfvbxvijcorffwxbxahl.supabase.co` allowed only over HTTPS;
- keep reviewed local HTTP hosts allowed;
- reject unknown hosted Supabase projects;
- reject arbitrary external hosts;
- reject Production/Development over HTTP;
- preserve fail-closed malformed URL behavior.

Consequences must remain intentional and tested:

- `kontoloeschungFunktionsUrl()` returns the Production Function URL only for exact Production HTTPS;
- `/account/settings` exposes the existing `KontoLoeschen` component in Production once the merged app points at the exact Production Supabase project;
- the client component no longer self-hides on exact Production HTTPS;
- the Edge Function orchestration no longer returns `umgebung_gesperrt` solely because it is running on the exact Production project.

Do not add a second feature flag unless independent review proves it is necessary. Reuse the existing single environment contract.

## Security invariants — MUST NOT CHANGE

Do not weaken or redesign:

- typed confirmation `KONTO LÖSCHEN`;
- fresh password reauthentication;
- MFA/AAL2/TOTP step-up semantics;
- JWT-derived target identity;
- no arbitrary browser-provided `user_id`;
- Storage ownership read restricted to exact verified user;
- Storage deletion only via Storage API;
- linked `security_events` deletion only for exact user;
- hard Auth deletion only after cleanup;
- generic result classes/logs;
- no secret/token/email/path logging;
- OAuth-only accounts remain unsupported/fail-closed;
- no legal-compliance claims;
- no grace period/restore promise.

## Production boundary

Cursor may NOT:

- apply any Production migration;
- deploy any Supabase Edge Function;
- create/read/change Production secrets;
- create/delete Production users;
- run the Production deletion smoke;
- change Production Auth/MFA/OAuth settings;
- mutate Vercel Production environment variables;
- enable indexing/public launch;
- Ready or merge.

Technical Lead alone performs Production migration/function deployment and Production smoke after exact-head PASS.

## Migration boundary

The existing repository migration:
`supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql`

is already accepted from Development. Do not modify it unless a newly discovered defect makes the existing SQL unsafe; if so STOP and report instead of silently changing Production semantics.

## Tests

Add/adjust focused tests to prove at minimum:

- exact Production HTTPS => allowed;
- exact Development HTTPS => allowed;
- Production HTTP => denied;
- Development HTTP => denied;
- unknown `*.supabase.co` => denied;
- arbitrary HTTPS host => denied;
- local reviewed HTTP hosts => allowed;
- Production Function URL is exact and non-null;
- Development Function URL remains exact;
- no user_id enters request body;
- existing MFA/reauth/security tests remain green.

Then run full repository gates:
- typecheck;
- lint;
- tests;
- hygiene;
- Production build;
- exact-head GitHub CI;
- Vercel Preview.

## Deliverables

Update/create slice-local:
- STATUS;
- HANDOFF;
- SELF_REVIEW.

Include:
- exact head;
- changed files;
- test results;
- proof no Production mutation was done by Cursor;
- explicit STOP for independent Technical-Lead review.

## Governance

- do not mark Ready;
- do not merge;
- do not start a follow-up slice;
- every changed head invalidates prior exact-head gates;
- STOP after implementation/evidence for Technical-Lead review.
