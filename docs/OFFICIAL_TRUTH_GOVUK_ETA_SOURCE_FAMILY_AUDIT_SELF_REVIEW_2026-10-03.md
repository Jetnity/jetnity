# Official Truth GOV.UK ETA Deterministic Source-Family Audit — Self-Review

Date: 3 October 2026
Issue: #790
Draft PR: #791
Branch: `docs/official-truth-govuk-eta-source-family-audit`
Baseline: `main@32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`
Logical agent: **Jetnity Official Truth GOV.UK ETA source-family audit**, Generation 1
Session: https://cursor.com/agents/bc-5ef68db6-34e5-49e9-b6e4-cacf373730c8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows exactly:

- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this audit. It stays unstaged.

The task seed is the only other difference from `origin/main`, and it was not modified in this session.

## What I decided

| Area | Decision |
| --- | --- |
| Selection | `NO_SOURCE_FAMILY_PROVEN_YET`. No family id, extractor id, version, source id, allowlist, schema family, or fact shape. |
| Switzerland membership | Proven. One `<li>` with text exactly `Switzerland`. |
| Travel date | The (d) label says travelling on or after 2 April 2025. Comparison uses only `scope.validity.travelDate` when mode is `travel_date`. An earlier date emits no fact. Selection 1's opaque-`scopeKey` block is closed. The date still sits in the Uruguay `<li>`, not on the Switzerland node. |
| Byte ceiling | National List HTML 62,422 and Content API 7,788 are inside 65,536 and are fatal UTF-8. Appendix HTML 88,426 is over the ceiling. Appendix API 22,965 is inside the ceiling and does not name Switzerland. |
| Exemptions | The entry-clearance sentence and ETA 1.3 cannot be proved aside on the current `RegelScope`. ETA 1.7, ETA 1.9, and ETA 1.10 are the same class of gap. Unconditional `required` is incomplete. |
| `conditional` | Not used. The fact has no condition payload, and `visaMode` must be null for this requirement type. |
| Two pages | Different `content_id` values. One explicit support cannot see both. Composition is `composition_policy_unavailable` before HTTP. |
| JSON | `details.body` is HTML. Publishing metadata is not the rule. |
| Citizenship | Exact sorted set `['CH']` only. No silent pick from a larger set. Issuer is not citizenship. Related citizenship only when explicit. |
| Passport | `passport` does not discharge ETA 1.1(d). `ordinary_passport` was not written into the scope. |
| CH-01..CH-10 | Remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No import. No CH-11. |
| Registry | Live production registry stays `Object.freeze([])`. This audit does not register a row. |
| Smallest gap | A decoded predicate that the traveller does not already hold valid UK entry clearance or permission to enter or stay. ETA 1.3 is the same class. Not fixed here. |

## Claims I refused to upgrade

- I did not emit `effect: 'required'` from Switzerland's list membership while the Appendix entry-clearance sentence was unrepresented.
- I did not emit `effect: 'not_required'` for a travel date before 2 April 2025. The list does not state that negative.
- I did not treat `conditional` as a carrier for the entry-clearance sentence or for ETA 1.3.
- I did not treat `residence.mode: 'not_applicable'` as proof that ETA 1.3 does not apply.
- I did not treat `residence.countryCode: 'IE'` as ETA 1.4 lawful residence.
- I did not read `issuingCountryCode` as citizenship, and I did not fill `relatedCitizenshipCountryCode` from the issuer or from the citizenship set.
- I did not choose `CH` out of a multi-citizenship set.
- I did not rewrite `ordinary_passport` to `passport`.
- I did not attach the Taiwan passport footnote to Switzerland.
- I did not use `public_updated_at`, `updated_at`, or the 5 March 2025 application-opening sentence as the travel threshold.
- I did not treat the National List HTML and the National List Content API as two legal sources. They are two renderings. The API rendering is still HTML in `details.body`.
- I did not treat the two Home Office content items as one `explicit_primary_statement`.
- I did not fetch blogs, providers, model summaries, or the visit-guidance page. Exemption text was taken from the Appendix bytes.
- I did not call the session body hashes Evidence fingerprints or Official Truth.
- I did not raise `BODY_MAX`.
- I did not query Production or Development.
- I did not certify `npm test`, typecheck, lint, or the production build. Runtime bytes are the baseline.
- I did not start an extractor, F8, a route, a store write, or a follow-up slice.

## Validation

Commands run on this docs tree before the delivery commit:

- `git fetch origin main` → `32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`
- `git rev-list --left-right --count origin/main...HEAD` → `0 1` before this commit (zero behind; the 1 is the task seed)
- `git diff --check` on the three documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

Machine mode in `.jetnity/operating-mode.json` is `NORMAL`. That file was not edited.

`npm test`, typecheck, lint, and the production build were not run. Runtime bytes are the baseline. I do not claim those gates.

## Stop

Exact head for review is the branch tip after the commit that adds these three documents. Re-fetch that tip. Cursor does not Ready or merge.
