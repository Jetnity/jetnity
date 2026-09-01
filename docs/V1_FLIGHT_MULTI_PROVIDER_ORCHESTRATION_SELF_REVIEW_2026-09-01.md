# V1 Flight Multi-Provider Orchestration – Self-Review

Stand: 1. September 2026  
Status: **CURSOR SELF-REVIEW / GENERATION 1 / NOT AN INDEPENDENT TECHNICAL-LEAD REVIEW**  
Role: Cursor implementation agent under ChatGPT Technical Lead  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Issue: #412  
Draft-PR: #413  
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
| ProviderOps | Per-provider events after invocation; invalid/rate-limit/no-provider use `providerId: null`. |
| Client-Sicht | Still strips score/raw/secrets. Retrieval/timezone evidence is not part of `FlugOption` and is regression-tested on the serialized search body. The E5 frozen client-sicht source contract is unchanged. |

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

## Non-scope proof

Unchanged by this slice:

- no KAYAK/Wego/Skyscanner adapter, placeholder, application, terms or contact;
- no API key, secret, network, sandbox, paid or live call;
- no Duffel Production promotion;
- no Production S6, Commercial Provenance writer/persistence, Supabase/DB/Auth;
- no TW-8/TW-9, Destination Essentials / #394;
- no public launch, indexing, payment or native-app change.

## Residual / next

Independent Technical-Lead Exact-Head Review of the live PR tip. Cursor stops. No follow-up slice.

Known leftovers, not hidden:

- `flugZustand` remains Duffel-token-shaped;
- labels are assigned before the global cap;
- no real second provider exists in-repo.
