# Jetnity Admin Operations Evidence Lifecycle Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Do not edit this TASK or expand ownership by inference. Request a named TL addendum if a real boundary is missing.

## 0. Authority, identity and exact baseline

- R106 lane **O**, tracking **#1004**, finite batch/precheck [#1003](https://github.com/Jetnity/jetnity/issues/1003), canonical live index [#751](https://github.com/Jetnity/jetnity/issues/751).
- Branch **`feat/r106-admin-operations-evidence-lifecycle-1`**; one genuine Cursor author: **Jetnity Admin Operations Evidence Lifecycle Completion 1 — Cursor Generation 1**.
- Requested **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and real session ID/link. No Auto or silent fallback. If unavailable, STOP. Supported visible UI rename is best effort; report actually performed vs unavailable honestly. A self-attestation is not independent TL UI observation.
- Base actual main **500fbe40c8c8a70a0fe0d291782289f809d5d5b3**, tree **883e72fdab1411968b74dfaf879c4eea46891b9a**, machine mode **NORMAL**. Re-read live state. Never silently substitute a base or overwrite another writer.
- Owner expressly requested several substantial tasks for Trip Workspace/Account/Admin with autonomous ordinary platform actions. This is a finite new R106 batch; R105#999/#1001/#1000/#1002 is fully POST-MERGE PASS and its authors remain STOP. No new Owner confirmation is required for this scoped work.

## 1. Startup and PLAN-only gate

Read JETNITY_START_HERE.md, AGENTS.md, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, current handoff and docs/ACTIVE_WORK_STATUS.md, current#751 and R106#1003, multi-agent planning/operating standards, binding slice precheck/continuity gate, V1 binding build order and DoD, three-phase strategy, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Logic/Continuity sources and actual code/tests. Historical dated status does not override live evidence.

**First delivery is PLAN ONLY:** commit exactly `docs/JETNITY_ADMIN_OPERATIONS_EVIDENCE_LIFECYCLE_COMPLETION_1_PLAN_2026-10-25.md`, then post name/model/session, main/head/merge-base/ahead/behind, source-confirmed gaps, design/ownership, state transitions, meaningful proof matrix, costs and unknowns. Seed TASK plus this PLAN must be the **entire diff** at this gate. No product/test implementation yet. **STOP for independent TL plan review.** TL will authorize this same session; no extra Owner question. A dispatch mention does not skip this stop.

## 2. Product outcome and source gap

Make both existing read-only operations views dependable through a complete **load → understand evidence → age → explicitly refresh → recover** journey. Preserve all existing evidence boundaries; no new dashboard, provider integration or billing product.

SystemHealthBoard (blob bddb6b4fefbe1370ab9721e525a22dd8647049ec) and ProviderOpsBoard (4c16a0d57aaa387247575da8b69bfb49fd4e9360) currently use one-time initial state, blind JSON casts and frozen freshness. State-only pending guards and unowned results leave prop/endpoint/deactivation/unmount gaps. These are source findings, not yet mounted reproductions.

Read ADR-0159/0162 and existing report types/freshness/bewertung, lib/admin/ladezustand.ts and security/refresh-reihenfolge.ts. Existing helpers are examples/contracts, not permission to change Security or collectors.

## 3. Exclusive runtime/test allowlist

- `components/admin/system-health/SystemHealthBoard.tsx`.
- `components/admin/provider-ops/ProviderOpsBoard.tsx`.
- New `components/admin/operations/useOperationsReport.ts`.
- New `lib/admin/operations-read-lifecycle.ts`, `lib/admin/operations-read-lifecycle.test.ts`.
- New `lib/admin/operations-report-validation.ts`, `lib/admin/operations-report-validation.test.ts`.
- New `lib/admin/operations-evidence-lifecycle-ui.test.ts` for actual mounted behavior if the existing native test setup supports it; otherwise put the actual mounted runner under the owned scripts prefix and keep meaningful pure tests above.
- Existing `lib/admin/system-health/system-health.test.ts` and `lib/admin/provider-ops-board/provider-ops-board.test.ts`: only genuinely superseded UI-source expectations may change; retain status/freshness/truth/auth assertions.

