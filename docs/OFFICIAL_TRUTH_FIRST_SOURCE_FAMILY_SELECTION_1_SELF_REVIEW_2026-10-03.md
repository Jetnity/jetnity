# Official Truth First Deterministic Source-Family Selection 1 — Self-Review

Date: 3 October 2026
Issue: #784
Draft PR: #785
Branch: `docs/official-truth-first-source-family-selection-1`
Baseline: `main@d91be5af020c41b935ea0eb0c90e5ec19b57babe`
Logical agent: **Jetnity Official Truth first deterministic source-family selection 1**, Generation 1
Session: https://cursor.com/agents/bc-54a267e6-4407-4557-83d9-6fbcb8814f25
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows exactly:

- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this audit. It stays unstaged.

The task seed is the only other difference from `origin/main`, and it was not modified in this session.

## R1 and R2

Technical-Lead review of `42c74252cb0fe21f25fca0e5800b98db9bea6fb7` required this correction. I agreed with both findings.

R1. I had recorded the INZ body sizes and had not applied `BODY_MAX`. The live retrieval file sets that constant to `65_536` and fails a larger stream as `response_too_large`. 681,132 and 881,465 are over that ceiling. The research curl is not the production retrieval path. I did not propose a larger ceiling.

R2. I had said `requirement_effect` cannot store the ETA date. The sharper block is the extractor input. It receives `scopeKey` only. That key is `rule-scope:v1:` plus a 64-hex digest. The binding does not pass `travelDate`. An extractor cannot prove the 2 April 2025 boundary from that digest, and it must not reverse the digest. I did not add a decoded scope to the extractor context.

`NO_SOURCE_FAMILY_PROVEN_YET` now means no family is proven compatible with the current fact and retrieval contract. The government pages are not called unreliable.

## What I decided

| Area | Decision |
| --- | --- |
| Selection | `NO_SOURCE_FAMILY_PROVEN_YET`. No family is compatible with the current fact and retrieval contract. No family id, extractor id, version, source id, allowlist, schema family, or fact shape. |
| New Zealand visa fact | Switzerland is positively listed. The same current page also grants a visitor visa on arrival and requires an NZeTA. That does not prove `{ effect: 'not_required', visaMode: 'visa_exempt' }`. The waiver page is 681,132 bytes and the NZeTA page is 881,465 bytes. Both are over `BODY_MAX`. |
| NZeTA | Left as `electronic_travel_authorization`. Not stored as a visa mode. |
| GOV.UK | ETA membership is positive. Content API JSON carries HTML, not nationality fields. The date group is not a separate node. The extractor `scopeKey` is not a travel date, so the 2 April 2025 boundary cannot be proved. Visit prose was not converted into a visa exemption. |
| Singapore | The visa-required list is a positive rule for listed issuers. Switzerland is absent. Absence was not read as `not_required`. |
| CH-01..CH-10 | Remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No CH-11. No import. |
| Registry | Live production registry stays `Object.freeze([])`. This audit does not register a row. |

## Claims I refused to upgrade

- I did not treat "visa waiver" plus "without a visa" as `visa_exempt` while the same page says a visitor visa is given on arrival.
- I did not emit `not_required` with `visa_on_arrival`. The live contradiction check rejects that pair.
- I did not drop the "less than 3 months" qualifier and still emit a visa effect.
- I did not treat the archived ops manual as the current rule, and I did not compose it with the public page.
- I did not follow the NZeTA page's canonical link as if it were the NZeTA rule. That link is the visas index.
- I did not infer citizenship `CH` from a passport-country list item, or `ordinary_passport` from a bare country name.
- I did not treat the GOV.UK Content API media type as deterministic structure.
- I did not derive a visa exemption from the ETA National List or from the visit-guidance sentence.
- I did not treat a missing Swiss link on the ICA page as `not_required`.
- I did not call the session body hashes Evidence fingerprints or Official Truth.
- I did not query Production or Development. The zero-row note in comment `5935581800` stays historical.
- I did not certify `npm test`, typecheck, lint, or the production build. Runtime bytes are the baseline.
- I did not start an extractor, F8, a route, a store write, or a follow-up slice.

## Validation

First delivery, before `42c74252cb0fe21f25fca0e5800b98db9bea6fb7`:

- `git fetch origin main` → `d91be5af020c41b935ea0eb0c90e5ec19b57babe`
- `git rev-list --left-right --count origin/main...HEAD` → `0 1` (the task seed)
- `git diff --check` on the three documents → pass
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

R1/R2 correction, on this docs tree before the correction commit:

- `git fetch origin main` → `d91be5af020c41b935ea0eb0c90e5ec19b57babe`
- `git rev-list --left-right --count origin/main...HEAD` → `0 2` (zero behind; the 2 are the task seed and the CHANGES REQUIRED head `42c74252cb0fe21f25fca0e5800b98db9bea6fb7`)
- `git diff --check` on the three documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

`npm test`, typecheck, lint, and the production build were not run. Runtime bytes are the baseline. I do not claim those gates.

## Stop

Cursor does not Ready or merge. The next actor is an independent Technical-Lead review of the exact branch tip.
