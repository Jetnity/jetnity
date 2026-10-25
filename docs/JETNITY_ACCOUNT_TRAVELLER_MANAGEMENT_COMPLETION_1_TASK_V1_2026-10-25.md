# Jetnity Account Traveller Management Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Do not edit this TASK or expand ownership by inference. Request a named TL addendum if a real boundary is missing.

## 0. Authority, identity and exact baseline

- R106 lane **A**, tracking **#1005**, finite batch/precheck [#1003](https://github.com/Jetnity/jetnity/issues/1003), canonical live index [#751](https://github.com/Jetnity/jetnity/issues/751).
- Branch **`feat/r106-account-traveller-management-1`**; one genuine Cursor author: **Jetnity Account Traveller Management Completion 1 — Cursor Generation 1**.
- Requested **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and real session ID/link. No Auto or silent fallback. If unavailable, STOP. Supported visible UI rename is best effort; report actually performed vs unavailable honestly. A self-attestation is not independent TL UI observation.
- Base actual main **500fbe40c8c8a70a0fe0d291782289f809d5d5b3**, tree **883e72fdab1411968b74dfaf879c4eea46891b9a**, machine mode **NORMAL**. Re-read live state. Never silently substitute a base or overwrite another writer.
- Owner expressly requested several substantial tasks for Trip Workspace/Account/Admin with autonomous ordinary platform actions. This is a finite new R106 batch; R105#999/#1001/#1000/#1002 is fully POST-MERGE PASS and its authors remain STOP. No new Owner confirmation is required for this scoped work.

## 1. Startup and PLAN-only gate

Read JETNITY_START_HERE.md, AGENTS.md, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, current handoff and docs/ACTIVE_WORK_STATUS.md, current#751 and R106#1003, multi-agent planning/operating standards, binding slice precheck/continuity gate, V1 binding build order and DoD, three-phase strategy, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Logic/Continuity sources and actual code/tests. Historical dated status does not override live evidence.

**First delivery is PLAN ONLY:** commit exactly `docs/JETNITY_ACCOUNT_TRAVELLER_MANAGEMENT_COMPLETION_1_PLAN_2026-10-25.md`, then post name/model/session, main/head/merge-base/ahead/behind, source-confirmed gaps, design/ownership, state transitions, meaningful proof matrix, costs and unknowns. Seed TASK plus this PLAN must be the **entire diff** at this gate. No product/test implementation yet. **STOP for independent TL plan review.** TL will authorize this same session; no extra Owner question. A dispatch mention does not skip this stop.

## 2. Product outcome and source gap

Complete all existing Account Traveller Registry interactions as a coherent management workflow. Existing CRUD, Registry/Trip separation, Account security/export/delete and R105 booking folder are already implemented; do not rebuild them or treat old audit plans as current gaps.

AccountReisende (blob f5102891b3567c1284175deded02363a46d3871a)48–61 clears the current creation form after await; AccountReisendeKarte (6528accaf97fbf65029617f1f789966d289603fd)113–130 resets current document/citizenship drafts after any success. Current close/reopen/switch paths and uncaught rejection can affect a newer editor. These are source findings; demonstrate real wiring before claiming reproduction/fix.

## 3. Exclusive runtime/test allowlist

- `components/account/AccountReisende.tsx`.
- `components/account/AccountReisendeKarte.tsx`.
- `lib/traveller/account-registry-copy.ts`.
- New `lib/traveller/account-registry-workflow.ts`, `lib/traveller/account-registry-workflow.test.ts`, `lib/traveller/account-registry-workflow-ui.test.ts`.
- Optional new `components/account/useAccountRegistryWorkflow.ts` if needed to keep actual state ownership outside individual temporary editors; no generic abstraction.
- Existing `lib/traveller/account-travellers-premium-registry-ux-1.test.ts` and `lib/traveller/account-registry-ui.test.ts`: only update genuinely superseded UI-source assertions while retaining ownership/truth/null/limit behavior.
- Owned synthetic mounted runner/scripts/evidence/docs below.

