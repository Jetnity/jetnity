# Official Truth Regulatory Eligibility Predicate Architecture 1 — Self-Review

Date: 3 October 2026
Issue: #792
Draft PR: #793
Branch: `docs/official-truth-regulatory-eligibility-predicate-architecture-1`
Baseline: `main@cb6b32dd34075a47eb220454ea46fc8371752b15`
Logical agent: **Jetnity Official Truth regulatory eligibility predicate architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-1e56bb1a-bd9c-41d6-9243-ea23429e4ddd
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## R1

Technical-Lead review of `3eee6bb8c7476748d1c495de0fedea564d859a5b` required three corrections. I agreed with each one.

The binding sentence in section 7 looked only at atoms that evaluated `true`. An `otherwise` `required` result can depend entirely on user-asserted `not_valid` and `not_held` facts. Those negative facts are now dependencies. `not` keeps the inner dependencies. Short-circuit keeps only the canonical operand that decides `all` or `any`.

The fact shapes were described in prose. Section 3.1 now gives the exact legacy and schema-1 objects, the key name `applicability`, and the `mixed_outcome` rejection. A later parser does not have to choose where `effect` lives.

`reg-eval-ctx:v1` was specified as an ordinary hash beside the rule fingerprint. An unsalted hash of age, permission, status, residence, purpose, and school context is still personal. The first runtime slice does not compute or return that hash.

## Scope check

The binding task requires exactly:

- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, route, registry, or `package.json` file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. The progress-persistence policy would normally update the active status file. This task's exact output list is narrower, and the report carries the handoff fields. The workspace had a dirty `next-env.d.ts` before this architecture. It stays unstaged.

The task seed `631995ef6b11f78c1782043c842ca5e5c84d7e37` already added the task file. That file is the only other difference from `origin/main`, and it was not modified in this session.

## What I specified

| Area | Decision |
| --- | --- |
| Layers | Global rule, ephemeral traveller context, and derived evaluation stay separate. |
| Payload | Section 3.1 shapes. Legacy three-key `required` / `not_required` stays unconditional. Schema-1 branched facts have `applicability` and no top-level outcome. `mixed_outcome` rejects both. Legacy `conditional` is not upgraded. |
| Constructor | `regelKandidatAkzeptieren` only. Later reader extension inside that function. Store writer must refuse a branched fact until a migration exists. |
| Vocabulary | Fourteen atomic kinds. No source boolean and no free-text condition. Document class is not `documentType`. Status class is not an ISO code. Residence country is not lawful entitlement. |
| Logic | Depth 4, 16 nodes, 8 operands, 8 branches. Kleene `all` / `any` / `not`. `otherwise` only when every expression branch is false. Section 5.1 traces `true` and `false` dependencies, including `otherwise`. |
| India | Diplomatic, official, and laissez-passer exclusion is visa-option eligibility `not_allowed`, not requirement `not_required`. Issuer and nationality stay different predicates. Purpose prose is not mapped. |
| GOV.UK | Seven illustrative branches cover the audited exemptions plus `otherwise`. CTA members are not invented. The region pin is empty. |
| Privacy | No passport number, MRZ, scan, biometric, health record, permit number, school name, or date of birth. New personal facts are ephemeral. `reg-eval-ctx:v1` is personal derived metadata and is not part of the first slice's return. The decision trace has kind, provenance, and polarity only. |
| Missing facts | Nine new codes plus three existing static codes. Ask only what the matched expression still needs. |
| Scope key | Unchanged. `rule-applicability:v1` is non-personal rule metadata. The context hash is not a lookup key. |
| Citizenship | Full set retained. No best passport. No first-match across options. |
| Composition | Support citations specified for a later policy. Same-request composition stays blocked. |
| F8 | May accept a complete applicability fact only through the existing constructor. A flat `required` that drops a stated exception is incomplete. |
| First slice | `lib/readiness/regulierungs-anwendbarkeit.ts` and its test. Migration: none. |
| Classification | `PREDICATE_FOUNDATION_READY_FOR_RUNTIME_SLICE` |

## Claims I refused to upgrade

- I did not treat this design as permission to start the runtime module, an extractor, CH import, or F8.
- I did not pin Common Travel Area members from memory. The Appendix audit names the region and does not quote a member list.
- I did not map recreation, short courses, voluntary work, conferences, or medical treatment onto the purpose enum.
- I did not encode ETA 1.6 as an age limit on the Ireland exemption. The audit says that sentence qualifies evidence and does not remove ETA 1.3.
- I did not treat `residenceCountryCode` `IE` as ETA 1.4, or `documentType: 'passport'` as an ordinary passport.
- I did not put school names, permit numbers, or dates of birth on the global rule or the context.
- I did not expand `RegelScope`. A wider lookup key would freeze volatile personal facts into reusable evidence.
- I did not add a second acceptance function.
- I did not describe a Production migration. The current effect table cannot store branches without dropping them.
- I did not join the National List and the Appendix. Composition remains `composition_policy_unavailable`.
- I did not select a provider. `requirementsProviderAus()` remains `null` on the baseline.
- I did not certify `npm test`, typecheck, lint, or the production build.
- I did not keep the context fingerprint as an ordinary non-personal hash after R3.
- I did not leave `otherwise` binding dependent only on atoms that evaluated `true`.
- I did not leave the trusted-fact shape for the later parser to choose.

## Validation

First delivery, before `3eee6bb8c7476748d1c495de0fedea564d859a5b`:

- `git fetch origin main` resolved `cb6b32dd34075a47eb220454ea46fc8371752b15`
- `git rev-list --left-right --count HEAD...origin/main` returned `1 0` (task seed ahead, zero behind)
- `git diff --check` produced no whitespace errors
- `node scripts/operating-mode-guard.mjs` returned `operating-mode guard: PASS`

R1 correction, on this docs tree before the correction commit:

- `git fetch origin main` resolved `cb6b32dd34075a47eb220454ea46fc8371752b15`
- `git rev-list --left-right --count HEAD...origin/main` returned `2 0` (task seed and the first architecture commit ahead, zero behind)
- `git diff --check` on the three architecture documents produced no whitespace errors
- `node scripts/operating-mode-guard.mjs` returned `operating-mode guard: PASS`
- The unstaged `next-env.d.ts` is pre-existing and stays unstaged
- The task file was not modified

`npm test`, typecheck, lint, and the production build were not run. Runtime bytes are the baseline. I do not claim those gates.

## Stop

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge and does not start a runtime follow-up.
