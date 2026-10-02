# Official Truth F8 Canonical Acceptance Composition Audit 1 — Self-Review

Date: 3 October 2026
Issue: #768
Draft PR: #770
Branch: `docs/official-truth-f8-acceptance-composition-audit-1`
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Logical agent: **Jetnity Official Truth F8 canonical acceptance composition audit 1**
Generation: **1**
Session: https://cursor.com/agents/bc-b02dc231-a456-4aaf-9d1c-6d5e3e3b1959
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows only:

- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_SELF_REVIEW_2026-10-03.md`

The task seed was already on the branch. This session does not edit the task file. No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this audit. It stays unstaged. The reproduction script lived at `/tmp/f8-composition-repro.mjs` and was not added to the branch.

## Classification I will stand on

**BLOCKED_BY_MISSING_TRUTH_SOURCE**

I did not select `READY_FOR_ONE_BOUNDED_RUNTIME_SLICE`. The four acceptance arguments are not available from the public witness or the public re-proof, and `trustedRuleFact` has no autonomous source.

I did not select `REQUIRES_NARROW_INTERNAL_PREREQUISITE` as the class of F8. The same-request proof graph is specified in the report because a later acceptance call cannot be safe without it. That graph does not emit a rule fact. Treating it as the F8 class would invite a writer to implement acceptance by copying `proposal`.

I did not select `BLOCKED_BY_PRODUCT_OWNER_GATE`. Production store apply remains a separate gate. It is not why the composition cannot mint `trustedRuleFact`. The audit does not ask for a new role, a retention duration, or a store apply.

## Reproduction I will stand on

Command, from the repository root, with no network and no Supabase client:

`node --import ./scripts/server-only-test-register.mjs --import tsx /tmp/f8-composition-repro.mjs`

Exit 0. The JSON in the report is that stdout.

Observed:

- a caller-shaped registry and caller evidence were accepted with no witness;
- the claim fact was the separate trusted object, not the candidate proposal;
- the same proposal object passed as `trustedRuleFact` became the claim fact;
- a forged witness field on the acceptance object was `unexpected_fields`;
- a re-proof support summary was `evidence_not_accepted`;
- the witness success had the nine public keys and no registry, proposal, or trusted fact;
- the witness performed one `read_registry`, and a following packet call performed a second read that returned `invalid_source_plan` after the authority name changed.

The 2099 caller clock was present on the review bundle. The witness still succeeded at the injected server instant. I did not add a passport number or a real government rule.

## Claims I refused to upgrade

- I did not say the second catalog read always fails. The probe changed the authority name so the split was visible. A quieter change could produce a different valid packet. The invariant is still one read.
- I did not certify Production. `LOCAL_UNAPPLIED_RPCS` is the repository classifier. This session did not query a hosted database.
- I did not treat the human fact-entry paragraph in the architecture as an implemented fact source. The server-held proceed binding is explicitly not chosen there, and this audit found no code that supplies `trustedRuleFact` from that binding.
- I did not design a deterministic acceptance predicate, and I did not name a visa outcome that would pass one.
- I did not read Issue #769 and I do not depend on it.
- I did not start the proof-graph prerequisite or an F8 writer.

## Validation

Run on this docs tree before the audit commit:

- `git fetch origin main` → `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
- `git rev-list --left-right --count HEAD...origin/main` at fetch, before these documents → `1 0`
- `git diff --check` on the three documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

`npm test`, typecheck, lint, and the production build were not run. The runtime bytes are the baseline. I do not claim those gates.

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a remediation branch from this session.
