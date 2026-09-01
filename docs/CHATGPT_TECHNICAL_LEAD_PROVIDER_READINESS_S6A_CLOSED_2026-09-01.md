# ChatGPT Technical Lead – Provider Readiness S6-A CLOSED

Stand: 1. September 2026  
Status: **CLOSED & POST-MERGE VERIFIED / REPOSITORY FOUNDATION ONLY / PRODUCTION APPLY UNAPPLIED / NO PROVIDER ACTIVATION**

## 1. Canonical result

Provider Readiness **S6-A – Persistent Cost Guard Repository Foundation** is closed and post-merge verified.

Integrated PR:

- PR #376 — `Provider Readiness S6-A – persistent cost guard repository foundation`
- exact reviewed head: `99fd2bf7ceb8b9c57cb44a7f0c824bcdbd406fc4`
- Technical-Lead PASS review: `5073315561`
- merge commit: `dfae0f05e6ffa2c8d6e1739bf41a91c31f504199`
- Issue #375: **CLOSED / COMPLETED**

Post-merge gates on exact merge SHA:

- Main CI #1601 / Run `33461631088`: **COMPLETED / SUCCESS**
- Vercel Production `dpl_HtfLjZ6tgsDs7bUdSJfMbtpRLkQV`: **READY** on exact `dfae0f05e6ffa2c8d6e1739bf41a91c31f504199`

## 2. What S6-A delivered

Repository-only migration:

`supabase/migrations/20260901020000_provider_cost_guard_s6a.sql`

It defines the future persistent Provider Cost Guard contract with:

- hard-off runtime gate by default;
- no active/seeded provider cost policies;
- caller/domain/global policy model with window/day limits;
- conservative pre-call reservations;
- global transaction serialization before policy check + insert;
- internal `jetnity_internal.provider_cost_guard_reservieren(jsonb)` function;
- `SECURITY DEFINER` with empty `search_path` and fully qualified DB access;
- EXECUTE withheld from `public`, `anon`, `authenticated` and `service_role`;
- NOLOGIN capability role `jetnity_provider_cost_guard_writer` only;
- no Production login/runtime principal allocation.

Server-only TypeScript foundation:

- `lib/provider-ops/persistent-cost-guard.ts`
- injected persistence port rather than a built-in Supabase/service-role client;
- no env/secret selection in the adapter;
- identifier pseudonymization with HMAC-SHA256 before leaving the process;
- HMAC domain separation so the same caller identifier is not unnecessarily linkable across provider domains;
- DB/port clock remains authoritative;
- malformed response, missing configuration or port failure fails closed;
- persistent `leeren()` is intentionally a no-op;
- server-only adapter is intentionally not exported through the broad provider-neutral `lib/provider-ops/index.ts` barrel.

## 3. Independent review hardening

Before PASS the Technical Lead found and closed four P2 hardening items:

1. identifier HMAC needed domain separation to reduce cross-domain linkability;
2. runtime gate needed allocation coherence, so a future boolean flip alone cannot represent an allocated Production path;
3. SQL contract tests needed to inspect raw SQL for forbidden client-provided timestamps;
4. the server-only adapter had to stay off the broad provider-ops barrel to avoid silently imposing server-only semantics on existing neutral consumers.

Every resulting new head invalidated older gates and the final head was fully re-gated.

## 4. Production truth after merge

Fresh read-only Production Supabase verification on project `qscbgcdmivbbnzrcyegn` after the merge returned:

- `jetnity_internal.provider_cost_guard_runtime_gate`: **ABSENT**
- `jetnity_internal.provider_cost_guard_policy`: **ABSENT**
- `jetnity_internal.provider_cost_guard_reservation`: **ABSENT**
- `jetnity_internal.provider_cost_guard_reservieren(jsonb)`: **ABSENT**
- role `jetnity_provider_cost_guard_writer`: **ABSENT**

Therefore migration `20260901020000_provider_cost_guard_s6a.sql` remains **UNAPPLIED TO PRODUCTION**.

No Production DB/RLS/grant/role/function mutation was performed in S6-A.

## 5. Important distinction

> **S6-A repository foundation CLOSED does not mean the Production Provider Cost Guard is active.**

Still unapplied/unallocated/gated:

- Production migration apply;
- Production runtime/login principal allocation;
- capability-role membership for a Production runtime;
- HMAC secret creation/allocation;
- real provider cost policy / >0 budget configuration;
- runtime transport binding to the persistent reservation function;
- provider activation;
- paid/live provider calls.

All of the relevant items above remain Product-Owner gates.

## 6. Provider Readiness state

Current sequence:

- S4: **CLOSED**
- S6-A repository foundation: **CLOSED & POST-MERGE VERIFIED**
- S6 Production apply/runtime allocation/budget activation: **UNAPPLIED / GATED**
- S7 Observability: **NOT STARTED**
- S8 Cache/License/Operational hooks: **NOT STARTED**
- full Provider Readiness recheck: pending
- real providers: still blocked by readiness completion and separate Product-Owner vendor/contract/secret/live-call gates.

S6-A did not unlock TW-8/TW-9 and did not create Commercial Truth.

## 7. Current stop rule

**NO ACTIVE FOLLOW-UP RUNTIME SLICE.**

Do not automatically start S7 and do not infer that Production S6 should now be applied.

The next work cycle must freshly reconstruct live `main`, open PRs/issues, CI/Vercel and relevant Production truth and then decide the smallest responsible step under the binding V1 order.

Possible future decisions include, but are not pre-authorized by this closure:

- Product-Owner-gated S6 Production apply/runtime principal/secret/budget work; or
- S7 repository work if a fresh dependency recheck proves it can proceed safely while S6 Production remains hard-off.

Any Production apply/principal/secret/live-budget/provider activation still requires explicit Product-Owner approval.

**LIVE-EVIDENCE WINS. S6-A REPOSITORY FOUNDATION CLOSED. PRODUCTION S6 UNAPPLIED. NO PROVIDER UNLOCKED.**
