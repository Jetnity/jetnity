# GOV.UK Content API identity verifier 1 — Handoff

Date: 4 October 2026. Issue #818 / Draft PR #819 / Generation 1.
Writer: **Jetnity GOV.UK Content API identity verifier 1**.
Branch: `feat/official-truth-profile-verifier-1`.
Baseline: `f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`.
Dispatch: `2c5cce9a596e85cdb72965a92127312cd421263f`.
Session: `01a1071c-786d-79c0-8ff7-b17597e477c1`.
Model evidence: `gpt-6-astra` / `xhigh` — **GPT-6 Astra — Sehr hoch**, from the writer session's turn_context.

Classification: **GOVUK_CONTENT_API_IDENTITY_VERIFIER_BLOCKED**.
Remain Draft. Author delivery is not independent acceptance.

The exact final head is in the completion delivery and live PR #819 head readback. Verify both against `git rev-parse HEAD`; this document cannot embed its own containing commit hash. Baseline/dispatch are historical anchors, not final-head substitutes.

## First unfinished action

**Independent Technical Lead exact-head review of #819 and resolution of the importer-allowlist scope dependency.**

`lib/readiness/official-truth-content-identity.test.ts` contains `repository search pins the finite R2 production importers`. Its closed expected list omits the new module. Ordinary reuse of the mandated existing `ContentIdentityProfileDefinition` creates exactly one additional scanned type-only importer. Reproduction:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-content-identity.test.ts
```

The failure's sole additional path is `lib/readiness/official-truth-govuk-content-api-identity-profile.ts`. The minimal proposed correction is one expected-list entry, between discovered-URL and refresh-diff. It requires a seventh file. The current task still requires six, so that test has not been edited, weakened or bypassed. No existing runtime seam is missing. No different import spelling or duplicate type was used to evade the guard.

A scope decision must come from the responsible Technical Lead before that edit. If correction is authorized, resume this same writer/session and regate the resulting head. Do not create an overlapping writer. This handoff does not authorize the correction or registration.

## Reconstruct and review

1. Fetch live main and task branch; verify expected baseline/mode, #751, #748 after marker `5978621253`, open writers and Draft status. Only prior TL receipt `5978881653` was newer at delivery.
2. Read the unchanged [task](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_TASK_2026-10-04.md), full [report](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_REPORT_2026-10-04.md), [self-review](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_SELF_REVIEW_2026-10-04.md), and both new code files.
3. Verify exactly the six report-listed paths versus baseline and five writer-authored additions after dispatch. Seed blob `d0cadaf7be709cca8d2ec1cd55191be3b3547121`; SHA-256 `07b97fe02ae5a51061f33294f48f8b61a2338121b44f46b48bcae54b2b14460d`.
4. Check ordinary type-only contract import, descriptor preflight, decoded duplicate scanner, all eight inclusive bounds, strict envelope/link pinning, and seven-field frozen success projection. Id `govuk-eta-national-list-content-api-en`, version 1, current true is dormant, not registered.
5. Reproduce 331 focused test passes. R1/R2 is 124/125; full suite is 5,082/5,083, with exactly the known allowlist failure. Typecheck/lint/build/mode/API/schema/dead/export/dependency checks pass. Full PostgreSQL fixture tests require Linux PostgreSQL 16 and run without external networking. See report for the validation environment and resolved first-run setup failures.
6. Independently verify the unchanged empty/frozen production registry and zero non-test importers of the new module. Review any remote checks against the actual final head; no remote CI/Vercel PASS is manufactured here.

## Delivered versus unstarted

Delivered: pure profile/parser; inline synthetic fixtures; adversarial grammar, identity, structure, mutability and inclusive-bound tests; report/handoff/self-review; exact scope and seed preservation. The task's 20 root keys are all mandatory even though the earlier audit permitted five observation keys to be absent.

Open: one out-of-scope test allowlist edit needed for a completely green suite; independent technical review. Calendar validation conservatively rejects leap-second claims/year zero. Strict upstream shape drift fails closed and may require a future profile version. This slice neither proves legal completeness nor accepts Evidence; old accepted-Evidence/hash rebinding remains downstream.

Unstarted: real source/content/representation/profile registration, registration audit, legal extraction, composition policy, region pin, Rule fact, schema-1 persistence, F8. No live database state is re-audited. No hosted database or government network call was made. Existing full-suite tests use disposable synthetic PostgreSQL only; GitHub coordination/fetch/push is the delivery network activity. No new dependency, runtime gateway edit, migration, Development/Production mutation, #626, launch/indexing or recurring cost.

**Do not Ready. Do not merge. STOP for independent Technical-Lead exact-head review.**
