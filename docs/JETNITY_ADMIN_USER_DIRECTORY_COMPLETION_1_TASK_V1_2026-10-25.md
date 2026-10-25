# Jetnity Admin User Directory Completion 1 — TASK V1

Date: 2026-10-25. **Immutable Technical-Lead task.** Parent [R107 #1011](https://github.com/Jetnity/jetnity/issues/1011); tracking [#1015](https://github.com/Jetnity/jetnity/issues/1015); lane **D**.

## 1. Authority, baseline and first delivery

Cursor-Agent: **Jetnity Admin User Directory Completion 1 — Cursor Generation 1**. Fresh genuine **Generation 1**, requested **Grok 4.7 High Fast / grok-4.7-high-fast**. No Auto or silent model substitution; if unavailable, STOP and report. Attest actual runtime model, exact session ID/link and logical name. A visible UI rename is best effort and must be reported as actually done or unavailable; no invented independent UI proof.

Branch: `feat/r107-admin-user-directory-1`. Base/current main at dispatch: **a74c443c6be3f064f150fcf021ab6154bda325e5**, tree **c1fe5a50b0da710ef425674057f782b1dff6f8bc**, mode NORMAL. Root verified R106 closure, actual-main CI, Production/direct domain, open work and active strict ruleset 21875372. [Root precheck](https://github.com/Jetnity/jetnity/issues/1011) and [intake](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) are binding.

**FIRST DELIVERY IS PLAN ONLY.** Read this complete TASK and the relevant actual code/contracts. Commit only `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_PLAN_2026-10-25.md` in addition to this immutable TASK. The plan must provide source-confirmed design, exact file ownership, reused contracts, failure/state matrix, proof approach, costs and limits. Post actual main/head/merge-base/ahead/behind, plan link/blob, model/session/name, then **STOP before any implementation, test addition, audit execution or other document changes**. Root will independently review the exact plan head and authorize this same session. This internal TL gate requires no additional Owner confirmation.

Required reading: AGENTS.md; JETNITY_START_HERE.md; Technical-Lead/Cursor Operating Standard; current handoff and ACTIVE_WORK_STATUS; live #751/#1011; three-phase strategy; V1 binding build order; Multi-Agent Slice Planning Standard; relevant existing contracts/tests. Earlier dated pending/current markers are historical snapshots. R106 is completed and must not be reopened.

## 2. Goal and source-confirmed need

Complete the existing /admin/users read/navigation journey: find an account, narrow the current list with existing role/status values, page through bounded results, understand current versus pending results, and recover from bad URLs or read failures.

Source-confirmed gaps: users/page.tsx assumes scalar q/page and uses Math.max(1, Number(page)); malformed/repeated/fractional/infinite/unsafe values can throw or enter invalid range arithmetic. Ordering uses only created_at. Read errors remove the useful toolbar. UsersTable can show Seite 99 / 1 and a false empty explanation; it formats nonempty timestamps without validating them and treats unknown count as ordinary count. Current text-search debounce, own-ack handling and native Back/Forward protections from #608 are accepted behavior and must remain.

This lane improves the **read surface only**. Role/status filters query values already visible under the same authorized directory. They create no role, status, permission or write capability.

## 3. Exclusive allowed files

- app/(admin)/admin/users/page.tsx — validated read-query and result state; same server guard/client/selected columns.
- components/admin/UsersTable.tsx — directory controls, read-state presentation, pagination and safe displayed dates/counts; preserve mutation authority and write handlers.
- lib/admin/users-search-navigation.ts and .test.ts — extend existing URL contract without losing accepted debounce/history behaviors or assertions.
- New optional components/admin/users/UsersDirectory.tsx — small client toolbar/retry shell only if needed, no second directory framework.
- New lib/admin/users-directory-query.ts and .test.ts
- New optional lib/admin/users-directory-presentation.ts and .test.ts
- New lib/admin/users-directory-read.test.ts for meaningful server/query-boundary regressions.
- The lane's named proof/evidence/documentation paths in section 7.

Freeze app/(admin)/admin/users/actions.ts. In UsersTable preserve editable, changeRole, toggleBan, assignable-role handling and action semantics. Do not alter action behavior under the guise of read recovery.

Also frozen: lib/auth/**, role/capability constants, all Auth/AAL/session/identity/RLS and ownership logic; Supabase clients/schema/migrations; lib/admin/ladezustand.ts, components/admin/Ladezustand.tsx, lib/api/datenbank-lesen.ts and suchfilter.ts (reuse them); Admin shell/command palette/System Health/Provider Ops; payment/security mutations; all Trip/Account runtime and global UI/config.

## 4. Required behavior

1. One canonical read-query contract for existing q/page and optional filters for canonical existing role/status values. Handle missing, scalar, repeated, malformed and oversized parameters deliberately. Invalid values must not enter unsafe DB calls.
2. Pages are positive integers within documented safe bounded limits; no NaN/infinity/fractional/unsafe offsets. Retain page size 20; no unbounded export or account-wide prefetch.
3. Same existing profiles fields only: user_id, email, display_name, role, status, created_at, last_seen_at. Same server client and requireAdminPage({surface:'users', capability:'konten-verwalten'}), with capability checks before the query. Redirect/denial cannot be swallowed as ordinary empty data.
4. Text search still uses textSuchfilter and preserves its existing ILIKE matching semantics, including percent/underscore wildcards, with safe PostgREST grammar quoting and correct URL encoding for commas/quotes/Unicode. Do not claim the helper escapes wildcard characters or silently change that shared contract. Role/status filter values come from canonical enums and never broaden access or fabricate a new state.
5. Deterministic created_at plus unique user_id ordering. Count missing/nonfinite/invalid is distinct from zero. Empty account, no match, out-of-range requested page and read failure have distinct states and recovery.
6. Retain controls on recoverable read failure so the operator can alter/clear the committed query or explicitly retry it. Do not relabel old rows/counts as results of newer filters.
7. URL-backed filters/page remain coherent across deep links, reload, Back/Forward and external URL changes. Preserve accepted behavior: no mount-time page reset; genuine debounced text edit resets page only at commit; late own acknowledgment does not overwrite newer input; native history cancels pending intent; page click uses committed query and cancels obsolete text timer.
8. Explicit bounded retry/refresh and pending/current result announcements. Retry is bound to the failed committed query; newer draft/navigation owns later intent. No background polling or duplicate refresh/navigation storm.
9. Out-of-range UI explains the unavailable requested page and offers first/last valid recovery where known. Do not invent max page from missing count or unconditionally rewrite valid deep links on mount.
10. Unknown/malformed dates render an honest unavailable value without RangeError or synthetic now. Preserve existing created-at provenance contract.
11. Read controls never invoke setUserRole/setUserStatus. Existing self/peer-rank/action restrictions remain intact; moving UI must not move authorization into the browser or enable stale-row writes through new logic.
12. Use existing design tokens and responsive rows, accessible labels/announcements and predictable focus. Preserve action controls and scope while improving the read journey.

## 5. Acceptance and evidence

- Meaningful server/query-seam tests for missing/repeated/invalid q/page/filters, NaN/infinity/zero/negative/fraction/huge page, max offset, safe punctuation/Unicode, deterministic tied timestamps and exactly the same selected columns/client/guard.
- Prove invalid requests do not query; authorization/redirect failures remain outside ordinary read-error handling. Count null/undefined/nonfinite differs from zero; malformed/absent timestamps cannot crash or become current time.
- Preserve every existing #608 search/history assertion. Mounted actual production directory with controlled router and read props: valid page-3 deep link/remount, debounce, newer draft before late own acknowledgment, native Back/Forward, external URL, page click during text timer, role/status changes, clearing filters and duplicate input.
- Mounted current/pending/error/empty/out-of-range states retain working controls; retry uses correct query and older results are clearly identified. Verify read interactions invoke no write action.
- Preserve existing role/status authority tests and demonstrate self/peer action rules unchanged.
- Actual project CSS at 320/360/390/768/1280 widths, root text 32px at 320, long names/emails, active filters, pending/error states, keyboard and reduced motion. No hidden-overflow shortcut.
- Synthetic router/query behavior is not full signed-in Next-router or hosted Supabase/RLS proof. Do not access real accounts or private browser to obtain evidence.


## 6. Multi-Agent Suitability and frozen boundaries

Decision: **MULTI_AGENT**. Five independent lanes on one verified main: T traveller snapshot, W World visits, M My Trips collection/archive, D Admin user directory, S dependency advisory triage. This lane owns only its exact allowlist above and its named delivery files. All others are read-only dependencies. Shared contracts do not change silently. If an unlisted file or contract is truly necessary, describe the narrow need to TL and STOP at that boundary; do not alter the TASK yourself.

Integration priority **T → S → D → W → M**. Do not merge or cherry-pick sibling branches. Do not automatically merge/rebase new main into this branch: report drift and wait for the TL's explicit same-session integration instruction. Every new head requires fresh acceptance. Product-facing work must keep existing premium/mobile-first tokens and semantics.

Preserve #985/#982 scoped HOLD, including no retry/rephrase/reroute/substitute review or held-implementation inspection; #917 denied hosted-readback STOP (hosted UNKNOWN, Stage 2 NOT_ATTEMPTED; no alternate query/apply/connector/operator/manual-SQL route); #913/#911 block; #968 legacy Preview cleanup PAUSED; #748 personal-browser/CUA SUSPENDED; #626 STOP; #937/#936 PAUSED; Bern #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant.

No hosted DB operations, schema/migration/RLS/grant changes, Auth/AAL/session/identity expansion, new sensitive passport/MRZ/biometric/health fields, secret/protection modification, provider activation or paid call, payment, contract/legal acceptance, launch/indexing or new paid service. Existing prelaunch/noindex and USD 100 monthly infrastructure boundary remain. Routine repository and synthetic local development operations within this task are authorized. A denied action must not be bypassed.

No edits to global continuity/governance/ROADMAP/DECISIONS/ARCHITECTURE/DESIGN_SYSTEM, package files, lockfiles, workflows, operating mode or broad shared types unless explicitly included above. In this batch none of those global changes is allocated. Root owns consolidated continuity. Findings outside scope are reported with evidence and severity, not silently fixed.

## 7. Implementation/audit deliverables after TL PLAN acceptance

- Only named runtime/proof paths above and this lane's documentation:
  - `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_PLAN_2026-10-25.md`
  - `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_STATUS_2026-10-25.md`
  - `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_REPORT_2026-10-25.md`
  - `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_SELF_REVIEW_2026-10-25.md`
  - `docs/JETNITY_ADMIN_USER_DIRECTORY_COMPLETION_1_HANDOFF_2026-10-25.md`
- Proof runners, if allowed above: `scripts/admin-user-directory-completion-1/**`.
- Sanitized synthetic evidence: `docs/evidence/admin-user-directory-completion-1/**`, with source/head/dirty-state binding, exact commands, exit codes, versions, test totals, stubs, screenshots where relevant, and honest failed/aborted/skipped limits. No real user data, credentials, raw sensitive platform responses, node_modules or reproducible bundle bulk.
- Never relabel pure/source/synthetic/mocked evidence as hosted, authenticated, native-device, full-router, SQL/RLS or Production evidence. A refresh request does not prove causal readback. A local operation guard does not prove atomicity or exactly-once writes.
- Product lanes must run meaningful focused regressions and actual-component interaction/CSS evidence as specified, then ordinary project Typecheck, lint, all five hygiene guards, production build and tests. Existing native App/Auth/Vercel gates are required; do not alter gates or use skipped work as a pass. Record local environment failures honestly. The read-only audit lane runs its specific evidence validation and the normal native docs gates; it does not introduce runtime tests mirroring its report.
- The two established conditional browser skips, 181 existing lint warnings, 11 previously reported untriaged dependency advisories, guest cross-tab non-atomicity and full-unmount limits are existing evidence limits, not new successes or globally accepted security clearance.

## 8. Mandatory STOP and handoff

At the next agreed delivery boundary, push only to the existing assigned branch/PR and report exact main/head/tree/merge-base/ahead/behind, full changed-file list, model/session/name, executed evidence, failed or skipped checks, open P0/P1/P2/P3 findings and remaining limits.

**Do not mark Ready. Do not merge. Do not close tracking issues. Do not write main. Do not start a follow-up slice.** Keep this TASK byte-identical. Self-review is not Technical-Lead PASS. Only root TL makes acceptance/Ready/merge decisions. An immediate CHANGES REQUIRED fix stays with this same original author/session; a changed head invalidates every previous exact-head gate.
