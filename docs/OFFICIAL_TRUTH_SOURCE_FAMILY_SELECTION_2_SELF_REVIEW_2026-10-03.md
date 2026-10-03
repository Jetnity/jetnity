# Official Truth Deterministic Source-Family Selection 2 — Self-Review

Date: 3 October 2026
Issue: #788
Draft PR: #789
Branch: `docs/official-truth-source-family-selection-2`
Baseline: `main@e5723eac239a0227148e250c97eb6be20f44b36d`
Logical agent: **Jetnity Official Truth deterministic source-family selection 2**, Generation 1
Session: https://cursor.com/agents/bc-a0a5897c-bffa-41bd-8886-3b80b85f1673
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows exactly:

- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this audit. It stays unstaged.

The task seed is the only other difference from `origin/main`, and it was not modified in this session.

## What I decided

| Area | Decision |
| --- | --- |
| Selection | `NO_SOURCE_FAMILY_PROVEN_YET`. No family is compatible with the current fact and retrieval contract. No family id, extractor id, version, source id, allowlist, schema family, or fact shape. |
| India passport validity | The application-time six-month sentence is on the page. A second FAQ sentence adds a re-entry permit. The body is 192,454 bytes, over `BODY_MAX` 65,536. The 325-byte stub is a script location, not the rule. |
| India blank pages | The number two is explicit once, inside the same FAQ answer as the purpose list. `blank_passport_pages` cannot store that purpose qualifier. |
| India predicates | The modal says passports from listed countries. FAQ Q1 says nationals. Diplomatic and official passports are excluded. Decoded `documentType` cannot express that exclusion, and `ordinary_passport` is not a decoded document type. |
| Saudi | HTTP 403 interstitial, 257,009 bytes, Ministry of Tourism logo, external-network refusal. No Switzerland list and no six-month entry sentence in the bytes. Three hashes at the same size. |
| UAE | "Passport valid for no less than 6 months" has no entry, application, departure, or stay-through anchor. Switzerland is absent. Arabic body 627,025 bytes. English body 616,726 bytes. English canonical URL is the Arabic page. |
| Fourth candidate | Not opened. No CH-11. The 64 destinations were not re-researched. |
| CH-01..CH-10 | Remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No import. |
| Registry | Live production registry stays `Object.freeze([])`. This audit does not register a row. |

## Claims I refused to upgrade

- I did not treat the India application-time sentence as a complete fact while the FAQ sentence in the same response adds a re-entry permit.
- I did not drop the e-Visa purpose list and still emit `passport_validity` or `blank_passport_pages`.
- I did not infer citizenship `CH` from the Switzerland passport-from record, or an issuing country `CH` from citizenship `CH`.
- I did not rewrite research `ordinary_passport` to decoded `passport` in order to pass the diplomatic exclusion.
- I did not read the absence of Switzerland on the ICP page as eligibility.
- I did not assign `minimum_remaining_from_entry` to "Passport valid for no less than 6 months."
- I did not assign `valid_on_entry` to a sentence that states a six-month duration. That semantics requires a null duration.
- I did not treat the Saudi interstitial logo as a terms document or as a permitted-passport list.
- I did not follow `boi.gov.in`, the India fee PDFs, or the ICP service-card download as a second source.
- I did not treat the India script location, or the ICP English canonical link, as the rule body.
- I did not call the session body hashes Evidence fingerprints or Official Truth.
- I did not raise `BODY_MAX`.
- I did not query Production or Development. The zero-row note in comment `5935581800` stays historical.
- I did not certify `npm test`, typecheck, lint, or the production build. Runtime bytes are the baseline.
- I did not start an extractor, F8, a route, a store write, or a follow-up slice.

## Validation

Commands run on this docs tree before the delivery commit:

- `git fetch origin main` → `e5723eac239a0227148e250c97eb6be20f44b36d`
- `git rev-list --left-right --count origin/main...HEAD` → `0 1` (zero behind; the 1 is the task seed)
- `git diff --check` on the three documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

Machine mode in `.jetnity/operating-mode.json` is `NORMAL`. That file was not edited.

`npm test`, typecheck, lint, and the production build were not run. Runtime bytes are the baseline. I do not claim those gates.

## Stop

Exact head for review is the branch tip after the commit that adds these three documents. Re-fetch that tip. Cursor does not Ready or merge.
