# Jetnity – V1 Legal Claim Hygiene 1 Task

Stand: 18. September 2026  
Status: **ACTIVE / BOUNDED P0 REMEDIATION / COPY-TRUTH ONLY / NO LEGAL CONTENT GENERATION**

Issue: #456  
Source audit: #438 / merged PR #449 / finding 1.4  
Standing authorization: #440  
Canonical base: `main@004dae4d672b9b386fd24ded0babe7ff8d5d5fad`

Branch: `fix/v1-legal-claim-hygiene-1`

Cursor-Agent: **Jetnity V1 legal claim hygiene 1**  
Generation: **1**  
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If Cursor Grok 4.6 High Fast is unavailable, stop and report instead of silently substituting.

---

## 1. Verified problem

Current canonical `main` shows this unsupported user-facing assertion on both authentication surfaces:

`Datenschutz: DSGVO & CH-DSG konform.`

Locations:
- `components/auth/RegisterForm.tsx`;
- `components/auth/LoginForm.tsx`.

The merged V1 Account / Privacy / Operations audit classifies this as finding **1.4 / P0**. Jetnity must not present regulatory conformity as established while required approved legal content and lifecycle/compliance controls remain incomplete.

This task removes an unsupported claim. It does **not** decide legal compliance.

## 2. Product / truth goal

Remove the standalone unsupported compliance footer from Login and Register so the UI no longer states or implies that Jetnity has already proven DSGVO/CH-DSG conformity.

Do not replace it with a softened, equivalent or newly invented legal/compliance claim.

## 3. Required behavior

1. `RegisterForm.tsx`
   - remove the standalone footer containing the unsupported compliance assertion;
   - preserve the existing required terms/privacy checkbox, labels, links, validation and submit gating exactly in behavior.

2. `LoginForm.tsx`
   - remove the standalone footer containing the unsupported compliance assertion;
   - do not introduce any new terms acceptance, consent or legal semantics into login.

3. Regression protection
   - add the smallest focused test that prevents the prohibited claim from silently returning to these auth surfaces;
   - reuse an existing suitable legal/auth test file if clean and scope-faithful; otherwise add one narrowly named focused test;
   - test truth, not styling.

## 4. Allowed scope

Primary:
- `components/auth/RegisterForm.tsx`
- `components/auth/LoginForm.tsx`
- focused existing/new test under `lib/legal/**` or `lib/auth/**` only as necessary
- this slice's:
  - TASK
  - STATUS
  - HANDOFF
  - SELF_REVIEW

Read broadly as required for evidence.

## 5. Hard exclusions

Do **not**:
- create, draft or edit Production `/privacy`, `/terms` or imprint/legal content;
- invent replacement legal or regulatory wording;
- alter the registration checkbox requirement, terms/privacy links or current validation mechanics;
- implement consent persistence/server enforcement;
- change OAuth behavior or the known acceptance-bypass gap;
- change Auth, Sessions, MFA, AAL, password reset or recovery semantics;
- touch Supabase schema, migrations, RLS, grants, policies or Production data;
- activate/configure SMTP/email, analytics, error tracking or any provider;
- touch Assistant Runtime/provider/commercial/payment modules;
- read/write secrets;
- create paid calls or new recurring costs;
- modify global continuity documents during implementation;
- mark Ready;
- merge;
- start a follow-up slice.

If a necessary change crosses these boundaries: STOP for Technical Lead.

## 6. Required evidence / gates

Before handoff:
- confirm the prohibited exact assertion no longer appears in the two auth UI source files;
- confirm registration terms/privacy checkbox behavior and links remain present;
- focused regression test(s);
- full repository tests;
- typecheck;
- lint;
- Production build;
- repository hygiene checks required by current CI;
- exact-head GitHub CI;
- exact-head Vercel Preview;
- no unresolved review/Vercel threads known to the agent;
- re-fetch `origin/main` and report exact head / merge-base / ahead / behind / drift;
- persist STATUS / HANDOFF / SELF_REVIEW.

No Supabase verification is required because this slice must not touch DB/Auth configuration or Production.

## 7. Governance

- One logical implementation agent owns this branch.
- Agent self-review is evidence, not Technical-Lead PASS.
- Every new head invalidates older exact-head gates.
- Do not Ready.
- Do not merge.
- Do not start remediation of any other audit finding.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
