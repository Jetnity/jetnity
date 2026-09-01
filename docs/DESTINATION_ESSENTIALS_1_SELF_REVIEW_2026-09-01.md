# Destination Essentials 1 – Adversarial Self-Review

Stand: 1. September 2026  
Rejected head: `52b9866d74d8d0db1916911e08bfed3168073472`  
Review: `#5077136019`  
Agent self-review is **not** Technical-Lead PASS.

## Scope fidelity

In scope and implemented:

- destination projection from `Trip.stages[]`
- Official join by `destinationCountryCode` only
- Safety/Seasonal join by explicit `kind: 'stage'` refs
- compact overview section, no new tab
- option-/traveller-dependent Official compact state
- canonical credential labels in Official details
- neutral Safety/Seasonal source labels unless `official_*`
- Official href dedupe with action precedence
- PWA gap-analysis row corrected to closed PWA-1 (docs accuracy only)

Out of scope and not introduced:

- DB/Supabase/RLS/Auth
- provider/secret/live/paid call or new external API
- World Map / visited truth
- TW-8 / TW-9
- service worker / offline / push
- indexing / domain cutover
- hard-coded destination facts
- Guest/Account Official/Safety/Seasonal runtime wiring

## Truth attacks

| Attack | Result |
| --- | --- |
| Infer country from stage name `Thailand` | Rejected. `countryCode` stays null, Official does not attach. |
| Attach transit visa for QA to destination IT | Rejected. Transit evals never become destination truth. |
| Treat unknown/unavailable/stale `not_required` as “not required” | Rejected. Compact lage stays uncertain. |
| Collapse CH `required` + RS `not_required` for one traveller into destination `required` | Rejected. Compact lage is `option_abhaengig`. Reversed array order unchanged. |
| Collapse two travellers with differing current outcomes into one universal `required` | Rejected. Compact lage is `reisende_abhaengig`. |
| Hide which passport an Official detail belongs to | Rejected. Details use `officialCredentialLabel`. |
| Relabel `sourceUrl` as application | Rejected. Source stays `source`; only validated `action` is actionable. |
| Label Safety `unknown` or Seasonal `scientific_climatology` as official | Rejected. Neutral `Quelle öffnen`. |
| Show the same Official href twice as action and source | Rejected. Action wins. |
| Match Safety/Seasonal by label `Florenz` / airport | Rejected. Only `affectedRefs.kind === 'stage'` + stage id. |
| Infer visited from past dates | Rejected. No visited field. |
| Auto-mount commercial search | Rejected. `loestSucheAus === false`. |
| Call local Safety/Seasonal engines when evaluations are omitted | Rejected. Omitted lists stay empty evidence. |
| Compensate missing Guest/Account evaluations with fixtures or a new API | Rejected. Honest empty state. |

## Residual observations, not blockers

1. Two stages in the same country share Official destination truth. That is required by `destinationCountryCode` matching. Safety/Seasonal remain stage-isolated.
2. Production Guest/Account Workspace still does not inject Official/Safety/Seasonal evaluations. Live users will typically see the honest empty copy until those domains are separately gated and wired.
3. Same-option mixed requirement types (visa required + insurance not_required) still compact to `required`. That is intra-credential, not an alternative-document collapse.
4. Preview HTML remains Vercel-SSO protected (`x-robots-tag: noindex`). Exact-head Preview must be read for the current branch tip.
5. Gap-analysis PWA row is documentation accuracy only; no PWA/runtime change in this slice.

## Recommendation

Technical Lead should exact-head re-review this Draft PR.  
**Do not Ready. Do not merge from this agent.**
