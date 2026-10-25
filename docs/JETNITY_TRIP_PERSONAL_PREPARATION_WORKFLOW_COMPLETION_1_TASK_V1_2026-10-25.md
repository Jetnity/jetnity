# Jetnity Trip Personal Preparation Workflow Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Do not edit this TASK or expand ownership by inference. Request a named TL addendum if a real boundary is missing.

## 0. Authority, identity and exact baseline

- R106 lane **T**, tracking **#1006**, finite batch/precheck [#1003](https://github.com/Jetnity/jetnity/issues/1003), canonical live index [#751](https://github.com/Jetnity/jetnity/issues/751).
- Branch **`feat/r106-trip-personal-preparation-workflow-1`**; one genuine Cursor author: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**.
- Requested **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and real session ID/link. No Auto or silent fallback. If unavailable, STOP. Supported visible UI rename is best effort; report actually performed vs unavailable honestly. A self-attestation is not independent TL UI observation.
- Base actual main **500fbe40c8c8a70a0fe0d291782289f809d5d5b3**, tree **883e72fdab1411968b74dfaf879c4eea46891b9a**, machine mode **NORMAL**. Re-read live state. Never silently substitute a base or overwrite another writer.
- Owner expressly requested several substantial tasks for Trip Workspace/Account/Admin with autonomous ordinary platform actions. This is a finite new R106 batch; R105#999/#1001/#1000/#1002 is fully POST-MERGE PASS and its authors remain STOP. No new Owner confirmation is required for this scoped work.

## 1. Startup and PLAN-only gate

Read JETNITY_START_HERE.md, AGENTS.md, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, current handoff and docs/ACTIVE_WORK_STATUS.md, current#751 and R106#1003, multi-agent planning/operating standards, binding slice precheck/continuity gate, V1 binding build order and DoD, three-phase strategy, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Logic/Continuity sources and actual code/tests. Historical dated status does not override live evidence.

**First delivery is PLAN ONLY:** commit exactly `docs/JETNITY_TRIP_PERSONAL_PREPARATION_WORKFLOW_COMPLETION_1_PLAN_2026-10-25.md`, then post name/model/session, main/head/merge-base/ahead/behind, source-confirmed gaps, design/ownership, state transitions, meaningful proof matrix, costs and unknowns. Seed TASK plus this PLAN must be the **entire diff** at this gate. No product/test implementation yet. **STOP for independent TL plan review.** TL will authorize this same session; no extra Owner question. A dispatch mention does not skip this stop.

## 2. Product outcome and source gap

Complete the existing **Eigene Vorbereitung** workflow: find personal tasks, create/edit title, deliberately set open/done/skipped, understand stale recheck, remove a named task, and recover from pending/errors without losing newer inputs. Search by title and filter **Alle / Offen / Erneut prüfen / Erledigt / Nicht relevant**. Empty list and no matching results are distinct. Keep the personal list compact and consistent with the existing Workspace.

Source: Reisevorbereitung blob03138f5d085f544ebc89d2b734852033f2a0a30e, create157–170 generates a new clientRef per submit and unconditionally clears current title after await; own list340–370 and row517–603 lacks title editing/operation ownership. Existing Readiness guest/server contracts already support title/status update and delete. These are source findings, not yet new browser proof.

## 3. Exclusive runtime/test allowlist and exact integration boundaries

- `components/trips/Reisevorbereitung.tsx`: extract/replace only own kind=preparation list/create UI and necessary props; do not rewrite Official/Ticket/Traveller rendering, shared navigation or their action semantics.
- New `components/trips/EigeneReisevorbereitung.tsx`, `components/trips/usePersonalPreparationLifecycle.ts`, `lib/readiness/personal-preparation-workflow.ts`.
- `components/trips/TripWorkspace.tsx`: only existing Readiness callback types/destructuring/forwarding, additive read-only refresh callback, personal controller hook invocation and forwarding to Reisevorbereitung. The personal operation ledger lives at workspace level, bound to tripId, to survive preparation-mode unmount. No changes to routing/history/modes/rendering/mount semantics, plan/journey/traveller/pilot behavior.
- `components/trips/KontoArbeitsbereich.tsx`: only existing readiness callbacks around172–176/211–215 and additive read-only router.refresh callback. Do not touch bestaetigt/order/pilot/Traveller/Registry.
- `components/trips/GastArbeitsbereich.tsx`: only Readiness callbacks around260–268/287–295 and additive read-only refresh integration. Preserve current draft/graph on refresh failure; do not call erneut() which clears/unmounts them.
- **Narrow additive storage-read exception:** `lib/trips/gastspeicher.ts` may add exactly one exported current-active-V3 **read-only accessor**, taking expected tripId and returning explicit success/missing/invalid/unreadable/wrong-trip outcomes. Reuse its existing private active-key reader, reiseLesen and mitZuordnung; no second production localStorage owner/test-only SCHLUESSEL import. Do not change any existing getter/writer/loader/legacy/queue/migration/storage behavior. This new accessor must perform no setItem/removeItem, legacy read/migration or queue access. T is sole owner; A/O have no storage changes.
- New `lib/readiness/personal-preparation-workflow.test.ts`, `lib/readiness/personal-preparation-workflow-ui.test.ts`, `lib/readiness/personal-preparation-readback.test.ts`.
- Existing `lib/readiness/preparation-identity.test.ts`: only adjust necessary source expectations for the real extracted form; retain existing identity/sibling/retry/limits assertions.

