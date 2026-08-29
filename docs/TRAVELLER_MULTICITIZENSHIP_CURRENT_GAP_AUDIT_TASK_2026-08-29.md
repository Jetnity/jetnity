# Traveller / Multi-Citizenship Current Gap Audit — Task

Stand: 29. August 2026  
Status: **VERSIONED AUDIT TASK / DOCS-EVIDENCE ONLY / NO RUNTIME MUTATION**  
Technical-Lead baseline: `main @ 085c95b22130232c5b5819ef8a4bcc302cc0f52b`

## Objective

Reconstruct the **current live repository truth** for Jetnity's traveller architecture and identify any remaining product-wide gaps against the binding canonical model:

> one traveller → multiple citizenships → multiple travel documents / credentials → context-dependent permissible credential options, with no default passport, no default citizenship and no issuer-country ≡ citizenship shortcut.

This is a current-state audit, not a redesign and not an implementation slice.

## Mandatory first reads

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md`
6. `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` — historical evidence only; do not copy its 26-Aug status as current truth
7. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
8. AP-7 Gate 0 / S1 status, task, ADR/domain-contract docs and Product Owner Dual-Authority approval
9. P2-TA-04 / TA-06 current status/handoffs and migrations
10. relevant traveller/readiness/guest→account current code and current migrations.

## Minimum code/data surfaces to inspect

At minimum, inspect current `main` implementations and call sites around:

- `lib/traveller/*`, especially account registry / dual-authority model;
- `lib/readiness/*`, including credential option construction, official requirement composition/presentation, comparison, safety and any fallback path;
- `lib/trips/*`, guest/local persistence, Guest→Account adoption and traveller cloning/copy behavior;
- traveller editing/preparation UI and APIs under `app/`;
- `types/trips.ts`, `types/supabase.ts` and current DB migrations for traveller/citizenship/document ownership/write contracts;
- current AP-7 S1 domain contract and any account-scoped traveller registry implementation actually present on `main`;
- provider-facing/request-facing traveller projections for Flights, Hotels, Activities, Mobility and Rental Cars, but **do not edit provider workstreams**.

Use code search to find all material singular/default assumptions, including but not limited to:

- `documents[0]`, `citizenships[0]`, `evaluations[0]`, `credentialOptions[0]`;
- `primaryPassport`, `primaryCitizenship`, `defaultPassport`, `defaultCitizenship` or equivalent semantics;
- issuer country used as nationality/citizenship;
- first-traveller or account-owner identity assumed for another traveller;
- serialization/deserialization paths that collapse 1:n arrays;
- Guest→Account paths that lose citizenship↔document relations;
- account-registry ↔ trip-snapshot dual-authority paths that can overwrite fresher trip context or silently merge identities;
- UI/API summaries that collapse option-specific official evidence to the first evaluation;
- provider adapters/projections that would eventually choose one document/citizenship without an explicit context-specific decision.

## Required analysis matrix

For each relevant surface classify:

- `correct`
- `partial`
- `missing`
- `conflicting`
- `insufficient evidence`

For every non-correct result include:

1. exact file/function/schema surface;
2. current reachable call path (or prove it is latent/unreachable);
3. user/product/security/truth impact;
4. severity: P0/P1/P2/P3 with justification;
5. whether it blocks the binding Traveller completion stage, Account AP-7+, a provider slice, or only a later UI/detail slice;
6. smallest safe future slice boundary — **proposal only**, not implementation.

## Special truth rules

- Multiple citizenships are peer facts; never silently rank one as primary.
- Multiple documents are peer credentials; suitability is context-dependent, not globally primary.
- Document issuing country is not automatically citizenship.
- A passport can be linked to a citizenship only by stored/evidenced relation, not heuristic equality.
- Missing facts remain `unknown` / `insufficient_context`.
- No shadow traveller identity may be created from provider/search data.
- Search/provider commercial truth does not determine legal/entry eligibility.
- Account-level registry and trip-level traveller context may have different authority/lifecycle; follow the accepted AP-7 dual-authority contract exactly rather than inventing merge rules.
- Do not claim Production schema state unless repository/live evidence available to this agent proves it. Mark unverified Production facts honestly.

## Deliverables — new docs only

Create only new audit-specific documents unless a typo inside this task itself must be fixed:

1. `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_2026-08-29.md`
2. `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_STATUS_2026-08-29.md`
3. `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_HANDOFF_2026-08-29.md`
4. `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_SELF_REVIEW_2026-08-29.md`
5. optional future-slice proposal doc(s), clearly `PROPOSAL ONLY / NOT AUTHORIZED`, only where findings justify them.

Do **not** edit `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`, architecture ADRs, migrations or runtime code in this audit. This keeps the workstream conflict-free with active provider reviews.

## Hard non-scope

- no runtime/product code changes;
- no database migration or Supabase mutation;
- no RLS/grant/function mutation;
- no provider code or provider audit edits;
- no UI fix;
- no account-registry implementation/change;
- no Production/Vercel/config mutation;
- no secrets/credentials;
- no external legal/provider API calls;
- no Ready/Merge;
- no automatic implementation follow-up.

## Handoff requirements

Before handoff:

- fetch current `origin/main` again and record drift;
- self-review every factual claim against current code/docs;
- distinguish historical evidence from current truth;
- report exact branch/PR/head, changed files, test/static checks actually run, known limitations, blockers and exact next step;
- STOP for independent ChatGPT Technical-Lead exact-head review.

Agent self-review is not a Technical-Lead PASS.