Frozen: `account-registry-aktionen.ts`, data, schema/input, persistence/mapping/domain/Trip-orchestration contracts; all account routes/layout/security/export/delete/bookings; shared LandFeld; RegistryReiseUebernahme and **all Trip components**; types; migrations/RLS/Auth; app navigation/global styles/config. No new passport number, DOB, MRZ, scan, health data, default citizenship/document or automatic Registry→Trip/Guest import.

## 4. Binding interaction and outcome semantics

1. Cover all eight existing actions: traveller create/edit/delete, citizenship create/delete, document create/edit/delete. Keep current limits, labels/null semantics and validation. Distinct equal labels are distinct IDs; never identify by label/index. Preserve nullable citizenship and existing document association. Eight citizenships/twelve documents are creation limits; editing at limit remains usable.
2. Give each dispatched operation a stable local intent/request identity, actual target ID(s), captured payload and editor/draft generation. Synchronous duplicate-intent protection must work before the next render. A pending action must not be dispatched twice.
3. A late success/error/rejection from A cannot clear, close, announce into or focus newer draft/target B. Switching, closing/reopening, cancellation, refreshed props, removed target and unmount must be explicit. Closing UI is not server cancellation. Do not persist sensitive drafts or create a new storage contract.
4. Catch rejected Promises and preserve the appropriate draft. Inline error/pending/result feedback must remain associated with its operation; do not leak old card errors into another active editor through global status.
5. **The existing Server Actions generate create client_ref server-side and return {ok:true,wert:null}, not a created ID.** A confirmed ok response may say the submitted operation was saved; refreshing/observing the current list is a distinct step. No invented row identity, title-based match, forced selection or exactly-once claim.
6. Rejection/lost/otherwise ambiguous transport outcome confirms neither execution nor nonexecution. Preserve the intent/draft as unconfirmed; offer explicitly triggered **read-only refresh**, never automatic write retry. A later matching label/field/new row is not proof that this create attempt caused it. Absence is not proof a pending server write cannot still commit.
7. After a confirmed save but failed/missing list refresh, say saving was confirmed and current list is not yet loaded; retry reads only. For known-ID update/delete, observing desired current values/absence is an observed state, not proof of which competing writer caused it. Do not claim fresh props or a completed read merely because router.refresh() was called/returned.
8. A structured {ok:false,meldung} is an error, not blanket evidence that nothing was stored; preserve draft and avoid invented rollback claims. Client validation before dispatch is distinguishable from a dispatched mutation. Any conscious repeat after unknown outcome must be explicit, follow reading current state, and disclose possible prior execution; it is a new user decision, never guaranteed duplicate-free. A read alone must not silently unlock a blind automatic retry.
9. Existing read errors (including500/503) must remain distinct from a genuinely empty registry. Add a usable read-only retry using existing router refresh, with honest pending/observed-readback state and draft preservation. No new server API, no extra Supabase query.
10. Focus returns to a meaningful connected visible control after cancel/delete or row disappearance, without jumping into another/closed editor on late completion. Current props are canonical stored data; do not overwrite dirty drafts without explaining a conflict.

## 5. Acceptance matrix

Prove all eight actions with pending, confirmed error, rejected/ambiguous outcome, successful response and delayed/failed readback; duplicate activation; A→B draft/target switch; close/reopen during request; target disappearance; props update; same labels/different IDs; null citizenship; create limits and edits at8/12.

Actual mounted deferred-promise tests must show that late success cannot clear new draft, late rejection cannot announce/focus another card, and read retry never resends a write. No created-ID inference from label equality. Include explicit delete confirmation/target naming and useful focus, empty vs read-failure recovery,320/root200%, long labels, keyboard and document editor interactions. Preserve existing registry data/validation/persistence and Trip separation regression tests.

## Delivery, independent proof and stop

