# Jetnity — Trip Workspace & Account Revalidation 1 — Binding Task

Date: 21 September 2026
Issue: #507
Branch: `audit/v1-trip-account-revalidation-1`
Verified baseline: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`
Agent: **Jetnity V1 trip account revalidation 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

## 1. Product-Owner reaffirmation and useful outcome

The Product Owner explicitly reaffirmed the previously promised Trip Workspace + Account revalidation and parallel preparation of the first Intelligent Admin / Copilot Pro foundation. The visual UX/device audit is additional; it must not silently replace functional completeness work.

This task is the functional revalidation half. Deliver an evidence-backed account of what the current trip/account integration actually does, what remains missing, and the first one-to-three bounded repairs that can responsibly be implemented. Do not deliver another generic catalogue of old issues or rewrite finished features.

## 2. Live reconstruction and scope precedence

Read:
- operating mode, JETNITY_START_HERE.md, AGENTS.md and the TL/Cursor operating standard;
- docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md and V1 Definition of Done / Release Readiness Gate;
- the existing Trip Workspace function-by-function and final-intelligence audit mandates;
- current account implementation plan together with newer AP-7/AP-8/AP-9/AP-10 closure evidence where present;
- merged V1 Live Gap Reconciliation #497 and Core Regression Hunter #498;
- closed #500 Auth lookup, #502 mobility ordering and #504 security taxonomy fixes.

Live mode is NORMAL. #492 HOLD closure, #487 architecture and #494 local proof are merged; stale startup prose does not re-park them. #494 post-merge record is PR comment 5762848189. Its local proof is NOT persistent event ingestion; finding 5.2 and gate G remain open.

The newer V1 build order governs launch requirements. The older broad roadmap does not make all AP-1–AP-12 or full Admin D–K a V1 prerequisite. Do not start TW-8/TW-9, real providers, new consent/identity/retention or a generic provider foundation.

## 3. Multi-Agent Suitability

Overall: MULTI_AGENT with disjoint deliverables. This branch: SINGLE_AGENT writer.

- PR #506 / Issue #505 owns rendered visual/device inspection and screenshots under docs/evidence/v1-visual-ux-device-audit-1/. Read its findings as clearly labelled unaccepted evidence; do not copy/re-own its documents or repeat the entire visual audit.
- This issue #507 owns functional Trip Workspace/Account integration evidence only.
- Issue #508 owns the read-only Intelligent Admin foundation specification only.
- ChatGPT TL owns integration, prioritization and subsequent repair dispatch.

No agent edits shared runtime, tests, schemas, global continuity, or another branch. No sibling branch merges. Read-only overlap is allowed; discovery does not confer write ownership.

## 4. Targeted inventory — current behavior, not stale claims

For each relevant capability identify the implementation seam, accepted contract and evidence class:
1. Trip create, guest local state and guest-to-account adoption/retry.
2. Ordered stages, repeated destinations, day/stage associations, timeline and mobility.
3. Account traveller registry -> trip-specific snapshot, multiple peer citizenships/documents, explicit adoption/update semantics.
4. Route/date/traveller/credential changes -> readiness, transit, selected items and stale/recheck consequences.
5. Account home, trip groups, archive/restore and recovery without loss or duplicate truth.
6. Existing security/session/password/recovery, settings and scoped data export.
7. Account preferences/favourites/bookings/notifications/entitlements: find what actually exists; do not label all planned phases missing from memory.
8. Legal/consent/deletion/retention/SMTP and live provider boundaries: reuse #497 classifications, only update with concrete newer evidence.

Statuses must distinguish IMPLEMENTED_VERIFIED_LOCALLY, IMPLEMENTED_SOURCE_ONLY, PARTIAL, BLOCKED_ACCESS, PO_GATED, PHASE_2_3, and NOT_IMPLEMENTED. These are review classifications, not a new product state model. A stub, self-review or old merge is not a current behavior PASS.

## 5. Sequential checks

Use existing safe local tests/fixtures and temporary synthetic probes where needed. At least assess:
- create a multi-stage trip -> reorder -> associate day/item -> derive mobility -> change dates;
- explicit registry materialization -> change registry later -> confirm trip snapshot does not silently mutate;
- multiple citizenship/document options -> route/transit change -> stale/unknown/recheck semantics, never a preferred/default passport;
- guest draft -> adoption -> retry/failure -> retained facts and ownership;
- archive -> restore -> concurrency/revision/error behavior;
- unavailable auth/data/provider -> honest recovery, not empty/healthy/not_required.

For each record whether it was actually executed, only traced in source or blocked. Existing local unit tests do not establish authenticated E2E, real database/RLS or Production proof. No remote signup, login/factor mutation, account deletion, provider/model call or real-user data is authorized. Synthetic guest data in disposable local state is allowed; do not change audited runtime to obtain a result.

Do not create an alternative QA framework. Temporary probes stay outside committed product files; evidence may include bounded synthetic inputs/results and the exact commands used.

## 6. Findings and implementation-ready next steps

Classify FACT / INFERENCE / RISK / RECOMMENDATION and P0–P3. Each finding needs exact baseline/source symbol, violated contract, reproduction or source reasoning, user/data/truth impact, confidence and smallest correction. Distinguish a newly reproduced defect from a known gate or already fixed historical issue.

For the first one-to-three useful next repairs include:
- user outcome and concrete acceptance cases;
- exact proposed file ownership;
- contracts that must not change;
- dependency on #506 visual findings or #508 admin foundation, if any;
- relevant PO gate, or evidence that none is crossed;
- V1 priority versus later-phase enhancement.

No endless audit chain. If no new fix is justified, say so and name the actual external dependency. Do not invent work to fill a quota. Findings are not implemented in this slice.

## 7. Allowed deliverables

Only:
- this TASK for a justified dated amendment;
- docs/V1_TRIP_ACCOUNT_REVALIDATION_1_REPORT_2026-09-21.md;
- docs/V1_TRIP_ACCOUNT_REVALIDATION_1_NEXT_SLICES_2026-09-21.md;
- docs/V1_TRIP_ACCOUNT_REVALIDATION_1_STATUS_2026-09-21.md;
- docs/V1_TRIP_ACCOUNT_REVALIDATION_1_HANDOFF_2026-09-21.md;
- docs/V1_TRIP_ACCOUNT_REVALIDATION_1_SELF_REVIEW_2026-09-21.md;
- bounded JSON/text evidence in docs/evidence/v1-trip-account-revalidation-1/.

No app/, components/, lib/, tests, styles, scripts/db/, package.json/lockfile, supabase/, workflow, operating-mode, global continuity or sibling evidence edits. No sensitive evidence in this public repository. Known global continuity drift is a separate TL-owned follow-up, not permission to edit ACTIVE_WORK_STATUS.

## 8. Gates and stop

Record exact main, audited product SHA, branch/document head, merge-base/ahead/behind, actual safe tests, omitted tests, review threads, agent logical name/generation/model/session and CI/Preview on frozen head. Use current documentation before relying on unfamiliar platform behavior; never infer a database apply from a READY deployment.

Freeze after substantive deliverables. Final exact-head CI/Auth/Vercel IDs belong in a PR comment, not an additional evidence-only commit. If main moves, report its delta; do not automatically invalidate unrelated already-bound evidence or perform a repeated rebase loop. Integrate once at TL's chosen final review boundary.

STOP FOR TECHNICAL-LEAD FUNCTIONAL REVIEW.
No Ready. No merge. No repair implementation. No automatic follow-up.
