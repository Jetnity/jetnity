# Destination Essentials 1 – Adversarial Self-Review

Stand: 2. September 2026  
Reconciled onto `origin/main@ed41dd17b4b456899d9e4ae11694efe3b10739a9`  
Local-gate head: `7f49b8dd1b885c736f1be79f71cd2a06bd3c5522`  
Agent self-review is **not** Technical-Lead PASS.

## Scope fidelity

In scope and kept after reconcile:

- Destination Essentials presentation in the existing Trip Workspace overview
- Official join by `destinationCountryCode` only, transit excluded
- Safety/Seasonal join by explicit `kind: 'stage'` refs
- option-/traveller-dependent Official compact state
- canonical `officialCredentialLabel`
- neutral Safety/Seasonal source labels unless `official_*`
- Official href dedupe with action precedence
- ADR-0209 (not ADR-0207; that number is Flight Multi-Leg on current main)

Out of scope and not introduced:

- DB/Supabase/RLS/Auth
- provider/secret/live/paid call or new external API
- Production S6 / Commercial Provenance writer
- World Map / visited truth
- TW-8 / TW-9
- service worker / offline / push
- indexing / domain cutover
- hard-coded destination facts
- Guest/Account Official/Safety/Seasonal runtime wiring
- Flight 0..N orchestration or multi-leg contract changes

## Truth attacks

| Attack | Result |
| --- | --- |
| Overwrite current-main Flight ADR-0207/0208 with stale Destination Essentials ADR-0207 | Rejected. Destination Essentials is ADR-0209. |
| Infer country from stage name | Rejected. |
| Attach transit Official as destination truth | Rejected. |
| Collapse CH `required` + RS `not_required` to destination `required` | Rejected. `option_abhaengig`. |
| Collapse two travellers with differing current outcomes | Rejected. `reisende_abhaengig`. |
| Treat unknown/unavailable/stale as `not_required` | Rejected. |
| Label Safety `unknown` or Seasonal `scientific_climatology` as official | Rejected. |
| Show the same Official href twice as action and source | Rejected. Action wins. |
| Match Safety/Seasonal by label | Rejected. |
| Auto-mount commercial search | Rejected. |
| Compensate missing Guest/Account evaluations | Rejected. Honest empty state. |
| Regress Flight multi-leg / 0..N orchestration | Rejected. Those files match current main. |

## Residual observations, not blockers

1. Two stages in the same country share Official destination-country truth. Safety/Seasonal remain stage-isolated.
2. Guest/Account still do not inject evaluations. Live empty copy is correct until those domains are separately gated.
3. Preview HTML remains Vercel-SSO protected. Exact-head Preview must be read for the current branch tip.
4. Old CI/Preview on `00183a37` is historical only.

## Recommendation

Technical Lead should exact-head review the reconciled Draft PR #394.  
**Do not Ready. Do not merge from this agent.**