Frozen: all routes/pages/API handlers/collectors; `lib/admin/ladezustand.ts`; both existing types/freshness/bewertung modules; OperationsEvidence; Security/Analyst/Admin shell; provider/S1/cost/model-usage contracts; Auth/capability/AAL/RLS/migrations. No network polling, server cache change, management token, write action or provider toggle.

## 4. Binding lifecycle and evidence semantics

1. Runtime-validate every incoming report, including safe handling of initial/new props, before rendering/committing it. Required known card IDs must be complete/unique; required fields/status/freshness enums valid; checks valid/unique within card; metadata only existing string|null shape; writeActions an actually empty array. Invalid2xx is an error, not empty/healthy. No default cards or blind casts. Finite nonnegative age or null, positive finite TTL, appropriate timestamp validity; do not accept payload-extended TTL beyond the existing contract.
2. Keep the raw valid report and its checkedAt/sourceUpdatedAt/status/source/proves/doesNotProve immutable. Parent and child age independently from their supplied original ages. Existing wendeEvidenceAlterAn uses parent checkedAt for children and recomputes freshness: it may be reused only as an additional conservative downgrade, never to rejuvenate original child age, unknown or stale.
3. Local elapsed time is monotonic per accepted report; elapsed time must not decrease on wall-clock rollback. Account for sleep/tab return and forward wall time; unresolved/invalid time is non-green. Original unknown stays unknown; original stale stays stale; only originally fresh evidence within its existing TTL remains fresh. Preserve existing **ageMs > ttlMs** stale boundary. Future timestamps must not become fresh via Math.max(0,...). A newly accepted authoritative report may establish a new age anchor; a render/tick/failed request cannot. Local aging must cause zero remote reads.
4. Use the existing read/error contract `lib/admin/ladezustand.ts`, not a second ad-hoc global loader. Preserve HTTP401/403 at the response boundary even when JSON is invalid (the shared helper's result does not retain status). Only checked plain error text or controlled fallback is shown.
5. Scope request authority to component/source generation, endpoint, props/revision and refresh permission; use synchronous duplicate-intent protection. Ignore superseded success/error/finally after source replacement, permission deactivation, unmount or newer accepted read. Abort is best effort, not proof that a response cannot arrive. Define initial/new-prop precedence explicitly; old/unmodified props must not clear a later access denial.
6. One explicit refresh intent triggers at most one existing GET(no-store). No interval/network polling or extra background endpoint. Disabled refresh cannot start a request.
7. Current authoritative401/403 suppresses protected detail cards and displays existing server-denial meaning, without changing authorization. A stale denial cannot close a newer valid result; stale success cannot reopen a newer denial. A later permitted valid read may recover. Temporary network/503/invalid payload may retain prior valid report only as clearly historical/unconfirmed, still aging.
8. Preserve truth: app-process success is not Deployment health; airports read is not Supabase platform health; unconfigured Vercel/GitHub/Infomaniak stays so; provider parent foundation_only is not live; kill-switch/cost-guard foundation is not global enforcement; empty model usage is not0USD; incomplete cost coverage/30day and200row existing limits remain explicit.

## 5. Acceptance matrix

Mounted tests for both real boards: initial valid/invalid props; new canonical props; endpoint change; permission disable/reenable; unmount; rapid double activation; pending; out-of-order success/error/finally; rejected fetch;503;401/403 with both JSON and malformed bodies; invalid2xx(null,array,{},missing/duplicate IDs,invalid enum,nonempty writeActions,bad metadata/time/age/TTL). Newer denial→older success and newer success→older denial must both pass.

Controlled-time proof: before/exactly/after each existing TTL, independent older child, unknown→helper-fresh forbidden, stale never rejuvenates, rollback, forward jump, tab return and future timestamps. Show zero timer-initiated fetches and no age-anchor reset on errors/rerenders. Long evidence, accessible loading/error/denial announcements, keyboard refresh and responsive layout require actual component/CSS evidence.

## Delivery, independent proof and stop

- Own docs only: `docs/JETNITY_ADMIN_OPERATIONS_EVIDENCE_LIFECYCLE_COMPLETION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`. TASK V1 stays byte-identical.
- Own disposable local synthetic harnesses: `scripts/admin-operations-evidence-lifecycle-completion-1/**`; own new evidence: `docs/evidence/admin-operations-evidence-lifecycle-completion-1/**`. No deployed test route, personal session/browser or production storage. Preserve prior evidence; do not overwrite an earlier failed run.
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
