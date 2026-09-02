# V1 Flight Multi-Provider Orchestration – Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/413  
Issue: https://github.com/Jetnity/jetnity/issues/412  
Binding: `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`  
Binding review: **CHANGES REQUIRED CR-2 `5083821864`** on rejected head `0cc4da1b542028502c967b58ae635106a8b8cb6a`

Cursor does **not** mark Ready, merge, or start a follow-up slice.

> Ein Git-Commit kann seinen eigenen SHA nicht im Tree tragen. The exact final SHA is the live PR tip after the last push of this slice. Gates on `0cc4da1b` and `14149167` are invalid.

---

## Zuerst lesen

1. Technical-Lead CHANGES REQUIRED CR-2 `5083821864` on rejected head `0cc4da1b542028502c967b58ae635106a8b8cb6a`
2. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`
3. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_SELF_REVIEW_2026-09-01.md`
4. ADR-0208 in `DECISIONS.md`
5. `lib/flights/zustand.ts`
6. `lib/flights/duffel/zugang.ts`
7. `lib/flights/duffel/factory.ts`
8. `lib/flights/suche.ts`
9. `lib/flights/provider-sammlung.ts`

## What a new chat must know

Same logical agent, Generation 1, same session. Do not start a new agent. SINGLE_AGENT.

Live baseline before coding: `origin/main` = `7654d7e7f07d39e55fc907690137e833070637ea`. No drift.

CR-1 remains accepted: global `flugZustand` is only Production-hard-off plus `JETNITY_FLIGHT_AKTIV`.

CR-2 correction:

1. `FlugUmgebung` / `flugUmgebungAusProzess()` contain and read only `VERCEL_ENV` and `JETNITY_FLIGHT_AKTIV`. Duffel credential read + `istDuffelTestToken` live in `lib/flights/duffel/zugang.ts`. The factory consumes that Duffel-local env. Collection wiring is not a credential registry.
2. Incomplete search with zero usable options stays truthful `partial`, but never says remaining connections are shown below.

This is **not** a provider selection. Duffel remains the only constructible adapter. No KAYAK/Wego/Skyscanner placeholder was added.

## Transport

| Item | Value |
| --- | --- |
| Canonical baseline | `main@7654d7e7f07d39e55fc907690137e833070637ea` |
| Rejected reviewed head | `0cc4da1b542028502c967b58ae635106a8b8cb6a` |
| Binding review | CHANGES REQUIRED CR-2 `5083821864` |
| Previously accepted | CR-1 `5080976712` on `14149167` |
| Logical agent | `Jetnity flight multi-provider orchestration 1` |
| Generation | 1 |
| Session | `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8` |
| Draft | stays Draft |

## Changed files vs rejected head `0cc4da1b`

| File | Role |
| --- | --- |
| `lib/flights/zustand.ts` | global Flight env has no vendor credential field/read |
| `lib/flights/zustand.test.ts` | whole-module source contract: no `DUFFEL_*` / token helper |
| `lib/flights/duffel/zugang.ts` | Duffel-local token type, process read, test-token check |
| `lib/flights/duffel/zugang.test.ts` | factory + source regressions for the credential boundary |
| `lib/flights/duffel/factory.ts` | consumes Duffel-local env, not `FlugUmgebung` |
| `lib/flights/provider-sammlung.ts` | assembles factories; no credential registry |
| `lib/flights/provider-sammlung.test.ts` | injects Duffel env at the factory, not via Flight env |
| `lib/flights/suche.ts` | zero-option partial uses a neutral message |
| `lib/flights/suche.test.ts` | empty-success + failure / empty internal partial |
| `lib/rollout/befund.ts` | Production-off check no longer smuggles a Duffel token |
| `docs/FLUEGE.md` / ADR-0208 | current credential-boundary + message truth |
| this handoff / self-review / active status | CR-2 evidence |

Previous slice files remain: collection factory, route wiring, coverage copy, CR-1 state split.

## CR-2 implemented, not residual

- `FlugUmgebung` has no `DUFFEL_ACCESS_TOKEN`.
- `flugUmgebungAusProzess()` does not read `DUFFEL_ACCESS_TOKEN`.
- `istDuffelTestToken` is Duffel-local.
- `duffelProviderAus(flugEnv, duffelEnv)` keeps DI without a global vendor field.
- A token smuggled onto the Flight env object does not construct Duffel when Duffel env is empty.
- Production hard-off, `JETNITY_FLIGHT_AKTIV`, zero-provider unavailable, and Duffel test-only behaviour remain.
- `MELDUNG_PARTIAL` (“übrigen Verbindungen … unten”) only when usable options survive.
- Empty success + failure, empty provider-internal `partial`, and empty+empty-partial use the neutral incomplete-search message.

## Non-scope proof

No path under this slice adds or contacts:

- KAYAK / Wego / Skyscanner adapters or placeholders;
- provider credentials/secrets beyond existing test injection;
- sandbox/live/paid calls;
- Production S6/HMAC/>0 budget;
- Commercial Provenance writer/persistence;
- Search→Click framework;
- Supabase/DB/RLS/Auth;
- TW-8 / TW-9;
- Destination Essentials #394.

## Residual risks

1. Labels (`jetnity` / `cheapest` / `fastest`) are computed on the full ranked set, then the list is capped. A labelled option can fall outside the visible 20. Ranking order itself remains global and deterministic.
2. No real second provider exists in this repository. Multi-provider tests use in-memory stubs only.
3. Exact-head CI/Vercel must be re-verified on the final pushed SHA. Gates on `0cc4da1b` are invalid.

## Next

Independent Technical-Lead Exact-Head Review of the live PR tip. No follow-up slice. No provider contact or application.
