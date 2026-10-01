# Official Truth Structured Rule Claims Foundation 1 — Self-Review

Date: 1 October 2026
Issue: #676
Draft PR: #677
Branch: `feat/official-truth-rule-claims-foundation-1`

Logical agent: **Jetnity Official Truth structured rule claims foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-755b4481-4bc0-4b4d-8047-75ae8a0d5da4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff is intended to stay inside the task allowlist. The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. No evidence row was imported.

## What I checked in the contract

- Two evidence versions with different `sourceId` and the same regulatory scope share `rule-scope:v1:`. Their `evidence-key:v2:` values still differ.
- Citizenship order does not change the rule key. Destination, transit, citizenship set, document relation, residence and travel date do.
- The issuing country is stored separately from an explicit related citizenship. Null stays unlinked. Two passport options produce two keys. The module has no preferred-passport selector.
- Explicit quality accepts one trusted official-authority version and rejects one licensed provider.
- Composed quality accepts two distinct official authorities, rejects two versions of the same official source, rejects two licensed providers, and rejects a mix of official and licensed support. The error is `primary_source_required`. There is no new provider quality.
- Stale, unresolved conflict and research gap return `quality_not_acceptable` and do not emit `not_required`. A research gap with a non-null proposal fails before acceptance.
- The regression fixture proposes `required` / `electronic_visa` and trusts `not_required` / `visa_exempt`. The accepted claim contains only the trusted fact. The acceptance function source does not mention `proposal`.
- `OFFICIAL_REQUIREMENT_TYPES` is still the existing sixteen values. eTA stays `electronic_travel_authorization`. Entry forms stay `entry_form`. Transit stays `transit`.
- Visa contradictions reuse `visaResultUndModusWidersprechen`. An optional eVisa can sit beside a visa-exempt effect as a separate `visa_options` fact.
- Stay examples keep days and months. Passport validity does not turn "valid on entry" into zero months. Blank pages outside 1..10 fail. Transit unknowns stay null, paths dedupe, and order is stable.
- Official actions keep the canonical registry URL, reject a licensed provider, and reject insecure or credential URLs. A portal source may differ from the evidence article source.
- Temporal facts call `temporalRuleLesen`. The file does not reimplement offset parsing.
- `requirementsProviderAus()` remains `null`.

## R1-F1 closed

Review `5379808338` on `09b9692b9afbf619b552459008c080cf3ef52920` found that primary qualities accepted licensed providers. That residual is closed. `explicit_primary_statement` and `composed_from_multiple_primary_sources` now require `sourceClass === 'official_authority'` on every supporting version. A licensed provider or a mixed set fails with `primary_source_required`. No provider quality was added.

## Findings I am not calling done

1. There is no claim table. A later writer could still persist a proposal if it bypasses `regelKandidatAkzeptieren`. The next persistence slice has to call this acceptance path and must not add a second constructor.
2. `visaMode: unknown` remains legal on an accepted `requirement_effect` for requirement type `visa`, because that is the existing `OfficialVisaMode` sentinel and `visaResultUndModusWidersprechen` does not treat it as a contradiction. It is not an accepted effect of `unknown`. Uncertainty of the effect itself still means no accepted claim.
3. `passport_validity`, `blank_passport_pages`, `transit_conditions` and `visa_options` are bound to their requirement type. `stay_limit`, `temporal_rule`, `official_actions` and `requirement_effect` are not given a new requirement type. Stay and timing can therefore be asserted on the scope's existing requirement type.
4. A missing `sourceId` on an already source-neutral scope is checked by temporarily supplying `rule-scope-probe` to the existing evidence parser. That probe is not part of the rule key and is not a registered source.
5. Development emptiness and Production absence are parent facts from the binding task. This session did not re-query Supabase. A reader who needs a live row count must re-read Development. Do not treat this sentence as a fresh SQL observation.
6. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head. See the gate section below. A later docs commit that only records those ids is not itself covered by the ids it quotes.

## Local validation

Re-read on the R1-F1 correction working tree before this commit. `origin/main` is `140fdfb9fb066ca9d23c295719cb2e770ae63fd7`. Merge-base is that SHA. The branch is 0 behind.

- Changed paths are the allowlist only. The binding task file is unchanged. No SQL file is in the diff.
- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/rule-claims.test.ts`: 18/18 pass.
- `npm test`: 4159 pass / 0 fail. 729 suites.
- `npm run typecheck`: pass.
- `npx eslint lib/readiness/rule-claims.ts lib/readiness/rule-claims.test.ts`: pass, no warnings.
- Full-repo lint and the production build are the exact-head GitHub CI job for this tip. They are not copied from `3d774ebd` or `09b9692b`.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

R1 review `5379808338` is CHANGES REQUIRED on `09b9692b9afbf619b552459008c080cf3ef52920`. That head had no exact-head GitHub CI run. Parent run `36866487394` on `3d774ebd` does not gate this correction.

The correction head is the branch tip after this commit. Its GitHub CI, Auth job and Vercel Preview are the gate. They are not written here in advance. Do not copy `36866487394`, `36864246324`, or the task seed `2710c1f7`.

## Stop

No Ready. No merge. No Supabase apply. No import. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
