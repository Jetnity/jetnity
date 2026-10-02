# Official Truth F8 Deterministic Trusted-Fact Source Audit 1 — Self-Review

Date: 3 October 2026
Issue: #769
Draft PR: #771
Branch: `docs/official-truth-f8-trusted-fact-source-audit-1`
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Logical agent: **Jetnity Official Truth F8 deterministic trusted-fact source audit 1**, Generation 1
Session: https://cursor.com/agents/bc-9de46031-8655-4c4a-93c4-2cdef9a4f27c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows only:

- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this audit. It stays unstaged.

The reproduction script lived at `/tmp/f8-fact-source-repro.ts` and was not added to the branch.

## What I classified

| Fact kind | Outcome | Why this label |
| --- | --- | --- |
| `requirement_effect` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | `effect` and `visaMode` are decision fields. Evidence rejects them. The snapshot is not parsed. |
| `visa_options` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | Eligibility, mandate, and concrete visa mode exist only on a supplied fact or proposal. |
| `stay_limit` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | Six required keys. The evidence window is not a stay duration. |
| `passport_validity` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | Cell type does not choose semantics or a remaining duration. |
| `blank_passport_pages` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | Smallest schema, still no page count anywhere but a supplied fact. |
| `transit_conditions` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | A transit country code is not a path. |
| `official_actions` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | `officialAktionAusQuelle` has the wrong shape and would also be a purpose policy if reshaped. |
| `temporal_rule` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` | `temporalRuleLesen` ignores `validFrom` and `validUntil`. |

No kind is `CURRENTLY_DETERMINISTIC`. I did not use `NOT_CURRENTLY_DERIVABLE` because the re-proved snapshot text is present on the review-packet support and a later extractor could be specified against it. I did not use `REQUIRES_PRODUCT_POLICY_DECISION` as the primary label: the blocking gap is the missing extractor, and choosing legal defaults would be a further gate, not a current source. I did not use `NOT_APPLICABLE_TO_INITIAL_AUTONOMY_POLICY`: all eight kinds share one acceptance function, and the directive does not drop any of them from the fact vocabulary.

## Reproduction I will stand on

Command, from the repository root, with no network and no Supabase client:

`node --import ./scripts/server-only-test-register.mjs --import tsx /tmp/f8-fact-source-repro.ts`

Exit 0. The assertions in the report match that stdout. The probe sentence was not interpreted as law. I did not add a passport number, MRZ, or other personal value.

## Claims I refused to upgrade

- I did not treat `regelKandidatAkzeptieren` ignoring `proposal` as autonomous safety. The same function accepts the proposal when the caller passes it as `trustedRuleFact`.
- I did not treat a fingerprint that includes `proposal` as trust in that proposal. The key is review identity.
- I did not treat the witness `factKind` as a fact body.
- I did not treat `officialAktionAusQuelle` or `visaModeLesen`'s `unknown` as a deterministic Rule fact.
- I did not treat `blank_passport_pages` as safe to accept. It is only the smallest future schema.
- I did not certify Production, the dormant store, or `npm test`. This slice does not change runtime.
- I did not design the #768 composition or API, and I did not start an extractor.

## Validation

Run on this docs tree before the audit commit:

- `git fetch origin main` → `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
- `git rev-list --left-right --count HEAD...origin/main` → `1 0` (the task seed ahead, zero behind)
- `git diff --check` on the three documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

`npm test`, typecheck, lint and the production build were not run. The runtime bytes are the baseline. I do not claim those gates.

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a remediation branch from this session.
