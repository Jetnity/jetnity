# Jetnity Lodging Coverage Truth 1 — TASK V1
Issue #980. Branch `fix/lodging-coverage-truth-1`.
**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

## Baseline, authority and mandatory reading
Date: 23 October 2026. Parent batch: [R102 /6374289422](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6374289422). Owner expressly requested the next work and multiple Cursor agents. This is a finite assignment, not blanket follow-up authority.
Exact baseline: main **ba0725d6dd2ce3d5e170eb1eab03cedef2def1de**, tree **870c675d33895419a802ebc1f274da884a6e3351**. Operating mode NORMAL. Main PUSH CI40009901101 SUCCESS; Production dpl_9FQqZt74WzYQfYnUUFJZiuYaMV4U READY/exact main; jetnity.com separately maps to it. #975/#976/#979 are post-merge verified under6373375556. No old author is resumed.
Read JETNITY_START_HERE.md, AGENTS.md, current handoff referenced there, docs/ACTIVE_WORK_STATUS.md, newest #751/#748 material, TL operating standard, Binding Slice Precheck, Multi-Agent Slice Planning, current vision/architecture/roadmap/decisions/design/quality/continuity docs, and relevant source/tests before implementing. Live evidence wins. Do not overwrite global current state.
Requested model: **Grok 4.7 High Fast** (grok-4.7-high-fast). TL selects the previously accepted model for the newly Owner-authorized batch; historical6368365938 is not being rewritten as blanket later-task authorization. Report actual model and real Cursor session link/ID before material code; requested settings are not actual evidence. No Auto or unrelated silent fallback. Use the exact logical name below in PLAN/STATUS/SELF_REVIEW/HANDOFF and PR. Rename UI session only if a real supported capability exists; do not claim an unverified rename.

## Multi-Agent Suitability
Decision: **MULTI_AGENT** across R102; **SINGLE_WRITER** for this PR. Whole-source readiness, lodging UI and canonical interval calculation have separate write paths. Lodging lanes share only the existing unchanged public coverage/booking contract. Each has an exact-main branch and Draft PR; no unmerged cross-branch dependency.
TL integration priority: lodging UI → interval evaluator → whole-source. This is scheduling, not a change in product priority. Do not edit another lane, merge/rebase/cherry-pick another branch or rewrite history. Re-read origin/main before handoff and report drift; TL decides synchronization and fresh exact-head gates. Stop on a genuine path/contract collision.

## Protected boundaries / non-scope
No hosted Supabase/Development/Production query or write, migration, RLS/Auth/AAL/identity/role change, secrets, real account/customer data, personal browser/profile, government/provider/LLM/paid call, external contact, terms/contract acceptance, source admission, feature activation, deployment/alias manipulation or new dependency/workflow/configuration.
Normal existing CI/Preview may run from scoped branch pushes. Synthetic local computation and isolated local UI tests are permitted. No live DB/source tooling or account login. No raw private logs/archives/credentials in public evidence.
#917 denial6164202501 remains unresolved; Stage1 readback blocked, Stage2 NOT_ATTEMPTED; no retry/alternate connector/operator/manual workaround. #968 cleanup pause, #913 safety-blocked publication, #626 reserved stop, #934 Bern block, #937 pause, #957 dormancy, #585 vendor-text deferral persist. #955/#973 and older completed work are not reopened. Provider OFF; positiveVisaCells0. New recurring cost0; USD100/month ceiling unchanged.
P0: none newly established. P1#968/#748 remain unresolved independent risks, with Owner-approved ordinary-development separation. P2: this task's concrete defect plus unrelated source/hosting/privacy residuals. Preserve146 baseline lintwarnings/two existing conditional browser skips as dated limitations, not new PASS.
Global JETNITY_START_HERE/JETNITY_HANDOFF/ACTIVE_WORK_STATUS/architecture/roadmap/decisions/build-order/checkpoints are read-only for this batch. TL records any architectural decision centrally.

## Delivery, verification and STOP
Persist a concise task-owned PLAN before material edits. This TASK is immutable after dispatch; do not rewrite its contract. Use new versioned TL amendments if scope must change. Deliver task-owned STATUS, SELF_REVIEW and HANDOFF (and concise REPORT if useful).
Run focused meaningful behavioral regressions plus unchanged relevant existing tests; run typecheck/lint/build and repository hygiene checks appropriate to the final head. Full existing CI/Auth/Preview must be green on the exact final head for TL integration. A skipped/missing-secret check is not execution or PASS. Do not change test timeouts/workflows or weaken assertions to get green. Report actual failures, skips and unavailable verification.
Commit/push only this task branch. In the final PR comment report exact head/tree, freshly read main, merge-base/ahead/behind, immutable task blob, changed files, actual commands/results and CI/Preview links, actual session/model, excluded systems, remaining P0–P3 risks. Do not make an extra commit solely to quote its own final SHA; the PR comment carries final SHA.
**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE. STOP for independent Technical-Lead review.** Agent self-review is never TL PASS. Immediate review fixes stay with this same writer/session; each new head invalidates prior exact-head gates.

