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
- Explicit quality accepts one trusted accepted version. Composed quality accepts two distinct sources and rejects two versions of the same source.
- Stale, unresolved conflict and research gap return `quality_not_acceptable` and do not emit `not_required`. A research gap with a non-null proposal fails before acceptance.
- The regression fixture proposes `required` / `electronic_visa` and trusts `not_required` / `visa_exempt`. The accepted claim contains only the trusted fact. The acceptance function source does not mention `proposal`.
- `OFFICIAL_REQUIREMENT_TYPES` is still the existing sixteen values. eTA stays `electronic_travel_authorization`. Entry forms stay `entry_form`. Transit stays `transit`.
- Visa contradictions reuse `visaResultUndModusWidersprechen`. An optional eVisa can sit beside a visa-exempt effect as a separate `visa_options` fact.
- Stay examples keep days and months. Passport validity does not turn "valid on entry" into zero months. Blank pages outside 1..10 fail. Transit unknowns stay null, paths dedupe, and order is stable.
- Official actions keep the canonical registry URL, reject a licensed provider, and reject insecure or credential URLs. A portal source may differ from the evidence article source.
- Temporal facts call `temporalRuleLesen`. The file does not reimplement offset parsing.
- `requirementsProviderAus()` remains `null`.

## Findings I am not calling done

1. There is no claim table. A later writer could still persist a proposal if it bypasses `regelKandidatAkzeptieren`. The next persistence slice has to call this acceptance path and must not add a second constructor.
2. `visaMode: unknown` remains legal on an accepted `requirement_effect` for requirement type `visa`, because that is the existing `OfficialVisaMode` sentinel and `visaResultUndModusWidersprechen` does not treat it as a contradiction. It is not an accepted effect of `unknown`. Uncertainty of the effect itself still means no accepted claim.
3. `passport_validity`, `blank_passport_pages`, `transit_conditions` and `visa_options` are bound to their requirement type. `stay_limit`, `temporal_rule`, `official_actions` and `requirement_effect` are not given a new requirement type. Stay and timing can therefore be asserted on the scope's existing requirement type.
4. Composed quality counts distinct `sourceId` values. It does not also require every source class to be `official_authority`. Official-authority is required for `official_actions`. The mandatory composed test uses two official authorities.
5. A missing `sourceId` on an already source-neutral scope is checked by temporarily supplying `rule-scope-probe` to the existing evidence parser. That probe is not part of the rule key and is not a registered source.
6. Development emptiness and Production absence are parent facts from the binding task. This session did not re-query Supabase. A reader who needs a live row count must re-read Development. Do not treat this sentence as a fresh SQL observation.
7. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head. See the gate section below. A later docs commit that only records those ids is not itself covered by the ids it quotes.

## Local validation

Read in this session on the working tree before the implementation push. A later head needs its own run.

- `git fetch origin main`: `140fdfb9fb066ca9d23c295719cb2e770ae63fd7`. Merge-base was that SHA. 0 behind.
- Changed paths are the allowlist only. The binding task file is unchanged. No SQL file is in the diff.
- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/rule-claims.test.ts`: 17/17 pass.
- `npm test`: 4158 pass / 0 fail. 729 suites.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 0 errors, 148 pre-existing warnings, none in `lib/readiness/rule-claims.ts` or its test.
- `npm run check:setup:ci`: pass, with the existing warning that no `.env` / `.env.local` exists.
- `npm run build`: pass. Next.js 16.3.8 compiled and generated 25 static pages.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, and still reports the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

Read in this session for `3d774ebda798b5ee72ff5bb72df4ba2f89062683` only:

- GitHub CI run `36866487394` **SUCCESS**, event `pull_request`
- Auth job `110383120020` **SUCCESS**
- Typecheck, Lint & Build job `110383120312` **SUCCESS**
- Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/4SYkZJherF1CSEDds3aLYxFxEbWi`
- GitHub Preview deployment `6785062708` **success**, target `https://jetnity-jb5lqp9zj-jetnity-e1b93c82.vercel.app`, direct GET HTTP 302 to Vercel SSO

The commit that writes these facts is a newer head. Those gates do not cover it. Do not copy a gate from #675 or from the task seed `2710c1f7`.

## Stop

No Ready. No merge. No Supabase apply. No import. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
