# V1 Flight Multi-Provider Orchestration – Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/413  
Issue: https://github.com/Jetnity/jetnity/issues/412  
Binding: `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`  
Binding review: **CHANGES REQUIRED `5080976712`** on rejected head `14149167a85cede0b860d2d5dee6ec1f963231f0`

Cursor does **not** mark Ready, merge, or start a follow-up slice.

> Ein Git-Commit kann seinen eigenen SHA nicht im Tree tragen. The exact final SHA is the live PR tip after the last push of this slice. Gates on `14149167` are invalid.

---

## Zuerst lesen

1. Technical-Lead CHANGES REQUIRED `5080976712` on rejected head `14149167a85cede0b860d2d5dee6ec1f963231f0`
2. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`
3. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_SELF_REVIEW_2026-09-01.md`
4. ADR-0208 in `DECISIONS.md`
5. `lib/flights/zustand.ts`
6. `lib/flights/suche.ts`
7. `lib/flights/provider-sammlung.ts`
8. `app/api/flights/search/route.ts`

## What a new chat must know

Same logical agent, Generation 1, same session. Do not start a new agent. SINGLE_AGENT.

Live baseline before coding: `origin/main` = `7654d7e7f07d39e55fc907690137e833070637ea`. No drift.

CR-1 correction: global `flugZustand` is only Production-hard-off plus `JETNITY_FLIGHT_AKTIV`. It no longer reads `DUFFEL_ACCESS_TOKEN` / `istDuffelTestToken`. Duffel token validation stays in `duffelProviderAus()`. Zero constructible providers remain the orchestration `unavailable` / not-eingerichtet outcome.

This is **not** a provider selection. Duffel remains the only constructible adapter. No KAYAK/Wego/Skyscanner placeholder was added.

## Transport

| Item | Value |
| --- | --- |
| Canonical baseline | `main@7654d7e7f07d39e55fc907690137e833070637ea` |
| Rejected reviewed head | `14149167a85cede0b860d2d5dee6ec1f963231f0` |
| Binding review | CHANGES REQUIRED `5080976712` |
| Logical agent | `Jetnity flight multi-provider orchestration 1` |
| Generation | 1 |
| Session | `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8` |
| Draft | stays Draft |

## Changed files vs rejected head `14149167`

| File | Role |
| --- | --- |
| `lib/flights/zustand.ts` | global Flight state = Production + kill switch only |
| `lib/flights/zustand.test.ts` | no Duffel-token coupling; Production/kill-switch remain |
| `lib/flights/duffel/factory.ts` | token check stays vendor-local (comment only) |
| `lib/flights/provider-sammlung.test.ts` | non-Duffel stub aktiv without token; Production/zero-provider closed |
| `docs/FLUEGE.md` / ADR-0208 | current truth |
| this handoff / self-review / active status | CR-1 evidence |

Previous slice files remain: `suche.ts`, collection factory, route wiring, coverage copy, ADR-0208.

## CR-1 implemented, not residual

- Production remains hard-off even with kill switch + stub + token.
- `JETNITY_FLIGHT_AKTIV` remains the explicit fail-closed Flight flag.
- `flugZustand()` does not read any vendor credential.
- `istDuffelTestToken` / `DUFFEL_ACCESS_TOKEN` stay inside the Duffel factory.
- Zero providers → controlled unavailable at `fluegeSuchen`.
- A non-Duffel stub with `JETNITY_FLIGHT_AKTIV=true` and no Duffel token is structurally `aktiv` and can search.

## Non-scope proof

No path under this slice adds or contacts:

- KAYAK / Wego / Skyscanner adapters or placeholders;
- provider credentials/secrets;
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
3. Exact-head CI/Vercel must be re-verified on the final pushed SHA. Gates on `14149167` are invalid.

## Next

Independent Technical-Lead Exact-Head Review of the live PR tip. No follow-up slice. No provider contact or application.
