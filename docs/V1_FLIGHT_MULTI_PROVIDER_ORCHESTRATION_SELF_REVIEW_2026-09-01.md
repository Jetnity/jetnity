# V1 Flight Multi-Provider Orchestration – Self-Review

Stand: 1. September 2026  
Status: **CURSOR SELF-REVIEW / GENERATION 1 / CR-2 FIX / NOT AN INDEPENDENT TECHNICAL-LEAD REVIEW**  
Role: Cursor implementation agent under ChatGPT Technical Lead  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Issue: #412  
Draft-PR: #413  
Rejected head: `0cc4da1b542028502c967b58ae635106a8b8cb6a`  
Binding review: **CHANGES REQUIRED CR-2 `5083821864`**  
Binding: `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`

This is not a Technical-Lead PASS and does not authorize Ready or merge.

## Call-site evidence

| Surface | Finding |
| --- | --- |
| `lib/flights/provider.ts` `FlugProvider` | Unchanged adapter seam. No third abstraction. |
| `lib/flights/suche.ts` `SuchePorts.providers` | `readonly FlugProvider[]` instead of exactly one provider. |
| `lib/flights/suche.ts` | Calls providers concurrently via isolated promises; never builds a composite `FlugProviderTreffer`. |
| Ranking | `optionenBewerten(zusammen.options, geprueft.data)` then `slice(0, FLUG_SUCHE_GRENZEN.angebote)`. |
| `lib/flights/provider-sammlung.ts` | Collection factory. Duplicate IDs dropped entirely. No default/primary. No credential registry. |
| `app/api/flights/search/route.ts` | `aktuelleFlugProviderSammlung()`, not `duffelProviderAus()`. |
| `lib/flights/zustand.ts` | Production + `JETNITY_FLIGHT_AKTIV` only. No Duffel type, read, or helper. |
| `lib/flights/duffel/zugang.ts` | Duffel-local token type, process read, `istDuffelTestToken`. |
| `lib/flights/duffel/factory.ts` | Consumes Duffel-local env. Ignores a token smuggled onto Flight env. |
| ProviderOps | Per-provider events after invocation; invalid/rate-limit/no-provider use `providerId: null`. |
| Client-Sicht | Still strips score/raw/secrets. Retrieval/timezone evidence is not part of `FlugOption`. |
| Partial copy | “übrigen Verbindungen … unten” only when `options.length > 0`. |

## CR-2 correction

Rejected defects on `0cc4da1b`:

1. `FlugUmgebung` still carried `DUFFEL_ACCESS_TOKEN`; `flugUmgebungAusProzess()` still read it; `istDuffelTestToken` still lived in global `zustand.ts`; the factory still consumed that global vendor-shaped env.
2. Empty success + provider failure (and other zero-option `partial` paths) used `MELDUNG_PARTIAL` and claimed remaining connections were shown below.

Correction:

1. Global Flight environment contains/reads only `VERCEL_ENV` and `JETNITY_FLIGHT_AKTIV`.
2. Duffel credential reading and token validation live under `lib/flights/duffel/`.
3. Collection assembly may call `duffelProviderAus(umgebung)` but does not collect or pass vendor secrets.
4. Production hard-off, kill switch, zero-provider unavailable, and Duffel test-only remain.
5. Zero-usable-option incomplete search stays `partial` with a deterministic neutral message.
6. Existing `MELDUNG_PARTIAL` remains only when usable options survive.

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
14. Global Flight environment has no vendor credential field or read.
15. Incomplete search with zero usable options does not claim remaining connections.

## Invariants checked

- One-provider success, timeout and invalid stay controlled and message-compatible.
- Two successful providers keep both `provider` / `externalRef` values and are ranked together.
- Global cap is 20 after global ranking; cheaper options from a second source survive the cap.
- Success + timeout/exception → `partial` + retained good options + “unten” copy.
- Internal `partial` + success → aggregate `partial` + “unten” copy.
- All successful/empty → `empty`.
- Empty success + failure → `partial` + neutral no-usable-connection copy.
- Empty internal `partial` → `partial` + neutral copy, not “unten”.
- Same failure class → that class with a deterministic class message.
- Different failure classes → `error` + neutral aggregate message.
- Browser JSON contains no `retrievedAt`, timezone/instant evidence or secrets.
- Collection wiring proves 0..N without adding a live provider.
- Non-Duffel stub is structurally active without a Duffel token.
- Production remains hard-off with stub and without token.
- Zero providers remain unavailable.
- Global `zustand.ts` source has no `DUFFEL_*` / `ACCESS_TOKEN` / `istDuffelTestToken`.
- A token smuggled onto Flight env does not construct Duffel when Duffel env is empty.

## Non-scope proof

Unchanged by this CR-2 fix:

- no KAYAK/Wego/Skyscanner adapter, placeholder, application, terms or contact;
- no API key, secret, network, sandbox, paid or live call;
- no Duffel Production promotion;
- no Production S6, Commercial Provenance writer/persistence, Supabase/DB/Auth;
- no TW-8/TW-9, Destination Essentials / #394;
- no public launch, indexing, payment or native-app change;
- shared `providerOpsZustand` contract unchanged.

Gates on rejected head `0cc4da1b` are invalid.

## Residual / next

Independent Technical-Lead Exact-Head Review of the new head. Cursor stops. No follow-up slice.

Known leftovers, not hidden and not the CR-2 defects:

- labels are assigned before the global cap;
- no real second provider exists in-repo.
