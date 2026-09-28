# Admin F Reconciliation 1 — Binding Task v1.1

Date: 2026-09-28
Issue: #605
Branch: `docs/admin-f-reconciliation-1`
Baseline: `main@6d5299f73e8da1b8eec7604686e5d272b70fd256`
Cursor-Agent: **Jetnity admin F reconciliation 1**, Generation **1**
Required model: **Grok 4.7 High Fast**, **no Auto**, no substitution.
Status at task seed: **PREPARED / NOT DISPATCHED / NO CURSOR SESSION CLAIMED**.
Technical Lead exclusively controls Ready / Merge.

## 1. Problem and scope decision

The Product Owner requested reconstruction before implementing the allegedly open Admin-F command palette. Reconstruction disproved that starting assumption. PR #545 already implements the requested local authorized-area palette. The pre-#545 remaining-build-map F row and current handoff navigation can mislead the next TL into duplicate work.

Do not rebuild the palette, add a second command framework, or invent records search. This task verifies the existing bounded feature and reconciles continuity. A concrete runtime defect must first be reported to the TL with a minimal reproduction and proposed scope amendment; runtime edits are not authorized by v1.

Read AGENTS.md, operating mode, TL/Cursor standard, multi-agent operating system, binding-slice-precheck, quality/continuity/independent-review standards, vision, relevant Admin architecture, #545 task/reviews/closure and current source. Historical comments are evidence at their date, not new authority.

## 2. Independently reconstructed baseline

- Machine mode NORMAL.
- GitHub main CI run 36468818504: completed/success, exact baseline SHA.
- Vercel Production `dpl_89HvRDeHh7xqkTagaMb3xGNTekDN`: READY, exact baseline SHA, alias jetnity.com.
- Main protection ruleset 21875372 active; no bypass actor; required Typecheck/Lint/Build, Auth and Vercel; resolution required. Do not modify it.
- Open PRs at reconstruction: historical Drafts #28/#39/#40/#50/#52 only. Do not resume or close them.
- Prior ChatGPT TL chat is idle. A separate old local AGB checkout has uncommitted changes and is left untouched.
- No GitHub-evidenced overlapping runtime writer found. Direct Cursor active-session inventory is pending login, so absolute no-writer claims are not yet warranted.
- PR #545 closed/merged 2026-09-22; accepted head `43720a65ca5296e2009158ccd0bce6b30796ca95`; merge `8fcccd6475f41703bd2a31deecb3067391f330b4`.
- Independent historical TL PASS review 5281481739; post-merge verification https://github.com/Jetnity/jetnity/pull/545#issuecomment-5781083393.
- On current baseline, TL reran 24 existing navigation/search/honesty tests: 24 pass, 0 fail. Existing local dependencies reused; not a fresh npm-ci, full build, hydrated browser or signed-in Production proof.
- Exact Git diff against accepted #545 head is empty for AdminNavigationSearch, AdminTopbar, admin shell, navigation.ts, navigation-search.ts, ehrliche-zustaende.ts, search tests and the hydrated harness. The requested feature is still the accepted implementation.
- `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` is absent on current main (older unmerged audit material references it). Do not create it or import historical Draft #40 merely to satisfy an old pointer.
- Prior #545 actual-component harness passed 12 cases including R1 viewport clipping, R2 hover focus, R3 prefetch false and R4 outside dismissal. This is historical Chromium harness evidence, not today's authenticated/physical-device acceptance.

## 3. Dispatch preconditions / one writer

Before substantive agent work, TL verifies the Cursor session inventory and explicitly selects Grok 4.7 High Fast. Report actual model/session URL and logical name. If the model cannot be selected/confirmed, STOP; never use Auto or substitute another model.

Fresh generation for this separate reconciliation; do not restart completed #545 or #603. Exactly one writer on this branch. If a collision exists, report and stop before writing. Agent gets only the named documentation ownership below. No other global-state writer may run concurrently.

## 4. Acceptance criteria

1. Trace AdminTopbar -> shared AdminNavigationSearchProvider -> current session -> filterAdminNav(ADMIN_NAV_ITEMS) -> ready-only results, and unchanged server route guards.
2. Establish the actual existing UX: desktop/mobile triggers, Cmd/Ctrl+K, literal query + static aliases, keyboard selection, Escape/outside dismissal, focus restoration, drawer/foreign-modal coordination, viewport containment and prefetch=false.
3. Distinguish UX filtering from server authorization; never claim filtering grants or enforces permissions.
4. Re-run existing focused tests and, where the environment supports it, the existing actual-component harness. Preserve historical evidence files; fresh proof goes under this task's evidence directory. Adapt only an uncommitted disposable harness copy when local output paths are machine-specific. No claimed pass for skipped/blocked tests.
5. Correct the Admin-F remaining-implementation/disabled-placeholder premise in the current navigation documents using explicit dated supersession and #545 evidence. Preserve the older report as an identifiable historical snapshot rather than silently rewriting all prior conclusions.
6. Persist the new user direction: safe provider-independent useful residuals may be considered while external replies are pending, after fresh precheck. This does not authorize duplicate Admin F, Phase-2 bulk rollout, new API/data/permission contracts or any special gate.
7. Separate what is runtime-built, historically verified, newly rechecked, and still unverified. Authenticated Admin/physical device walkthrough remains unverified unless actually performed without mutations.
8. Deliver a concise next-candidate assessment from live source. Admin E privacy/RLS, AP-8 identity/preferences, AP-9 product usefulness, AP-11 consent, AP-12 entitlement/money boundaries must not be guessed away. No next slice dispatch by Cursor.
9. Freeze exact head, report main/merge-base/ahead/behind, CI/Auth and Vercel Preview. New head invalidates previous gates.

## 5. Exclusive allowed writes

- `docs/ADMIN_F_RECONCILIATION_1_{STATUS,HANDOFF,SELF_REVIEW,REPORT}_2026-09-28.md`
- `docs/evidence/admin-f-reconciliation-1/**`
- Dated Admin-F correction only in `docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md`
- Targeted current pointers / dated supersession in `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`, `ROADMAP.md`
- Targeted dated Admin-F implementation note in `docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_EVIDENCE.md` where the actual stale F claim is present.

No AGENTS, governance, operating-mode, CI, dependencies, runtime, Auth, roles, RLS, migration or DB changes. No global cleanup.

## 6. Hard boundaries

No DB mutation (including Development proofs), Production configuration/migration/deploy action, provider call/selection/credential/contract, payment, public indexing, real-user/record search, sensitive-data collection, new service or recurring cost. No query history/telemetry. No model use in Jetnity runtime. Cursor model usage for this approved task only.

KAYAK/Sherpa/IATA remain responses pending. No provider selected. #585 deferred. Finding 5.2 and existing release/security gates remain open. Do not copy old HOLD or erased-account activation prose into current truth.

## 7. Evidence, independent review and STOP

Documents must link exact PR/commit/check evidence. Re-fetch main and PR before final freeze. Historical statuses are not current PASS. Do not run scripts that mutate external systems. Docs-only checks plus the existing targeted navigation tests are appropriate; required GitHub CI/Auth/Vercel still apply.

Write status, handoff, self-review and report. Identify any blocker, unresolved finding, test limitations, actual model/session and exact next unfinished step. A session footer alone does not prove model or completion.

**Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