- Own docs only: `docs/JETNITY_ACCOUNT_TRAVELLER_MANAGEMENT_COMPLETION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`. TASK V1 stays byte-identical.
- Own disposable local synthetic harnesses: `scripts/account-traveller-management-completion-1/**`; own new evidence: `docs/evidence/account-traveller-management-completion-1/**`. No deployed test route, personal session/browser or production storage. Preserve prior evidence; do not overwrite an earlier failed run.
- Prove actual mounted production-component async/interaction/focus behavior and genuine domain functions. New reducer tests/source-text patterns alone do not prove wiring. Use deferred promises, controlled clocks where relevant, deterministic canonical props and actual project CSS. Record commit/source digests, commands/exits/case counts, fixture/stub boundaries, browser/version/viewports, root text and motion settings.
- UI matrix includes representative320/360/390/768/1280px,320/root32(200% root text), keyboard and reduced motion; long content and empty/error/pending states. Do not hide root/page overflow. Distinguish local CSS/font simulation from native zoom, real devices or screenreaders.
- Run meaningful focused and existing regression tests, TypeScript, lint, all five hygiene guards and production build. Preserve mandatory native full App/Auth/Vercel CI. No dependencies, package/lockfile, global styles/config, workflow, timeout, gate or suppression changes. Existing7213-test baseline has2explicit conditional browser skips and181lint warnings; report actual results honestly, no skipped test as PASS. Eleven advisories remain untriaged, outside scope.
- Synthetic component/adapter evidence is **not** hosted Account/Next-router/Supabase/RLS/Production/launch proof. No hosted DB read or mutation is needed in this UI task. Diff must keep frozen DB/Auth contracts untouched.
- Final HANDOFF: exact main/base/head/mergebase/ahead/behind; real model/name/session; complete diff/path ownership; P0/P1/P2/P3 findings; exact executed proof and NOT VERIFIED; CI/Preview if actually observed; DB/Production/provider/cost scope; remaining risks and next actor. No new ongoing runtime cost or provider/model call is introduced.
- CHANGES REQUIRED is fixed by this same author/session. Every head change invalidates earlier exact-head gates. Self-review is never TL PASS. Deliver and **STOP** for independent TL review. **Never Ready, merge, close the tracking issue, write main, create another session, start a follow-up or modify a sibling branch.**

## Parallel ownership and integration

Decision **MULTI_AGENT**, finite R106 T/A/O, one branch/PR/writer per lane. T owns only personal Trip preparation and named callback/storage-read boundaries; A owns Account Registry interaction; O owns the two read-only Admin report boards. Existing shared business/server/Auth/provider contracts remain unchanged. Slice helpers are not a generic framework.

Integrate **O → A → T**, one independent TL acceptance at a time. No sibling cherry-pick/merge. After main advances, await TL's explicit normal-main sync instruction in this same session, then full re-gating. Global START_HERE/HANDOFF/ACTIVE/ROADMAP/central ADR/build-order/mode/governance files are TL-only. Propose reconciliation in your own handoff.

## Standing exclusions

#985/#982 scoped HOLD: no retry, rephrase, reroute, substitute review or held-implementation inspection. #917 denied hosted readback STOP: no alternate connector/query/operator/manual SQL/reapply; hosted state unknown, Stage2 NOT_ATTEMPTED, Production excluded. #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 reserved STOP; #937/#936 PAUSED; **Bern#934 HARD-BLOCKED**; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Historical Drafts unchanged.

No hosted database action, migration/RLS/grant/function/Auth/AAL/identity change, credential/secret access, legacy Preview inventory/probe, protection bypass, provider/model/payment activation, paid runtime provider calls, contract/legal/launch/indexing change. Prelaunch/noindex and USD100 monthly ceiling persist. Existing guest whole-trip/cross-tab non-atomic limitations remain real residuals, not solved or downgraded by local lifecycle work. Unexpected scope or denied action: report to TL, never route around.
