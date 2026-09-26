# Admin Account Counts G16/G17 Streamed State Wait 1

Date: 2026-09-26
Status: IMPLEMENTATION FROZEN FOR INDEPENDENT TL REVIEW / DO NOT READY / DO NOT MERGE
Base: `a82aa92dc9b5f06582e88e21c2e50453042256fa`
Branch: `fix/admin-account-counts-g16-g17-streamed-state-wait-1`

## Trigger

Authorized real Apple-Silicon Mac full acceptance run:
`aaclr1-20260926T204346Z`

Verified durable evidence:
- cleanup PASS:
  - processesStopped=true
  - reaped=true
  - unknown=false
  - ownershipRetained=false
  - dockerServicesStopped=true
  - volumesUnconfirmed=false
  - incompleteRegistry=false
  - exportFailed=false
  - browserClosed=true
  - networkState=ABSENT
  - containerState=ABSENT
  - volumeState=ABSENT
- consumer artifacts exported successfully:
  - browser-flows-gates.json
  - counts-desktop.png
  - counts-mobile.png
- browser gates:
  - G6 PASS
  - G7 PASS
  - G8 PASS
  - G9 PASS
  - G10 PASS
  - G11 PASS
  - G12 PASS
  - G13 PASS
  - G14 PASS
  - G15 PASS
  - G16 FAIL: `generic unknown page cannot become a denial PASS`
  - G17 FAIL: `generic unknown page cannot become a denial PASS`
  - G18 PASS
  - G19 PASS
- matrix: 19 PASS / 2 FAIL / no BLOCKED / no UNKNOWN
- overall verdict: FAIL, fullLocalExecution=false.

## Product truth already inspected

Current product source on main:
- `app/(admin)/admin/page.tsx` renders `AdminAccountCounts` within the normal /admin shell.
- `components/admin/home/AdminAccountCounts.tsx`:
  - forbidden copy:
    `Für diese Kontenzahlen fehlt eine rollengebundene Berechtigung „konten-verwalten“ mit aktueller AAL2. Notzugang über die Oberfläche reicht nicht.`
  - unavailable copy:
    `Die lokale Zählfunktion ist in dieser Umgebung nicht vorhanden. Das ist keine leere Statistik.`
- `lib/admin/account-counts-delivery/reader.ts`:
  - non-active caller status => forbidden
  - missing RPC function => unavailable
- G16 mutates caller status, then navigates to /admin.
- G17 removes wrapper, then navigates to /admin.

These two states are rendered by the async `AdminAccountCounts` server component while the page remains on /admin.

## Independently verified harness asymmetry

- G16/G17 navigate with `waitUntil: 'domcontentloaded'` and immediately call denial classification.
- G9/G11 already use an explicit settle step before asserting async account-count state.
- G15 passes because its role downgrade can be expressed by page-level admin denial/redirect and does not depend on the nested async count component settling.

Therefore an immediate /admin body read can observe the generic shell or an intermediate streamed state before the exact forbidden/unavailable copy is committed.

## Goal

Wait for the exact source-backed terminal Account-Counts UI state for G16 and G17 before classification, while preserving fail-closed behavior.

## Required design

1. Add a narrowly scoped helper for waiting on one of the expected Account-Counts terminal states after /admin navigation.
2. For G16, wait only for the exact current forbidden state.
3. For G17, wait only for the exact current unavailable state.
4. The wait must be bounded by the existing run/action budget and AbortSignal.
5. PASS still requires the existing `assertNoCountDisclosure` / `assertUnavailableNotZero` checks after the wait.
6. The helper must fail if:
   - expected copy never appears;
   - available aggregate values appear instead;
   - failed/error copy appears;
   - wrong origin/path appears;
   - navigation response is not ready;
   - signal aborts;
   - timeout expires.
7. Do not classify generic shell/intermediate streamed UI as denial PASS.
8. Do not use arbitrary sleeps as proof. Polling may be used only to observe a deterministic exact product state.
9. Reuse exact product copy/constants already pinned by the harness. Do not broaden text matching.
10. Do not weaken G13/G14/G15 denial logic.
11. Do not change product code.
12. Do not change G16/G17 fixture semantics or expected outcomes.

## Preferred implementation shape

A helper such as:
- `waitForAccountCountsTerminalState(page, { kind, expectedOrigin, response, timing })`

may:
- optionally use the existing bounded `waitForRequestsToSettle`;
- then poll/classify within the same action budget until the exact requested state is observed;
- abort immediately on an explicit wrong/failure/disclosure state.

The implementation must not convert unknown/intermediate state directly to PASS.

## Required tests

At minimum:
1. G16 intermediate /admin shell -> later exact forbidden => PASS.
2. G17 intermediate /admin shell -> later exact unavailable => PASS.
3. forbidden requested but unavailable arrives => FAIL.
4. unavailable requested but forbidden arrives => FAIL.
5. available aggregate values appear during wait => FAIL immediately.
6. failed copy appears => FAIL.
7. wrong origin/path => FAIL.
8. timeout with only generic shell => FAIL / ownership-safe bounded error.
9. AbortSignal => FAIL.
10. G15 existing redirect/denial semantics remain unchanged.
11. G18/G19 unaffected.
12. entire browser-flow controlled suite remains green.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`
- `scripts/e2e/admin-account-counts-browser-flows-1/counts.mjs`
- `scripts/e2e/admin-account-counts-browser-flows-1/observer.mjs` only if a tiny reusable settle helper adjustment is strictly necessary
- `scripts/e2e/admin-account-counts-browser-flows-1/test.mjs`
- own STATUS/HANDOFF/SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`

Forbidden:
- product code
- Docker cleanup
- npm/cache/canonicalization
- SQL/migrations/RLS/Auth policy
- root dependencies/CI
- Production/hosted changes

## Agent

Logical name: **Jetnity admin account counts G16 G17 streamed state wait 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
