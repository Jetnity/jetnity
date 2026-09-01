# V1 Flight Multi-Provider Orchestration – Self-Review

Stand: 1. September 2026  
Status: **CURSOR SELF-REVIEW / GENERATION 1 / CR-1 FIX / NOT AN INDEPENDENT TECHNICAL-LEAD REVIEW**  
Role: Cursor implementation agent under ChatGPT Technical Lead  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Issue: #412  
Draft-PR: #413  
Rejected head: `14149167a85cede0b860d2d5dee6ec1f963231f0`  
Binding review: **CHANGES REQUIRED `5080976712`**  
Binding: `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`

This is not a Technical-Lead PASS and does not authorize Ready or merge.

## Call-site evidence

| Surface | Finding |
| --- | --- |
| `lib/flights/provider.ts` `FlugProvider` | Unchanged adapter seam. No third abstraction. |
| `lib/flights/suche.ts` `SuchePorts.providers` | `readonly FlugProvider[]` instead of exactly one provider. |
| `lib/flights/suche.ts` | Calls providers concurrently via isolated promises; never builds a composite `FlugProviderTreffer`. |
| Ranking | `optionenBewerten(zusammen.options, geprueft.data)` then `slice(0, FLUG_SUCHE_GRENZEN.angebote)`. |
| `lib/flights/provider-sammlung.ts` | Collection factory. Duplicate IDs dropped entirely. No default/primary. |
| `app/api/flights/search/route.ts` | `aktuelleFlugProviderSammlung()`, not `duffelProviderAus()`. |
| `lib/flights/zustand.ts` | Production + `JETNITY_FLIGHT_AKTIV` only. No Duffel token / `istDuffelTestToken`. |
| `lib/flights/duffel/factory.ts` | Token validation remains vendor-local. |
| ProviderOps | Per-provider events after invocation; invalid/rate-limit/no-provider use `providerId: null`. |
| Client-Sicht | Still strips score/raw/secrets. Retrieval/timezone evidence is not part of `FlugOption`. |

## CR-1 correction

Rejected defect: `14149167` kept `flugZustand().zugangVorhanden` tied to `istDuffelTestToken(DUFFEL_ACCESS_TOKEN)` and documented that as residual/out-of-scope. That blocked a future non-Duffel collection behind a missing Duffel credential.

Correction:

1. Global Flight state is Production-hard-off plus explicit `JETNITY_FLIGHT_AKTIV`.
2. No vendor credential is read by `flugZustand`.
3. Duffel test-token validation stays in `duffelProviderAus()`.
4. Zero constructible providers remain the orchestration unavailable/no-access outcome.
5. Regression: non-Duffel stub + `JETNITY_FLIGHT_AKTIV=true` + no Duffel token is structurally `aktiv` and can search; Production stays hard-off; empty collection stays unavailable.

This is implemented, not residual.

## What was implemented

1. Validate the Jetnity search once; apply the user rate-limit once.
2. Accept zero, one or many providers. Zero → controlled `unavailable`.
3. Pass the same validated `FlugSuchanfrage` to every provider.
4. Keep provider retrieval/evidence/failure locally attributable.
5. Combine only `FlugOption[]` for one global ranking. No provider/provision priority.
6. Do not infer a primary provider from array order. Do not rewrite provenance.
7. Do not cross-provider-deduplicate equivalent-looking itineraries.
8. Fail-closed on provider-identity mismatch and option-ID collision.
9. Isolate provider exceptions; usable options from another source survive as `partial`.
10. One-provider timeout/invalid/success/empty semantics remain the previous controlled messages.
11. Mixed multi-provider failure classes use a neutral aggregate error, not a fake single cause.
12. Coverage copy no longer claims “our first adapter” or complete market coverage.
13. Global Flight availability is not semantically tied to one vendor credential.

## Invariants checked

- One-provider success, timeout and invalid stay controlled and message-compatible.
- Two successful providers keep both `provider` / `externalRef` values and are ranked together.
- Global cap is 20 after global ranking; cheaper options from a second source survive the cap.
- Success + timeout/exception → `partial` + retained good options.
- Internal `partial` + success → aggregate `partial`.
- All successful/empty → `empty`.
- Same failure class → that class with a deterministic class message.
- Different failure classes → `error` + neutral aggregate message.
- Browser JSON contains no `retrievedAt`, timezone/instant evidence or secrets.
- Collection wiring proves 0..N without adding a live provider.
- Non-Duffel stub is structurally active without a Duffel token.
- Production remains hard-off with stub and without token.
- Zero providers remain unavailable.

## Non-scope proof

Unchanged by this CR-1 fix:

- no KAYAK/Wego/Skyscanner adapter, placeholder, application, terms or contact;
- no API key, secret, network, sandbox, paid or live call;
- no Duffel Production promotion;
- no Production S6, Commercial Provenance writer/persistence, Supabase/DB/Auth;
- no TW-8/TW-9, Destination Essentials / #394;
- no public launch, indexing, payment or native-app change;
- shared `providerOpsZustand` contract unchanged.

Gates on rejected head `14149167` are invalid.

## Residual / next

Independent Technical-Lead Exact-Head Review of the new head. Cursor stops. No follow-up slice.

Known leftovers, not hidden and not the CR-1 defect:

- labels are assigned before the global cap;
- no real second provider exists in-repo.
