# V1 Flight Multi-Provider Orchestration – Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical agent: **`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/413  
Issue: https://github.com/Jetnity/jetnity/issues/412  
Binding: `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`

Cursor does **not** mark Ready, merge, or start a follow-up slice.

> Ein Git-Commit kann seinen eigenen SHA nicht im Tree tragen. The exact final SHA is the live PR tip after the last push of this slice.

---

## Zuerst lesen

1. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`
2. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_SELF_REVIEW_2026-09-01.md`
3. ADR-0208 in `DECISIONS.md`
4. `lib/flights/suche.ts`
5. `lib/flights/provider-sammlung.ts`
6. `app/api/flights/search/route.ts`

## What a new chat must know

Same logical agent, Generation 1, same session. Do not start a new agent. SINGLE_AGENT.

Live baseline before coding: `origin/main` = `7654d7e7f07d39e55fc907690137e833070637ea`. No drift.

The Flight runtime now accepts 0..N `FlugProvider` instances. Each provider keeps its own `FlugProviderTreffer`. Only normalized `FlugOption[]` are ranked globally. There is no composite Treffer and no fabricated shared `retrievedAt`.

This is **not** a provider selection. Duffel remains the only constructible adapter. No KAYAK/Wego/Skyscanner placeholder was added.

## Transport

| Item | Value |
| --- | --- |
| Canonical baseline | `main@7654d7e7f07d39e55fc907690137e833070637ea` |
| Logical agent | `Jetnity flight multi-provider orchestration 1` |
| Generation | 1 |
| Session | `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8` |
| Draft | stays Draft |

## Changed files

| File | Role |
| --- | --- |
| `lib/flights/suche.ts` | 0..N orchestration, failure isolation, global rank+cap |
| `lib/flights/suche.test.ts` | one-provider compatibility + multi-provider contracts |
| `lib/flights/provider-sammlung.ts` | smallest 0..N collection/runtime factory |
| `lib/flights/provider-sammlung.test.ts` | collection + route wiring without a new live provider |
| `app/api/flights/search/route.ts` | uses collection, not a single `duffelProviderAus()` |
| `lib/flights/domain.ts` | coverage copy truthful for one or many sources |
| `DECISIONS.md` | ADR-0208 |
| `ARCHITECTURE.md` / `docs/FLUEGE.md` / `ROADMAP.md` | current architecture/status |
| `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` | continuity |
| this handoff / self-review | Generation-1 evidence |

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

`lib/flights/duffel/` is unchanged except as an already-constructible candidate inside the collection factory.

## Residual risks

1. `flugZustand` still treats a Duffel test token as “access present”. A later second constructible adapter without a Duffel token would still look like `ohne-zugang` unless that kill-switch/access check is generalized. Out of this slice.
2. Labels (`jetnity` / `cheapest` / `fastest`) are computed on the full ranked set, then the list is capped. A labelled option can fall outside the visible 20. Ranking order itself remains global and deterministic.
3. No real second provider exists in this repository. Multi-provider tests use in-memory stubs only.
4. Exact-head CI/Vercel must be re-verified on the final pushed SHA. Older Preview evidence does not gate a later head.

## Next

Independent Technical-Lead Exact-Head Review of the live PR tip. No follow-up slice. No provider contact or application.
