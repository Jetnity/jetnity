# Destination Essentials 1 – Adversarial Self-Review

Stand: 1. September 2026  
Implementation/gate head: `ad5b10311a00179484dedc69f116ae2fa26b9d4d`  
Agent self-review is **not** Technical-Lead PASS.

## Scope fidelity

In scope and implemented:

- destination projection from `Trip.stages[]`
- Official join by `destinationCountryCode` only
- Safety/Seasonal join by explicit `kind: 'stage'` refs
- compact overview section, no new tab
- deterministic tests for the required truth cases

Out of scope and not introduced:

- DB/Supabase/RLS/Auth
- provider/secret/live/paid call
- World Map / visited truth
- TW-8 / TW-9
- service worker / offline / push
- indexing / domain cutover
- hard-coded destination facts

## Truth attacks

| Attack | Result |
| --- | --- |
| Infer country from stage name `Thailand` | Rejected. `countryCode` stays null, Official does not attach. |
| Attach transit visa for QA to destination IT | Rejected. Transit evals never become destination truth. |
| Treat unknown/unavailable/stale `not_required` as “not required” | Rejected. Compact lage stays uncertain. |
| Relabel `sourceUrl` as application | Rejected. Source stays `source`; only validated `action` is actionable. |
| Match Safety/Seasonal by label `Florenz` / airport | Rejected. Only `affectedRefs.kind === 'stage'` + stage id. |
| Infer visited from past dates | Rejected. No visited field. |
| Auto-mount commercial search | Rejected. `loestSucheAus === false`; UI does not open Flug/Hotel search. |
| Call local Safety/Seasonal engines when evaluations are omitted | Rejected. Omitted lists stay empty evidence. |

## Residual observations, not blockers

1. Two stages in the same country share Official destination truth. That is required by `destinationCountryCode` matching. Safety/Seasonal remain stage-isolated. Reviewers should not read this as a visited-map or per-city Official engine.
2. Production Workspace still has no real Official-provider evaluations. Live users will typically see the honest empty copy until Official evidence is separately gated and wired. That is correct, not a silent “visa free”.
3. Dedicated Safety/Seasonal/Readiness surfaces remain. Transit Official remains visible there, not in Destination Essentials.
4. Preview HTML is Vercel-SSO protected. Exact-head Preview completion is evidenced by Deployment `6199680801` / Vercel `H1BD8fr76uhUafCyfCJ3iuywUm7g` on this SHA. UI behaviour was verified on the local audit harness.

## Recommendation

Technical Lead should exact-head review this Draft PR.  
**Do not Ready. Do not merge from this agent.**