Frozen: readiness actions/gast/bauen/schema/domain/fingerprint/status/ableitung/workspace-presentation; types/trips; all existing storage writer/loader bodies; Official/provider/pilot/reisende/registry code; routing/history/plan/manual-journey contracts; migrations/RLS/Auth/SQL; global styles/config. No due dates, priority/assignee, notifications, bulk writes, task deep link, new traveller/plan assignments or budget/expense product. PreparationZiel navigation stays unchanged.

## 4. Binding data, lifecycle and refresh rules

1. Only own persisted kind=preparation/evidence=user items are writable through the new UI. Official unknown/unavailable remains so even after personal done. Do not alter ticket/entry/stay/other readiness semantics.
2. One clientRef per deliberate create intent, retained on a conscious retry of that same intent; different deliberate equal-title creations have different refs. Edit/delete by ref, never title/index. Synchronous duplicate-intent protection must work before React rerender; a pending intent cannot dispatch again.
3. New points keep kind=preparation,userStatus=open,countryCode=null,tripItemId=null,travellerClientRef=null. Existing context values survive editing. The callback type may add only the already existing optional travellerClientRef field if needed; no new association UI/server schema.
4. Existing80-character and50-persisted-readiness-items-total limits apply, including other kinds. Empty/whitespace and existing sensitive/link/HTML validation remain. Editing an existing point at the limit remains possible. Reuse unchanged validation/normalization rather than inventing a second business rule.
5. Existing readinessSetzen always rebuilds current fingerprint. **A stale done/skipped point's title edit must not silently confirm that old status as current.** Explain recheck in the editor, preselect Open for stale points; Done/Not relevant requires an explicit conscious new selection. Saving confirms the visible personal choice. Never forge/copy fingerprints or upgrade Official truth.
6. Bind each operation to trip/ref/captured payload and editor/draft/request generation. Late A success/failure cannot clear/focus/announce into B; updated props, removed point, filter changes, close/collapse and trip switch are explicit. The workspace-local pending/unknown ledger survives switching preparation→other mode→preparation without changing mount semantics. A full page leave/reload remains a disclosed in-memory-intent limitation; do not add persistent ledger/storage.
7. Action success is not canonical row-readback. Set/create/status is only shown as observed confirmed after actual canonical reise.readinessItems contains matching ref and expected normalized values/context/status; deletion requires observed absence. Preserve distinction between successful action and subsequently observed state. Conflicting/old/missing props are unconfirmed; router.refresh() completion is not a readback certificate.
8. Stable clientRef is identity, **not CAS/idempotency/exactly-once**. Lost response/rejection/unclear outcome keeps intent and draft. First read current state; never auto-resend a mutation. Matching current ref/values may be shown as reconciled current state, not causal proof. Conflicting values require an explained conflict, not old-payload overwrite. Absence after unclear outcome is not proof the original cannot still commit. A deliberate post-read retry retains original ref and explicitly acknowledges uncertain earlier execution.
9. Konto refresh uses existing router.refresh and waits for actual canonical props. Guest refresh uses only the additive current-V3 accessor above. The existing gastArbeitsbereichBeobachten→gastspeicherLaden can invoke legacyUebernehmen and is **not** a pure read; do not use it for this action. Missing/invalid/unreadable/other-trip readback preserves the current draft/graph and blocks retry of an unresolved intent until the situation is made explicit.
10. Guest existing whole-trip write can race across tabs/devices; no expectedVersion/CAS exists server-side. This task improves local UI lifecycle, not multi-tab atomicity. No blanket safety claim.
11. Accessible inline status/errors and named delete confirmation. Focus only the current connected visible target belonging to the active request/editor. Preparation actually unmounts on mode change; do not focus a hidden/collapsed section or reopen it from a late callback.

## 5. Acceptance matrix

Complete create→observe canonical→title edit→status→delete→observe absence through real guest storage seam and controlled Account-action/refresh seam, siblings unchanged. Equal-title distinct points, double activation, retained ref and ambiguous transport rules; A pending while B/new draft changes; mode-away/back with retained unknown/pending intent; trip switch; rejected Promise; failed/old/conflicting readback; read refresh never writes.

Stale done/skipped title edit cannot silently reconfirm; personal done does not change Official unknown; existing context/null preservation;80/81chars,empty/invalid content,50total including other kinds,editing at limit.0/1/50own points,all filters/search/no matches,long/equal titles,status leaves active filter,last-visible delete. Guest accessor: valid/missing/bad JSON/invalid graph/unreadable/wrong-trip; zero setItem/removeItem/legacy/queue touches and no draft loss in every failure.

Use actual mounted components and existing parser/storage/readiness functions with synthetic data. Tests must prove integration of workspace-held intent across preparation unmount, delayed canonical props and focus ownership, not merely a helper model. Include existing Readiness identity/schema/fingerprint/status regressions and unchanged Official/Traveller rendering. Hosted Account/full Next router remain unverified unless separately and legitimately exercised by TL.

## Delivery, independent proof and stop

- Own docs only: `docs/JETNITY_TRIP_PERSONAL_PREPARATION_WORKFLOW_COMPLETION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`. TASK V1 stays byte-identical.
- Own disposable local synthetic harnesses: `scripts/trip-personal-preparation-workflow-completion-1/**`; own new evidence: `docs/evidence/trip-personal-preparation-workflow-completion-1/**`. No deployed test route, personal session/browser or production storage. Preserve prior evidence; do not overwrite an earlier failed run.
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
