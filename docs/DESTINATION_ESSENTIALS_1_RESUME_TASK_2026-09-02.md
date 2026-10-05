# Jetnity – Destination Essentials 1 Resume / Main-Reconciliation Task

Stand: 2. September 2026
Status: **PRODUCT-OWNER-AUTHORIZED PROVIDER-INDEPENDENT V1 CONTINUATION / SAME LOGICAL SLICE / SAME CURSOR AGENT / RECONCILE BEFORE IMPLEMENTATION**

## 1. Product-Owner sequencing decision

On 2026-09-02 the Product Owner explicitly decided:

> Wir legen die Anfragen auf die Seite und bauen weiter.

Binding interpretation:

- external provider inquiries/applications/contacts remain deferred and unapproved;
- no provider selection is made;
- no signup, terms/contract/DPA acceptance, secrets, live/paid calls, Production S6, Commercial Provenance writer allocation, TW-8/TW-9 commercial closure or Production activation is authorized;
- provider-dependent Commercial Truth remains open and must be revisited before V1 Production readiness;
- Jetnity may continue with provider-independent V1 work while those external gates remain closed.

Issue #395 contains the durable Product-Owner decision evidence.

## 2. Live baseline for this resume

Technical-Lead verified current repository main before this resume task:

`ed41dd17b4b456899d9e4ae11694efe3b10739a9`

Commit:

`Persist new ChatGPT handoff checkpoint (#416)`

Existing Draft PR #394 before this resume task:

- branch: `feat/phase-1-destination-essentials-1`;
- prior exact head: `00183a37fb6f9ee535d9f1896be772c199c06382`;
- original base / merge-base: `c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`;
- versus current main before this task: diverged, 9 commits ahead / 47 commits behind;
- Draft / not merged / no current Technical-Lead PASS.

All CI, Preview, self-review and exact-head evidence from the old head is historical only.

## 3. Agent identity

Cursor-Agent: **`Jetnity destination essentials 1`**
Generation: **1**
Existing session evidence: `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2`
Mode: **SINGLE_AGENT**

This is the same logical slice and PR. Reuse the same logical agent/session for this resume/reconciliation. Do not invent Generation 2 merely because work was paused.

## 4. Goal

Safely resume Destination Essentials 1 from PR #394 by reconciling the existing implementation with the current `main` and preserving only scope-faithful Destination Essentials behavior that is still correct under the latest canonical architecture.

This task does **not** authorize a blind rebase, blind merge, or mechanical conflict resolution.

## 5. Mandatory first step – reconstruct current main

Before changing runtime code:

1. fetch `origin/main` and confirm its exact SHA;
2. read current canonical docs beginning with `JETNITY_START_HERE.md`, Technical-Lead operating standard, current checkpoint and `docs/ACTIVE_WORK_STATUS.md`;
3. inspect the complete current PR #394 diff against current main;
4. identify every conflict/drift caused by the 47 commits that landed after the original base;
5. preserve current-main architecture and truth contracts over stale branch documentation or stale implementation assumptions;
6. if the live main SHA has moved from the baseline above, report the new SHA and reconcile to that newer live truth.

## 6. Runtime scope that may survive reconciliation

The intended product slice remains bounded to a source-aware Destination Essentials summary inside the existing Trip Workspace overview, reusing existing Trip Stage + Official + Safety + Seasonal truth only.

Preserve the original task invariants where still compatible with current main:

- stage order and stage identity remain canonical;
- duplicate-country stages remain distinct;
- no country inference when countryCode is absent;
- destination Official truth remains distinct from transit Official truth;
- unknown/unavailable/stale/recheck/provider-unavailable remain distinct from not-required;
- validated Official actions only; source URLs must not be silently promoted into application/form actions;
- Safety/Seasonal destination attachment requires explicit applicable stage refs, not label guessing;
- missing evidence remains missing and is presented honestly;
- no new truth engine, hard-coded country facts or fabricated destination advice;
- no automatic mounting/triggering of commercial searches;
- same information architecture on mobile and desktop with accessible interaction.

## 7. Reconciliation rules

Because the branch is heavily stale:

- current `main` always wins for canonical docs, shared contracts and already-merged runtime behavior;
- do not overwrite newer `JETNITY_START_HERE.md`, `ACTIVE_WORK_STATUS.md`, roadmap, architecture, decisions or handoff truth with stale branch variants;
- remove/rewrite stale branch continuity edits instead of carrying them forward blindly;
- do not regress Flight multi-leg or 0..N multi-provider orchestration merged after the original Destination Essentials base;
- do not regress newer Account/Traveller/Trip/Safety/Seasonal/Official contracts;
- do not silently introduce new shared contracts merely to make the old implementation compile;
- if a current-main contract makes an old Destination Essentials assumption invalid, adapt the Destination Essentials implementation rather than changing the current-main contract unless the Technical Lead explicitly approves a new shared-contract change.

## 8. Hard non-scope / gates

Do NOT change or activate:

- Supabase schema/migrations/RLS/grants/roles/functions;
- Auth/session/MFA/AAL;
- account traveller registry or multi-citizenship/document truth contracts;
- provider choice/application/contact/contracts/DPA;
- provider secrets/API keys;
- paid/live provider calls;
- Production S6/HMAC/>0 budget/runtime binding;
- Commercial Provenance runtime writer/persistence allocation;
- TW-8/TW-9 Commercial Truth closure;
- Hotel or Activities provider activation;
- World Map/visited persistence;
- service worker/offline cache/push;
- public indexing/domain cutover;
- native app architecture;
- payments;
- site-wide redesign;
- homepage hero-intent issue #110;
- follow-up slice.

## 9. Required validation on the new exact head

After reconciliation and any necessary fixes, provide fresh evidence on the final exact head:

- complete changed-file list versus current main;
- targeted Destination Essentials tests;
- relevant Trip Workspace / Safety / Seasonal / Official / Readiness regression tests;
- full test suite where repository standard permits;
- typecheck;
- lint;
- Production build;
- exact-head GitHub Actions status;
- exact-head Vercel Preview evidence;
- mobile + desktop acceptance evidence for overview placement;
- console/runtime error check;
- explicit proof that no provider/DB/Auth/Commercial/Product-Owner gate was crossed;
- report current main SHA and final merge-base/ahead/behind state before handoff.

## 10. Handoff / stop

Before stopping, persist/update the slice handoff and self-review so they describe the **new reconciled exact head**, not the historical `00183a37...` head.

Final agent state:

`STOP FOR TECHNICAL-LEAD REVIEW`

The agent MUST NOT:

- mark the PR Ready;
- merge;
- start a follow-up slice;
- claim Technical-Lead PASS;
- treat old CI/Preview/self-review evidence as current.

The Technical Lead will independently review the complete reconciled diff and all exact-head gates before any Ready/Merge decision.