## Objective and independently read evidence
Fix the existing accommodation panel's truth presentation and booking toggle, using existing canonical contracts. No new feature or evaluator.
- components/trips/UnterkunftBestand.tsx blob7cac9175bd2ea3f5258786c154782896328bb983: heading uses bekannt+numeric totals and overwrites unknown summary; gaps rendered as definitive missing nights; action uses coverage.status instead of item.bookingStatus.
- lib/trips/naechte-abdeckung.ts blob2d8bc61ccac73b20ebbd0a90f58ee22d65fe7ec0: known14-night trip plus undated stay yields bekannt=true,total14,covered0,statusunknown, summary “Unterkunftsstand noch unklar”. This is intentional and covered by the existing “Stay ohne Daten ... behauptet keine0/14” test.
- lib/trips/buchung.ts blobdd6b76fb68bc9721d1f345eb66ef18a14868cbff supplies istGebucht/kannBuchungMarkieren; booking status is stored user confirmation, not date completeness or provider confirmation.
- lib/trips/arbeitsbereich.ts blob884763a0ad43aa2d6f14f9b14ccae90b0f690d59 already treats unknown stays as unbestimmt.
- components/trips/BuchungsSiegel.tsx blob6598f90cb5827a3c7f05d4da1c3bd03d411bad70 is read-only and reusable.

## Exclusive write allowlist
1. components/trips/UnterkunftBestand.tsx
2. NEW lib/trips/lodging-coverage-truth-1.test.ts
3. NEW docs/JETNITY_LODGING_COVERAGE_TRUTH_1_{PLAN,STATUS,SELF_REVIEW,HANDOFF,REPORT}_2026-10-23.md as needed; this immutable TASK already exists.
No other runtime file or shared helper. Existing lib/trips/unterkunft-manuell.test.ts is a useful rendering/callback test pattern, read-only. No new test dependency. If the existing harness cannot prove behavior, report the precise limitation before widening ownership.

## Acceptance criteria
B01. Missing, partially missing, invalid or reversed stay dates on a known trip preserve visible unknown accommodation coverage. No definitive0/N or full-coverage claim can override canonical unknown.
B02. Mixed valid and unknown stays remain visibly uncertain. Suppress or explicitly qualify provisional gaps so the UI never asserts “N Nächte fehlen” as a definitive whole-trip fact while undated stays exist. Reuse canonical counts; do not invent dates or alter evaluator outputs. Choose concise German copy consistent with existing design.
B03. Use existing stored-item booking truth for action label/direction: a booked stay gets “Buchung korrigieren” and exact callback(item.id,false), even with unknown dates; an unconfirmed stay gets “Als gebucht markieren” and callback(item.id,true).
B04. Stored booking confirmation may display “Gebucht” independently of unknown date coverage. Preserve clear missing-date feedback; a booking badge must not imply complete night coverage, provider validation or payment success. No inferred booking from selected/coverage state.
B05. Valid dated selected/booked stays, empty inventory, fully known gaps, partial/full coverage and out-of-period stays retain accurate presentation. No callback means no booking action; existing kind eligibility/loading/error handling/accessibility remains intact.
B06. Tests exercise actual rendered text and real button handler callbacks, not source-string assertions or duplicated ternaries. Cover booked/unconfirmed unknown, mixed known/unknown, invalid/reversed, valid partial/full, absent callback and exact target id/boolean. Reuse existing isolated rendering approach. A stub/render test is not claimed as browser/real-device evidence; no layout redesign means no new real-device gate is invented.
B07. Do not mutate Trip/items, date values, amounts, booking helpers, server actions, schema, storage or public types. Existing user-confirmed booking semantics remain.
B08. Existing canonical accommodation, manual accommodation and direct-preview regressions stay green unchanged. New regression must demonstrably fail the old UI behavior and pass the change.

## First executable step
Read relevant code/tests and publish your actual session/model ACK, then a concise PLAN and implement only this file-level repair. Same-session fixes only after scoped TL findings.